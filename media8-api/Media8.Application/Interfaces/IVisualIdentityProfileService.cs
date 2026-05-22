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
    /// <param name="userId">ID do usuário</param>
    /// <param name="onlyActive">Se true, retorna apenas perfis ativos (padrão). Se false, retorna todos.</param>
    Task<List<VisualIdentityProfile>> GetByUserIdAsync(Guid userId, bool onlyActive = true);

    /// <summary>
    /// Cria um novo perfil de identidade visual
    /// </summary>
    Task<VisualIdentityProfile> CreateAsync(Guid userId, CreateVisualIdentityProfileRequest request);

    /// <summary>
    /// Atualiza um perfil de identidade visual existente
    /// </summary>
    Task<VisualIdentityProfile> UpdateAsync(Guid id, UpdateVisualIdentityProfileRequest request);

    /// <summary>
    /// Arquiva um perfil de identidade visual (IsAtive = false)
    /// </summary>
    Task ArchiveAsync(Guid id);

    /// <summary>
    /// Restaura um perfil de identidade visual arquivado (IsActive = true)
    /// </summary>
    Task RestoreAsync(Guid id);

    /// <summary>
    /// Exclui permanentemente um perfil de identidade visual (apenas se estiver inativo e não estiver em uso)
    /// </summary>
    Task HardDeleteAsync(Guid id);
}
