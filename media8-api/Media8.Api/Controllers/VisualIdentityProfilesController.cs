using System.Security.Claims;
using Media8.Application.DTOs.Profiles;
using Media8.Application.Interfaces;
using Media8.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Media8.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/v1/[controller]")]
public class VisualIdentityProfilesController : ControllerBase
{
    private readonly IVisualIdentityProfileService _profileService;

    public VisualIdentityProfilesController(IVisualIdentityProfileService profileService)
    {
        _profileService = profileService;
    }

    /// <summary>
    /// Lista todos os perfis de identidade visual do usuário logado
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(List<VisualIdentityProfileResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<List<VisualIdentityProfileResponse>>> GetByUser()
    {
        var userId = GetUserIdFromClaims();
        var profiles = await _profileService.GetByUserIdAsync(userId);
        var response = profiles.Select(p => new VisualIdentityProfileResponse
        {
            Id = p.Id,
            UserId = p.UserId,
            Name = p.Name,
            SocialHandles = p.SocialHandles,
            BrandColors = p.BrandColors,
            BrandFonts = p.BrandFonts,
            TargetAudience = p.TargetAudience,
            BrandAssetsUrl = p.BrandAssetsUrl,
            CreatedAt = p.CreatedAt,
            UpdatedAt = p.UpdatedAt
        }).ToList();

        return Ok(response);
    }

    /// <summary>
    /// Busca um perfil de identidade visual específico por ID
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(VisualIdentityProfileResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<VisualIdentityProfileResponse>> GetById(Guid id)
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

        return Ok(new VisualIdentityProfileResponse
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
    /// Cria um novo perfil de identidade visual
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(VisualIdentityProfileResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(object), StatusCodes.Status422UnprocessableEntity)]
    public async Task<ActionResult<VisualIdentityProfileResponse>> Create([FromBody] CreateVisualIdentityProfileRequest request)
    {
        var userId = GetUserIdFromClaims();

        try
        {
            var profile = await _profileService.CreateAsync(userId, request);

            var response = new VisualIdentityProfileResponse
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
            };

            return CreatedAtAction(nameof(GetById), new { id = profile.Id }, response);
        }
        catch (Exception ex)
        {
            return UnprocessableEntity(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Atualiza um perfil de identidade visual existente
    /// </summary>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(VisualIdentityProfileResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<VisualIdentityProfileResponse>> Update(Guid id, [FromBody] UpdateVisualIdentityProfileRequest request)
    {
        var userId = GetUserIdFromClaims();
        var profile = await _profileService.GetByIdAsync(id);

        if (profile == null)
        {
            return NotFound();
        }

        // Validação de propriedade
        if (profile.UserId != userId)
        {
            return Forbid();
        }

        try
        {
            var updatedProfile = await _profileService.UpdateAsync(id, request);

            var response = new VisualIdentityProfileResponse
            {
                Id = updatedProfile.Id,
                UserId = updatedProfile.UserId,
                Name = updatedProfile.Name,
                SocialHandles = updatedProfile.SocialHandles,
                BrandColors = updatedProfile.BrandColors,
                BrandFonts = updatedProfile.BrandFonts,
                TargetAudience = updatedProfile.TargetAudience,
                BrandAssetsUrl = updatedProfile.BrandAssetsUrl,
                CreatedAt = updatedProfile.CreatedAt,
                UpdatedAt = updatedProfile.UpdatedAt
            };

            return Ok(response);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
        catch (Exception ex)
        {
            return UnprocessableEntity(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Exclui um perfil de identidade visual
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

        // Validação de propriedade
        if (profile.UserId != userId)
        {
            return Forbid();
        }

        try
        {
            await _profileService.DeleteAsync(id);
            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    private Guid GetUserIdFromClaims()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
        {
            throw new UnauthorizedAccessException("Usuário não identificado.");
        }
        return userId;
    }
}
