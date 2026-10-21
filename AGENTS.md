# PlantCare Mobile

- Expo Go é a restrição principal. Não usar prebuild, EAS build, expo-dev-client ou código nativo customizado.
- Ler package.json e a documentação oficial da versão instalada antes de alterar APIs Expo/React Native.
- Instalar dependências com npx expo install e conferir suporte no Expo Go.
- Rotas ficam em app/; serviços, componentes, tipos e tema ficam em src/.
- TypeScript estrito, cores centralizadas e rega/status calculados somente no servidor.
- Somente notificações locais; sem push remoto.
- Executar npm run typecheck, npm run lint, npm test e npx expo-doctor após alterações.
- Backend completo acompanha a entrega em ../plantcare-backend; preservar os contratos DTOs. scripts/test-api.mjs testa os próprios serviços do mobile contra uma API real via API_TEST_URL.
