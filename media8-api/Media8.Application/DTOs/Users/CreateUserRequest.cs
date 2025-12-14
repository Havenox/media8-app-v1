using Media8.Domain.Enums;
using System.ComponentModel.DataAnnotations;

namespace Media8.Application.DTOs.Users;

public class CreateUserRequest
{
    [Required]
    public string Name { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MinLength(6)]
    public string Password { get; set; } = string.Empty;

    public string? Role { get; set; } = "Client";
}
