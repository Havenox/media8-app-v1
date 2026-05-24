using Media8.Application.Interfaces;
using Media8.Domain.Entities;
using Media8.Domain.Enums;
using Microsoft.Extensions.Logging;

namespace Media8.Application.Services;

public class ServiceBalanceService : IServiceBalanceService
{
private readonly IRepository<ServiceBalanceLot> _balanceRepository;
private readonly ILogger<ServiceBalanceService> _logger;

public ServiceBalanceService(IRepository<ServiceBalanceLot> balanceRepository, ILogger<ServiceBalanceService> logger)
{
_balanceRepository = balanceRepository;
_logger = logger;
}

/// <summary>
/// Consome saldo do usuário baseado no contrato (sem FK para VideoFormat)
/// </summary>
public async Task<bool> ConsumeAsync(Guid userId, Guid contractId, int quantity = 1)
{
// 1. Busca lotes disponíveis para este usuário e contrato
var activeLots = await _balanceRepository.FindAsync(b =>
b.UserId == userId &&
b.ContractId == contractId &&
b.RemainingQuantity > 0 &&
(b.ExpiresAt == null || b.ExpiresAt > DateTime.UtcNow)
);

// 2. Calcula total disponível
var totalAvailable = activeLots.Sum(l => l.RemainingQuantity);
if (totalAvailable < quantity)
{
return false; // Saldo insuficiente
}

// 3. Ordena por expiração (FIFO)
// Null expiresAt (ilimitado/permanente) deve ser usado por último
var sortedLots = activeLots
.OrderBy(l => l.ExpiresAt.HasValue ? l.ExpiresAt.Value : DateTime.MaxValue)
.ToList();

// 4. Consome
int remainingToConsume = quantity;
foreach (var lot in sortedLots)
{
if (remainingToConsume <= 0) break;

int toTake = Math.Min(lot.RemainingQuantity, remainingToConsume);
lot.RemainingQuantity -= toTake;
remainingToConsume -= toTake;

await _balanceRepository.UpdateAsync(lot);
}

return remainingToConsume == 0;
}

/// <summary>
/// Provisiona saldo de serviço baseado em contrato com snapshot
/// Cria lote de saldo APENAS com dados numéricos e ContractId
/// </summary>
public async Task ProvisionContractBalanceAsync(ClientContract contract, Offer offer)
{
// Valida se o contrato possui snapshot técnico completo
if (string.IsNullOrWhiteSpace(contract.SnapshotVideoFormatName))
{
_logger.LogWarning(
"⚠️ PROVISIONAMENTO PULADO: Contrato {ContractId} do cliente {ClientId} sem SnapshotVideoFormatName. Oferta: {OfferName} (ID: {OfferId}).",
contract.Id,
contract.ClientId,
offer.Name,
offer.Id
);
return;
}

// Calcula data de expiração com base no ValidityDays da oferta
DateTime? expiresAt = null;
if (offer.ValidityDays.HasValue && offer.ValidityDays > 0)
{
expiresAt = contract.ActivatedAt.AddDays(offer.ValidityDays.Value);
}

// Cria lote de saldo ESTRITAMENTE NUMÉRICO
// Sem FK para VideoFormatId ou EditingStyleId
var balanceLot = new ServiceBalanceLot
{
UserId = contract.ClientId,
ContractId = contract.Id, // FK obrigatória
Quantity = offer.VideoQuantity,
RemainingQuantity = offer.VideoQuantity,
CreatedAt = DateTime.UtcNow,
ExpiresAt = expiresAt,
Source = LotSource.Purchase,
AssignmentId = contract.Id, // Manter para compatibilidade
UpdatedAt = DateTime.UtcNow
};

await _balanceRepository.AddAsync(balanceLot);

_logger.LogInformation(
"✅ Saldo provisionado: Contrato {ContractId} | Cliente {ClientId} | Quantidade {Quantity} | Expira em {ExpiresAt}",
contract.Id,
contract.ClientId,
offer.VideoQuantity,
expiresAt?.ToString("yyyy-MM-dd") ?? "Nunca"
);
}
}
