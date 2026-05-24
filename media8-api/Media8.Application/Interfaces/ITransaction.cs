namespace Media8.Application.Interfaces;

/// <summary>
/// Represents a database transaction that can be committed or rolled back.
/// </summary>
public interface ITransaction : IDisposable
{
    /// <summary>
    /// Commits all operations performed within this transaction.
    /// </summary>
    Task CommitAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Rolls back all operations performed within this transaction.
    /// </summary>
    Task RollbackAsync(CancellationToken cancellationToken = default);
}
