using Media8.Domain.Enums;

namespace Media8.Domain.Entities;

public class ServiceBalanceLot
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    
    /// <summary>
    /// Foreign Key para o formato de vídeo dinâmico
    /// </summary>
    public Guid VideoFormatId { get; set; }
    
    public int Quantity { get; set; }
    public int RemainingQuantity { get; set; }
    public DateTime PurchasedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ExpiresAt { get; set; }
    public LotSource Source { get; set; }
    public Guid? AssignmentId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public User? User { get; set; }
    public PackageAssignment? Assignment { get; set; }
    public VideoFormat? VideoFormat { get; set; }
}
