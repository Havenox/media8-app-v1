using System.ComponentModel.DataAnnotations;
using Media8.Domain.Entities;

namespace Media8.Application.DTOs.Services;

/// <summary>
/// Requisição para criação de um novo formato de vídeo
/// </summary>
public class CreateVideoFormatRequest
{
    /// <summary>
    /// Nome do formato (ex: "Reels Premium", "YouTube Curto")
    /// </summary>
    [Required(ErrorMessage = "O nome do formato é obrigatório.")]
    [StringLength(100, MinimumLength = 3, ErrorMessage = "O nome deve ter entre 3 e 100 caracteres.")]
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Slug único para identificação (ex: "reels-premium", "youtube-curto")
    /// </summary>
    [Required(ErrorMessage = "O slug é obrigatório.")]
    [StringLength(100, MinimumLength = 3, ErrorMessage = "O slug deve ter entre 3 e 100 caracteres.")]
    [RegularExpression(@"^[a-z0-9]+(?:-[a-z0-9]+)*$", ErrorMessage = "O slug deve conter apenas letras minúsculas, números e hífens.")]
    public string Slug { get; set; } = string.Empty;

    /// <summary>
    /// Duração máxima em segundos permitida para este formato
    /// </summary>
    [Range(15, 7200, ErrorMessage = "A duração máxima deve estar entre 15 e 7200 segundos (2 horas).")]
    public int MaxDurationSeconds { get; set; }

    /// <summary>
    /// Nível de complexidade do formato
    /// </summary>
    [Required(ErrorMessage = "O nível de complexidade (tier) é obrigatório.")]
    public ComplexityLevel Tier { get; set; }
}

/// <summary>
/// Requisição para atualização de um formato de vídeo existente
/// </summary>
public class UpdateVideoFormatRequest
{
    /// <summary>
    /// Nome do formato (ex: "Reels Premium", "YouTube Curto")
    /// </summary>
    [StringLength(100, MinimumLength = 3, ErrorMessage = "O nome deve ter entre 3 e 100 caracteres.")]
    public string? Name { get; set; }

    /// <summary>
    /// Slug único para identificação (ex: "reels-premium", "youtube-curto")
    /// </summary>
    [StringLength(100, MinimumLength = 3, ErrorMessage = "O slug deve ter entre 3 e 100 caracteres.")]
    [RegularExpression(@"^[a-z0-9]+(?:-[a-z0-9]+)*$", ErrorMessage = "O slug deve conter apenas letras minúsculas, números e hífens.")]
    public string? Slug { get; set; }

    /// <summary>
    /// Duração máxima em segundos permitida para este formato
    /// </summary>
    [Range(15, 7200, ErrorMessage = "A duração máxima deve estar entre 15 e 7200 segundos (2 horas).")]
    public int? MaxDurationSeconds { get; set; }

    /// <summary>
    /// Nível de complexidade do formato
    /// </summary>
    public ComplexityLevel? Tier { get; set; }

    /// <summary>
    /// Indica se o formato está ativo e disponível para contratação
    /// </summary>
    public bool? IsActive { get; set; }
}
