# Media 8 - Segurança e Autorização

Este documento detalha as políticas de segurança, práticas de autorização e medidas de proteção implementadas na plataforma Media 8.

---

## Sumário

1. [Princípios de Segurança](#princípios-de-segurança)
2. [Autenticação](#autenticação)
3. [Autorização (RBAC)](#autorização-rbac)
4. [Row Level Security (RLS)](#row-level-security-rls)
5. [Proteções Contra Ataques](#proteções-contra-ataques)
6. [Checklist de Segurança](#checklist-de-segurança)

---

## Princípios de Segurança

### Defense in Depth (Defesa em Profundidade)

A aplicação implementa múltiplas camadas de proteção:

```
┌─────────────────────────────────────────────────────────────┐
│                      CAMADA 1: Frontend                      │
│  • Validação de input com Zod                               │
│  • Sanitização de dados                                      │
│  • HTTPS obrigatório                                         │
└─────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    CAMADA 2: API Backend                     │
│  • Autenticação JWT                                          │
│  • Rate Limiting                                             │
│  • Validação de permissões (RBAC)                           │
│  • Validação de input server-side                           │
└─────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    CAMADA 3: Banco de Dados                  │
│  • Row Level Security (RLS)                                  │
│  • Constraints de integridade                                │
│  • Security Definer Functions                                │
└─────────────────────────────────────────────────────────────┘
```

### Princípio do Menor Privilégio

- Usuários só têm acesso ao que precisam
- Roles separadas: Client, Editor, Admin
- Cada ação verifica permissões no backend E no banco

### Zero Trust

- Nunca confiar em dados do cliente
- Validar TUDO no servidor
- Token JWT verificado em cada request
- RLS como última linha de defesa

---

## Autenticação

### JWT (JSON Web Tokens)

```
┌─────────────────────────────────────────────────────────────┐
│                         JWT Token                            │
├─────────────────────────────────────────────────────────────┤
│ Header:   { "alg": "HS256", "typ": "JWT" }                  │
├─────────────────────────────────────────────────────────────┤
│ Payload:  {                                                  │
│   "sub": "user-uuid",                                        │
│   "email": "user@email.com",                                │
│   "role": "client",         ← NÃO CONFIAR! Verificar no DB  │
│   "iat": 1700000000,                                         │
│   "exp": 1700003600                                          │
│ }                                                            │
├─────────────────────────────────────────────────────────────┤
│ Signature: HMACSHA256(header + payload, secret)              │
└─────────────────────────────────────────────────────────────┘
```

### ⚠️ CRÍTICO: Nunca Confiar no Role do Token

```csharp
// ❌ ERRADO - Confiar no claim do token
var role = User.FindFirst("role")?.Value;
if (role == "admin") { /* permitir */ }

// ✅ CORRETO - Sempre verificar no banco de dados
var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
var isAdmin = await _roleService.HasRole(userId, AppRole.Admin);
if (isAdmin) { /* permitir */ }
```

### Configuração de Tokens (via Variáveis de Ambiente)

> **IMPORTANTE:** Configuração **estritamente** via variáveis de ambiente. Nenhuma secret em JSON.

```bash
# .env
JWT_SECRET=your-256-bit-secret-here  # Min 256 bits
JWT_ISSUER=media8.com.br
JWT_AUDIENCE=media8-app
JWT_EXPIRES_MINUTES=60
JWT_REFRESH_EXPIRES_DAYS=7
```

```csharp
// Program.cs - Leitura das variáveis
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = Environment.GetEnvironmentVariable("JWT_ISSUER"),
            ValidateAudience = true,
            ValidAudience = Environment.GetEnvironmentVariable("JWT_AUDIENCE"),
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(Environment.GetEnvironmentVariable("JWT_SECRET")!)
            )
        };
    });
```

### Refresh Tokens

- Access Token: 1 hora
- Refresh Token: 7 dias
- Refresh Token rotativo (novo token a cada refresh)
- Armazenado em httpOnly cookie (não localStorage)

---

## Autorização (RBAC)

### Roles do Sistema

| Role | Descrição | Permissões |
|------|-----------|------------|
| `client` | Cliente final | Ver próprios pedidos, criar pedidos, ver próprio saldo |
| `editor` | Editor de vídeo | Ver pedidos atribuídos, atualizar status, fazer upload |
| `admin` | Administrador | Acesso total, gerenciar usuários, atribuir pacotes |

### ⚠️ CRÍTICO: Roles em Tabela Separada

**NUNCA** armazene roles na tabela `profiles` ou `users`:

```sql
-- ❌ ERRADO - Role na tabela profiles (VULNERÁVEL!)
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES public.users(id),
  name TEXT,
  role TEXT  -- PERIGOSO! Usuário pode tentar modificar
);

-- ✅ CORRETO - Role em tabela separada com controle restritivo
CREATE TABLE user_roles (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES public.users(id),
  role app_role NOT NULL
);
```

### Motivo: Prevenção de Privilege Escalation

Se role estiver em `profiles`:
1. Usuário malicioso encontra endpoint vulnerável
2. Tenta `UPDATE profiles SET role = 'admin' WHERE user_id = 'meu-id'`
3. Se RLS não estiver perfeito → **ESCALAÇÃO DE PRIVILÉGIO**

Com tabela separada:
1. `user_roles` tem RLS ultra-restritivo
2. Apenas funções `SECURITY DEFINER` podem modificar
3. Nenhum endpoint público permite UPDATE em roles

### Middleware de Autorização (.NET)

```csharp
// Atributo para proteger endpoints
[Authorize]
[RequireRole(AppRole.Admin)]
public class PackagesController : ControllerBase
{
    // Apenas admins podem acessar
}

// Implementação do atributo
public class RequireRoleAttribute : AuthorizeAttribute, IAuthorizationFilter
{
    private readonly AppRole[] _roles;

    public RequireRoleAttribute(params AppRole[] roles)
    {
        _roles = roles;
    }

    public void OnAuthorization(AuthorizationFilterContext context)
    {
        var userId = context.HttpContext.User
            .FindFirst(ClaimTypes.NameIdentifier)?.Value;
        
        if (string.IsNullOrEmpty(userId))
        {
            context.Result = new UnauthorizedResult();
            return;
        }

        var roleService = context.HttpContext.RequestServices
            .GetRequiredService<IRoleService>();
        
        // SEMPRE verificar no banco, NUNCA confiar no token
        var hasRole = await roleService.HasAnyRole(
            Guid.Parse(userId), 
            _roles
        );
        
        if (!hasRole)
        {
            context.Result = new ForbidResult();
        }
    }
}
```

### Serviço de Roles

```csharp
public interface IRoleService
{
    Task<bool> HasRole(Guid userId, AppRole role);
    Task<bool> HasAnyRole(Guid userId, params AppRole[] roles);
    Task<AppRole?> GetUserRole(Guid userId);
    Task SetUserRole(Guid userId, AppRole role); // Apenas admin
}

public class RoleService : IRoleService
{
    private readonly IDbConnection _db;

    public async Task<bool> HasRole(Guid userId, AppRole role)
    {
        // Chama function SECURITY DEFINER do PostgreSQL
        return await _db.QuerySingleAsync<bool>(
            "SELECT public.has_role(@userId, @role::app_role)",
            new { userId, role = role.ToString().ToLower() }
        );
    }
}
```

---

## Row Level Security (RLS)

### Controle de Acesso no Backend

Como o backend .NET gerencia toda a autenticação e autorização, o controle de acesso é feito via:

1. **Middleware de Autenticação JWT** - Valida tokens em cada request
2. **Atributos de Autorização** - `[RequireRole(AppRole.Admin)]` em controllers
3. **Verificação de Ownership** - Queries filtradas por `userId` no backend
4. **Validação em Camada de Serviço** - Regras de negócio antes de acessar o banco

```csharp
// Exemplo: Apenas admins podem acessar
[Authorize]
[RequireRole(AppRole.Admin)]
public class PackagesController : ControllerBase { }

// Exemplo: Filtrar por ownership no serviço
public async Task<List<Order>> GetClientOrders(Guid clientId, Guid requestingUserId)
{
    // Verificar que o usuário está pedindo seus próprios dados
    if (clientId != requestingUserId && !await _roleService.HasRole(requestingUserId, AppRole.Admin))
        throw new ForbiddenException();
    
    return await _orderRepository.GetByClientId(clientId);
}
```

### Segurança no Banco de Dados

#### `user_roles` (ULTRA RESTRITIVO)

```sql
-- Ninguém pode inserir/atualizar/deletar diretamente
-- Apenas via trigger ou function SECURITY DEFINER

CREATE POLICY "Users can view own role"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- SEM policies de INSERT/UPDATE/DELETE para usuários!
-- Modificações apenas via functions SECURITY DEFINER
```

#### `profiles`

```sql
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Admins NÃO podem editar perfis alheios (princípio menor privilégio)
```

#### `packages`

```sql
-- Pacotes ativos são públicos (para landing page)
CREATE POLICY "Anyone can view active packages"
  ON public.packages FOR SELECT
  USING (is_active = true);

-- Apenas admins podem gerenciar pacotes
CREATE POLICY "Admins can manage packages"
  ON public.packages FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
```

#### `package_assignments`

```sql
-- Clientes veem próprias atribuições
CREATE POLICY "Clients can view own assignments"
  ON public.package_assignments FOR SELECT
  TO authenticated
  USING (client_id = auth.uid());

-- Admins podem ver e criar atribuições
CREATE POLICY "Admins can manage assignments"
  ON public.package_assignments FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
```

#### `service_balance_lots`

```sql
-- Clientes veem próprios lotes
CREATE POLICY "Clients can view own lots"
  ON public.service_balance_lots FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Admins podem ver todos
CREATE POLICY "Admins can view all lots"
  ON public.service_balance_lots FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Consumo apenas via function SECURITY DEFINER
-- SEM policy de UPDATE direto para clientes!
```

#### `orders`

```sql
-- Clientes veem próprios pedidos
CREATE POLICY "Clients can view own orders"
  ON public.orders FOR SELECT
  TO authenticated
  USING (client_id = auth.uid());

-- Editores veem pedidos atribuídos
CREATE POLICY "Editors can view assigned orders"
  ON public.orders FOR SELECT
  TO authenticated
  USING (
    editor_id = auth.uid() 
    AND public.has_role(auth.uid(), 'editor')
  );

-- Admins veem todos
CREATE POLICY "Admins can view all orders"
  ON public.orders FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Clientes podem criar pedidos (consumo validado em function)
CREATE POLICY "Clients can create orders"
  ON public.orders FOR INSERT
  TO authenticated
  WITH CHECK (
    client_id = auth.uid()
    AND public.has_role(auth.uid(), 'client')
  );

-- Editors podem atualizar pedidos atribuídos (status, final_video_url)
CREATE POLICY "Editors can update assigned orders"
  ON public.orders FOR UPDATE
  TO authenticated
  USING (editor_id = auth.uid())
  WITH CHECK (editor_id = auth.uid());

-- Admins podem atualizar qualquer pedido
CREATE POLICY "Admins can update any order"
  ON public.orders FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
```

#### `notifications`

```sql
-- Usuários veem apenas próprias notificações
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Usuários podem marcar próprias notificações como lidas
CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Sistema cria notificações (via service role)
CREATE POLICY "Service can create notifications"
  ON public.notifications FOR INSERT
  TO service_role
  WITH CHECK (true);
```

---

## Proteções Contra Ataques

### 1. Privilege Escalation (Escalação de Privilégio)

**Ataque**: Usuário tenta mudar própria role para admin.

**Proteções**:
- ✅ Roles em tabela separada (`user_roles`)
- ✅ RLS ultra-restritivo em `user_roles`
- ✅ Sem endpoints de UPDATE para roles (exceto admin)
- ✅ Verificação de role sempre no banco, nunca no token

```sql
-- Mesmo se encontrar brecha, RLS bloqueia
UPDATE user_roles SET role = 'admin' WHERE user_id = 'meu-id';
-- ERROR: new row violates row-level security policy
```

### 2. IDOR (Insecure Direct Object Reference)

**Ataque**: Cliente acessa pedido de outro cliente via URL.

**Proteções**:
- ✅ RLS verifica `client_id = auth.uid()`
- ✅ API valida ownership antes de retornar dados
- ✅ UUIDs não-sequenciais dificultam brute force

```csharp
// Backend SEMPRE verifica ownership
public async Task<Order?> GetOrder(Guid orderId, Guid requestingUserId)
{
    var order = await _orderRepo.GetById(orderId);
    
    if (order == null) return null;
    
    // Verificar permissão
    var userRole = await _roleService.GetUserRole(requestingUserId);
    
    if (userRole == AppRole.Client && order.ClientId != requestingUserId)
        throw new ForbiddenException();
    
    if (userRole == AppRole.Editor && order.EditorId != requestingUserId)
        throw new ForbiddenException();
    
    return order;
}
```

### 3. Manipulação de Saldo

**Ataque**: Cliente tenta adicionar serviços à própria conta.

**Proteções**:
- ✅ `service_balance_lots` sem policy de INSERT para clientes
- ✅ Lotes criados apenas por trigger de `package_assignments`
- ✅ Consumo via function `SECURITY DEFINER`
- ✅ Backend valida saldo antes de criar pedido

```sql
-- Tentativa de inserir lote falha
INSERT INTO service_balance_lots (user_id, service_type, quantity, remaining_quantity)
VALUES ('meu-id', 'reels_standard', 100, 100);
-- ERROR: new row violates row-level security policy
```

### 4. Bypass de Deadline

**Ataque**: Cliente cria pedido com deadline impossível.

**Proteções**:
- ✅ Validação no frontend (UX)
- ✅ Validação no backend (segurança)
- ✅ Regras de deadline por service_type no banco

```csharp
public async Task<Order> CreateOrder(CreateOrderDto dto, Guid clientId)
{
    // Validar deadline mínimo por tipo de serviço
    var minDeadline = GetMinDeadline(dto.ServiceType);
    var requestedDeadline = dto.Deadline.ToDateTime(TimeOnly.MinValue);
    
    if (requestedDeadline < DateTime.Today.AddBusinessDays(minDeadline))
    {
        throw new ValidationException(
            $"Prazo mínimo para {dto.ServiceType} é {minDeadline} dias úteis"
        );
    }
    
    // ... criar pedido
}
```

### 5. SQL Injection

**Proteções**:
- ✅ Queries parametrizadas (Dapper/EF Core)
- ✅ Nunca concatenar strings em SQL
- ✅ Validação de input com tipos fortes

```csharp
// ❌ NUNCA FAZER
var sql = $"SELECT * FROM users WHERE email = '{email}'";

// ✅ SEMPRE FAZER
var sql = "SELECT * FROM users WHERE email = @Email";
await _db.QueryAsync(sql, new { Email = email });
```

### 6. XSS (Cross-Site Scripting)

**Proteções**:
- ✅ React escapa output por padrão
- ✅ Nunca usar `dangerouslySetInnerHTML` com input do usuário
- ✅ Content-Security-Policy headers
- ✅ Sanitização de HTML se necessário (DOMPurify)

### 7. CSRF (Cross-Site Request Forgery)

**Proteções**:
- ✅ Token JWT em header (não cookie)
- ✅ SameSite cookie policy para refresh token
- ✅ Validação de Origin/Referer em requests sensíveis

### 8. Rate Limiting

```csharp
// Program.cs
builder.Services.AddRateLimiter(options =>
{
    options.AddFixedWindowLimiter("auth", opt =>
    {
        opt.Window = TimeSpan.FromMinutes(1);
        opt.PermitLimit = 10;
    });
    
    options.AddFixedWindowLimiter("api", opt =>
    {
        opt.Window = TimeSpan.FromMinutes(1);
        opt.PermitLimit = 100;
    });
});
```

---

## Checklist de Segurança

### Antes de Deploy

- [ ] RLS habilitado em TODAS as tabelas
- [ ] Policies testadas para cada role
- [ ] Roles em tabela separada (`user_roles`)
- [ ] Function `has_role` é `SECURITY DEFINER`
- [ ] JWT secret tem pelo menos 256 bits
- [ ] Refresh tokens em httpOnly cookies
- [ ] Rate limiting configurado
- [ ] HTTPS obrigatório
- [ ] CORS configurado corretamente
- [ ] Logs não expõem dados sensíveis
- [ ] Validação de input em TODOS os endpoints
- [ ] Sem hardcoded secrets no código

### Testes de Segurança

```bash
# 1. Tentar acessar recurso de outro usuário
curl -H "Authorization: Bearer <client_token>" \
  https://api.media8.com.br/api/v1/orders/<outro-user-order-id>
# Esperado: 403 Forbidden

# 2. Tentar escalar privilégio
curl -X PUT -H "Authorization: Bearer <client_token>" \
  -d '{"role": "admin"}' \
  https://api.media8.com.br/api/v1/users/me/role
# Esperado: 403 Forbidden ou 404 Not Found

# 3. Tentar criar lote de serviço
curl -X POST -H "Authorization: Bearer <client_token>" \
  -d '{"serviceType": "reels_standard", "quantity": 100}' \
  https://api.media8.com.br/api/v1/balances/lots
# Esperado: 403 Forbidden ou 404 Not Found

# 4. Tentar acessar endpoint admin
curl -H "Authorization: Bearer <client_token>" \
  https://api.media8.com.br/api/v1/users
# Esperado: 403 Forbidden
```

---

## Conclusão

A segurança da plataforma Media 8 é garantida por:

1. **Autenticação robusta** com JWT e refresh tokens
2. **Autorização em múltiplas camadas** (API + RLS)
3. **Roles em tabela separada** prevenindo escalação
4. **RLS restritivo** como última linha de defesa
5. **Validação de input** em frontend e backend
6. **Princípio do menor privilégio** em todas as decisões

Com essas medidas, mesmo que um atacante:
- Encontre uma vulnerabilidade na API → RLS bloqueia
- Manipule o token JWT → Verificação no banco falha
- Tente SQL injection → Queries parametrizadas protegem
- Acesse URL direta → Ownership validation bloqueia

A aplicação permanece **segura como um cofre**.
