using Media8.Application.DTOs.Profiles;
using Media8.Domain.Entities;

namespace Media8.Application.Interfaces;

/// <summary>
/// Serviço para gerenciamento de perfis de edição
/// </summary>
public interface IEditingProfileService
{
    /// <summary>
    /// Busca um perfil de edição por ID
    /// </summary>
    Task<EditingProfile?> GetByIdAsync(Guid id);

    /// <summary>
    /// Busca todos os perfis de edição de um usuário
    /// </summary>
    /// <param name="userId">ID do usuário</param>
    /// <param name="onlyActive">Se true, retorna apenas perfis ativos (padrão). Se false, retorna todos.</param>
    Task<List<EditingProfile>> GetByUserIdAsync(Guid userId, bool onlyActive = true);

    /// <summary>
    /// Cria um novo perfil de edição
    /// </summary>
    Task<EditingProfile> CreateAsync(Guid userId, CreateEditingProfileRequest request);

    /// <summary>
    /// Atualiza um perfil de edição existente
    /// </summary>
    Task<EditingProfile> UpdateAsync(Guid id, UpdateEditingProfileRequest request);

    /// <summary>
    /// Arquiva um perfil de edição (IsActive = false)
    /// </summary>
    Task ArchiveAsync(Guid id);

    /// <summary>
    /// Restaura um perfil de edição arquivado (IsActive = true)
    /// </summary>
    Task RestoreAsync(Guid id);

    /// <summary>
    /// Exclui permanentemente um perfil de edição (apenas se estiver inativo e não estiver em uso)
    /// </summary>
    Task HardDeleteAsync(Guid id);
}
