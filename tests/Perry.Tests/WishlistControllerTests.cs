using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Perry.Api.Controllers;
using Perry.Tests.Helpers;

namespace Perry.Tests;

public class WishlistControllerTests
{
    private static WishlistController CreateController(TestDb fx, Guid? userId)
    {
        var controller = new WishlistController(fx.Db);
        var identity = new ClaimsIdentity(authenticationType: userId.HasValue ? "Bearer" : null);
        if (userId.HasValue)
            identity.AddClaim(new Claim("sub", userId.Value.ToString()));

        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(identity)
            }
        };
        return controller;
    }

    [Fact]
    public async Task Mine_without_jwt_returns_401()
    {
        using var fx = new TestDb();
        var controller = CreateController(fx, userId: null);

        var result = await controller.Mine(null, CancellationToken.None);

        Assert.IsType<UnauthorizedResult>(result);
    }

    [Fact]
    public async Task Add_is_idempotent_by_user_and_product()
    {
        using var fx = new TestDb();
        var product = fx.SeedProduct();
        var userId = Guid.NewGuid();
        var controller = CreateController(fx, userId);

        var first = await controller.Add(new WishlistController.AddRequest(product.Id), CancellationToken.None);
        var second = await controller.Add(new WishlistController.AddRequest(product.Id), CancellationToken.None);

        Assert.IsType<OkObjectResult>(first);
        Assert.IsType<OkObjectResult>(second);

        var count = await fx.Db.WishlistItems.CountAsync(w => w.UserId == userId && w.ProductId == product.Id);
        Assert.Equal(1, count);
    }

    [Fact]
    public async Task Remove_deletes_item()
    {
        using var fx = new TestDb();
        var product = fx.SeedProduct();
        var userId = Guid.NewGuid();
        var controller = CreateController(fx, userId);

        await controller.Add(new WishlistController.AddRequest(product.Id), CancellationToken.None);
        var removed = await controller.Remove(product.Id, CancellationToken.None);

        Assert.IsType<NoContentResult>(removed);
        Assert.Equal(0, await fx.Db.WishlistItems.CountAsync());
    }
}
