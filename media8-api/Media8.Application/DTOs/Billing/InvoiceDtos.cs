using Media8.Domain.Enums;

namespace Media8.Application.DTOs.Billing;

/// <summary>
/// Resposta com dados detalhados da fatura para a interface administrativa.
/// </summary>
public class InvoiceResponse
{
    public Guid Id { get; set; }
    public Guid ClientId { get; set; }
    public string ClientName { get; set; } = string.Empty;
    public string ClientEmail { get; set; } = string.Empty;
    public Guid? ContractId { get; set; }
    public string? ContractOfferName { get; set; }
    public string Description { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public int? CycleNumber { get; set; }
    public DateTime DueDate { get; set; }
    public InvoiceStatus Status { get; set; }
    public DateTime? PaidAt { get; set; }
    public string? PaymentMethod { get; set; }
    public string? GatewayInvoiceId { get; set; }
    public string? TransactionId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

/// <summary>
/// Requisição para confirmar o recebimento de pagamento de forma manual pelo administrador.
/// </summary>
public class ConfirmPaymentRequest
{
    /// <summary>
    /// Método de pagamento utilizado (Ex: "Pix", "Boleto", "Manual")
    /// </summary>
    public string PaymentMethod { get; set; } = string.Empty;
    
    /// <summary>
    /// Código identificador ou comprovante da transação (opcional)
    /// </summary>
    public string? TransactionId { get; set; }
}
