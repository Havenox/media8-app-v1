using Media8.Application.DTOs.Auth;
using Media8.Application.DTOs.Orders;
using Media8.Domain.Entities;

namespace Media8.Application.Interfaces;

public interface IAuthService
{
    Task<AuthResponse> LoginAsync(LoginRequest request);
    Task<AuthResponse> RegisterAsync(RegisterRequest request);
    Task ChangePasswordAsync(Guid userId, ChangePasswordRequest request);
}

public interface IOrderService
{
    Task<OrderResponse> CreateAsync(CreateOrderRequest request, Guid userId, Guid serviceBalanceLotId);
    Task<OrderResponse> CancelOrderAsync(Guid orderId);
    Task<OrderResponse?> GetByIdAsync(Guid id);
    Task<List<OrderResponse>> GetAllAsync();
    Task<List<OrderResponse>> GetByClientAsync(Guid clientId);
    Task<List<OrderResponse>> GetByEditorAsync(Guid editorId);
    Task<OrderResponse?> UpdateAsync(Guid id, UpdateOrderRequest request, Guid requestingUserId, bool isAdmin);
}

public interface IPasswordHasher
{
    string Hash(string password);
    bool Verify(string password, string hash);
}

public interface IJwtProvider
{
    string Generate(User user);
}
