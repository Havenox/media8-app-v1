using Media8.Application.Interfaces;
using Media8.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Threading.Tasks;

namespace Media8.Application.Services;

/// <summary>
/// Serviço de geração atômica e idempotente de identificadores sequenciais amigáveis por cliente.
/// </summary>
public class SequenceGeneratorService : ISequenceGeneratorService
{
    private readonly IRepository<ClientSequence> _sequenceRepository;
    private readonly ILogger<SequenceGeneratorService> _logger;

    public SequenceGeneratorService(
        IRepository<ClientSequence> sequenceRepository,
        ILogger<SequenceGeneratorService> logger)
    {
        _sequenceRepository = sequenceRepository;
        _logger = logger;
    }

    /// <summary>
    /// Obtém o próximo número sequencial de forma atômica utilizando transação de banco de dados.
    /// </summary>
    public async Task<int> GetNextSequenceAsync(Guid clientId, string entityType)
    {
        if (clientId == Guid.Empty)
        {
            _logger.LogWarning("⚠️ Geração de sequência ignorada: ClientId vazio para Entidade {EntityType}", entityType);
            return 0;
        }

        using var transaction = await _sequenceRepository.BeginTransactionAsync();
        try
        {
            // Busca o registro atual na tabela de contadores
            var sequence = await _sequenceRepository.Query<ClientSequence>()
                .FirstOrDefaultAsync(s => s.ClientId == clientId && s.EntityType == entityType);

            if (sequence == null)
            {
                // Se não existir, cria o contador com o valor inicial 1
                sequence = new ClientSequence
                {
                    Id = Guid.NewGuid(),
                    ClientId = clientId,
                    EntityType = entityType,
                    LastValue = 1,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                await _sequenceRepository.AddAsync(sequence);
                await _sequenceRepository.SaveChangesAsync();
                await transaction.CommitAsync();
                
                _logger.LogInformation("🎫 Nova sequência criada para Cliente {ClientId} e Entidade {EntityType}: Valor inicial 1", clientId, entityType);
                return 1;
            }

            // Se já existir, incrementa atomicamente
            sequence.LastValue += 1;
            sequence.UpdatedAt = DateTime.UtcNow;
            
            await _sequenceRepository.UpdateAsync(sequence);
            await _sequenceRepository.SaveChangesAsync();
            await transaction.CommitAsync();

            _logger.LogInformation("🎫 Sequência incrementada para Cliente {ClientId} e Entidade {EntityType}: Novo valor {Value}", clientId, entityType, sequence.LastValue);
            return sequence.LastValue;
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            _logger.LogError(ex, "❌ Erro ao obter próximo número sequencial para Cliente {ClientId} e Entidade {EntityType}", clientId, entityType);
            throw;
        }
    }
}
