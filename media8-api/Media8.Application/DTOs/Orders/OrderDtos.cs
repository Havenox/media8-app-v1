using Media8.Domain.Enums;

namespace Media8.Application.DTOs.Orders;

public class CreateOrderRequest
{
public string Title { get; set; } = string.Empty;
public string Briefing { get; set; } = string.Empty;
public string SourceFilesUrl { get; set; } = string.Empty;

/// <summary>
/// ID do formato de vídeo dinâmico
/// </summary>
public Guid VideoFormatId { get; set; }

/// <summary>
/// ID do lote de saldo (ServiceBalanceLot) que financiará este pedido
/// </summary>
public Guid ServiceBalanceLotId { get; set; }

public DateOnly Deadline { get; set; }
}

public class UpdateOrderRequest
{
    public string? Title { get; set; }
    public string? Briefing { get; set; }
    public string? SourceFilesUrl { get; set; }
    public string? FinalVideoUrl { get; set; }
    public string? ClientFeedback { get; set; }
}

public class OrderResponse
{
    public Guid Id { get; set; }
    public Guid ClientId { get; set; }
    public Guid? EditorId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Briefing { get; set; } = string.Empty;
    public string SourceFilesUrl { get; set; } = string.Empty;
    public string? FinalVideoUrl { get; set; }
    public OrderStatus Status { get; set; }
    
    /// <summary>
    /// ID do formato de vídeo dinâmico
    /// </summary>
    public Guid VideoFormatId { get; set; }
    public DateOnly Deadline { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
