using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Perry.Api.Controllers;
using Perry.Domain.Entities;
using Perry.Domain.Enums;
using Perry.Tests.Helpers;

namespace Perry.Tests;

public class AdminStatsControllerTests
{
    private static readonly JsonSerializerOptions JsonWeb = new(JsonSerializerDefaults.Web);

    private static AdminStatsController CreateController(TestDb fx, Guid? sellerId = null)
    {
        var controller = new AdminStatsController(fx.Db);
        var identity = new ClaimsIdentity("Bearer", "sub", "role");
        identity.AddClaim(new Claim("sub", (sellerId ?? Guid.NewGuid()).ToString()));
        identity.AddClaim(new Claim("role", sellerId.HasValue ? "Seller" : "Admin"));

        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal(identity) }
        };
        return controller;
    }

    private static void SeedOrder(TestDb fx, Product product, Guid userId, decimal total, DateTime when,
        OrderStatus status = OrderStatus.ReadyToPickup)
    {
        var order = new Order
        {
            Id = Guid.NewGuid(),
            OrderNumber = "T" + Guid.NewGuid().ToString("N")[..6].ToUpperInvariant(),
            UserId = userId,
            OrderDateUtc = when,
            TotalAmount = total,
            ItemsCount = 1,
            Status = status
        };
        fx.Db.Orders.Add(order);
        fx.Db.OrderItems.Add(new OrderItem
        {
            Id = Guid.NewGuid(),
            OrderId = order.Id,
            ProductId = product.Id,
            ProductName = product.Name,
            ProductPrice = total,
            Quantity = 1,
            TotalPrice = total,
            CategoryName = "Test"
        });
        fx.Db.SaveChanges();
    }

    private static JsonElement Body(IActionResult result)
    {
        var ok = Assert.IsType<OkObjectResult>(result);
        return JsonDocument.Parse(JsonSerializer.Serialize(ok.Value, JsonWeb)).RootElement;
    }

    [Fact]
    public async Task Chart_months_has_12_buckets_and_current_month_sum()
    {
        using var fx = new TestDb();
        var product = fx.SeedProduct(price: 100m);
        var customer = Guid.NewGuid();
        SeedOrder(fx, product, customer, 100m, DateTime.UtcNow);
        SeedOrder(fx, product, customer, 50m, DateTime.UtcNow.AddMonths(-2));

        var body = Body(await CreateController(fx).GetChart("months", null, CancellationToken.None));

        Assert.Equal("months", body.GetProperty("period").GetString());
        var points = body.GetProperty("points");
        Assert.Equal(12, points.GetArrayLength());
        Assert.Equal(100m, points[11].GetProperty("amount").GetDecimal());
        Assert.Equal(50m, points[9].GetProperty("amount").GetDecimal());
        Assert.Equal(1, points[11].GetProperty("ordersCount").GetInt32());
        Assert.Equal(1, points[11].GetProperty("customers").GetInt32());
    }

    [Fact]
    public async Task Chart_days_has_30_buckets()
    {
        using var fx = new TestDb();
        var product = fx.SeedProduct(price: 10m);
        SeedOrder(fx, product, Guid.NewGuid(), 10m, DateTime.UtcNow);

        var body = Body(await CreateController(fx).GetChart("days", null, CancellationToken.None));

        var points = body.GetProperty("points");
        Assert.Equal(30, points.GetArrayLength());
        Assert.Equal(10m, points[29].GetProperty("amount").GetDecimal());
    }

    [Fact]
    public async Task Chart_years_starts_from_first_order()
    {
        using var fx = new TestDb();
        var firstYear = DateTime.UtcNow.Year - 2;
        var product = fx.SeedProduct(price: 7m);
        SeedOrder(fx, product, Guid.NewGuid(), 7m, new DateTime(firstYear, 6, 1, 0, 0, 0, DateTimeKind.Utc));

        var body = Body(await CreateController(fx).GetChart("years", null, CancellationToken.None));

        var points = body.GetProperty("points");
        Assert.Equal(3, points.GetArrayLength());
        Assert.Equal(firstYear.ToString(), points[0].GetProperty("label").GetString());
        Assert.Equal(7m, points[0].GetProperty("amount").GetDecimal());
    }

    [Fact]
    public async Task Chart_months_on_empty_board_has_zeroes()
    {
        using var fx = new TestDb();

        var body = Body(await CreateController(fx).GetChart("months", null, CancellationToken.None));

        var points = body.GetProperty("points");
        Assert.Equal(12, points.GetArrayLength());
        Assert.All(points.EnumerateArray(), p => Assert.Equal(0m, p.GetProperty("amount").GetDecimal()));
    }

    [Fact]
    public async Task Chart_seller_sees_only_own_products()
    {
        using var fx = new TestDb();
        var seller = Guid.NewGuid();
        var own = fx.SeedProduct(price: 30m, sellerId: seller);
        var foreign = fx.SeedProduct(price: 90m, sellerId: Guid.NewGuid());
        SeedOrder(fx, own, Guid.NewGuid(), 30m, DateTime.UtcNow);
        SeedOrder(fx, foreign, Guid.NewGuid(), 90m, DateTime.UtcNow);

        var body = Body(await CreateController(fx, seller).GetChart("months", null, CancellationToken.None));

        Assert.Equal(30m, body.GetProperty("points")[11].GetProperty("amount").GetDecimal());
    }

    [Fact]
    public async Task Cancelled_orders_are_not_income()
    {
        using var fx = new TestDb();
        var product = fx.SeedProduct(price: 100m);
        var customer = Guid.NewGuid();
        SeedOrder(fx, product, customer, 100m, DateTime.UtcNow);
        SeedOrder(fx, product, customer, 900m, DateTime.UtcNow, OrderStatus.Cancelled);

        var points = Body(await CreateController(fx).GetChart("months", null, CancellationToken.None))
            .GetProperty("points");

        Assert.Equal(100m, points[11].GetProperty("amount").GetDecimal());
        Assert.Equal(1, points[11].GetProperty("ordersCount").GetInt32());
        Assert.Equal(1, points[11].GetProperty("customers").GetInt32());
    }

    [Fact]
    public async Task Mixed_order_counts_only_seller_items()
    {
        using var fx = new TestDb();
        var seller = Guid.NewGuid();
        var own = fx.SeedProduct(price: 30m, sellerId: seller);
        var foreign = fx.SeedProduct(price: 70m, sellerId: Guid.NewGuid());
        var customer = Guid.NewGuid();
        var order = new Order
        {
            Id = Guid.NewGuid(),
            OrderNumber = "MIX1",
            UserId = customer,
            OrderDateUtc = DateTime.UtcNow,
            TotalAmount = 100m,
            ItemsCount = 2,
            Status = OrderStatus.ReadyToPickup
        };
        fx.Db.Orders.Add(order);
        fx.Db.OrderItems.AddRange(
            new OrderItem
            {
                Id = Guid.NewGuid(), OrderId = order.Id, ProductId = own.Id, ProductName = own.Name,
                ProductPrice = 30m, Quantity = 1, TotalPrice = 30m, CategoryName = "Test"
            },
            new OrderItem
            {
                Id = Guid.NewGuid(), OrderId = order.Id, ProductId = foreign.Id, ProductName = foreign.Name,
                ProductPrice = 70m, Quantity = 1, TotalPrice = 70m, CategoryName = "Test"
            });
        fx.Db.SaveChanges();

        var sellerPoint = Body(await CreateController(fx, seller).GetChart("months", null, CancellationToken.None))
            .GetProperty("points")[11];
        Assert.Equal(30m, sellerPoint.GetProperty("amount").GetDecimal());
        Assert.Equal(1, sellerPoint.GetProperty("ordersCount").GetInt32());

        var adminPoint = Body(await CreateController(fx).GetChart("months", null, CancellationToken.None))
            .GetProperty("points")[11];
        Assert.Equal(100m, adminPoint.GetProperty("amount").GetDecimal());
        Assert.Equal(1, adminPoint.GetProperty("ordersCount").GetInt32());
    }
}
