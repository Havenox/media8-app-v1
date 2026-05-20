using Media8.Application.DTOs.Services;
using Media8.Application.Interfaces;
using Media8.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Media8.Api.Controllers;

[ApiController]
[Route("api/v1/service-balances")]
[Authorize]
public class ServiceBalancesController : ControllerBase
{
    private readonly IServiceBalanceRepository _balanceRepository;

    public ServiceBalancesController(IServiceBalanceRepository balanceRepository)
    {
        _balanceRepository = balanceRepository;
    }

    [HttpGet("my-balances")]
    public async Task<ActionResult<IEnumerable<UnifiedServiceBalanceDto>>> GetMyBalances(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? status = "active")
    {
        var currentUserIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (currentUserIdString == null || !Guid.TryParse(currentUserIdString, out var currentUserId))
        {
            return Unauthorized();
        }

        var (balances, total) = await _balanceRepository.GetPagedByUserIdAsync(currentUserId, page, pageSize, status);

        var dtos = balances.Select(MapToUnifiedDto);

        Response.Headers.Append("X-Total-Count", total.ToString());
        return Ok(dtos);
    }
    
    // Admin Endpoint to see client balances
    [HttpGet("{clientId}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<IEnumerable<UnifiedServiceBalanceDto>>> GetClientBalances(
        Guid clientId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? status = "active")
    {
         var (balances, total) = await _balanceRepository.GetPagedByUserIdAsync(clientId, page, pageSize, status);

        var dtos = balances.Select(MapToUnifiedDto);

        Response.Headers.Append("X-Total-Count", total.ToString());
        return Ok(dtos);
    }

    private static UnifiedServiceBalanceDto MapToUnifiedDto(ServiceBalanceLot lot)
    {
        return new UnifiedServiceBalanceDto
        {
            Id = lot.Id,
            ServiceName = lot.VideoFormat?.Name ?? "Formato Desconhecido",
            // Use ClientContract Snapshot data
            PackageName = lot.Contract?.SnapshotOfferName ?? lot.Contract?.Offer?.Name ?? "Contrato Legado",
            RemainingQuantity = lot.RemainingQuantity,
            // Snapshot Quantity is stored in Contract
            TotalQuantity = lot.Contract?.SnapshotVideoQuantity ?? lot.Quantity,
            ExpiresAt = lot.ExpiresAt,
            PurchaseDate = lot.PurchasedAt,
            Status = lot.ExpiresAt.HasValue && lot.ExpiresAt.Value < DateTime.UtcNow ? "expired" : "active"
        };
    }
}
