using Media8.Application.Interfaces;
using Media8.Domain.Entities;
using Media8.Domain.Enums;
using Media8.Infrastructure.Data;
using Media8.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Npgsql;

namespace Media8.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration["DB_CONNECTION_STRING"] 
                               ?? configuration.GetConnectionString("DefaultConnection");

        var dataSourceBuilder = new NpgsqlDataSourceBuilder(connectionString);
        
// Map Enums
dataSourceBuilder.MapEnum<AppRole>();
dataSourceBuilder.MapEnum<PackageCategory>();
dataSourceBuilder.MapEnum<OrderStatus>();
dataSourceBuilder.MapEnum<TimelineActionType>();
dataSourceBuilder.MapEnum<AssignmentStatus>();
dataSourceBuilder.MapEnum<LotSource>();
dataSourceBuilder.MapEnum<NotificationType>();

var dataSource = dataSourceBuilder.Build();

services.AddDbContext<ApplicationDbContext>(options =>
{
    options.UseNpgsql(dataSource);
    // Suppress pending model changes warning - migrations will be managed manually
    options.ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.PendingModelChangesWarning));
});

    services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
    services.AddScoped<IUserRepository, UserRepository>();
    services.AddScoped<IServiceBalanceRepository, ServiceBalanceRepository>();

        services.AddSingleton<IPasswordHasher, Authentication.PasswordHasher>();
        services.AddScoped<IJwtProvider, Authentication.JwtProvider>();
        services.AddScoped<DbSeeder>();

        return services;
    }
}
