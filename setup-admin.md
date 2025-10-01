# 🔐 Configuração do Primeiro Usuário Admin

## Opção 1: Via Console Firebase (Recomendado)

### 1. Criar usuário no Firebase Authentication

1. Acesse: https://console.firebase.google.com/project/sistema-gestao-gasolina/authentication
2. Clique em **"Get Started"** (se for a primeira vez)
3. Clique em **"Users"** → **"Add user"**
4. Preencha:
   - **Email**: admin@inovar.com
   - **Password**: Inovar@2024
5. Clique em **"Add user"**
6. **Copie o User UID** que aparecerá na lista

### 2. Criar perfil no Firestore

1. Acesse: https://console.firebase.google.com/project/sistema-gestao-gasolina/firestore
2. Clique em **"Start collection"** (se não existir a coleção `users`)
3. **Collection ID**: `users`
4. **Document ID**: Cole o **User UID** copiado no passo anterior
5. Adicione os seguintes campos:

| Campo       | Tipo      | Valor                              |
|-------------|-----------|------------------------------------|
| nome        | string    | Administrador                      |
| email       | string    | admin@inovar.com                   |
| setor       | string    | TI                                 |
| empresa     | string    | Inovar                             |
| role        | string    | admin                              |
| isActive    | boolean   | true                               |
| createdAt   | string    | 2025-10-01T00:00:00.000Z          |

6. Clique em **"Save"**

### 3. Testar o Login

1. Acesse: https://sistema-gestao-gasolina.web.app/login
2. Use as credenciais:
   - **Email**: admin@inovar.com
   - **Password**: Inovar@2024

---

## Opção 2: Via Firebase CLI (Avançado)

```bash
# Execute no terminal
firebase auth:import users.json --hash-algo=SCRYPT
```

Crie o arquivo `users.json`:

```json
{
  "users": [
    {
      "localId": "admin-uid",
      "email": "admin@inovar.com",
      "passwordHash": "...",
      "displayName": "Administrador"
    }
  ]
}
```

---

## 📝 Credenciais de Teste

### Admin
- **Email**: admin@inovar.com
- **Senha**: Inovar@2024
- **Permissões**: Todas

### Usuário Comum (criar depois)
- **Email**: user@inovar.com
- **Senha**: User@2024
- **Permissões**: Leitura apenas

---

## ⚠️ Importante

- Após criar o primeiro admin, você pode criar novos usuários pela interface do sistema
- Sempre use senhas fortes em produção
- O campo `role: 'admin'` é **obrigatório** para ter acesso administrativo
- Sem o documento no Firestore, mesmo com usuário no Authentication, o login falhará

---

## 🔧 Solução de Problemas

### Erro: "Perfil de usuário não encontrado"
- Verifique se criou o documento no Firestore com o UID correto

### Erro: "Missing or insufficient permissions"
- Verifique se o usuário tem `role: 'admin'` no Firestore
- Confirme que está logado (verifique o console do navegador)

### Erro: "Invalid email or password"
- Confirme as credenciais no Firebase Authentication
- Tente resetar a senha no console do Firebase
