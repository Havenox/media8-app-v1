using Media8.Application.DTOs.Orders;
using Media8.Application.Interfaces;
using Media8.Domain.Common;
using Media8.Domain.Entities;
using Media8.Domain.Enums;
using Microsoft.Extensions.Logging;

namespace Media8.Application.Services;

public class OrderService(
IRepository<Order> orderRepository,
IRepository<User> userRepository,
IRepository<ServiceBalanceLot> balanceRepository,
ISettingsService settingsService,
ILogger<OrderService> logger) : IOrderService
{
private readonly IRepository<Order> _orderRepository = orderRepository;
private readonly IRepository<User> _userRepository = userRepository;
private readonly IRepository<ServiceBalanceLot> _balanceRepository = balanceRepository;
private readonly ISettingsService _settingsService = settingsService;
private readonly ILogger<OrderService> _logger = logger;

public async Task<OrderResponse> CreateAsync(CreateOrderRequest request, Guid userId, Guid serviceBalanceLotId)
{
var balanceLot = await _balanceRepository.GetByIdAsync(serviceBalanceLotId)
?? throw new InvalidOperationException("Lote de saldo não encontrado.");

if (balanceLot.RemainingQuantity <= 0)
{
throw new InvalidOperationException("Saldo insuficiente.");
}

// 1. Decrementa o saldo
balanceLot.RemainingQuantity -= 1;
await _balanceRepository.UpdateAsync(balanceLot);

_logger.LogInformation(
"💳 Pedido criado: 1 crédito debitado do lote {BalanceLotId}. Saldo restante: {Remaining}",
serviceBalanceLotId,
balanceLot.RemainingQuantity);

// 2. Cria o pedido herdando VideoFormatId do lote de saldo (não do request)
var order = new Order
{
ClientId = userId,
Title = request.Title,
Briefing = request.Briefing,
SourceFilesUrl = request.SourceFilesUrl,
VideoFormatId = balanceLot.VideoFormatId, // Herda do lote, não do request
Deadline = request.Deadline,
ServiceBalanceLotId = serviceBalanceLotId,
AssignmentId = balanceLot.AssignmentId,
BrandingProfileId = request.BrandingProfileId,
EditingProfileId = request.EditingProfileId,
Status = OrderStatus.Draft
};

await _orderRepository.AddAsync(order);

_logger.LogInformation("✅ Pedido {OrderId} criado com sucesso.", order.Id);

return MapToResponse(order);
}

public async Task<OrderResponse> CancelOrderAsync(Guid orderId)
{
var order = await _orderRepository.GetByIdAsync(orderId)
?? throw new InvalidOperationException($"Pedido {orderId} não encontrado.");

if (order.Status == OrderStatus.Cancelled)
{
throw new BusinessRuleException($"Pedido {orderId} já está cancelado.", "ORDER_ALREADY_CANCELLED");
}

if (order.Status != OrderStatus.Draft && order.Status != OrderStatus.Pending)
{
throw new BusinessRuleException(
$"Pedido {orderId} não pode ser cancelado no status {order.Status}.", "ORDER_INVALID_STATUS");
}

// Valida janela de tempo dinâmica via SettingsService
var cancellationWindowHours = await _settingsService.GetSettingAsync<int>("CancellationWindowHours", 24);
var timeSinceCreation = DateTime.UtcNow - order.CreatedAt;

if (timeSinceCreation.TotalHours > cancellationWindowHours)
{
throw new BusinessRuleException(
$"Tempo limite excedido. Pedido criado há {timeSinceCreation.TotalHours:F1}h, limite é {cancellationWindowHours}h.",
"CANCELLATION_WINDOW_EXPIRED");
}

if (order.ServiceBalanceLotId.HasValue)
{
var balanceLot = await _balanceRepository.GetByIdAsync(order.ServiceBalanceLotId.Value);

if (balanceLot != null)
{
if (balanceLot.ExpiresAt.HasValue && balanceLot.ExpiresAt < DateTime.UtcNow)
{
balanceLot.ExpiresAt = DateTime.UtcNow.AddDays(30);
_logger.LogInformation(
"⏳ Lote {BalanceLotId} expirado, validade estendida para {NewExpiresAt}",
order.ServiceBalanceLotId,
balanceLot.ExpiresAt);
}

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

public async Task<List<OrderResponse>> GetAllAsync()
{
var orders = await _orderRepository.GetAllAsync();
return orders.Select(MapToResponse).ToList();
}

public async Task<List<OrderResponse>> GetByClientAsync(Guid clientId)
{
var orders = await _orderRepository.FindAsync(o => o.ClientId == clientId);
return orders.Select(MapToResponse).ToList();
}

public async Task<List<OrderResponse>> GetByEditorAsync(Guid editorId)
{
var orders = await _orderRepository.FindAsync(o => o.EditorId == editorId);
return orders.Select(MapToResponse).ToList();
}

public async Task<OrderResponse?> GetByIdAsync(Guid id)
{
var order = await _orderRepository.GetByIdAsync(id);
return order == null ? null : MapToResponse(order);
}

private static OrderResponse MapToResponse(Order order)
{
return new OrderResponse
{
Id = order.Id,
ClientId = order.ClientId,
EditorId = order.EditorId,
Title = order.Title,
Briefing = order.Briefing,
SourceFilesUrl = order.SourceFilesUrl,
FinalVideoUrl = order.FinalVideoUrl,
Status = order.Status,
VideoFormatId = order.VideoFormatId,
Deadline = order.Deadline,
CreatedAt = order.CreatedAt,
UpdatedAt = order.UpdatedAt
};
}
}
