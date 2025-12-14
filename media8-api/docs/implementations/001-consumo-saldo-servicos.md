# Implementação: Consumo de Saldo de Serviços (FIFO)

**Data:** 13/12/2025
**Responsável:** Havenox

## Resumo da Proposta
Implementação da lógica de consumo de créditos de serviços (`ServiceBalanceLot`) e criação de um endpoint dedicado para esta operação. A lógica prioriza o consumo de lotes com vencimento mais próximo (FIFO - *First-In, First-Out* por validade).

## Justificativa (O Porquê)
O sistema precisa garantir que, ao criar um pedido, os créditos do cliente sejam descontados corretamente. Além disso, é crucial consumir primeiro os créditos que estão prestes a expirar para beneficiar o cliente e manter a consistência contábil do inventário.

A separação em um endpoint dedicado (`POST /consume`) foi necessária para atender à arquitetura atual do Frontend, que valida e consome o saldo antes de finalizar a criação do pedido visualmente.

## Detalhes da Implementação

### Backend
1.  **Interface `IServiceBalanceService`**: Criada para desacoplar a lógica de negócio dos controladores.
2.  **Serviço `ServiceBalanceService`**:
    *   Método `ConsumeAsync(userId, serviceType, quantity)`.
    *   **Lógica FIFO**: Busca todos os lotes ativos (`RemainingQuantity > 0` e não expirados) do usuário para o tipo de serviço. Ordena por `ExpiresAt` (nulos/infinitos por último).
    *   Deduz a quantidade iterativamente dos lotes até atingir o total necessário.
    *   Retorna `true` se sucesso, `false` se saldo insuficiente.
3.  **Controller `UsersController`**:
    *   Novo endpoint: `POST api/v1/users/{userId}/service-balances/consume`.
    *   Segurança: Valida se o usuário logado é o dono do saldo ou Admin.

### Práticas Adotadas
*   **Injeção de Dependência**: Serviço registrado no container DI (`Program.cs` / `DependencyInjection.cs`).
*   **Encapsulamento**: Lógica de "qual lote usar" isolada no Domain Service, não no Controller.
*   **Validação de Segurança**: Proteção contra consumo de saldo de terceiros.

## Arquivos Afetados
*   `Media8.Application/Services/ServiceBalanceService.cs` (Novo)
*   `Media8.Application/Interfaces/IServiceBalanceService.cs` (Novo)
*   `Media8.Api/Controllers/UsersController.cs` (Modificado)
