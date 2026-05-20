using Media8.Domain.Enums;

namespace Media8.Domain.Entities;

/// <summary>
/// Representa uma oferta comercial de serviços de edição.
/// Substitui a entidade Package para alinhar nomenclatura ao domínio de negócio.
/// </summary>
public class Offer
{
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>
    /// Nome da oferta (ex: "Plano Mensal", "Pacote 10 Edições")
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Slug único para identificação da oferta
    /// </summary>
    public string Slug { get; set; } = string.Empty;

    /// <summary>
    /// Categoria da oferta (legado - usar ContractType)
    /// </summary>
    public PackageCategory Category { get; set; }

    /// <summary>
    /// Tipo de contrato que governa regras de expiração e renovação
    /// </summary>
    public ContractType ContractType { get; set; }

    /// <summary>
    /// Preço da oferta
    /// </summary>
    public decimal Price { get; set; }

    /// <summary>
    /// Quantidade de vídeos incluídos
    /// </summary>
    public int VideoQuantity { get; set; }

    /// <summary>
    /// Duração máxima por vídeo em segundos
    /// </summary>
    public int MaxDurationSeconds { get; set; }

    /// <summary>
    /// Dias de validade da oferta
    /// </summary>
    public int? ValidityDays { get; set; }

    /// <summary>
    /// Meses de fidelidade
    /// </summary>
    public int LoyaltyMonths { get; set; }

    /// <summary>
    /// Prazo de entrega em dias
    /// </summary>
    public int DeliveryDays { get; set; }

    /// <summary>
    /// ID do formato de vídeo associado à oferta
    /// </summary>
    public Guid? VideoFormatId { get; set; }

    /// <summary>
    /// ID do estilo de edição associado à oferta
    /// </summary>
    public Guid? EditingStyleId { get; set; }

    /// <summary>
    /// Formatos de vídeo suportados por esta oferta (relação N:N)
    /// </summary>
    public ICollection<VideoFormat> SupportedFormats { get; set; } = new List<VideoFormat>();

    public string? Description { get; set; }
    public List<string> Features { get; set; } = new List<string>();
    public string? Disclaimer { get; set; }
    public string? Badge { get; set; }
    public bool IsPublic { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public ICollection<ClientContract> Contracts { get; set; } = new List<ClientContract>();

    // Navigation properties para relacionamentos
    public VideoFormat? VideoFormat { get; set; }
    public EditingStyle? EditingStyle { get; set; }
}
