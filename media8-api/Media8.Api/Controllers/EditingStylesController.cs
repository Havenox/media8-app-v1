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
UpdatedAt = es.UpdatedAt,
CanDeletePermanently = !_context.Offers.Any(o => o.EditingStyleId == es.Id)
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
UpdatedAt = es.UpdatedAt,
CanDeletePermanently = !_context.Offers.Any(o => o.EditingStyleId == es.Id)
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
/// Remove um estilo de edição (Apenas Admin)
/// Se permanent=false (padrão): apenas arquiva (Soft Delete)
/// Se permanent=true: tenta Hard Delete (se não houver ofertas)
/// </summary>
[HttpDelete("{id:guid}")]
[Authorize(Roles = "Admin")]
public async Task<ActionResult<DeleteEditingStyleResponse>> DeleteEditingStyle(Guid id, [FromQuery] bool permanent = false)
{
  var editingStyle = await _context.EditingStyles.FindAsync(id);
  if (editingStyle == null) return NotFound();

  // Se permanent=false (padrão), apenas arquiva
  if (!permanent)
  {
    editingStyle.IsActive = false;
    editingStyle.UpdatedAt = DateTime.UtcNow;
    await _context.SaveChangesAsync();

    return Ok(new DeleteEditingStyleResponse
    {
      Success = true,
      Message = "Estilo arquivado com sucesso.",
      DeletedPhysically = false
    });
  }

  // Se permanent=true, verifica se pode deletar fisicamente
  var hasOffers = await _context.Offers.AnyAsync(o => o.EditingStyleId == id);

  if (hasOffers)
  {
    // Não pode deletar fisicamente
    return BadRequest(new DeleteEditingStyleResponse
    {
      Success = false,
      Message = "Não é possível excluir permanentemente: o estilo possui ofertas vinculadas.",
      DeletedPhysically = false
    });
  }
  else
  {
    // Hard Delete: remove fisicamente
    _context.EditingStyles.Remove(editingStyle);
    await _context.SaveChangesAsync();

    return Ok(new DeleteEditingStyleResponse
    {
      Success = true,
      Message = "Estilo excluído permanentemente.",
      DeletedPhysically = true
    });
  }
}

public class DeleteEditingStyleResponse
{
public bool Success { get; set; }
public string Message { get; set; } = string.Empty;
public bool DeletedPhysically { get; set; }
}
}
