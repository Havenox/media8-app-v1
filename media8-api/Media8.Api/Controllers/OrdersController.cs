using System.Security.Claims;
using Media8.Application.DTOs.Orders;
using Media8.Application.Interfaces;
using Media8.Domain.Common;
using Media8.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Media8.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/v1/[controller]")]
public class OrdersController : ControllerBase
{
    private readonly IOrderService _orderService;
    private readonly IRepository<ServiceBalanceLot> _balanceRepository;
    private readonly ISettingsService _settingsService;

    public OrdersController(
        IOrderService orderService,
        IRepository<ServiceBalanceLot> balanceRepository,
        ISettingsService settingsService)
    {
        _orderService = orderService;
        _balanceRepository = balanceRepository;
        _settingsService = settingsService;
    }

    [HttpPost]
    public async Task<ActionResult<OrderResponse>> Create(CreateOrderRequest request)
    {
        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out var userId))
        {
            return Unauthorized();
        }

        try
        {
            var balanceLot = await _balanceRepository.GetByIdAsync(request.ServiceBalanceLotId);

            if (balanceLot == null)
            {
                throw new BusinessRuleException("Lote de saldo não encontrado.", "BALANCE_LOT_NOT_FOUND");
            }

            if (balanceLot.UserId != userId)
            {
                throw new BusinessRuleException("Lote de saldo não pertence ao usuário.", "BALANCE_LOT_NOT_USER");
            }

            if (balanceLot.RemainingQuantity <= 0)
            {
                throw new BusinessRuleException("Saldo insuficiente.", "INSUFFICIENT_BALANCE");
            }

            if (balanceLot.ExpiresAt.HasValue && balanceLot.ExpiresAt.Value < DateTime.UtcNow)
            {
                throw new BusinessRuleException("Lote de saldo expirado.", "BALANCE_LOT_EXPIRED");
            }

            var response = await _orderService.CreateAsync(request, userId, request.ServiceBalanceLotId);
            return CreatedAtAction(nameof(GetById), new { id = response.Id }, response);
        }
        catch (BusinessRuleException)
        {
            // Deixa o middleware global tratar e retornar 422
            throw;
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet]
    public async Task<ActionResult<List<OrderResponse>>> GetAll(
        [FromQuery] Guid? ClientId = null,
        [FromQuery] Guid? EditorId = null,
        [FromQuery] string? Status = null)
    {
        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out var currentUserId))
            return Unauthorized();

        var isAdmin = User.IsInRole("Admin");
        var orders = await _orderService.GetAllAsync();

        // RBAC: Non-admin users can only see their own orders
        if (!isAdmin)
        {
            orders = orders.Where(o => o.ClientId == currentUserId || o.EditorId == currentUserId).ToList();
        }

        // Apply optional filters
        if (ClientId.HasValue)
            orders = orders.Where(o => o.ClientId == ClientId.Value).ToList();
        if (EditorId.HasValue)
            orders = orders.Where(o => o.EditorId == EditorId.Value).ToList();
        if (!string.IsNullOrEmpty(Status) && Enum.TryParse<Domain.Enums.OrderStatus>(Status, true, out var statusEnum))
            orders = orders.Where(o => o.Status == statusEnum).ToList();

        return Ok(orders);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<OrderResponse>> Update(Guid id, [FromBody] UpdateOrderRequest request)
    {
        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out var currentUserId))
            return Unauthorized();

        try
        {
            var response = await _orderService.UpdateAsync(id, request, currentUserId, User.IsInRole("Admin"));
            if (response == null) return NotFound();
            return Ok(response);
        }
        catch (BusinessRuleException) { throw; }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<OrderResponse>> GetById(Guid id)
    {
        var order = await _orderService.GetByIdAsync(id);
        if (order == null)
        {
            return NotFound();
        }
        return Ok(order);
    }

    [HttpPost("{id}/cancel")]
    public async Task<ActionResult<OrderResponse>> Cancel(Guid id)
    {
        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out var userId))
        {
            return Unauthorized();
        }

        var response = await _orderService.CancelOrderAsync(id);
        return Ok(response);
    }

    /// <summary>
    /// Gets the cancellation window in hours for orders.
    /// This endpoint requires authentication but is accessible by all roles (Admin, Editor, Client).
    /// </summary>
    /// <returns>The number of hours allowed for order cancellation.</returns>
    [HttpGet("cancellation-window")]
    public async Task<ActionResult<int>> GetCancellationWindow()
    {
        try
        {
            var hours = await _settingsService.GetSettingAsync("CancellationWindowHours", 24);
            return Ok(hours);
        }
        catch
        {
            return Ok(24);
        }
    }
}
