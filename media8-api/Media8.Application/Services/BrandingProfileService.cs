using Media8.Application.DTOs.Profiles;
using Media8.Application.Interfaces;
using Media8.Domain.Common;
using Media8.Domain.Entities;

namespace Media8.Application.Services;

/// <summary>
/// Implementação do serviço de perfis de branding
/// </summary>
public class BrandingProfileService : IBrandingProfileService
{
    private readonly IRepository<BrandingProfile> _repository;
    private readonly IRepository<Order> _orderRepository;
    private readonly ISequenceGeneratorService _sequenceGeneratorService;

    public BrandingProfileService(
        IRepository<BrandingProfile> repository, 
        IRepository<Order> orderRepository,
        ISequenceGeneratorService sequenceGeneratorService)
    {
        _repository = repository;
        _orderRepository = orderRepository;
        _sequenceGeneratorService = sequenceGeneratorService;
    }

    public async Task<BrandingProfile?> GetByIdAsync(Guid id)
    {
        var profiles = await _repository.FindAsync(p => p.Id == id);
        return profiles.FirstOrDefault();
    }

    public async Task<List<BrandingProfile>> GetByUserIdAsync(Guid userId, bool onlyActive = true)
    {
        if (onlyActive)
        {
            var profiles = await _repository.FindAsync(p => p.UserId == userId && p.IsActive == true);
            return profiles.ToList();
        }
        else
        {
            var profiles = await _repository.FindAsync(p => p.UserId == userId);
            return profiles.ToList();
        }
    }

    public async Task<BrandingProfile> CreateAsync(Guid userId, CreateBrandingProfileRequest request)
    {
        var profile = new BrandingProfile
        {
            UserId = userId,
            SequentialId = await _sequenceGeneratorService.GetNextSequenceAsync(userId, "BrandingProfile"),
            Name = request.Name,
            SocialHandles = request.SocialHandles,
            BrandColors = request.BrandColors,
            BrandFonts = request.BrandFonts,
            TargetAudience = request.TargetAudience,
            BrandAssetsUrl = request.BrandAssetsUrl,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _repository.AddAsync(profile);
        return profile;
    }

    public async Task<BrandingProfile> UpdateAsync(Guid id, UpdateBrandingProfileRequest request)
    {
        var profiles = await _repository.FindAsync(p => p.Id == id);
        var profile = profiles.FirstOrDefault()
        ?? throw new KeyNotFoundException($"BrandingProfile with ID {id} not found.");

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

    public async Task ArchiveAsync(Guid id)
    {
        var profiles = await _repository.FindAsync(p => p.Id == id);
        var profile = profiles.FirstOrDefault()
        ?? throw new KeyNotFoundException($"BrandingProfile with ID {id} not found.");

        profile.IsActive = false;
        profile.UpdatedAt = DateTime.UtcNow;

        await _repository.UpdateAsync(profile);
    }

    public async Task RestoreAsync(Guid id)
    {
        var profiles = await _repository.FindAsync(p => p.Id == id);
        var profile = profiles.FirstOrDefault()
        ?? throw new KeyNotFoundException($"BrandingProfile with ID {id} not found.");

        profile.IsActive = true;
        profile.UpdatedAt = DateTime.UtcNow;

        await _repository.UpdateAsync(profile);
    }

    public async Task HardDeleteAsync(Guid id)
    {
        var profiles = await _repository.FindAsync(p => p.Id == id);
        var profile = profiles.FirstOrDefault()
        ?? throw new KeyNotFoundException($"BrandingProfile with ID {id} not found.");

// Validação: perfil deve estar inativo para exclusão física
if (profile.IsActive)
{
    throw new BusinessRuleException(
        "O perfil deve estar arquivado (inativo) antes de ser excluído permanentemente.",
        "PROFILE_MUST_BE_INACTIVE");
}

// Validação: impedir exclusão se estiver vinculado a algum pedido
var ordersWithProfile = await _orderRepository.FindAsync(o => o.BrandingProfileId == id);
if (ordersWithProfile.Any())
{
    throw new BusinessRuleException(
        "Este perfil está vinculado a um pedido ativo e não pode ser excluído definitivamente.",
        "PROFILE_IN_USE");
}

await _repository.DeleteAsync(id);
    }
}
