using Media8.Application.Interfaces;
using Media8.Domain.Entities;
using Media8.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Media8.Infrastructure.Repositories;

public class ServiceBalanceRepository : Repository<ServiceBalanceLot>, IServiceBalanceRepository
{
    public ServiceBalanceRepository(ApplicationDbContext context) : base(context)
    {
    }

public async Task<(IEnumerable<ServiceBalanceLot> Items, int TotalCount)> GetPagedByUserIdAsync(
        Guid userId,
        int page,
        int pageSize,
        string? status)
    {
        var query = _dbSet
            .Include(x => x.Contract) // Eager Load ClientContract for Snapshot
            .Where(x => x.UserId == userId);

        if (!string.IsNullOrEmpty(status))
        {
            var now = DateTime.UtcNow;
            if (status.ToLower() == "active")
            {
                // Active = Has remaining quantity AND (No expiry OR Expiry in future)
                query = query.Where(x => 
                    x.RemainingQuantity > 0 && 
                    (!x.ExpiresAt.HasValue || x.ExpiresAt.Value > now));
            }
            else if (status.ToLower() == "expired")
            {
                query = query.Where(x => 
                    x.ExpiresAt.HasValue && x.ExpiresAt.Value <= now);
            }
        }
        
        // Order by Expiry Ascending (Use first what expires first)
        query = query.OrderBy(x => x.ExpiresAt.HasValue) // Put nulls (no expiry) last? Or first? usually last.
            .ThenBy(x => x.ExpiresAt)
            .ThenByDescending(x => x.CreatedAt);

        var total = await query.CountAsync();
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return (items, total);
    }

    public async Task<IEnumerable<ServiceBalanceLot>> GetAvailableBalancesByUserIdAsync(Guid userId)
    {
        var now = DateTime.UtcNow;
        return await _dbSet
            .Include(l => l.Contract)
            .Where(l => l.UserId == userId 
                        && l.RemainingQuantity > 0 
                        && (!l.ExpiresAt.HasValue || l.ExpiresAt.Value > now))
            .ToListAsync();
    }
}
