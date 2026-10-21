import { test } from "node:test";
import assert from "node:assert/strict";
import { todayISO, formatShort, reminderDate } from "../src/utils/date.ts";
process.env.TZ = "America/Fortaleza";
test("data brasileira à noite não vira amanhã por UTC", () => {
  assert.equal(todayISO(new Date("2026-10-19T01:30:00Z")), "2026-10-18");
});
test("formatação não desloca datas nem usa conversão UTC", () => {
  assert.equal(formatShort("2026-01-01"), "01/01");
  assert.equal(formatShort(null), "—");
});
test("rega de hoje antes do horário agenda hoje", () => {
  const now = new Date(2026, 9, 18, 7, 0);
  assert.equal(
    reminderDate("2026-10-18", 8, 0, now).getTime(),
    new Date(2026, 9, 18, 8, 0).getTime(),
  );
});
test("atrasada após o horário agenda uma vez amanhã", () => {
  const now = new Date(2026, 9, 18, 9, 0);
  assert.equal(
    reminderDate("2026-10-01", 8, 0, now).getTime(),
    new Date(2026, 9, 19, 8, 0).getTime(),
  );
});
test("atrasada antes do horário agenda hoje e preserva minutos", () => {
  const now = new Date(2026, 9, 18, 7, 0);
  assert.equal(
    reminderDate("2026-10-01", 8, 15, now).getTime(),
    new Date(2026, 9, 18, 8, 15).getTime(),
  );
});
test("data futura preserva o dia informado pelo backend", () => {
  const now = new Date(2026, 9, 18, 9, 0);
  assert.equal(
    reminderDate("2026-11-01", 8, 0, now).getTime(),
    new Date(2026, 10, 1, 8, 0).getTime(),
  );
});
