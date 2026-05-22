using Media8.Application.DTOs.Profiles;
using Media8.Application.Interfaces;
using Media8.Domain.Entities;

namespace Media8.Application.Services;

/// <summary>
/// Implementação do serviço de perfis de edição
/// </summary>
public class EditingProfileService : IEditingProfileService
{
    private readonly IRepository<EditingProfile> _repository;

    public EditingProfileService(IRepository<EditingProfile> repository)
    {
        _repository = repository;
    }

    public async Task<EditingProfile?> GetByIdAsync(Guid id)
    {
        var profiles = await _repository.FindAsync(p => p.Id == id);
        return profiles.FirstOrDefault();
    }

    public async Task<List<EditingProfile>> GetByUserIdAsync(Guid userId)
    {
        var profiles = await _repository.FindAsync(p => p.UserId == userId);
        return profiles.ToList();
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

    public async Task DeleteAsync(Guid id)
    {
        var profiles = await _repository.FindAsync(p => p.Id == id);
        var profile = profiles.FirstOrDefault() 
            ?? throw new KeyNotFoundException($"EditingProfile with ID {id} not found.");

        await _repository.DeleteAsync(id);
    }
}
