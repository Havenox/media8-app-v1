using Media8.Domain.Entities;
using Media8.Domain.Enums;

namespace Media8.Application.Interfaces;

public interface IPackageRepository : IRepository<Package>
{
    Task<Package?> GetBySlugAsync(string slug);
    Task<IEnumerable<Package>> GetByCategoryAsync(PackageCategory category);
    Task<(IEnumerable<Package> Packages, int TotalCount)> GetPagedAsync(string? search, int page, int pageSize, bool? isPublic = null);

}
