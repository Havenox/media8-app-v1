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

### 2.4. Lei da Navegação Mínima (EF Core)
- **Regra**: Entidades não devem ter navegações reversas ativas sem necessidade de negócio
- **Problema**: Navegações bidirecionais (`ICollection<T>`) fazem EF Core inferir FKs indevidas
- **Solução**: Se não precisa navegar da entidade B para A, não declare propriedade de navegação
- **Exemplo**: `EditingStyle.VideoFormats` removido para evitar FK `EditingStyleId` em `VideoFormats`
- **Referência**: [Case Study 070](implementations/070-correcao-navegacao-reversa-editingstyle.md)

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

### 6.4. SettingsService Cache Initialization (Case #071)
  - **Problema**: Cache do `SettingsService` não era carregado no startup, retornando dados vazios ou usando fallbacks perigosos
  - **Solução**: Chamada explícita de `RefreshCacheAsync()` no `Program.cs` e remoção de fallbacks (fail-fast)
  - **Impacto**: Configurações dinâmicas (ex: `CancellationWindowHours`) refletidas corretamente, sistema quebra se não carregar
  - **Lição**: Singleton com cache deve ser inicializado explicitamente; fallbacks mascaram problemas de inicialização

### 6.5. Orders PascalCase Renderização (Case #072)
  - **Problema**: Tela /orders com propriedades em camelCase (`order.status`, `order.editor.name`) enquanto backend retorna PascalCase
  - **Solução**: Auditoria completa em OrdersPage, OrderDetailPage, orderService; correção de todos os acessos para PascalCase
  - **Impacto**: Renderização correta de status e nomes, zero erros silenciosos, código alinhado com backend
  - **Lição**: PascalCase não é negociável; cada propriedade em camelCase é oportunidade de bug silencioso

### 6.6. Remoção de VideoFormatId de Orders (Case #073, #074)
  - **Problema**: Tabela `Orders` tinha FK indevida para `VideoFormats`, violando princípio do snapshot imutável. Mesmo após remover a coluna, o EF Core ainda inferia a FK através de propriedade de navegação residual
  - **Solução**: Removido `VideoFormatId` de `Order`, `CreateOrderRequest` e `OrderResponse`; removida propriedade de navegação `VideoFormat` da entidade; gerada migration `FixOrderSnapshot` para atualizar o snapshot do EF Core
  - **Impacto**: 14 commits atômicos (domain, application, infra, frontend, tests), migration no-op segura, frontend funcional sem dados redundantes, erro 500 resolvido
  - **Lição**: Propriedades de navegação no EF Core podem inferir FKs indesejadas mesmo sem declaração explícita - sempre remover navegações junto com colunas do banco; snapshot já captura estado imutável

### 6.7. Eliminação de Double-Fetch em Orders (Case #075)
  - **Problema**: Páginas `/orders`, `/edits` e `/dashboard` disparavam 2 requisições simultâneas (1 geral + 1 filtrada por role), sendo 50% desnecessárias
  - **Solução**: Aplicado padrão de Conditional Queries do TanStack Query com `enabled` baseado no role do usuário (`Client`, `Editor`, `Admin`)
  - **Impacto**: Redução de 50% nas requisições HTTP (6→3 em cenários típicos), performance melhorada, princípio do menor privilégio respeitado
  - **Lição**: Sempre usar `enabled` para controle fino de execução de queries; evitar chamar múltiplos hooks e decidir depois qual usar

---

## 7. Referências

- [Case Study #016: Snapshot Pattern](implementations/016-arquitetura-snapshot-contratos.md)
- [Case Study #064: PascalCase API](implementations/064-api-pascal-case-snapshot-saldo.md)
- [Case Study #065: Correção de Colapso](implementations/065-correcao-colapso-migracao-pascalcase.md)
- [Case Study #071: SettingsService Cache](implementations/071-correcao-cache-settings-inicializacao.md)
- [Case Study #072: Orders PascalCase](implementations/072-correcao-pascalcase-orders-renderizacao.md)
- [Case Study #073: Remoção VideoFormatId](implementations/073-remocao-videoid-orders.md)
- [Case Study #074: Remoção FK VideoFormatId](implementations/074-remocao-completa-videofk-orders.md)
- [Case Study #075: Double-Fetch Elimination](implementations/075-eliminacao-double-fetch-orders.md)
- [API Routes](API_ROUTES.md)
- [Security Guidelines](SECURITY.md)
