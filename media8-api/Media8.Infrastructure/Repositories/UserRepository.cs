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
}
