# Sistema de Gerenciamento de Gasolina

Um sistema web completo para gerenciamento de consumo de gasolina com dashboard interativo, controle de usuários e importação de planilhas.

## 🚀 Funcionalidades

### Perfis de Usuário
- **Usuário Comum**: Visualização e filtros no dashboard
- **Administrador**: Todas as funcionalidades + cadastro de usuários e importação de dados

### Módulos Principais
- **Dashboard Interativo**: Gráficos modernos com métricas de consumo
- **Cadastro de Condutores**: Gestão completa de condutores e veículos
- **Importação de Dados**: Upload de planilhas (Condutor, Maxi Frota, Ticket Log)
- **Gerenciamento de Usuários**: Controle de acesso e perfis

### Características Técnicas
- **Dark Mode**: Interface adaptável com tema escuro/claro
- **Responsivo**: Design otimizado para desktop e mobile
- **Filtros Dinâmicos**: Filtros avançados por período, setor, condutor, etc.
- **Gráficos Interativos**: Charts modernos com dados em tempo real

## 🛠️ Tecnologias

- **Frontend**: React 18 + Vite
- **Styling**: TailwindCSS
- **Backend**: Firebase (Auth, Firestore, Storage)
- **Gráficos**: Chart.js + React Chart.js 2
- **Ícones**: Lucide React
- **Planilhas**: XLSX + File Saver

## 📦 Instalação

1. Clone o repositório:
```bash
git clone <repository-url>
cd sistema-gerenciamento-gasolina
```

2. Instale as dependências:
```bash
npm install
```

3. Configure o Firebase:
   - Crie um projeto no [Firebase Console](https://console.firebase.google.com)
   - Ative Authentication, Firestore e Storage
   - Copie as configurações e substitua em `src/config/firebase.js`

4. Execute o projeto:
```bash
npm run dev
```

## 🔧 Configuração do Firebase

Substitua as configurações no arquivo `src/config/firebase.js`:

```javascript
const firebaseConfig = {
  apiKey: "sua-api-key",
  authDomain: "seu-projeto.firebaseapp.com",
  projectId: "seu-project-id",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "123456789",
  appId: "seu-app-id"
};
```

## 📊 Estrutura de Dados

### Usuários
```javascript
{
  nome: string,
  email: string,
  setor: string,
  empresa: string,
  role: 'admin' | 'user',
  createdAt: timestamp
}
```

### Condutores
```javascript
{
  matricula: string,
  nome: string,
  formaPagamento: string,
  chavePix: string,
  agencia: string,
  conta: string,
  cpf: string,
  email: string,
  setor: string,
  unidade: string,
  supervisor: string,
  veiculo: {
    marca: string,
    modelo: string,
    cor: string,
    ano: string,
    placa: string
  },
  status: 'ativo' | 'inativo',
  empresa: string
}
```

## 📈 Dashboard

O dashboard inclui:

- **Métricas Gerais**: Total de litros, valor gasto, média KM/L, custo por KM
- **Gráfico por Setor**: Consumo consolidado por setor
- **Gráfico por Condutor**: Top 10 condutores por consumo
- **Gráfico por Supervisão**: Distribuição por supervisor
- **Métricas de Eficiência**: Evolução de KM/L e custo por KM

## 📋 Importação de Planilhas

O sistema suporta três tipos de relatórios:

1. **Relatório Condutor**: Dados detalhados de abastecimento
2. **Relatório Maxi Frota**: Transações do sistema Maxi Frota
3. **Relatório Período Ticket Log**: Dados consolidados por período

Cada tipo possui template específico disponível para download.

## 🎨 Personalização

### Cores
As cores podem ser customizadas no arquivo `tailwind.config.js`:

```javascript
colors: {
  primary: {
    // Cores primárias do sistema
  },
  secondary: {
    // Cores secundárias
  }
}
```

### Dark Mode
O dark mode é controlado pelo contexto `ThemeContext` e salvo no localStorage.

## 🚀 Deploy

Para fazer deploy:

1. Build do projeto:
```bash
npm run build
```

2. Deploy no Firebase Hosting:
```bash
firebase deploy
```

## 📝 Scripts Disponíveis

- `npm run dev`: Inicia o servidor de desenvolvimento
- `npm run build`: Gera build de produção
- `npm run preview`: Preview do build de produção
- `npm run lint`: Executa linting do código

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 📞 Suporte

Para suporte e dúvidas, entre em contato através dos issues do repositório.