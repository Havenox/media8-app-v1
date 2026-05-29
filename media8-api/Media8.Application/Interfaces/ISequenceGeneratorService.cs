using System;
using System.Threading.Tasks;

namespace Media8.Application.Interfaces;

/// <summary>
/// Interface para o serviço gerador de sequências numéricas amigáveis por cliente.
/// </summary>
public interface ISequenceGeneratorService
{
    /// <summary>
    /// Obtém de forma atômica o próximo número sequencial (senha) para um cliente e tipo de entidade.
    /// </summary>
    /// <param name="clientId">Identificador do cliente</param>
    /// <param name="entityType">Tipo da entidade (ex: "Contract", "Order", "Invoice", "BrandingProfile", "EditingProfile")</param>
    /// <returns>O próximo número sequencial (começando em 1)</returns>
    Task<int> GetNextSequenceAsync(Guid clientId, string entityType);
}
