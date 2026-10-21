# Relatório de validação — 18/10/2026

## Resultados

| Verificação | Resultado |
|---|---|
| Backend: Java 21 + Spring Boot 4.0.0, Maven clean package | Build concluído; JAR executável gerado |
| Backend: suíte JUnit/SpringBootTest/MockMvc com H2 modo MySQL | 12 testes passaram; zero falhas/erros |
| MySQL real | 8.0.46, JDBC do backend e persistência reais |
| Serviços HTTP do mobile contra o backend/MySQL | 7 grupos de verificações passaram |
| Reinício do backend | Mesmo JWT validado; planta e foto recuperadas; arquivo público acessível |
| Cópia opcional de legado | Dados atribuídos ao usuário, origem preservada, outdoor=false, destino não vazio recusado |
| Mobile: TypeScript estrito | Passou |
| Mobile: lint | Passou |
| Mobile: testes de datas e agenda | 6 passaram |
| Mobile: expo-doctor | 21/21 verificações passaram |
| Mobile: exportação Android e iOS | Bundles gerados |
| Script Linux de configuração | Gerou chave de 32 bytes e arquivo com permissão 600; segunda execução preservou o arquivo |

## Cobertura de servidor

Cadastro/login/me e hash BCrypt; senha e e-mail inválidos; duplicidade e normalização; JWT adulterado, inválido, expirado e de emissor diferente; duas contas isoladas; CRUD e filtros; quatro status de rega, dashboard e Reguei; limites de frequência e datas futuras; CORS original; upload JPEG/PNG/WebP, MIME/conteúdo inválido, vazio, tamanho excessivo, substituição, exclusão e rollback.

Os testes HTTP usam a transpilação dos próprios arquivos `src/services/api.ts`, `authService.ts`, `plantService.ts` e `categoryService.ts` do mobile. Não há mock do backend nesse teste. O relatório de contrato contém hashes desses fontes para permitir conferência. A requisição multipart e o limite real do servlet também foram verificados.

## Limites da validação

Não foi usado aparelho/emulador com Expo Go nesta execução. Câmera/galeria, permissões, cópias no filesystem nativo, entrega e toque de notificação, GPS, leitor de tela, teclado, botão voltar e rotação exigem o roteiro manual do README. Não foi simulada uma sessão completa de interação visual no telefone. O teste HTTP usa os serviços do mobile em Node e não substitui essa validação nativa.

Os builds mostraram avisos de ambiente do npm/cores e de detecção de módulo no teste Node; os comandos concluíram. O Spring Test/Mockito apresentou aviso de agente dinâmico no JDK, sem falha da suíte. Nenhum segredo, senha real, banco de teste, pasta uploads ou cache de dependências faz parte do pacote.

O JAR de validação foi gerado localmente. O ZIP entrega fontes completos, Maven Wrapper, lockfile e configurações-modelo, sem binários regeneráveis de target/node_modules. Windows/PowerShell deve ser validado no ambiente do grupo; o wrapper e o script estão incluídos.


## Correção de compatibilidade — Expo Go 57

O aplicativo foi ajustado do SDK 58 para o SDK 57 informado pelo usuário. Expo 57.0.30, React Native 0.86.3 e React 19.2.3, com módulos alinhados por expo install e lockfile atualizado. Não basta mudar o número no app.json: as dependências foram reinstaladas em conjunto.

Verificações desta correção: instalação limpa com npm ci; TypeScript; lint; seis testes; expo-doctor (21/21); exportação Android e iOS. O backend e seus contratos HTTP não foram alterados. A validação anterior de MySQL/JWT/fotos continua documentada como teste do backend; não foi apresentada como nova execução física do SDK 57 no aparelho.

Para usar: encerre o Metro antigo com Ctrl+C, extraia o pacote atualizado numa nova pasta e copie seu .env para plantcare-mobile. Nessa pasta execute npm ci e npx expo start --clear, usando o novo QR code no Expo Go 57. Não copie node_modules ou package-lock.json da entrega anterior por cima desta versão.


## Correção do carregamento no Expo Go 57

A importação principal de expo-notifications 57.0.23 carregava antecipadamente
ExpoTopicSubscriptionModule, de push remoto, ausente no Expo Go do usuário.
Isso interrompia a avaliação das rotas e causava avisos de default export e
ErrorBoundary em cascata, mesmo com os componentes exportados corretamente.

O adaptador src/services/localNotifications.ts importa somente os arquivos das
APIs locais. O layout e o serviço de rega usam esse adaptador. A dependência foi
fixada em 57.0.23 e o package-lock.json atualizado; não há alteração em node_modules.
Não foram removidos os lembretes locais nem adicionadas APIs de push remoto.
Os imports internos são intencionais e precisam ser revalidados ao atualizar Expo.

Validação desta correção: npm test (7/7), npm run typecheck, npm run lint,
npx expo-doctor (21/21) e exportação Android aprovados. O teste novo executa os
arquivos reais instalados do pacote com resolução Android/native e uma ponte
nativa simulada: reproduz a falha do módulo de tópicos ausente e verifica que o
adaptador carrega, pede permissões, cria canal, agenda/cancela e recebe o toque.
O bundle Android atual também não contém ExpoTopicSubscriptionModule.
Não foi feito teste em dispositivo físico nesta sessão. Os testes anteriores do
backend e de integração HTTP permanecem registrados; não foram repetidos nesta
correção, que não altera o backend nem os contratos da API.

Para executar: encerre o Metro antigo (Ctrl+C), extraia o pacote corrigido em uma
pasta nova, copie seu .env para plantcare-mobile e execute npm ci seguido de
npx expo start --clear. Leia o novo QR no Expo Go 57. Não copie node_modules.
