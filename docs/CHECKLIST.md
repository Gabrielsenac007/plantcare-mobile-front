# Checklist de requisitos — PlantCare completo

| Requisito | Onde foi implementado | Validação |
|---|---|---|
| Aplicativo Android/iOS | mobile/app, app.json, Expo Router | Bundles Android e iOS gerados |
| Login e cadastro | AuthForm/AuthContext/authService; backend AuthController/AuthService/SecurityConfig/User | Integração com filtros reais e HTTP/MySQL |
| JWT, BCrypt, /me e token expirado | backend/security, AuthService, UserResponse | Testes de hash, credenciais, tokens adulterados/expirados e emissor |
| Dados por usuário | CurrentUser; repositories e services de Plant/Category | Duas contas; leitura/escrita/upload alheios retornam 404 |
| CRUD plantas | mobile/app/plant, plants.tsx; PlantController/PlantService | Criação, leitura, atualização, exclusão e DTOs testados |
| CRUD categorias | categories.tsx; CategoryController/CategoryService | Nome único por conta, edição, contador e exclusão testados |
| Busca combinada e debounce | useDebounce, plants.tsx, PlantService.findAll | Contrato de filtros testado; debounce configurado em 300 ms |
| Rega e painel | date.ts/toRequest; PlantService.getDashboard/response | Datas, quatro status, Reguei por PUT e totais testados |
| Câmera e galeria | photoService, PlantForm | Implementadas; permissão/câmera no aparelho a validar |
| Arquivos locais | photoService, File/Directory/Paths | Implementados; persistência nativa no aparelho a validar |
| Upload JPEG/PNG/WebP até 5 MB | PlantController.upload, PhotoStorageService | Três formatos, inválido/vazio/excessivo, URL pública e multipart real testados |
| Troca, exclusão e rollback da foto | PhotoStorageService, PlantService | Testes com commit/rollback e HTTP; arquivo persiste após reinício |
| Notificações locais | notificationService, Ajustes, listener na raiz | Datas/agendamento unitários; entrega e toque no aparelho a validar |
| Geolocalização em primeiro plano | locationService, WeatherCard, Ajustes | Implementada; permissão/GPS no aparelho a validar |
| API externa | weatherService (Open-Meteo), WeatherCard | Parâmetros/atribuição documentados; card no aparelho a validar |
| Chuva e outdoor | WeatherCard/Início; PlantRequest/Response/Entity | Campo boolean no contrato real; destaque visual a validar no aparelho |
| Oito telas e navegação | auth, quatro abas, detalhe e formulário | Bundles; navegação/toque/back físico a validar |
| Persistência remota | MySQL + JPA + uploads | Dados, JWT e foto verificados após reiniciar backend |
| Persistência local e offline | SecureStore, AsyncStorage, useNetworkAwareLoad | Implementada; queda de rede e reabertura no aparelho a validar |
| Logout | AuthContext, cancelAll, cache.clear, clearLocalPhotos | Interceptor 401 testado; APIs nativas no aparelho a validar |
| UI amigável e responsiva | tema, SafeArea, KeyboardAvoidingView, FlatList/useResponsiveColumns | Implementada; rotação, tamanhos e leitor de tela a validar no aparelho |
| CORS existente | SecurityConfig.corsSource | Origens localhost:3000/5173 e preflight testados |
| Dados antigos preservados | banco novo plantcare_mobile; scripts/import-legacy.sql | Cópia explícita e guardas testadas no MySQL; sem alteração da origem |
| Documentação e arquivos integrais | READMEs, guia inicial, exemplos HTTP e manifesto | Incluídos no pacote |
| Expo Go sem development build | dependências oficiais; notificações somente locais | SDK 57; doctor 21/21; nenhuma pasta nativa/dev-client/EAS/push remoto |

Implementação entregue nos dois projetos. Os testes automatizados e a geração de bundles não equivalem a um teste físico no Expo Go. Use o roteiro do README mobile para concluir o aceite dos recursos de aparelho.
