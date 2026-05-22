using System.ComponentModel.DataAnnotations;

namespace Media8.Application.DTOs.Profiles;

/// <summary>
/// Requisição para criação de um novo perfil de edição
/// </summary>
public class CreateEditingProfileRequest
{
    /// <summary>
    /// Nome do perfil (ex: "Perfil 1: Vlogs")
    /// </summary>
    [Required(ErrorMessage = "O nome do perfil é obrigatório.")]
    [StringLength(200, MinimumLength = 3, ErrorMessage = "O nome deve ter entre 3 e 200 caracteres.")]
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// URL de referência de edição
    /// </summary>
    [StringLength(2000, ErrorMessage = "O campo de referência deve ter no máximo 2000 caracteres.")]
    public string ReferenceUrl { get; set; } = string.Empty;

    /// <summary>
    /// Diretrizes de corte (partes a manter ou remover)
    /// </summary>
    [StringLength(2000, ErrorMessage = "O campo de diretrizes deve ter no máximo 2000 caracteres.")]
    public string CutGuidelines { get; set; } = string.Empty;

    /// <summary>
    /// Preferência de thumbnail (Sim/Não/Já tenho pronta)
    /// </summary>
    [StringLength(100, ErrorMessage = "O campo de preferência de thumbnail deve ter no máximo 100 caracteres.")]
    public string ThumbnailPreference { get; set; } = string.Empty;

    /// <summary>
    /// Estilo musical preferido
    /// </summary>
    [StringLength(500, ErrorMessage = "O campo de estilo musical deve ter no máximo 500 caracteres.")]
    public string MusicStyle { get; set; } = string.Empty;

    /// <summary>
    /// Deseja destacar clipe principal nos primeiros segundos
    /// </summary>
    public bool UseVideoHook { get; set; }

    /// <summary>
    /// Palavras ou temas para destaque visual
    /// </summary>
    [StringLength(500, ErrorMessage = "O campo de destaque de texto deve ter no máximo 500 caracteres.")]
    public string TextHighlightStyle { get; set; } = string.Empty;

    /// <summary>
    /// Notas extras de edição
    /// </summary>
    [StringLength(4000, ErrorMessage = "O campo de notas deve ter no máximo 4000 caracteres.")]
    public string GeneralNotes { get; set; } = string.Empty;
}

/// <summary>
/// Requisição para atualização de perfil de edição
/// </summary>
public class UpdateEditingProfileRequest : CreateEditingProfileRequest
{
}

/// <summary>
/// Resposta de perfil de edição
/// </summary>
public class EditingProfileResponse
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string ReferenceUrl { get; set; } = string.Empty;
    public string CutGuidelines { get; set; } = string.Empty;
    public string ThumbnailPreference { get; set; } = string.Empty;
    public string MusicStyle { get; set; } = string.Empty;
    public bool UseVideoHook { get; set; }
    public string TextHighlightStyle { get; set; } = string.Empty;
    public string GeneralNotes { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
