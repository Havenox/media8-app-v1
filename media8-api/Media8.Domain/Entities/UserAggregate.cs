using Media8.Domain.Enums;

namespace Media8.Domain.Entities;

public class User
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Profile? Profile { get; set; }
    public ICollection<UserRole> Roles { get; set; } = new List<UserRole>();
    public ICollection<Order> ClientOrders { get; set; } = new List<Order>();
    public ICollection<Order> EditorOrders { get; set; } = new List<Order>();
    public ICollection<PackageAssignment> Assignments { get; set; } = new List<PackageAssignment>();
    public ICollection<ServiceBalanceLot> ServiceBalanceLots { get; set; } = new List<ServiceBalanceLot>();
    public ICollection<Notification> Notifications { get; set; } = new List<Notification>();
    public ICollection<ClientContract> Contracts { get; set; } = new List<ClientContract>();
    }

public class Profile
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Bio { get; set; }
    public string? Preferences { get; set; } // JSON string
    public string? AvatarUrl { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public User? User { get; set; }
}

public class UserRole
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public AppRole Role { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public User? User { get; set; }
}
