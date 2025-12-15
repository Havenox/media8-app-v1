using Media8.Domain.Enums;
using System.Text.Json.Serialization;

namespace Media8.Application.DTOs.Packages;

public class CreatePackageRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Slug { get; set; }
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public PackageCategory Category { get; set; }
    public decimal Price { get; set; }
    public int VideoQuantity { get; set; }
    public int MaxDurationSeconds { get; set; }
    public int? ValidityDays { get; set; }
    public int LoyaltyMonths { get; set; }
    public int DeliveryDays { get; set; }
    public List<ServiceType> ServiceTypes { get; set; } = new();
    public string? Description { get; set; }
    public List<string> Features { get; set; } = new();
    public string? Disclaimer { get; set; }
    public string? Badge { get; set; }
    public bool IsPublic { get; set; } = true;

}

public class UpdatePackageRequest
{
    public string? Name { get; set; }
    public string? Slug { get; set; }
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public PackageCategory? Category { get; set; }
    public decimal? Price { get; set; }
    public int? VideoQuantity { get; set; }
    public int? MaxDurationSeconds { get; set; }
    public int? ValidityDays { get; set; }
    public int? LoyaltyMonths { get; set; }
    public int? DeliveryDays { get; set; }
    public List<ServiceType>? ServiceTypes { get; set; }
    public string? Description { get; set; }
    public List<string>? Features { get; set; }
    public string? Disclaimer { get; set; }
    public string? Badge { get; set; }
    public bool? IsPublic { get; set; }

}

public class AssignPackageRequest
{
    public Guid PackageId { get; set; }
    public Guid ClientId { get; set; }
}

public class PackageAssignmentDto
{
    public Guid Id { get; set; }
    public Guid PackageId { get; set; }
    public Guid ClientId { get; set; }
    public Guid AssignedBy { get; set; }
    public DateTime AssignedAt { get; set; }
    public DateTime ActivatedAt { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public AssignmentStatus Status { get; set; }
}
