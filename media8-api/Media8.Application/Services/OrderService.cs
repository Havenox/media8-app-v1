using Media8.Application.DTOs.Orders;
using Media8.Application.Interfaces;
using Media8.Domain.Entities;
using Media8.Domain.Enums;

namespace Media8.Application.Services;

public class OrderService : IOrderService
{
    private readonly IRepository<Order> _orderRepository;
    private readonly IRepository<User> _userRepository;

    public OrderService(IRepository<Order> orderRepository, IRepository<User> userRepository)
    {
        _orderRepository = orderRepository;
        _userRepository = userRepository;
    }

    public async Task<OrderResponse> CreateAsync(CreateOrderRequest request, Guid userId)
    {
        var order = new Order
        {
            ClientId = userId,
            Title = request.Title,
            Briefing = request.Briefing,
            SourceFilesUrl = request.SourceFilesUrl,
            ServiceType = request.ServiceType,
            Deadline = request.Deadline,
            Status = OrderStatus.Pending
        };

        await _orderRepository.AddAsync(order);

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
            ServiceType = order.ServiceType,
            Deadline = order.Deadline,
            CreatedAt = order.CreatedAt,
            UpdatedAt = order.UpdatedAt
        };
    }
}
