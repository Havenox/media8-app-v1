# Media 8 - Referência de API

> **Spec**: RESTful API v1 sobre ASP.NET 10 / HTTP2. Respostas sempre em **JSON PascalCase**.
>
> ⚠️ **IMPORTANTE**: A API serializa TODOS os campos em **PascalCase** (`PropertyNamingPolicy = null`).
> O frontend DEVE acessar campos como `Id`, `Name`, `Status` — nunca `id`, `name`, `status`.

---

## Base URL & Auth

**Development**: `http://localhost:5062/api/v1`
**Header**: `Authorization: Bearer <token>`

---

## Endpoints

### 🔐 Autenticação

| Método | Endpoint | Auth | Descrição |
|--------|----------|------|-----------|
| `POST` | `/auth/login` | Público | Login. Body: `{ Email, Password }`. Retorna `{ Token, User }` |
| `POST` | `/auth/register` | Público | Cadastro. Body: `{ Name, Email, Password }` |
| `POST` | `/auth/change-password` | Bearer | Alterar senha |

### 👤 Usuários (`/users`)

| Método | Endpoint | Auth | Descrição |
|--------|----------|------|-----------|
| `GET` | `/users` | Admin | Lista paginada. Query: `?page=&pageSize=&role=&search=&showInactive=` |
| `GET` | `/users/stats` | Admin | Estatísticas (contagem por role) |
| `GET` | `/users/{id}` | Bearer | Detalhes de um usuário |
| `POST` | `/users` | Admin | Criar usuário. Body: `{ Name, Email, Role, Password, Phone }` |
| `PUT` | `/users/{id}` | Admin | Atualizar usuário |
| `PUT` | `/users/{id}/profile` | Bearer | Atualizar perfil próprio |
| `PUT` | `/users/{id}/reactivate` | Admin | Reativar usuário inativo |
| `DELETE` | `/users/{id}` | Admin | Soft/Hard delete |

### 📋 Pedidos (`/Orders`)

| Método | Endpoint | Auth | Descrição |
|--------|----------|------|-----------|
| `GET` | `/Orders` | Bearer | Lista pedidos. RBAC: Admin vê todos, outros veem apenas os seus. Query: `?ClientId=&EditorId=&Status=` |
| `GET` | `/Orders/{id}` | Bearer | Detalhes de um pedido |
| `GET` | `/Orders/available-balances` | Bearer | Lotes de saldo disponíveis para criar pedido |
| `GET` | `/Orders/AvailableBalances` | Bearer | Alias PascalCase (mesmo endpoint acima) |
| `GET` | `/Orders/cancellation-window` | Bearer | Janela de cancelamento em horas |
| `POST` | `/Orders` | Bearer | Criar pedido. Body: `{ Title, Briefing, SourceFilesUrl, VideoFormatId, ServiceBalanceLotId, Deadline }` |
| `PUT` | `/Orders/{id}` | Bearer | Atualizar pedido (owner ou admin) |
| `POST` | `/Orders/{id}/cancel` | Bearer | Cancelar pedido com reembolso de crédito |

### 💰 Saldos de Serviço (`/ServiceBalances`)

| Método | Endpoint | Auth | Descrição |
|--------|----------|------|-----------|
| `GET` | `/ServiceBalances/MyBalances` | Bearer | Saldos do usuário logado. Query: `?page=&pageSize=&status=active` |
| `GET` | `/ServiceBalances/Client` | Admin | Saldos de um cliente. Query: `?clientId=&page=&pageSize=&status=` |
| `GET` | `/ServiceBalances/{clientId}` | Admin | Alias por path param (mesmo que Client) |

### 🎁 Ofertas (`/offers`)

| Método | Endpoint | Auth | Descrição |
|--------|----------|------|-----------|
| `GET` | `/offers` | Admin | Lista ofertas. Query: `?page=&pageSize=&search=` |
| `GET` | `/offers/{id}` | Admin | Detalhes de uma oferta |
| `POST` | `/offers` | Admin | Criar oferta. Body: `{ Name, Slug, ContractType, Price, VideoQuantity, ... }` |
| `PUT` | `/offers/{id}` | Admin | Atualizar oferta |
| `DELETE` | `/offers/{id}?permanent=false` | Admin | Soft/Hard delete |

### 📜 Contratos (`/client-contracts`)

| Método | Endpoint | Auth | Descrição |
|--------|----------|------|-----------|
| `GET` | `/client-contracts` | Admin | Lista contratos. Query: `?clientId=` |
| `GET` | `/client-contracts/{id}` | Admin | Detalhes |
| `POST` | `/client-contracts` | Admin | Atribuir oferta a cliente (gera snapshot + lote) |
| `PUT` | `/client-contracts/{id}` | Admin | Atualizar status/expiração |

### 🎬 Formatos de Vídeo (`/video-formats`)

| Método | Endpoint | Auth | Descrição |
|--------|----------|------|-----------|
| `GET` | `/video-formats` | Admin | Lista formatos |
| `GET` | `/video-formats/{id}` | Admin | Detalhes |
| `POST` | `/video-formats` | Admin | Criar formato. Body: `{ Name, Slug, MaxDurationSeconds, Tier, EditingStyleId }` |
| `PUT` | `/video-formats/{id}` | Admin | Atualizar |
| `DELETE` | `/video-formats/{id}?permanent=false` | Admin | Soft/Hard delete |

### ✂️ Estilos de Edição (`/editing-styles`)

| Método | Endpoint | Auth | Descrição |
|--------|----------|------|-----------|
| `GET` | `/editing-styles` | Admin | Lista estilos |
| `POST` | `/editing-styles` | Admin | Criar estilo. Body: `{ Name, Description }` |
| `PUT` | `/editing-styles/{id}` | Admin | Atualizar |
| `DELETE` | `/editing-styles/{id}?permanent=false` | Admin | Soft/Hard delete |

### 🎨 Perfis de Branding (`/branding-profiles`)

| Método | Endpoint | Auth | Descrição |
|--------|----------|------|-----------|
| `GET` | `/branding-profiles` | Bearer | Lista perfis do usuário. Query: `?onlyActive=true` |
| `GET` | `/branding-profiles/{id}` | Bearer | Detalhes |
| `POST` | `/branding-profiles` | Bearer | Criar perfil |
| `PUT` | `/branding-profiles/{id}` | Bearer | Atualizar |
| `PUT` | `/branding-profiles/{id}/archive` | Bearer | Arquivar |
| `PUT` | `/branding-profiles/{id}/restore` | Bearer | Restaurar |
| `DELETE` | `/branding-profiles/{id}` | Bearer | Hard delete |

---

## Convenção PascalCase

Todos os DTOs seguem PascalCase nativo do .NET:

```json
// ✅ Correto (como a API retorna)
{
  "Id": "uuid",
  "Name": "Exemplo",
  "Status": "Active",
  "CreatedAt": "2026-01-01T00:00:00Z"
}

// ❌ Incorreto (NÃO é mais usado)
{
  "id": "uuid",
  "name": "Exemplo",
  "status": "active"
}
```

---

**Nota**: Documentação interativa via Swagger em `/swagger` no ambiente de desenvolvimento.
