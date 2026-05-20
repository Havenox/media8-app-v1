namespace Media8.Domain.Entities;

/// <summary>
/// Representa um formato de vídeo dinâmico no sistema.
/// Substitui o enum estático ServiceType para permitir catálogo data-driven.
/// </summary>
public class VideoFormat
{
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>
    /// Nome do formato (ex: "Reels Premium", "YouTube Curto")
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Slug único para identificação (ex: "reels-premium", "youtube-curto")
    /// </summary>
    public string Slug { get; set; } = string.Empty;

    /// <summary>
    /// Duração máxima em segundos permitida para este formato
    /// </summary>
    public int MaxDurationSeconds { get; set; }

    /// <summary>
    /// ID do estilo de edição associado (antigo Tier)
    /// </summary>
    public Guid? EditingStyleId { get; set; }

    /// <summary>
    /// Indica se o formato está ativo e disponível para contratação
    /// </summary>
    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public ICollection<Package> Packages { get; set; } = new List<Package>();
    
    // Navigation properties
    public EditingStyle? EditingStyle { get; set; }
}

/// <summary>
/// Níveis de complexidade para formatos de vídeo
/// </summary>
public enum ComplexityLevel
{
    Standard,    // Edição básica, cortes simples
    Premium,     // Edição avançada, efeitos, motion
    GodMode      // Edição complexa, VFX, color grading
}
