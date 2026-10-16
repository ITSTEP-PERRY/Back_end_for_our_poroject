using Perry.Domain.Entities;
using Perry.Domain.Enums;
using Perry.Infrastructure.Services;
using Perry.Tests.Helpers;

namespace Perry.Tests;

/// <summary>#A21 / #A22.</summary>
public class SellerAnalyticsServiceTests
{
    private static readonly DateTime Now = new(2026, 10, 16, 12, 0, 0, DateTimeKind.Utc);

    private static void AddOrder(TestDb fx, Guid userId, DateTime date, OrderStatus status, string? name,
        params (Product p, int qty)[] lines)
    {
        var order = new Order
        {
            Id = Guid.NewGuid(), OrderNumber = "N-" + Guid.NewGuid().ToString("N")[..6], UserId = userId,
            OrderDateUtc = date, Status = status, RecipientName = name,
        };
        foreach (var (p, qty) in lines)
            order.Items.Add(new OrderItem
            {
                Id = Guid.NewGuid(), ProductId = p.Id, ProductName = p.Name, ProductPrice = p.Price,
                Quantity = qty, TotalPrice = p.Price * qty, CategoryName = "c"
            });
        order.TotalAmount = order.Items.Sum(i => i.TotalPrice);
        fx.Db.Orders.Add(order);
        fx.Db.SaveChanges();
    }

    [Fact]
    public async Task Customers_unique_excludes_cancelled_and_foreign_products()
    {
        using var fx = new TestDb();
        var seller = Guid.NewGuid();
        var mine = fx.SeedProduct(price: 10m, sellerId: seller);
        var foreign = fx.SeedProduct(price: 100m, sellerId: Guid.NewGuid());
        var buyerA = Guid.NewGuid();
        var buyerB = Guid.NewGuid();
        var buyerC = Guid.NewGuid();

        AddOrder(fx, buyerA, Now.AddDays(-5), OrderStatus.Received, "Anna", (mine, 2), (foreign, 1));
        AddOrder(fx, buyerA, Now.AddDays(-1), OrderStatus.Shipped, "Anna K", (mine, 1));
        AddOrder(fx, buyerB, Now.AddDays(-3), OrderStatus.Cancelled, "Bob", (mine, 5));
        AddOrder(fx, buyerC, Now.AddDays(-2), OrderStatus.Ordered, "Carl", (foreign, 1));

        var svc = new SellerAnalyticsService(fx.Db);
        var page = await svc.GetCustomersAsync(seller, 1, 20, null);

        var a = Assert.Single(page.Items);
        Assert.Equal(buyerA, a.UserId);
        Assert.Equal(2, a.OrdersCount);
        Assert.Equal(30m, a.TotalAmount);
        Assert.Equal("Anna K", a.Name);
        Assert.Equal(1, page.TotalCount);
    }

    [Fact]
    public async Task Customers_paginated_sorted_by_last_order_and_search()
    {
        using var fx = new TestDb();
        var seller = Guid.NewGuid();
        var p = fx.SeedProduct(sellerId: seller);
        for (var i = 0; i < 5; i++)
            AddOrder(fx, Guid.NewGuid(), Now.AddDays(-i), OrderStatus.Received, "Buyer" + i, (p, 1));

        var svc = new SellerAnalyticsService(fx.Db);
        var page2 = await svc.GetCustomersAsync(seller, 2, 2, null);
        Assert.Equal(5, page2.TotalCount);
        Assert.Equal(3, page2.TotalPages);
        Assert.Equal(new[] { "Buyer2", "Buyer3" }, page2.Items.Select(x => x.Name));

        var found = await svc.GetCustomersAsync(seller, 1, 20, "buyer4");
        Assert.Equal("Buyer4", Assert.Single(found.Items).Name);
    }

    [Fact]
    public async Task Chart_day_zero_fills_30_points_and_excludes_cancelled()
    {
        using var fx = new TestDb();
        var seller = Guid.NewGuid();
        var p = fx.SeedProduct(price: 10m, sellerId: seller);
        var u1 = Guid.NewGuid();
        AddOrder(fx, u1, Now.AddHours(-1), OrderStatus.Received, null, (p, 1));
        AddOrder(fx, u1, Now.AddHours(-2), OrderStatus.Received, null, (p, 2));
        AddOrder(fx, Guid.NewGuid(), Now.AddHours(-3), OrderStatus.Ordered, null, (p, 1));
        AddOrder(fx, Guid.NewGuid(), Now.AddHours(-4), OrderStatus.Cancelled, null, (p, 9));
        AddOrder(fx, u1, Now.AddDays(-29).Date, OrderStatus.Received, null, (p, 1)); // first day boundary
        AddOrder(fx, u1, Now.AddDays(-30), OrderStatus.Received, null, (p, 1)); // out of range

        var chart = await new SellerAnalyticsService(fx.Db).GetChartAsync(seller, ChartPeriod.Day, Now);

        Assert.Equal("day", chart.Period);
        Assert.Equal(30, chart.Points.Count);
        Assert.Equal("2026-09-17", chart.Points[0].Label);
        Assert.Equal(10m, chart.Points[0].Amount);
        var last = chart.Points[^1];
        Assert.Equal("2026-10-16", last.Label);
        Assert.Equal(40m, last.Amount);
        Assert.Equal(3, last.OrdersCount);
        Assert.Equal(2, last.BuyersCount);
        Assert.Equal(0m, chart.Points[10].Amount);
    }

    [Fact]
    public async Task Chart_month_has_12_points_and_year_starts_from_first_sale()
    {
        using var fx = new TestDb();
        var p = fx.SeedProduct(price: 5m);
        AddOrder(fx, Guid.NewGuid(), new DateTime(2024, 3, 1, 0, 0, 0, DateTimeKind.Utc), OrderStatus.Received, null, (p, 1));
        AddOrder(fx, Guid.NewGuid(), new DateTime(2025, 11, 30, 23, 0, 0, DateTimeKind.Utc), OrderStatus.Received, null, (p, 2));

        var svc = new SellerAnalyticsService(fx.Db);
        var month = await svc.GetChartAsync(null, ChartPeriod.Month, Now);
        Assert.Equal(12, month.Points.Count);
        Assert.Equal("2025-11", month.Points[0].Label);
        Assert.Equal(10m, month.Points[0].Amount);
        Assert.Equal("2026-10", month.Points[^1].Label);

        var year = await svc.GetChartAsync(null, ChartPeriod.Year, Now);
        Assert.Equal(new[] { "2024", "2025", "2026" }, year.Points.Select(x => x.Label));
        Assert.Equal(new[] { 5m, 10m, 0m }, year.Points.Select(x => x.Amount));
    }
}
