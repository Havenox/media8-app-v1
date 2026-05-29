using Media8.Application.Interfaces;
using Media8.Domain.Entities;
using Media8.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Media8.Application.Services;

public class ServiceBalanceService : IServiceBalanceService
{
    private readonly IRepository<ServiceBalanceLot> _balanceRepository;
    private readonly IRepository<ClientContract> _contractRepository;
    private readonly IRepository<Invoice> _invoiceRepository;
    private readonly ISettingsService _settingsService;
    private readonly ILogger<ServiceBalanceService> _logger;

    public ServiceBalanceService(
        IRepository<ServiceBalanceLot> balanceRepository,
        IRepository<ClientContract> contractRepository,
        IRepository<Invoice> invoiceRepository,
        ISettingsService settingsService,
        ILogger<ServiceBalanceService> logger)
    {
        _balanceRepository = balanceRepository;
        _contractRepository = contractRepository;
        _invoiceRepository = invoiceRepository;
        _settingsService = settingsService;
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

        // Calcula data de expiração com base no tipo de contrato e validade
        DateTime? expiresAt = null;
        if (contract.SnapshotContractType == ContractType.Assinatura)
        {
            expiresAt = contract.ActivatedAt.AddMonths(1);
        }
        else if (offer.ValidityDays.HasValue && offer.ValidityDays > 0)
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

        // Cria Fatura Inicial (Mês 1 ou Contratação) já com Pago
        var isSubscription = contract.SnapshotContractType == ContractType.Assinatura;
        var description = isSubscription 
            ? $"Assinatura - {contract.SnapshotOfferName} - Mês 1"
            : $"Contratação - {contract.SnapshotOfferName}";

        var invoice = new Invoice
        {
            ClientId = contract.ClientId,
            ContractId = contract.Id,
            Description = description,
            Amount = contract.SnapshotPrice ?? offer.Price,
            CycleNumber = isSubscription ? 1 : null,
            DueDate = contract.ActivatedAt,
            Status = InvoiceStatus.Paid,
            PaidAt = DateTime.UtcNow,
            PaymentMethod = "Manual",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _invoiceRepository.AddAsync(invoice);

        _logger.LogInformation(
            "✅ Saldo provisionado e fatura inicial criada: Contrato {ContractId} | Cliente {ClientId} | Quantidade {Quantity} | Fatura: {InvoiceId}",
            contract.Id,
            contract.ClientId,
            offer.VideoQuantity,
            invoice.Id
        );
    }

    /// <summary>
    /// Renova o ciclo mensal de uma assinatura ativa se o lote atual tiver expirado.
    /// Suporta renovação automática (via worker) ou confirmação manual (via admin).
    /// </summary>
    public async Task<bool> RenewSubscriptionCycleAsync(Guid contractId, bool isManualAdminAction)
    {
        // 1. Busca o contrato com seus lotes associados
        var contract = await _contractRepository.Query<ClientContract>()
            .Include(c => c.ServiceBalanceLots)
            .FirstOrDefaultAsync(c => c.Id == contractId);

        if (contract == null)
        {
            _logger.LogWarning("⚠️ RENOVAÇÃO ABORTADA: Contrato {ContractId} não encontrado.", contractId);
            return false;
        }

        // 2. Validações básicas de elegibilidade
        if (contract.SnapshotContractType != ContractType.Assinatura)
        {
            _logger.LogWarning("⚠️ RENOVAÇÃO ABORTADA: Contrato {ContractId} não é uma Assinatura. Tipo: {ContractType}", 
                contractId, contract.SnapshotContractType);
            return false;
        }

        if (contract.Status != AssignmentStatus.Active)
        {
            _logger.LogWarning("⚠️ RENOVAÇÃO ABORTADA: Contrato {ContractId} não está com status Ativo. Status: {Status}", 
                contractId, contract.Status);
            return false;
        }

        // 3. Identifica o lote mais recente
        var latestLot = contract.ServiceBalanceLots
            .OrderByDescending(l => l.ExpiresAt ?? DateTime.MinValue)
            .FirstOrDefault();

        if (latestLot == null)
        {
            _logger.LogWarning("⚠️ RENOVAÇÃO ABORTADA: Contrato {ContractId} não possui nenhum lote de saldo inicial provisionado.", contractId);
            return false;
        }

        var now = DateTime.UtcNow;

        // 4. Garante que o lote atual já expirou
        if (latestLot.ExpiresAt.HasValue && latestLot.ExpiresAt.Value > now)
        {
            _logger.LogInformation("ℹ️ RENOVAÇÃO IGNORADA: O lote atual do Contrato {ContractId} ainda é válido até {ExpiresAt}.", 
                contractId, latestLot.ExpiresAt.Value.ToString("yyyy-MM-dd HH:mm:ss"));
            return false;
        }

        // 5. Conta lotes gerados (para validar fidelidade e calcular aniversário do próximo lote)
        var generatedLots = contract.ServiceBalanceLots
            .Where(l => l.Source == LotSource.Subscription || l.Source == LotSource.Purchase)
            .ToList();

        int generatedCount = generatedLots.Count;

        // 6. Validação de Fidelidade (SnapshotWarrantyDays)
        int totalAllowedMonths = contract.SnapshotWarrantyDays.HasValue && contract.SnapshotWarrantyDays.Value > 0
            ? (contract.SnapshotWarrantyDays.Value / 30)
            : -1; // -1 significa sem limite (mensal recorrente contínuo)

        if (totalAllowedMonths > 0 && generatedCount >= totalAllowedMonths)
        {
            _logger.LogInformation("🏁 FIDELIDADE CONCLUÍDA: O Contrato {ContractId} atingiu o limite de fidelidade ({GeneratedCount}/{AllowedCount} meses). Finalizando contrato.", 
                contractId, generatedCount, totalAllowedMonths);

            // Marca o contrato como expirado
            contract.Status = AssignmentStatus.Expired;
            contract.UpdatedAt = now;
            await _contractRepository.UpdateAsync(contract);
            return false;
        }

        // 7. Obter ou Criar a Fatura do Próximo Ciclo (Aniversário mensal calendário)
        int nextCycleNumber = generatedCount + 1;
        DateTime nextExpiresAt = contract.ActivatedAt.AddMonths(nextCycleNumber);
        DateTime nextDueDate = contract.ActivatedAt.AddMonths(generatedCount);

        // Verifica se já existe uma fatura para o próximo ciclo
        var existingInvoices = await _invoiceRepository.FindAsync(i => 
            i.ContractId == contract.Id && 
            i.CycleNumber == nextCycleNumber
        );
        var cycleInvoice = existingInvoices.FirstOrDefault();

        if (cycleInvoice == null)
        {
            // Cria a fatura do novo ciclo
            var description = $"Assinatura - {contract.SnapshotOfferName} - Mês {nextCycleNumber}";
            var amount = contract.SnapshotPrice ?? 0;

            // Define o status inicial da fatura
            InvoiceStatus status = InvoiceStatus.Pending;
            DateTime? paidAt = null;
            string? paymentMethod = null;

            // Se for ação manual do admin ou renovação automática sem switch manual
            var requireManualPayment = await _settingsService.GetSettingAsync("RequireManualPaymentConfirmation", false);
            if (isManualAdminAction || !requireManualPayment)
            {
                status = InvoiceStatus.Paid;
                paidAt = now;
                paymentMethod = isManualAdminAction ? "Manual" : "Automatic";
            }

            cycleInvoice = new Invoice
            {
                ClientId = contract.ClientId,
                ContractId = contract.Id,
                Description = description,
                Amount = amount,
                CycleNumber = nextCycleNumber,
                DueDate = nextDueDate,
                Status = status,
                PaidAt = paidAt,
                PaymentMethod = paymentMethod,
                GatewayInvoiceId = null,
                TransactionId = null,
                CreatedAt = now,
                UpdatedAt = now
            };

            await _invoiceRepository.AddAsync(cycleInvoice);
            _logger.LogInformation("📝 Fatura criada: {InvoiceId} | Contrato {ContractId} | Ciclo {Cycle} | Status {Status}",
                cycleInvoice.Id, contract.Id, nextCycleNumber, status);
        }

        // 8. Se a fatura ainda está Pendente e não é ação manual do admin
        if (cycleInvoice.Status == InvoiceStatus.Pending && !isManualAdminAction)
        {
            _logger.LogWarning("⏳ PAGAMENTO PENDENTE: Fatura {InvoiceId} do ciclo {Cycle} do Contrato {ContractId} está Pendente. Aguardando conciliação.", 
                cycleInvoice.Id, nextCycleNumber, contract.Id);
            return false;
        }

        // 9. Se a fatura está Paga, provisiona o lote de saldo
        if (cycleInvoice.Status == InvoiceStatus.Paid)
        {
            // Verifica se já existe um lote para este ciclo específico para garantir idempotência estrita
            // Se o número de lotes já corresponder ao ciclo atual, abortamos
            if (contract.ServiceBalanceLots.Count >= nextCycleNumber)
            {
                _logger.LogInformation("ℹ️ Lote de saldo para o ciclo {Cycle} já provido anteriormente no contrato {ContractId}.", 
                    nextCycleNumber, contract.Id);
                return true;
            }

            var newLot = new ServiceBalanceLot
            {
                UserId = contract.ClientId,
                ContractId = contract.Id,
                Quantity = contract.SnapshotVideoQuantity ?? 0,
                RemainingQuantity = contract.SnapshotVideoQuantity ?? 0,
                CreatedAt = now,
                ExpiresAt = nextExpiresAt,
                Source = LotSource.Subscription,
                AssignmentId = contract.Id,
                UpdatedAt = now
            };

            await _balanceRepository.AddAsync(newLot);

            _logger.LogInformation("✅ RENOVAÇÃO CONCLUÍDA E SALDO PROVISIONADO: Contrato {ContractId} | Ciclo {Cycle} provido. Novo lote expira em {ExpiresAt}", 
                contract.Id, nextCycleNumber, nextExpiresAt.ToString("yyyy-MM-dd HH:mm:ss"));

            return true;
        }

        return false;
    }
}

