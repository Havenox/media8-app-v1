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

public async Task<bool> ConsumeAsync(Guid userId, Guid videoFormatId, int quantity = 1)
{
// 1. Fetch available lots for this user and video format
var activeLots = await _balanceRepository.FindAsync(b =>
b.UserId == userId &&
b.VideoFormatId == videoFormatId &&
b.RemainingQuantity > 0 &&
(b.ExpiresAt == null || b.ExpiresAt > DateTime.UtcNow)
);

// 2. Calculate total available
var totalAvailable = activeLots.Sum(l => l.RemainingQuantity);
if (totalAvailable < quantity)
{
return false; // Insufficient balance
}

// 3. Sort by expiration (FIFO)
// Null expiresAt (unlimited/permanent) should be used LAST
var sortedLots = activeLots
.OrderBy(l => l.ExpiresAt.HasValue ? l.ExpiresAt.Value : DateTime.MaxValue)
.ToList();

// 4. Consume
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

public async Task ProvisionContractBalanceAsync(ClientContract contract, Offer offer)
{
// Calcula data de expiração com base no ValidityDays da oferta
DateTime? expiresAt = null;
if (offer.ValidityDays.HasValue && offer.ValidityDays > 0)
{
expiresAt = contract.ActivatedAt.AddDays(offer.ValidityDays.Value);
}

// Criar lote de saldo de serviço para cada formato de vídeo da oferta
// Se a oferta tiver VideoFormatId, usa-o; caso contrário, cria saldo genérico
var videoFormatId = offer.VideoFormatId ?? Guid.Empty;

// Se não houver VideoFormatId, não cria saldo (caso edge case)
if (videoFormatId == Guid.Empty)
{
// Log de aviso para auditoria
_logger.LogWarning(
"⚠️  PROVISIONAMENTO PULADO: Contrato {ContractId} do cliente {ClientId} sem VideoFormatId. Oferta: {OfferName} (ID: {OfferId}). Verifique se o frontend está enviando o formato selecionado.",
contract.Id,
contract.ClientId,
offer.Name,
offer.Id
);

// Tenta obter o primeiro formato da oferta se houver relacionamento
// Por enquanto, não cria saldo se não houver VideoFormatId
return;
}

var balanceLot = new ServiceBalanceLot
{
UserId = contract.ClientId,
VideoFormatId = videoFormatId,
Quantity = offer.VideoQuantity,
RemainingQuantity = offer.VideoQuantity,
PurchasedAt = contract.ActivatedAt,
ExpiresAt = expiresAt,
Source = LotSource.Purchase,
AssignmentId = contract.Id,
Contract = contract,
CreatedAt = DateTime.UtcNow,
UpdatedAt = DateTime.UtcNow
};

await _balanceRepository.AddAsync(balanceLot);
}
}
