using Media8.Domain.Enums;

namespace Media8.Domain.Entities;

public class Package
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public PackageCategory Category { get; set; }
    public decimal Price { get; set; }
    public int VideoQuantity { get; set; }
    public int MaxDurationSeconds { get; set; }
    public int? ValidityDays { get; set; }
    public int LoyaltyMonths { get; set; }
    public int DeliveryDays { get; set; }
    public List<ServiceType> ServiceTypes { get; set; } = new List<ServiceType>();
    public string? Description { get; set; }
    public List<string> Features { get; set; } = new List<string>();
    public string? Disclaimer { get; set; }
    public string? Badge { get; set; }
    public bool IsPublic { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public ICollection<PackageAssignment> Assignments { get; set; } = new List<PackageAssignment>();
}

public class PackageAssignment
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid PackageId { get; set; }
    public Guid ClientId { get; set; }
    public Guid AssignedBy { get; set; }
    public DateTime AssignedAt { get; set; } = DateTime.UtcNow;
    public DateTime ActivatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ExpiresAt { get; set; }
    public AssignmentStatus Status { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Snapshot Properties (Immutable Contract)
    public string? SnapshotPackageName { get; set; }
    public int? SnapshotVideoQuantity { get; set; }
    public decimal? SnapshotPrice { get; set; }
    public int? SnapshotValidityDays { get; set; }

    // Navigation properties
    public Package? Package { get; set; }
    public User? Client { get; set; }
    public User? Assigner { get; set; }
    public ICollection<ServiceBalanceLot> ServiceBalanceLots { get; set; } = new List<ServiceBalanceLot>();
}
