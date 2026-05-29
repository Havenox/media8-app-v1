using Media8.Application.DTOs.Billing;
using Media8.Application.Interfaces;
using Media8.Domain.Entities;
using Media8.Domain.Enums;
using Media8.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Media8.Api.Controllers;

/// <summary>
/// Controller administrativo para gerenciamento de faturamento e pagamentos.
/// Restrito à role Admin para conciliação manual.
/// </summary>
[Authorize(Roles = "Admin")]
[ApiController]
[Route("api/v1/admin/billing")]
public class BillingController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IServiceBalanceService _serviceBalanceService;
    private readonly ILogger<BillingController> _logger;

    public BillingController(
        ApplicationDbContext context,
        IServiceBalanceService serviceBalanceService,
        ILogger<BillingController> logger)
    {
        _context = context;
        _serviceBalanceService = serviceBalanceService;
        _logger = logger;
    }

    /// <summary>
    /// Lista faturas cadastradas no sistema com suporte a busca, filtros e paginação.
    /// </summary>
    [HttpGet("invoices")]
    public async Task<ActionResult<object>> GetInvoices(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] InvoiceStatus? status = null,
        [FromQuery] string? search = null)
    {
        try
        {
            var query = _context.Invoices
                .Include(i => i.Client)
                .ThenInclude(u => u.Profile)
                .Include(i => i.Contract)
                .AsQueryable();

            // Filtragem por status
            if (status.HasValue)
            {
                query = query.Where(i => i.Status == status.Value);
            }

            // Filtro de pesquisa textual (Nome do cliente, email ou descrição)
            if (!string.IsNullOrWhiteSpace(search))
            {
                var cleanSearch = search.Trim().ToLower();
                query = query.Where(i => 
                    i.Description.ToLower().Contains(cleanSearch) ||
                    (i.Client != null && i.Client.Email.ToLower().Contains(cleanSearch)) ||
                    (i.Client != null && i.Client.Profile != null && i.Client.Profile.Name.ToLower().Contains(cleanSearch))
                );
            }

            var totalCount = await query.CountAsync();

            var invoices = await query
                .OrderByDescending(i => i.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(i => new InvoiceResponse
                {
                    Id = i.Id,
                    ClientId = i.ClientId,
                    ClientName = i.Client != null && i.Client.Profile != null ? i.Client.Profile.Name : "Cliente",
                    ClientEmail = i.Client != null ? i.Client.Email : string.Empty,
                    ContractId = i.ContractId,
                    ContractOfferName = i.Contract != null ? i.Contract.SnapshotOfferName : string.Empty,
                    Description = i.Description,
                    Amount = i.Amount,
                    CycleNumber = i.CycleNumber,
                    DueDate = i.DueDate,
                    Status = i.Status,
                    PaidAt = i.PaidAt,
                    PaymentMethod = i.PaymentMethod,
                    GatewayInvoiceId = i.GatewayInvoiceId,
                    TransactionId = i.TransactionId,
                    CreatedAt = i.CreatedAt,
                    UpdatedAt = i.UpdatedAt
                })
                .ToListAsync();

            return Ok(new
            {
                Items = invoices,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao buscar faturas");
            return BadRequest(new { message = "Erro ao carregar lista de pagamentos" });
        }
    }

    /// <summary>
    /// Confirma o pagamento de uma fatura de forma manual.
    /// Atualiza o status e dispara o provisionamento correspondente caso haja contrato associado.
    /// </summary>
    [HttpPost("invoices/{id:guid}/confirm-payment")]
    public async Task<ActionResult> ConfirmPayment(Guid id, [FromBody] ConfirmPaymentRequest request)
    {
        if (request == null || string.IsNullOrWhiteSpace(request.PaymentMethod))
        {
            return BadRequest(new { message = "Método de pagamento é obrigatório." });
        }

        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var invoice = await _context.Invoices.FindAsync(id);
            if (invoice == null)
            {
                return NotFound(new { message = "Fatura não encontrada." });
            }

            if (invoice.Status == InvoiceStatus.Paid)
            {
                return BadRequest(new { message = "Esta fatura já está paga." });
            }

            // Atualiza dados da fatura
            invoice.Status = InvoiceStatus.Paid;
            invoice.PaidAt = DateTime.UtcNow;
            invoice.PaymentMethod = request.PaymentMethod;
            invoice.TransactionId = request.TransactionId;
            invoice.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Se for uma assinatura vinculada a um contrato, dispara a concessão de saldos
            if (invoice.ContractId.HasValue)
            {
                _logger.LogInformation("🚀 Fatura de contrato {ContractId} paga. Disparando renovação de ciclo...", invoice.ContractId.Value);
                
                var success = await _serviceBalanceService.RenewSubscriptionCycleAsync(invoice.ContractId.Value, isManualAdminAction: true);
                if (!success)
                {
                    _logger.LogWarning("⚠️ Falha ao provisionar créditos para o contrato {ContractId} após confirmação do faturamento.", invoice.ContractId.Value);
                }
            }

            await transaction.CommitAsync();

            return Ok(new { message = "Pagamento confirmado com sucesso e créditos liberados." });
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            _logger.LogError(ex, "Erro ao confirmar pagamento manual para a fatura {InvoiceId}", id);
            return BadRequest(new { message = $"Erro ao confirmar pagamento: {ex.Message}" });
        }
    }

    /// <summary>
    /// Endpoint de desenvolvimento para gerar assinaturas de teste retroativas e faturas pendentes.
    /// </summary>
    [HttpPost("seed-test-data")]
    [AllowAnonymous]
    public async Task<ActionResult> SeedTestData()
    {
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == "cliente@cliente.com");
            if (user == null)
            {
                return BadRequest(new { message = "Usuário cliente@cliente.com não encontrado. Rode o DbSeeder primeiro." });
            }

            var adminUser = await _context.Users.FirstOrDefaultAsync(u => u.Email == "admin@admin.com");
            var adminId = adminUser?.Id ?? Guid.Parse("00000000-0000-0000-0000-000000000001");

            // Limpa dados de teste anteriores
            var clientId = user.Id;
            var oldContracts = await _context.ClientContracts.Where(c => c.ClientId == clientId).ToListAsync();
            _context.ClientContracts.RemoveRange(oldContracts);

            var oldInvoices = await _context.Invoices.Where(i => i.ClientId == clientId).ToListAsync();
            _context.Invoices.RemoveRange(oldInvoices);

            var oldLots = await _context.ServiceBalanceLots.Where(l => l.UserId == clientId).ToListAsync();
            _context.ServiceBalanceLots.RemoveRange(oldLots);

            await _context.SaveChangesAsync();

            // Garante que existam formatos e estilos de edição
            var editingStyle = await _context.EditingStyles.FirstOrDefaultAsync();
            var videoFormat = await _context.VideoFormats.FirstOrDefaultAsync();

            // Busca ou cria Ofertas de teste
            var planoStart = await _context.Offers.FirstOrDefaultAsync(o => o.Slug == "plano-start");
            if (planoStart == null)
            {
                planoStart = new Offer
                {
                    Id = Guid.NewGuid(),
                    Name = "Plano Start",
                    Slug = "plano-start",
                    ContractType = ContractType.Assinatura,
                    Price = 150.00m,
                    VideoQuantity = 4,
                    MaxDurationSeconds = 60,
                    ValidityDays = 30,
                    LoyaltyMonths = 6,
                    DeliveryDays = 2,
                    EditingStyleId = editingStyle?.Id,
                    VideoFormatId = videoFormat?.Id,
                    IsPublic = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                _context.Offers.Add(planoStart);
            }

            var planoScale = await _context.Offers.FirstOrDefaultAsync(o => o.Slug == "plano-scale");
            if (planoScale == null)
            {
                planoScale = new Offer
                {
                    Id = Guid.NewGuid(),
                    Name = "Plano Scale",
                    Slug = "plano-scale",
                    ContractType = ContractType.Assinatura,
                    Price = 299.00m,
                    VideoQuantity = 10,
                    MaxDurationSeconds = 90,
                    ValidityDays = 30,
                    LoyaltyMonths = 12,
                    DeliveryDays = 3,
                    EditingStyleId = editingStyle?.Id,
                    VideoFormatId = videoFormat?.Id,
                    IsPublic = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                _context.Offers.Add(planoScale);
            }

            await _context.SaveChangesAsync();

            var now = DateTime.UtcNow;

            // 1. Assinatura criada na data de hoje
            var contractToday = new ClientContract
            {
                Id = Guid.NewGuid(),
                OfferId = planoStart.Id,
                ClientId = clientId,
                AssignedBy = adminId,
                AssignedAt = now,
                ActivatedAt = now,
                Status = AssignmentStatus.Active,
                SnapshotOfferName = planoStart.Name,
                SnapshotVideoQuantity = planoStart.VideoQuantity,
                SnapshotPrice = planoStart.Price,
                SnapshotValidityDays = planoStart.ValidityDays,
                SnapshotDeliveryDays = planoStart.DeliveryDays,
                SnapshotWarrantyDays = planoStart.LoyaltyMonths * 30,
                SnapshotContractType = ContractType.Assinatura,
                SnapshotVideoFormatName = videoFormat?.Name ?? "Reels Standard",
                SnapshotEditingStyleName = editingStyle?.Name ?? "Simples",
                SnapshotMaxDurationSeconds = planoStart.MaxDurationSeconds,
                CreatedAt = now,
                UpdatedAt = now
            };
            _context.ClientContracts.Add(contractToday);

            var lotToday = new ServiceBalanceLot
            {
                Id = Guid.NewGuid(),
                UserId = clientId,
                ContractId = contractToday.Id,
                Quantity = planoStart.VideoQuantity,
                RemainingQuantity = planoStart.VideoQuantity,
                CreatedAt = now,
                ExpiresAt = now.AddDays(30),
                Source = LotSource.Purchase,
                AssignmentId = contractToday.Id,
                UpdatedAt = now
            };
            _context.ServiceBalanceLots.Add(lotToday);

            var invoiceToday = new Invoice
            {
                Id = Guid.NewGuid(),
                ClientId = clientId,
                ContractId = contractToday.Id,
                Description = $"Assinatura - {planoStart.Name} - Mês 1",
                Amount = planoStart.Price,
                CycleNumber = 1,
                DueDate = now,
                Status = InvoiceStatus.Paid,
                PaidAt = now,
                PaymentMethod = "Manual",
                CreatedAt = now,
                UpdatedAt = now
            };
            _context.Invoices.Add(invoiceToday);

            // 2. Três assinaturas na data de 15/03/2026 (renovada em abril, aguardando maio)
            var date15March = new DateTime(2026, 3, 15, 12, 0, 0, DateTimeKind.Utc);
            var date15April = new DateTime(2026, 4, 15, 12, 0, 0, DateTimeKind.Utc);
            var date15May = new DateTime(2026, 5, 15, 12, 0, 0, DateTimeKind.Utc);

            for (int i = 1; i <= 3; i++)
            {
                var contractPast = new ClientContract
                {
                    Id = Guid.NewGuid(),
                    OfferId = planoScale.Id,
                    ClientId = clientId,
                    AssignedBy = adminId,
                    AssignedAt = date15March,
                    ActivatedAt = date15March,
                    Status = AssignmentStatus.Active,
                    SnapshotOfferName = $"{planoScale.Name} Teste {i}",
                    SnapshotVideoQuantity = planoScale.VideoQuantity,
                    SnapshotPrice = planoScale.Price,
                    SnapshotValidityDays = planoScale.ValidityDays,
                    SnapshotDeliveryDays = planoScale.DeliveryDays,
                    SnapshotWarrantyDays = planoScale.LoyaltyMonths * 30,
                    SnapshotContractType = ContractType.Assinatura,
                    SnapshotVideoFormatName = videoFormat?.Name ?? "Reels Premium",
                    SnapshotEditingStyleName = editingStyle?.Name ?? "Profissional",
                    SnapshotMaxDurationSeconds = planoScale.MaxDurationSeconds,
                    CreatedAt = date15March,
                    UpdatedAt = date15March
                };
                _context.ClientContracts.Add(contractPast);

                // Mês 1: Pago
                var invoiceM1 = new Invoice
                {
                    Id = Guid.NewGuid(),
                    ClientId = clientId,
                    ContractId = contractPast.Id,
                    Description = $"Assinatura - {planoScale.Name} Teste {i} - Mês 1",
                    Amount = planoScale.Price,
                    CycleNumber = 1,
                    DueDate = date15March,
                    Status = InvoiceStatus.Paid,
                    PaidAt = date15March,
                    PaymentMethod = "Manual",
                    CreatedAt = date15March,
                    UpdatedAt = date15March
                };
                _context.Invoices.Add(invoiceM1);

                var lotM1 = new ServiceBalanceLot
                {
                    Id = Guid.NewGuid(),
                    UserId = clientId,
                    ContractId = contractPast.Id,
                    Quantity = planoScale.VideoQuantity,
                    RemainingQuantity = 0, // consumido
                    CreatedAt = date15March,
                    ExpiresAt = date15April,
                    Source = LotSource.Purchase,
                    AssignmentId = contractPast.Id,
                    UpdatedAt = date15March
                };
                _context.ServiceBalanceLots.Add(lotM1);

                // Mês 2: Pago
                var invoiceM2 = new Invoice
                {
                    Id = Guid.NewGuid(),
                    ClientId = clientId,
                    ContractId = contractPast.Id,
                    Description = $"Assinatura - {planoScale.Name} Teste {i} - Mês 2",
                    Amount = planoScale.Price,
                    CycleNumber = 2,
                    DueDate = date15April,
                    Status = InvoiceStatus.Paid,
                    PaidAt = date15April,
                    PaymentMethod = "Manual",
                    CreatedAt = date15April,
                    UpdatedAt = date15April
                };
                _context.Invoices.Add(invoiceM2);

                var lotM2 = new ServiceBalanceLot
                {
                    Id = Guid.NewGuid(),
                    UserId = clientId,
                    ContractId = contractPast.Id,
                    Quantity = planoScale.VideoQuantity,
                    RemainingQuantity = 2, // sobrou 2 créditos que expiraram em 15/05
                    CreatedAt = date15April,
                    ExpiresAt = date15May,
                    Source = LotSource.Subscription,
                    AssignmentId = contractPast.Id,
                    UpdatedAt = date15April
                };
                _context.ServiceBalanceLots.Add(lotM2);

                // Mês 3: Pendente (aguardando renovar pro mes 5)
                var invoiceM3 = new Invoice
                {
                    Id = Guid.NewGuid(),
                    ClientId = clientId,
                    ContractId = contractPast.Id,
                    Description = $"Assinatura - {planoScale.Name} Teste {i} - Mês 3",
                    Amount = planoScale.Price,
                    CycleNumber = 3,
                    DueDate = date15May,
                    Status = InvoiceStatus.Pending,
                    PaidAt = null,
                    PaymentMethod = null,
                    CreatedAt = date15May,
                    UpdatedAt = date15May
                };
                _context.Invoices.Add(invoiceM3);
            }

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            return Ok(new { message = "Dados de teste gerados com sucesso para o cliente cliente@cliente.com!" });
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            _logger.LogError(ex, "Erro ao gerar dados de teste para cliente@cliente.com");
            return BadRequest(new { message = $"Erro ao gerar dados de teste: {ex.Message}" });
        }
    }
}

