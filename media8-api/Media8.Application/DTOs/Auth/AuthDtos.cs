using Media8.Domain.Enums;
using System.Text.Json.Serialization;

namespace Media8.Application.DTOs.Auth;

public class RegisterRequest
{
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string? Phone { get; set; }
}

public class LoginRequest
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class AuthResponse
{
    public string Token { get; set; } = string.Empty;
    public UserDto User { get; set; } = new();
}

public class UserDto
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Bio { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Preferences { get; set; } = string.Empty; // JSON
    public string? AvatarUrl { get; set; }
    [JsonPropertyName("role")]
    public string Role { get; set; } = string.Empty;
    public List<string> Roles { get; set; } = new List<string>();
}
