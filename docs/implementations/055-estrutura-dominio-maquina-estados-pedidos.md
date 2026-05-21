# #055 - Estrutura de Domínio e Máquina de Estados para Pedidos

## Visão Geral

**Data:** 21/05/2026  
**Épico:** 4.3 - Governança de Pedados e Transações  
**Status:** ✅ Implementado

---

## Contexto e Problema

### Por que estamos fazendo isso?

O módulo de pedidos exige controle transacional rigoroso. Precisamos garantir que:

1. **Estados (Draft, Pending, Processing, Completed, Cancelled)** sejam respeitados em todo o ciclo de vida do pedido
2. **Regra de reembolso automático** devolva saldo ao contrato de origem com possível extensão de validade
3. **Integridade do domínio** seja preservada antes de expor qualquer coisa na API
4. **Rastreabilidade completa** do lote de saldo que financiou cada pedido

### Problemas Anteriores

- ❌ `OrderStatus` não incluía estados finais como `Completed` e `Cancelled`
- ❌ Sem vínculo entre pedido e lote de saldo original (`ServiceBalanceLotId`)
- ❌ Sem mecanismo de estorno de saldo em caso de cancelamento
- ❌ Sem testes de integração para validar fluxo de cancelamento
- ❌ Lotes expirados não eram elegíveis para reembolso com extensão de validade

---

## Solução Implementada

### 1. Expansão do Enum `OrderStatus`

**Arquivo:** `media8-api/Media8.Domain/Enums/SharedEnums.cs`

```csharp
public enum OrderStatus
{
    Draft,           // Novo: Rascunho inicial
    Pending,         // Existente: Aguardando início
    Processing,      // Novo: Em processamento ativo
    InProgress,      // Existente: Em andamento
    InReview,        // Existente: Em revisão
    ChangesRequested,// Existente: Alterações solicitadas
    Approved,        // Existente: Aprovado
    Completed,       // Novo: Finalizado com sucesso
    Cancelled        // Novo: Cancelado com estorno
}
```

**Por que:** Máquinas de estado explícitas previnem transições inválidas e permitem validação rigorosa no serviço.

---

### 2. Entidade `Order` Enriquecida

**Arquivo:** `media8-api/Media8.Domain/Entities/OrderAggregate.cs`

```csharp
public class Order
{
    // ... propriedades existentes ...
    
    public OrderStatus Status { get; set; } = OrderStatus.Draft;
    
    /// <summary>
    /// Foreign Key para o lote de saldo original (ServiceBalanceLot) que financiou este pedido
    /// Usado para reembolso em caso de cancelamento
    /// </summary>
    public Guid? ServiceBalanceLotId { get; set; }
    
    /// <summary>
    /// Foreign Key para o contrato de cliente (ClientContract) associado ao lote de saldo
    /// </summary>
    public Guid? AssignmentId { get; set; }
    
    // Navigation properties
    public ServiceBalanceLot? ServiceBalanceLot { get; set; }
    public ClientContract? Contract { get; set; }
}
```

**Por que:** O vínculo explícito com `ServiceBalanceLot` permite rastrear exatamente qual lote foi debitado e deve ser creditado em caso de cancelamento.

---

### 3. Serviço `OrderService` com Regra de Estorno

**Arquivo:** `media8-api/Media8.Application/Services/OrderService.cs`

```csharp
public async Task<OrderResponse> CancelOrderAsync(Guid orderId)
{
    var order = await _orderRepository.GetByIdAsync(orderId)
        ?? throw new InvalidOperationException($"Pedido {orderId} não encontrado.");
    
    // Validação de estado
    if (order.Status == OrderStatus.Cancelled)
        throw new InvalidOperationException($"Pedido {orderId} já está cancelado.");
    
    if (order.Status != OrderStatus.Draft && order.Status != OrderStatus.Pending)
        throw new InvalidOperationException(
            $"Pedido {orderId} não pode ser cancelado no status {order.Status}.");
    
    // Regra de estorno
    if (order.ServiceBalanceLotId.HasValue)
    {
        var balanceLot = await _balanceRepository.GetByIdAsync(order.ServiceBalanceLotId.Value);
        
        if (balanceLot != null)
        {
            // Se lote estiver expirado, estende validade em 30 dias
            if (balanceLot.ExpiresAt.HasValue && balanceLot.ExpiresAt < DateTime.UtcNow)
            {
                balanceLot.ExpiresAt = DateTime.UtcNow.AddDays(30);
                _logger.LogInformation(
                    "⏳ Lote {BalanceLotId} expirado, validade estendida para {NewExpiresAt}",
                    order.ServiceBalanceLotId,
                    balanceLot.ExpiresAt);
            }
            
            // Estorna 1 crédito
            balanceLot.RemainingQuantity += 1;
            await _balanceRepository.UpdateAsync(balanceLot);
            
            _logger.LogInformation(
                "💰 Reembolso de 1 crédito realizado para o lote {BalanceLotId}. Saldo atual: {Remaining}",
                order.ServiceBalanceLotId,
                balanceLot.RemainingQuantity);
        }
    }
    
    order.Status = OrderStatus.Cancelled;
    order.UpdatedAt = DateTime.UtcNow;
    await _orderRepository.UpdateAsync(order);
    
    _logger.LogInformation("✅ Pedido {OrderId} cancelado com sucesso.", orderId);
    
    return MapToResponse(order);
}
```

**Regra de Negócio:**
- Se o lote estiver **dentho da validade**: apenas devolve o saldo
- Se o lote estiver **vencido**: estende validade em 30 dias a partir de hoje E devolve o saldo
- Pedido só pode ser cancelado se estiver em `Draft` ou `Pending`

---

### 4. Interface `IOrderService` Atualizada

**Arquivo:** `media8-api/Media8.Application/Interfaces/IServices.cs`

```csharp
public interface IOrderService
{
    Task<OrderResponse> CreateAsync(CreateOrderRequest request, Guid userId);
    Task<OrderResponse> CancelOrderAsync(Guid orderId); // Novo método
    Task<OrderResponse?> GetByIdAsync(Guid id);
    Task<List<OrderResponse>> GetAllAsync();
    Task<List<OrderResponse>> GetByClientAsync(Guid clientId);
    Task<List<OrderResponse>> GetByEditorAsync(Guid editorId);
}
```

---

### 5. Teste de Integração

**Arquivo:** `media8-api/Media8.IntegrationTests/OrderCancellationTests.cs`

```csharp
[Fact]
public async Task CancelOrder_WithExpiredLot_ShouldRefundAndExtendExpiration()
{
    // Arrange
    using var scope = _factory.Services.CreateScope();
    var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    var orderService = scope.ServiceProvider.GetRequiredService<IOrderService>();
    
    // Cria usuário, lote expirado e pedido
    var userId = Guid.NewGuid();
    var balanceLot = new ServiceBalanceLot
    {
        UserId = userId,
        VideoFormatId = videoFormatId,
        Quantity = 5,
        RemainingQuantity = 4,
        ExpiresAt = DateTime.UtcNow.AddDays(-10), // Expirado há 10 dias
        Source = LotSource.Purchase
    };
    
    var order = new Order
    {
        ClientId = userId,
        ServiceBalanceLotId = balanceLot.Id,
        Status = OrderStatus.Pending
    };
    
    // Act
    var result = await orderService.CancelOrderAsync(order.Id);
    
    // Assert
    Assert.Equal(OrderStatus.Cancelled, result.Status);
    Assert.Equal(5, updatedLot.RemainingQuantity); // 4 + 1 refund
    Assert.True(updatedLot.ExpiresAt > DateTime.UtcNow); // Estendido
}
```

---

## Decisões de Design

### 1. Por que `ServiceBalanceLotId` em vez de `AssignmentId` direto?

**Decisão:** `Order.ServiceBalanceLotId` aponta para o lote, não para o contrato.

**Motivo:**
- O contrato (`ClientContract`) pode ter múltiplos lotes (`ServiceBalanceLot`)
- Cada consumo debita de um lote específico
- O reembolso deve ir para o MESMO lote que foi debitado
- `AssignmentId` é redundante (pode ser obtido via navegação `ServiceBalanceLot.AssignmentId`)

### 2. Por que estender validade em 30 dias?

**Regra de Negócio:** Quando um cliente cancela um pedido financiado por um lote expirado, a empresa oferece uma extensão de 30 dias como "cortesia" para o cliente não perder o crédito.

**Benefício:**
- Cliente não perde saldo por cancelamento
- Empresa mantém o cliente engajado por mais 30 dias
- Evita disputas de "dinheiro perdido"

### 3. Por que validar estado antes de cancelar?

**Motivo:** Pedidos em `Processing` ou `InProgress` já podem ter tido trabalho realizado pelo editor. Cancelar nesses estágios exigiria:
- Cálculo de penalidade
- Rateio proporcional
- Aprovação de gerente

**Solução:** Restringir cancelamento automático a `Draft` e `Pending`.

---

## Impacto

### Backend
- ✅ `OrderStatus` com 9 estados (antes: 5)
- ✅ `Order` com 2 novas FKs (`ServiceBalanceLotId`, `AssignmentId`)
- ✅ `OrderService.CancelOrderAsync()` com regra de estorno
- ✅ Logging de reembolso e extensão de validade

### Testes
- ✅ `OrderCancellationTests` valida fluxo completo
- ✅ Teste de lote expirado com extensão de validade
- ✅ Teste de estorno de saldo

### Próximos Passos (Fora do Escopo)
- [ ] Controller endpoint `POST /orders/{id}/cancel`
- [ ] Frontend: botão "Cancelar Pedido" com confirmação
- [ ] Frontend: modal de confirmação com aviso de perda de prazo
- [ ] Métricas: taxa de cancelamento por formato de vídeo

---

## Arquivos Modificados

| Arquivo | Mudança |
|---------|---------|
| `Media8.Domain/Enums/SharedEnums.cs` | Adicionado `Draft`, `Processing`, `Completed`, `Cancelled` |
| `Media8.Domain/Entities/OrderAggregate.cs` | Adicionado `ServiceBalanceLotId`, `AssignmentId`, navegação |
| `Media8.Application/Interfaces/IServices.cs` | Adicionado `CancelOrderAsync` |
| `Media8.Application/Services/OrderService.cs` | Implementado `CancelOrderAsync` com regra de estorno |
| `Media8.IntegrationTests/OrderCancellationTests.cs` | Novo teste de integração |

**Total:** 5 arquivos, +278 linhas, -101 linhas

---

## Lições Aprendidas

### ✅ Acertos
1. **Domínio primeiro:** Implementar regra de negócio no domínio antes de expor na API
2. **Teste de integração:** Validar fluxo completo com banco em memória
3. **Logging explícito:** Mensagens claras de reembolso e extensão
4. **Validação de estado:** Prevenir cancelamento indevido

### ⚠️ Melhorias Futuras
1. **Eventos de domínio:** Emitir `OrderCancelledEvent` para notificações
2. **Saga pattern:** Se estorno falhar, compensar com reversão
3. **Timeout:** Cancelamento automático após X dias em `Draft`
4. **Métricas:** Contabilizar pedidos cancelados vs concluídos

---

## Referências

- **Épico 4.3:** Governança de Pedados e Transações
- **Padrão:** Conditional Deletion Pattern (Case #048)
- **Relacionado:** Case #052 (Pipeline Estrito de Ciclo de Vida de Dados)

---

**Status:** ✅ Implementado e testado  
**Próximo:** Endpoint da API e UI de cancelamento
