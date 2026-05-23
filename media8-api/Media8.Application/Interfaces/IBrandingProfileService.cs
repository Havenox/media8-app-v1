using Media8.Application.DTOs.Profiles;
using Media8.Domain.Entities;

namespace Media8.Application.Interfaces;

/// <summary>
/// Serviço para gerenciamento de perfis de branding
/// </summary>
public interface IBrandingProfileService
{
    /// <summary>
    /// Busca um perfil de branding por ID
    /// </summary>
    Task<BrandingProfile?> GetByIdAsync(Guid id);

    /// <summary>
    /// Busca todos os perfis de branding de um usuário
    /// </summary>
    /// <param name="userId">ID do usuário</param>
    /// <param name="onlyActive">Se true, retorna apenas perfis ativos (padrão). Se false, retorna todos.</param>
    Task<List<BrandingProfile>> GetByUserIdAsync(Guid userId, bool onlyActive = true);

    /// <summary>
    /// Cria um novo perfil de branding
    /// </summary>
    Task<BrandingProfile> CreateAsync(Guid userId, CreateBrandingProfileRequest request);

    /// <summary>
    /// Atualiza um perfil de branding existente
    /// </summary>
    Task<BrandingProfile> UpdateAsync(Guid id, UpdateBrandingProfileRequest request);

    /// <summary>
    /// Arquiva um perfil de branding (IsActive = false)
    /// </summary>
    Task ArchiveAsync(Guid id);

    /// <summary>
    /// Restaura um perfil de branding arquivado (IsActive = true)
    /// </summary>
    Task RestoreAsync(Guid id);

    /// <summary>
    /// Exclui permanentemente um perfil de branding (apenas se estiver inativo e não estiver em uso)
    /// </summary>
    Task HardDeleteAsync(Guid id);
}
