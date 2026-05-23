using Media8.Domain.Enums;

namespace Media8.Domain.Entities;

public class Order
{
public Guid Id { get; set; } = Guid.NewGuid();
public Guid ClientId { get; set; }
public Guid? EditorId { get; set; }
public string Title { get; set; } = string.Empty;
public string Briefing { get; set; } = string.Empty;
public string SourceFilesUrl { get; set; } = string.Empty;
public string? FinalVideoUrl { get; set; }
public OrderStatus Status { get; set; } = OrderStatus.Draft;

/// <summary>
/// Foreign Key para o formato de vídeo dinâmico
/// </summary>
public Guid VideoFormatId { get; set; }

/// <summary>
/// Foreign Key para o lote de saldo original (ServiceBalanceLot) que financiou este pedido
/// Usado para reembolso em caso de cancelamento
/// </summary>
public Guid? ServiceBalanceLotId { get; set; }

/// <summary>
/// Foreign Key para o contrato de cliente (ClientContract) associado ao lote de saldo
/// </summary>
public Guid? AssignmentId { get; set; }

/// <summary>
/// Foreign Key para o perfil de branding (BrandingProfile) usado neste pedido
/// </summary>
public Guid? BrandingProfileId { get; set; }

/// <summary>
/// Foreign Key para o perfil de edição (EditingProfile) usado neste pedido
/// </summary>
public Guid? EditingProfileId { get; set; }

public DateOnly Deadline { get; set; }
public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

// Navigation properties
public User? Client { get; set; }
public User? Editor { get; set; }
public VideoFormat? VideoFormat { get; set; }
public ServiceBalanceLot? ServiceBalanceLot { get; set; }
public ClientContract? Contract { get; set; }
public BrandingProfile? BrandingProfile { get; set; }
public EditingProfile? EditingProfile { get; set; }
public ICollection<OrderTimeline> Timeline { get; set; } = new List<OrderTimeline>();
}

public class OrderTimeline
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OrderId { get; set; }
    public Guid UserId { get; set; }
    public TimelineActionType ActionType { get; set; }
    public string Content { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Order? Order { get; set; }
    public User? User { get; set; }
}
