# Otimização de Performance: Remoção de Fetch Redundante (UserDetailsSheet)

## Diagnóstico
Ao abrir o painel de detalhes do usuário (`UserDetailsSheet`), identificamos duas chamadas de API simultâneas:
1.  `GET /service-balances?status=active`: Busca os saldos ativos para exibição no novo componente `ServiceBalanceList`. **(Necessário)**
2.  `GET /package-assignments?clientId=...`: Busca o histórico de atribuições legado. **(Redundante)**

## Causa Raiz
O componente `UserDetailsSheet.tsx` manteve uma chamada ao hook `useClientAssignments` de uma implementação anterior.
Com a migração para a arquitetura de Snapshots e a introdução do `ServiceBalanceList`, a variável `assignments` retornada por esse hook **não é mais utilizada** no render do componente.

## Impacto
*   **Rede:** 1 request extra desnecessária a cada abertura de painel.
*   **Backend:** Processamento de query desnecessário no banco de dados.
*   **Frontend:** Ciclos de CPU gastos processando/ordenando dados que não são exibidos.

## Solução
Remover o código morto ("Dead Code") do componente `UserDetailsSheet.tsx`.

### Alterações Planejadas
*   Remover import `useClientAssignments`.
*   Remover chamada do hook e variáveis derivadas (`activeAssignments`, `sortedAssignments`).
*   Remover funções auxiliares não utilizadas (`getDaysUntilExpiry`, `hasExpiry`, etc., se não usadas em outro lugar).

## Resultado Esperado
O painel carregará apenas o endpoint `/service-balances`, mantendo a funcionalidade visual idêntica, mas com metade das requisições de rede.
