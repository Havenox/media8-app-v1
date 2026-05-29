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
}
