namespace Media8.Domain.Entities;

/// <summary>
/// Represents an editing profile containing artistic and technical video editing preferences.
/// Used to store reusable editing style configuration such as cut guidelines, music style,
/// thumbnail preferences, and general notes for video production.
/// </summary>
public class EditingProfile
{
    public Guid Id { get; set; } = Guid.NewGuid();
    
    /// <summary>
    /// Foreign Key to the User/Client who owns this profile.
    /// </summary>
    public Guid UserId { get; set; }
    
    /// <summary>
    /// Identificador sequencial amigável escopado por cliente (ex: Perfil Edição #0001)
    /// </summary>
    public int SequentialId { get; set; }
    
    /// <summary>
    /// Profile name for internal identification (e.g., "Profile 1: Vlogs", "Profile 2: Authority Videos").
    /// </summary>
    public string Name { get; set; } = string.Empty;
    
    /// <summary>
    /// Reference URL for editing style.
    /// Question: "Tem alguma referência de edição que você gostaria que eu seguisse? (Adicione o link)"
    /// </summary>
    public string ReferenceUrl { get; set; } = string.Empty;
    
    /// <summary>
    /// Guidelines for parts to keep or remove from the original video.
    /// Question: "Há partes do vídeo original que precisam ser mantidas ou removidas obrigatoriamente?"
    /// </summary>
    public string CutGuidelines { get; set; } = string.Empty;
    
    /// <summary>
    /// Thumbnail preference (Yes, No, Already Have Ready).
    /// Question: "Deseja que eu crie a thumbnail (capa) do vídeo?"
    /// </summary>
    public string ThumbnailPreference { get; set; } = string.Empty;
    
    /// <summary>
    /// Music style or soundtrack preference.
    /// Question: "Qual a trilha sonora ou estilo musical que você prefere?"
    /// </summary>
    public string MusicStyle { get; set; } = string.Empty;
    
    /// <summary>
    /// Whether to highlight a video moment as a "main clip" for the first seconds.
    /// Question: "Deseja destacar algum momento do vídeo como "clipe principal" para usar nos primeiros segundos?"
    /// </summary>
    public bool UseVideoHook { get; set; }
    
    /// <summary>
    /// Words, expressions, or central themes to highlight visually.
    /// Question: "Alguma palavra, expressão ou tema central que você quer que apareça com destaque visual?"
    /// </summary>
    public string TextHighlightStyle { get; set; } = string.Empty;
    
  /// <summary>
  /// General notes combining extra important info and additional instructions.
  /// Questions: "Informações extras importantes para essa edição..." and "Algo mais que você queira incluir na edição?"
  /// </summary>
  public string GeneralNotes { get; set; } = string.Empty;

  /// <summary>
  /// Indicates whether the profile is active (not archived).
  /// Default: true (active)
  /// </summary>
  public bool IsActive { get; set; } = true;

  public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
  public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
