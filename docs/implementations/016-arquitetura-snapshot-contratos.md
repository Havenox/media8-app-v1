# Reestruturação Arquitetural: Contratos Blindados e Saldos Unificados
<!-- id: 016 -->

## 1. Contexto e Problema
A arquitetura anterior exibia inconsistências visuais e riscos de integridade:
1.  **Mutabilidade Insegura:** Alterações na definição de um `Package` (Produto) refletiam retroativamente nos `assignments` (contratos) já vendidos na visualização do Admin, embora o saldo técnico (`ServiceBalanceLot`) estivesse correto.
2.  **Fragmentação de API:** O frontend precisava buscar dados de `/packages` para compor telas de saldos, gerando overfetching e acoplamento desnecessário.
3.  **Dependência de "Pacote" para UI:** A interface do dashboard dependia do conceito de "Pacote" (contrato) para exibir saldos, dificultando a seleção explícita de "de onde gastar".

## 2. Nova Arquitetura de Dados (Pattern: Snapshot)

### Conceito
O `PackageAssignment` deixa de ser um mero link para `Package`. Ele passa a ser um **Contrato Histórico Imutável**. No momento da compra, os termos cruciais são *copiados* do Produto para o Contrato.

### Alterações no Banco de Dados (Migrations)
Adição de colunas na tabela `PackageAssignments`:
*   `SnapshotPackageName` (string): Nome do produto na época.
*   `SnapshotVideoQuantity` (int): Quantidade contratada original.
*   `SnapshotPrice` (decimal): Preço pago/acordado.
*   `SnapshotValidityDays` (int?): Validade acordada.

*Nota:* O `PackageId` permanece como referência para fins de BI/Estatística ("Quantos 'Plano Growth' vendemos?"), mas não para exibição de termos do contrato.

## 3. Nova Arquitetura de API (Unified Service Balances)

A fonte da verdade para o Dashboard do Cliente e Detalhes do Admin passa a ser a tabela de **Lotes de Saldo (`ServiceBalanceLot`)**, enriquecida com dados do **Contrato (`PackageAssignment`)**.

### Novo Endpoint: `GET /api/v1/service-balances/my-balances`
Este endpoint serve tanto ao Cliente (meus saldos) quanto ao Admin (saldos do cliente X).

#### Request
```http
GET /api/v1/service-balances/my-balances?clientId={guid}&page=1&pageSize=20&status=active
```

#### Response (DTO Enriquecido)
```json
{
  "data": [
    {
      "id": "guid-do-lote",
      "serviceName": "Reels Estratégico",  // Do ServiceType
      "packageName": "Plano Growth",       // Do SnapshotPackageName
      "remainingQuantity": 12,             // Do ServiceBalanceLot
      "totalQuantity": 12,                 // Do SnapshotVideoQuantity (ou do Lote original)
      "expiresAt": "2024-12-31T23:59:59Z", // Do Contrato ou Lote
      "purchaseDate": "2024-01-01T10:00:00Z"
    }
  ],
  "meta": { "total": 1, "page": 1 }
}
```

## 4. Plano de Implementação

### Fase 1: Backend & Migrations
1.  **Domain:** Adicionar propriedades `Snapshot*` na entidade `PackageAssignment`.
2.  **EF Core:** Criar e aplicar Migration (`AddSnapshotsToAssignments`).
3.  **Controller (Create):** Atualizar `PackageAssignmentsController.Create` para popular os Snapshots no momento da atribuição.
4.  **Repository:** Criar `IServiceBalanceRepository.GetPagedByUserIdAsync` com `.Include(x => x.Assignment)`.
5.  **API:** Criar endpoint `ServiceBalancesController.GetMyBalances`.

### Fase 2: Frontend
1.  **Types:** Criar interface `ServiceBalanceItem` com os novos campos.
2.  **Hook:** Criar `useServiceBalances`.
3.  **Componente:** Criar `<ServiceBalanceList />` para substituir a lista antiga de pacotes.
4.  **Integração:** Atualizar `Dashboard` e `UserDetailsSheet` para usar o novo componente.

## 5. Benefícios
*   **Imutabilidade Jurídica:** Alterar preços/prazos no futuro não afeta contratos passados.
*   **Performance:** Apenas 1 query otimizada para listar tudo que o cliente "tem".
*   **Clareza UX:** O cliente vê exatamente o item que vai consumir (o Lote), facilitando a ação de "Novo Pedido".
