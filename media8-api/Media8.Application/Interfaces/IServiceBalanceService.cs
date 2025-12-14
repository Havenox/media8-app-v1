using Media8.Domain.Entities;
using Media8.Domain.Enums;

namespace Media8.Application.Interfaces;

public interface IServiceBalanceService
{
    Task<bool> ConsumeAsync(Guid userId, ServiceType serviceType, int quantity = 1);
}
