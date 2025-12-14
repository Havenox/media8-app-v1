namespace Media8.Domain.Enums;

using System.Text.Json.Serialization;

public enum AppRole
{
    Client,
    Editor,
    Admin
}

public enum PackageCategory
{
    Assinatura,
    Pacote,
    Avulso
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum ServiceType
{
    ReelsStandard,
    ReelsPremium,
    YoutubeCurto,
    YoutubeMedio,
    YoutubeLongo,
    PacoteReels,
    Avulso
}

public enum OrderStatus
{
    Pending,
    InProgress,
    InReview,
    ChangesRequested,
    Approved
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
