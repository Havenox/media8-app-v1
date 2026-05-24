# 01 - Arquitetura e Padrões

> **Objetivo**: Documentar as decisões arquiteturais, padrões de código e princípios de design que regem o Media 8.

---

## 1. Visão Geral da Arquitetura

### Estilo Arquitetural
- **Backend**: Clean Architecture com separação estrita em camadas (Domain, Application, Infrastructure, API)
- **Frontend**: Feature-Based Architecture com hooks customizados e React Query para estado de servidor
- **Comunicação**: HTTPS + JSON com serialização **PascalCase nativa** (.NET `PropertyNamingPolicy = null`)

### Stack Tecnológico

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| Backend Core | .NET | 10 (Preview) |
| Frontend Core | React | 18 |
| Linguagem | TypeScript | 5.x / C# 13 |
| Banco de Dados | PostgreSQL | 15+ |
| ORM | Entity Framework Core | 10 |
| Estado Server-Side | TanStack Query | 5.x |
| UI Framework | shadcn/ui + Tailwind | - |
| Containerização | Docker + Docker Compose | - |

---

## 2. Princípios Fundamentais

### 2.1. O Backend é a Lei
- O backend define contratos, casos de uso e regras de negócio
- Frontend **nunca** deduz, adivinha ou mocka dados
- Se o backend não envia, o frontend não exibe
- Se o backend muda contrato, frontend espelha a mudança

### 2.2. PascalCase Estrito
- **JSON Serializer**: `PropertyNamingPolicy = null` (preserva PascalCase do C#)
- **Frontend Types**: Interfaces TypeScript espelham exatamente DTOs do backend
- **Sem `[JsonPropertyName]`**: Removido para evitar conversões acidentais para camelCase
- **Exceção**: Apenas quando necessário para compatibilidade com APIs externas

### 2.3. Zero Hardcode
- Secrets em variáveis de ambiente (nunca commitados)
- URLs e endpoints injetados via configuração
- Regras de negócio em `Settings` dinâmicos, não em código

---

## 3. Padrões de Código

### Backend (.NET / C#)

#### 3.1. Injeção de Dependência
```csharp
// Primary Constructor (C# 12/13)
public class OrdersController(IServiceBalanceRepository balanceRepository)
{
    private readonly IServiceBalanceRepository _balanceRepository = balanceRepository;
}
```

#### 3.2. Clean Architecture
- **Domain**: Entidades, Enums, Exceções de Domínio
- **Application**: DTOs, Interfaces de Repositório, Services
- **Infrastructure**: Implementação de Repositórios, DbContext
- **API**: Controllers, Middleware, Program.cs

#### 3.3. Tratamento de Erros
- Exceções de negócio com mensagens semânticas (ex: `"PROFILE_IN_USE"`)
- `ProblemDetails` do .NET para respostas de erro 400/422
- Global Exception Handler com logging estruturado (em implementação)

### Frontend (React / TypeScript)

#### 3.4. Hooks Customizados
```typescript
// Padrão: useEntity + PascalCase
const { data, isLoading } = useOffers({ status: 'active' });
// NÃO: useOffers({ status: 'Active' }) ou useOffers({ Status: 'Active' })
```

#### 3.5. Derived State
- **Nunca** use `useEffect` para computar estado a partir de props
- Use `useMemo` apenas para cálculos pesados
- Estado derivado direto no render: `const filtered = items.filter(...)`

#### 3.6. Double-Submit Defense
```typescript
// Sempre desabilite botões durante submit
<button disabled={isPending || isSubmitting}>
  {isPending ? 'Enviando...' : 'Enviar'}
</button>
```

---

## 4. Segurança e RBAC

### 4.1. Autenticação
- **Método**: JWT Bearer Token
- **Armazenamento**: LocalStorage (ciente de riscos XSS)
- **Refresh Token**: **NÃO IMPLEMENTADO** (em backlog)

### 4.2. Controle de Acesso
- **Claims**: `ClaimTypes.NameIdentifier` (UserId), `ClaimTypes.Role` (Role)
- **Atributos**: `[Authorize(Roles = "Admin")]`
- **Frontend**: `ProtectedRoute` com verificação de `user.Role`

### 4.3. Vulnerabilidades Conhecidas
| ID | Vulnerabilidade | Status | Mitigação |
|----|-----------------|--------|-----------|
| S1 | JWT em LocalStorage | ⚠️ Aceito | Ciente de XSS, mitigar com CSP |
| S2 | CORS `AllowAnyOrigin` | ⚠️ Dev only | Restringir em produção |
| S3 | GET /Orders vaza dados | ✅ Corrigido | Filtro por UserId implementado |

---

## 5. Comunicação com API

### 5.1. Axios Interceptor
```typescript
// Adiciona token automaticamente
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### 5.2. Tratamento de Erros
```typescript
try {
  const response = await api.get('/ServiceBalances/MyBalances');
} catch (error: any) {
  // Lê ProblemDetails do .NET
  console.error('Erro 400:', error.response?.data);
  // error.response.data.errors contém validação detalhada
}
```

---

## 6. Decisões Arquiteturais Históricas

### 6.1. Snapshot Pattern (Case #016)
- **Problema**: Contratos de venda mudavam com o tempo, corrompendo histórico
- **Solução**: Cada `ClientContract` armazena **snapshot completo** da oferta no momento da venda
- **Impacto**: Integridade histórica garantida, mesmo com mudanças de catálogo

### 6.2. PascalCase Enforcement (Case #064, #065)
- **Problema**: Migração incompleta para PascalCase quebrou CRUDs inteiros
- **Solução**: Remoção de `[JsonPropertyName]`, auditoria de 18 commits atômicos
- **Impacto**: Contrato consistente, 0 erros de compilação, CRUDs restaurados

---

## 7. Referências

- [Case Study #016: Snapshot Pattern](implementations/016-arquitetura-snapshot-contratos.md)
- [Case Study #064: PascalCase API](implementations/064-api-pascal-case-snapshot-saldo.md)
- [Case Study #065: Correção de Colapso](implementations/065-correcao-colapso-migracao-pascalcase.md)
- [API Routes](API_ROUTES.md)
- [Security Guidelines](SECURITY.md)
