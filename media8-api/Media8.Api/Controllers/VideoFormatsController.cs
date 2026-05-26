using Media8.Application.DTOs.Services;
using Media8.Domain.Entities;
using Media8.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Media8.Api.Controllers;

[ApiController]
[Route("api/v1/video-formats")]
[Authorize]
public class VideoFormatsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public VideoFormatsController(ApplicationDbContext context)
    {
        _context = context;
    }

/// <summary>
/// Lista todos os formatos de vídeo (ativos e inativos)
/// </summary>
[HttpGet]
[AllowAnonymous]
public async Task<ActionResult<List<VideoFormatResponse>>> GetAllVideoFormats()
{
var formats = await _context.VideoFormats
.OrderBy(vf => vf.Name)
.Select(vf => new VideoFormatResponse
{
Id = vf.Id,
Name = vf.Name,
Slug = vf.Slug,
MaxDurationSeconds = vf.MaxDurationSeconds,
IsActive = vf.IsActive,
CanDeletePermanently = !_context.Offers.Any(o => o.VideoFormatId == vf.Id) &&
!_context.ClientContracts.Any(cc => cc.SnapshotVideoFormatName == vf.Name)
})
.ToListAsync();

return Ok(formats);
}

/// <summary>
/// Busca um formato de vídeo específico por ID
/// </summary>
[HttpGet("{id:guid}")]
[AllowAnonymous]
public async Task<ActionResult<VideoFormatResponse>> GetFormatById(Guid id)
{
var format = await _context.VideoFormats
.Where(vf => vf.Id == id)
.Select(vf => new VideoFormatResponse
{
Id = vf.Id,
Name = vf.Name,
Slug = vf.Slug,
MaxDurationSeconds = vf.MaxDurationSeconds,
IsActive = vf.IsActive,
CanDeletePermanently = !_context.Offers.Any(o => o.VideoFormatId == vf.Id) &&
!_context.ClientContracts.Any(cc => cc.SnapshotVideoFormatName == vf.Name)
})
.FirstOrDefaultAsync();

if (format == null) return NotFound();

return Ok(format);
}

  /// <summary>
  /// Cria um novo formato de vídeo (Apenas Admin)
  /// </summary>
  [HttpPost]
  [Authorize(Roles = "Admin")]
  public async Task<ActionResult<VideoFormatResponse>> CreateVideoFormat([FromBody] CreateVideoFormatRequest request)
  {
    // Validação de slug único
    var slugExists = await _context.VideoFormats
      .AnyAsync(vf => vf.Slug == request.Slug);

    if (slugExists)
      return Conflict(new { message = $"Já existe um formato de vídeo com o slug '{request.Slug}'." });

var format = new VideoFormat
{
Name = request.Name,
Slug = request.Slug,
MaxDurationSeconds = request.MaxDurationSeconds,
IsActive = true,
CreatedAt = DateTime.UtcNow,
UpdatedAt = DateTime.UtcNow
};

_context.VideoFormats.Add(format);
await _context.SaveChangesAsync();

var response = new VideoFormatResponse
{
Id = format.Id,
Name = format.Name,
Slug = format.Slug,
MaxDurationSeconds = format.MaxDurationSeconds
};

return CreatedAtAction(nameof(GetFormatById), new { id = format.Id }, response);
  }

  /// <summary>
  /// Atualiza um formato de vídeo existente (Apenas Admin)
  /// </summary>
  [HttpPut("{id:guid}")]
  [Authorize(Roles = "Admin")]
  public async Task<ActionResult<VideoFormatResponse>> UpdateVideoFormat(Guid id, [FromBody] UpdateVideoFormatRequest request)
  {
    var format = await _context.VideoFormats.FindAsync(id);
    if (format == null) return NotFound();

    // Atualiza apenas os campos fornecidos
    if (!string.IsNullOrWhiteSpace(request.Name))
      format.Name = request.Name;

    if (!string.IsNullOrWhiteSpace(request.Slug))
    {
      // Verifica se o novo slug já existe (e não é o próprio formato sendo editado)
      var slugExists = await _context.VideoFormats
        .AnyAsync(vf => vf.Slug == request.Slug && vf.Id != id);

      if (slugExists)
        return Conflict(new { message = $"Já existe um formato de vídeo com o slug '{request.Slug}'." });

      format.Slug = request.Slug;
    }

if (request.MaxDurationSeconds.HasValue)
format.MaxDurationSeconds = request.MaxDurationSeconds.Value;

if (request.IsActive.HasValue)
format.IsActive = request.IsActive.Value;

    format.UpdatedAt = DateTime.UtcNow;

    await _context.SaveChangesAsync();

var response = new VideoFormatResponse
{
Id = format.Id,
Name = format.Name,
Slug = format.Slug,
MaxDurationSeconds = format.MaxDurationSeconds
};

return Ok(response);
  }

/// <summary>
/// Remove um formato de vídeo (Apenas Admin)
/// Se permanent=false (padrão): apenas arquiva (Soft Delete)
/// Se permanent=true: tenta Hard Delete (se não houver ofertas ou saldos)
/// </summary>
[HttpDelete("{id:guid}")]
[Authorize(Roles = "Admin")]
public async Task<ActionResult<DeleteVideoFormatResponse>> DeleteVideoFormat(Guid id, [FromQuery] bool permanent = false)
{
  var format = await _context.VideoFormats.FindAsync(id);
  if (format == null) return NotFound();

  // Se permanent=false (padrão), apenas arquiva
  if (!permanent)
  {
    format.IsActive = false;
    format.UpdatedAt = DateTime.UtcNow;
    await _context.SaveChangesAsync();

    return Ok(new DeleteVideoFormatResponse
    {
      Success = true,
      Message = "Formato arquivado com sucesso.",
      DeletedPhysically = false
    });
  }

// Se permanent=true, verifica se pode deletar fisicamente
var hasOffers = await _context.Offers.AnyAsync(o => o.VideoFormatId == id);
var hasContracts = await _context.ClientContracts.AnyAsync(cc => cc.SnapshotVideoFormatName == format.Name);

if (hasOffers || hasContracts)
{
// Não pode deletar fisicamente
return BadRequest(new DeleteVideoFormatResponse
{
Success = false,
Message = "Não é possível excluir permanentemente: o formato possui ofertas ou contratos vinculados.",
DeletedPhysically = false
});
  }
  else
  {
    // Hard Delete: remove fisicamente
_context.VideoFormats.Remove(format);
await _context.SaveChangesAsync();

return Ok(new DeleteVideoFormatResponse
{
Success = true,
Message = "Formato excluído permanentemente.",
DeletedPhysically = true
});
}
}

public class DeleteVideoFormatResponse
{
public bool Success { get; set; }
public string Message { get; set; } = string.Empty;
public bool DeletedPhysically { get; set; }
}
}
