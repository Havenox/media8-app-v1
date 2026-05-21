using Media8.Application.DTOs.Offers;
using Media8.Domain.Entities;
using Media8.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Media8.Api.Controllers;

/// <summary>
/// Controller para gerenciamento de Ofertas Comerciais
/// Fornece endpoints CRUD para administração de produtos vendáveis
/// </summary>
[ApiController]
[Route("api/v1/offers")]
[Authorize]
public class OffersController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public OffersController(ApplicationDbContext context)
    {
        _context = context;
    }

/// <summary>
/// Lista todas as ofertas disponíveis (ativas e inativas)
/// </summary>
[HttpGet]
[AllowAnonymous]
public async Task<ActionResult<List<OfferResponse>>> GetAllOffers()
{
var offers = await _context.Offers
.OrderBy(o => o.Name)
.Select(o => new OfferResponse
{
Id = o.Id,
Name = o.Name,
Slug = o.Slug,
ContractType = o.ContractType,
Price = o.Price,
VideoQuantity = o.VideoQuantity,
MaxDurationSeconds = o.MaxDurationSeconds,
ValidityDays = o.ValidityDays,
LoyaltyMonths = o.LoyaltyMonths,
DeliveryDays = o.DeliveryDays,
VideoFormatId = o.VideoFormatId,
EditingStyleId = o.EditingStyleId,
Description = o.Description,
Features = o.Features,
Disclaimer = o.Disclaimer,
Badge = o.Badge,
IsPublic = o.IsPublic,
CreatedAt = o.CreatedAt,
UpdatedAt = o.UpdatedAt,
CanDeletePermanently = !_context.ClientContracts.Any(c => c.OfferId == o.Id)
})
.ToListAsync();

return Ok(offers);
}

/// <summary>
/// Busca uma oferta específica por ID
/// </summary>
[HttpGet("{id:guid}")]
[AllowAnonymous]
public async Task<ActionResult<OfferResponse>> GetOfferById(Guid id)
{
var offer = await _context.Offers
.Where(o => o.Id == id)
.Select(o => new OfferResponse
{
Id = o.Id,
Name = o.Name,
Slug = o.Slug,
ContractType = o.ContractType,
Price = o.Price,
VideoQuantity = o.VideoQuantity,
MaxDurationSeconds = o.MaxDurationSeconds,
ValidityDays = o.ValidityDays,
LoyaltyMonths = o.LoyaltyMonths,
DeliveryDays = o.DeliveryDays,
VideoFormatId = o.VideoFormatId,
EditingStyleId = o.EditingStyleId,
Description = o.Description,
Features = o.Features,
Disclaimer = o.Disclaimer,
Badge = o.Badge,
IsPublic = o.IsPublic,
CreatedAt = o.CreatedAt,
UpdatedAt = o.UpdatedAt,
CanDeletePermanently = !_context.ClientContracts.Any(c => c.OfferId == o.Id)
})
.FirstOrDefaultAsync();

if (offer == null) return NotFound();

return Ok(offer);
}

    /// <summary>
    /// Cria uma nova oferta comercial (Apenas Admin)
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<OfferResponse>> CreateOffer([FromBody] CreateOfferRequest request)
    {
        // Validação de nome único
        var nameExists = await _context.Offers.AnyAsync(o => o.Name == request.Name);
        if (nameExists)
            return Conflict(new { message = $"Já existe uma oferta com o nome '{request.Name}'." });

        // Validação de slug único
        var slugExists = await _context.Offers.AnyAsync(o => o.Slug == request.Slug);
        if (slugExists)
            return Conflict(new { message = $"Já existe uma oferta com o slug '{request.Slug}'." });

        var offer = new Offer
        {
            Name = request.Name,
            Slug = request.Slug,
            ContractType = request.ContractType,
            Price = request.Price,
            VideoQuantity = request.VideoQuantity,
            MaxDurationSeconds = request.MaxDurationSeconds,
            ValidityDays = request.ValidityDays,
            LoyaltyMonths = request.LoyaltyMonths,
            DeliveryDays = request.DeliveryDays,
            VideoFormatId = request.VideoFormatId,
            EditingStyleId = request.EditingStyleId,
            Description = request.Description,
            Features = request.Features,
            Disclaimer = request.Disclaimer,
            Badge = request.Badge,
            IsPublic = request.IsPublic,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Offers.Add(offer);
        await _context.SaveChangesAsync();

        var response = new OfferResponse
        {
            Id = offer.Id,
            Name = offer.Name,
            Slug = offer.Slug,
            ContractType = offer.ContractType,
            Price = offer.Price,
            VideoQuantity = offer.VideoQuantity,
            MaxDurationSeconds = offer.MaxDurationSeconds,
            ValidityDays = offer.ValidityDays,
            LoyaltyMonths = offer.LoyaltyMonths,
            DeliveryDays = offer.DeliveryDays,
            VideoFormatId = offer.VideoFormatId,
            EditingStyleId = offer.EditingStyleId,
            Description = offer.Description,
            Features = offer.Features,
            Disclaimer = offer.Disclaimer,
            Badge = offer.Badge,
            IsPublic = offer.IsPublic,
            CreatedAt = offer.CreatedAt,
            UpdatedAt = offer.UpdatedAt
        };

        return CreatedAtAction(nameof(GetOfferById), new { id = offer.Id }, response);
    }

    /// <summary>
    /// Atualiza uma oferta existente (Apenas Admin)
    /// </summary>
    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<OfferResponse>> UpdateOffer(Guid id, [FromBody] UpdateOfferRequest request)
    {
        var offer = await _context.Offers.FindAsync(id);
        if (offer == null) return NotFound();

        // Atualiza apenas os campos fornecidos
        if (!string.IsNullOrWhiteSpace(request.Name))
        {
            var nameExists = await _context.Offers.AnyAsync(o => o.Name == request.Name && o.Id != id);
            if (nameExists)
                return Conflict(new { message = $"Já existe uma oferta com o nome '{request.Name}'." });
            offer.Name = request.Name;
        }

        if (!string.IsNullOrWhiteSpace(request.Slug))
        {
            var slugExists = await _context.Offers.AnyAsync(o => o.Slug == request.Slug && o.Id != id);
            if (slugExists)
                return Conflict(new { message = $"Já existe uma oferta com o slug '{request.Slug}'." });
            offer.Slug = request.Slug;
        }

        if (request.ContractType.HasValue)
            offer.ContractType = request.ContractType.Value;

        if (request.Price.HasValue)
            offer.Price = request.Price.Value;

        if (request.VideoQuantity.HasValue)
            offer.VideoQuantity = request.VideoQuantity.Value;

        if (request.MaxDurationSeconds.HasValue)
            offer.MaxDurationSeconds = request.MaxDurationSeconds.Value;

        if (request.ValidityDays.HasValue)
            offer.ValidityDays = request.ValidityDays.Value;

        if (request.LoyaltyMonths.HasValue)
            offer.LoyaltyMonths = request.LoyaltyMonths.Value;

        if (request.DeliveryDays.HasValue)
            offer.DeliveryDays = request.DeliveryDays.Value;

        if (request.VideoFormatId.HasValue)
            offer.VideoFormatId = request.VideoFormatId.Value;

        if (request.EditingStyleId.HasValue)
            offer.EditingStyleId = request.EditingStyleId.Value;

        if (request.Description != null)
            offer.Description = request.Description;

        if (request.Features != null)
            offer.Features = request.Features;

        if (request.Disclaimer != null)
            offer.Disclaimer = request.Disclaimer;

        if (request.Badge != null)
            offer.Badge = request.Badge;

        if (request.IsPublic.HasValue)
            offer.IsPublic = request.IsPublic.Value;

        offer.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        var response = new OfferResponse
        {
            Id = offer.Id,
            Name = offer.Name,
            Slug = offer.Slug,
            ContractType = offer.ContractType,
            Price = offer.Price,
            VideoQuantity = offer.VideoQuantity,
            MaxDurationSeconds = offer.MaxDurationSeconds,
            ValidityDays = offer.ValidityDays,
            LoyaltyMonths = offer.LoyaltyMonths,
            DeliveryDays = offer.DeliveryDays,
            VideoFormatId = offer.VideoFormatId,
            EditingStyleId = offer.EditingStyleId,
            Description = offer.Description,
            Features = offer.Features,
            Disclaimer = offer.Disclaimer,
            Badge = offer.Badge,
            IsPublic = offer.IsPublic,
            CreatedAt = offer.CreatedAt,
            UpdatedAt = offer.UpdatedAt
        };

        return Ok(response);
    }

/// <summary>
/// Remove uma oferta do catálogo comercial (Apenas Admin)
/// Realiza Hard Delete se não houver contratos vinculados, caso contrário faz Soft Delete (arquivamento)
/// </summary>
[HttpDelete("{id:guid}")]
[Authorize(Roles = "Admin")]
public async Task<ActionResult<DeleteOfferResponse>> DeleteOffer(Guid id)
{
var offer = await _context.Offers.FindAsync(id);
if (offer == null) return NotFound();

// Verifica se há contratos vinculados
var hasContracts = await _context.ClientContracts.AnyAsync(c => c.OfferId == id);

if (hasContracts)
{
// Soft Delete: arquiva a oferta (não pode deletar fisicamente)
offer.IsPublic = false;
offer.UpdatedAt = DateTime.UtcNow;
await _context.SaveChangesAsync();

return Ok(new DeleteOfferResponse 
{ 
Success = true, 
Message = "Oferta arquivada (possui contratos vinculados).", 
DeletedPhysically = false 
});
}
else
{
// Hard Delete: remove fisicamente do banco
_context.Offers.Remove(offer);
await _context.SaveChangesAsync();

return Ok(new DeleteOfferResponse 
{ 
Success = true, 
Message = "Oferta excluída permanentemente.", 
DeletedPhysically = true 
});
}
}

/// <summary>
/// Resposta de deleção de oferta
/// </summary>
public class DeleteOfferResponse
{
public bool Success { get; set; }
public string Message { get; set; } = string.Empty;
public bool DeletedPhysically { get; set; }
}
}
