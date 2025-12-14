using Media8.Domain.Entities;
using Media8.Domain.Enums;

namespace Media8.Application.Interfaces;

public interface IPackageRepository : IRepository<Package>
{
    Task<Package?> GetBySlugAsync(string slug);
    Task<IEnumerable<Package>> GetByCategoryAsync(PackageCategory category);

}
