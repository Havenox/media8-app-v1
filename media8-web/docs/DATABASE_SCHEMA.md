# Media 8 - Esquema de Banco de Dados

Este documento descreve a estrutura completa do banco de dados PostgreSQL para a plataforma Media 8.

---

## Sumário

1. [Visão Geral](#visão-geral)
2. [Diagrama ER](#diagrama-er)
3. [Enums](#enums)
4. [Tabelas](#tabelas)
5. [Índices](#índices)
6. [Triggers e Functions](#triggers-e-functions)

---

## Visão Geral

O banco de dados segue os seguintes princípios:

- **Normalização**: Dados normalizados para evitar redundância
- **FIFO para Serviços**: Sistema de lotes com expiração para consumo de serviços
- **Roles Separadas**: Roles de usuário em tabela separada (segurança)
- **Soft Delete**: Registros críticos usam `deleted_at` em vez de DELETE físico
- **Audit Trail**: Timestamps de criação/atualização em todas as tabelas

---

## Diagrama ER

```
┌─────────────────┐       ┌─────────────────────┐       ┌─────────────────┐
│      users      │       │    user_roles       │       │    profiles     │
│─────────────────│       │─────────────────────│       │─────────────────│
│ id (PK)         │◄──────│ user_id (FK)        │       │ id (PK/FK)      │
│ email           │       │ role                │       │ user_id (FK)    │
│ password_hash   │       │                     │       │ name            │
└────────┬────────┘       └─────────────────────┘       │ phone           │
         │                                              │ avatar_url      │
         │                                              └─────────────────┘
         │
         │  ┌─────────────────────────────────────────────────────────────┐
         │  │                                                             │
         ▼  ▼                                                             │
┌─────────────────┐       ┌─────────────────────┐       ┌─────────────────┴───┐
│    packages     │       │ package_assignments │       │ service_balance_lots│
│─────────────────│       │─────────────────────│       │─────────────────────│
│ id (PK)         │◄──────│ package_id (FK)     │       │ id (PK)             │
│ name            │       │ client_id (FK)      │───────│ user_id (FK)        │
│ category        │       │ assigned_by (FK)    │       │ service_type        │
│ price           │       │ status              │       │ quantity            │
│ video_quantity  │       │ activated_at        │       │ remaining_quantity  │
│ ...             │       │ expires_at          │       │ purchased_at        │
└─────────────────┘       └─────────────────────┘       │ expires_at          │
                                                        │ source              │
                                                        │ assignment_id (FK)  │
                                                        └─────────────────────┘
         │
         │
         ▼
┌─────────────────┐       ┌─────────────────────┐
│     orders      │       │   order_timelines   │
│─────────────────│       │─────────────────────│
│ id (PK)         │◄──────│ order_id (FK)       │
│ client_id (FK)  │       │ user_id (FK)        │
│ editor_id (FK)  │       │ action_type         │
│ title           │       │ content             │
│ status          │       │ timestamp           │
│ service_type    │       └─────────────────────┘
│ deadline        │
└─────────────────┘

┌─────────────────┐
│  notifications  │
│─────────────────│
│ id (PK)         │
│ user_id (FK)    │
│ title           │
│ message         │
│ type            │
│ read            │
│ link            │
│ created_at      │
└─────────────────┘
```

---

## Enums

```sql
-- Roles de usuário (Admin, Editor, Cliente)
CREATE TYPE public.app_role AS ENUM ('admin', 'editor', 'client');

-- Categorias de pacote
CREATE TYPE public.package_category AS ENUM ('assinatura', 'pacote', 'avulso');

-- Tipos de serviço disponíveis
CREATE TYPE public.service_type AS ENUM (
  'reels_standard',
  'reels_premium', 
  'youtube_curto',
  'youtube_medio',
  'youtube_longo',
  'pacote_reels',
  'avulso'
);

-- Status de pedido
CREATE TYPE public.order_status AS ENUM (
  'pending',
  'in_progress',
  'in_review',
  'changes_requested',
  'approved'
);

-- Tipos de ação na timeline
CREATE TYPE public.timeline_action_type AS ENUM (
  'status_change',
  'comment',
  'version_upload'
);

-- Status de atribuição de pacote
CREATE TYPE public.assignment_status AS ENUM ('active', 'expired', 'cancelled');

-- Fonte do lote de serviço
CREATE TYPE public.lot_source AS ENUM ('purchase', 'subscription', 'promo', 'gift');

-- Tipos de notificação
CREATE TYPE public.notification_type AS ENUM ('info', 'success', 'warning', 'order');
```

---

## Tabelas

### 1. `users` - Usuários

Tabela principal de usuários com autenticação.

```sql
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índice para busca por email
CREATE INDEX idx_users_email ON public.users(email);
```

---

### 2. `profiles` - Perfis de Usuário

Extende `users` com dados adicionais do perfil.

```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT profiles_user_id_unique UNIQUE (user_id)
);

-- Índice para busca por user_id
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
```

---

### 3. `user_roles` - Roles de Usuário

**CRÍTICO**: Roles DEVEM estar em tabela separada para evitar ataques de escalação de privilégio.

```sql
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'client',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT user_roles_unique UNIQUE (user_id, role)
);

-- Índice para busca por user_id
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
```

---

### 4. `packages` - Pacotes/Planos

Catálogo de pacotes disponíveis para venda/atribuição.

```sql
CREATE TABLE public.packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  category package_category NOT NULL,
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  video_quantity INTEGER NOT NULL CHECK (video_quantity > 0),
  max_duration_minutes INTEGER NOT NULL CHECK (max_duration_minutes > 0),
  validity_days INTEGER, -- NULL = sem expiração (assinatura renova)
  loyalty_months INTEGER NOT NULL DEFAULT 0,
  delivery_days INTEGER NOT NULL DEFAULT 0, -- 0 = a combinar
  service_types service_type[] NOT NULL,
  description TEXT,
  features TEXT[] NOT NULL DEFAULT '{}',
  disclaimer TEXT,
  badge VARCHAR(50),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índice para pacotes ativos
CREATE INDEX idx_packages_active ON public.packages(is_active) WHERE is_active = true;
```

---

### 5. `package_assignments` - Atribuições de Pacote a Clientes

Registra quando um Admin atribui um pacote a um cliente.

```sql
CREATE TABLE public.package_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID NOT NULL REFERENCES public.packages(id) ON DELETE RESTRICT,
  client_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  activated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  status assignment_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_package_assignments_client ON public.package_assignments(client_id);
CREATE INDEX idx_package_assignments_status ON public.package_assignments(status);
CREATE INDEX idx_package_assignments_active ON public.package_assignments(client_id, status) 
  WHERE status = 'active';
```

---

### 6. `service_balance_lots` - Lotes de Saldo de Serviço (FIFO)

Sistema de lotes para consumo de serviços com expiração.

```sql
CREATE TABLE public.service_balance_lots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  service_type service_type NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  remaining_quantity INTEGER NOT NULL CHECK (remaining_quantity >= 0),
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- NULL = não expira
  source lot_source NOT NULL DEFAULT 'purchase',
  assignment_id UUID REFERENCES public.package_assignments(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT remaining_lte_quantity CHECK (remaining_quantity <= quantity)
);

-- Índices para consumo FIFO
CREATE INDEX idx_service_lots_user_type ON public.service_balance_lots(user_id, service_type);
CREATE INDEX idx_service_lots_fifo ON public.service_balance_lots(user_id, service_type, expires_at NULLS LAST)
  WHERE remaining_quantity > 0;
CREATE INDEX idx_service_lots_expiring ON public.service_balance_lots(expires_at)
  WHERE remaining_quantity > 0 AND expires_at IS NOT NULL;
```

---

### 7. `orders` - Pedidos de Edição

Pedidos de edição de vídeo criados pelos clientes.

```sql
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  editor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  briefing TEXT NOT NULL,
  source_files_url TEXT NOT NULL,
  final_video_url TEXT,
  status order_status NOT NULL DEFAULT 'pending',
  service_type service_type NOT NULL,
  deadline DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_orders_client ON public.orders(client_id);
CREATE INDEX idx_orders_editor ON public.orders(editor_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_deadline ON public.orders(deadline);
```

---

### 8. `order_timelines` - Histórico de Pedidos

Timeline de ações e comentários em cada pedido.

```sql
CREATE TABLE public.order_timelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  action_type timeline_action_type NOT NULL,
  content TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índice para buscar timeline de um pedido
CREATE INDEX idx_order_timelines_order ON public.order_timelines(order_id, timestamp DESC);
```

---

### 9. `notifications` - Notificações

Sistema de notificações para usuários. Notificações funcionam como "commits" de eventos do sistema e são o gatilho para disparo de webhooks externos (WhatsApp, Email, etc).

```sql
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type notification_type NOT NULL DEFAULT 'info',
  read BOOLEAN NOT NULL DEFAULT false,
  link TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_notifications_user ON public.notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON public.notifications(user_id, read) 
  WHERE read = false;
CREATE INDEX idx_notifications_type ON public.notifications(type);
```

---

## Índices

Todos os índices estão definidos junto com suas tabelas acima. Resumo:

| Tabela | Índice | Propósito |
|--------|--------|-----------|
| profiles | idx_profiles_user_id | Busca por user_id |
| user_roles | idx_user_roles_user_id | Verificação de role |
| packages | idx_packages_active | Listar pacotes ativos |
| package_assignments | idx_package_assignments_client | Pacotes de um cliente |
| package_assignments | idx_package_assignments_active | Pacote ativo de cliente |
| service_balance_lots | idx_service_lots_fifo | Consumo FIFO |
| service_balance_lots | idx_service_lots_expiring | Lotes próximos de expirar |
| orders | idx_orders_client/editor/status | Filtros de busca |
| order_timelines | idx_order_timelines_order | Timeline de um pedido |
| notifications | idx_notifications_unread | Contagem de não lidas |

---

## Triggers e Functions

### Trigger: Atualizar `updated_at`

```sql
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar em todas as tabelas com updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_packages_updated_at
  BEFORE UPDATE ON public.packages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_package_assignments_updated_at
  BEFORE UPDATE ON public.package_assignments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_service_balance_lots_updated_at
  BEFORE UPDATE ON public.service_balance_lots
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
```

---

### Trigger: Criar Profile e Role após Signup

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Criar profile (nome pode ser passado via aplicação ou extraído do email)
  INSERT INTO public.profiles (user_id, name)
  VALUES (NEW.id, split_part(NEW.email, '@', 1));
  
  -- Atribuir role padrão 'client'
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'client');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_user_created
  AFTER INSERT ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

### Function: Verificar Role (Security Definer)

```sql
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;
```

---

### Function: Obter Role do Usuário

```sql
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;
```

---

### Function: Consumir Serviço (FIFO)

```sql
CREATE OR REPLACE FUNCTION public.consume_service(
  _user_id UUID,
  _service_type service_type,
  _quantity INTEGER DEFAULT 1
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _remaining INTEGER := _quantity;
  _lot RECORD;
  _consumed_lots JSON[] := '{}';
BEGIN
  -- Verificar saldo total disponível
  IF (
    SELECT COALESCE(SUM(remaining_quantity), 0)
    FROM public.service_balance_lots
    WHERE user_id = _user_id
      AND service_type = _service_type
      AND remaining_quantity > 0
      AND (expires_at IS NULL OR expires_at > NOW())
  ) < _quantity THEN
    RETURN json_build_object(
      'success', false,
      'error', 'INSUFFICIENT_BALANCE',
      'message', 'Saldo insuficiente para este serviço'
    );
  END IF;

  -- Consumir lotes em ordem FIFO (expira primeiro)
  FOR _lot IN
    SELECT id, remaining_quantity
    FROM public.service_balance_lots
    WHERE user_id = _user_id
      AND service_type = _service_type
      AND remaining_quantity > 0
      AND (expires_at IS NULL OR expires_at > NOW())
    ORDER BY expires_at NULLS LAST, purchased_at ASC
    FOR UPDATE
  LOOP
    IF _remaining <= 0 THEN
      EXIT;
    END IF;

    IF _lot.remaining_quantity >= _remaining THEN
      -- Este lote é suficiente
      UPDATE public.service_balance_lots
      SET remaining_quantity = remaining_quantity - _remaining
      WHERE id = _lot.id;
      
      _consumed_lots := _consumed_lots || json_build_object(
        'lot_id', _lot.id,
        'consumed', _remaining
      );
      _remaining := 0;
    ELSE
      -- Consome todo este lote e continua
      UPDATE public.service_balance_lots
      SET remaining_quantity = 0
      WHERE id = _lot.id;
      
      _consumed_lots := _consumed_lots || json_build_object(
        'lot_id', _lot.id,
        'consumed', _lot.remaining_quantity
      );
      _remaining := _remaining - _lot.remaining_quantity;
    END IF;
  END LOOP;

  RETURN json_build_object(
    'success', true,
    'consumed_quantity', _quantity,
    'consumed_lots', _consumed_lots
  );
END;
$$;
```

---

## Próximos Passos

Após criar o schema, aplique as políticas de Row Level Security (RLS) conforme documentado em [SECURITY.md](./SECURITY.md).
