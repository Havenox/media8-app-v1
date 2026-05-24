using Media8.Application.DTOs.Services;
using Media8.Application.Interfaces;
using Media8.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Media8.Api.Controllers;

[ApiController]
[Route("api/v1/ServiceBalances")]
[Authorize]
public class ServiceBalancesController : ControllerBase
{
    private readonly IServiceBalanceRepository _balanceRepository;

    public ServiceBalancesController(IServiceBalanceRepository balanceRepository)
    {
        _balanceRepository = balanceRepository;
    }

    // User's own balances - PascalCase follows Media8 standard
    [HttpGet("MyBalances")]
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

    // Admin Endpoint - PascalCase follows Media8 standard
    [HttpGet("Client")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<IEnumerable<UnifiedServiceBalanceDto>>> GetClientBalances(
        [FromQuery] Guid clientId,
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

// Snapshot Comercial
SnapshotOfferName = lot.Contract?.SnapshotOfferName ?? "Contrato Sem Nome",
SnapshotVideoQuantity = lot.Contract?.SnapshotVideoQuantity ?? lot.Quantity,
ContractType = lot.Contract?.Offer?.ContractType.ToString() ?? "Desconhecido",

// Snapshot Técnico
SnapshotVideoFormatName = lot.Contract?.SnapshotVideoFormatName ?? "Formato Desconhecido",
SnapshotEditingStyleName = lot.Contract?.SnapshotEditingStyleName ?? "Estilo Desconhecido",
SnapshotMaxDurationSeconds = lot.Contract?.SnapshotMaxDurationSeconds ?? 0,

// Dados do Lote
RemainingQuantity = lot.RemainingQuantity,
TotalQuantity = lot.Contract?.SnapshotVideoQuantity ?? lot.Quantity,
ExpiresAt = lot.ExpiresAt,
PurchaseDate = lot.CreatedAt,
Status = lot.ExpiresAt.HasValue && lot.ExpiresAt.Value < DateTime.UtcNow ? "expired" : "active"
};
}
}
