namespace Media8.Domain.Enums;

using System.Text.Json.Serialization;

public enum AppRole
{
    Client,
    Editor,
    Admin
}

/// <summary>
/// Categoria do pacote (legado - manter compatibilidade)
/// </summary>
public enum PackageCategory
{
    Assinatura,
    Pacote,
    Avulso
}

/// <summary>
/// Tipo de contrato que governa regras de expiração e renovação
/// </summary>
public enum ContractType
{
    /// <summary>
    /// Serviço avulso, sem recorrência
    /// </summary>
    Avulso,
    
    /// <summary>
    /// Pacote de créditos com validade
    /// </summary>
    Pacote,
    
    /// <summary>
    /// Assinatura recorrente com renovação automática
    /// </summary>
    Assinatura
}



public enum OrderStatus
{
Draft,
Pending,
Processing,
InProgress,
InReview,
ChangesRequested,
Approved,
Completed,
Cancelled
}

public enum TimelineActionType
{
    StatusChange,
    Comment,
    VersionUpload
}

public enum AssignmentStatus
{
    Active,
    Expired,
    Cancelled
}

public enum LotSource
{
    Purchase,
    Subscription,
    Promo,
    Gift
}

public enum NotificationType
{
    Info,
    Success,
    Warning,
    Order
}

public enum InvoiceStatus
{
    Pending,
    Paid,
    Overdue,
    Cancelled
}
