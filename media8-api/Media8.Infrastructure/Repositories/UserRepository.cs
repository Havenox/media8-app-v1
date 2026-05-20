using Media8.Application.Interfaces;
using Media8.Domain.Entities;
using Media8.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Media8.Infrastructure.Repositories;

public class UserRepository : Repository<User>, IUserRepository
{
    public UserRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<User>> GetAllWithProfilesAsync()
    {
        return await _dbSet
            .Include(u => u.Profile)
            .Include(u => u.Roles)
            .Include(u => u.Contracts)
            .ThenInclude(c => c.Offer)
            .ToListAsync();
    }

    public async Task<User?> GetByIdWithProfileAsync(Guid id)
    {
        return await _dbSet
            .Include(u => u.Profile)
            .Include(u => u.Roles)
            .FirstOrDefaultAsync(u => u.Id == id);
    }

    public async Task<User?> GetByEmailAsync(string email)
    {
        return await _dbSet
             .Include(u => u.Profile)
             .Include(u => u.Roles)
             .FirstOrDefaultAsync(u => u.Email == email);
    }

    public async Task<(IEnumerable<User> Users, int TotalCount)> GetPagedAsync(string? search, string? role, int page, int pageSize)
    {
        var query = _dbSet
            .Include(u => u.Profile)
            .Include(u => u.Roles)
            .Include(u => u.Contracts)
            .ThenInclude(c => c.Offer)
            .AsNoTracking()
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            search = search.Trim().ToLower();
            query = query.Where(u => u.Email.ToLower().Contains(search) || (u.Profile != null && u.Profile.Name.ToLower().Contains(search)));
        }

        if (!string.IsNullOrWhiteSpace(role) && Enum.TryParse<Media8.Domain.Enums.AppRole>(role, true, out var roleEnum))
        {
            query = query.Where(u => u.Roles.Any(r => r.Role == roleEnum));
        }

        var total = await query.CountAsync();

        var users = await query
            .OrderBy(u => u.Profile.Name ?? u.Email)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return (users, total);
    }
}
