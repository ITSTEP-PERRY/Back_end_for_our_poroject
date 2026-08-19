using Perry.Infrastructure.Auth;
using Perry.Infrastructure.Persistence;
using Perry.Infrastructure.Services;
using Perry.Infrastructure.Storage;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Perry.Infrastructure;

/// <summary>
/// Регистрация инфраструктурных сервисов в DI-контейнере ASP.NET.
/// </summary>
public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException(
                "Connection string 'DefaultConnection' is not configured.");

        services.AddDbContext<AppDbContext>(options =>
            options.UseSqlServer(connectionString));

        // Нужен ViewedProductsService (и другим сервисам с доступом к HttpContext).
        // В Api раньше не регистрировали — из‑за этого падал старт.
        services.AddHttpContextAccessor();

        services.AddSingleton<IKdfService, PbKdf1Service>();
        services.AddSingleton<IStorageService, DiskStorageService>();
        services.AddScoped<ICartService, CartService>();
        services.AddScoped<IOrderService, OrderService>();
        services.AddScoped<IViewedProductsService, ViewedProductsService>();
        services.AddScoped<IProductService, ProductService>();
        services.AddScoped<ICategoryService, CategoryService>();
        services.AddScoped<IUserService, UserService>();
        services.AddMemoryCache();
        services.AddSingleton<IEmailCodeService, EmailCodeService>();

        // Пока SMTP-заглушка (код в лог). Позже Smtp:UseStub=false + App Password.
        var useStub = configuration.GetValue("Smtp:UseStub", true);
        if (useStub)
            services.AddScoped<IEmailSender, StubEmailSender>();
        else
            services.AddScoped<IEmailSender, SmtpEmailSender>();

        return services;
    }
}
