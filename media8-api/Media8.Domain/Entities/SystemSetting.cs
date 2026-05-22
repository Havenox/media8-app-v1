namespace Media8.Domain.Entities;

/// <summary>
/// Represents a system-wide configuration setting stored as key-value pair.
/// Used for dynamic business rules that require admin configuration without code deployment.
/// </summary>
public class SystemSetting
{
    public Guid Id { get; set; } = Guid.NewGuid();
    
    /// <summary>
    /// Unique identifier key for the setting (e.g., "CancellationWindowHours")
    /// </summary>
    public string Key { get; set; } = string.Empty;
    
    /// <summary>
    /// Value of the setting stored as string
    /// </summary>
    public string Value { get; set; } = string.Empty;
    
    /// <summary>
    /// Human-readable description of what this setting controls
    /// </summary>
    public string Description { get; set; } = string.Empty;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
