import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { readFile, writeFile, mkdir, rm } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
import ts from "typescript";

// Executa os mesmos serviços HTTP usados pelas telas, sem simular a API.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const base = process.env.API_TEST_URL;
if (!base)
  throw new Error(
    "Defina API_TEST_URL com a URL do backend de teste, incluindo /api.",
  );
process.env.EXPO_PUBLIC_API_URL = base;
const directory = path.join(root, `.api-contract-${randomUUID()}`);
const sources = ["api", "authService", "plantService", "categoryService"];
const hashes = {};
const checks = [];
function pass(name) {
  checks.push(name);
  process.stdout.write(`OK ${name}\n`);
}
await mkdir(directory);
try {
  for (const name of sources) {
    const source = await readFile(
      path.join(root, "src", "services", `${name}.ts`),
      "utf8",
    );
    hashes[`${name}.ts`] = createHash("sha256").update(source).digest("hex");
    const { outputText } = ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2022,
      },
    });
    await writeFile(
      path.join(directory, `${name}.mjs`),
      outputText
        .replaceAll('"./api"', '"./api.mjs"')
        .replaceAll("'./api'", "'./api.mjs'"),
    );
  }
  const { api, setSessionToken, onUnauthorized } = await import(
    pathToFileURL(path.join(directory, "api.mjs"))
  );
  const { authService } = await import(
    pathToFileURL(path.join(directory, "authService.mjs"))
  );
  const { plantService } = await import(
    pathToFileURL(path.join(directory, "plantService.mjs"))
  );
  const { categoryService } = await import(
    pathToFileURL(path.join(directory, "categoryService.mjs"))
  );
  const suffix = randomUUID();
  const password = `Teste-${suffix}`;
  let expired = 0;
  onUnauthorized(async () => {
    expired++;
    setSessionToken(null);
  });
  const accountA = await authService.register(
    "Teste contrato A",
    `a-${suffix}@example.com`,
    password,
  );
  assert.equal(typeof accountA.token, "string");
  assert.deepEqual(Object.keys(accountA.user).sort(), ["email", "id", "name"]);
  setSessionToken(accountA.token);
  assert.equal((await authService.me()).id, accountA.user.id);
  const login = await authService.login(accountA.user.email, password);
  assert.equal(login.user.id, accountA.user.id);
  pass("cadastro, login e /auth/me com os serviços do mobile");

  const category = await categoryService.create(`Interior ${suffix}`);
  const payload = {
    name: "Monstera contrato",
    species: "Monstera deliciosa",
    location: "Sala",
    wateringFrequency: 7,
    lastWatering: null,
    sunlight: "Luz indireta",
    notes: null,
    imageUrl: null,
    categoryId: category.id,
    outdoor: true,
  };
  let plant = await plantService.create(payload);
  const fields = [
    "id",
    "name",
    "species",
    "location",
    "wateringFrequency",
    "lastWatering",
    "nextWatering",
    "wateringStatus",
    "sunlight",
    "notes",
    "imageUrl",
    "categoryId",
    "categoryName",
    "outdoor",
  ];
  assert.deepEqual(Object.keys(plant).sort(), fields.sort());
  assert.equal(plant.outdoor, true);
  assert.equal(plant.wateringStatus, "NOT_SET");
  assert.equal((await plantService.get(plant.id)).categoryId, category.id);
  assert.equal(
    (await plantService.list({ name: "monstera", categoryId: category.id }))
      .length,
    1,
  );
  assert.equal((await plantService.dashboard()).totalPlants, 1);
  assert.equal((await categoryService.list())[0].plantCount, 1);
  pass("DTOs, outdoor, busca combinada, contadores e dashboard");

  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Recife",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  plant = await plantService.update(plant.id, {
    ...payload,
    lastWatering: today,
  });
  assert.equal(plant.lastWatering, today);
  assert.equal(plant.wateringStatus, "UPCOMING");
  await categoryService.update(category.id, `Folhagens ${suffix}`);
  assert.equal(
    (await plantService.get(plant.id)).categoryName,
    `Folhagens ${suffix}`,
  );
  await assert.rejects(
    categoryService.remove(category.id),
    (error) =>
      error.response?.status === 400 &&
      typeof error.response.data.message === "string",
  );
  pass("Reguei por PUT, edição e bloqueio de categoria com plantas");

  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZQmcAAAAASUVORK5CYII=",
    "base64",
  );
  const upload = async (content, type = "image/png") => {
    const body = new FormData();
    body.append("file", new Blob([content], { type }), "foto.png");
    return (await api.post(`/plants/${plant.id}/photo`, body)).data;
  };
  plant = await upload(png);
  const oldUrl = plant.imageUrl;
  assert.ok(oldUrl.startsWith(`${new URL(base).origin}/uploads/`));
  assert.equal((await fetch(oldUrl)).status, 200);
  assert.equal((await plantService.get(plant.id)).imageUrl, oldUrl);
  plant = await upload(png);
  assert.notEqual(plant.imageUrl, oldUrl);
  assert.equal((await fetch(oldUrl)).status, 404);
  await assert.rejects(
    upload("not an image", "image/jpeg"),
    (error) =>
      error.response?.status === 400 &&
      typeof error.response.data.message === "string",
  );
  await assert.rejects(
    upload(new Uint8Array(5 * 1024 * 1024 + 1)),
    (error) =>
      error.response?.status === 400 &&
      typeof error.response.data.message === "string",
  );
  assert.equal((await plantService.get(plant.id)).imageUrl, plant.imageUrl);
  pass(
    "multipart real, URL absoluta pública, persistência, substituição e limite de 5 MB",
  );

  setSessionToken(null);
  const accountB = await authService.register(
    "Teste contrato B",
    `b-${suffix}@example.com`,
    password,
  );
  setSessionToken(accountB.token);
  assert.equal((await plantService.list()).length, 0);
  assert.equal((await plantService.dashboard()).totalPlants, 0);
  for (const action of [
    () => plantService.get(plant.id),
    () => plantService.update(plant.id, payload),
    () => plantService.remove(plant.id),
    () => categoryService.update(category.id, "Invadida"),
    () => categoryService.remove(category.id),
    () => plantService.create(payload),
    () => upload(png),
  ]) {
    await assert.rejects(
      action(),
      (error) =>
        error.response?.status === 404 &&
        typeof error.response.data.message === "string",
    );
  }
  pass(
    "isolamento de duas contas e 404 em leitura, escrita, associação e foto alheias",
  );

  setSessionToken(accountA.token);
  await plantService.remove(plant.id);
  assert.equal((await fetch(plant.imageUrl)).status, 404);
  await categoryService.remove(category.id);
  assert.equal((await plantService.list()).length, 0);
  pass("exclusão remove arquivo e libera categoria");
  setSessionToken("token-invalido");
  await assert.rejects(
    authService.me(),
    (error) => error.response?.status === 401,
  );
  assert.equal(expired, 1);
  pass("401 executa a limpeza de sessão pelo interceptor do mobile");
  if (process.env.API_TEST_REPORT)
    await writeFile(
      process.env.API_TEST_REPORT,
      JSON.stringify(
        {
          passed: checks.length,
          checks,
          serviceHashes: hashes,
          transport: "HTTP real",
          backend: base,
        },
        null,
        2,
      ),
    );
  process.stdout.write(`${checks.length} grupos de verificações passaram.\n`);
} finally {
  await rm(directory, { recursive: true, force: true });
}
