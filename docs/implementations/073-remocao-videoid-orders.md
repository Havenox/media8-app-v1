# 073 - Domain: Remoção da Coluna VideoFormatId da Tabela Orders

**Autor:** Eduardo Nascimento (Havenox)  
**Data:** 27/05/2026

---

## 🚀 Desafio de Engenharia

A tabela `Orders` continha uma coluna `VideoFormatId` que **nunca deveria ter existido**. Esta violação arquitetural causava:

1. **Inconsistência de Domínio**: A entidade `Order` estava acoplada diretamente à tabela `VideoFormats`, quebrando o princípio do snapshot imutável
2. **Lógica Duplicada**: O `OrderService` fazia lookup desnecessário do `VideoFormatId` via `ClientContract → SnapshotVideoFormatName`
3. **Frontend Quebrado**: A tela `/orders/new` exigia envio de `VideoFormatId` que não fazia sentido no fluxo
4. **Acoplamento Indevido**: `Order` não deveria ter FK para `VideoFormat` pois essa informação já está capturada no snapshot do `ClientContract`

**Problema Raiz**: A entidade `Order` estava recebendo `VideoFormatId` no momento da criação, quando na verdade deveria obter essa informação indiretamente através do `ServiceBalanceLot → ClientContract → SnapshotVideoFormatName`.

## 🧠 Estratégia da Solução

Aplicação do princípio **"Order é Agnóstico ao VideoFormat"**:

1. **Remoção da FK**: Eliminar `VideoFormatId` da entidade `Order` e da tabela do banco
2. **Fluxo Indireto**: Quando necessário, obter `VideoFormat` via navegação: `Order → ServiceBalanceLot → ClientContract → SnapshotVideoFormatName`
3. **Simplificação do DTO**: `CreateOrderRequest` passa a enviar apenas `ServiceBalanceLotId`
4. **Backend Responsável**: O backend descobre o `VideoFormatId` automaticamente quando necessário, usando o snapshot do contrato

**Decisão Arquitetural**: O snapshot do `ClientContract` já contém `SnapshotVideoFormatName` e `SnapshotMaxDurationSeconds` - informações imutáveis copiadas da `Offer` no momento da atribuição. Não há necessidade de duplicar essa informação em `Order`.

## 🛠️ Implementação Técnica

### Backend (6 commits atômicos)

**Commit 1 — `3349d24` (Domain):**
- Removido `VideoFormatId` da entidade `Order`
- Adicionado comentário explicando fluxo: `ServiceBalanceLot → ClientContract → SnapshotVideoFormatName`

**Commit 2 — `5fb5c1e` (Application DTOs):**
- Removido `VideoFormatId` do `CreateOrderRequest`
- Removido `VideoFormatId` do `OrderResponse`
- Atualizado comentário: "O VideoFormatId será obtido automaticamente do contrato associado"

**Commit 3 — `7a65aee` (Application Service):**
- Removido lookup de `VideoFormat` no `OrderService.CreateAsync()`
- Removida validação de `SnapshotVideoFormatName`
- Pedido criado apenas com `ServiceBalanceLotId`
- Código reduzido de 35 linhas para 10 linhas (menos complexidade)

**Commit 4 — `9c3310e` (Application DTOs):**
- Consolidado remoção do `VideoFormatId` do `OrderResponse`

**Commit 5 — `2ab5756` (Infrastructure):**
- Atualizado `DbSeeder.CreateOrder()` para não usar `VideoFormatId`
- Criada migration inicial (automática do EF Core)

**Commit 6 — `5307b32` (Infrastructure Migration):**
- Removida migration automática (continha efeitos colaterais indesejados)
- Criada migration manual limpa: apenas `DROP COLUMN "VideoFormatId" FROM "Orders"`
- Migration aplicada com sucesso no PostgreSQL

### Frontend (4 commits atômicos)

**Commit 7 — `1b6c1bb` (Types):**
- Removido `VideoFormatId` da interface `Order`
- Removido `VideoFormatId` da interface `CreateOrderRequest`

**Commit 8 — `f371b5d` (Services):**
- Removido `videoFormatId` da interface `CreateOrderData` no `orderService.ts`

**Commit 9 — `960f15b` (Hooks):**
- Removido `VideoFormatId` da interface `CreateOrderData` no `useOrders.ts`
- Removido import desnecessário de `VideoFormat`

**Commit 10 — `68db5b8` (Pages):**
- `NewOrderPage.tsx` agora envia apenas `ServiceBalanceLotId`
- Removida lógica de seleção e armazenamento de `VideoFormatId`
- Schema do Zod simplificado

## 🎯 Impacto e Resultado

* **Integridade de Domínio Restaurada**: `Order` não tem mais acoplamento direto com `VideoFormat`
* **Código Mais Simples**: `OrderService` reduziu 25 linhas de lógica desnecessária
* **Frontend Funcional**: Tela `/orders/new` agora funciona corretamente sem enviar dados redundantes
* **Snapshot Preservado**: Informação de `VideoFormat` permanece imutável no `ClientContract`
* **Migration Segura**: Banco de dados atualizado sem perda de dados críticos
* **10 Commits Atômicos**: Cada escopo (domain, application, infra, types, services, hooks, pages) commitado separadamente

## 📋 Fluxo Atualizado

```
[Frontend] Cria Pedido
   ↓
Envia: { ServiceBalanceLotId, Title, Briefing, ... }
   ↓
[Backend] OrderService.CreateAsync()
   ↓
Cria Order com ServiceBalanceLotId
   ↓
[Quando necessário obter VideoFormat]
   ↓
Order → ServiceBalanceLot → ClientContract → SnapshotVideoFormatName
   ↓
Lookup opcional: VideoFormat.Where(v => v.Name == SnapshotVideoFormatName)
```

---

**Nota do Desenvolvedor:** *Esta refatoração corrigiu um erro arquitetural grave onde a entidade `Order` estava violando o princípio do snapshot imutável. A lição aprendida é: **nunca adicione FKs a entidades que já podem obter informações indiretamente através de outras entidades**. O `ClientContract` já captura o estado do `VideoFormat` no momento da contratação - duplicar essa informação em `Order` era redundante e causava acoplamento desnecessário. O fluxo atual segue o princípio de menor conhecimento: `Order` sabe apenas sobre `ServiceBalanceLot`, e este sabe sobre `ClientContract`, que por sua vez contém o snapshot completo. Isso torna o sistema mais coeso e menos propenso a inconsistências.*