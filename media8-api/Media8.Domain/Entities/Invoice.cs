using Media8.Domain.Enums;

namespace Media8.Domain.Entities;

/// <summary>
/// Entidade de Faturamento (Invoice) que representa cobranças e pagamentos de clientes.
/// Desacopla o controle financeiro do provisionamento de saldos.
/// </summary>
public class Invoice
{
    public Guid Id { get; set; } = Guid.NewGuid();
    
    /// <summary>
    /// ID do cliente associado à cobrança
    /// </summary>
    public Guid ClientId { get; set; }
    
    /// <summary>
    /// Identificador sequencial amigável escopado por cliente (ex: Fatura #0001)
    /// </summary>
    public int SequentialId { get; set; }
    
    /// <summary>
    /// ID do contrato relacionado (opcional, nulo para compras avulsas sem contrato persistente)
    /// </summary>
    public Guid? ContractId { get; set; }
    
    /// <summary>
    /// Descrição legível da cobrança (Ex: "Assinatura - Plano Scale - Mês 2/6")
    /// </summary>
    public string Description { get; set; } = string.Empty;
    
    /// <summary>
    /// Valor cobrado na fatura
    /// </summary>
    public decimal Amount { get; set; }
    
    /// <summary>
    /// Número do ciclo mensal para assinaturas (Ex: 1, 2, 3...)
    /// </summary>
    public int? CycleNumber { get; set; }
    
    /// <summary>
    /// Data de vencimento da fatura
    /// </summary>
    public DateTime DueDate { get; set; }
    
    /// <summary>
    /// Status do faturamento (Pendente, Pago, Atrasado, Cancelado)
    /// </summary>
    public InvoiceStatus Status { get; set; } = InvoiceStatus.Pending;
    
    /// <summary>
    /// Data e hora da confirmação do pagamento
    /// </summary>
    public DateTime? PaidAt { get; set; }
    
    /// <summary>
    /// Método utilizado (Pix, Boleto, Cartao, Manual, Automático)
    /// </summary>
    public string? PaymentMethod { get; set; }
    
    /// <summary>
    /// ID identificador da fatura no gateway de pagamento (Stripe/Asaas)
    /// </summary>
    public string? GatewayInvoiceId { get; set; }
    
    /// <summary>
    /// ID identificador da transação ou código do comprovante financeiro
    /// </summary>
    public string? TransactionId { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Propriedades de Navegação
    public User? Client { get; set; }
    public ClientContract? Contract { get; set; }
}
