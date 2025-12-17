using Media8.Domain.Entities;

namespace Media8.Application.Interfaces;

public interface IServiceBalanceRepository : IRepository<ServiceBalanceLot>
{
    Task<(IEnumerable<ServiceBalanceLot> Items, int TotalCount)> GetPagedByUserIdAsync(
        Guid userId, 
        int page, 
        int pageSize, 
        string? status);
}
