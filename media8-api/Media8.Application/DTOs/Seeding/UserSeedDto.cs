using Media8.Domain.Enums;

namespace Media8.Application.DTOs.Seeding;

public class UserSeedDto
{
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public AppRole Role { get; set; }
    public string? Phone { get; set; }
}
