using Media8.Domain.Entities;
using Media8.Domain.Enums;

namespace Media8.Application.Interfaces;

public interface IUserRepository : IRepository<User>
{
  Task<IEnumerable<User>> GetAllWithProfilesAsync();
  Task<User?> GetByIdWithProfileAsync(Guid id);
  Task<User?> GetByEmailAsync(string email);
  Task<(IEnumerable<User> Users, int TotalCount)> GetPagedAsync(string? search, string? role, int page, int pageSize, bool showInactive = false);
}
