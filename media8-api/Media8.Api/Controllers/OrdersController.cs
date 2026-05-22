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

[HttpGet("available-balances")]
public async Task<ActionResult<List<ServiceBalanceLot>>> GetAvailableBalances()
{
var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out var userId))
{
return Unauthorized();
}

try
{
var now = DateTime.UtcNow;
var allLots = await _balanceRepository.FindAsync(l => l.UserId == userId);
    
var availableLots = allLots
  .Where(l => l.RemainingQuantity > 0 
              && (!l.ExpiresAt.HasValue || l.ExpiresAt.Value > now))
  .ToList();

return Ok(availableLots);
}
catch (Exception ex)
{
return BadRequest(new { message = ex.Message });
}
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
    public async Task<ActionResult<List<OrderResponse>>> GetAll()
    {
        // TODO: Filter based on role (Admin sees all, Client sees own via service logic)
        // For now returning all for simplicity or implementation specific logic needs to be added to service
        // Ideally service should have GetAllForUser(userId, role)
        
        var orders = await _orderService.GetAllAsync();
        return Ok(orders);
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
