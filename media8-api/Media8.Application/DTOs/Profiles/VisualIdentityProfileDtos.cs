using System.ComponentModel.DataAnnotations;

namespace Media8.Application.DTOs.Profiles;

/// <summary>
/// Requisição para criação de um novo identidade visual
/// </summary>
public class CreateVisualIdentityProfileRequest
{
    /// <summary>
    /// Nome do perfil (ex: "Marca 1: Salão de Beleza")
    /// </summary>
    [Required(ErrorMessage = "O nome do perfil é obrigatório.")]
    [StringLength(200, MinimumLength = 3, ErrorMessage = "O nome deve ter entre 3 e 200 caracteres.")]
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Redes sociais e nome da empresa
    /// </summary>
    [StringLength(1000, ErrorMessage = "O campo de redes sociais deve ter no máximo 1000 caracteres.")]
    public string SocialHandles { get; set; } = string.Empty;

    /// <summary>
    /// Cores da marca com códigos exatos
    /// </summary>
    [StringLength(500, ErrorMessage = "O campo de cores deve ter no máximo 500 caracteres.")]
    public string BrandColors { get; set; } = string.Empty;

    /// <summary>
    /// Fontes da marca
    /// </summary>
    [StringLength(500, ErrorMessage = "O campo de fontes deve ter no máximo 500 caracteres.")]
    public string BrandFonts { get; set; } = string.Empty;

    /// <summary>
    /// Público-alvo (enum ou texto livre)
    /// </summary>
    [StringLength(200, ErrorMessage = "O campo de público-alvo deve ter no máximo 200 caracteres.")]
    public string TargetAudience { get; set; } = string.Empty;

    /// <summary>
    /// URLs de assets da marca (imagens, logos, CTAs)
    /// </summary>
    [StringLength(2000, ErrorMessage = "O campo de assets deve ter no máximo 2000 caracteres.")]
    public string BrandAssetsUrl { get; set; } = string.Empty;
}

/// <summary>
/// Requisição para atualização de identidade visual
/// </summary>
public class UpdateVisualIdentityProfileRequest : CreateVisualIdentityProfileRequest
{
}

/// <summary>
/// Resposta de identidade visual
/// </summary>
public class VisualIdentityProfileResponse
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string SocialHandles { get; set; } = string.Empty;
    public string BrandColors { get; set; } = string.Empty;
    public string BrandFonts { get; set; } = string.Empty;
    public string TargetAudience { get; set; } = string.Empty;
    public string BrandAssetsUrl { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
