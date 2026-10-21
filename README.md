# PlantCare Mobile

Aplicativo React Native/Expo Go com oito telas, JWT, plantas e categorias por usuário, fotos, cache, lembretes locais e clima.

O backend completo agora acompanha o pacote, em `../plantcare-backend`. Configure e inicie-o primeiro conforme seu README. O contrato é compatível com os serviços deste aplicativo e há teste HTTP executando os mesmos fontes de serviço contra a API real.

```bash
npm ci
```

Copie `.env.example` para `.env`, coloque o IP do computador em EXPO_PUBLIC_API_URL (mantendo /api), depois:

```bash
npx expo start
```

- [Guia completo do mobile e Expo Go](README-PLANTCARE-MOBILE.md)
- [Backend e configuração](docs/README-PLANTCARE-BACKEND.md)
- [Checklist](docs/CHECKLIST.md)
- [Validação](docs/VALIDACAO.md)

Câmera, permissões, notificações, localização e layout em aparelho precisam da verificação manual descrita no guia; geração de bundle não substitui essa etapa.


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
