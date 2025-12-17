# [OBSOLETO - NÃO IMPLEMENTADO] Otimização: Lista Unificada de Pacotes do Cliente
> **ATENÇÃO:** Esta abordagem foi substituída pela **Reestruturação Arquitetural (Snapshot + ServiceBalances)** documentada em `016-arquitetura-snapshot-contratos.md`.

<!-- id: 015-deprecated -->

## Descrição do Problema
Atualmente, o sistema possui fragmentação na forma como exibe os pacotes de um cliente:
1.  **Dashboard do Cliente:** Exibe apenas um resumo limitado ou precisa fazer múltiplas requisições.
2.  **Admin > Usuários (Detalhes):** Fazia requisições redundantes de todos os pacotes.

## Novo Paradigma Arquitetural (Pos-Discussão)

### 1. Conceitos Refinados
*   **Produto (Tabela `Package`):** É o item do catálogo. Pode ser:
    *   **Avulso:** 1 unidade, sem renovação (ex: 1 Reels).
    *   **Pacote:** N unidades, sem renovação (ex: 5 Reels).
    *   **Assinatura:** N unidades, com renovação (ex: Plano Growth).
    *   *Nota:* Um produto sempre entrega um único `ServiceType` (não há mix de escopos no MVP).
*   **Contrato (Tabela `PackageAssignment`):** O registro da compra. Gerencia renovação e validade administrativa.
*   **Saldo/Card (Tabela `ServiceBalanceLot`):** O item visual no Dashboard. É o que o usuário clica para "Fazer um Pedido". É aqui que está o `RemainingQuantity`.

### 2. Solução Definitiva: API de Saldos Unificada

Em vez de listar Atribuições (`PackageAssignments`), vamos listar **Lotes de Saldo (`ServiceBalanceLots`)**.
Isso resolve a exibição dos "Cards Amarelos" onde o usuário vê seus créditos disponíveis.

#### Backend
*   **Novo Endpoint:** `GET /api/v1/service-balances/my-balances` (Paginado)
*   **Repositório:** `IServiceBalanceRepository.GetPagedByUserIdAsync(...)`
*   **Retorno Enriquecido (DTO):**
    *   `Id` (Do Lote)
    *   `PackageName` (Nome do Produto, ex: "Plano Growth")
    *   `ServiceName` (ex: "Reels Estratégico")
    *   `RemainingQuantity` (Saldo atual)
    *   `ExpiresAt` (Validade do Lote)
    *   `Status` (Ativo/Expirado - derivado da data)

#### Frontend
*   **Componente `<ServiceBalanceList />`:** Substitui a lista de pacotes no Dashboard e nos Detalhes do Usuário.
*   **Hooks:** `useServiceBalances({ userId, type: 'active' })`.

## Discussão: Refatorar "Package" para "Product"?
Embora semanticamente "Produto" ou "Oferta" seja um nome melhor que "Pacote" (já que "Pacote" confunde com "Agrupamento"), uma refatoração completa do nome da tabela e classes (`Package` -> `Product`) traria alto risco de regressão.
**Decisão:** Manteremos `Package` no código (Backend/DB) mas trataremos como "Produto/Oferta" no domínio/UI. O termo "Serviço" será reservado para o *tipo de trabalho* (Reels, Edição), e não para o produto comercial.
