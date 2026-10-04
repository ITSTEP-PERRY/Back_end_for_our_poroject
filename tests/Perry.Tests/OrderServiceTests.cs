using Microsoft.EntityFrameworkCore;
using Perry.Infrastructure.Services;
using Perry.Tests.Fakes;
using Perry.Tests.Helpers;

namespace Perry.Tests;

public class OrderServiceTests
{
    [Fact]
    public async Task CreateFromCart_decrements_stock_and_clears_cart()
    {
        using var fx = new TestDb();
        var cart = new CartService(fx.Db);
        var orders = new OrderService(fx.Db, cart, new NoopEmailSender(), new FakeAuthInternalClient());
        var product = fx.SeedProduct(stock: 5, price: 10m);
        var userId = Guid.NewGuid();

        await cart.AddAsync(userId, null, product.Id, 2);
        var order = await orders.CreateFromCartAsync(userId, null, recipientName: "Test", paymentType: "Cash");

        Assert.Equal(20m, order.TotalAmount);
        Assert.Equal(2, order.ItemsCount);

        var stock = await fx.Db.Products.AsNoTracking()
            .Where(p => p.Id == product.Id)
            .Select(p => p.StockQuantity)
            .SingleAsync();
        Assert.Equal(3, stock);

        var cartItems = await cart.GetItemsAsync(userId, null);
        Assert.Empty(cartItems);
    }

    [Fact]
    public async Task CreateFromCart_throws_when_cart_empty()
    {
        using var fx = new TestDb();
        var cart = new CartService(fx.Db);
        var orders = new OrderService(fx.Db, cart, new NoopEmailSender(), new FakeAuthInternalClient());

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            orders.CreateFromCartAsync(Guid.NewGuid(), null));
    }

    [Fact]
    public async Task CreateFromCart_throws_when_stock_too_low()
    {
        using var fx = new TestDb();
        var cart = new CartService(fx.Db);
        var orders = new OrderService(fx.Db, cart, new NoopEmailSender(), new FakeAuthInternalClient());
        var product = fx.SeedProduct(stock: 2);
        var userId = Guid.NewGuid();

        await cart.AddAsync(userId, null, product.Id, 2);
        product.StockQuantity = 0;
        await fx.Db.SaveChangesAsync();

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            orders.CreateFromCartAsync(userId, null));
    }
}
