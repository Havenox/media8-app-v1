namespace Media8.Domain.Entities;

/// <summary>
/// Representa um estilo de edição dinâmico no sistema.
/// Substitui o enum estático ComplexityLevel para permitir gestão dinâmica de complexidade.
/// </summary>
public class EditingStyle
{
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>
    /// Nome do estilo de edição (ex: "Simples", "Profissional", "Viral")
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Descrição detalhada do estilo de edição
    /// </summary>
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// Indica se o estilo de edição está ativo e disponível para contratação
    /// </summary>
    public bool IsActive { get; set; } = true;

  public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
  public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
