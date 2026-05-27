# 075 - Frontend: Eliminação de Double-Fetch em Requisições de Orders com Conditional Queries

**Autor:** Eduardo Nascimento (Havenox)  
**Data:** 27/05/2026

---

## 🚀 Desafio de Engenharia

Durante testes de uso normal da aplicação, foi identificado que **múltiplas requisições duplicadas** estavam sendo disparadas contra a API `/api/v1/Orders` ao acessar páginas como `/orders`, `/edits` e `/dashboard`.

**Problema Observado:**
- **Cliente** fazia 2 requisições simultâneas:
  1. `GET /api/v1/Orders` (sem payload - inútil, pois backend filtra por RBAC)
  2. `GET /api/v1/Orders?ClientId=00000000-0000-0000-0000-000000000002` (útil)
- **Admin** fazia 2 requisições simultâneas:
  1. `GET /api/v1/Orders` (útil - retorna todas)
  2. `GET /api/v1/Orders?ClientId=...` (inútil - retorna só as do próprio admin)
- **Editor** fazia 2 requisições simultâneas:
  1. `GET /api/v1/Orders` (útil)
  2. `GET /api/v1/Orders?EditorId=...` (inútil no contexto atual)

**Impacto Imediato:**
- **50% das requisições eram desnecessárias** (2→1 por página)
- **Performance degradada**: Latência adicional de rede e processamento backend
- **Violação do Princípio do Menor Privilégio**: Frontend chamando endpoints que não precisa, mesmo que backend filtre por RBAC

**Causa Raiz:**
O código em `OrdersPage.tsx`, `EditsPage.tsx` e `DashboardPage.tsx` estava chamando **ambos os hooks** (`useOrders()` E `useOrdersByClient()`/`useOrdersByEditor()`) **simultaneamente**, e apenas depois decidindo qual resultado usar:

```typescript
// ❌ ANTES (OrdersPage.tsx - LINHA 54-57)
const isClient = user?.Role === 'Client';
const { data: allOrders } = useOrders(); // SEMPRE chama
const { data: clientOrders } = useOrdersByClient(isClient ? user?.Id : undefined); // SEMPRE chama
const orders = isClient ? clientOrders : allOrders; // SÓ DEPOIS decide
```

Isso violava o princípio de **Conditional Queries** do TanStack Query, onde hooks devem ser ativados/desativados baseado em condições **ANTES** de executar.

---

## 🧠 Estratégia da Solução

Aplicação do padrão **"Conditional Queries por Role"**:

1. **Identificar o role do usuário** (`Client`, `Editor`, `Admin`)
2. **Ativar APENAS a query relevante** usando `enabled: condition`
3. **Desativar queries desnecessárias** com `enabled: false`
4. **Manter performance**: 1 única requisição por renderização, baseada no role

**Decisão de Design:**
- **Opção A:** Criar hook genérico `useScopedOrders` que encapsula toda lógica
- **Opção B:** Aplicar conditional queries diretamente nas páginas (solução imediata)

**Decisão Tomada:** Opção B (solução imediata) + documentar padrão para futura abstração (Opção A) quando 3+ recursos precisarem do mesmo padrão.

**Por que este caminho:**
- ✅ Resolve problema imediato em todas as páginas
- ✅ Mantém código explícito e legível
- ✅ Performance idêntica à solução genérica
- ✅ Permite coletar casos de uso antes de abstrair (evitar over-engineering)

---

## 🛠️ Implementação Técnica

### Frontend (4 commits atômicos)

**Commit 1 — `379e3c1` (OrdersPage Initial Fix):**
- Adicionado comentários explicativos sobre conditional queries
- Separado claramente as duas queries com comentários sobre quando cada uma executa
- Mantida estrutura original (ainda chamava ambos hooks)

**Commit 2 — `c5ba689` (Dashboard + Edits Fix):**
- `DashboardPage.tsx`: Substituído `useOrders()` por `useQuery()` com `enabled: user?.Role === 'Admin'`
- `EditsPage.tsx`: Adicionado comentários, mas mantida lógica duplicada (pendente correção)
- Adicionados imports necessários (`useQuery`, `orderKeys`, `orderService`)

**Commit 3 — `6f053a0` (OrdersPage Definitivo):**
- **Correção real do double-fetch**:
```typescript
// ✅ DEPOIS (OrdersPage.tsx - LINHAS 58-69)
const isClient = user?.Role === 'Client';

// Admin/Editor: fetch all orders (conditional query)
const { data: allOrders } = useQuery({
  queryKey: orderKeys.lists(),
  queryFn: () => orderService.getAll(),
  enabled: !isClient, // ❌ NÃO executa se for cliente
});

// Client: fetch only their own orders (conditional query)
const { data: clientOrders } = useQuery({
  queryKey: orderKeys.byClient(user?.Id!),
  queryFn: () => orderService.getByClient(user?.Id!),
  enabled: isClient, // ✅ SÓ executa se for cliente
});
```
- Adicionados imports: `useQuery`, `orderKeys`, `orderService`
- Reduzido código de ~20 linhas para ~12 linhas (40% redução)

**Commit 4 — `e5ae0f1` (EditsPage Definitivo):**
- Aplicada mesma lógica do OrdersPage para `EditsPage.tsx`
- **Editor**: `useQuery()` com `enabled: isEditor`
- **Admin**: `useQuery()` com `enabled: !isEditor`
- Adicionados imports necessários

### Hooks Atualizados

**Arquivo:** `media8-web/src/hooks/useOrders.ts`

**Commit 2 (parcial):**
- `useOrdersByClient`: Adicionado comentário `❌ NÃO executa se clientId for undefined/null`
- `useOrdersByEditor`: Adicionado comentário `❌ NÃO executa se editorId for undefined/null`
- Mantida lógica `enabled: !!clientId` e `enabled: !!editorId` (já estava correto)

---

## 🎯 Impacto e Resultado

### Métricas de Impacto

| Página | Role | Requisições Antes | Requisições Depois | Economia |
|--------|------|-------------------|-------------------|----------|
| **OrdersPage** | Cliente | 2 | 1 | **50%** ✅ |
| **OrdersPage** | Admin | 2 | 1 | **50%** ✅ |
| **EditsPage** | Editor | 2 | 1 | **50%** ✅ |
| **EditsPage** | Admin | 2 | 1 | **50%** ✅ |
| **DashboardPage** | Cliente | 1 (inútil) | 0 | **100%** ✅ |
| **DashboardPage** | Admin | 1 | 1 | **0%** (já era 1) |

**Total:** Redução de **6→3 requisições** (50% de economia) em cenários típicos de uso.

### Benefícios Técnicos

* **Performance**: 50% menos requisições HTTP → menor latência percebida
* **Backend**: 50% menos carga no servidor → melhor escalabilidade
* **Segurança**: Princípio do Menor Privilégio respeitado (cliente não chama endpoint de admin)
* **Clean Code**: Conditional queries explícitas e documentadas
* **TanStack Query Best Practices**: Uso correto de `enabled` para controle de execução

### Benefícios de UX

* **Carregamento mais rápido**: Menos requisições paralelas → UI responde mais rápido
* **Menos flickering**: Evita estado de loading duplicado
* **Network tab limpo**: Desenvolvedores conseguem debugar mais facilmente

---

## 📋 Padrão Estabelecido

### Regra para Futuras Implementações

**Sempre usar conditional queries quando:**
1. Diferentes roles precisam de dados diferentes
2. Hooks podem ser ativados/selecionados baseado em condição
3. Quer evitar requisições desnecessárias

**Template Padrão:**
```typescript
const isClient = user?.Role === 'Client';

// SÓ executa se NÃO for cliente (Admin/Editor)
const { data: allData } = useQuery({
  queryKey: resourceKeys.all(),
  queryFn: () => resourceService.getAll(),
  enabled: !isClient,
});

// SÓ executa se FOR cliente
const { data: clientData } = useQuery({
  queryKey: resourceKeys.byClient(user?.Id!),
  queryFn: () => resourceService.getByClient(user?.Id!),
  enabled: isClient,
});

const data = isClient ? clientData : allData;
```

### Quando Abstrair para Hook Genérico

**Critérios para criar `useScopedResource`:**
1. ✅ 3+ páginas usam o mesmo padrão
2. ✅ 3+ recursos diferentes precisam do padrão (Orders, BrandingProfiles, EditingStyles)
3. ✅ Time está confortável com abstrações genéricas

**Status:** Aguardando critérios serem atendidos. Ver `docs/PadraoArquitetura/useScopedOrders.md` para RFC completa.

---

**Nota do Desenvolvedor:** *Esta correção nasceu de uma observação casual no Network tab do DevTools, mas revelou um padrão de duplicação que vinha passando despercebido. A lição mais importante é: **sempre questionar por que 2 requisições estão sendo feitas quando só 1 é necessária**. O TanStack Query nos dá ferramentas poderosas como `enabled` para controle fino de execução - usá-las corretamente não é apenas otimização, é seguir as melhores práticas da ferramenta. O próximo passo natural é abstrair para `useScopedOrders` quando o padrão se repetir em outros recursos, mas por enquanto, manter explícito é mais sustentável que abstrair prematuramente.*