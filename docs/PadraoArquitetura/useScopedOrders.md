# Padrão Arquitetural: useScopedOrders

**Autor:** Eduardo Nascimento (Havenox)  
**Data:** 27/05/2026  
**Status:** Proposto (RFC)  
**Tipo:** Padrão Arquitetural - Hooks Genéricos com Escopo por Role

---

## 🚀 Contexto e Problema

### Situação Atual (Pré-Padrão)

O sistema Media 8 possui **múltiplas páginas** que precisam buscar dados de forma diferenciada baseada no **role do usuário autenticado**:

- **Cliente**: Deve ver apenas SEUS próprios dados (orders, branding profiles, editing styles)
- **Editor**: Deve ver apenas dados ATRIBUÍDOS a ele (orders em edição)
- **Admin**: Deve ver TODOS os dados do sistema

### Problema Identificado (Case #075)

Durante a correção de double-fetch nas requisições de Orders (Maio/2026), identificou-se que **3 páginas diferentes** continham a **mesma lógica de conditional queries** duplicada:

```typescript
// ❌ ANTES: Lógica duplicada em 3 arquivos diferentes

// OrdersPage.tsx
const isClient = user?.Role === 'Client';
const { data: allOrders } = useQuery({
  queryKey: orderKeys.lists(),
  queryFn: () => orderService.getAll(),
  enabled: !isClient,
});
const { data: clientOrders } = useQuery({
  queryKey: orderKeys.byClient(user?.Id!),
  queryFn: () => orderService.getByClient(user?.Id!),
  enabled: isClient,
});
const orders = isClient ? clientOrders : allOrders;

// EditsPage.tsx (MESMA LÓGICA, OUTRO CONTEXTO)
const isEditor = user?.Role === 'Editor';
const { data: allOrders } = useQuery({ /* ... */ });
const { data: editorOrders } = useQuery({ /* ... */ });
const orders = isEditor ? editorOrders : allOrders;

// DashboardPage.tsx (PARCIALMENTE)
const { data: orders } = useQuery({
  enabled: user?.Role === 'Admin', // Apenas admin
});
```

### Consequências da Duplicação

| Problema | Impacto |
|----------|---------|
| **Violação do DRY** | Mesma lógica escrita 3+ vezes |
| **Manutenção Custosa** | Mudança na regra exige atualizar N páginas |
| **Inconsistência** | Risco de páginas com regras divergentes |
| **Código Verboso** | ~20 linhas de boilerplate por página |
| **Testing Overhead** | Testar mesma lógica em N contextos |

---

## 🧠 Estratégia da Solução

### Princípio: "Escopo por Role"

Criar um **hook genérico** que encapsula a lógica de determinação de escopo baseada no role do usuário, retornando automaticamente os dados filtrados corretos.

### Arquitetura Proposta

```
┌─────────────────────────────────────────────────────┐
│                   useScopedOrders()                 │
├─────────────────────────────────────────────────────┤
│  1. Lê user?.Role do AuthContext                   │
│  2. Determina escopo: 'client' | 'editor' | 'all'  │
│  3. Ativa APENAS a query do escopo determinado     │
│  4. Retorna { data, isLoading, scope }             │
└─────────────────────────────────────────────────────┘
                        ↓
        ┌───────────────┼───────────────┐
        ↓               ↓               ↓
   [Client Query]  [Editor Query]  [All Query]
   (enabled: true)  (enabled: false) (enabled: false)
```

### Decisão de Design

**Opção 1: Hook Específico (`useScopedOrders`)**
- ✅ Mais simples de entender
- ✅ Menos abstração desnecessária
- ✅ Resolve problema imediato
- ❌ Ainda requer criar hooks separados para outros recursos

**Opção 2: Hook Genérico (`useScopedResource`)**
- ✅ Reutilizável para Orders, BrandingProfiles, EditingStyles, etc.
- ✅ Máxima abstração
- ❌ Curva de aprendizado maior
- ❌ Pode ser over-engineering se usado apenas para 1-2 recursos

**Decisão:** Começar com **Opção 1** (`useScopedOrders`) e evoluir para **Opção 2** se o padrão se repetir em 3+ recursos.

---

## 🛠️ Implementação Técnica

### Proposta: Hook `useScopedOrders`

**Arquivo:** `media8-web/src/hooks/useOrders.ts`

```typescript
/**
 * Hook genérico para fetch de orders com escopo baseado no role do usuário
 * 
 * EVITA: Repetição de conditional queries em cada página
 * USA: Estratégia de escopo (all, client, editor)
 * 
 * @returns { data, isLoading, scope, error } - Orders filtradas automaticamente
 * 
 * @example
 * // Em qualquer página:
 * const { data: orders, isLoading, scope } = useScopedOrders();
 * 
 * // scope === 'client' → Cliente vê apenas suas orders
 * // scope === 'editor' → Editor vê apenas orders atribuídas
 * // scope === 'all'    → Admin vê todas as orders
 */
export const useScopedOrders = () => {
  const { user } = useAuth();
  
  // Determina o escopo baseado no role (memoized)
  const scope = useMemo(() => {
    if (!user?.Id) return 'none';
    if (user.Role === 'Client') return 'client';
    if (user.Role === 'Editor') return 'editor';
    return 'all'; // Admin
  }, [user]);

  // Fetch baseado no escopo (SÓ UM hook é ativado por vez)
  const allQuery = useQuery({
    queryKey: orderKeys.lists(),
    queryFn: () => orderService.getAll(),
    enabled: scope === 'all', // ✅ Admin
  });

  const clientQuery = useQuery({
    queryKey: orderKeys.byClient(user?.Id!),
    queryFn: () => orderService.getByClient(user?.Id!),
    enabled: scope === 'client', // ✅ Client
  });

  const editorQuery = useQuery({
    queryKey: orderKeys.byEditor(user?.Id!),
    queryFn: () => orderService.getByEditor(user?.Id!),
    enabled: scope === 'editor', // ✅ Editor
  });

  // Retorna os dados do escopo ativo
  return {
    data: scope === 'client' ? clientQuery.data 
           : scope === 'editor' ? editorQuery.data 
           : allQuery.data,
    isLoading: scope === 'client' ? clientQuery.isLoading 
               : scope === 'editor' ? editorQuery.isLoading 
               : allQuery.isLoading,
    error: scope === 'client' ? clientQuery.error 
           : scope === 'editor' ? editorQuery.error 
           : allQuery.error,
    scope, // Útil para UI condicional
  };
};
```

### Uso nas Páginas (DEPOIS)

```typescript
// OrdersPage.tsx (SIMPLIFICADO - 70% menos código)
const OrdersPage: React.FC = () => {
  const { data: orders, isLoading, scope } = useScopedOrders();
  
  // UI pode usar `scope` para renderização condicional
  // Ex: Mostrar botão "Ver todas as orders" só se scope === 'all'
  
  const filteredOrders = useMemo(() => {
    return orders?.filter(/* filtros de busca */) || [];
  }, [orders, searchQuery, statusFilter]);
  
  // ... resto do código focado apenas na UI
};

// EditsPage.tsx (MESMO HOOK)
const EditsPage: React.FC = () => {
  const { data: orders, isLoading } = useScopedOrders();
  // ... mesmo padrão
};

// DashboardPage.tsx (MESMO HOOK)
const DashboardPage: React.FC = () => {
  const { data: orders, isLoading } = useScopedOrders();
  // ... mesmo padrão
};
```

---

## 🎯 Impacto e Resultado

### Métricas de Impacto

| Métrica | Antes | Depois | Melhoria |
|---------|-------|--------|----------|
| **Linhas de Código** | ~60 (3 páginas × 20 linhas) | ~25 (1 hook) | **58% redução** |
| **Pontos de Mudança** | 3 arquivos | 1 arquivo | **66% redução** |
| **Consistência** | Variável por página | 100% garantida | **Automática** |
| **Legibilidade** | Boilerplate em cada página | Hook semântico | **Alta** |
| **Performance** | 1 query por role | 1 query por role | **Iguais** |

### Benefícios

1. **DRY (Don't Repeat Yourself)**: Lógica escrita 1 única vez
2. **Manutenção Simplificada**: Mudou a regra? Atualiza 1 arquivo
3. **Consistência Garantida**: Todas as páginas usam mesma lógica
4. **Performance Preservada**: Mesma eficiência (1 query ativa por render)
5. **UI Condicional**: `scope` permite renderização baseada no role
6. **Testing Simplificado**: Testa 1 hook, não N páginas

### Extensibilidade Futura

**Padrão replicável para outros recursos:**

```typescript
// useScopedBrandingProfiles.ts (mesmo padrão)
export const useScopedBrandingProfiles = () => {
  const { user } = useAuth();
  const scope = useMemo(() => {
    if (!user?.Id) return 'none';
    if (user.Role === 'Client') return 'client';
    return 'all';
  }, [user]);
  
  // ... mesma estrutura
};

// useScopedEditingStyles.ts (mesmo padrão)
// useScopedServiceBalances.ts (mesmo padrão)
```

**OU: Super-hook genérico parametrizável:**

```typescript
// useScopedResource.ts (abstração máxima)
export const useScopedResource = <T>({
  allFn,      // () => Promise<T[]>
  byClientFn, // (id: string) => Promise<T[]>
  byEditorFn, // (id: string) => Promise<T[]>
  keys,       // Query keys factory
}: ScopedResourceOptions<T>): ScopedResourceResult<T> => {
  const { user } = useAuth();
  
  const scope = useMemo(() => {
    if (!user?.Id) return 'none';
    if (user.Role === 'Client') return 'client';
    if (user.Role === 'Editor') return 'editor';
    return 'all';
  }, [user]);

  const allQuery = useQuery({ enabled: scope === 'all', /* ... */ });
  const clientQuery = useQuery({ enabled: scope === 'client', /* ... */ });
  const editorQuery = useQuery({ enabled: scope === 'editor', /* ... */ });

  return {
    data: scope === 'client' ? clientQuery.data 
           : scope === 'editor' ? editorQuery.data 
           : allQuery.data,
    isLoading: /* ... */,
    scope,
  };
};

// USO:
const { data: orders } = useScopedResource({
  allFn: () => orderService.getAll(),
  byClientFn: (id) => orderService.getByClient(id),
  byEditorFn: (id) => orderService.getByEditor(id),
  keys: { all: ['orders'], client: (id) => ['orders', 'client', id], /* ... */ },
});
```

---

## 📋 Regras e Padrões

### Quando Usar

✅ **USE** `useScopedOrders` quando:
- Página precisa de orders filtradas por role do usuário
- Quer evitar duplicação de conditional queries
- Precisa de UI condicional baseada no scope

❌ **NÃO USE** `useScopedOrders` quando:
- Precisa de TODAS as orders independente do role (ex: admin dashboard específico)
- Precisa de filtro customizado (ex: orders por status específico)
- Está em componente que não tem acesso ao AuthContext

### Quando Estender para Outros Recursos

✅ **CRIE** `useScopedBrandingProfiles` quando:
- 3+ páginas precisarem do mesmo padrão para BrandingProfiles
- Padrão se repetir para EditingStyles, ServiceBalances, etc.

✅ **CRIE** `useScopedResource` (genérico) quando:
- 3+ hooks específicos existirem (`useScopedOrders`, `useScopedBrandingProfiles`, etc.)
- Quiser maximizar reusabilidade
- Time estiver confortável com abstrações genéricas

---

## 🔗 Referências

- **Case Study #075**: Double-fetch em Orders (identificação do problema)
- **TanStack Query - Conditional Queries**: https://tanstack.com/query/latest/docs/react/guides/queries#conditional-queries
- **Clean Architecture - Single Responsibility**: Hooks devem fazer 1 coisa bem feita
- **DRY Principle**: Don't Repeat Yourself

---

## 📝 Histórico de Decisões

### 27/05/2026 - RFC Inicial
- **Problema**: Duplicação de conditional queries em 3 páginas
- **Discussão**: Hook específico vs hook genérico
- **Decisão**: Começar com `useScopedOrders` (específico), evoluir para genérico se necessário
- **Status**: Aguardando implementação

---

**Nota do Desenvolvedor:** *Este padrão nasceu de uma correção de double-fetch, mas evoluiu para uma oportunidade de estabelecer um padrão arquitetural reutilizável. A chave é balancear abstração com simplicidade: começar específico, medir uso, e generalizar apenas quando o padrão se repetir 3+ vezes. Isso evita over-engineering prematuro enquanto mantém a porta aberta para evolução futura.*