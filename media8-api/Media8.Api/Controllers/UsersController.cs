using Media8.Application.DTOs.Auth;
using Media8.Application.Interfaces;
using Media8.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Media8.Application.DTOs.Users;
using System.Security.Claims;
using System.Text.Json;
using Media8.Application.DTOs.Services;

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

    public UsersController(IUserRepository userRepository, IRepository<ServiceBalanceLot> balanceRepository, IRepository<Profile> profileRepository, IServiceBalanceService serviceBalanceService)
    {
        _userRepository = userRepository;
        _balanceRepository = balanceRepository;
        _profileRepository = profileRepository;
        _serviceBalanceService = serviceBalanceService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<UserDto>>> GetAll([FromQuery] string? role)
    {
        var users = await _userRepository.GetAllWithProfilesAsync();

        if (!string.IsNullOrEmpty(role))
        {
            // Simple filtering in memory for now, or move to Repository
            users = users.Where(u => u.Roles.Any(r => r.Role.ToString().Equals(role, StringComparison.OrdinalIgnoreCase)));
        }

        var dtos = users.Select(MapToDto);
        return Ok(dtos);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<UserDto>> GetById(Guid id)
    {
        var user = await _userRepository.GetByIdWithProfileAsync(id);
        if (user == null) return NotFound();

        return Ok(MapToDto(user));
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

        // Ideally returns the new balance, but for now just success
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
                // If simple string or failure, maybe store as string or ignore
                profile.Preferences = request.Preferences.ToString();
            }
        }
        
        profile.UpdatedAt = DateTime.UtcNow;

        await _profileRepository.UpdateAsync(profile);

        return Ok(MapToDto(user));
    }

    private static UserDto MapToDto(User user)
    {
        return new UserDto
        {
            Id = user.Id,
            Email = user.Email,
            Name = user.Profile?.Name ?? "Unknown",
            Bio = user.Profile?.Bio ?? "",
            Phone = user.Profile?.Phone ?? "",
            Preferences = user.Profile?.Preferences ?? "",
            AvatarUrl = user.Profile?.AvatarUrl,
            Role = user.Roles.FirstOrDefault()?.Role.ToString() ?? "Client",
            Roles = user.Roles.Select(r => r.Role.ToString()).ToList()
        };
    }
}
