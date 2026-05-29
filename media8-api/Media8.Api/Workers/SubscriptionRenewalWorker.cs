using Media8.Application.Interfaces;
using Media8.Domain.Enums;
using Media8.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Media8.Api.Workers;

/// <summary>
/// Worker hospedado em segundo plano para processamento automático de renovações de ciclo de assinaturas.
/// Executa a cada 1 hora para assegurar resiliência contra falhas do servidor, atrasos ou quedas de conexão.
/// </summary>
public class SubscriptionRenewalWorker : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<SubscriptionRenewalWorker> _logger;

    public SubscriptionRenewalWorker(
        IServiceProvider serviceProvider,
        ILogger<SubscriptionRenewalWorker> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("🔄 Subscription Renewal Worker iniciado com sucesso.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                _logger.LogInformation("🔍 Buscando assinaturas expiradas elegíveis para renovação...");
                await RenewExpiredSubscriptionsAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Erro durante a execução do ciclo do Subscription Renewal Worker.");
            }

            // Executa a cada 1 hora
            await Task.Delay(TimeSpan.FromHours(1), stoppingToken);
        }
    }

    private async Task RenewExpiredSubscriptionsAsync(CancellationToken stoppingToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var balanceService = scope.ServiceProvider.GetRequiredService<IServiceBalanceService>();

        var now = DateTime.UtcNow;

        // Filtra apenas assinaturas ativas
        var activeSubscriptions = await context.ClientContracts
            .Include(c => c.ServiceBalanceLots)
            .Where(c => c.SnapshotContractType == ContractType.Assinatura && c.Status == AssignmentStatus.Active)
            .ToListAsync(stoppingToken);

        int processedCount = 0;
        int renewedCount = 0;

        foreach (var contract in activeSubscriptions)
        {
            if (stoppingToken.IsCancellationRequested) break;

            // Busca o lote mais recente baseado em data de expiração
            var latestLot = contract.ServiceBalanceLots
                .OrderByDescending(l => l.ExpiresAt ?? DateTime.MinValue)
                .FirstOrDefault();

            // Se o último lote existe e já expirou
            if (latestLot != null && latestLot.ExpiresAt.HasValue && latestLot.ExpiresAt.Value <= now)
            {
                processedCount++;
                try
                {
                    _logger.LogInformation("⏳ Contrato {ContractId} do Cliente {ClientId} possui lote atual expirado ({ExpiresAt}). Iniciando tentativa de renovação...", 
                        contract.Id, contract.ClientId, latestLot.ExpiresAt.Value.ToString("yyyy-MM-dd HH:mm:ss"));

                    // Executa a renovação automática (isManualAdminAction = false)
                    var renewed = await balanceService.RenewSubscriptionCycleAsync(contract.Id, isManualAdminAction: false);
                    if (renewed)
                    {
                        renewedCount++;
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "❌ Falha ao tentar renovar contrato {ContractId}.", contract.Id);
                }
            }
        }

        if (processedCount > 0)
        {
            _logger.LogInformation("✅ Ciclo de renovação finalizado. Lotes expirados processados: {ProcessedCount} | Renovados com sucesso: {RenewedCount}.", 
                processedCount, renewedCount);
        }
        else
        {
            _logger.LogInformation("💤 Nenhuma assinatura elegível para renovação neste ciclo.");
        }
    }
}
