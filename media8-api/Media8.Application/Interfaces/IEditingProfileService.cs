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
    Task<List<EditingProfile>> GetByUserIdAsync(Guid userId);

    /// <summary>
    /// Cria um novo perfil de edição
    /// </summary>
    Task<EditingProfile> CreateAsync(Guid userId, CreateEditingProfileRequest request);

    /// <summary>
    /// Atualiza um perfil de edição existente
    /// </summary>
    Task<EditingProfile> UpdateAsync(Guid id, UpdateEditingProfileRequest request);

    /// <summary>
    /// Exclui um perfil de edição
    /// </summary>
    Task DeleteAsync(Guid id);
}
