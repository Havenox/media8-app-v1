using Media8.Domain.Enums;

namespace Media8.Domain.Entities;

/// <summary>
/// Representa um contrato de cliente com uma oferta.
/// Substitui a entidade PackageAssignment para alinhar nomenclatura ao domínio de negócio.
/// </summary>
public class ClientContract
{
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>
    /// ID da oferta associada (antigo PackageId)
    /// </summary>
    public Guid OfferId { get; set; }

    /// <summary>
    /// ID do cliente
    /// </summary>
    public Guid ClientId { get; set; }

    /// <summary>
    /// ID do usuário que atribuiu o contrato
    /// </summary>
    public Guid AssignedBy { get; set; }

    /// <summary>
    /// Data de atribuição do contrato
    /// </summary>
    public DateTime AssignedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Data de ativação do contrato
    /// </summary>
    public DateTime ActivatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Data de expiração do contrato
    /// </summary>
    public DateTime? ExpiresAt { get; set; }

    /// <summary>
    /// Status do contrato
    /// </summary>
    public AssignmentStatus Status { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Snapshot Properties (Immutable Contract) - Renomeados para refletir Offer
    /// <summary>
    /// Nome da oferta no momento da contratação (imutável)
    /// </summary>
    public string? SnapshotOfferName { get; set; }

    /// <summary>
    /// Quantidade de vídeos no momento da contratação (imutável)
    /// </summary>
    public int? SnapshotVideoQuantity { get; set; }

    /// <summary>
    /// Preço no momento da contratação (imutável)
    /// </summary>
    public decimal? SnapshotPrice { get; set; }

    /// <summary>
    /// Dias de validade no momento da contratação (imutável)
    /// </summary>
    public int? SnapshotValidityDays { get; set; }

    // Navigation properties
    public Offer? Offer { get; set; }
    public User? Client { get; set; }
    public User? Assigner { get; set; }
    public ICollection<ServiceBalanceLot> ServiceBalanceLots { get; set; } = new List<ServiceBalanceLot>();
}
