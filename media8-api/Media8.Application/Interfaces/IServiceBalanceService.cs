using Media8.Domain.Entities;

namespace Media8.Application.Interfaces;

public interface IServiceBalanceService
{
/// <summary>
/// Consome saldo do usuário baseado no contrato (sem FK para VideoFormat)
/// O lote de saldo é estritamente numérico - a validação técnica é feita via snapshot do contrato
/// </summary>
Task<bool> ConsumeAsync(Guid userId, Guid contractId, int quantity = 1);

/// <summary>
/// Provisiona saldo de serviço baseado em contrato com snapshot
/// Cria lote de saldo APENAS com dados numéricos e ContractId
/// </summary>
Task ProvisionContractBalanceAsync(ClientContract contract, Offer offer);
}
