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
                .ThenInclude(c => c.Offer)
            .Where(x => x.UserId == userId);

        var now = DateTime.UtcNow;

        if (!string.IsNullOrEmpty(status))
        {
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
            else if (status.ToLower() == "dashboard")
            {
                // Dashboard = Has remaining quantity (both active and expired)
                query = query.Where(x => x.RemainingQuantity > 0);
            }
        }
        
        var allItems = await query.ToListAsync();
        
        IEnumerable<ServiceBalanceLot> sortedItems;
        if (status?.ToLower() == "dashboard")
        {
            // Ordenação do Dashboard:
            // 1. Ativos com prazo (ExpiresAt futuro) -> Menor prazo à frente (Ascendente)
            // 2. Ativos sem validade (ExpiresAt nulo) -> Criados mais recentemente primeiro (Descendente)
            // 3. Expirados (ExpiresAt passado) -> Expirados mais recentemente primeiro (Descendente)
            sortedItems = allItems.OrderBy(x => {
                if (x.ExpiresAt.HasValue && x.ExpiresAt.Value > now) return 1; // Ativo com validade
                if (!x.ExpiresAt.HasValue) return 2; // Ativo sem validade
                return 3; // Expirado com saldo
            })
            .ThenBy(x => {
                if (x.ExpiresAt.HasValue && x.ExpiresAt.Value > now) return x.ExpiresAt.Value.Ticks; // Mais próximo primeiro (Ascendente)
                if (!x.ExpiresAt.HasValue) return -x.CreatedAt.Ticks; // Novo primeiro (Descendente)
                return -x.ExpiresAt.Value.Ticks; // Expirado mais recente primeiro (Descendente)
            });
        }
        else
        {
            // Ordenação padrão para outras telas
            sortedItems = allItems.OrderBy(x => x.ExpiresAt.HasValue)
                .ThenBy(x => x.ExpiresAt)
                .ThenByDescending(x => x.CreatedAt);
        }

        var total = sortedItems.Count();
        var items = sortedItems
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToList();

        return (items, total);
    }
}
