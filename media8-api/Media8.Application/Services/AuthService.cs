using Media8.Application.DTOs.Auth;
using Media8.Application.Interfaces;
using Media8.Domain.Entities;
using Media8.Domain.Enums;

namespace Media8.Application.Services;

public class AuthService : IAuthService
{
    private readonly IRepository<User> _userRepository;
    private readonly IRepository<UserRole> _userRoleRepository;
    private readonly IRepository<Profile> _profileRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtProvider _jwtProvider;

    public AuthService(
        IRepository<User> userRepository,
        IRepository<UserRole> userRoleRepository,
        IRepository<Profile> profileRepository,
        IPasswordHasher passwordHasher,
        IJwtProvider jwtProvider)
    {
        _userRepository = userRepository;
        _userRoleRepository = userRoleRepository;
        _profileRepository = profileRepository;
        _passwordHasher = passwordHasher;
        _jwtProvider = jwtProvider;
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request)
    {
        var users = await _userRepository.FindAsync(u => u.Email == request.Email);
        var user = users.FirstOrDefault();

        if (user == null)
        {
            throw new Exception("Invalid credentials");
        }

        bool verified = _passwordHasher.Verify(request.Password, user.PasswordHash);
        if (!verified)
        {
            throw new Exception("Invalid credentials");
        }

        // Load roles and profile (Assuming generic repository doesn't do eager loading by default, might need modification or separate query)
        // For MVP, we assume lazy loading or we fetch separate
        var roles = await _userRoleRepository.FindAsync(r => r.UserId == user.Id);
        user.Roles = roles.ToList();
        
        var profiles = await _profileRepository.FindAsync(p => p.UserId == user.Id);
        user.Profile = profiles.FirstOrDefault();

        var token = _jwtProvider.Generate(user);

        return new AuthResponse
        {
            Token = token,
            User = new UserDto
            {
                Id = user.Id,
                Email = user.Email,
                Name = user.Profile?.Name ?? "User",
                AvatarUrl = user.Profile?.AvatarUrl,
                Role = user.Roles.FirstOrDefault()?.Role.ToString() ?? "Client",
                Roles = user.Roles.Select(r => r.Role.ToString()).ToList()
            }
        };
    }

    public async Task<AuthResponse> RegisterAsync(RegisterRequest request)
    {
        var existing = await _userRepository.FindAsync(u => u.Email == request.Email);
        if (existing.Any())
        {
            throw new Exception("Email already exists");
        }

        var existingPhone = await _profileRepository.FindAsync(p => p.Phone == request.Phone);
        if (existingPhone.Any())
        {
            throw new Exception("Phone already exists");
        }

        var user = new User
        {
            Email = request.Email,
            PasswordHash = _passwordHasher.Hash(request.Password)
        };

        await _userRepository.AddAsync(user);

        // Add Profile
        var profile = new Profile
        {
            UserId = user.Id,
            Name = request.Name,
            Phone = request.Phone
        };
        await _profileRepository.AddAsync(profile);
        user.Profile = profile;

        // Add Default Role
        var role = new UserRole
        {
            UserId = user.Id,
            Role = AppRole.Client
        };
        await _userRoleRepository.AddAsync(role);
        user.Roles.Add(role);

        var token = _jwtProvider.Generate(user);

        return new AuthResponse
        {
            Token = token,
            User = new UserDto
            {
                Id = user.Id,
                Email = user.Email,
                Name = profile.Name,
                AvatarUrl = null,
                Role = role.Role.ToString(),
                Roles = new List<string> { role.Role.ToString() }
            }
        };
    }

    public async Task ChangePasswordAsync(Guid userId, ChangePasswordRequest request)
    {
        if (request.NewPassword != request.ConfirmNewPassword)
        {
            throw new Exception("New passwords do not match");
        }

        var user = await _userRepository.GetByIdAsync(userId);
        if (user == null)
        {
            throw new Exception("User not found");
        }

        bool verified = _passwordHasher.Verify(request.CurrentPassword, user.PasswordHash);
        if (!verified)
        {
            throw new Exception("Invalid current password");
        }

        user.PasswordHash = _passwordHasher.Hash(request.NewPassword);
        user.UpdatedAt = DateTime.UtcNow;

        await _userRepository.UpdateAsync(user);
    }
}
