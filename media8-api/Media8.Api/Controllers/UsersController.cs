using Media8.Application.DTOs.Auth;
using Media8.Application.Interfaces;
using Media8.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Media8.Application.DTOs.Users;
using System.Security.Claims;
using System.Text.Json;
using Media8.Application.DTOs.Services;
using Media8.Domain.Enums;

namespace Media8.Api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly IUserRepository _userRepository;
    private readonly IRepository<ServiceBalanceLot> _balanceRepository;
    private readonly IRepository<Profile> _profileRepository;
    private readonly IServiceBalanceService _serviceBalanceService;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IRepository<UserRole> _userRoleRepository;

    public UsersController(
        IUserRepository userRepository, 
        IRepository<ServiceBalanceLot> balanceRepository, 
        IRepository<Profile> profileRepository, 
        IServiceBalanceService serviceBalanceService,
        IPasswordHasher passwordHasher,
        IRepository<UserRole> userRoleRepository)
    {
        _userRepository = userRepository;
        _balanceRepository = balanceRepository;
        _profileRepository = profileRepository;
        _serviceBalanceService = serviceBalanceService;
        _passwordHasher = passwordHasher;
        _userRoleRepository = userRoleRepository;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<AdminUserDto>>> GetAll(
        [FromQuery] string? role,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        // Note: For true scalability, pagination should be at Repository level (IQueryable).
        // For now, we fetch all (with Eager Loading) and paginate in memory as per constraints.
        var users = await _userRepository.GetAllWithProfilesAsync();

        if (!string.IsNullOrEmpty(role))
        {
            users = users.Where(u => u.Roles.Any(r => r.Role.ToString().Equals(role, StringComparison.OrdinalIgnoreCase)));
        }
        
        // Sorting by Name
        users = users.OrderBy(u => u.Profile?.Name ?? u.Email);

        // Pagination
        var total = users.Count();
        var pagedUsers = users
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(MapToAdminDto);

        Response.Headers.Append("X-Total-Count", total.ToString());
        return Ok(pagedUsers);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<AdminUserDto>> GetById(Guid id)
    {
        var user = await _userRepository.GetByIdWithProfileAsync(id);
        if (user == null) return NotFound();

        return Ok(MapToAdminDto(user));
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<AdminUserDto>> Create([FromBody] CreateUserRequest request)
    {
        if (await _userRepository.GetByEmailAsync(request.Email) != null)
        {
            return Conflict(new { message = "Email already exists" });
        }

        // Validate Role
        if (!Enum.TryParse<AppRole>(request.Role, true, out var roleEnum))
        {
            return BadRequest(new { message = "Invalid Role" });
        }

        // Create User
        var user = new User
        {
            Email = request.Email,
            PasswordHash = _passwordHasher.Hash(request.Password)
        };
        await _userRepository.AddAsync(user);

        // Create Profile
        var profile = new Profile
        {
            UserId = user.Id,
            Name = request.Name,
            Phone = null // Phone optional in create for now
        };
        await _profileRepository.AddAsync(profile);
        user.Profile = profile;

        // Create Role
        var userRole = new UserRole
        {
            UserId = user.Id,
            Role = roleEnum
        };
        await _userRoleRepository.AddAsync(userRole);
        user.Roles.Add(userRole);

        return CreatedAtAction(nameof(GetById), new { id = user.Id }, MapToAdminDto(user));
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<AdminUserDto>> Update(Guid id, [FromBody] AdminUpdateUserRequest request)
    {
        var user = await _userRepository.GetByIdWithProfileAsync(id);
        if (user == null) return NotFound();

        // Update Profile
        if (user.Profile != null)
        {
            user.Profile.Name = request.Name;
            user.Profile.Phone = request.Phone;
            user.Profile.UpdatedAt = DateTime.UtcNow;
            await _profileRepository.UpdateAsync(user.Profile);
        }

        // Update Email (Check duplication if changed) - Skipped for safety in this iteration unless requested
        // user.Email = request.Email; 
        
        // Update Role
        if (Enum.TryParse<AppRole>(request.Role, true, out var newRole))
        {
            var existingRole = user.Roles.FirstOrDefault();
            if (existingRole != null && existingRole.Role != newRole)
            {
                // Remove old role (Physically delete as it's a join table usually, or simple update)
                // Since generic repo might not support complex delete, we update it.
                existingRole.Role = newRole;
                await _userRoleRepository.UpdateAsync(existingRole); // If supported
                // If not supported, we'd need to Delete and Add. Assuming Update works for composite key entity if tracked.
            }
            else if (existingRole == null)
            {
                var role = new UserRole { UserId = user.Id, Role = newRole };
                await _userRoleRepository.AddAsync(role);
            }
        }

        return Ok(MapToAdminDto(user));
    }

    [HttpGet("{userId}/service-balances")]
    public async Task<ActionResult<IEnumerable<ServiceBalanceLot>>> GetServiceBalances(Guid userId)
    {
        var balances = await _balanceRepository.FindAsync(b => b.UserId == userId);
        return Ok(balances);
    }

    [HttpPost("{userId}/service-balances/consume")]
    public async Task<ActionResult<ConsumeServiceResponse>> ConsumeService(Guid userId, [FromBody] ConsumeServiceRequest request)
    {
        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (currentUserId == null || (userId.ToString().ToLower() != currentUserId.ToLower() && !User.IsInRole("Admin")))
        {
            return Unauthorized();
        }

        var success = await _serviceBalanceService.ConsumeAsync(userId, request.ServiceType, request.Quantity);

        if (!success)
        {
            return BadRequest(new ConsumeServiceResponse 
            { 
                Success = false, 
                Error = "NO_BALANCE" 
            });
        }

        return Ok(new ConsumeServiceResponse { Success = true });
    }

    [HttpPut("{id}/profile")]
    public async Task<IActionResult> UpdateProfile(Guid id, [FromBody] UpdateProfileRequest request)
    {
        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (currentUserId == null) return Unauthorized();

        // Security Check: Only allow users to update their own profile
        if (id.ToString().ToLower() != currentUserId.ToLower())
        {
            return Forbid();
        }

        var user = await _userRepository.GetByIdWithProfileAsync(id);
        if (user == null || user.Profile == null) return NotFound();

        var profile = user.Profile;
        profile.Name = request.Name;
        profile.Phone = request.Phone;
        profile.Bio = request.Bio;
        
        if (request.Preferences != null)
        {
            try 
            {
               profile.Preferences = JsonSerializer.Serialize(request.Preferences);
            }
            catch
            {
                profile.Preferences = request.Preferences.ToString();
            }
        }
        
        profile.UpdatedAt = DateTime.UtcNow;
        await _profileRepository.UpdateAsync(profile);

        return Ok(MapToAdminDto(user));
    }

    // Mapping Logic
    private static AdminUserDto MapToAdminDto(User user)
    {
        var dto = new AdminUserDto
        {
            Id = user.Id,
            Email = user.Email,
            Name = user.Profile?.Name ?? "Unknown",
            AvatarUrl = user.Profile?.AvatarUrl,
            Role = user.Roles.FirstOrDefault()?.Role.ToString() ?? "Client",
            Roles = user.Roles.Select(r => r.Role.ToString()).ToList()
        };

        // Map Active Package
        // Logic: Find active assignment (Status = Active)
        // If multiple, pick latest.
        var activeAssignment = user.Assignments?
            .Where(a => a.Status == AssignmentStatus.Active)
            .OrderByDescending(a => a.AssignedAt)
            .FirstOrDefault();

        if (activeAssignment != null && activeAssignment.Package != null)
        {
            var count = user.Assignments?.Count(a => a.Status == AssignmentStatus.Active) ?? 0;
            dto.ActivePackage = new ActivePackageSummary
            {
                Name = activeAssignment.Package.Name,
                VideoQuantity = activeAssignment.Package.VideoQuantity,
                ExpiresAt = activeAssignment.ExpiresAt,
                AdditionalPackagesCount = count > 1 ? count - 1 : 0
            };
        }

        return dto;
    }
}
