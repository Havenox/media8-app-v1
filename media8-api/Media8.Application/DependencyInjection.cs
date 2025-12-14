using Media8.Application.Interfaces;
using Media8.Application.Services;
using Microsoft.Extensions.DependencyInjection;

namespace Media8.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IOrderService, OrderService>();
        services.AddScoped<IServiceBalanceService, ServiceBalanceService>();
        
        return services;
    }
}
