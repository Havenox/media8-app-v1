# Verificação e Walkthrough: Arquitetura Snapshot

Este documento guia a verificação da nova arquitetura de **Blindagem de Contratos (Snapshot)** e **Unified Service Balances**.

## 1. Visão Geral das Mudanças

Implementamos o padrão **Snapshot** para garantir que alterações em Pacotes não afetem contratos já ativos. O contrato do cliente agora é uma cópia imutável ("Snapshot") feita no momento da atribuição.

### Componentes Chave
*   **Backend:** [PackageAssignments](file:///g:/DEV/Media8/media8-app-v1/media8-web/src/hooks/usePackageAssignments.ts#24-33) agora tem colunas `SnapshotPackageName`, `SnapshotPrice`, etc.
*   **API:** Novo endpoint unificado `/api/v1/service-balances/my-balances` que retorna contratos ativos/expirados com paginação.
*   **Frontend:** Novo hook [useServiceBalances](file:///g:/DEV/Media8/media8-app-v1/media8-web/src/hooks/useServiceBalances.ts#12-39) e componente `<ServiceBalanceList />` que substituiu as listas antigas no Dashboard e User Details.

## 2. Passos para Verificação

### Passo 1: Preparação
Certifique-se de que o Backend e Frontend estejam rodando e as migrações de banco de dados tenham sido aplicadas.

1.  **Backend:** `dotnet run` (Isso deve aplicar a migration `AddSnapshotsToAssignments` automaticamente se configurado, ou rode `dotnet ef database update`).
2.  **Frontend:** `npm run dev`.

### Passo 2: Criar e Atribuir Pacote (Cenário de Teste)
Vamos verificar se os dados do snapshot são gravados corretamente.

1.  Acesse como **Admin**.
2.  Vá em **Pacotes** (`/admin/packages`).
3.  Crie um pacote "Teste Snapshot V1" com *10 vídeos*.
4.  Vá em **Usuários** (`/admin/users`).
5.  Selecione um cliente e clique em **Atribuir Pacote**.
6.  Escolha "Teste Snapshot V1" e confirme.

### Passo 3: Modificar o Pacote Original (Prova de Imutabilidade)
Agora vamos alterar a definição original para provar que o contrato do cliente não muda.

1.  Volte em **Pacotes**.
2.  Edite o pacote "Teste Snapshot V1".
3.  Mude o nome para "Teste Snapshot V2 (Modificado)" e quantidade para *50 vídeos*.
4.  Salve.

### Passo 4: Verificar Dashboard do Cliente
Agora veremos o que o cliente vê.

1.  Acesse o **Dashboard do Cliente** (ou simule login, ou veja via User Details como Admin).
2.  O card de saldo deve mostrar:
    *   **Nome:** "Teste Snapshot V1" (O nome original, NÃO V2).
    *   **Quantidade:** "10 vídeos" (A quantidade original, NÃO 50).
    *   **Tag:** Dependendo da implementação visual, o ID do pacote original ainda linka, mas os textos vêm do snapshot.

### Passo 5: Consumo de Saldo
1.  No Dashboard, clique em "Usar Crédito" (se habilitado) ou simule consumo via API.
2.  O saldo deve decrementar corretamente do lote específico (Snapshot).

## 3. Detalhes Técnicos para Desenvolvedores

### API Unificada
O frontend agora consome `GET /service-balances/my-balances`, que retorna [UnifiedServiceBalanceDto](file:///g:/DEV/Media8/media8-app-v1/media8-api/Media8.Application/DTOs/Services/ServiceBalanceDtos.cs#22-33).
Exemplo de resposta:
```json
{
  "data": [
    {
      "id": "guid-do-lote",
      "packageName": "Teste Snapshot V1",  <-- VEM DO SNAPSHOT
      "serviceName": "Reels",
      "remainingQuantity": 10,
      "totalQuantity": 10,
      "status": "active"
    }
  ],
  "total": 1
}
```

### Frontend Hooks
*   [useServiceBalances](file:///g:/DEV/Media8/media8-app-v1/media8-web/src/hooks/useServiceBalances.ts#12-39): Substitui chamadas antigas. Suporta paginação infinita nativa.
*   [ServiceBalanceList](file:///g:/DEV/Media8/media8-app-v1/media8-web/src/components/dashboard/ServiceBalanceList.tsx#20-71): Componente visual padrão.

## Próximos Passos
*   Monitorar performance da query unificada em produção.
*   (Opcional) Migrar histórico antigo para Snapshots (via script SQL) se necessário para contratos legados.
