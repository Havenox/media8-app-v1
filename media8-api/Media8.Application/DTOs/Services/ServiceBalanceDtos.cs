using Media8.Domain.Enums;
using System.ComponentModel.DataAnnotations;

namespace Media8.Application.DTOs.Services;

public class ConsumeServiceRequest
{
    [Required]
    public ServiceType ServiceType { get; set; }

    [Range(1, 100)]
    public int Quantity { get; set; } = 1;
}

public class ConsumeServiceResponse
{
    public bool Success { get; set; }
    public string? Error { get; set; }
    public int RemainingTotal { get; set; }
}
