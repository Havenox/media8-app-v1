using System.Security.Claims;
using Media8.Application.DTOs.Profiles;
using Media8.Application.Interfaces;
using Media8.Domain.Common;
using Media8.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Media8.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/v1/[controller]")]
public class BrandingProfilesController : ControllerBase
{
    private readonly IBrandingProfileService _profileService;

    public BrandingProfilesController(IBrandingProfileService profileService)
    {
        _profileService = profileService;
    }

    /// <summary>
    /// Lista todos os perfis de branding do usuário logado
    /// </summary>
    /// <param name="onlyActive">Se true (padrão), retorna apenas perfis ativos. Se false, retorna todos (incluindo arquivados).</param>
    [HttpGet]
    [ProducesResponseType(typeof(List<BrandingProfileResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<List<BrandingProfileResponse>>> GetByUser([FromQuery] bool onlyActive = true)
    {
        var userId = GetUserIdFromClaims();
        var profiles = await _profileService.GetByUserIdAsync(userId, onlyActive);
        var response = profiles.Select(p => new BrandingProfileResponse
        {
            Id = p.Id,
            UserId = p.UserId,
            Name = p.Name,
            SocialHandles = p.SocialHandles,
            BrandColors = p.BrandColors,
            BrandFonts = p.BrandFonts,
            TargetAudience = p.TargetAudience,
            BrandAssetsUrl = p.BrandAssetsUrl,
            IsActive = p.IsActive,
            CreatedAt = p.CreatedAt,
            UpdatedAt = p.UpdatedAt
        }).ToList();

        return Ok(response);
    }

    /// <summary>
    /// Busca um perfil de branding específico por ID
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(BrandingProfileResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<BrandingProfileResponse>> GetById(Guid id)
    {
        var userId = GetUserIdFromClaims();
        var profile = await _profileService.GetByIdAsync(id);

        if (profile == null)
        {
            return NotFound();
        }

        // Validação de propriedade: o perfil deve pertencer ao usuário logado
        if (profile.UserId != userId)
        {
            return Forbid();
        }

        return Ok(new BrandingProfileResponse
        {
            Id = profile.Id,
            UserId = profile.UserId,
            Name = profile.Name,
            SocialHandles = profile.SocialHandles,
            BrandColors = profile.BrandColors,
            BrandFonts = profile.BrandFonts,
            TargetAudience = profile.TargetAudience,
            BrandAssetsUrl = profile.BrandAssetsUrl,
            CreatedAt = profile.CreatedAt,
            UpdatedAt = profile.UpdatedAt
        });
    }

    /// <summary>
    /// Cria um novo perfil de branding
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(BrandingProfileResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(object), StatusCodes.Status422UnprocessableEntity)]
    public async Task<ActionResult<BrandingProfileResponse>> Create([FromBody] CreateBrandingProfileRequest request)
    {
        var userId = GetUserIdFromClaims();

        try
        {
            var profile = await _profileService.CreateAsync(userId, request);
            return CreatedAtAction(nameof(GetById), new { id = profile.Id }, new BrandingProfileResponse
            {
                Id = profile.Id,
                UserId = profile.UserId,
                Name = profile.Name,
                SocialHandles = profile.SocialHandles,
                BrandColors = profile.BrandColors,
                BrandFonts = profile.BrandFonts,
                TargetAudience = profile.TargetAudience,
                BrandAssetsUrl = profile.BrandAssetsUrl,
                IsActive = profile.IsActive,
                CreatedAt = profile.CreatedAt,
                UpdatedAt = profile.UpdatedAt
            });
        }
        catch (BusinessRuleException ex)
        {
            return UnprocessableEntity(new { message = ex.Message, errorCode = ex.ErrorCode });
        }
    }

    /// <summary>
    /// Atualiza um perfil de branding existente
    /// </summary>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(BrandingProfileResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<BrandingProfileResponse>> Update(Guid id, [FromBody] UpdateBrandingProfileRequest request)
    {
        var userId = GetUserIdFromClaims();
        var profile = await _profileService.GetByIdAsync(id);

        if (profile == null)
        {
            return NotFound();
        }

        if (profile.UserId != userId)
        {
            return Forbid();
        }

        try
        {
            var updatedProfile = await _profileService.UpdateAsync(id, request);
            return Ok(new BrandingProfileResponse
            {
                Id = updatedProfile.Id,
                UserId = updatedProfile.UserId,
                Name = updatedProfile.Name,
                SocialHandles = updatedProfile.SocialHandles,
                BrandColors = updatedProfile.BrandColors,
                BrandFonts = updatedProfile.BrandFonts,
                TargetAudience = updatedProfile.TargetAudience,
                BrandAssetsUrl = updatedProfile.BrandAssetsUrl,
                IsActive = updatedProfile.IsActive,
                CreatedAt = updatedProfile.CreatedAt,
                UpdatedAt = updatedProfile.UpdatedAt
            });
        }
        catch (BusinessRuleException ex)
        {
            return UnprocessableEntity(new { message = ex.Message, errorCode = ex.ErrorCode });
        }
    }

    /// <summary>
    /// Arquiva um perfil de branding (soft delete)
    /// </summary>
    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Delete(Guid id)
    {
        var userId = GetUserIdFromClaims();
        var profile = await _profileService.GetByIdAsync(id);

        if (profile == null)
        {
            return NotFound();
        }

        if (profile.UserId != userId)
        {
            return Forbid();
        }

        await _profileService.ArchiveAsync(id);
        return NoContent();
    }

    /// <summary>
    /// Restaura um perfil de branding arquivado
    /// </summary>
    [HttpPost("{id}/restore")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Restore(Guid id)
    {
        var userId = GetUserIdFromClaims();
        var profile = await _profileService.GetByIdAsync(id);

        if (profile == null)
        {
            return NotFound();
        }

        if (profile.UserId != userId)
        {
            return Forbid();
        }

        await _profileService.RestoreAsync(id);
        return Ok();
    }

    /// <summary>
    /// Exclui permanentemente um perfil de branding (hard delete)
    /// </summary>
    [HttpDelete("{id}/hard-delete")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(object), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> HardDelete(Guid id)
    {
        var userId = GetUserIdFromClaims();
        var profile = await _profileService.GetByIdAsync(id);

        if (profile == null)
        {
            return NotFound();
        }

        if (profile.UserId != userId)
        {
            return Forbid();
        }

        try
        {
            await _profileService.HardDeleteAsync(id);
            return NoContent();
        }
        catch (BusinessRuleException ex)
        {
            return UnprocessableEntity(new { message = ex.Message, errorCode = ex.ErrorCode });
        }
    }

    private Guid GetUserIdFromClaims()
    {
        var claimValue = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (claimValue == null || !Guid.TryParse(claimValue, out var userId))
        {
            throw new UnauthorizedAccessException("User ID claim not found or invalid.");
        }
        return userId;
    }
}
