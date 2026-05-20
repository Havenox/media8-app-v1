using Media8.Application.DTOs.Services;
using Media8.Domain.Entities;
using Media8.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Media8.Api.Controllers;

/// <summary>
/// Controller para gerenciamento de Estilos de Edição
/// Fornece endpoints CRUD para administração de complexidade dinâmica
/// </summary>
[ApiController]
[Route("api/v1/editing-styles")]
[Authorize]
public class EditingStylesController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public EditingStylesController(ApplicationDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Lista todos os estilos de edição (ativos e inativos)
    /// </summary>
    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<List<EditingStyleResponse>>> GetAllEditingStyles()
    {
        var editingStyles = await _context.EditingStyles
            .OrderBy(es => es.Name)
            .Select(es => new EditingStyleResponse
            {
                Id = es.Id,
                Name = es.Name,
                Description = es.Description,
                IsActive = es.IsActive,
                CreatedAt = es.CreatedAt,
                UpdatedAt = es.UpdatedAt
            })
            .ToListAsync();

        return Ok(editingStyles);
    }

    /// <summary>
    /// Busca um estilo de edição específico por ID
    /// </summary>
    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    public async Task<ActionResult<EditingStyleResponse>> GetEditingStyleById(Guid id)
    {
        var editingStyle = await _context.EditingStyles
            .Where(es => es.Id == id)
            .Select(es => new EditingStyleResponse
            {
                Id = es.Id,
                Name = es.Name,
                Description = es.Description,
                IsActive = es.IsActive,
                CreatedAt = es.CreatedAt,
                UpdatedAt = es.UpdatedAt
            })
            .FirstOrDefaultAsync();

        if (editingStyle == null) return NotFound();

        return Ok(editingStyle);
    }

    /// <summary>
    /// Cria um novo estilo de edição (Apenas Admin)
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<EditingStyleResponse>> CreateEditingStyle([FromBody] CreateEditingStyleRequest request)
    {
        // Validação de nome único
        var nameExists = await _context.EditingStyles
            .AnyAsync(es => es.Name == request.Name);

        if (nameExists)
            return Conflict(new { message = $"Já existe um estilo de edição com o nome '{request.Name}'." });

        var editingStyle = new EditingStyle
        {
            Name = request.Name,
            Description = request.Description,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.EditingStyles.Add(editingStyle);
        await _context.SaveChangesAsync();

        var response = new EditingStyleResponse
        {
            Id = editingStyle.Id,
            Name = editingStyle.Name,
            Description = editingStyle.Description,
            IsActive = editingStyle.IsActive,
            CreatedAt = editingStyle.CreatedAt,
            UpdatedAt = editingStyle.UpdatedAt
        };

        return CreatedAtAction(nameof(GetEditingStyleById), new { id = editingStyle.Id }, response);
    }

    /// <summary>
    /// Atualiza um estilo de edição existente (Apenas Admin)
    /// </summary>
    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<EditingStyleResponse>> UpdateEditingStyle(Guid id, [FromBody] UpdateEditingStyleRequest request)
    {
        var editingStyle = await _context.EditingStyles.FindAsync(id);
        if (editingStyle == null) return NotFound();

        // Atualiza apenas os campos fornecidos
        if (!string.IsNullOrWhiteSpace(request.Name))
        {
            // Verifica se o novo nome já existe (e não é o próprio estilo sendo editado)
            var nameExists = await _context.EditingStyles
                .AnyAsync(es => es.Name == request.Name && es.Id != id);

            if (nameExists)
                return Conflict(new { message = $"Já existe um estilo de edição com o nome '{request.Name}'." });

            editingStyle.Name = request.Name;
        }

        if (request.Description != null)
            editingStyle.Description = request.Description;

        if (request.IsActive.HasValue)
            editingStyle.IsActive = request.IsActive.Value;

        editingStyle.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        var response = new EditingStyleResponse
        {
            Id = editingStyle.Id,
            Name = editingStyle.Name,
            Description = editingStyle.Description,
            IsActive = editingStyle.IsActive,
            CreatedAt = editingStyle.CreatedAt,
            UpdatedAt = editingStyle.UpdatedAt
        };

        return Ok(response);
    }

    /// <summary>
    /// Remove (soft delete) um estilo de edição (Apenas Admin)
    /// </summary>
    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> DeleteEditingStyle(Guid id)
    {
        var editingStyle = await _context.EditingStyles.FindAsync(id);
        if (editingStyle == null) return NotFound();

        // Soft delete: apenas desativa o estilo
        editingStyle.IsActive = false;
        editingStyle.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return NoContent();
    }
}
