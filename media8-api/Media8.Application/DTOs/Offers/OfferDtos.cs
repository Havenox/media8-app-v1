using System.ComponentModel.DataAnnotations;
using Media8.Domain.Enums;

namespace Media8.Application.DTOs.Offers;

/// <summary>
/// Requisição para criação de uma nova oferta comercial
/// </summary>
public class CreateOfferRequest
{
    /// <summary>
    /// Nome da oferta (ex: "Plano Mensal", "Pacote 10 Edições")
    /// </summary>
    [Required(ErrorMessage = "O nome da oferta é obrigatório.")]
    [StringLength(100, MinimumLength = 3, ErrorMessage = "O nome deve ter entre 3 e 100 caracteres.")]
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Slug único para identificação da oferta
    /// </summary>
    [Required(ErrorMessage = "O slug é obrigatório.")]
    [StringLength(100, MinimumLength = 3, ErrorMessage = "O slug deve ter entre 3 e 100 caracteres.")]
    [RegularExpression(@"^[a-z0-9]+(?:-[a-z0-9]+)*$", ErrorMessage = "O slug deve conter apenas letras minúsculas, números e hífens.")]
    public string Slug { get; set; } = string.Empty;

    /// <summary>
    /// Tipo de contrato que governa regras de expiração e renovação
    /// </summary>
    [Required(ErrorMessage = "O tipo de contrato é obrigatório.")]
    public ContractType ContractType { get; set; }

    /// <summary>
    /// Preço da oferta
    /// </summary>
    [Required(ErrorMessage = "O preço é obrigatório.")]
    [Range(0.01, 999999.99, ErrorMessage = "O preço deve ser entre 0.01 e 999999.99")]
    public decimal Price { get; set; }

    /// <summary>
    /// Quantidade de vídeos incluídos
    /// </summary>
    [Required(ErrorMessage = "A quantidade de vídeos é obrigatória.")]
    [Range(1, 1000, ErrorMessage = "A quantidade deve ser entre 1 e 1000")]
    public int VideoQuantity { get; set; }

    /// <summary>
    /// Duração máxima por vídeo em segundos
    /// </summary>
    [Required(ErrorMessage = "A duração máxima é obrigatória.")]
    [Range(15, 7200, ErrorMessage = "A duração deve ser entre 15 e 7200 segundos")]
    public int MaxDurationSeconds { get; set; }

    /// <summary>
    /// Dias de validade da oferta (padrão configurável pelo admin)
    /// </summary>
    [Range(0, 3650, ErrorMessage = "A validade deve ser entre 0 e 3650 dias")]
    public int? ValidityDays { get; set; }

    /// <summary>
    /// Meses de fidelidade (padrão configurável pelo admin)
    /// </summary>
    [Range(0, 60, ErrorMessage = "A fidelidade deve ser entre 0 e 60 meses")]
    public int LoyaltyMonths { get; set; }

    /// <summary>
    /// Prazo de entrega em dias (padrão configurável pelo admin)
    /// </summary>
    [Range(0, 90, ErrorMessage = "O prazo de entrega deve ser entre 0 e 90 dias")]
    public int DeliveryDays { get; set; }

  /// <summary>
  /// ID do formato de vídeo associado à oferta
  /// </summary>
  [Required(ErrorMessage = "O formato de vídeo associado à oferta é obrigatório.")]
  public Guid VideoFormatId { get; set; }

    /// <summary>
    /// ID do estilo de edição associado à oferta
    /// </summary>
    public Guid? EditingStyleId { get; set; }

    /// <summary>
    /// Descrição opcional da oferta
    /// </summary>
    [StringLength(1000, ErrorMessage = "A descrição deve ter no máximo 1000 caracteres.")]
    public string? Description { get; set; }

    /// <summary>
    /// Lista de características da oferta
    /// </summary>
    public List<string> Features { get; set; } = new List<string>();

    /// <summary>
    /// Isenção de responsabilidade opcional
    /// </summary>
    public string? Disclaimer { get; set; }

    /// <summary>
    /// Badge opcional (ex: "Best Seller", "New")
    /// </summary>
    public string? Badge { get; set; }

    /// <summary>
    /// Indica se a oferta está visível publicamente
    /// </summary>
    public bool IsPublic { get; set; } = true;
}

/// <summary>
/// Requisição para atualização de uma oferta existente
/// </summary>
public class UpdateOfferRequest
{
    /// <summary>
    /// Nome da oferta
    /// </summary>
    [StringLength(100, MinimumLength = 3, ErrorMessage = "O nome deve ter entre 3 e 100 caracteres.")]
    public string? Name { get; set; }

    /// <summary>
    /// Slug da oferta
    /// </summary>
    [StringLength(100, MinimumLength = 3, ErrorMessage = "O slug deve ter entre 3 e 100 caracteres.")]
    [RegularExpression(@"^[a-z0-9]+(?:-[a-z0-9]+)*$", ErrorMessage = "O slug deve conter apenas letras minúsculas, números e hífens.")]
    public string? Slug { get; set; }

    /// <summary>
    /// Tipo de contrato
    /// </summary>
    public ContractType? ContractType { get; set; }

    /// <summary>
    /// Preço da oferta
    /// </summary>
    [Range(0.01, 999999.99, ErrorMessage = "O preço deve ser entre 0.01 e 999999.99")]
    public decimal? Price { get; set; }

    /// <summary>
    /// Quantidade de vídeos
    /// </summary>
    [Range(1, 1000, ErrorMessage = "A quantidade deve ser entre 1 e 1000")]
    public int? VideoQuantity { get; set; }

    /// <summary>
    /// Duração máxima por vídeo em segundos
    /// </summary>
    [Range(15, 7200, ErrorMessage = "A duração deve ser entre 15 e 7200 segundos")]
    public int? MaxDurationSeconds { get; set; }

    /// <summary>
    /// Dias de validade
    /// </summary>
    [Range(0, 3650, ErrorMessage = "A validade deve ser entre 0 e 3650 dias")]
    public int? ValidityDays { get; set; }

    /// <summary>
    /// Meses de fidelidade
    /// </summary>
    [Range(0, 60, ErrorMessage = "A fidelidade deve ser entre 0 e 60 meses")]
    public int? LoyaltyMonths { get; set; }

    /// <summary>
    /// Prazo de entrega em dias
    /// </summary>
    [Range(0, 90, ErrorMessage = "O prazo de entrega deve ser entre 0 e 90 dias")]
    public int? DeliveryDays { get; set; }

    /// <summary>
    /// ID do formato de vídeo
    /// </summary>
    public Guid? VideoFormatId { get; set; }

    /// <summary>
    /// ID do estilo de edição
    /// </summary>
    public Guid? EditingStyleId { get; set; }

    /// <summary>
    /// Descrição da oferta
    /// </summary>
    [StringLength(1000, ErrorMessage = "A descrição deve ter no máximo 1000 caracteres.")]
    public string? Description { get; set; }

    /// <summary>
    /// Lista de características
    /// </summary>
    public List<string>? Features { get; set; }

    /// <summary>
    /// Isenção de responsabilidade
    /// </summary>
    public string? Disclaimer { get; set; }

    /// <summary>
    /// Badge da oferta
    /// </summary>
    public string? Badge { get; set; }

    /// <summary>
    /// Visibilidade pública
    /// </summary>
    public bool? IsPublic { get; set; }
}

/// <summary>
/// Resposta padrão para retorno de dados de Offer
/// </summary>
public class OfferResponse
{
public Guid Id { get; set; }
public string Name { get; set; } = string.Empty;
public string Slug { get; set; } = string.Empty;
public ContractType ContractType { get; set; }
public decimal Price { get; set; }
public int VideoQuantity { get; set; }
public int MaxDurationSeconds { get; set; }
public int? ValidityDays { get; set; }
public int LoyaltyMonths { get; set; }
public int DeliveryDays { get; set; }
public Guid? VideoFormatId { get; set; }
public Guid? EditingStyleId { get; set; }
public string? Description { get; set; }
public List<string> Features { get; set; } = new List<string>();
public string? Disclaimer { get; set; }
public string? Badge { get; set; }
public bool IsPublic { get; set; }
public DateTime CreatedAt { get; set; }
public DateTime UpdatedAt { get; set; }

/// <summary>
/// Indica se a oferta pode ser deletada permanentemente (sem contratos vinculados)
/// </summary>
public bool CanDeletePermanently { get; set; }
}
