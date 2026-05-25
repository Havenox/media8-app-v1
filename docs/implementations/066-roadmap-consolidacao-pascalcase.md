# 066 - Roadmap de Consolidação PascalCase e Recuperação de Renderização

**Autor:** Eduardo Nascimento (Havenox)  
**Data:** 25/05/2026  
**Status:** Em Andamento

---

## 1. Contexto e Situação Atual

### 1.1. O Que Foi Consertado (Sessão Anterior - 24/05/2026)

O agente anterior (**antigravity+claudeopus**) realizou uma recuperação cirúrgica em **18 commits atômicos** que restauraram a funcionalidade básica dos CRUDs:

| Escopo | Arquivos | Principais Mudanças |
|--------|----------|---------------------|
| **Backend** | 4 arquivos | `AdminUserDto` (remoção `JsonPropertyName`), `OrdersController` (RBAC + PUT), `ServiceBalancesController` (rota `/{clientId}`), `IOrderService` + `OrderService` (`UpdateAsync`) |
| **Frontend Services** | 3 arquivos | `services/index.ts` (imports quebrados), `types/services.ts` (remoção `ServiceType`), `orderService.ts` (PATCH→PUT) |
| **Frontend Hooks** | 6 arquivos | `useOffers`, `useVideoFormats`, `useUsers`, `useEditingStyles`, `useClientContracts`, `useBrandingProfiles` — migração `.name`→`.Name`, `.id`→`.Id` |
| **Frontend Pages** | 20+ arquivos | `SettingsPage`, `DashboardPage`, `OrdersPage`, `EditsPage`, `OffersPage`, `VideoFormatsPage`, `EditingStylesPage`, `UsersPage` — migração para PascalCase |
| **Documentação** | 1 arquivo | `API_ROUTES.md` reescrito com endpoints reais |

**Resultado:** ✅ `dotnet build` e `tsc --noEmit` compilam com 0 erros.

### 1.2. O Problema Persistente (Sessão Atual - 25/05/2026)

Apesar dos CRUDs estarem funcionalmente corrigidos, **os dados não aparecem nas páginas**. O sintoma reportado:

> "O menu aparece, mas nada carrega. Não dá pra editar nem realizar nenhuma alteração. Nenhum CRUD funciona."

**Erro de Console Identificado:**
```
ReferenceError: newoffer is not defined
    at _le (index-8ML_cGVi.js:557:103907)
```

**Causa Raiz:** Durante a correção em massa com regex bulk, variáveis locais foram acidentalmente corrompidas:
- `newOffer.name` → `newoffer.Name` (corrompido para `newoffer`)
- `selectedOffer.Id` → `selectedoffer.Id` (corrompido para `selectedoffer`)

**Trabalho Realizado na Sessão Atual:**
- Correção de corrupção em `OffersPage.tsx` (`newoffer.` → `newOffer.`, `selectedoffer.` → `selectedOffer.`)
- Correção de corrupção em `VideoFormatsPage.tsx` (`selectedformat.` → `selectedFormat.`)
- Correção de corrupção em `EditingStylesPage.tsx` (`selectedstyle.` → `selectedStyle.`)
- Separação de convenções: **Estado Local = camelCase**, **DTO da API = PascalCase**
- Correção de `UsersPage` (payloads de criação/atualização em PascalCase)
- Correção de lambdas com variável de 1 caractere (`o.status` → `o.Status`)
- Correção de componentes (`UserDetailsSheet`, `ContractAssignDialog`, `ServiceBalanceList`)

**Resultado:** ✅ Build production (`vite build`) gera com sucesso.

---

## 2. Inventário de Commits Realizados

### Histórico da Sessão de Recuperação (24-25/05/2026)

| # | Hash | Escopo | Descrição |
|---|------|--------|-----------|
| 1 | `47b48f4` | Backend | Remove `JsonPropertyName` do `AdminUserDto` |
| 2 | `2abe870` | Backend | `OrdersController`: RBAC, PUT, alias PascalCase |
| 3 | `825d078` | Backend | `ServiceBalancesController`: rota `GET /{clientId}` |
| 4 | `1e74e1b` | Backend | `IOrderService` + `OrderService`: `UpdateAsync` |
| 5 | `caa169d` | Frontend | Barrel exports quebrados (`services/index.ts`) |
| 6 | `8ff2a9e` | Frontend | Tipos mortos (`ServiceType`), DTOs PascalCase |
| 7 | `d4ebb10` | Frontend | `orderService`: PATCH→PUT, PascalCase |
| 8 | `cde9f9a` | Hook | `useOffers`: PascalCase |
| 9 | `79e73c8` | Hook | `useVideoFormats`: PascalCase |
| 10 | `c30f9a0` | Hook | `useUsers`: PascalCase + payload |
| 11 | `9cfc2e9` | Hook | `useEditingStyles`: PascalCase |
| 12 | `f8c7ab7` | Hook | `useClientContracts`: PascalCase |
| 13 | `ef74bef` | Hook | `useBrandingProfiles`: PascalCase |
| 14 | `6936ed5` | Page | `SettingsPage`: PascalCase |
| 15 | `dcbb9dc` | Pages | Bulk fix: `user.id`→`Id`, `user.role`→`Role` (16 arquivos) |
| 16 | `db59ef7` | Pages | Admin pages: `offer.Name`, `format.Name`, `style.Name` |
| 17 | `46dffed` | Pages | Order pages: `order.Status`, `order.Title` |
| 18 | `2ae2ebf` | Docs | `API_ROUTES.md` reescrito |
| 19 | `d33a4b8` | Pages | Corrupção: `newoffer`→`newOffer`, `selectedformat`→`selectedFormat` |
| 20 | `5c5e97a` | Pages | `OffersPage`: separa API DTO (PascalCase) de estado local (camelCase) |
| 21 | `3f7db0b` | Pages | `VideoFormatsPage`, `EditingStylesPage`, `UsersPage`: PascalCase final |
| 22 | `e4be991` | Pages | Lambdas: `o.status`→`o.Status`, `o.title`→`o.Title` |
| 23 | `b5a0be9` | Pages | `UsersPage`: payload PascalCase, `getClientName`, `ServiceBalanceList` |
| 24 | `32d9e04` | Components | `UserDetailsSheet`, `ContractAssignDialog`, `canDeletePermanently` |
| 25 | `eacf04f` | Docs | Pilares de contexto (01, 02, 03) |

**Total:** 25 commits atômicos, 0 erros de compilação.

---

## 3. Problemas Restantes Conhecidos

### 3.1. Dados Não Renderizam (Prioridade Máxima)

**Sintoma:** As páginas renderizam o esqueleto (layout, menus, botões), mas as tabelas/listas de dados aparecem vazias.

**Hipóteses:**

1. **Hooks não estão retornando dados:** O `useQuery` pode estar falhando silenciosamente.
2. **Mapeamento de chaves de cache:** O `queryKey` pode estar inconsistente entre `invalidateQueries`.
3. **Condições de renderização:** `isLoading`, `isError`, `isSuccess` podem estar em estado incorreto.
4. **Filtros de lista:** `offers?.filter()` pode estar retornando vazio por condição mal-sucedida.

**Investigação Necessária:**
- [ ] Verificar `React Query DevTools` para ver estado do cache
- [ ] Inspecionar `network tab` para ver se respostas da API estão chegando
- [ ] Adicionar `console.log` nos hooks para ver dados brutos
- [ ] Verificar se `queryClient.invalidateQueries` usa mesmas chaves

### 3.2. Inconsistências de Contrato Restantes

| Componente | Problema | Impacto |
|------------|----------|---------|
| `ServiceBalanceAggregated` | Interface local com camelCase, mas dados da API vêm em PascalCase | `ServicesPage` não renderiza saldos |
| `useAllServiceBalances` | Retorna `UnifiedServiceBalance[]` (PascalCase), mas `ServicesPage` espera `ServiceBalanceAggregated[]` (camelCase) | Mismatch de tipo |
| `getAggregatedBalances` | Função referenciada mas não implementada em `serviceBalanceService` | Erro de runtime |
| `ContractAssignDialog` | Acessa `offer.id` (camelCase) em vez de `offer.Id` | Chave `undefined` |

### 3.3. Segurança Pendente

| ID | Problema | Severidade | Status |
|----|----------|------------|--------|
| S1 | `.env` commitados com `JWT_SECRET` e `DB_PASSWORD` | 🔴 Crítica | ⚠️ Pendente (requ ação manual) |
| S2 | `GET /Orders` retorna todos os pedidos (IDOR) | 🔴 Crítica | ✅ Mitigado (filtro por UserId) |
| S3 | CORS `AllowAnyOrigin` | 🟡 Alta | ⚠️ Pendente |
| S4 | JWT em LocalStorage (XSS) | 🟡 Média | ⚠️ Aceito (ciente) |
| S5 | Sem Refresh Token | 🟡 Média | ⚠️ Backlog |
| S6 | Exception handler sem logging | 🟡 Média | ⚠️ Backlog |

---

## 4. Roadmap de Implementação

### Fase 1: Diagnóstico e Estabilização (Imediato)

**Objetivo:** Fazer os dados aparecerem nas páginas e garantir que CRUDs estão 100% funcionais.

| Tarefa | Escopo | Critério de Aceite |
|--------|--------|-------------------|
| **1.1. Auditoria de Hooks** | Frontend | Todos hooks retornam `data` não-undefined |
| **1.2. Debug de Renderização** | Frontend | Listas de dados aparecem em `DashboardPage`, `OrdersPage`, `OffersPage` |
| **1.3. Validação de CRUDs** | Frontend + Backend | Criar, editar, excluir funcionam em Offers, VideoFormats, EditingStyles, Users |
| **1.4. Teste de Integração Manual** | End-to-end | Fluxo completo: Login → Listar → Criar → Editar → Excluir |

### Fase 2: Consolidação de Contrato (Curto Prazo)

**Objetivo:** Eliminar todas as inconsistências restantes entre frontend e backend.

| Tarefa | Escopo | Critério de Aceite |
|--------|--------|-------------------|
| **2.1. Unificar ServiceBalanceAggregated** | Frontend | Remover interface legada, usar `UnifiedServiceBalance` diretamente |
| **2.2. Implementar `getAggregatedBalances`** | Frontend | Função de mapeamento ou remoção completa do padrão legado |
| **2.3. Revisar Todos os Services** | Frontend | Nenhum service retorna tipo com camelCase |
| **2.4. Auditoria Global de camelCase** | Frontend | Busca global por `.id`, `.name`, `.status` — zerar ocorrências em DTOs de API |

### Fase 3: Segurança e Housekeeping (Médio Prazo)

**Objetivo:** Mitigar riscos críticos e limpar código morto.

| Tarefa | Escopo | Critério de Aceite |
|--------|--------|-------------------|
| **3.1. Rotacionar Secrets** | Infra | `JWT_SECRET`, `DB_PASSWORD` alterados em todos os ambientes |
| **3.2. Remover .env do Git** | Infra | `.env` em `.gitignore`, `.env.example` criado |
| **3.3. Restringir CORS** | Backend | Domínios específicos em produção |
| **3.4. Implementar Refresh Token** | Backend + Frontend | Endpoint `POST /auth/refresh` + lógica de renovação |
| **3.5. Logging Estruturado** | Backend | Serilog ou similar configurado |

### Fase 4: Documentação e Governança (Longo Prazo)

**Objetivo:** Garantir sustentabilidade e prevenir regressões.

| Tarefa | Escopo | Critério de Aceite |
|--------|--------|-------------------|
| **4.1. Atualizar ARCHITECTURE.md** | Docs | Menção a PascalCase, Snapshot Pattern, Clean Architecture |
| **4.2. Atualizar DATABASE_SCHEMA.md** | Docs | Remover `packages`, adicionar `offers` |
| **4.3. Atualizar media8_checkup_report.md** | Docs | Refletir estado atual (11 controllers, testes implementados) |
| **4.4. Criar Guia de Migração PascalCase** | Docs | Protocolo para futuras migrações de contrato |
| **4.5. Adicionar Testes de Contrato** | Backend + Frontend | Testes que validam PascalCase em DTOs |

---

## 5. Protocolo de Execução

### Regras de Comprometimento

1. **Commits Atômicos:** Cada correção = 1 commit. Não agrupar múltiplas correções.
2. **Build Válido:** `dotnet build` e `tsc --noEmit` devem passar antes de cada commit.
3. **Leitura Antes de Edição:** Sempre ler arquivo antes de editar.
4. **Sem Assumir Estado:** Verificar com `git status`, `git log`, e leitura de docs antes de agir.

### Padrão de Nomenclatura de Commits

```
<escopo>: <ação> <descrição curta>

Exemplos:
fix(web): corrige offer.id para offer.Id em OffersPage
feat(backend): adiciona endpoint PUT em OrdersController
docs: atualiza API_ROUTES.md com rotas reais
```

### Validação de Segurança

Antes de qualquer commit, validar:
- [ ] Nenhum segredo em `.env` foi commitado
- [ ] Nenhum dado sensível em logs ou respostas de erro
- [ ] Endpoints de listagem filtram por `UserId` quando aplicável

---

## 6. Próximos Passos Imediatos

1. **Investigar renderização vazia** — usar React Query DevTools e network tab
2. **Corrigir `ServiceBalanceAggregated` mismatch** — unificar para `UnifiedServiceBalance`
3. **Validar CRUDs em produção local** — teste manual de todos os fluxos
4. **Documentar descobertas** — atualizar este roadmap com aprendizados

---

## 7. Referências

- **Case Study #065:** [Correção de Colapso PascalCase](implementations/065-correcao-colapso-migracao-pascalcase.md)
- **Case Study #064:** [API PascalCase Snapshot](implementations/064-api-pascal-case-snapshot-saldo.md)
- **Arquitetura:** [01-arquitetura-e-padroes.md](../01-arquitetura-e-padroes.md)
- **API Routes:** [API_ROUTES.md](../API_ROUTES.md)
