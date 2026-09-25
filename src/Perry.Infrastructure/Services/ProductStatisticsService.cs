using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using Perry.Domain.Enums;
using Perry.Infrastructure.Persistence;

namespace Perry.Infrastructure.Services;

public interface IProductStatisticsService
{
    /// <summary>Учесть просмотр с антиспамом. True — счётчик увеличили.</summary>
    Task<bool> TryRecordViewAsync(Guid productId, string? clientKey, CancellationToken ct = default);

    Task<(int ViewCount, int OrderCount)?> GetStatsAsync(Guid productId, CancellationToken ct = default);

    Task<IReadOnlyList<ProductStatsListItem>> GetMostViewedAsync(int take = 10, CancellationToken ct = default);
}

public sealed record ProductStatsListItem(
    Guid Id,
    string Name,
    string Slug,
    string Brand,
    decimal Price,
    decimal? OldPrice,
    int? DiscountPercent,
    decimal AverageRating,
    int ReviewCount,
    int ViewCount,
    int OrderCount,
    string? ImageUrl,
    ProductStatus Status);

public sealed class ProductStatisticsService : IProductStatisticsService
{
    private readonly AppDbContext _db;
    private readonly IMemoryCache _cache;
    private readonly IHttpContextAccessor _http;
    private readonly int _cooldownSeconds;
    private readonly int _maxPerHour;

    public ProductStatisticsService(
        AppDbContext db,
        IMemoryCache cache,
        IHttpContextAccessor http,
        IConfiguration configuration)
    {
        _db = db;
        _cache = cache;
        _http = http;
        _cooldownSeconds = Math.Clamp(configuration.GetValue("ProductStats:ViewCooldownSeconds", 60), 10, 3600);
        _maxPerHour = Math.Clamp(configuration.GetValue("ProductStats:MaxViewsPerClientPerHour", 120), 10, 10_000);
    }

    public async Task<bool> TryRecordViewAsync(Guid productId, string? clientKey, CancellationToken ct = default)
    {
        if (productId == Guid.Empty)
            return false;

        var key = string.IsNullOrWhiteSpace(clientKey)
            ? ResolveClientKey()
            : clientKey.Trim();

        if (string.IsNullOrEmpty(key))
            key = "anonymous";

        var productKey = $"product-view:{key}:{productId:N}";
        if (_cache.TryGetValue(productKey, out _))
            return false;

        var hourKey = $"product-view-hour:{key}";
        var hourCount = _cache.GetOrCreate(hourKey, e =>
        {
            e.AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(1);
            return 0;
        });

        if (hourCount >= _maxPerHour)
            return false;

        var exists = await _db.Products.AsNoTracking().AnyAsync(p => p.Id == productId, ct);
        if (!exists)
            return false;

        var updated = await _db.Products
            .Where(p => p.Id == productId)
            .ExecuteUpdateAsync(s => s.SetProperty(p => p.ViewCount, p => p.ViewCount + 1), ct);

        if (updated == 0)
            return false;

        _cache.Set(productKey, 1, TimeSpan.FromSeconds(_cooldownSeconds));
        _cache.Set(hourKey, hourCount + 1, TimeSpan.FromHours(1));
        return true;
    }

    public async Task<(int ViewCount, int OrderCount)?> GetStatsAsync(Guid productId, CancellationToken ct = default)
    {
        var row = await _db.Products.AsNoTracking()
            .Where(p => p.Id == productId)
            .Select(p => new { p.ViewCount, p.OrderCount })
            .FirstOrDefaultAsync(ct);

        return row is null ? null : (row.ViewCount, row.OrderCount);
    }

    public async Task<IReadOnlyList<ProductStatsListItem>> GetMostViewedAsync(int take = 10, CancellationToken ct = default)
    {
        if (take < 1) take = 10;
        if (take > 50) take = 50;

        return await _db.Products.AsNoTracking()
            .Where(p => p.Status == ProductStatus.Active || p.Status == ProductStatus.OutOfStock)
            .OrderByDescending(p => p.ViewCount)
            .ThenByDescending(p => p.OrderCount)
            .Take(take)
            .Select(p => new ProductStatsListItem(
                p.Id,
                p.Name,
                p.Slug,
                p.Brand,
                p.Price,
                p.OldPrice,
                p.OldPrice != null && p.OldPrice > p.Price
                    ? (int?)Math.Round((p.OldPrice.Value - p.Price) / p.OldPrice.Value * 100)
                    : null,
                p.AverageRating,
                p.ReviewCount,
                p.ViewCount,
                p.OrderCount,
                p.Images.Where(i => i.IsPrimary).Select(i => i.Url).FirstOrDefault()
                    ?? p.Images.OrderBy(i => i.SortOrder).Select(i => i.Url).FirstOrDefault(),
                p.Status))
            .ToListAsync(ct);
    }

    private string ResolveClientKey()
    {
        var ctx = _http.HttpContext;
        if (ctx is null)
            return "anonymous";

        var ip = ctx.Connection.RemoteIpAddress?.ToString()
            ?? ctx.Request.Headers["X-Forwarded-For"].FirstOrDefault()?.Split(',')[0].Trim()
            ?? "unknown";

        var ua = ctx.Request.Headers.UserAgent.ToString();
        if (ua.Length > 64)
            ua = ua[..64];

        return $"{ip}|{ua}";
    }
}
