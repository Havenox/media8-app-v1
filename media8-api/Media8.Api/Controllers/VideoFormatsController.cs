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
  /// Lista todos os formatos de vídeo ativos disponíveis no sistema
  /// </summary>
  [HttpGet]
  [AllowAnonymous]
  public async Task<ActionResult<List<VideoFormatResponse>>> GetActiveFormats()
  {
    var formats = await _context.VideoFormats
      .Where(vf => vf.IsActive)
      .Select(vf => new VideoFormatResponse
      {
        Id = vf.Id,
        Name = vf.Name,
        Slug = vf.Slug,
        MaxDurationSeconds = vf.MaxDurationSeconds,
        EditingStyleId = vf.EditingStyleId
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
      .Where(vf => vf.Id == id && vf.IsActive)
      .Select(vf => new VideoFormatResponse
      {
        Id = vf.Id,
        Name = vf.Name,
        Slug = vf.Slug,
        MaxDurationSeconds = vf.MaxDurationSeconds,
        EditingStyleId = vf.EditingStyleId
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
      EditingStyleId = request.EditingStyleId,
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
      MaxDurationSeconds = format.MaxDurationSeconds,
      EditingStyleId = format.EditingStyleId
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

    if (request.EditingStyleId.HasValue)
      format.EditingStyleId = request.EditingStyleId.Value;

    if (request.IsActive.HasValue)
      format.IsActive = request.IsActive.Value;

    format.UpdatedAt = DateTime.UtcNow;

    await _context.SaveChangesAsync();

    var response = new VideoFormatResponse
    {
      Id = format.Id,
      Name = format.Name,
      Slug = format.Slug,
      MaxDurationSeconds = format.MaxDurationSeconds,
      EditingStyleId = format.EditingStyleId
    };

    return Ok(response);
  }

  /// <summary>
  /// Remove (soft delete) um formato de vídeo (Apenas Admin)
  /// </summary>
  [HttpDelete("{id:guid}")]
  [Authorize(Roles = "Admin")]
  public async Task<ActionResult> DeleteVideoFormat(Guid id)
  {
    var format = await _context.VideoFormats.FindAsync(id);
    if (format == null) return NotFound();

    // Soft delete: apenas desativa o formato
    format.IsActive = false;
    format.UpdatedAt = DateTime.UtcNow;

    await _context.SaveChangesAsync();

    return NoContent();
  }
}

public class VideoFormatResponse
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public int MaxDurationSeconds { get; set; }
    public Guid? EditingStyleId { get; set; }
}
