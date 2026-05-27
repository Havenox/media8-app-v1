using Media8.Application.DTOs.Orders;
using Media8.Application.Interfaces;
using Media8.Domain.Entities;
using Media8.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Media8.Infrastructure.Data;

namespace Media8.IntegrationTests;

public class OrderCancellationTests : IClassFixture<CustomWebApplicationFactory<Program>>
{
private readonly CustomWebApplicationFactory<Program> _factory;

public OrderCancellationTests(CustomWebApplicationFactory<Program> factory)
{
_factory = factory;
}

[Fact]
public async Task CancelOrder_WithExpiredLot_ShouldRefundAndExtendExpiration()
{
// Arrange
using var scope = _factory.Services.CreateScope();
var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
var orderService = scope.ServiceProvider.GetRequiredService<IOrderService>();

try
{
var userId = Guid.NewGuid();
var user = new User
{
Id = userId,
Email = $"client_{userId}@test.com"
};
context.Users.Add(user);
await context.SaveChangesAsync();

var userRole = new UserRole
{
UserId = userId,
Role = AppRole.Client
};
context.UserRoles.Add(userRole);
await context.SaveChangesAsync();

var pastDate = DateTime.UtcNow.AddDays(-60);
var contract = new ClientContract
{
Id = Guid.NewGuid(),
OfferId = Guid.NewGuid(),
ClientId = userId,
AssignedBy = userId,
SnapshotOfferName = "Test Contract",
SnapshotVideoFormatName = "Test Format",
SnapshotEditingStyleName = "Test Style",
SnapshotMaxDurationSeconds = 60,
SnapshotVideoQuantity = 5,
SnapshotPrice = 100,
Status = AssignmentStatus.Active,
ActivatedAt = pastDate
};
context.ClientContracts.Add(contract);
await context.SaveChangesAsync();

var balanceLot = new ServiceBalanceLot
{
UserId = userId,
ContractId = contract.Id,
Quantity = 5,
RemainingQuantity = 4,
CreatedAt = pastDate,
ExpiresAt = DateTime.UtcNow.AddDays(-10),
Source = LotSource.Purchase,
AssignmentId = contract.Id
};
context.ServiceBalanceLots.Add(balanceLot);
await context.SaveChangesAsync();

var order = new Order
{
    ClientId = userId,
    Title = "Test Order",
    Briefing = "Test Briefing",
    SourceFilesUrl = "https://example.com/source",
    ServiceBalanceLotId = balanceLot.Id,
    Deadline = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(7)),
    Status = OrderStatus.Pending
};
context.Orders.Add(order);
await context.SaveChangesAsync();

// Act
var result = await orderService.CancelOrderAsync(order.Id);

// Assert
Assert.NotNull(result);
Assert.Equal(OrderStatus.Cancelled, result.Status);

var updatedLot = await context.ServiceBalanceLots.FindAsync(balanceLot.Id);
var updatedOrder = await context.Orders.FindAsync(order.Id);

Assert.NotNull(updatedLot);
Assert.Equal(5, updatedLot!.RemainingQuantity);
Assert.NotNull(updatedLot.ExpiresAt);
Assert.True(updatedLot.ExpiresAt > DateTime.UtcNow);

Assert.NotNull(updatedOrder);
Assert.Equal(OrderStatus.Cancelled, updatedOrder!.Status);
}
finally
{
await context.Database.EnsureDeletedAsync();
}
}
}
