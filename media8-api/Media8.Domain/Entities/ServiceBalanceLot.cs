using Media8.Domain.Enums;

namespace Media8.Domain.Entities;

/// <summary>
/// Entidade estritamente numérica para controle de saldos de crédito.
/// NÃO possui FKs para VideoFormat ou EditingStyle - apenas ContractId e quantidades.
/// </summary>
public class ServiceBalanceLot
{
public Guid Id { get; set; } = Guid.NewGuid();
public Guid UserId { get; set; }

/// <summary>
/// FK para ClientContract (único vínculo permitido - sem FKs para configurações)
/// </summary>
public Guid ContractId { get; set; }

/// <summary>
/// Quantidade total original herdada do contrato
/// </summary>
public int Quantity { get; set; }

/// <summary>
/// Quantidade remanescente para consumo (decrementada a cada pedido)
/// </summary>
public int RemainingQuantity { get; set; }

/// <summary>
/// Data de criação do lote (substitui PurchasedAt para padronização)
/// </summary>
public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

/// <summary>
/// Data de expiração do lote (calculada a partir do contrato)
/// </summary>
public DateTime? ExpiresAt { get; set; }

/// <summary>
/// Fonte do saldo (purchase, subscription, promo, gift)
/// </summary>
public LotSource Source { get; set; }

/// <summary>
/// FK para o contrato que gerou este lote (mesmo que ContractId, mantido para compatibilidade)
/// </summary>
public Guid? AssignmentId { get; set; }

public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

// Navigation properties
public User? User { get; set; }
public ClientContract? Contract { get; set; }
}
