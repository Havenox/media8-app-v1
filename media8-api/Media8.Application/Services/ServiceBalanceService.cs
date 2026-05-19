using Media8.Application.Interfaces;
using Media8.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Media8.Application.Services;

public class ServiceBalanceService : IServiceBalanceService
{
    private readonly IRepository<ServiceBalanceLot> _balanceRepository;

    public ServiceBalanceService(IRepository<ServiceBalanceLot> balanceRepository)
    {
        _balanceRepository = balanceRepository;
    }

    public async Task<bool> ConsumeAsync(Guid userId, Guid videoFormatId, int quantity = 1)
    {
        // 1. Fetch available lots for this user and video format
        var activeLots = await _balanceRepository.FindAsync(b =>
            b.UserId == userId &&
            b.VideoFormatId == videoFormatId &&
            b.RemainingQuantity > 0 &&
            (b.ExpiresAt == null || b.ExpiresAt > DateTime.UtcNow)
        );

        // 2. Calculate total available
        var totalAvailable = activeLots.Sum(l => l.RemainingQuantity);
        if (totalAvailable < quantity)
        {
            return false; // Insufficient balance
        }

        // 3. Sort by expiration (FIFO)
        // Null expiresAt (unlimited/permanent) should be used LAST
        var sortedLots = activeLots
            .OrderBy(l => l.ExpiresAt.HasValue ? l.ExpiresAt.Value : DateTime.MaxValue)
            .ToList();

        // 4. Consume
        int remainingToConsume = quantity;
        foreach (var lot in sortedLots)
        {
            if (remainingToConsume <= 0) break;

            int toTake = Math.Min(lot.RemainingQuantity, remainingToConsume);
            lot.RemainingQuantity -= toTake;
            remainingToConsume -= toTake;

            await _balanceRepository.UpdateAsync(lot);
        }

        return remainingToConsume == 0;
    }
}
