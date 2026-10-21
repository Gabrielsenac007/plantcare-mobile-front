# PlantCare Mobile — Documentação

## 1. Sobre

O PlantCare organiza plantas por categoria e acompanha suas regas. A versão mobile adapta o frontend web fornecido para React Native, preservando sua paleta, os campos e as regras de rega. Inclui autenticação, fotos, lembretes locais, localização e clima.

**Estado:** mobile e backend implementados. O backend recebido foi evoluído mantendo Java 21/Spring Boot 4.0.0 e seus DTOs. Testes de contrato executam os mesmos serviços HTTP deste app contra o servidor real com MySQL. Tipos, lint, testes e bundles são verificados; teste em aparelho físico não é presumido por esses resultados. Veja o relatório de validação.

## 2. Tecnologias

Projeto criado com `npx create-expo-app@latest plantcare-mobile --template default --yes`. O template original foi ajustado para Expo SDK 57, com React Native 0.86 e React 19.2.3, para corresponder ao Expo Go 57 informado pelo grupo. Consulte `package.json` e `package-lock.json` para as versões exatas. Não troque versões isoladamente.

| Camada | Tecnologia |
|---|---|
| Interface | React Native, TypeScript estrito, StyleSheet |
| Navegação | Expo Router, abas e pilha protegidas |
| HTTP | Axios com token em memória e tratamento centralizado |
| Sessão | Context e expo-secure-store |
| Cache | AsyncStorage, chaves por ID do usuário |
| Foto | expo-image-picker, expo-file-system (File, Directory e Paths) |
| Lembretes | expo-notifications, exclusivamente notificações locais |
| Localização | expo-location, somente primeiro plano |
| Datas | @react-native-community/datetimepicker |
| Visual | react-native-svg, @expo/vector-icons, Nunito via expo-font |
| Feedback | react-native-toast-message |

As dependências foram instaladas por `npx expo install`. Não há Redux, Zustand ou React Query: Context cuida da sessão; hooks por tela cuidam de leitura e estado, suficientes para duas entidades.

## 3. Telas e navegação

| Tela | Rota | Comportamento |
|---|---|---|
| Login | `(auth)/login` | E-mail, senha, mostrar/ocultar, erros da API |
| Cadastro | `(auth)/register` | Nome, e-mail, senha, confirmação; inicia sessão |
| Início | `(tabs)/index` | Saudação, quatro contadores, clima e regas |
| Plantas | `(tabs)/plants` | Busca de 300 ms, filtro e cards responsivos |
| Categorias | `(tabs)/categories` | Adicionar, editar em linha e excluir com confirmação |
| Ajustes | `(tabs)/settings` | Sessão, lembretes, horário, clima e sobre |
| Detalhe | `plant/[id]` | Foto, dados, reguei, editar, excluir e reenviar foto |
| Formulário | `plant/form?id=` | Mesmo componente para criação e edição, como modal |

As quatro abas têm ícone e rótulo. Pilha e abas são protegidas pela sessão. Enquanto o token é validado, há carregamento; uma falha de rede permite tentar novamente, sem apagar automaticamente o token. Token recusado pela API encerra a sessão. Ao reabrir offline, a validação de `/auth/me` precisa de conexão; caches ficam disponíveis ao perder a rede com a sessão já aberta.

Após salvar, o detalhe é aberto e atualizado. Listas recarregam ao ganhar foco. O retorno Android é tratado pelo navegador. Uma notificação abre o detalhe da planta; o backend continua responsável pela autorização desse ID.

## 4. Estrutura

```text
app/
  _layout.tsx
  index.tsx
  (auth)/_layout.tsx, login.tsx, register.tsx
  (tabs)/_layout.tsx, index.tsx, plants.tsx, categories.tsx, settings.tsx
  plant/[id].tsx, form.tsx
src/
  components/  AuthForm, PlantForm, PlantCard, WeatherCard, Logo, ui
  contexts/    AuthContext
  hooks/       useDebounce, useResponsiveColumns, useNetworkAwareLoad
  services/    api, authService, plantService, categoryService, cache,
               preferences, photoService, locationService, weatherService,
               notificationService, refreshService
  theme/       colors, spacing, typography
  types/       DTOs
  utils/       date, plant
tests/         testes de datas e agenda
docs/          análise, contrato do backend, checklist e validação
```

## 5. Fluxo de dados e padrões

Tela → serviço tipado → Axios → API Spring Boot → MySQL. Componentes recebem dados e ações. `PlantForm` é único para criar/editar; `PlantImage` aplica fallback ao faltar/quebrar foto. Os DTOs seguem o README original com `outdoor` e os contratos novos de autenticação.

O app nunca calcula `nextWatering` nem `wateringStatus`. O botão Reguei envia todos os campos da planta com `lastWatering` na data local. `todayISO` usa componentes locais, nunca UTC. Exibição `dd/mm` separa a string sem criar Date. O agendador usa a data enviada pelo backend e ajusta somente o horário da notificação.

Chamadas exibem `message` do ApiError. Falhas de rede e timeout têm mensagens próprias. Ações de escrita usam trava contra duplo envio, feedback de processamento e confirmação destrutiva. Categorias ocupadas ficam visualmente indisponíveis para exclusão; tocar explica o bloqueio. O backend também deve validar essa regra.

## 6. Integração com a API

Configure `.env`:

```dotenv
EXPO_PUBLIC_API_URL=http://192.168.0.10:8080/api
EXPO_PUBLIC_RAIN_THRESHOLD=60
```

Sem URL, o app mostra orientação para configurar; não presume localhost. Variáveis `EXPO_PUBLIC_*` são públicas no bundle: nunca coloque senha de banco ou segredo JWT nelas.

`api.ts` usa timeout de 15 segundos e interceptor com Bearer. Um 401 autenticado fora de login/cadastro limpa a sessão. Resposta atrasada de uma sessão antiga não invalida o token da nova sessão. Token é mantido em memória e no SecureStore.

| Método / caminho relativo a `/api` | Uso |
|---|---|
| POST `/auth/register` | `{name,email,password}` → `{token,user}` |
| POST `/auth/login` | `{email,password}` → `{token,user}` |
| GET `/auth/me` | `{id,name,email}` |
| GET `/plants?name=&categoryId=` | Lista, filtros combinados |
| GET `/plants/{id}` | Detalhe |
| POST `/plants` / PUT `/plants/{id}` | PlantRequest, inclusive outdoor |
| DELETE `/plants/{id}` | Excluir |
| GET `/plants/dashboard` | Totais e listas do usuário |
| GET/POST `/categories` | Listar e criar |
| PUT/DELETE `/categories/{id}` | Editar e excluir |
| POST `/plants/{id}/photo` | multipart `file`, PlantResponse atualizada |

O backend atualizado está em `../plantcare-backend`, com autenticação, escopo por usuário, outdoor e upload implementados. Configure-o conforme `docs/README-PLANTCARE-BACKEND.md`. Fotos retornam URL absoluta a partir do host usado na requisição; o app deve acessar pelo IP da rede local.

## 7. Recursos do dispositivo

### Câmera e galeria

Escolha pelo diálogo no formulário. Permissão é solicitada no momento do uso; negativa definitiva oferece abrir configurações. Fotos têm edição 4:3 e qualidade 0,7. São aceitos JPEG, PNG e WebP até 5 MB. HEIC exige conversão antes da seleção. A disponibilidade da câmera depende do dispositivo; emuladores podem precisar de câmera configurada.

### Arquivos e upload

`File`, `Directory` e `Paths` da API atual de expo-file-system copiam a seleção para `documents/plants/<userId>/`. Um nome aleatório evita colisões. O arquivo é enviado pelo campo `file`, após criar/atualizar a planta. O descritor React Native do FormData tem adaptação de tipo isolada e comentada.

Se o upload falhar, a planta não é recriada. Sua foto pendente permanece no cache e aparece no detalhe com botão de reenvio, inclusive após reiniciar com uma sessão válida. Após sucesso usa a URL remota e conserva a cópia local. Excluir planta apaga cópias associadas; sair apaga o diretório daquele usuário.

### Lembretes locais

Começam desligados para não pedir permissão antes da escolha. O horário padrão é 08:00. Ativar solicita permissão e cria o canal Android Rega. O agendador cancela pendências anteriores e cria uma notificação por planta com `nextWatering`. Plantas sem data ficam de fora. Se o horário da data já passou, uma atrasada recebe o próximo horário configurado: hoje antes do horário, amanhã depois dele. Não há repetição automática diária.

São escolhidos os 60 horários mais próximos para reservar margem no iOS. O mapa `plantId → notificationId` é persistido. Sincronização ocorre no login, validação de sessão, foco/carregamento de Início e Plantas, mutações e ajustes. A fila e a identificação da sessão impedem que uma consulta antiga da conta anterior agende lembretes na conta nova. Logout cancela a agenda.

`notificationHandler` permite exibição em primeiro plano. Um toque abre o detalhe. Não há `getExpoPushTokenAsync`, FCM, APNs, endpoint de push, serviço de fundo nem agendador de servidor. A documentação Expo confirma notificações locais no Expo Go; push remoto Android exige outro fluxo desde SDK 53 e foi excluído.

A própria biblioteca pode emitir aviso genérico sobre limitações do Expo Go; isso não altera a decisão de usar somente a API local suportada.

No Expo Go, o sistema operacional controla permissões e pode atrasar notificações por bateria/Não Perturbe. Horários não têm garantia de precisão de alarme. Preferências nativas do próprio Expo Go podem aparecer em inglês e não são personalizadas por este projeto.

### Localização e clima

Ativação explícita no card ou em Ajustes. Apenas permissão de primeiro plano, precisão equilibrada. A última coordenada é guardada por usuário. Se o GPS falhar, usa essa coordenada com permissão ainda concedida. Desligar clima interrompe consultas quando a tela volta ao foco.

Open-Meteo: `https://api.open-meteo.com/v1/forecast`, `current=temperature_2m,weather_code`, `daily=precipitation_probability_max`, `timezone=auto`, `forecast_days=1`. Cache de 30 minutos; erro retorna card indisponível sem bloquear o restante da tela. Não apresenta previsão vencida como se fosse atual. Códigos WMO são descritos em português.

A chance de chuva ≥60% (configurável) mostra aviso e identifica plantas externas na lista de hoje. A decisão não modifica status, datas nem marca uma rega como realizada.

Atribuição visível: Open-Meteo, CC BY 4.0. O endpoint gratuito é destinado ao uso não comercial, apropriado à proposta acadêmica; para uso comercial reveja os termos. A posição é transmitida à Open-Meteo para a previsão. Links oficiais ao final.

## 8. Persistência e offline

| Dado | Local |
|---|---|
| Token JWT e ID da conta para limpeza | SecureStore |
| Preferências, listas, painel, coordenada, clima, agenda, fotos pendentes | AsyncStorage com prefixo por usuário |
| Cópias de fotos | Diretório Documents por usuário |
| Usuários, plantas, categorias, metadados | Backend/MySQL, implementado |
| Fotos remotas | uploads do backend, implementado |

Quando uma leitura falha por conexão, usa seu último cache e mostra “Sem conexão: mostrando dados salvos”. A combinação de busca e categoria possui chave própria: sem cache daquela combinação é exibido erro, não uma lista de outro filtro. Nenhum status é recalculado offline; os valores são os da última leitura remota. Não há fila de mutações offline. Escritas precisam de conexão e mostram erro se ela cair; botões são desabilitados quando o cache offline está ativo.

Logout elimina token, caches, agenda e fotos da conta no aparelho, preservando os registros remotos. O cancelamento precede a limpeza de cache para que uma sincronização antiga não volte a gravar o mapa de notificações.

## 9. Identidade visual e responsividade

Paleta: fundo `#F1F8EA`, secundário `#DDEEC9`, borda `#CFE3BC`, detalhe `#6FAE3E`, botão `#3B7D1E`, títulos `#27500A`. As cores estão centralizadas em `theme/colors.ts`. Nunito 400/600/700, cards verdes claros com bordas e cantos arredondados.

Divergência identificada: Logo.tsx do ZIP importa `logo-reversa.svg`, e não contém o SVG 64×64 descrito no prompt. A versão mobile preserva os paths e o layout do SVG efetivamente fornecido, via SvgXml, sem criar uma marca nova.

Cards usam uma coluna abaixo de 600 px, duas de 600 a 899, três a partir de 900. FlatList muda de key ao alterar colunas. Conteúdo é centralizado até 900 px e a orientação é livre. Há SafeArea em telas, KeyboardAvoidingView nos formulários, rolagem, alvos de 44–48 px e rótulos acessíveis. Rotação e leitores de tela precisam de validação em aparelho.

## 10. Como executar no Expo Go

### Pré-requisitos

Node.js LTS compatível com o SDK, npm e Expo Go atualizado para o SDK gerado (58). Para os testes Node que executam TypeScript diretamente, use Node 24 LTS ou superior compatível. Backend com Java 21 e MySQL; Maven Wrapper incluído. A versão do Expo Go instalada precisa reconhecer o SDK do projeto. Não execute prebuild, EAS build ou expo-dev-client.

### Subir o backend

O backend completo está na pasta `../plantcare-backend`. Com MySQL em execução, use `scripts/configure.ps1` (Windows) ou `scripts/configure.sh` (Linux/macOS), preencha usuário/senha em `config/application-local.properties` e inicie:

Windows:

```powershell
.\mvnw.cmd spring-boot:run
```

Linux/macOS:

```bash
./mvnw spring-boot:run
```

O segredo JWT é gerado pelos scripts e fica somente no backend. O banco novo padrão é `plantcare_mobile`; os dados antigos não são modificados automaticamente.

O servidor deve escutar em interface acessível pela rede (por exemplo `0.0.0.0`) na porta 8080. Configure o fuso do servidor de forma consistente com as validações de `@PastOrPresent` (America/Recife para a demonstração brasileira). Não configure o segredo JWT no app.

### IP e ambiente

Windows: execute `ipconfig`, encontre IPv4 do Wi-Fi. Linux: `hostname -I`. macOS: veja a rede em Ajustes do Sistema. Exemplo: `192.168.0.10`.

Na pasta deste aplicativo, no Windows:

```powershell
Copy-Item .env.example .env
```

Linux/macOS:

```bash
cp .env.example .env
```

Edite o IP em `.env`, mantendo `/api`. Celular físico usa o IP do computador na mesma rede; emulador Android padrão usa `http://10.0.2.2:8080/api`. No simulador iOS no mesmo Mac, pode funcionar `http://localhost:8080/api`.

### Instalar e abrir

```bash
npm ci
npx expo start
```

Leia o QR code com Expo Go no Android ou Câmera no iOS. Computador e aparelho na mesma rede Wi-Fi. Se alterar `.env`, reinicie com:

```bash
npx expo start --clear
```

O código-fonte e lockfile estão completos. `node_modules`, caches Metro e bundles temporários são regenerados, por isso não fazem parte do pacote.

### Solução de problemas

| Sintoma | Verificação |
|---|---|
| QR abre mas login falha | Backend atualizado está rodando? O IP da API está correto? |
| Erro 404 em auth | Confira se iniciou o backend atualizado deste pacote e manteve /api na URL |
| Funciona no PC, não no celular | Troque localhost pelo IP LAN; mesma Wi-Fi, sem isolamento de clientes |
| Timeout | Libere porta 8080 no firewall da rede privada; verifique se o servidor escuta fora do loopback |
| Bundle não carrega | Verifique acesso ao Metro, rede privada, VPN e versão do Expo Go |
| `--tunnel` abre app mas API não responde | O túnel Expo atende somente o bundle; não expõe o backend |
| Foto não carrega | imageUrl deve ser absoluta e acessível pelo aparelho; host não pode ser localhost |
| HTTP em texto claro falha | Para desenvolvimento, verifique a política do Expo Go/OS e prefira backend HTTPS confiável quando necessário; plugins de configuração nativa não alteram o binário Expo Go |
| Permissão negada | Abra configurações do Expo Go/aplicativo no sistema e permita câmera, localização ou notificações |
| Notificação atrasada | Confira horário, data retornada, permissões, bateria, Não Perturbe e foco do app para sincronizar |
| Erro de SDK incompatível | Use Expo Go compatível e mantenha as versões do lockfile |
| Retorno 401 ao reabrir | Token vencido/rejeitado; entre novamente |

O frontend web antigo passa a precisar de login e Bearer quando o backend for protegido; não se pode afirmar que ele continuará funcionando sem adaptação.

## 11. Verificação automatizada

```bash
npm run typecheck
npm run lint
npm test
npx expo-doctor
npx expo export --platform android
npx expo export --platform ios
```

Para testar também o contrato HTTP com os serviços reais do app, configure `API_TEST_URL=http://localhost:8080/api` e execute `npm run test:api` (no PowerShell, use `$env:API_TEST_URL="http://localhost:8080/api"`). O teste cria contas de desenvolvimento com e-mails únicos.

`expo export` verifica a transformação e resolução dos módulos. Não instala o app num telefone nem testa permissões ou endpoints. Veja o relatório em `docs/VALIDACAO.md`.

## 12. Roteiro de teste no aparelho

1. Com o backend deste pacote rodando, cadastre uma conta A. Feche/reabra o app e confirme validação da sessão.
2. Crie uma categoria e tente cadastrar outra com mesmo nome. Confira mensagem de conflito.
3. Cadastre planta sem foto, depois edite todos os campos, inclusive área externa e categoria.
4. Use última rega antiga/frequência curta para atrasada; última rega ontem/frequência 1 para hoje; deixe última rega vazia para sem data. Confira estados retornados pela API.
5. Pesquise nome e combine categoria. Digite rapidamente para verificar debounce. Puxe para atualizar.
6. Toque Reguei à noite: verifique no backend a data local e o novo status calculado.
7. Tire foto, salve, feche/reabra e confira imagem remota. Teste galeria e permissão negada.
8. Induza erro de upload após criar a planta (por exemplo, limite/servidor), confirme criação única e tente reenviar no detalhe. A foto pendente deve persistir.
9. Tente excluir categoria com plantas: confira bloqueio. Exclua a planta com confirmação e depois a categoria.
10. Ative lembretes com horário alguns minutos adiante; teste hoje, atrasada e futura. Toque a notificação com app aberto e em segundo plano. Refaça rega e confira reagendamento sem duplicação.
11. Ative clima; aceite/nege localização. Confira atribuição. Para verificar destaque sem depender do tempo, reduza temporariamente `EXPO_PUBLIC_RAIN_THRESHOLD` para 0 e reinicie; depois restaure 60.
12. Carregue painel/listas, desligue a rede, atualize e confira aviso de cache e bloqueio de escrita. Reative e puxe para atualizar.
13. Saia, entre em conta B e confirme listas separadas. Tente acessar ID da conta A via requisição autenticada em B: backend deve responder 404.
14. Teste senha errada, e-mail duplicado, token vencido, dados inválidos e servidor fora do ar.
15. Teste tela pequena, tablet e paisagem, teclado, foco, voltar Android e leitor de tela.

## 13. Melhorias futuras

Histórico de rega, paginação, política de migração de cache, limpeza de seleções de fotos abandonadas e testes de componentes/end-to-end em aparelhos. Não há serviço de fundo para manter status e agenda permanentemente atualizados sem abrir o app; o usuário reabre para sincronizar com a fonte de verdade.

## 14. Referências oficiais consultadas

- [Expo Router](https://docs.expo.dev/router/introduction/)
- [Bibliotecas incluídas no Expo Go](https://docs.expo.dev/versions/latest/sdk/third-party-overview/)
- [Notificações: locais disponíveis no Expo Go](https://docs.expo.dev/versions/v57.0.0/sdk/notifications/)
- [Arquivos: API atual](https://docs.expo.dev/versions/v57.0.0/sdk/filesystem/)
- [ImagePicker](https://docs.expo.dev/versions/latest/sdk/imagepicker/)
- [Localização](https://docs.expo.dev/versions/latest/sdk/location/)
- [SecureStore](https://docs.expo.dev/versions/latest/sdk/securestore/)
- [AsyncStorage](https://docs.expo.dev/versions/latest/sdk/async-storage/)
- [DateTimePicker](https://docs.expo.dev/versions/latest/sdk/date-time-picker/)
- [SVG](https://docs.expo.dev/versions/latest/sdk/svg/)
- [Ícones](https://docs.expo.dev/guides/icons/)
- [Fontes](https://docs.expo.dev/develop/user-interface/fonts/)
- [Bibliotecas JavaScript e compatibilidade](https://docs.expo.dev/workflow/using-libraries/)
- [Open-Meteo: parâmetros e WMO](https://open-meteo.com/en/docs)
- [Open-Meteo: termos e atribuição](https://open-meteo.com/en/terms)

Axios e Toast são JavaScript; Nunito fornece fontes carregadas por expo-font. Não exigem módulo nativo extra. Os módulos nativos escolhidos constam da documentação Expo. Os ícones solicitados no prompt são mantidos, embora a documentação atual já indique migração futura; isso não implica development build nesta implementação.
