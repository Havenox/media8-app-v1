using Media8.Application.DTOs.Profiles;
using Media8.Application.Interfaces;
using Media8.Domain.Common;
using Media8.Domain.Entities;

namespace Media8.Application.Services;

/// <summary>
/// Implementação do serviço de perfis de edição
/// </summary>
public class EditingProfileService : IEditingProfileService
{
    private readonly IRepository<EditingProfile> _repository;
    private readonly IRepository<Order> _orderRepository;

    public EditingProfileService(IRepository<EditingProfile> repository, IRepository<Order> orderRepository)
    {
        _repository = repository;
        _orderRepository = orderRepository;
    }

    public async Task<EditingProfile?> GetByIdAsync(Guid id)
    {
        var profiles = await _repository.FindAsync(p => p.Id == id);
        return profiles.FirstOrDefault();
    }

    public async Task<List<EditingProfile>> GetByUserIdAsync(Guid userId, bool onlyActive = true)
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

    public async Task<EditingProfile> CreateAsync(Guid userId, CreateEditingProfileRequest request)
    {
        var profile = new EditingProfile
        {
            UserId = userId,
            Name = request.Name,
            ReferenceUrl = request.ReferenceUrl,
            CutGuidelines = request.CutGuidelines,
            ThumbnailPreference = request.ThumbnailPreference,
            MusicStyle = request.MusicStyle,
            UseVideoHook = request.UseVideoHook,
            TextHighlightStyle = request.TextHighlightStyle,
            GeneralNotes = request.GeneralNotes,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _repository.AddAsync(profile);
        return profile;
    }

    public async Task<EditingProfile> UpdateAsync(Guid id, UpdateEditingProfileRequest request)
    {
        var profiles = await _repository.FindAsync(p => p.Id == id);
        var profile = profiles.FirstOrDefault() 
            ?? throw new KeyNotFoundException($"EditingProfile with ID {id} not found.");

        profile.Name = request.Name;
        profile.ReferenceUrl = request.ReferenceUrl;
        profile.CutGuidelines = request.CutGuidelines;
        profile.ThumbnailPreference = request.ThumbnailPreference;
        profile.MusicStyle = request.MusicStyle;
        profile.UseVideoHook = request.UseVideoHook;
        profile.TextHighlightStyle = request.TextHighlightStyle;
        profile.GeneralNotes = request.GeneralNotes;
        profile.UpdatedAt = DateTime.UtcNow;

        await _repository.UpdateAsync(profile);
        return profile;
    }

    public async Task ArchiveAsync(Guid id)
    {
        var profiles = await _repository.FindAsync(p => p.Id == id);
        var profile = profiles.FirstOrDefault() 
            ?? throw new KeyNotFoundException($"EditingProfile with ID {id} not found.");

        profile.IsActive = false;
        profile.UpdatedAt = DateTime.UtcNow;

        await _repository.UpdateAsync(profile);
    }

    public async Task RestoreAsync(Guid id)
    {
        var profiles = await _repository.FindAsync(p => p.Id == id);
        var profile = profiles.FirstOrDefault() 
            ?? throw new KeyNotFoundException($"EditingProfile with ID {id} not found.");

        profile.IsActive = true;
        profile.UpdatedAt = DateTime.UtcNow;

        await _repository.UpdateAsync(profile);
    }

    public async Task HardDeleteAsync(Guid id)
    {
        var profiles = await _repository.FindAsync(p => p.Id == id);
        var profile = profiles.FirstOrDefault() 
            ?? throw new KeyNotFoundException($"EditingProfile with ID {id} not found.");

// Validação: perfil deve estar inativo para exclusão física
if (profile.IsActive)
{
    throw new BusinessRuleException(
        "O perfil deve estar arquivado (inativo) antes de ser excluído permanentemente.",
        "PROFILE_MUST_BE_INACTIVE");
}

// Validação: impedir exclusão se estiver vinculado a algum pedido
var ordersWithProfile = await _orderRepository.FindAsync(o => o.EditingProfileId == id);
if (ordersWithProfile.Any())
{
    throw new BusinessRuleException(
        "Este perfil está vinculado a um pedido ativo e não pode ser excluído definitivamente.",
        "PROFILE_IN_USE");
}

await _repository.DeleteAsync(id);
    }
}
