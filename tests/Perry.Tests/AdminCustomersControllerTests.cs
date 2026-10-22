using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Perry.Api.Controllers;
using Perry.Domain.Entities;
using Perry.Domain.Enums;
using Perry.Infrastructure.Services;
using Perry.Tests.Fakes;
using Perry.Tests.Helpers;

namespace Perry.Tests;

public class AdminCustomersControllerTests
{
    private static readonly JsonSerializerOptions JsonWeb = new(JsonSerializerDefaults.Web);

    private static AdminCustomersController CreateController(TestDb fx, Guid? sellerId, IAuthInternalClient auth)
    {
        var controller = new AdminCustomersController(fx.Db, auth);
        var identity = new ClaimsIdentity("Bearer", "sub", "role");
        identity.AddClaim(new Claim("sub", (sellerId ?? Guid.NewGuid()).ToString()));
        identity.AddClaim(new Claim("role", sellerId.HasValue ? "Seller" : "Admin"));

        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal(identity) }
        };
        return controller;
    }

    private static void SeedOrder(TestDb fx, Product product, Guid userId, decimal total,
        OrderStatus status = OrderStatus.ReadyToPickup)
    {
        var order = new Order
        {
            Id = Guid.NewGuid(),
            OrderNumber = "T" + Guid.NewGuid().ToString("N")[..6].ToUpperInvariant(),
            UserId = userId,
            OrderDateUtc = DateTime.UtcNow,
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

    private static JsonElement Customers(IActionResult result)
    {
        var ok = Assert.IsType<OkObjectResult>(result);
        return JsonDocument.Parse(JsonSerializer.Serialize(ok.Value, JsonWeb)).RootElement.GetProperty("customers");
    }

    [Fact]
    public async Task Seller_gets_only_own_customers_with_totals()
    {
        using var fx = new TestDb();
        var seller = Guid.NewGuid();
        var own = fx.SeedProduct(price: 20m, sellerId: seller);
        var foreign = fx.SeedProduct(price: 50m, sellerId: Guid.NewGuid());
        var ownCustomer = Guid.NewGuid();
        var foreignCustomer = Guid.NewGuid();
        SeedOrder(fx, own, ownCustomer, 20m);
        SeedOrder(fx, own, ownCustomer, 20m);
        SeedOrder(fx, foreign, foreignCustomer, 50m);

        var auth = new FakeAuthInternalClient { IsConfigured = false };
        var customers = Customers(await CreateController(fx, seller, auth).GetCustomers(null, CancellationToken.None));

        Assert.Equal(1, customers.GetArrayLength());
        var row = customers[0];
        Assert.Equal(ownCustomer, row.GetProperty("userId").GetGuid());
        Assert.Equal(2, row.GetProperty("totalOrders").GetInt32());
        Assert.Equal(40m, row.GetProperty("totalSpent").GetDecimal());
    }

    [Fact]
    public async Task Admin_gets_all_customers()
    {
        using var fx = new TestDb();
        var a = fx.SeedProduct(price: 20m, sellerId: Guid.NewGuid());
        var b = fx.SeedProduct(price: 50m, sellerId: Guid.NewGuid());
        SeedOrder(fx, a, Guid.NewGuid(), 20m);
        SeedOrder(fx, b, Guid.NewGuid(), 50m);

        var customers = Customers(await CreateController(fx, null, new FakeAuthInternalClient())
            .GetCustomers(null, CancellationToken.None));

        Assert.Equal(2, customers.GetArrayLength());
    }

    [Fact]
    public async Task Admin_can_request_one_seller()
    {
        using var fx = new TestDb();
        var seller = Guid.NewGuid();
        var own = fx.SeedProduct(price: 20m, sellerId: seller);
        var foreign = fx.SeedProduct(price: 50m, sellerId: Guid.NewGuid());
        SeedOrder(fx, own, Guid.NewGuid(), 20m);
        SeedOrder(fx, foreign, Guid.NewGuid(), 50m);

        var customers = Customers(await CreateController(fx, null, new FakeAuthInternalClient())
            .GetCustomers(seller, CancellationToken.None));

        Assert.Equal(1, customers.GetArrayLength());
        Assert.Equal(20m, customers[0].GetProperty("totalSpent").GetDecimal());
    }

    [Fact]
    public async Task Customers_are_enriched_from_auth_when_configured()
    {
        using var fx = new TestDb();
        var seller = Guid.NewGuid();
        var product = fx.SeedProduct(price: 20m, sellerId: seller);
        var customerId = Guid.NewGuid();
        SeedOrder(fx, product, customerId, 20m);

        var auth = new FakeAuthInternalClient
        {
            IsConfigured = true,
            User = new AuthInternalUserDto
            {
                Id = customerId,
                FirstName = "Test",
                LastName = "Buyer",
                Email = "buyer@example.com"
            }
        };

        var customers = Customers(await CreateController(fx, seller, auth).GetCustomers(null, CancellationToken.None));

        var row = customers[0];
        Assert.Equal("Test Buyer", row.GetProperty("name").GetString());
        Assert.Equal("buyer@example.com", row.GetProperty("email").GetString());
    }

    [Fact]
    public async Task Cancelled_orders_do_not_make_a_customer()
    {
        using var fx = new TestDb();
        var seller = Guid.NewGuid();
        var product = fx.SeedProduct(price: 20m, sellerId: seller);
        SeedOrder(fx, product, Guid.NewGuid(), 20m, OrderStatus.Cancelled);

        var customers = Customers(await CreateController(fx, seller, new FakeAuthInternalClient())
            .GetCustomers(null, CancellationToken.None));

        Assert.Equal(0, customers.GetArrayLength());
    }

    [Fact]
    public async Task Seller_totals_count_only_own_items_in_mixed_order()
    {
        using var fx = new TestDb();
        var seller = Guid.NewGuid();
        var own = fx.SeedProduct(price: 30m, sellerId: seller);
        var foreign = fx.SeedProduct(price: 70m, sellerId: Guid.NewGuid());
        var customer = Guid.NewGuid();
        var order = new Order
        {
            Id = Guid.NewGuid(),
            OrderNumber = "MIX2",
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

        var customers = Customers(await CreateController(fx, seller, new FakeAuthInternalClient())
            .GetCustomers(null, CancellationToken.None));

        Assert.Equal(1, customers.GetArrayLength());
        Assert.Equal(30m, customers[0].GetProperty("totalSpent").GetDecimal());
        Assert.Equal(1, customers[0].GetProperty("totalOrders").GetInt32());
    }
}
