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
public class EditingProfilesController : ControllerBase
{
    private readonly IEditingProfileService _profileService;

    public EditingProfilesController(IEditingProfileService profileService)
    {
        _profileService = profileService;
    }

    /// <summary>
    /// Lista todos os perfis de edição do usuário logado
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(List<EditingProfileResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<List<EditingProfileResponse>>> GetByUser()
    {
        var userId = GetUserIdFromClaims();
        var profiles = await _profileService.GetByUserIdAsync(userId);
        var response = profiles.Select(p => new EditingProfileResponse
        {
            Id = p.Id,
            UserId = p.UserId,
            Name = p.Name,
            ReferenceUrl = p.ReferenceUrl,
            CutGuidelines = p.CutGuidelines,
            ThumbnailPreference = p.ThumbnailPreference,
            MusicStyle = p.MusicStyle,
            UseVideoHook = p.UseVideoHook,
            TextHighlightStyle = p.TextHighlightStyle,
            GeneralNotes = p.GeneralNotes,
            CreatedAt = p.CreatedAt,
            UpdatedAt = p.UpdatedAt
        }).ToList();

        return Ok(response);
    }

    /// <summary>
    /// Busca um perfil de edição específico por ID
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(EditingProfileResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<EditingProfileResponse>> GetById(Guid id)
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

        return Ok(new EditingProfileResponse
        {
            Id = profile.Id,
            UserId = profile.UserId,
            Name = profile.Name,
            ReferenceUrl = profile.ReferenceUrl,
            CutGuidelines = profile.CutGuidelines,
            ThumbnailPreference = profile.ThumbnailPreference,
            MusicStyle = profile.MusicStyle,
            UseVideoHook = profile.UseVideoHook,
            TextHighlightStyle = profile.TextHighlightStyle,
            GeneralNotes = profile.GeneralNotes,
            CreatedAt = profile.CreatedAt,
            UpdatedAt = profile.UpdatedAt
        });
    }

    /// <summary>
    /// Cria um novo perfil de edição
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(EditingProfileResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(object), StatusCodes.Status422UnprocessableEntity)]
    public async Task<ActionResult<EditingProfileResponse>> Create([FromBody] CreateEditingProfileRequest request)
    {
        var userId = GetUserIdFromClaims();

        try
        {
            var profile = await _profileService.CreateAsync(userId, request);

            var response = new EditingProfileResponse
            {
                Id = profile.Id,
                UserId = profile.UserId,
                Name = profile.Name,
                ReferenceUrl = profile.ReferenceUrl,
                CutGuidelines = profile.CutGuidelines,
                ThumbnailPreference = profile.ThumbnailPreference,
                MusicStyle = profile.MusicStyle,
                UseVideoHook = profile.UseVideoHook,
                TextHighlightStyle = profile.TextHighlightStyle,
                GeneralNotes = profile.GeneralNotes,
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
    /// Atualiza um perfil de edição existente
    /// </summary>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(EditingProfileResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<EditingProfileResponse>> Update(Guid id, [FromBody] UpdateEditingProfileRequest request)
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

            var response = new EditingProfileResponse
            {
                Id = updatedProfile.Id,
                UserId = updatedProfile.UserId,
                Name = updatedProfile.Name,
                ReferenceUrl = updatedProfile.ReferenceUrl,
                CutGuidelines = updatedProfile.CutGuidelines,
                ThumbnailPreference = updatedProfile.ThumbnailPreference,
                MusicStyle = updatedProfile.MusicStyle,
                UseVideoHook = updatedProfile.UseVideoHook,
                TextHighlightStyle = updatedProfile.TextHighlightStyle,
                GeneralNotes = updatedProfile.GeneralNotes,
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
    /// Exclui um perfil de edição
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
