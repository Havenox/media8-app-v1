using System.Security.Claims;
using Media8.Application.DTOs.Orders;
using Media8.Application.Interfaces;
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

public OrdersController(
IOrderService orderService,
IRepository<ServiceBalanceLot> balanceRepository)
{
_orderService = orderService;
_balanceRepository = balanceRepository;
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
return BadRequest(new { message = "Lote de saldo não encontrado." });
}

if (balanceLot.UserId != userId)
{
return Unauthorized(new { message = "Lote de saldo não pertence ao usuário." });
}

if (balanceLot.RemainingQuantity <= 0)
{
return BadRequest(new { message = "Saldo insuficiente." });
}

if (balanceLot.ExpiresAt.HasValue && balanceLot.ExpiresAt.Value < DateTime.UtcNow)
{
return BadRequest(new { message = "Lote de saldo expirado." });
}

var response = await _orderService.CreateAsync(request, userId, request.ServiceBalanceLotId);
return CreatedAtAction(nameof(GetById), new { id = response.Id }, response);
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

try
{
var response = await _orderService.CancelOrderAsync(id);
return Ok(response);
}
catch (InvalidOperationException ex)
{
return BadRequest(new { message = ex.Message });
}
catch (Exception ex)
{
return BadRequest(new { message = ex.Message });
}
}
}
