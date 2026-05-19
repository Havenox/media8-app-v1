using Media8.Domain.Entities;

namespace Media8.Application.Interfaces;

public interface IServiceBalanceService
{
    /// <summary>
    /// Consome saldo de um formato de vídeo específico para o usuário
    /// </summary>
    Task<bool> ConsumeAsync(Guid userId, Guid videoFormatId, int quantity = 1);
}
