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

Câmera, permissões, notificações, localização e layout em aparelho precisam da verificação manual descrita no guia; geração de bundle não substitui essa etapa.

