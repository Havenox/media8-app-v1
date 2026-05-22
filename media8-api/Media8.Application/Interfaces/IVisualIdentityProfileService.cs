using Media8.Application.DTOs.Profiles;
using Media8.Domain.Entities;

namespace Media8.Application.Interfaces;

/// <summary>
/// Serviço para gerenciamento de perfis de identidade visual
/// </summary>
public interface IVisualIdentityProfileService
{
    /// <summary>
    /// Busca um perfil de identidade visual por ID
    /// </summary>
    Task<VisualIdentityProfile?> GetByIdAsync(Guid id);

    /// <summary>
    /// Busca todos os perfis de identidade visual de um usuário
    /// </summary>
    Task<List<VisualIdentityProfile>> GetByUserIdAsync(Guid userId);

    /// <summary>
    /// Cria um novo perfil de identidade visual
    /// </summary>
    Task<VisualIdentityProfile> CreateAsync(Guid userId, CreateVisualIdentityProfileRequest request);

    /// <summary>
    /// Atualiza um perfil de identidade visual existente
    /// </summary>
    Task<VisualIdentityProfile> UpdateAsync(Guid id, UpdateVisualIdentityProfileRequest request);

    /// <summary>
    /// Exclui um perfil de identidade visual
    /// </summary>
    Task DeleteAsync(Guid id);
}
