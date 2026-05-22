using Media8.Application.DTOs.Profiles;
using Media8.Application.Interfaces;
using Media8.Domain.Entities;

namespace Media8.Application.Services;

/// <summary>
/// Implementação do serviço de perfis de identidade visual
/// </summary>
public class VisualIdentityProfileService : IVisualIdentityProfileService
{
    private readonly IRepository<VisualIdentityProfile> _repository;

    public VisualIdentityProfileService(IRepository<VisualIdentityProfile> repository)
    {
        _repository = repository;
    }

    public async Task<VisualIdentityProfile?> GetByIdAsync(Guid id)
    {
        var profiles = await _repository.FindAsync(p => p.Id == id);
        return profiles.FirstOrDefault();
    }

    public async Task<List<VisualIdentityProfile>> GetByUserIdAsync(Guid userId)
    {
        var profiles = await _repository.FindAsync(p => p.UserId == userId);
        return profiles.ToList();
    }

    public async Task<VisualIdentityProfile> CreateAsync(Guid userId, CreateVisualIdentityProfileRequest request)
    {
        var profile = new VisualIdentityProfile
        {
            UserId = userId,
            Name = request.Name,
            SocialHandles = request.SocialHandles,
            BrandColors = request.BrandColors,
            BrandFonts = request.BrandFonts,
            TargetAudience = request.TargetAudience,
            BrandAssetsUrl = request.BrandAssetsUrl,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _repository.AddAsync(profile);
        return profile;
    }

    public async Task<VisualIdentityProfile> UpdateAsync(Guid id, UpdateVisualIdentityProfileRequest request)
    {
        var profiles = await _repository.FindAsync(p => p.Id == id);
        var profile = profiles.FirstOrDefault() 
            ?? throw new KeyNotFoundException($"VisualIdentityProfile with ID {id} not found.");

        profile.Name = request.Name;
        profile.SocialHandles = request.SocialHandles;
        profile.BrandColors = request.BrandColors;
        profile.BrandFonts = request.BrandFonts;
        profile.TargetAudience = request.TargetAudience;
        profile.BrandAssetsUrl = request.BrandAssetsUrl;
        profile.UpdatedAt = DateTime.UtcNow;

        await _repository.UpdateAsync(profile);
        return profile;
    }

    public async Task DeleteAsync(Guid id)
    {
        var profiles = await _repository.FindAsync(p => p.Id == id);
        var profile = profiles.FirstOrDefault() 
            ?? throw new KeyNotFoundException($"VisualIdentityProfile with ID {id} not found.");

        await _repository.DeleteAsync(id);
    }
}
