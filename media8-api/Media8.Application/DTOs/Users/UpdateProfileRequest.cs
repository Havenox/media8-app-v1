using System.Text.Json.Serialization;

namespace Media8.Application.DTOs.Users;

public class UpdateProfileRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Bio { get; set; }
    public string? Phone { get; set; }
    
    // Accepts a dictionary or raw object simplifies flexibility
    public object? Preferences { get; set; } 
}
