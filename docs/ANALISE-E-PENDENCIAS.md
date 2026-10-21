# Análise e decisões da integração

Os fontes do backend foram recebidos após a primeira entrega mobile. O bloqueio anterior foi resolvido: o pacote atual contém o backend completo, não apenas sua documentação.

- Base preservada: Java 21, Spring Boot 4.0.0, pacote com.plantcare, DTOs nas subpastas auth/category/plant/dashboard, entidades nas tabelas plurais plants/categories.
- CORS original de localhost:3000 e localhost:5173 foi centralizado e testado com Spring Security.
- JWT usa componentes oficiais do Spring Security, dependências gerenciadas pelo Boot, BCrypt e segredo de configuração.
- Consultas e alterações são filtradas pelo dono; IDs alheios recebem 404. Dashboard também é privado por conta.
- Nome único passou a ser por usuário, com coluna normalizada e índice composto.
- O banco padrão novo plantcare_mobile preserva o antigo plantcare. Cópia opcional de legado é explícita e documentada; não há migração destrutiva automática.
- Upload devolve exatamente PlantResponse do mobile, com outdoor e imageUrl absoluta. A troca/deleção respeita commit; rollback limpa o arquivo novo.
- Limites de texto do mobile foram alinhados aos @Size reais do backend.
- Logo mobile preserva o SVG separado fornecido no ZIP original, pois Logo.tsx importava esse arquivo em vez dos paths descritos no prompt.

Pendência de validação, não de código-fonte: testar o conjunto num aparelho com Expo Go para câmera, galeria, notificações, geolocalização, teclado, navegação e rotação. Os testes automatizados de servidor/contrato e os bundles não substituem essas ações físicas.
