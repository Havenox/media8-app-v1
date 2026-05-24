using Media8.Application.DTOs.Offers;
using Media8.Application.Interfaces;
using Media8.Domain.Entities;
using Media8.Domain.Enums;
using Media8.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Media8.Api.Controllers;

/// <summary>
/// Controller para gerenciamento de Contratos de Clientes
/// Responsável pela atribuição de ofertas aos clientes com snapshot imutável
/// </summary>
[ApiController]
[Route("api/v1/client-contracts")]
[Authorize]
public class ClientContractsController : ControllerBase
{
private readonly ApplicationDbContext _context;
private readonly IServiceBalanceService _serviceBalanceService;

public ClientContractsController(ApplicationDbContext context, IServiceBalanceService serviceBalanceService)
{
_context = context;
_serviceBalanceService = serviceBalanceService;
}

    /// <summary>
    /// Lista todos os contratos de clientes (com filtros opcionais)
    /// </summary>
    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<List<ClientContractResponse>>> GetAllContracts(
        [FromQuery] Guid? clientId = null,
        [FromQuery] AssignmentStatus? status = null)
    {
        var query = _context.ClientContracts
            .Include(cc => cc.Offer)
            .Include(cc => cc.Client)
            .AsQueryable();

        if (clientId.HasValue)
            query = query.Where(cc => cc.ClientId == clientId.Value);

        if (status.HasValue)
            query = query.Where(cc => cc.Status == status.Value);

var contracts = await query
.OrderByDescending(cc => cc.AssignedAt)
.Select(cc => new ClientContractResponse
{
Id = cc.Id,
OfferId = cc.OfferId,
ClientId = cc.ClientId,
AssignedBy = cc.AssignedBy,

// Snapshot Comercial
SnapshotOfferName = cc.SnapshotOfferName,
SnapshotVideoQuantity = cc.SnapshotVideoQuantity,
SnapshotPrice = cc.SnapshotPrice,
SnapshotValidityDays = cc.SnapshotValidityDays,
SnapshotDeliveryDays = cc.SnapshotDeliveryDays,
SnapshotWarrantyDays = cc.SnapshotWarrantyDays,

// Snapshot Técnico
SnapshotVideoFormatName = cc.SnapshotVideoFormatName,
SnapshotEditingStyleName = cc.SnapshotEditingStyleName,
SnapshotMaxDurationSeconds = cc.SnapshotMaxDurationSeconds,

AssignedAt = cc.AssignedAt,
ActivatedAt = cc.ActivatedAt,
ExpiresAt = cc.ExpiresAt,
Status = cc.Status,
CreatedAt = cc.CreatedAt,
UpdatedAt = cc.UpdatedAt,
Offer = new OfferResponse
{
Id = cc.Offer.Id,
Name = cc.Offer.Name,
Slug = cc.Offer.Slug,
ContractType = cc.Offer.ContractType,
Price = cc.Offer.Price,
VideoQuantity = cc.Offer.VideoQuantity,
MaxDurationSeconds = cc.Offer.MaxDurationSeconds
}
})
.ToListAsync();

        return Ok(contracts);
    }

    /// <summary>
    /// Busca um contrato específico por ID
    /// </summary>
    [HttpGet("{id:guid}")]
    [Authorize]
    public async Task<ActionResult<ClientContractResponse>> GetContractById(Guid id)
    {
        // Usuários normais só podem ver seus próprios contratos
        var userIdClaim = User.FindFirst("sub")?.Value;
        var isClient = User.IsInRole("Client");

var contract = await _context.ClientContracts
.Include(cc => cc.Offer)
.Include(cc => cc.Client)
.Where(cc => cc.Id == id)
.Select(cc => new ClientContractResponse
{
Id = cc.Id,
OfferId = cc.OfferId,
ClientId = cc.ClientId,
AssignedBy = cc.AssignedBy,

// Snapshot Comercial
SnapshotOfferName = cc.SnapshotOfferName,
SnapshotVideoQuantity = cc.SnapshotVideoQuantity,
SnapshotPrice = cc.SnapshotPrice,
SnapshotValidityDays = cc.SnapshotValidityDays,
SnapshotDeliveryDays = cc.SnapshotDeliveryDays,
SnapshotWarrantyDays = cc.SnapshotWarrantyDays,

// Snapshot Técnico
SnapshotVideoFormatName = cc.SnapshotVideoFormatName,
SnapshotEditingStyleName = cc.SnapshotEditingStyleName,
SnapshotMaxDurationSeconds = cc.SnapshotMaxDurationSeconds,

AssignedAt = cc.AssignedAt,
ActivatedAt = cc.ActivatedAt,
ExpiresAt = cc.ExpiresAt,
Status = cc.Status,
CreatedAt = cc.CreatedAt,
UpdatedAt = cc.UpdatedAt
})
.FirstOrDefaultAsync();

        if (contract == null) return NotFound();

        // Validação de acesso: cliente só vê o próprio contrato
        if (isClient)
        {
            if (!Guid.TryParse(userIdClaim, out var userId) || contract.ClientId != userId)
                return Forbid();
        }

        return Ok(contract);
    }

/// <summary>
/// Cria um novo contrato (atribuição de oferta a um cliente)
/// Regra de Negócio: Gera snapshot imutável dos dados da oferta e provisiona saldos
/// </summary>
[HttpPost]
[Authorize(Roles = "Admin")]
public async Task<ActionResult<ClientContractResponse>> CreateContract([FromBody] CreateClientContractRequest request)
{
// Buscar oferta COM relacionamentos para capturar snapshot completo
var offer = await _context.Offers
.Include(o => o.VideoFormat)
.Include(o => o.EditingStyle)
.FirstOrDefaultAsync(o => o.Id == request.OfferId);

if (offer == null)
return NotFound(new { message = $"Oferta com ID {request.OfferId} não encontrada." });

// Validar se a oferta possui formato de vídeo e estilo de edição
if (offer.VideoFormat == null)
return BadRequest(new { message = "Oferta não possui formato de vídeo associado." });

if (offer.EditingStyle == null)
return BadRequest(new { message = "Oferta não possui estilo de edição associado." });

// Calcular data de expiração baseada no ValidityDays da oferta
DateTime? expiresAt = null;
if (offer.ValidityDays.HasValue && offer.ValidityDays > 0)
{
expiresAt = DateTime.UtcNow.AddDays(offer.ValidityDays.Value);
}

var contract = new ClientContract
{
OfferId = request.OfferId,
ClientId = request.ClientId,
AssignedBy = request.AssignedByUserId,
AssignedAt = DateTime.UtcNow,
ActivatedAt = DateTime.UtcNow,
ExpiresAt = expiresAt,
Status = AssignmentStatus.Active,

// ==========================================
// SNAPSHOT COMERCIAL (Imutável)
// ==========================================
SnapshotOfferName = offer.Name,
SnapshotVideoQuantity = offer.VideoQuantity,
SnapshotPrice = offer.Price,
SnapshotValidityDays = offer.ValidityDays,
SnapshotDeliveryDays = offer.DeliveryDays,
SnapshotWarrantyDays = offer.LoyaltyMonths * 30, // Converte meses para dias

// ==========================================
// SNAPSHOT TÉCNICO (Imutável - Sem FKs)
// ==========================================
// Copia o NOME (string), não o ID. Se o formato/estilo mudar, o contrato permanece intacto.
SnapshotVideoFormatName = offer.VideoFormat.Name,
SnapshotEditingStyleName = offer.EditingStyle.Name,
SnapshotMaxDurationSeconds = offer.MaxDurationSeconds,

CreatedAt = DateTime.UtcNow,
UpdatedAt = DateTime.UtcNow
};

_context.ClientContracts.Add(contract);
await _context.SaveChangesAsync();

// Provisionar saldos de serviço com base no contrato
try
{
await _serviceBalanceService.ProvisionContractBalanceAsync(contract, offer);
}
catch (Exception ex)
{
// Se falhar ao provisionar, remove o contrato e retorna erro
_context.ClientContracts.Remove(contract);
await _context.SaveChangesAsync();
return StatusCode(500, new { message = $"Erro ao provisionar saldos: {ex.Message}" });
}

var response = new ClientContractResponse
{
Id = contract.Id,
OfferId = contract.OfferId,
ClientId = contract.ClientId,
AssignedBy = contract.AssignedBy,

// Snapshot Comercial
SnapshotOfferName = contract.SnapshotOfferName,
SnapshotVideoQuantity = contract.SnapshotVideoQuantity,
SnapshotPrice = contract.SnapshotPrice,
SnapshotValidityDays = contract.SnapshotValidityDays,
SnapshotDeliveryDays = contract.SnapshotDeliveryDays,
SnapshotWarrantyDays = contract.SnapshotWarrantyDays,

// Snapshot Técnico
SnapshotVideoFormatName = contract.SnapshotVideoFormatName,
SnapshotEditingStyleName = contract.SnapshotEditingStyleName,
SnapshotMaxDurationSeconds = contract.SnapshotMaxDurationSeconds,

AssignedAt = contract.AssignedAt,
ActivatedAt = contract.ActivatedAt,
ExpiresAt = contract.ExpiresAt,
Status = contract.Status,
CreatedAt = contract.CreatedAt,
UpdatedAt = contract.UpdatedAt
};

return CreatedAtAction(nameof(GetContractById), new { id = contract.Id }, response);
}

    /// <summary>
    /// Atualiza um contrato existente (ex: alteração de status)
    /// </summary>
    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ClientContractResponse>> UpdateContract(Guid id, [FromBody] UpdateClientContractRequest request)
    {
        var contract = await _context.ClientContracts.FindAsync(id);
        if (contract == null) return NotFound();

        if (request.Status.HasValue)
            contract.Status = request.Status.Value;

        if (request.ExpiresAt.HasValue)
            contract.ExpiresAt = request.ExpiresAt.Value;

        contract.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        var response = new ClientContractResponse
        {
            Id = contract.Id,
            OfferId = contract.OfferId,
            ClientId = contract.ClientId,
            AssignedBy = contract.AssignedBy,
            SnapshotOfferName = contract.SnapshotOfferName,
            SnapshotVideoQuantity = contract.SnapshotVideoQuantity,
            SnapshotPrice = contract.SnapshotPrice,
            SnapshotValidityDays = contract.SnapshotValidityDays,
            AssignedAt = contract.AssignedAt,
            ActivatedAt = contract.ActivatedAt,
            ExpiresAt = contract.ExpiresAt,
            Status = contract.Status,
            CreatedAt = contract.CreatedAt,
            UpdatedAt = contract.UpdatedAt
        };

        return Ok(response);
    }

    /// <summary>
    /// Cancela um contrato (soft delete via status)
    /// </summary>
    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> DeleteContract(Guid id)
    {
        var contract = await _context.ClientContracts.FindAsync(id);
        if (contract == null) return NotFound();

        contract.Status = AssignmentStatus.Cancelled;
        contract.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return NoContent();
    }
}
