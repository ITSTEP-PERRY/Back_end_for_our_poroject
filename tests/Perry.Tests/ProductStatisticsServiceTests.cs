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

    [Fact]
    public async Task GetMostViewed_without_seller_returns_all_ordered_by_views()
    {
        using var fx = new TestDb();
        var sellerA = Guid.NewGuid();
        var sellerB = Guid.NewGuid();
        var cat = fx.SeedCategory();
        var low = fx.SeedProduct(cat, name: "Low", sellerId: sellerA, viewCount: 1);
        var mid = fx.SeedProduct(cat, name: "Mid", sellerId: sellerB, viewCount: 5);
        var high = fx.SeedProduct(cat, name: "High", sellerId: sellerA, viewCount: 10);
        var stats = CreateStats(fx);

        var items = await stats.GetMostViewedAsync(take: 10);

        Assert.Equal(new[] { high.Id, mid.Id, low.Id }, items.Select(i => i.Id).ToArray());
    }

    [Fact]
    public async Task GetMostViewed_with_sellerId_returns_only_that_sellers_products()
    {
        using var fx = new TestDb();
        var sellerA = Guid.NewGuid();
        var sellerB = Guid.NewGuid();
        var cat = fx.SeedCategory();
        var aHigh = fx.SeedProduct(cat, name: "A-High", sellerId: sellerA, viewCount: 3);
        fx.SeedProduct(cat, name: "B-Higher", sellerId: sellerB, viewCount: 99);
        var aLow = fx.SeedProduct(cat, name: "A-Low", sellerId: sellerA, viewCount: 1);
        var stats = CreateStats(fx);

        var items = await stats.GetMostViewedAsync(take: 10, sellerId: sellerA);

        Assert.Equal(new[] { aHigh.Id, aLow.Id }, items.Select(i => i.Id).ToArray());
    }

    [Fact]
    public async Task GetMostViewed_respects_take_clamp()
    {
        using var fx = new TestDb();
        var seller = Guid.NewGuid();
        var cat = fx.SeedCategory();
        for (var i = 0; i < 5; i++)
            fx.SeedProduct(cat, name: $"P{i}", sellerId: seller, viewCount: 10 - i);

        var stats = CreateStats(fx);
        var items = await stats.GetMostViewedAsync(take: 2, sellerId: seller);

        Assert.Equal(2, items.Count);
    }
}
