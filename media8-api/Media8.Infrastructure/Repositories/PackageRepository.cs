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

    public async Task<(IEnumerable<Package> Packages, int TotalCount)> GetPagedAsync(string? search, int page, int pageSize, bool? isPublic = null)
    {
        var query = _dbSet.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            search = search.Trim().ToLower();
            query = query.Where(p => p.Name.ToLower().Contains(search) || (p.Description != null && p.Description.ToLower().Contains(search)));
        }

        if (isPublic.HasValue)
        {
            query = query.Where(p => p.IsPublic == isPublic.Value);
        }

        var total = await query.CountAsync();

        var packages = await query
            .OrderBy(p => p.Name)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return (packages, total);
    }


}
