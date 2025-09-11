# GEVapp

Aplicativo de Gestão de Estoque e Vendas desenvolvido com React Native (frontend) e Node.js/Express (backend).  
O projeto possui funcionalidades de dashboard, cadastro de produtos, vendas, histórico e relatórios.

---

## Estrutura do Projeto


GEVapp/
├── backend/ # Backend Node.js + banco SQLite
│ ├── server.js # Servidor principal
│ ├── package.json
│ ├── node_modules/
│ └── uploads/ # Pasta para arquivos enviados
├── frontend/ # Frontend React Native (Expo)
│ ├── app/ # Componentes, screens e navegação
│ ├── assets/ # Imagens e ícones
│ ├── hooks/ # Custom hooks
│ ├── package.json
│ ├── tsconfig.json
│ └── App.tsx
├── gev_app.db # Banco SQLite (somente backend)
├── README.md
└── .gitignore

cd frontend
npm install

cd backend
node server.js

cd frontend
npx expo start
npx expo start --web


funcionalidades atuais:
*tela de login e cadastro funcionando. 
*frontend com "screens" concluídas.
*backend com api, navegação entre screens contemplados.

Próximo passo:
* validar senha com JWT
*Adicionar gráficos funcionais
*melhorar a experiência do usuário

Contato

Desenvolvedor: Ocimar Prado
Email: onprado39@gmail.com





