# 059 - UX de Cancelamento de Pedidos com Timer e Validação de Negócio

**Autor:** Eduardo Nascimento (Havenox)  
**Data:** 22/05/2026

---

## 🚀 Desafio de Engenharia

O sistema de cancelamento de pedidos possuía várias lacunas que impactavam a experiência do usuário e a consistência dos dados:

1. **Falta de Feedback Visual**: O backend retornava `400 Bad Request` para erros de regra de negócio, o que é semanticamente incorreto e dificultava o tratamento no frontend.

2. **Timer Inexistente**: Clientes não tinham visibilidade de quanto tempo ainda podiam cancelar seus pedidos, resultando em tentativas frustradas de cancelamento fora do prazo.

3. **Confirmação Ausente**: O cancelamento era executado sem confirmação, sem explicação sobre estorno de saldo, e sem tratamento educado para casos de erro.

4. **Configuração Fixa**: O valor da janela de cancelamento (24h) estava hardcoded no frontend, ignorando as configurações dinâmicas que o admin podia alterar.

5. **Inconsistência entre Páginas**: A página `/orders` não exibía toasts de erro quando a página `/orders/{id}` funcionava corretamente.

**Problema Central**: Como criar uma UX de cancelamento educada, informativa e consistente, que respeite regras de negócio dinâmicas e forneça feedback claro em todas as situações (sucesso, erro, prazo expirado)?

## 🧠 Estratégia da Solução

A solução foi implementada em 5 fases interligadas:

1. **Fase 1 (Backend Semântico)**: Criar `BusinessRuleException` e mapear para HTTP 422 Unprocessable Entity.
2. **Fase 2 (Frontend Proativo)**: Componente `CancelOrderButton` com timer regressivo e modal de confirmação.
3. **Fase 3 (Sincronização)**: Buscar configuração dinâmica do backend em vez de usar valor fixo.
4. **Fase 4 (Debug e Correção)**: Adicionar logs e garantir que toasts sejam sempre disparados.
5. **Fase 5 (Correção de Rota)**: Garantir que controller não capture exceções de negócio, deixando middleware tratar.

**Decisão Arquitetural Crítica**: 
- Separar claramente erros de validação de modelo (400) de erros de regra de negócio (422).
- Centralizar tratamento de `BusinessRuleException` em middleware global.
- Componentizar UX de cancelamento para reutilização em múltiplas páginas.

## 🛠️ Implementação Técnica

### Fase 1: Backend Semântico (422 para Regras de Negócio)

**Criação de `BusinessRuleException.cs`:**
```csharp
namespace Media8.Domain.Common;

public class BusinessRuleException : Exception
{
    public string ErrorCode { get; }

    public BusinessRuleException(string message, string errorCode) 
        : base(message)
    {
        ErrorCode = errorCode;
    }
}
```

**Middleware Global em `Program.cs`:**
```csharp
app.Use(async (context, next) =>
{
    try
    {
        await next.Invoke();
    }
    catch (BusinessRuleException ex)
    {
        context.Response.StatusCode = 422; // Unprocessable Entity
        context.Response.ContentType = "application/json";
        var result = new { message = ex.Message, errorCode = ex.ErrorCode };
        await context.Response.WriteAsJsonAsync(result);
    }
    catch (Exception ex)
    {
        context.Response.StatusCode = 500;
        var errorResult = new { message = "Erro interno no servidor." };
        await context.Response.WriteAsJsonAsync(errorResult);
    }
});
```

**Refatoração do `OrderService.CancelOrderAsync`:**
```csharp
public async Task<OrderResponse> CancelOrderAsync(Guid orderId)
{
    var order = await _orderRepository.GetByIdAsync(orderId)
        ?? throw new InvalidOperationException("Pedido não encontrado.");

    if (order.Status == OrderStatus.Cancelled)
        throw new BusinessRuleException(
            $"Pedido {orderId} já está cancelado.", 
            "ORDER_ALREADY_CANCELLED");

    if (order.Status != OrderStatus.Draft && order.Status != OrderStatus.Pending)
        throw new BusinessRuleException(
            $"Pedido {orderId} não pode ser cancelado no status {order.Status}.", 
            "ORDER_INVALID_STATUS");

    // Valida janela de tempo dinâmica
    var cancellationWindowHours = await _settingsService
        .GetSettingAsync<int>("CancellationWindowHours", 24);
    var timeSinceCreation = DateTime.UtcNow - order.CreatedAt;

    if (timeSinceCreation.TotalHours > cancellationWindowHours)
        throw new BusinessRuleException(
            $"Tempo limite excedido. Pedido criado há {timeSinceCreation.TotalHours:F1}h, " +
            $"limite é {cancellationWindowHours}h.",
            "CANCELLATION_WINDOW_EXPIRED");

    // Lógica de estorno...
}
```

### Fase 2: Componente `CancelOrderButton.tsx`

**Máquina de Estados:**
- **Vigente**: Exibe contador regressivo (HH:mm:ss ou mm:ss)
- **Expirado**: Botão desabilitado com ícone `AlertCircle`
- **Confirmação**: `AlertDialog` explicando reembolso

**Implementação do Timer:**
```typescript
const CancelOrderButton: React.FC<CancelOrderButtonProps> = ({
  orderId,
  createdAt,
  cancellationWindowHours = 24,
  onSuccess,
}) => {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const createdAtDate = new Date(createdAt);
    const deadline = new Date(
      createdAtDate.getTime() + cancellationWindowHours * 60 * 60 * 1000
    );
    
    const updateTimer = () => {
      const now = new Date().getTime();
      const diff = deadline.getTime() - now;
      
      if (diff <= 0) {
        setTimeLeft(0);
        setIsExpired(true);
      } else {
        setTimeLeft(diff);
        setIsExpired(false);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [createdAt, cancellationWindowHours]);

  // Formatação: HH:mm:ss ou mm:ss
  const formatTimeLeft = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
```

**Tratamento de Erros 422:**
```typescript
const cancelMutation = useMutation({
  mutationFn: () => orderService.cancel(orderId),
  onError: (error: any) => {
    console.log('CancelOrderButton onError:', error);
    
    if (error.response?.status === 422) {
      const errorCode = error.response.data?.errorCode;
      const message = error.response.data?.message || 'Regra de negócio violada.';

      if (errorCode === 'CANCELLATION_WINDOW_EXPIRED') {
        toast({
          title: 'Prazo de cancelamento expirado',
          description: message,
          variant: 'destructive',
        });
      } else if (errorCode === 'ORDER_ALREADY_CANCELLED') {
        toast({
          title: 'Pedido já cancelado',
          description: message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Não foi possível cancelar',
          description: message,
          variant: 'destructive',
        });
      }
    } else {
      // Erro genérico
      const fallbackMessage = error.response?.data?.message 
        || error.message 
        || 'Tente novamente mais tarde.';
      
      toast({
        title: 'Erro ao cancelar pedido',
        description: fallbackMessage,
        variant: 'destructive',
      });
    }
    setIsDialogOpen(false);
  },
});
```

### Fase 3: Sincronização com Configurações Dinâmicas

**Busca do Backend:**
```typescript
// OrderDetailPage.tsx
const { data: cancellationWindowHours = 24 } = useQuery({
  queryKey: ['settings', 'CancellationWindowHours'],
  queryFn: () => orderService.getCancellationWindow(),
  initialData: 24, // Fallback
});

// orderService.ts
export const orderService = {
  // ... outros métodos
  async getCancellationWindow(): Promise<number> {
    const response = await api.get<SystemSettingsResponse>('/admin/settings');
    const hours = response.data.settings['CancellationWindowHours'];
    return hours ? parseInt(hours, 10) : 24;
  },
};
```

### Fase 4: Integração nas Páginas

**OrderDetailPage.tsx:**
```typescript
{user?.role === 'Client' && (order.status === 'Draft' || order.status === 'Pending') && (
  <CancelOrderButton
    orderId={order.id}
    createdAt={order.createdAt}
    cancellationWindowHours={cancellationWindowHours}
    onSuccess={() => navigate('/orders')}
  />
)}
```

### Fase 5: Correção de Rota no Controller

**Remoção de Catch Genérico:**
```csharp
// ANTES (errado)
[HttpPost("{id}/cancel")]
public async Task<ActionResult<OrderResponse>> Cancel(Guid id)
{
    try
    {
        var response = await _orderService.CancelOrderAsync(id);
        return Ok(response);
    }
    catch (Exception ex)
    {
        return BadRequest(new { message = ex.Message }); // 400 errado!
    }
}

// DEPOIS (correto)
[HttpPost("{id}/cancel")]
public async Task<ActionResult<OrderResponse>> Cancel(Guid id)
{
    // Deixa exceção propagar para middleware global
    var response = await _orderService.CancelOrderAsync(id);
    return Ok(response);
}
```

**Proteção no CreateOrder:**
```csharp
try
{
    // Validações e criação do pedido
    if (balanceLot == null)
        throw new BusinessRuleException("Lote não encontrado.", "BALANCE_LOT_NOT_FOUND");
    
    var response = await _orderService.CreateAsync(request, userId, request.ServiceBalanceLotId);
    return CreatedAtAction(nameof(GetById), new { id = response.Id }, response);
}
catch (BusinessRuleException)
{
    // Deixa middleware global tratar e retornar 422
    throw;
}
catch (Exception ex)
{
    // Erros inesperados retornam 400
    return BadRequest(new { message = ex.Message });
}
```

## 🎯 Impacto e Resultado

* **Semântica Correta**: Erros de regra de negócio retornam HTTP 422 (Unprocessable Entity), separando claramente de erros de validação de modelo (400).
* **UX Educada**: Clientes veem contador regressivo, recebem confirmação antes de cancelar, e entendem exatamente por que uma ação falhou.
* **Consistência**: Mesma experiência de cancelamento em `/orders` e `/orders/{id}`.
* **Configuração Dinâmica**: Admins podem alterar janela de cancelamento sem deploy, e frontend reflete mudança imediatamente.
* **Feedback Visual**: Toasts informativos para todos os cenários (sucesso, prazo expirado, já cancelado, erro genérico).
* **Debug Facilitado**: Logs console ajudam a diagnosticar problemas de estrutura de erro.

---

**Nota do Desenvolvedor:** 
A implementação de uma UX de cancelamento robusta exigiu coordenação entre 5 camadas: domínio (exceções), API (middleware), service (regras), frontend (componente), e sincronização (configurações). O uso de `BusinessRuleException` com `ErrorCode` permitiu tratamento programático preciso no frontend, enquanto o modal de confirmação com timer tornou a experiência transparente para o usuário. A decisão de centralizar tratamento de exceções no middleware global (ao invés de tratar em cada controller) garantiu consistência em toda API e simplificou controllers. O debug via `console.log` foi intencionalmente adicionado para facilitar diagnóstico em produção e deve ser removido após validação.
