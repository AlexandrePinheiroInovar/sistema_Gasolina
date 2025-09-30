# 🔑 Credenciais de Teste - Sistema de Gerenciamento de Gasolina

## ⚠️ MODO DESENVOLVIMENTO TEMPORÁRIO

Este sistema está configurado com autenticação MOCK para testes. **NÃO USE EM PRODUÇÃO!**

## 👤 Usuários de Teste

### Administrador
- **Email:** `admin@teste.com`
- **Senha:** `admin123`
- **Perfil:** Administrador completo
- **Permissões:** Todas as funcionalidades (dashboard, usuários, condutores, importação)

### Usuário Comum
- **Email:** `user@teste.com`
- **Senha:** `user123`
- **Perfil:** Usuário comum
- **Permissões:** Dashboard e condutores (sem acesso a usuários e importação)

## 🔧 Como Usar

1. Acesse: `http://localhost:5173/`
2. A aplicação redirecionará para login se não estiver autenticado
3. Use uma das credenciais acima
4. Após login, será redirecionado para o dashboard

## 📊 Dados de Teste

O sistema inclui dados mock para:
- **Consumo de combustível:** 5 registros de exemplo
- **Condutores:** 2 condutores cadastrados
- **Gráficos e métricas:** Gerados a partir dos dados mock

## 🔄 Sessão

- A sessão é salva no `localStorage`
- Para fazer logout, use o botão no menu superior direito
- Para trocar usuário, faça logout e entre novamente

## ⚡ Restaurar Firebase

Quando quiser voltar ao Firebase:
1. Substitua `src/contexts/AuthContext.jsx` pelo backup: `src/contexts/AuthContext.firebase.backup`
2. Configure as credenciais do Firebase em `src/config/firebase.js`
3. Remove `src/data/mockData.js` e este arquivo

---
**📝 Criado automaticamente para ambiente de desenvolvimento**