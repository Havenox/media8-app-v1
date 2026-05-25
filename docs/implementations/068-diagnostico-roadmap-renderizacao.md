# 068 - Diagnóstico e Roadmap: Renderização de Dados em Páginas de Perfis e Pedidos

**Autor:** Eduardo Nascimento (Havenox)  
**Data:** 25/05/2026  
**Status:** Em Andamento

---

## 1. Sumário Executivo

Apesar da API retornar dados corretamente em **PascalCase**, várias páginas críticas **não renderizam** as informações:

| Página | Sintoma | Dados no Network Tab | Causa Provável |
|--------|---------|---------------------|----------------|
| `/orders` | "Nenhum pedido encontrado" | `GET /orders` retorna `[]` | Backend filtrando por `UserId`, usuário logado não tem pedidos |
| `/branding-profiles` | Tabela vazia | `GET /branding-profiles` retorna array com dados | Renderização condicional ou `.map()` não executando |
| `/editing-profiles` | Tabela vazia | `GET /editing-profiles` retorna array com dados | Mesmo problema de renderização |
| `/settings` | "Janela de Cancelamento" com fallback | `GET /settings` retorna `{"CancellationWindowHours":"1"}` | Estado inicial com valor `24` não sobrescrito |

---

## 2. Análise Detalhada por Página

### 2.1. OrdersPage (`/orders`)

**Sintoma:** Mensagem "Nenhum pedido encontrado" aparece mesmo com a API respondendo.

**Causa Raiz:**
```typescript
// OrdersPage.tsx:52-56
const isClient = user?.Role === 'Client';
const { data: allOrders = [], isLoading: isLoadingAll } = useOrders();
const { data: clientOrders = [], isLoading: isLoadingClient } = useOrdersByClient(isClient ? user?.Id : undefined);

const orders = isClient ? clientOrders : allOrders;
```

O backend **filtra pedidos por `UserId`** no `GetAll()` (segurança IDOR). Se o usuário logado não tem pedidos, `allOrders` será `[]` e a mensagem "Nenhum pedido encontrado" é **comportamento correto**.

**Solução:** Adicionar seed de pedidos de exemplo ou criar primeiro pedido manualmente.

### 2.2. BrandingProfilesPage (`/branding-profiles`)

**Sintoma:** Tabela vazia apesar da array `brandingProfiles` ter dados.

**Causa Raiz:**
```typescript
// BrandingProfilesPage.tsx:64-68
const {
  data: brandingProfiles,
  isLoading: isLoadingBranding,
  refetch: refetchBranding,
} = useBrandingProfiles(!showArchived);
```

O hook `useBrandingProfiles` recebe `!showArchived` (booleano) mas espera `onlyActive: boolean`. Quando `showArchived = false`, `!showArchived = true` → correto. Mas a renderização pode estar falhando.

**Verificar:**
- Se `brandingProfiles` é array vazio ou undefined
- Se `.map()` está sendo chamado
- Se há erro de chave única (`key={profile.Id}`)

### 2.3. EditingProfilesPage (`/editing-profiles`)

**Sintoma:** Mesma causa raiz da BrandingProfilesPage.

**Causa Adicional:**
```typescript
// EditingProfilesPage.tsx:47-54
import {
  useEditingProfiles,
  useArchiveEditingProfile,
  useRestoreEditingProfile,
  useHardDeleteEditingProfile,
  useCreateEditingProfile,
  useUpdateEditingProfile,
} from '@/hooks/useBrandingProfiles'; // ← Importando do hook errado!
```

**ERRO CRÍTICO:** imports estão vindo de `useBrandingProfiles` ao invés de `useEditingProfiles`!

### 2.4. SettingsPage (`/settings`)

**Sintoma:** Campo "Janela de Cancelamento" mostra `24` (fallback) ao invés do valor da API (`1`).

**Causa Raiz:**
```typescript
// SettingsPage.tsx:200-210
const [cancellationWindow, setCancellationWindow] = useState(24);

React.useEffect(() => {
  orderService.getCancellationWindow().then(setCancellationWindow);
}, []);
```

O `useEffect` que busca dados da API **não atualiza o estado** ou executa após o render inicial com fallback.

**Solução:** Usar React Query (`useCancellationWindow`) ao invés de `useState` + `useEffect`.

---

## 3. Roadmap de Correção

### Fase 1: Correções Críticas (Prioridade Máxima)

#### 1.1. EditingProfilesPage - Import Corrigido
**Arquivo:** `media8-web/src/pages/EditingProfilesPage.tsx`  
**Problema:** Imports vindo de `useBrandingProfiles`  
**Solução:** Trocar para `import from '@/hooks/useEditingProfiles'`  
**Critério de Aceite:** Imports corretos, página renderiza perfis de edição

**Commit Esperado:**
```
fix(web): corrige import em EditingProfilesPage - usa useEditingProfiles ao inves de useBrandingProfiles
```

#### 1.2. SettingsPage - Usar Hook da API
**Arquivo:** `media8-web/src/pages/SettingsPage.tsx`  
**Problema:** `useState` com fallback `24` sobrescreve valor da API  
**Solução:** Usar `useCancellationWindow` hook + `isLoading` state

**Código Alvo:**
```typescript
// Hook
const { data: cancellationWindowHours = 24, isLoading } = useCancellationWindow();

// Render
<Input
  type="number"
  value={cancellationWindowHours}
  onChange={(e) => setCancellationWindow(parseInt(e.target.value))}
  disabled={isLoading}
/>
```

**Critério de Aceite:** Campo exibe valor correto da API (ex: `1`), não fallback `24`

**Commit Esperado:**
```
fix(web): usa useCancellationWindow hook no SettingsPage ao inves de useState
```

### Fase 2: Validação de Renderização

#### 2.1. BrandingProfilesPage - Debug de Renderização
**Arquivo:** `media8-web/src/pages/BrandingProfilesPage.tsx`  
**Ação:** Adicionar logs de debug e verificar:
- Se `brandingProfiles` é array não-vazio
- Se `.map()` executa
- Se `key={profile.Id}` está correto

**Commit Esperado:**
```
debug(web): adiciona logs de debug em BrandingProfilesPage para diagnosticar renderizacao
```

#### 2.2. EditingProfilesPage - Debug de Renderização
**Arquivo:** `media8-web/src/pages/EditingProfilesPage.tsx`  
**Ação:** Mesma abordagem da BrandingProfilesPage

**Commit Esperado:**
```
debug(web): adiciona logs de debug em EditingProfilesPage para diagnosticar renderizacao
```

### Fase 3: Validação de Dados

#### 3.1. OrdersPage - Validação de Comportamento
**Arquivo:** `media8-web/src/pages/OrdersPage.tsx`  
**Status:** Comportamento **correto** - usuário sem pedidos = mensagem "Nenhum pedido encontrado"  
**Ação:** Criar pedido de exemplo via `CreateOrderButton` ou seed

**Commit Esperado:**
```
docs(web): adiciona nota sobre OrdersPage exigir pedidos seed para teste
```

---

## 4. Protocolo de Execução

### Regras de Comprometimento

1. **Um arquivo por commit:** Cada correção = 1 commit atômico
2. **Build válido:** `tsc --noEmit` passa antes de commitar
3. **Teste manual:** Validar página no browser após cada commit
4. **Logs de debug:** Adicionar `console.log` temporários para diagnóstico

### Sequência de Execução

```
1. EditingProfilesPage - Corrigir imports (crítico)
2. SettingsPage - Usar hook da API (crítico)
3. BrandingProfilesPage - Debug de renderização
4. EditingProfilesPage - Debug de renderização
5. Validação manual de todas as páginas
6. Remover logs de debug
```

---

## 5. Estado Atual dos Serviços

### Backend
- ✅ `/api/v1/branding-profiles` retorna array com dados
- ✅ `/api/v1/editing-profiles` retorna array com dados
- ✅ `/api/v1/settings` retorna `{"CancellationWindowHours":"1"}`
- ✅ `/api/v1/orders` retorna array (vazia se usuário sem pedidos)

### Frontend
- ✅ Hooks `useBrandingProfiles`, `useEditingProfiles`, `useCancellationWindow` implementados
- ⚠️ EditingProfilesPage importando hook errado
- ⚠️ SettingsPage usando `useState` com fallback
- ⚠️ BrandingProfilesPage/EditingProfilesPage possivelmente com erro de renderização

---

## 6. Próximos Passos Imediatos

1. **Corrigir import em EditingProfilesPage** (5 min)
2. **Corrigir SettingsPage para usar hook** (10 min)
3. **Validar renderização** (5 min)
4. **Documentar descobertas** (5 min)

**Tempo Estimado Total:** 25 minutos

---

## 7. Referências

- **Case Study #065:** [Correção de Colapso PascalCase](implementations/065-correcao-colapso-migracao-pascalcase.md)
- **Case Study #066:** [Roadmap de Consolidação](implementations/066-roadmap-consolidacao-pascalcase.md)
- **Hooks:** `useBrandingProfiles.ts`, `useEditingProfiles.ts`, `useOrders.ts`
- **Páginas:** `BrandingProfilesPage.tsx`, `EditingProfilesPage.tsx`, `SettingsPage.tsx`, `OrdersPage.tsx`
