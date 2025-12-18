using System.Text.Json.Serialization;

namespace Media8.Application.DTOs.Users;

public class AdminUserDto
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public DateTime CreatedAt { get; set; }
    
    [JsonPropertyName("role")]
    public string Role { get; set; } = string.Empty;
    public List<string> Roles { get; set; } = new List<string>();

    // New optimized field to avoid N+1
    public ActivePackageSummary? ActivePackage { get; set; }
}

public class ActivePackageSummary
{
    public string Name { get; set; } = string.Empty;
    public int VideoQuantity { get; set; }
    public int AdditionalPackagesCount { get; set; }
    public DateTime? ExpiresAt { get; set; }
}
