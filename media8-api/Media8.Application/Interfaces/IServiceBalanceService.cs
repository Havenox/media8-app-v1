using Media8.Domain.Entities;

namespace Media8.Application.Interfaces;

public interface IServiceBalanceService
{
/// <summary>
/// Consome saldo de um formato de vídeo específico para o usuário
/// </summary>
Task<bool> ConsumeAsync(Guid userId, Guid videoFormatId, int quantity = 1);

/// <summary>
/// Provisiona saldos de serviço com base em um ClientContract recém-criado
/// </summary>
Task ProvisionContractBalanceAsync(ClientContract contract, Offer offer);
}
