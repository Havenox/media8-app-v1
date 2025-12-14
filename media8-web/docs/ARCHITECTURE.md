# Media 8 - Arquitetura do Sistema

Este documento fornece uma visão geral da arquitetura completa da plataforma Media 8, integrando frontend, backend e banco de dados.

---

## Sumário

1. [Visão Geral](#visão-geral)
2. [Stack Tecnológico](#stack-tecnológico)
3. [Fluxo de Dados](#fluxo-de-dados)
4. [Entidades e Relacionamentos](#entidades-e-relacionamentos)
5. [Padrões de Integração](#padrões-de-integração)
6. [Configuração de Ambiente](#configuração-de-ambiente)

---

## Visão Geral

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND                                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │   React 19  │  │  TanStack   │  │   Tailwind  │  │   shadcn/ui │    │
│  │  + TypeScript│  │   Query     │  │     CSS     │  │   + Radix   │    │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘    │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                     Service Layer (Hooks)                         │   │
│  │   useAuth  │  useOrders  │  useServiceBalances  │  usePackages   │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │ HTTPS / JWT
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                              BACKEND API                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │  .NET 10    │  │   ASP.NET   │  │   Entity    │  │ HTTP Client │    │
│  │   (C#)      │  │  Core Web API│  │   Framework │  │  (Webhooks) │    │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘    │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                      Middleware Pipeline                          │   │
│  │  Auth  │  RateLimiting  │  Validation  │  ErrorHandling  │ CORS  │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │ PostgreSQL Protocol
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           DATABASE (PostgreSQL)                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │ PostgreSQL  │  │  Docker     │  │   Triggers  │  │  Functions  │    │
│  │   (Alpine)  │  │  Container  │  │             │  │  (plpgsql)  │    │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘    │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                      JWT Bearer Authentication                    │   │
│  │               Geração de JWT no Backend .NET                      │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Stack Tecnológico

### Infraestrutura

| Tecnologia | Propósito |
|------------|-----------|
| Docker | Containerização |
| Docker Compose | Orquestração local |

### Frontend (em uso)

| Tecnologia | Versão | Propósito |
|------------|--------|-----------|
| React | 18.3+ | UI Library |
| TypeScript | 5.0+ | Type Safety |
| Vite | 5.0+ | Build Tool |
| TanStack Query | 5.0+ | Server State |
| React Router | 6.30+ | Routing |
| Tailwind CSS | 3.4+ | Styling |
| shadcn/ui (Radix UI) | latest | UI Components |
| Lucide React | latest | Icons |
| React Hook Form | 7.0+ | Forms |
| Zod | 3.0+ | Validation |
| Framer Motion | 12.0+ | Animations |
| Axios | 1.0+ | HTTP Client |

### Backend (planejado)

| Tecnologia | Versão | Propósito |
|------------|--------|-----------|
| .NET | 10.0 | Runtime |
| ASP.NET Core | 10.0 | Web API Framework |
| Entity Framework Core | 10.0 | ORM |
| JWT Bearer | - | Autenticação |
| HTTP Client | - | Notificações via Webhooks externos |

> **Nota:** Configuração **estritamente** via Variáveis de Ambiente (`.env`). Nenhuma secret em arquivos JSON.

### Database

| Tecnologia | Versão | Propósito |
|------------|--------|-----------|
| PostgreSQL | Alpine (latest) | Database em Docker |

---

## Fluxo de Dados

### Fluxo de Autenticação

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  User    │────▶│ Frontend │────▶│ Backend  │────▶│PostgreSQL│
│          │     │          │     │ .NET API │     │ (Docker) │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
     │                │                │                │
     │  1. Login      │                │                │
     │  credentials   │                │                │
     │───────────────▶│                │                │
     │                │  2. POST       │                │
     │                │  /auth/login   │                │
     │                │───────────────▶│                │
     │                │                │  3. Validate   │
     │                │                │  user/password │
     │                │                │───────────────▶│
     │                │                │                │
     │                │                │  4. User data  │
     │                │                │◀───────────────│
     │                │                │                │
     │                │                │  5. Generate   │
     │                │                │  JWT Token     │
     │                │  6. Token +    │                │
     │                │  User data     │                │
     │                │◀───────────────│                │
     │  7. Store      │                │                │
     │  token,        │                │                │
     │  redirect      │                │                │
     │◀───────────────│                │                │
```

### Fluxo de Criação de Pedido

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Client  │────▶│ Frontend │────▶│ Backend  │────▶│ Database │
│          │     │          │     │   API    │     │ (RLS)    │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
     │                │                │                │
     │  1. Preenche   │                │                │
     │  formulário    │                │                │
     │───────────────▶│                │                │
     │                │  2. Valida     │                │
     │                │  com Zod       │                │
     │                │─────┐          │                │
     │                │     │          │                │
     │                │◀────┘          │                │
     │                │                │                │
     │                │  3. POST       │                │
     │                │  /orders       │                │
     │                │───────────────▶│                │
     │                │                │  4. Valida     │
     │                │                │  permissão     │
     │                │                │─────┐          │
     │                │                │     │          │
     │                │                │◀────┘          │
     │                │                │                │
     │                │                │  5. Verifica   │
     │                │                │  saldo         │
     │                │                │───────────────▶│
     │                │                │                │
     │                │                │  6. Consome    │
     │                │                │  serviço       │
     │                │                │───────────────▶│
     │                │                │                │
     │                │                │  7. Cria       │
     │                │                │  pedido        │
     │                │                │───────────────▶│
     │                │                │                │
     │                │  8. Order      │                │
     │                │  created       │                │
     │                │◀───────────────│                │
     │                │                │                │
     │  9. Atualiza   │                │                │
     │  UI + toast    │                │                │
     │◀───────────────│                │                │
```

### Fluxo de Atribuição de Pacote

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Admin   │────▶│ Frontend │────▶│ Backend  │────▶│ Database │
│          │     │          │     │   API    │     │          │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
     │                │                │                │
     │  1. Seleciona  │                │                │
     │  cliente +     │                │                │
     │  pacote        │                │                │
     │───────────────▶│                │                │
     │                │  2. POST       │                │
     │                │  /assignments  │                │
     │                │───────────────▶│                │
     │                │                │  3. Verifica   │
     │                │                │  admin role    │
     │                │                │───────────────▶│
     │                │                │                │
     │                │                │  4. Cria       │
     │                │                │  assignment    │
     │                │                │───────────────▶│
     │                │                │                │
     │                │                │  5. TRIGGER:   │
     │                │                │  Cria lotes    │
     │                │                │  de serviço    │
     │                │                │◀──────────────▶│
     │                │                │                │
     │                │                │  6. Cria       │
     │                │                │  notificação   │
     │                │                │───────────────▶│
     │                │                │                │
     │                │  7. Success    │                │
     │                │◀───────────────│                │
     │  8. Toast +    │                │                │
     │  atualiza      │                │                │
     │  lista         │                │                │
     │◀───────────────│                │                │
```

---

## Entidades e Relacionamentos

### Diagrama de Entidades

```
                                    ┌─────────────────┐
                                    │      users      │
                                    │   (PostgreSQL)  │
                                    └────────┬────────┘
                                             │
                    ┌────────────────────────┼────────────────────────┐
                    │                        │                        │
                    ▼                        ▼                        ▼
           ┌────────────────┐       ┌────────────────┐       ┌────────────────┐
           │   user_roles   │       │    profiles    │       │  notifications │
           │                │       │                │       │                │
           │ • user_id (FK) │       │ • user_id (FK) │       │ • user_id (FK) │
           │ • role         │       │ • name         │       │ • title        │
           └────────────────┘       │ • phone        │       │ • message      │
                                    │ • avatar_url   │       │ • read         │
                                    └────────────────┘       └────────────────┘
                                             │
                    ┌────────────────────────┴────────────────────────┐
                    │                                                 │
                    ▼                                                 ▼
           ┌────────────────┐                                ┌────────────────┐
           │     orders     │                                │   package_     │
           │                │                                │  assignments   │
           │ • client_id    │                                │                │
           │ • editor_id    │◀───────────┐                   │ • client_id    │
           │ • title        │            │                   │ • package_id   │
           │ • status       │            │                   │ • assigned_by  │
           │ • service_type │            │                   │ • status       │
           │ • deadline     │            │                   └───────┬────────┘
           └───────┬────────┘            │                           │
                   │                     │                           │
                   ▼                     │                           ▼
           ┌────────────────┐            │                   ┌────────────────┐
           │ order_timelines│            │                   │ service_balance│
           │                │            │                   │     _lots      │
           │ • order_id (FK)│            │                   │                │
           │ • user_id (FK) │            │                   │ • user_id (FK) │
           │ • action_type  │            │                   │ • service_type │
           │ • content      │            │                   │ • quantity     │
           └────────────────┘            │                   │ • remaining    │
                                         │                   │ • expires_at   │
                                         │                   │ • assignment_id│
                                         │                   └────────────────┘
                                         │
                                ┌────────┴────────┐
                                │    packages     │
                                │                 │
                                │ • name          │
                                │ • category      │
                                │ • price         │
                                │ • video_quantity│
                                │ • service_types │
                                │ • features      │
                                └─────────────────┘
```

### Cardinalidades

| Relacionamento | Cardinalidade | Descrição |
|----------------|---------------|-----------|
| User → Profile | 1:1 | Cada usuário tem exatamente um perfil |
| User → UserRole | 1:N | Usuário pode ter múltiplas roles (futuro) |
| User → Orders (client) | 1:N | Cliente pode ter muitos pedidos |
| User → Orders (editor) | 1:N | Editor pode ter muitos pedidos atribuídos |
| User → PackageAssignments | 1:N | Cliente pode ter múltiplas atribuições |
| Package → PackageAssignments | 1:N | Pacote pode ser atribuído a muitos clientes |
| PackageAssignment → ServiceBalanceLots | 1:N | Atribuição cria múltiplos lotes |
| Order → OrderTimelines | 1:N | Pedido tem múltiplas entradas de timeline |
| User → Notifications | 1:N | Usuário pode ter muitas notificações |

---

## Padrões de Integração

### Frontend: Service Layer Pattern

```typescript
// src/hooks/useOrders.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderService } from '@/services/orderService';

export const useOrders = (filters?: OrderFilters) => {
  return useQuery({
    queryKey: ['orders', filters],
    queryFn: () => orderService.getOrders(filters),
  });
};

export const useCreateOrder = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: orderService.createOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['service-balances'] });
    },
  });
};
```

```typescript
// src/services/orderService.ts
import { api } from '@/lib/api';
import { Order, CreateOrderRequest } from '@/types/api';

const USE_DEMO_DATA = !import.meta.env.VITE_API_URL;

export const orderService = {
  async getOrders(filters?: OrderFilters): Promise<Order[]> {
    if (USE_DEMO_DATA) {
      return demoOrders.filter(/* apply filters */);
    }
    
    const { data } = await api.get('/orders', { params: filters });
    return data.data;
  },
  
  async createOrder(request: CreateOrderRequest): Promise<Order> {
    if (USE_DEMO_DATA) {
      // Simular criação
      return { ...request, id: 'new-id', status: 'pending' };
    }
    
    const { data } = await api.post('/orders', request);
    return data.data;
  },
};
```

### Backend: Clean Architecture

```
src/
├── Media8.Api/                    # Presentation Layer
│   ├── Controllers/
│   │   ├── AuthController.cs
│   │   ├── OrdersController.cs
│   │   ├── PackagesController.cs
│   │   └── UsersController.cs
│   ├── Middleware/
│   │   ├── AuthenticationMiddleware.cs
│   │   └── ErrorHandlingMiddleware.cs
│   └── Program.cs
│
├── Media8.Application/            # Application Layer
│   ├── Services/
│   │   ├── IOrderService.cs
│   │   ├── OrderService.cs
│   │   ├── IPackageService.cs
│   │   └── PackageService.cs
│   ├── DTOs/
│   │   ├── CreateOrderDto.cs
│   │   └── OrderResponseDto.cs
│   └── Validators/
│       └── CreateOrderValidator.cs
│
├── Media8.Domain/                 # Domain Layer
│   ├── Entities/
│   │   ├── Order.cs
│   │   ├── Package.cs
│   │   └── ServiceBalanceLot.cs
│   ├── Enums/
│   │   ├── OrderStatus.cs
│   │   └── ServiceType.cs
│   └── Interfaces/
│       └── IOrderRepository.cs
│
└── Media8.Infrastructure/         # Infrastructure Layer
    ├── Repositories/
    │   ├── OrderRepository.cs
    │   └── PackageRepository.cs
    ├── Data/
    │   └── ApplicationDbContext.cs
    └── External/
        └── WebhookNotificationService.cs  # HTTP Client para webhooks externos
```

### Comunicação Frontend ↔ Backend

```typescript
// src/lib/api.ts
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token
api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para tratar erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      removeStoredToken();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

---

## Configuração de Ambiente

### Frontend (.env)

```bash
# API
VITE_API_URL=https://api.media8.com.br/api/v1
```

### Backend (.env)

> **IMPORTANTE:** Toda configuração do backend é feita via variáveis de ambiente. **Nenhuma secret deve estar em arquivos JSON.**

```bash
# Database (PostgreSQL em Docker)
DB_HOST=postgres
DB_PORT=5432
DB_NAME=media8
DB_USER=postgres
DB_PASSWORD=strong-password-here

# JWT Authentication
JWT_SECRET=your-256-bit-secret-here
JWT_ISSUER=media8.com.br
JWT_AUDIENCE=media8-app
JWT_EXPIRES_MINUTES=60

# CORS
ALLOWED_ORIGINS=https://media8.com.br,https://www.media8.com.br

# Webhooks (Notificações externas)
WEBHOOK_NOTIFICATION_URL=https://hooks.external-service.com/notify

# Rate Limiting
RATE_LIMIT_AUTH=10
RATE_LIMIT_API=100
RATE_LIMIT_WINDOW_MINUTES=1
```

### Docker Compose (docker-compose.yml)

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:alpine
    environment:
      POSTGRES_DB: ${DB_NAME}
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  api:
    build: ./backend
    environment:
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_NAME=${DB_NAME}
      - DB_USER=${DB_USER}
      - DB_PASSWORD=${DB_PASSWORD}
      - JWT_SECRET=${JWT_SECRET}
      - JWT_ISSUER=${JWT_ISSUER}
      - JWT_AUDIENCE=${JWT_AUDIENCE}
      - ALLOWED_ORIGINS=${ALLOWED_ORIGINS}
    ports:
      - "5000:80"
    depends_on:
      - postgres

volumes:
  postgres_data:
```

### Variáveis de Ambiente (Production)

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `DB_HOST` | Host do PostgreSQL | `postgres` |
| `DB_PORT` | Porta do PostgreSQL | `5432` |
| `DB_NAME` | Nome do banco de dados | `media8` |
| `DB_USER` | Usuário do PostgreSQL | `postgres` |
| `DB_PASSWORD` | Senha do PostgreSQL | `strong-password-here` |
| `JWT_SECRET` | Secret para assinar JWTs (min 256 bits) | `your-256-bit-secret` |
| `JWT_ISSUER` | Issuer do JWT | `media8.com.br` |
| `JWT_AUDIENCE` | Audience do JWT | `media8-app` |
| `ALLOWED_ORIGINS` | CORS origins permitidas | `https://media8.com.br` |
| `WEBHOOK_NOTIFICATION_URL` | URL para notificações via webhook | `https://hooks.example.com` |

---

## Eventos e Webhooks

O sistema utiliza notificações internas como gatilho para disparo de comunicações externas (WhatsApp, Email, etc) via HTTP Client.

### Fluxo de Notificação e Webhook

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Evento do     │     │    Backend      │     │  HTTP Client    │     │   Serviço       │
│    Sistema      │     │     .NET        │     │   (Webhook)     │     │    Externo      │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │                       │
         │  1. Evento ocorre     │                       │                       │
         │  (ex: pedido criado)  │                       │                       │
         │──────────────────────>│                       │                       │
         │                       │                       │                       │
         │                       │  2. Cria notificação  │                       │
         │                       │  no banco de dados    │                       │
         │                       │───────┐               │                       │
         │                       │       │               │                       │
         │                       │<──────┘               │                       │
         │                       │                       │                       │
         │                       │  3. Dispara webhook   │                       │
         │                       │──────────────────────>│                       │
         │                       │                       │                       │
         │                       │                       │  4. POST para         │
         │                       │                       │  serviço externo      │
         │                       │                       │  (N8n, Make, Zapier)  │
         │                       │                       │──────────────────────>│
         │                       │                       │                       │
         │                       │                       │                       │  5. Envia WhatsApp
         │                       │                       │                       │  ou Email
```

### Eventos que Disparam Webhooks

| Evento | Tipo de Notificação | Destinatário | Ação Externa |
|--------|---------------------|--------------|--------------|
| Pedido criado | `order` | Admin/Editor | WhatsApp + Email |
| Status alterado para `in_review` | `order` | Client | WhatsApp |
| Pedido aprovado | `success` | Editor | Notificação interna |
| Alterações solicitadas | `warning` | Editor | WhatsApp |
| Pacote atribuído | `success` | Client | WhatsApp + Email |
| Saldo baixo (< 2 serviços) | `warning` | Client | WhatsApp |

### Configuração de Webhooks

Os endpoints de webhook são configurados via variáveis de ambiente:

```bash
# Webhook principal para notificações
WEBHOOK_NOTIFICATION_URL=https://hooks.n8n.cloud/webhook/media8-notify

# Webhooks específicos (opcional)
WEBHOOK_ORDER_CREATED_URL=https://hooks.make.com/order-created
WEBHOOK_BALANCE_LOW_URL=https://hooks.zapier.com/balance-warning
```

### Payload do Webhook

```json
{
  "event": "order.created",
  "timestamp": "2024-02-15T10:30:00Z",
  "data": {
    "notification": {
      "id": "uuid",
      "userId": "uuid",
      "title": "Novo pedido recebido",
      "message": "Cliente João Silva criou um novo pedido de Reels",
      "type": "order",
      "link": "/orders/uuid"
    },
    "context": {
      "orderId": "uuid",
      "clientName": "João Silva",
      "clientPhone": "+5511999999999",
      "clientEmail": "joao@email.com",
      "serviceType": "reels_standard"
    }
  }
}
```

### Implementação no Backend

```csharp
// Infrastructure/External/WebhookNotificationService.cs
public class WebhookNotificationService : INotificationService
{
    private readonly HttpClient _httpClient;
    private readonly string _webhookUrl;

    public WebhookNotificationService(HttpClient httpClient, IConfiguration config)
    {
        _httpClient = httpClient;
        _webhookUrl = Environment.GetEnvironmentVariable("WEBHOOK_NOTIFICATION_URL");
    }

    public async Task NotifyAsync(Notification notification, NotificationContext context)
    {
        // 1. Salvar notificação no banco
        await _notificationRepository.CreateAsync(notification);
        
        // 2. Disparar webhook (fire and forget ou com retry)
        var payload = new WebhookPayload
        {
            Event = MapToEventName(notification.Type),
            Timestamp = DateTime.UtcNow,
            Data = new { notification, context }
        };
        
        await _httpClient.PostAsJsonAsync(_webhookUrl, payload);
    }
}
```

### Integrações Suportadas

O sistema é projetado para integrar com qualquer plataforma de automação via webhook:

- **N8n** (self-hosted): Automações complexas com múltiplas etapas
- **Make (Integromat)**: Cenários visuais para WhatsApp/Email
- **Zapier**: Integrações rápidas com milhares de apps
- **Webhook direto**: Qualquer API que aceite POST HTTP

---

## Documentos Relacionados

- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) - Esquema completo do banco de dados
- [API_ROUTES.md](./API_ROUTES.md) - Documentação de todas as rotas da API
- [SECURITY.md](./SECURITY.md) - Políticas de segurança
