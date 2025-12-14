using Media8.Application.Interfaces;
using Media8.Domain.Entities;
using Media8.Domain.Enums;
using Media8.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Media8.Infrastructure.Repositories;

public class PackageRepository : Repository<Package>, IPackageRepository
{
    public PackageRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<Package?> GetBySlugAsync(string slug)
    {
        return await _dbSet.FirstOrDefaultAsync(p => p.Slug == slug);
    }

    public async Task<IEnumerable<Package>> GetByCategoryAsync(PackageCategory category)
    {
        return await _dbSet.Where(p => p.Category == category).ToListAsync();
    }


}
