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

    /// <summary>
    /// Renova o ciclo mensal de uma assinatura ativa se o lote atual tiver expirado.
    /// Suporta renovação automática (via worker) ou confirmação manual (via admin).
    /// </summary>
    Task<bool> RenewSubscriptionCycleAsync(Guid contractId, bool isManualAdminAction);

    /// <summary>
    /// Pré-gera faturas para assinaturas ativas cujo ciclo atual está próximo do vencimento,
    /// com base no número de dias de antecedência configurado no sistema.
    /// </summary>
    Task PreGenerateNextCycleInvoicesAsync();
}
