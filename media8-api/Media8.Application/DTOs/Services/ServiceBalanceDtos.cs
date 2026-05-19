using System.ComponentModel.DataAnnotations;

namespace Media8.Application.DTOs.Services;

public class ConsumeServiceRequest
{
    [Required]
    /// <summary>
    /// ID do formato de vídeo dinâmico a ser consumido
    /// </summary>
    public Guid VideoFormatId { get; set; }

    [Range(1, 100)]
    public int Quantity { get; set; } = 1;
}

public class ConsumeServiceResponse
{
    public bool Success { get; set; }
    public string? Error { get; set; }
    public int RemainingTotal { get; set; }
}

public class UnifiedServiceBalanceDto
{
    public Guid Id { get; set; } // Balance Lot ID
    public string ServiceName { get; set; } = string.Empty; // e.g. "Reels Estratégico"
    public string PackageName { get; set; } = string.Empty; // e.g. "Plano Growth" (Snapshot)
    public int RemainingQuantity { get; set; }
    public int TotalQuantity { get; set; } // Snapshot Quantity
    public DateTime? ExpiresAt { get; set; }
    public DateTime PurchaseDate { get; set; }
    public string Status { get; set; } = "active"; // active, expired, depleted
}
