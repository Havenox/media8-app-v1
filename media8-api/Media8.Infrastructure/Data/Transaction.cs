using Media8.Application.Interfaces;
using Microsoft.EntityFrameworkCore.Storage;

namespace Media8.Infrastructure.Data;

/// <summary>
/// Concrete implementation of ITransaction that wraps EF Core's IDbContextTransaction.
/// </summary>
/// <param name="transaction">The underlying EF Core transaction.</param>
public class Transaction(IDbContextTransaction transaction) : ITransaction
{
    private readonly IDbContextTransaction _transaction = transaction ?? throw new ArgumentNullException(nameof(transaction));

    /// <inheritdoc/>
    public async Task CommitAsync(CancellationToken cancellationToken = default)
    {
        await _transaction.CommitAsync(cancellationToken);
    }

    /// <inheritdoc/>
    public async Task RollbackAsync(CancellationToken cancellationToken = default)
    {
        await _transaction.RollbackAsync(cancellationToken);
    }

    /// <inheritdoc/>
    public void Dispose()
    {
        _transaction.Dispose();
    }
}
