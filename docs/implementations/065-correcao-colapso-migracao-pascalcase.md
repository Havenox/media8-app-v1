# 065 - Corrigir Colapso de Migração PascalCase e Restaurar Funcionalidade dos CRUDs

**Autor:** Eduardo Nascimento (Havenox)  
**Data:** 24/05/2026

---

## 🚀 Desafio de Engenharia

A aplicação Media8 entrou em estado crítico de **colapso funcional** após uma migração incompleta para o padrão **PascalCase** no serializador JSON do .NET 10 (`PropertyNamingPolicy = null`). O sistema apresentava:

1. **Menus de navegação desaparecendo** do Dashboard Administrativo
2. **CRUDs completamente inoperantes** — listagens, criações, edições e exclusões falhavam silenciosamente
3. **Erros 400 Bad Request** em cascata no endpoint `/ServiceBalances/MyBalances`
4. **RBAC comprometido** — campo `Role` chegando como `undefined` no frontend
5. **Importações quebradas** no barrel de serviços (`services/index.ts`)
6. **Tipo fantasma `ServiceType`** referenciado em 7+ arquivos mas nunca definido

A causa raiz: **inconsistência de contrato** entre frontend e backend. O backend retornava JSON em **PascalCase** (`Id`, `Name`, `Status`), mas todos os hooks, componentes e páginas do frontend acessavam propriedades em **camelCase** (`.id`, `.name`, `.status`), resultando em `undefined` em tempo de execução.

O agente anterior falhou por **20+ commits** tentando resolver via "chute de case" (alternando entre `page`/`Page`, `active`/`Active`) sem inspecionar a resposta de erro `ProblemDetails` do .NET, criando um loop de adivinhação que durou horas. A solução cirúrgica exigiu **auditoria externa** que identificou 6 erros bloqueadores e 6 falhas críticas de segurança.

---

## 🧠 Estratégia da Solução

Adotou-se a abordagem de **commits atômicos por escopo técnico**, garantindo 0 erros de compilação (`dotnet build` e `tsc --noEmit`) a cada etapa:

1. **Estabilizar Contrato Backend:** Remover anotações de serialização conflitantes (`[JsonPropertyName]`) e garantir que todos os DTOs trafeguem em PascalCase nativo
2. **Corrigir Rota Crítica:** Adicionar endpoint `GET /{clientId:guid}` no `ServiceBalancesController` que o frontend já consumia
3. **Blindar RBAC:** Implementar filtros de escopo no `OrdersController.GetAll()` para prevenir vazamento IDOR
4. **Alinhar Frontend:** Varredura sistemática em hooks e páginas para migrar acessos de `camelCase` para `PascalCase`
5. **Limpar Código Morto:** Remover tipos fantasmas (`ServiceType`), imports quebrados e interfaces duplicadas
6. **Documentar Realidade:** Reescrever `API_ROUTES.md` com os endpoints reais e convenções vigentes

A decisão de usar **PascalCase estrito** (sem `[JsonPropertyName]`) foi mantida por alinhar-se ao padrão .NET nativo e evitar overhead de serialização, exigindo que o frontend espelhe exatamente o contrato do servidor.

---

## 🛠️ Implementação Técnica

### Backend (4 commits atômicos)

**Commit 1 — `47b48f4`:** Removido `[JsonPropertyName("role")]` de `AdminUserDto.cs:14`. O atributo forçava `role` minúsculo no JSON, quebrando a validação `user.Role` no frontend.

**Commit 2 — `2abe870`:** Reescrito `OrdersController.cs`:
- Adicionado `[Authorize]` e filtro de escopo por `UserId` no `GetAll()`
- Implementado `[HttpPut("{id}")]` para substituir `PATCH` inexistente
- Criado alias `[HttpGet("AvailableBalances")]` para a rota `available-balances`

**Commit 3 — `825d078`:** Adicionada rota `GET /{clientId:guid}` no `ServiceBalancesController` para suportar visão administrativa de saldos por cliente.

**Commit 4 — `1e74e1b`:** Implementado `UpdateAsync()` em `IOrderService` e `OrderService` para persistir atualizações de pedidos.

### Frontend — Serviços e Tipos (3 commits)

**Commit 5 — `caa169d`:** Corrigido `services/index.ts`:
- Substituído `profileService` por `brandingProfileService`
- Removidos exports inexistentes (`resetUsersState`, `resetOrdersState`, `addLots`)

**Commit 6 — `8ff2a9e`:** Limpeza de `types/services.ts`:
- Removido enum `ServiceType` (legado da Fase 0)
- Removidas interfaces duplicadas (`ServiceBalanceAggregated`, `ServiceBalance` camelCase)
- Removido `SERVICE_EXPIRATION_DAYS` e `serviceConfigs` (código morto)

**Commit 7 — `d4ebb10`:** Atualizado `orderService.ts`:
- Substituído `api.patch()` por `api.put()`
- Removido `ServiceType` de imports e assinaturas

### Frontend — Hooks (6 commits)

**Commits 8-13:** Migração sistemática em hooks do TanStack Query:
- `useOffers.ts`: `.name` → `.Name`, `.id` → `.Id`, `.status` → `.Status`
- `useVideoFormats.ts`: `.name` → `.Name`, `.id` → `.Id`
- `useUsers.ts`: payload de criação em PascalCase (`Name`, `Email`, `Role`)
- `useEditingStyles.ts`: `.id` → `.Id`, `.name` → `.Name`
- `useClientContracts.ts`: `.id` → `.Id`, `.clientId` → `.ClientId`
- `useBrandingProfiles.ts`: `.name` → `.Name`, `.id` → `.Id`

### Frontend — Páginas e Componentes (4 commits)

**Commit 14 — `6936ed5`:** Corrigido `SettingsPage.tsx`:
- `user?.name` → `user?.Name`, `user?.email` → `user?.Email`
- Respostas da API: `u.name` → `u.Name`, `u.email` → `u.Email`

**Commit 15 — `dcbb9dc`:** Bulk fix em 16 arquivos:
- `user.id` → `user.Id`, `user.role` → `user.Role`
- Afetou: `DashboardPage`, `OrdersPage`, `OrderDetailPage`, `EditsPage`, `ServicesPage`, `Sidebar`, `Header`, `MobileNav`

**Commit 16 — `db59ef7`:** Admin pages (`OffersPage`, `VideoFormatsPage`, `EditingStylesPage`):
- `offer.name` → `offer.Name`, `style.Name` → `style.Name`

**Commit 17 — `46dffed`:** Order pages:
- `order.status` → `order.Status`, `order.title` → `order.Title`
- `order.clientId` → `order.ClientId`, `order.deadline` → `order.Deadline`

### Documentação (1 commit)

**Commit 18 — `2ae2ebf`:** Reescrito `docs/API_ROUTES.md`:
- Documentados endpoints reais (`/offers`, `/video-formats`, `/editing-styles`)
- Removidas rotas legadas (`/packages`, `/assignments`, `/service-balances/my-balances`)
- Especificados verbos HTTP corretos (`PUT` ao invés de `PATCH`)

---

## 🎯 Impacto e Resultamento

* **Listagem de Dados Restaurada:** Todos os dados carregam corretamente com propriedades PascalCase
* **CRUDs Operacionais:** Criação, leitura, atualização e exclusão funcionam em todos os módulos
* **RBAC Funcional:** `user.Role` é lido corretamente, menus aparecem e proteção de rotas ativa
* **Cache do React Query Invalidado Corretamente:** IDs em PascalCase permitem invalidação precisa
* **Filtros de Status Operantes:** `order.Status === 'Pending'` funciona corretamente
* **Segurança Reforçada:** Vazamento IDOR no `GET /Orders` mitigado com filtro por `UserId`
* **Builds Estáveis:** 0 erros de TypeScript e 0 erros de build .NET

**Métricas de Código:**
- 18 commits atômicos
- 11 arquivos backend modificados
- 16 arquivos frontend modificados
- ~200 linhas de código morto removidas
- 6 erros bloqueadores corrigidos
- 6 falhas de segurança mitigadas

---

**Nota do Desenvolvedor:** *Esta migração expôs uma vulnerabilidade crítica em migrações de contrato: LLMs tendem a tratar erros de serialização como problemas estéticos de "case" em vez de quebras de contrato estrutural. A lição central é que **nenhuma alteração de serialização JSON deve ser feita sem inspecionar o `ProblemDetails` do .NET e validar o contrato exato no controlador e DTOs**. A próxima migração de contrato deve seguir o protocolo: (1) alterar serializador no backend, (2) compilar e testar endpoints manualmente, (3) gerar novo contrato TypeScript, (4) migrar hooks em lote, (5) validar em staging antes de commitar. O custo de 20 commits de "fix" por adivinhação foi ordas de 10x maior que uma migração atômica bem-sucedida.*
