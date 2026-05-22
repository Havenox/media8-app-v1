using System.ComponentModel.DataAnnotations;

namespace Media8.Application.DTOs.Settings;

/// <summary>
/// Response DTO containing all system settings as key-value pairs.
/// </summary>
public class SystemSettingsResponse
{
    /// <summary>
    /// Dictionary of all settings where key is the setting name and value is the configuration value.
    /// Example: { "CancellationWindowHours": "24", "MaxOrdersPerClient": "10" }
    /// </summary>
    public Dictionary<string, string> Settings { get; set; } = new();
}

/// <summary>
/// Request DTO for updating system settings.
/// </summary>
public class UpdateSettingsRequest
{
    /// <summary>
    /// The unique key of the setting to update (e.g., "CancellationWindowHours").
    /// </summary>
    [Required]
    public string Key { get; set; } = string.Empty;
    
    /// <summary>
    /// The new value to set for this configuration.
    /// </summary>
    [Required]
    public string Value { get; set; } = string.Empty;
}

/// <summary>
/// Response DTO for successful update operations.
/// </summary>
public class UpdateSettingsResponse
{
    /// <summary>
    /// The key that was updated.
    /// </summary>
    public string Key { get; set; } = string.Empty;
    
    /// <summary>
    /// The new value that was set.
    /// </summary>
    public string Value { get; set; } = string.Empty;
    
    /// <summary>
    /// Success message.
    /// </summary>
    public string Message { get; set; } = string.Empty;
}
