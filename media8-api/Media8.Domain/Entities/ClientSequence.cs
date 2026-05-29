using System;

namespace Media8.Domain.Entities;

/// <summary>
/// Entidade geradora de sequências numéricas (tickets) atômicas por cliente/inquilino.
/// Usada para garantir ACID e isolamento de numeração lógica amigável.
/// </summary>
public class ClientSequence
{
    public Guid Id { get; set; } = Guid.NewGuid();
    
    /// <summary>
    /// Identificador do Cliente dono da sequência
    /// </summary>
    public Guid ClientId { get; set; }
    
    /// <summary>
    /// Tipo da Entidade (ex: "Contract", "Order", "Invoice", "BrandingProfile", "EditingProfile")
    /// </summary>
    public string EntityType { get; set; } = string.Empty;
    
    /// <summary>
    /// Último número sequencial emitido e consumido
    /// </summary>
    public int LastValue { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
