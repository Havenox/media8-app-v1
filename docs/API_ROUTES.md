# Media 8 - Rotas da API

Este documento descreve todas as rotas da API REST para o backend .NET da plataforma Media 8.

---

## Sumário

1. [Visão Geral](#visão-geral)
2. [Autenticação](#autenticação)
3. [Rotas por Domínio](#rotas-por-domínio)
4. [Códigos de Resposta](#códigos-de-resposta)
5. [Exemplos de Payload](#exemplos-de-payload)

---

## Visão Geral

### Base URL
```
Production: https://api.media8.com.br/api/v1
Development: http://localhost:5000/api/v1
```

### Headers Padrão
```http
Content-Type: application/json
Authorization: Bearer <jwt_token>
```

### Formato de Resposta

**Sucesso:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Operação realizada com sucesso"
}
```

**Erro:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dados inválidos",
    "details": { ... }
  }
}
```

**Paginação:**
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalCount": 150,
    "totalPages": 8
  }
}
```

---

## Autenticação

### Endpoints Públicos (Sem Auth)

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/auth/register` | Registrar novo usuário |
| POST | `/auth/login` | Login com email/senha |
| POST | `/auth/refresh` | Renovar token JWT |
| POST | `/auth/forgot-password` | Solicitar reset de senha |
| POST | `/auth/reset-password` | Resetar senha com token |

### Fluxo de Autenticação

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   Client    │      │ Backend API │      │ PostgreSQL  │
│  (Frontend) │      │   (.NET)    │      │  (Docker)   │
└──────┬──────┘      └──────┬──────┘      └──────┬──────┘
       │                    │                    │
       │  POST /auth/login  │                    │
       │───────────────────>│                    │
       │                    │  Query user        │
       │                    │───────────────────>│
       │                    │                    │
       │                    │  User data         │
       │                    │<───────────────────│
       │                    │                    │
       │                    │  Validate password │
       │                    │  Generate JWT      │
       │                    │                    │
       │  { token, user }   │                    │
       │<───────────────────│                    │
       │                    │                    │
       │  GET /orders       │                    │
       │  Authorization:    │                    │
       │  Bearer <token>    │                    │
       │───────────────────>│                    │
       │                    │  Verify JWT        │
       │                    │  (locally)         │
       │                    │                    │
```

---

## Rotas por Domínio

### 👤 Users & Profiles

| Método | Rota | Auth | Roles | Descrição |
|--------|------|------|-------|-----------|
| GET | `/users` | ✅ | Admin | Listar todos usuários |
| GET | `/users/:id` | ✅ | Admin, Self | Obter usuário por ID |
| PUT | `/users/:id` | ✅ | Admin, Self | Atualizar usuário |
| DELETE | `/users/:id` | ✅ | Admin | Desativar usuário |
| GET | `/users/:id/role` | ✅ | Admin | Obter role do usuário |
| PUT | `/users/:id/role` | ✅ | Admin | Alterar role do usuário |

#### GET `/users`
Query params:
- `role` (optional): Filtrar por role (`admin`, `editor`, `client`)
- `search` (optional): Buscar por nome/email
- `page` (default: 1)
- `pageSize` (default: 20)

---

### 📦 Packages

| Método | Rota | Auth | Roles | Descrição |
|--------|------|------|-------|-----------|
| GET | `/packages` | ❌ | - | Listar pacotes ativos (público) |
| GET | `/packages/all` | ✅ | Admin | Listar todos pacotes (incl. inativos) |
| GET | `/packages/:id` | ✅ | Admin | Obter pacote por ID |
| POST | `/packages` | ✅ | Admin | Criar novo pacote |
| PUT | `/packages/:id` | ✅ | Admin | Atualizar pacote |
| PATCH | `/packages/:id/status` | ✅ | Admin | Ativar/desativar pacote |
| DELETE | `/packages/:id` | ✅ | Admin | Remover pacote (soft delete) |

---

### 🎯 Package Assignments

| Método | Rota | Auth | Roles | Descrição |
|--------|------|------|-------|-----------|
| GET | `/assignments` | ✅ | Admin | Listar todas atribuições |
| GET | `/assignments/client/:clientId` | ✅ | Admin, Self | Atribuições de um cliente |
| GET | `/assignments/:id` | ✅ | Admin | Detalhes de uma atribuição |
| POST | `/assignments` | ✅ | Admin | Atribuir pacote a cliente |
| PATCH | `/assignments/:id/cancel` | ✅ | Admin | Cancelar atribuição |

#### POST `/assignments`
```json
{
  "packageId": "uuid",
  "clientId": "uuid"
}
```

**Efeito colateral**: Cria automaticamente os `service_balance_lots` correspondentes.

---

### 💰 Service Balances

| Método | Rota | Auth | Roles | Descrição |
|--------|------|------|-------|-----------|
| GET | `/balances/me` | ✅ | Client | Meu saldo de serviços (agregado) |
| GET | `/balances/user/:userId` | ✅ | Admin | Saldo de um usuário |
| GET | `/balances/lots/me` | ✅ | Client | Meus lotes detalhados |
| GET | `/balances/lots/user/:userId` | ✅ | Admin | Lotes de um usuário |
| POST | `/balances/consume` | ✅ | Client | Consumir serviço |
| GET | `/balances/available` | ✅ | Client | Serviços disponíveis para uso |

#### GET `/balances/me` Response
```json
{
  "success": true,
  "data": [
    {
      "serviceType": "reels_standard",
      "totalQuantity": 8,
      "lots": [
        {
          "id": "uuid",
          "quantity": 5,
          "remainingQuantity": 3,
          "expiresAt": "2024-03-15T00:00:00Z",
          "source": "subscription"
        },
        {
          "id": "uuid",
          "quantity": 5,
          "remainingQuantity": 5,
          "expiresAt": null,
          "source": "purchase"
        }
      ]
    }
  ]
}
```

#### POST `/balances/consume`
```json
{
  "serviceType": "reels_standard",
  "quantity": 1
}
```

---

### 📋 Orders

| Método | Rota | Auth | Roles | Descrição |
|--------|------|------|-------|-----------|
| GET | `/orders` | ✅ | All | Listar pedidos (filtrado por role) |
| GET | `/orders/:id` | ✅ | All | Detalhes do pedido |
| POST | `/orders` | ✅ | Client | Criar novo pedido |
| PUT | `/orders/:id` | ✅ | Admin, Editor | Atualizar pedido |
| PATCH | `/orders/:id/status` | ✅ | All | Alterar status |
| PATCH | `/orders/:id/assign` | ✅ | Admin | Atribuir editor |

#### Filtros por Role

- **Client**: Vê apenas seus próprios pedidos
- **Editor**: Vê apenas pedidos atribuídos a ele
- **Admin**: Vê todos os pedidos

#### POST `/orders`
```json
{
  "title": "Vídeo Instagram Lançamento",
  "briefing": "Descrição detalhada...",
  "sourceFilesUrl": "https://drive.google.com/...",
  "serviceType": "reels_standard",
  "deadline": "2024-02-20"
}
```

**Validações**:
- Cliente deve ter saldo disponível do `serviceType`
- Deadline deve respeitar prazo mínimo do serviço
- Consome automaticamente 1 unidade do serviço

#### PATCH `/orders/:id/status`
```json
{
  "status": "in_progress"
}
```

**Transições permitidas**:
```
pending → in_progress (Admin/Editor)
in_progress → in_review (Editor)
in_review → approved (Client)
in_review → changes_requested (Client)
changes_requested → in_progress (Editor)
```

---

### 📜 Order Timeline

| Método | Rota | Auth | Roles | Descrição |
|--------|------|------|-------|-----------|
| GET | `/orders/:orderId/timeline` | ✅ | All | Timeline do pedido |
| POST | `/orders/:orderId/timeline` | ✅ | All | Adicionar entrada |

#### POST `/orders/:orderId/timeline`
```json
{
  "actionType": "comment",
  "content": "Primeira versão enviada para revisão"
}
```

---

### 🔔 Notifications

| Método | Rota | Auth | Roles | Descrição |
|--------|------|------|-------|-----------|
| GET | `/notifications` | ✅ | All | Minhas notificações |
| GET | `/notifications/unread-count` | ✅ | All | Contagem de não lidas |
| PATCH | `/notifications/:id/read` | ✅ | All | Marcar como lida |
| PATCH | `/notifications/read-all` | ✅ | All | Marcar todas como lidas |

---

### 📊 Dashboard Stats

| Método | Rota | Auth | Roles | Descrição |
|--------|------|------|-------|-----------|
| GET | `/stats/dashboard` | ✅ | All | Estatísticas (filtradas por role) |

#### Response por Role

**Client:**
```json
{
  "totalOrders": 15,
  "pendingOrders": 2,
  "inProgressOrders": 3,
  "completedOrders": 10,
  "activePackage": { ... },
  "serviceBalances": [ ... ]
}
```

**Editor:**
```json
{
  "assignedOrders": 8,
  "pendingReview": 3,
  "inProgress": 2,
  "completedThisMonth": 12
}
```

**Admin:**
```json
{
  "totalUsers": 150,
  "totalClients": 120,
  "totalEditors": 5,
  "totalOrders": 500,
  "ordersThisMonth": 45,
  "revenue": {
    "thisMonth": 15000.00,
    "lastMonth": 12000.00
  }
}
```

---

## Códigos de Resposta

| Código | Significado | Uso |
|--------|-------------|-----|
| 200 | OK | Sucesso em GET, PUT, PATCH |
| 201 | Created | Sucesso em POST |
| 204 | No Content | Sucesso em DELETE |
| 400 | Bad Request | Dados inválidos |
| 401 | Unauthorized | Token ausente ou inválido |
| 403 | Forbidden | Sem permissão para ação |
| 404 | Not Found | Recurso não encontrado |
| 409 | Conflict | Conflito (ex: email duplicado) |
| 422 | Unprocessable Entity | Regra de negócio violada |
| 429 | Too Many Requests | Rate limit excedido |
| 500 | Internal Server Error | Erro no servidor |

---

## Exemplos de Payload

### Registro de Usuário
```json
// POST /auth/register
{
  "name": "João Silva",
  "email": "joao@email.com",
  "password": "SenhaSegura123!",
  "phone": "+5511999999999"
}
```

### Criar Pacote
```json
// POST /packages
{
  "name": "Plano Growth Mensal",
  "category": "assinatura",
  "price": 997.00,
  "videoQuantity": 12,
  "maxDurationMinutes": 3,
  "validityDays": null,
  "loyaltyMonths": 3,
  "deliveryDays": 5,
  "serviceTypes": ["reels_standard", "reels_premium"],
  "description": "Ideal para creators em crescimento",
  "features": [
    "12 vídeos por mês",
    "Entrega em 5 dias úteis",
    "2 revisões por vídeo"
  ],
  "badge": "Popular"
}
```

### Criar Pedido
```json
// POST /orders
{
  "title": "Reels Lançamento Produto X",
  "briefing": "Vídeo de 30 segundos mostrando o produto...\n\nReferências: https://instagram.com/...",
  "sourceFilesUrl": "https://drive.google.com/folder/...",
  "serviceType": "reels_standard",
  "deadline": "2024-02-25"
}
```

---

## Rate Limiting

| Endpoint | Limite | Janela |
|----------|--------|--------|
| `/auth/*` | 10 | 1 min |
| `/orders` POST | 20 | 1 hora |
| Outros | 100 | 1 min |

---

## Webhooks e Notificações Externas

O backend dispara webhooks automaticamente quando notificações são criadas. Este processo é **interno** e não expõe endpoints públicos.

### Eventos e Webhooks

Quando uma notificação é criada no sistema, o backend .NET automaticamente:
1. Persiste a notificação no banco de dados
2. Dispara um HTTP POST para o webhook configurado via variável de ambiente
3. O serviço externo (N8n, Make, Zapier) processa e envia WhatsApp/Email

```
Eventos que disparam webhooks:
├── order.created         → Novo pedido criado
├── order.status_changed  → Status do pedido alterado
├── order.completed       → Pedido aprovado pelo cliente
├── assignment.created    → Pacote atribuído a cliente
└── balance.low           → Saldo baixo (< 2 serviços)
```

### Configuração

Endpoints de webhook são configurados via variáveis de ambiente no backend:

```bash
WEBHOOK_NOTIFICATION_URL=https://hooks.n8n.cloud/webhook/media8-notify
```

Para detalhes completos sobre o fluxo de webhooks, consulte a seção **Eventos e Webhooks** em [ARCHITECTURE.md](./ARCHITECTURE.md).

---

## Próximos Passos

Consulte [SECURITY.md](./SECURITY.md) para detalhes sobre autenticação, autorização e políticas de segurança.
