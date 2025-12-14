using System.ComponentModel.DataAnnotations;

namespace Media8.Application.DTOs.Users;

public class AdminUpdateUserRequest
{
    [Required]
    public string Name { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;
    
    public string? Phone { get; set; }

    [Required]
    public string Role { get; set; } = string.Empty;
}
