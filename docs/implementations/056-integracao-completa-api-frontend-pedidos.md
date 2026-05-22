# 056 - Pedidos: Integração Completa de API e Frontend

**Autor:** Eduardo Nascimento (Havenox)  
**Data:** 21/05/2026

---

## 🚀 Desafio de Engenharia

O módulo de pedidos estava incompleto e desconectado da infraestrutura de saldos. Os principais problemas eram:

1. **API Incompleta**: Backend não expunha endpoint para listar saldos disponíveis nem para cancelamento de pedidos com estorno automático.
2. **Frontend Desconectado**: O formulário de criação de pedidos (`NewOrderPage.tsx`) ainda solicitava "Formato de Vídeo" ao invés de permitir a seleção do lote de saldo que financiaria a edição.
3. **Falta de Validação**: O botão "Criar Pedido" ficava desabilitado sem feedback visual, impedindo usuários de entender por que não conseguiam submeter o formulário.
4. **Erros de Serialização**: O backend esperava `DateOnly` (formato `yyyy-MM-dd`) mas recebia ISO completa do JavaScript, causando erro 400.
5. **Componentes Não Controlados**: Warning de console sobre Select mudando de uncontrolled para controlled, causando instabilidade.

## 🧠 Estratégia da Solução

A solução foi dividida em camadas, seguindo a arquitetura limpa:

1. **Camada de Domínio**: Expandir `OrderStatus` para incluir estados finais (`Completed`, `Cancelled`) e intermediários (`Draft`, `Processing`). Adicionar propriedades de vínculo (`ServiceBalanceLotId`, `AssignmentId`) à entidade `Order`.

2. **Camada de Serviço**: Implementar `CancelOrderAsync` com regra de negócio de estorno: se lote expirado, estende validade em 30 dias antes de creditar saldo.

3. **Camada de API**: Expor endpoints RESTful para:
   - `GET /api/v1/orders/available-balances`: Lista saldos do usuário
   - `POST /api/v1/orders/{id}/cancel`: Cancela pedido com estorno
   - `POST /api/v1/orders`: Valida saldo antes de criar

4. **Camada de Frontend**:
   - Substituir seleção de formato por dropdown de saldos disponíveis
   - Implementar feedback visual imediato (toasts + mensagens de erro)
   - Corrigir serialização de data para `yyyy-MM-dd`
   - Garantir componentes controlados com fallback para string vazia

## 🛠️ Implementação Técnica

### Backend (.NET 10 / C# 13)

**Entidade `Order` (OrderAggregate.cs):**
- Adicionado `ServiceBalanceLotId` (FK para lote de saldo)
- Adicionado `AssignmentId` (FK para contrato)
- `OrderStatus` expandido: `Draft`, `Pending`, `Processing`, `InProgress`, `InReview`, `ChangesRequested`, `Approved`, `Completed`, `Cancelled`

**Serviço `OrderService.cs`:**
```csharp
public async Task<OrderResponse> CreateAsync(
    CreateOrderRequest request, 
    Guid userId, 
    Guid serviceBalanceLotId)
{
    // Valida e debita saldo do lote
    var balanceLot = await _balanceRepository.GetByIdAsync(serviceBalanceLotId)
        ?? throw new InvalidOperationException("Lote não encontrado.");
    
    if (balanceLot.RemainingQuantity <= 0)
        throw new InvalidOperationException("Saldo insuficiente.");
    
    balanceLot.RemainingQuantity -= 1;
    await _balanceRepository.UpdateAsync(balanceLot);
    
    // Cria pedido com vínculo
    var order = new Order
    {
        ClientId = userId,
        ServiceBalanceLotId = serviceBalanceLotId,
        AssignmentId = balanceLot.AssignmentId,
        Status = OrderStatus.Draft
    };
    
    await _orderRepository.AddAsync(order);
    return MapToResponse(order);
}

public async Task<OrderResponse> CancelOrderAsync(Guid orderId)
{
    var order = await _orderRepository.GetByIdAsync(orderId)
        ?? throw new InvalidOperationException("Pedido não encontrado.");
    
    // Valida estado (apenas Draft ou Pending)
    if (order.Status != OrderStatus.Draft && order.Status != OrderStatus.Pending)
        throw new InvalidOperationException("Pedido não pode ser cancelado.");
    
    // Estorna saldo
    if (order.ServiceBalanceLotId.HasValue)
    {
        var balanceLot = await _balanceRepository.GetByIdAsync(order.ServiceBalanceLotId.Value);
        if (balanceLot != null)
        {
            // Se expirado, estende 30 dias
            if (balanceLot.ExpiresAt.HasValue && balanceLot.ExpiresAt < DateTime.UtcNow)
            {
                balanceLot.ExpiresAt = DateTime.UtcNow.AddDays(30);
            }
            
            balanceLot.RemainingQuantity += 1;
            await _balanceRepository.UpdateAsync(balanceLot);
        }
    }
    
    order.Status = OrderStatus.Cancelled;
    await _orderRepository.UpdateAsync(order);
    return MapToResponse(order);
}
```

**Controller `OrdersController.cs`:**
```csharp
[HttpGet("available-balances")]
public async Task<ActionResult<List<ServiceBalanceLot>>> GetAvailableBalances()
{
    var userId = GetCurrentUserId();
    var now = DateTime.UtcNow;
    var allLots = await _balanceRepository.FindAsync(l => l.UserId == userId);
    
    var availableLots = allLots
      .Where(l => l.RemainingQuantity > 0 
                  && (!l.ExpiresAt.HasValue || l.ExpiresAt.Value > now))
      .ToList();

    return Ok(availableLots);
}

[HttpPost("{id}/cancel")]
public async Task<ActionResult<OrderResponse>> Cancel(Guid id)
{
    var response = await _orderService.CancelOrderAsync(id);
    return Ok(response);
}
```

**DTO `CreateOrderRequest.cs`:**
```csharp
public class CreateOrderRequest
{
    public string Title { get; set; } = string.Empty;
    public string Briefing { get; set; } = string.Empty;
    public string SourceFilesUrl { get; set; } = string.Empty;
    public Guid VideoFormatId { get; set; }
    public Guid ServiceBalanceLotId { get; set; } // Novo campo obrigatório
    public DateOnly Deadline { get; set; }
}
```

### Frontend (React 18 / TypeScript)

**Tipos (`types/api.ts`):**
```typescript
export type OrderStatus =
  | 'Draft'
  | 'Pending'
  | 'Processing'
  | 'InProgress'
  | 'InReview'
  | 'ChangesRequested'
  | 'Approved'
  | 'Completed'
  | 'Cancelled';

export interface ServiceBalanceLot {
  id: string;
  userId: string;
  videoFormatId: string;
  quantity: number;
  remainingQuantity: number;
  expiresAt?: string | null;
  contract?: { snapshotOfferName?: string };
}

export interface CreateOrderRequest {
  title: string;
  briefing: string;
  sourceFilesUrl: string;
  deadline: string; // yyyy-MM-dd
  videoFormatId: string;
  serviceBalanceLotId: string; // Obrigatório
}
```

**Service (`services/orderService.ts`):**
```typescript
const orderService = {
  async cancel(id: string): Promise<Order> {
    const response = await api.post(`/orders/${id}/cancel`);
    return response.data;
  },
  
  async getAvailableBalances(): Promise<ServiceBalanceLot[]> {
    const response = await api.get('/orders/available-balances');
    return response.data;
  }
};
```

**Hooks (`hooks/useOrders.ts`):**
```typescript
export const useCancelOrder = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => orderService.cancel(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(data.id) });
      toast.success('Pedido cancelado com sucesso! Saldo estornado.');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao cancelar pedido');
    },
  });
};

export const useAvailableBalances = () => {
  return useQuery({
    queryKey: orderKeys.availableBalances(),
    queryFn: () => orderService.getAvailableBalances(),
  });
};
```

**Página `NewOrderPage.tsx`:**
```typescript
// Formatação de data para DateOnly
const formattedDeadline = data.deadline
  ? data.deadline.toISOString().split('T')[0]
  : new Date().toISOString().split('T')[0];

// Componente controlado com fallback
<Select value={field.value || ""} onValueChange={field.onChange}>

// Validação com feedback
const handleFormSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  const isValidated = await trigger();
  
  if (!isValidated) {
    const errorMessages = Object.entries(errors).map(([field, error]) => 
      `${field}: ${error.message}`
    );
    toast.error('Preencha os campos obrigatórios:', {
      description: errorMessages.join('\n'),
    });
    return;
  }
  
  handleSubmit(onSubmit)(e);
};
```

**Página `OrdersPage.tsx`:**
```typescript
const handleCancelOrder = async (orderId: string) => {
  await cancelOrderMutation.mutateAsync(orderId);
};

const canCancelOrder = (status: string) => {
  return status === 'Draft' || status === 'Pending';
};

// No dropdown menu
{canCancelOrder(order.status) && (
  <DropdownMenuItem
    onClick={() => handleCancelOrder(order.id)}
    disabled={cancelOrderMutation.isPending}
  >
    Cancelar (Estorno)
  </DropdownMenuItem>
)}
```

### Infrastructure (Docker & Migrations)

**Dockerfile:**
```dockerfile
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app

# Install system dependencies for Kerberos authentication
RUN apt-get update && apt-get install -y libgssapi-krb5-2 && rm -rf /var/lib/apt/lists/*

EXPOSE 80
EXPOSE 443
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "Media8.Api.dll"]
```

**Migration `FixSchemaSync`:**
- Adiciona valores ao enum `order_status`
- Cria colunas `AssignmentId`, `ContractId`, `ServiceBalanceLotId` em `Orders`
- Cria índices e foreign keys

## 🎯 Impacto e Resultado

* **Cancelamento com Estorno Automático**: Pedidos em `Draft` ou `Pending` podem ser cancelados, devolvendo saldo ao lote original (com extensão de 30 dias se expirado).
* **Seleção de Saldo no Frontend**: Usuários selecionam qual lote financiará o pedido, com feedback visual claro de quantidade e validade.
* **Feedback de Validação Imediato**: Botão "Criar Pedido" sempre clicável, com toast listando erros e bordas vermelhas em inputs inválidos.
* **Fim dos Erros 400**: Data formatada como `yyyy-MM-dd` compatível com `DateOnly` do .NET.
* **Container Estável**: Sem crashes por dependência de `libgssapi-krb5-2` ou warnings de `PendingModelChanges`.
* **Código Testável**: Hooks separados, service layer com validações, testes de integração para cancelamento.

---

**Nota do Desenvolvedor:** 
A integração completa de pedidos exigiu coordenação entre 5 camadas (Domínio, Aplicação, Infraestrutura, API e Frontend). A decisão de expor `ServiceBalanceLotId` no DTO foi crucial para rastreabilidade: cada pedido sabe exatamente qual lote o financiou, permitindo estorno preciso no cancelamento. O feedback visual no frontend (toasts + bordas vermelhas) eliminou a frustração de usuários com botões desabilitados sem explicação. A correção de serialização de data (`DateOnly`) e componentes controlados (`value || ""`) demonstrou que detalhes aparentemente pequenos têm impacto direto na experiência do usuário final.
