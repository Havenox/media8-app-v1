namespace Media8.Domain.Entities;

/// <summary>
/// Represents a client's branding profile containing static brand elements.
/// Used to store reusable brand configuration such as colors, fonts, social media handles,
/// and brand assets to avoid re-typing in every order briefing.
/// </summary>
public class BrandingProfile
{
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>
    /// Foreign Key to the User/Client who owns this profile.
    /// </summary>
    public Guid UserId { get; set; }
    
    /// <summary>
    /// Identificador sequencial amigável escopado por cliente (ex: Marca #0001)
    /// </summary>
    public int SequentialId { get; set; }

    /// <summary>
    /// Profile name for internal identification (e.g., "Brand 1: Beauty Salon", "Brand 2: Mentoring").
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Social media handles and company name.
    /// Question: "Seu nome e as suas redes sociais ou da sua empresa: (Adicione seu nome mais o @ delas)"
    /// </summary>
    public string SocialHandles { get; set; } = string.Empty;

    /// <summary>
    /// Brand colors with exact color codes.
    /// Question: "Qual a cor ou cores da sua marca? (Adicione o código exato da cor. Exemplo: #000000)"
    /// </summary>
    public string BrandColors { get; set; } = string.Empty;

    /// <summary>
    /// Brand fonts or font files.
    /// Question: "Qual a fonte ou fontes da sua marca? (Adicione o nome da fonte ou envie o arquivo no Drive)"
    /// </summary>
    public string BrandFonts { get; set; } = string.Empty;

    /// <summary>
    /// Target audience selection (e.g., Women, Men, Young Entrepreneurs, Corporate, Other).
    /// Question: "Para qual público-alvo este vídeo será direcionado?"
    /// </summary>
    public string TargetAudience { get; set; } = string.Empty;

    /// <summary>
    /// URLs to brand assets such as images, videos, logos, CTAs stored in Drive.
    /// Question: "Há imagens, vídeos, logos, CTAs ou arquivos específicos que devo utilizar? (Envie os arquivos no Drive)"
    /// </summary>
    public string BrandAssetsUrl { get; set; } = string.Empty;

    /// <summary>
    /// Indicates whether the profile is active (not archived).
    /// Default: true (active)
    /// </summary>
    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
