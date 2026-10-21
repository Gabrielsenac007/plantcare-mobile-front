# PlantCare Backend — API para o aplicativo mobile

## 1. Sobre e estado da entrega

Backend Java 21 / Spring Boot **4.0.0**, evoluído a partir do projeto fornecido. Implementa usuários, autenticação JWT/BCrypt, dados separados por conta, CRUD de plantas e categorias, painel, campo `outdoor` e upload real de fotos.

O contrato JSON é o mesmo usado pelos serviços do PlantCare Mobile incluído no pacote. Não há push remoto nem agendador no servidor: lembretes são notificações locais do Expo Go.

## 2. Tecnologias e compatibilidade

Spring Web, Data JPA, Validation, Security e OAuth2 Resource Server, MySQL e Maven. Spring Security e Nimbus JOSE são resolvidos pelo gerenciamento de dependências do Spring Boot 4.0.0; não foram misturadas versões de Security de outro Boot. O encoder e o filtro Bearer oficiais validam o JWT. Jackson 3 (`tools.jackson`) acompanha o Boot 4.

Springdoc 3.1.0 foi preservado do projeto original. Swagger e `/v3/api-docs` também exigem autenticação, como as demais rotas não públicas. H2 é usado apenas no perfil de testes, sem substituir o MySQL da execução normal.

## 3. Execução rápida — Windows

Pré-requisitos: JDK 21 com `JAVA_HOME` correto e MySQL 8 em execução. Node é necessário apenas para o mobile. Maven Wrapper está incluído; não é necessário instalar Maven globalmente. O primeiro uso baixa a distribuição e dependências, portanto precisa de internet.

Na pasta `plantcare-backend`:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\configure.ps1
notepad .\config\application-local.properties
```

O primeiro comando gera um segredo JWT aleatório, sem exibi-lo, e cria o arquivo local somente se ele ainda não existir. Edite usuário e senha do MySQL e, se necessário, o endereço do banco. O `Bypass` acima vale apenas para esse processo PowerShell, sem alterar a política permanente.

Depois:

```powershell
.\mvnw.cmd clean test
.\mvnw.cmd spring-boot:run
```

A API abre em `http://localhost:8080/api`. No celular, use o IP do computador. O servidor escuta em `0.0.0.0` por padrão.

## 4. Execução — Linux/macOS

Na pasta do backend:

```bash
bash scripts/configure.sh
```

O script usa Bash e OpenSSL. Edite `config/application-local.properties`, depois:

```bash
chmod +x mvnw
./mvnw clean test
./mvnw spring-boot:run
```

Se preferir configurar manualmente, copie `config/application-local.properties.example` para `config/application-local.properties`. Para gerar o segredo:

```bash
openssl rand -base64 32
```

No PowerShell, uma alternativa manual é gerar 32 bytes com `RandomNumberGenerator` e converter para Base64, como faz o script incluído. Nunca reutilize o mesmo segredo de outro projeto.

## 5. Configuração

`application.properties` lê variáveis de ambiente e importa opcionalmente `config/application-local.properties`, relativo à pasta de execução. O arquivo local real é ignorado pelo Git e não faz parte desta entrega. Não há senha de banco nem segredo JWT fixos no código.

| Variável | Padrão / finalidade |
|---|---|
| `DB_URL` | `jdbc:mysql://localhost:3306/plantcare_mobile?createDatabaseIfNotExist=true&connectionTimeZone=America/Recife` |
| `DB_USER` | `root`; ajuste para seu usuário local |
| `DB_PASSWORD` | vazio; configure sua senha real |
| `JWT_SECRET` | obrigatório: Base64 de pelo menos 32 bytes aleatórios |
| `JWT_TTL` | `P7D` (sete dias), Duration ISO-8601, deve ser positivo |
| `APP_TIME_ZONE` | `America/Recife` |
| `UPLOAD_DIR` | `./uploads` |
| `PORT` | `8080` |
| `SERVER_ADDRESS` | `0.0.0.0` |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:3000,http://localhost:5173` |
| `DDL_AUTO` | `update`; não use para migrar o schema antigo diretamente |

O arquivo local usa nomes completos, como `spring.datasource.password`, `app.jwt.secret` e `app.jwt.ttl`. Se usar simultaneamente arquivo local e variáveis com aliases (`DB_PASSWORD`, `JWT_SECRET`), o valor explícito no arquivo local pode prevalecer sobre o placeholder. Escolha uma forma e evite configurações duplicadas. Para executar somente com variáveis, deixe de criar/remova o arquivo local (depois de guardar sua configuração).

Se o usuário MySQL não pode criar bancos, crie `plantcare_mobile` previamente e conceda acesso a ele. Se precisar mudar o banco, faça isso no JDBC configurado. Backups de dados e da pasta uploads devem ser feitos juntos.

## 6. Banco antigo e migração

O banco padrão passou de `plantcare` para **`plantcare_mobile`**. Isso cria uma base nova para o novo modelo e preserva a original. Não foi introduzido DROP/TRUNCATE automático. Não aponte `ddl-auto=update` diretamente para o banco antigo preenchido: ele não remove o antigo índice único global nem atribui proprietários aos registros.

Para demonstração sem aproveitar dados antigos: mantenha o banco novo, cadastre uma conta no app e crie categorias e plantas.

Para copiar dados antigos:

1. Faça backup dos dois bancos.
2. Inicie o backend novo uma vez e cadastre a conta que será dona dos registros importados.
3. Mantenha o destino sem plantas e categorias; pause o uso do aplicativo durante a cópia.
4. Leia `scripts/import-legacy.sql`, ajuste o e-mail e os nomes de banco se necessário.
5. Execute o script com um cliente MySQL com acesso aos dois schemas.

O script copia `plantcare.categories` e `plantcare.plants` para o modelo novo, preserva IDs, normaliza nomes, atribui o usuário e define `outdoor=false`. A origem não é alterada. Ele exige destino vazio, recusa usuário inexistente e faz rollback em falha. URLs antigas são preservadas como referências externas; não são tratadas como arquivos locais gerenciados. Se uma execução falhar antes do DROP final da procedure, remova somente `import_plantcare_legacy` antes de tentar novamente. Não execute a cópia enquanto outras pessoas cadastram registros no destino.

O importador não é executado ao iniciar o servidor. Uma cópia em MySQL foi validada com schema representativo do projeto original; veja o relatório de validação do pacote.

## 7. Modelo e arquitetura

Controller → Service → Repository → MySQL.

- `User` → tabela `users`: id, name, email, password (BCrypt), createdAt.
- `Category` → `categories`: id, name, normalizedName, user. Índice único `(user_id, normalized_name)`.
- `Plant` → `plants`: campos originais, category, user, outdoor e photoFileName interno.
- Relações: User 1:N Category; User 1:N Plant; Category 1:N Plant.

DTOs não expõem o hash, o nome interno do arquivo ou a entidade User. O usuário autenticado vem do contexto de segurança. Todas as operações em plantas/categorias usam consultas com ID do dono; um ID de outra conta responde **404**. A categoria atribuída a uma planta também deve ser do dono. Contagens e dashboard são filtrados por usuário.

## 8. Autenticação

### Cadastro

`POST /api/auth/register`, público:

```json
{"name":"Pessoa de Teste","email":"teste@example.com","password":"senha-teste-123"}
```

Retorna 201:

```json
{"token":"JWT_ASSINADO","user":{"id":1,"name":"Pessoa de Teste","email":"teste@example.com"}}
```

### Login

`POST /api/auth/login`, público, body `{email,password}`; retorna 200 com o mesmo formato. E-mail é normalizado para minúsculas; duplicidade no cadastro retorna 409. Senha não é aparada nem modificada. Nome obrigatório, e-mail válido e senha de pelo menos seis caracteres. O limite de 72 bytes UTF-8 do BCrypt é validado com erro claro, sem truncar senhas.

### Sessão

`GET /api/auth/me` requer `Authorization: Bearer <token>` e retorna somente `{id,name,email}`. Demais operações autenticadas usam esse cabeçalho.

JWT assinado com HS256, emissor `plantcare`, subject com ID do usuário, iat, exp e jti. O segredo vem de configuração; tokens expirados, adulterados ou com emissor diferente são rejeitados. Segurança stateless, sem formulário ou sessão HTTP. Não há refresh token nem logout de servidor: o mobile remove o token local; ele continua válido até expirar, como esperado nesse modelo simples. Trocar o segredo invalida os tokens existentes.

Sem token ou com token inválido: 401 em JSON ApiError. Credenciais inválidas: 401, sem revelar se o e-mail existe. Público: POST login/register e GET/HEAD de `/uploads/**`; preflight CORS é permitido. O restante exige autenticação.

## 9. Endpoints

| Método | Endpoint | Retorno |
|---|---|---|
| POST | `/api/auth/register` | 201 AuthResponse |
| POST | `/api/auth/login` | 200 AuthResponse |
| GET | `/api/auth/me` | 200 UserResponse |
| GET | `/api/categories` | CategoryResponse[] |
| POST | `/api/categories` | 201 CategoryResponse |
| GET | `/api/categories/{id}` | CategoryResponse |
| PUT | `/api/categories/{id}` | CategoryResponse |
| DELETE | `/api/categories/{id}` | 204 |
| GET | `/api/plants?name=&categoryId=` | PlantResponse[] |
| POST | `/api/plants` | 201 PlantResponse |
| GET | `/api/plants/{id}` | PlantResponse |
| PUT | `/api/plants/{id}` | PlantResponse |
| DELETE | `/api/plants/{id}` | 204 |
| GET | `/api/plants/dashboard` | DashboardResponse |
| POST | `/api/plants/{id}/photo` | PlantResponse |
| GET/HEAD | `/uploads/{nome}` | arquivo público |

Atualizar é PUT com todos os campos da planta, como já faz `toRequest` no mobile. Categorias usam body `{name}`. Categoria ocupada não pode ser excluída e retorna 400; nome duplicado na mesma conta retorna 409. Mesmo nome em contas distintas é permitido.

## 10. PlantRequest e PlantResponse

Criar/editar:

```json
{
  "name":"Monstera",
  "species":"Monstera deliciosa",
  "location":"Sala",
  "wateringFrequency":7,
  "lastWatering":null,
  "sunlight":"Luz indireta",
  "notes":null,
  "imageUrl":null,
  "categoryId":1,
  "outdoor":true
}
```

Resposta contém esses campos, substitui `categoryId` pelo mesmo ID numérico e acrescenta `id`, `categoryName`, `nextWatering` e `wateringStatus`. O campo `outdoor` sempre retorna boolean. Omiti-lo no request equivale a false, permitindo compatibilidade de payload com o frontend antigo; o antigo ainda precisa de login/Bearer para acessar rotas protegidas.

Nome, espécie e local: até 100 caracteres; iluminação: 50; notas e URL: 500. Nome e categoria obrigatórios. Frequência inteira entre 1 e 365; última rega opcional e nunca futura. O app foi ajustado aos mesmos limites de texto.

`nextWatering = lastWatering + wateringFrequency`. Sem data: NOT_SET; anterior a hoje: OVERDUE; hoje: DUE_TODAY; futura: UPCOMING. O Clock e a validação `@PastOrPresent` usam `APP_TIME_ZONE`. O mobile envia a data local no botão Reguei, sem converter para UTC.

Dashboard: `{totalPlants,plantsToWaterToday,overduePlants,totalCategories,wateringToday,overdue}`. O servidor não muda rega com base no clima: a regra de chuva é uma orientação visual no cliente.

## 11. Fotos

`POST /api/plants/{id}/photo`, multipart no campo **file**, com Bearer. Exemplo de terminal:

```bash
curl -X POST http://localhost:8080/api/plants/1/photo -H "Authorization: Bearer TOKEN" -F "file=@foto.jpg;type=image/jpeg"
```

Aceita JPEG, PNG e WebP, até **5 × 1024 × 1024 bytes**. Arquivo vazio, MIME não aceito, assinatura incompatível e tamanho excessivo retornam 400 com `message`. Os cabeçalhos dos formatos são conferidos; não há transformação/recompressão no servidor. O nome original é ignorado. O armazenamento usa UUID e extensão do tipo aceito.

A resposta retorna a planta atualizada com URL absoluta montada a partir do host/porta da requisição, por exemplo `http://192.168.0.10:8080/uploads/<uuid>.jpg`. Acesso direto pela LAN preserva o IP usado pelo app. Forwarded headers não são aceitos automaticamente; se implantar atrás de proxy, configure explicitamente proxies confiáveis antes de alterar essa política.

Troca/exclusão usam lock da planta e transação. O arquivo anterior é removido somente após commit; rollback remove o arquivo novo. Ao excluir a planta, o arquivo associado é removido após commit. Se a limpeza no disco falhar, o servidor registra aviso para manutenção, sem desfazer uma exclusão já confirmada. Somente `photoFileName` interno de arquivo gerenciado é removido; URLs externas nunca são buscadas ou apagadas pelo servidor.

Arquivos são públicos por URL, conforme o requisito do prompt, sem exigir token para o componente Image do app. A pasta deve ser preservada entre reinícios. A planta nova é criada antes do upload: se a foto falha, a planta fica criada e o mobile oferece reenvio, sem duplicar cadastro.

## 12. Erros

Formato comum, inclusive no filtro de segurança e em limites multipart:

```json
{"timestamp":"2026-10-18T17:00:00Z","status":400,"message":"A foto deve ter no máximo 5 MB.","errors":{}}
```

Validações incluem `errors` por campo e uma `message` utilizável diretamente pelo mobile. ID ausente/alheio: 404; conflitos: 409; sem sessão: 401. Exceções internas de armazenamento não retornam paths, segredo ou stack trace para o cliente.

## 13. CORS e rede local

Origens originais preservadas: `http://localhost:3000` e `http://localhost:5173`. Métodos e cabeçalhos Authorization/Content-Type permitidos no preflight. Outras origens web devem ser adicionadas por configuração. Apps nativos não dependem de CORS.

Celular e computador precisam estar na mesma rede e alcançar a porta 8080; liberar no firewall da rede privada se necessário. `EXPO_PUBLIC_API_URL` no mobile recebe o IP, por exemplo `http://192.168.0.10:8080/api`. `localhost` no celular aponta para o próprio celular; emulador Android padrão usa `10.0.2.2`. O túnel do Expo não expõe o backend.

## 14. Testes

```bash
./mvnw clean test
./mvnw clean package
```

No Windows use `mvnw.cmd`. O teste usa H2 em modo MySQL e chave JWT aleatória, sem precisar de MySQL, segredo de produção ou arquivo local. A suíte passa pelo filtro real de segurança e cobre autenticação, BCrypt, isolamento de duas contas, CRUD, filtros, validação de datas, dashboard, CORS, fotos, formatos e rollback de arquivos.

Também há teste HTTP contra o backend real, usando os fontes dos serviços do mobile, em `../plantcare-mobile/scripts/test-api.mjs`:

```bash
cd ../plantcare-mobile
npm ci
API_TEST_URL=http://localhost:8080/api npm run test:api
```

PowerShell:

```powershell
$env:API_TEST_URL="http://localhost:8080/api"
npm run test:api
```

Esse teste cria contas com e-mails únicos de teste e remove as plantas/categorias que criou quando termina com sucesso. As contas permanecem porque não existe endpoint de exclusão de usuário. Execute em banco de desenvolvimento. Ele transpila e importa os mesmos serviços HTTP das telas, verifica contratos, multipart, arquivo público e interceptor de 401; não simula o backend. Recursos de câmera, localização e notificações precisam do teste manual em Expo Go.

## 15. Estrutura e arquivos

```text
src/main/java/com/plantcare/
  config/       Clock, validação e arquivos estáticos
  controller/   AuthController, PlantController, CategoryController
  dto/          auth, plant, category, dashboard
  entity/       User, Plant, Category
  exception/    ApiError e handlers
  repository/   consultas por usuário
  security/     SecurityConfig e CurrentUser
  service/      AuthService, PlantService, CategoryService, PhotoStorageService
src/main/resources/application.properties
src/test/       testes de integração e fotos de teste
config/         modelo de configuração local
scripts/        configuração e cópia opcional de dados antigos
mvnw, mvnw.cmd, .mvn/wrapper/
```

O manifesto `docs/ARQUIVOS-ALTERADOS.md` lista arquivos novos e alterados comparados ao ZIP original. Os arquivos entregues contêm o código integral, não patches ou trechos omitidos.

## 16. Build e execução como JAR

```bash
./mvnw clean package
java -jar target/plantcare-0.0.1-SNAPSHOT.jar
```

Execute a partir da pasta do backend para carregar `config/application-local.properties` e manter o caminho relativo de uploads. O JAR é gerado localmente; o pacote entregue contém todos os fontes, configuração, dependências declaradas e wrapper, sem `target` ou credenciais.

## 17. Roteiro de demonstração

1. Suba MySQL e backend, configure a URL do mobile e abra o QR no Expo Go.
2. Cadastre A, crie categoria e planta; edite e use Reguei.
3. Fotografe ou selecione imagem; salve e reabra app/backend para conferir persistência.
4. Teste categoria ocupada, erro de upload e reenvio.
5. Saia, cadastre B e confirme ausência dos dados de A; o teste automatizado também verifica IDs alheios com 404.
6. Ative lembretes e clima no aparelho, teste permissões e toque de notificação.
7. Carregue listas, desligue rede e confira cache/aviso; reative e atualize.

## 18. Referências

- [Spring Security — JWT Resource Server](https://docs.spring.io/spring-security/reference/servlet/oauth2/resource-server/jwt.html)
- [NimbusJwtEncoder — Security 7](https://docs.spring.io/spring-security/reference/7.0/api/java/org/springframework/security/oauth2/jwt/NimbusJwtEncoder.html)
- [Spring Boot 4 — testes MVC](https://docs.spring.io/spring-boot/4.0/api/java/org/springframework/boot/webmvc/test/autoconfigure/package-summary.html)
- [Validação e ClockProvider](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/validation/beanvalidation/LocalValidatorFactoryBean.html)
- [Springdoc — compatibilidade 3.x/Boot 4](https://springdoc.org/faq.html)
