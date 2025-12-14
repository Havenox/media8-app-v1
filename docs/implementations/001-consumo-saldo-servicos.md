# Implementação: Consumo de Saldo de Serviços (Full Stack)

**Data:** 13/12/2025
**Responsável:** Havenox
**Status:** Implementado

## Resumo
Implementação completa (Frontend e Backend) do fluxo de consumo de créditos de serviços (`ServiceBalanceLot`). O sistema garante que, ao criar um pedido, os créditos do cliente sejam descontados corretamente usando lógica FIFO (First-In, First-Out) baseada na validade.

## Justificativa
O sistema precisa garantir integridade financeira e de inventário. O Frontend deve bloquear pedidos sem saldo, e o Backend deve garantir o desconto atômico dos créditos mais antigos primeiro.

---

## Backend (Media8.Api)

### Lógica de Negócio (FIFO)
*   **Serviço**: `ServiceBalanceService.ConsumeAsync`
*   **Regra**: Prioriza lotes com `ExpiresAt` mais próximo. Ignora lotes expirados ou zerados.
*   **Segurança**: Endpoint protegido que valida se o usuário operante tem permissão sobre o saldo.

### API Endpoint
*   `POST api/v1/users/{userId}/service-balances/consume`
*   Payload: `{ serviceType: "tipo", quantity: 1 }`

---

## Frontend (Media8.Web)

### Integração UI
*   **Feedback Visual**: O dropdown de serviços em `NewOrderPage` agora exibe a quantidade disponível (ex: "Reels (3)").
*   **Validação Prévia**: Impede a submissão se o saldo for insuficiente.

### Fluxo de Criação de Pedido
1.  **Verificação**: Usuário seleciona serviço e vê saldo.
2.  **Consumo**: Ao clicar em "Criar", o front chama o endpoint de consumo (`consumeService`).
3.  **Confirmação**: Se o consumo retorna sucesso, o pedido é efetivamente criado (`createOrder`).
4.  **Rollback/Erro**: Se o consumo falhar, o pedido não é criado e o usuário é notificado.

## Arquivos Relacionados
*   **Backend**: `ServiceBalanceService.cs`, `UsersController.cs`
*   **Frontend**: `NewOrderPage.tsx`, `useServiceBalances.ts`
