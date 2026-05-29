using System.ComponentModel.DataAnnotations;

namespace Media8.Application.DTOs.Offers;

/// <summary>
/// Requisição para criação de um contrato de cliente (atribuição de oferta)
/// </summary>
public class CreateClientContractRequest
{
    /// <summary>
    /// ID da oferta contratada
    /// </summary>
    [Required(ErrorMessage = "O ID da oferta é obrigatório.")]
    public Guid OfferId { get; set; }

    /// <summary>
    /// ID do cliente que está contratando
    /// </summary>
    [Required(ErrorMessage = "O ID do cliente é obrigatório.")]
    public Guid ClientId { get; set; }

    /// <summary>
    /// ID do usuário que está atribuindo o contrato (admin)
    /// </summary>
    [Required(ErrorMessage = "O ID do usuário que atribui é obrigatório.")]
    public Guid AssignedByUserId { get; set; }
}

/// <summary>
/// Requisição para atualização de contrato (ex: alteração de status)
/// </summary>
public class UpdateClientContractRequest
{
    /// <summary>
    /// Status do contrato
    /// </summary>
    public Domain.Enums.AssignmentStatus? Status { get; set; }

    /// <summary>
    /// Data de expiração (opcional, para ajustes manuais)
    /// </summary>
    public DateTime? ExpiresAt { get; set; }
}

/// <summary>
/// Resposta detalhada do contrato com snapshot imutável
/// </summary>
public class ClientContractResponse
{
public Guid Id { get; set; }
public Guid OfferId { get; set; }
public Guid ClientId { get; set; }
public Guid AssignedBy { get; set; }
public int SequentialId { get; set; }
public bool IsArchived { get; set; }

// ==========================================
// SNAPSHOT COMERCIAL (Imutável)
// ==========================================
public string? SnapshotOfferName { get; set; }
public int? SnapshotVideoQuantity { get; set; }
public decimal? SnapshotPrice { get; set; }
public int? SnapshotValidityDays { get; set; }
public int? SnapshotDeliveryDays { get; set; }
public int? SnapshotWarrantyDays { get; set; }
public Domain.Enums.ContractType SnapshotContractType { get; set; }

// ==========================================
// SNAPSHOT TÉCNICO (Imutável - Sem FKs)
// ==========================================
public string? SnapshotVideoFormatName { get; set; }
public string? SnapshotEditingStyleName { get; set; }
public int? SnapshotMaxDurationSeconds { get; set; }

public DateTime AssignedAt { get; set; }
public DateTime ActivatedAt { get; set; }
public DateTime? ExpiresAt { get; set; }
public Domain.Enums.AssignmentStatus Status { get; set; }
public DateTime CreatedAt { get; set; }
public DateTime UpdatedAt { get; set; }

// Informações do Cliente (para visão do Admin)
public string? ClientName { get; set; }
public string? ClientEmail { get; set; }

// Informações de Lote e Faturamento
public Guid? ActiveLotId { get; set; }
public int? ActiveLotRemainingQuantity { get; set; }
public bool HasPendingInvoice { get; set; }
public DateTime? OldestUnpaidInvoiceDueDate { get; set; }
}

