using Media8.Domain.Entities;
using Media8.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Media8.Api.Controllers;

[ApiController]
[Route("api/v1/video-formats")]
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
                Tier = vf.Tier.ToString()
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
                Tier = vf.Tier.ToString()
            })
            .FirstOrDefaultAsync();

        if (format == null) return NotFound();

        return Ok(format);
    }
}

public class VideoFormatResponse
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public int MaxDurationSeconds { get; set; }
    public string Tier { get; set; } = string.Empty;
}
