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
    private readonly ISequenceGeneratorService _sequenceGeneratorService;
    private readonly ILogger<ServiceBalanceService> _logger;

    public ServiceBalanceService(
        IRepository<ServiceBalanceLot> balanceRepository,
        IRepository<ClientContract> contractRepository,
        IRepository<Invoice> invoiceRepository,
        ISettingsService settingsService,
        ISequenceGeneratorService sequenceGeneratorService,
        ILogger<ServiceBalanceService> logger)
    {
        _balanceRepository = balanceRepository;
        _contractRepository = contractRepository;
        _invoiceRepository = invoiceRepository;
        _settingsService = settingsService;
        _sequenceGeneratorService = sequenceGeneratorService;
        _logger = logger;
    }

    /// <summary>
    /// Consome saldo do usuário baseado no contrato (sem FK para VideoFormat)
    /// </summary>
    public async Task<bool> ConsumeAsync(Guid userId, Guid contractId, int quantity = 1)
    {
        // 1. Busca lotes disponíveis para este usuário e contrato
        var activeLots = await _balanceRepository.Query<ServiceBalanceLot>()
            .Include(b => b.Invoice)
            .Where(b =>
                b.UserId == userId &&
                b.ContractId == contractId &&
                b.RemainingQuantity > 0 &&
                (b.ExpiresAt == null || b.ExpiresAt > DateTime.UtcNow) &&
                (b.InvoiceId == null || b.Invoice.Status == InvoiceStatus.Paid)
            )
            .ToListAsync();

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

        // Cria Fatura Inicial (Mês 1 ou Contratação) já com Pago
        var isSubscription = contract.SnapshotContractType == ContractType.Assinatura;
        var description = isSubscription 
            ? $"Assinatura - {contract.SnapshotOfferName} - Mês 1"
            : $"Contratação - {contract.SnapshotOfferName}";

        var invoice = new Invoice
        {
            ClientId = contract.ClientId,
            SequentialId = await _sequenceGeneratorService.GetNextSequenceAsync(contract.ClientId, "Invoice"),
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

        // Cria lote de saldo apontando para a Fatura
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
            InvoiceId = invoice.Id, // Vincula à fatura paga
            UpdatedAt = DateTime.UtcNow
        };

        await _balanceRepository.AddAsync(balanceLot);

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
                SequentialId = await _sequenceGeneratorService.GetNextSequenceAsync(contract.ClientId, "Invoice"),
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

        // 8. Provisiona o lote de saldo (se ainda não existir)
        // Verifica se já existe um lote para este ciclo específico para garantir idempotência estrita
        // Se o número de lotes já corresponder ao ciclo atual, não recriamos o lote
        if (contract.ServiceBalanceLots.Count < nextCycleNumber)
        {
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
                InvoiceId = cycleInvoice.Id, // Vincula à fatura correspondente (seja ela pendente ou paga)
                UpdatedAt = now
            };

            await _balanceRepository.AddAsync(newLot);
            _logger.LogInformation("✅ Lote de saldo provisionado para o ciclo {Cycle} do contrato {ContractId} (Fatura {InvoiceId})", 
                nextCycleNumber, contract.Id, cycleInvoice.Id);
        }
        else
        {
            _logger.LogInformation("ℹ️ Lote de saldo para o ciclo {Cycle} já existe no contrato {ContractId}.", 
                nextCycleNumber, contract.Id);
        }

        // 9. Se a fatura ainda está Pendente e não é ação manual do admin
        if (cycleInvoice.Status == InvoiceStatus.Pending && !isManualAdminAction)
        {
            _logger.LogWarning("⏳ PAGAMENTO PENDENTE: Fatura {InvoiceId} do ciclo {Cycle} do Contrato {ContractId} está Pendente. Saldo bloqueado aguardando conciliação.", 
                cycleInvoice.Id, nextCycleNumber, contract.Id);
            return false;
        }

        // 10. Se a fatura está Paga, a renovação está concluída com sucesso
        if (cycleInvoice.Status == InvoiceStatus.Paid)
        {
            _logger.LogInformation("✅ RENOVAÇÃO CONCLUÍDA: Contrato {ContractId} | Ciclo {Cycle} ativo. Lote expira em {ExpiresAt}", 
                contract.Id, nextCycleNumber, nextExpiresAt.ToString("yyyy-MM-dd HH:mm:ss"));
            return true;
        }

        return false;
    }

    /// <summary>
    /// Pré-gera faturas para assinaturas ativas cujo ciclo atual está próximo do vencimento,
    /// com base no número de dias de antecedência configurado no sistema.
    /// </summary>
    public async Task PreGenerateNextCycleInvoicesAsync()
    {
        // 1. Obter a configuração de dias de antecedência (default: 10)
        var anticipationDays = await _settingsService.GetSettingAsync("BillingAntecipationDays", 10);
        
        var now = DateTime.UtcNow;
        var limitDate = now.AddDays(anticipationDays);

        // 2. Busca todas as assinaturas ativas
        var activeSubscriptions = await _contractRepository.Query<ClientContract>()
            .Include(c => c.ServiceBalanceLots)
            .Where(c => c.SnapshotContractType == ContractType.Assinatura && c.Status == AssignmentStatus.Active)
            .ToListAsync();

        _logger.LogInformation("🔍 Iniciando pré-geração de faturas. Antecedência: {Days} dias. Limite: {LimitDate}. Assinaturas ativas: {Count}", 
            anticipationDays, limitDate.ToString("yyyy-MM-dd HH:mm:ss"), activeSubscriptions.Count);

        int generatedCount = 0;

        foreach (var contract in activeSubscriptions)
        {
            // Busca o lote mais recente baseado em data de expiração
            var latestLot = contract.ServiceBalanceLots
                .OrderByDescending(l => l.ExpiresAt ?? DateTime.MinValue)
                .FirstOrDefault();

            // Se o último lote existe, expira no futuro, mas expira antes de ou igual a limitDate
            if (latestLot != null && latestLot.ExpiresAt.HasValue && latestLot.ExpiresAt.Value > now && latestLot.ExpiresAt.Value <= limitDate)
            {
                // Conta lotes gerados para calcular o número do próximo ciclo
                var generatedLotsCount = contract.ServiceBalanceLots
                    .Count(l => l.Source == LotSource.Subscription || l.Source == LotSource.Purchase);

                // Validação de fidelidade antes de gerar nova fatura
                int totalAllowedMonths = contract.SnapshotWarrantyDays.HasValue && contract.SnapshotWarrantyDays.Value > 0
                    ? (contract.SnapshotWarrantyDays.Value / 30)
                    : -1;

                if (totalAllowedMonths > 0 && generatedLotsCount >= totalAllowedMonths)
                {
                    // Contrato já atingiu ou vai atingir o limite de fidelidade com o lote atual
                    // Não gera nova fatura pois o contrato não será renovado
                    continue;
                }

                int nextCycleNumber = generatedLotsCount + 1;
                DateTime nextDueDate = contract.ActivatedAt.AddMonths(generatedLotsCount);

                // Verifica se já existe uma fatura para o próximo ciclo
                var existingInvoices = await _invoiceRepository.FindAsync(i => 
                    i.ContractId == contract.Id && 
                    i.CycleNumber == nextCycleNumber
                );
                var cycleInvoice = existingInvoices.FirstOrDefault();

                if (cycleInvoice == null)
                {
                    // Cria a fatura do novo ciclo como Pendente (ou Paid se requireManualPayment for falso)
                    var description = $"Assinatura - {contract.SnapshotOfferName} - Mês {nextCycleNumber}";
                    var amount = contract.SnapshotPrice ?? 0;

                    InvoiceStatus status = InvoiceStatus.Pending;
                    DateTime? paidAt = null;
                    string? paymentMethod = null;

                    var requireManualPayment = await _settingsService.GetSettingAsync("RequireManualPaymentConfirmation", false);
                    if (!requireManualPayment)
                    {
                        status = InvoiceStatus.Paid;
                        paidAt = now;
                        paymentMethod = "Automatic";
                    }

                    cycleInvoice = new Invoice
                    {
                        ClientId = contract.ClientId,
                        SequentialId = await _sequenceGeneratorService.GetNextSequenceAsync(contract.ClientId, "Invoice"),
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
                    generatedCount++;
                    
                    _logger.LogInformation("📝 Fatura pré-gerada antecipadamente: {InvoiceId} | Contrato {ContractId} | Ciclo {Cycle} | Status {Status} | Vencimento {DueDate}",
                        cycleInvoice.Id, contract.Id, nextCycleNumber, status, nextDueDate.ToString("yyyy-MM-dd HH:mm:ss"));
                }
            }
        }

        _logger.LogInformation("✅ Faturamento antecipado concluído. Faturas pré-geradas: {Count}", generatedCount);
    }
}

