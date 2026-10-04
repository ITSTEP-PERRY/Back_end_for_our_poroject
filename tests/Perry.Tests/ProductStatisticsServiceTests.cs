using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using Perry.Infrastructure.Services;
using Perry.Tests.Helpers;

namespace Perry.Tests;

public class ProductStatisticsServiceTests
{
    private static ProductStatisticsService CreateStats(TestDb fx, int cooldownSeconds = 60)
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ProductStats:ViewCooldownSeconds"] = cooldownSeconds.ToString(),
                ["ProductStats:MaxViewsPerClientPerHour"] = "120"
            })
            .Build();

        return new ProductStatisticsService(
            fx.Db,
            new MemoryCache(new MemoryCacheOptions()),
            new HttpContextAccessor(),
            config);
    }

    [Fact]
    public async Task TryRecordView_increments_once_then_cooldown_blocks()
    {
        using var fx = new TestDb();
        var product = fx.SeedProduct();
        var stats = CreateStats(fx);

        var first = await stats.TryRecordViewAsync(product.Id, "client-a");
        var second = await stats.TryRecordViewAsync(product.Id, "client-a");

        Assert.True(first);
        Assert.False(second);

        var views = await fx.Db.Products.AsNoTracking()
            .Where(p => p.Id == product.Id)
            .Select(p => p.ViewCount)
            .SingleAsync();
        Assert.Equal(1, views);
    }

    [Fact]
    public async Task TryRecordView_returns_false_for_missing_product()
    {
        using var fx = new TestDb();
        var stats = CreateStats(fx);

        var ok = await stats.TryRecordViewAsync(Guid.NewGuid(), "client-b");
        Assert.False(ok);
    }
}
