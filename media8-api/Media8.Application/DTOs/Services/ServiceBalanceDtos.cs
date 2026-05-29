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

// ==========================================
// SNAPSHOT COMERCIAL (Imutável)
// ==========================================
public string SnapshotOfferName { get; set; } = string.Empty; // e.g. "Plano Growth"
public int SnapshotVideoQuantity { get; set; } // Snapshot Quantity
public string ContractType { get; set; } = string.Empty; // e.g. "Assinatura", "Pacote"
public int? SnapshotWarrantyDays { get; set; }

// ==========================================
// SNAPSHOT TÉCNICO (Imutável - Sem FKs)
// ==========================================
public string SnapshotVideoFormatName { get; set; } = string.Empty; // e.g. "Reels Premium"
public string SnapshotEditingStyleName { get; set; } = string.Empty; // e.g. "Corporativo"
public int SnapshotMaxDurationSeconds { get; set; } // Duração máxima em segundos

// ==========================================
// DADOS DE ESTADO DO LOTE
// ==========================================
public int RemainingQuantity { get; set; } // Saldo restante
public int TotalQuantity { get; set; } // Total original
public DateTime? ExpiresAt { get; set; } // Data de expiração
public DateTime PurchaseDate { get; set; } // Data de compra
    public string Status { get; set; } = "active"; // active, expired, depleted
    public Guid? InvoiceId { get; set; }
    public string? InvoiceStatus { get; set; }
    public Guid? ContractId { get; set; }
    public int? ContractSequentialId { get; set; }
    public DateTime? OldestUnpaidInvoiceDueDate { get; set; }
}
