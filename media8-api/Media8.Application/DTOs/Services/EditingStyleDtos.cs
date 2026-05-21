using System.ComponentModel.DataAnnotations;

namespace Media8.Application.DTOs.Services;

/// <summary>
/// Requisição para criação de um novo estilo de edição
/// </summary>
public class CreateEditingStyleRequest
{
    /// <summary>
    /// Nome do estilo de edição (ex: "Simples", "Profissional", "Viral")
    /// </summary>
    [Required(ErrorMessage = "O nome do estilo de edição é obrigatório.")]
    [StringLength(100, MinimumLength = 3, ErrorMessage = "O nome deve ter entre 3 e 100 caracteres.")]
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Descrição detalhada do estilo de edição
    /// </summary>
    [StringLength(500, ErrorMessage = "A descrição deve ter no máximo 500 caracteres.")]
    public string? Description { get; set; }
}

/// <summary>
/// Requisição para atualização de um estilo de edição existente
/// </summary>
public class UpdateEditingStyleRequest
{
    /// <summary>
    /// Nome do estilo de edição
    /// </summary>
    [StringLength(100, MinimumLength = 3, ErrorMessage = "O nome deve ter entre 3 e 100 caracteres.")]
    public string? Name { get; set; }

    /// <summary>
    /// Descrição detalhada do estilo de edição
    /// </summary>
    [StringLength(500, ErrorMessage = "A descrição deve ter no máximo 500 caracteres.")]
    public string? Description { get; set; }

    /// <summary>
    /// Indica se o estilo de edição está ativo
    /// </summary>
    public bool? IsActive { get; set; }
}

/// <summary>
/// Resposta padrão para retorno de dados de EditingStyle
/// </summary>
public class EditingStyleResponse
{
public Guid Id { get; set; }
public string Name { get; set; } = string.Empty;
public string? Description { get; set; }
public bool IsActive { get; set; }
public DateTime CreatedAt { get; set; }
public DateTime UpdatedAt { get; set; }

/// <summary>
/// Indica se o estilo pode ser deletado permanentemente (sem ofertas vinculadas)
/// </summary>
public bool CanDeletePermanently { get; set; }
}
