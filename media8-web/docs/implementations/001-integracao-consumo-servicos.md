# Integração: Consumo de Saldo e Criação de Pedidos

**Data:** 13/12/2025
**Responsável:** Havenox

## Resumo da Proposta
Atualização do fluxo de criação de pedidos (`NewOrderPage`) para integrar a verificação e consumo do saldo de serviços do usuário. Agora, a interface bloqueia a criação de pedidos sem saldo e realiza o desconto (`consume`) via API antes de submeter o pedido.

## Justificativa (O Porquê)
O Frontend operava com dados mockados ou sem validação real de saldo. Para um ambiente de produção ("MVP"), era mandatório conectar a UI de "Novo Pedido" com a lógica real de inventário (`ServiceInventory`), garantindo que o usuário só possa solicitar serviços que realmente possui na conta.

## Detalhes da Implementação

### Frontend
1.  **Hooks e Services**:
    *   Atualização de `useServiceBalances.ts` para buscar dados reais da API.
    *   Integração do método `consumeService` em `serviceBalanceService.ts`.
2.  **Página `NewOrderPage`**:
    *   Adição de verificação prévia: O dropdown de serviços agora mostra a quantidade disponível ao lado do nome (ex: "Reels Padrão (3 disponíveis)").
    *   Lógica de Submit:
        1.  Chama `serviceBalanceService.consumeService()` para debitar 1 crédito.
        2.  Se sucesso, chama `orderService.createOrder()` para gerar o pedido.
        3.  Se falha no consumo, exibe erro e não cria o pedido.

### Práticas Adotadas
*   **Feedback Visual**: O usuário vê claramente quanto saldo tem antes de tentar pedir.
*   **Tratamento de Erros**: Falhas no consumo (API fora do ar ou saldo zerado concorrente) impedem o prosseguimento, evitando estado inconsistente.

## Arquivos Afetados
*   `src/pages/NewOrderPage.tsx`
*   `src/hooks/useServiceBalances.ts`
*   `src/services/serviceBalanceService.ts`
