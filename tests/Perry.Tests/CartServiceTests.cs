using Perry.Infrastructure.Services;
using Perry.Tests.Helpers;

namespace Perry.Tests;

public class CartServiceTests
{
    [Fact]
    public async Task MergeGuestToUser_moves_items_and_removes_guest_cart()
    {
        using var fx = new TestDb();
        var cart = new CartService(fx.Db);
        var product = fx.SeedProduct(stock: 5);
        var sessionId = "guest-session-1";
        var userId = Guid.NewGuid();

        await cart.AddAsync(null, sessionId, product.Id, 2);
        await cart.MergeGuestToUserAsync(sessionId, userId);

        var guestLeft = fx.Db.Carts.Any(c => c.SessionId == sessionId && c.UserId == null);
        Assert.False(guestLeft);

        var items = await cart.GetItemsAsync(userId, null);
        Assert.Single(items);
        Assert.Equal(2, items[0].Quantity);
        Assert.Equal(product.Id, items[0].ProductId);
    }

    [Fact]
    public async Task MergeGuestToUser_sums_quantity_when_product_already_in_user_cart()
    {
        using var fx = new TestDb();
        var cart = new CartService(fx.Db);
        var product = fx.SeedProduct(stock: 20);
        var sessionId = "guest-session-2";
        var userId = Guid.NewGuid();

        await cart.AddAsync(userId, null, product.Id, 1);
        await cart.AddAsync(null, sessionId, product.Id, 3);
        await cart.MergeGuestToUserAsync(sessionId, userId);

        var items = await cart.GetItemsAsync(userId, null);
        Assert.Single(items);
        Assert.Equal(4, items[0].Quantity);
    }

    [Fact]
    public async Task Add_throws_when_stock_insufficient()
    {
        using var fx = new TestDb();
        var cart = new CartService(fx.Db);
        var product = fx.SeedProduct(stock: 1);

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            cart.AddAsync(Guid.NewGuid(), null, product.Id, 2));
    }
}
