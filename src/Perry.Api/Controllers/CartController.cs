using System.Security.Claims;
using Perry.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Perry.Api.Controllers;

/// <summary>REST корзина (homework Api/CartController) — sessionId или userId.</summary>
[ApiController]
[Route("api/[controller]")]
public class CartController : ControllerBase
{
    private readonly ICartService _cart;
    private readonly IOrderService _orders;

    public CartController(ICartService cart, IOrderService orders)
    {
        _cart = cart;
        _orders = orders;
    }

    [HttpGet]
    public async Task<IActionResult> Get(
        [FromQuery] Guid? userId,
        [FromQuery] string? sessionId,
        CancellationToken ct)
    {
        var items = await _cart.GetItemsAsync(userId, sessionId, ct);
        var total = await _cart.GetTotalAsync(userId, sessionId, ct);
        var count = await _cart.GetCountAsync(userId, sessionId, ct);

        return Ok(new
        {
            itemsCount = count,
            totalAmount = total,
            items = items.Select(i => new
            {
                i.Id,
                i.ProductId,
                productName = i.Product.Name,
                productPrice = i.Product.Price,
                i.Quantity,
                totalPrice = i.Quantity * i.Product.Price,
                imageUrl = i.Product.Images.FirstOrDefault(x => x.IsPrimary)?.Url
                    ?? i.Product.Images.OrderBy(x => x.SortOrder).FirstOrDefault()?.Url
            })
        });
    }

    [HttpGet("count")]
    public async Task<IActionResult> Count(
        [FromQuery] Guid? userId,
        [FromQuery] string? sessionId,
        CancellationToken ct) =>
        Ok(new { count = await _cart.GetCountAsync(userId, sessionId, ct) });

    public record AddRequest(Guid ProductId, int Quantity = 1);

    [HttpPost("add")]
    public async Task<IActionResult> Add(
        [FromBody] AddRequest body,
        [FromQuery] Guid? userId,
        [FromQuery] string? sessionId,
        CancellationToken ct)
    {
        if (userId is null && string.IsNullOrWhiteSpace(sessionId))
            return BadRequest(new { error = "Укажите userId или sessionId." });

        try
        {
            await _cart.AddAsync(userId, sessionId, body.ProductId, body.Quantity <= 0 ? 1 : body.Quantity, ct);
            return Ok(new { status = "Ok" });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    public record QtyRequest(Guid ProductId, int Quantity);

    [HttpPut("quantity")]
    public async Task<IActionResult> SetQuantity(
        [FromBody] QtyRequest body,
        [FromQuery] Guid? userId,
        [FromQuery] string? sessionId,
        CancellationToken ct)
    {
        try
        {
            await _cart.UpdateQuantityAsync(userId, sessionId, body.ProductId, body.Quantity, ct);
            return Ok(new { status = "Ok" });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpDelete("item/{productId:guid}")]
    public async Task<IActionResult> Remove(
        Guid productId,
        [FromQuery] Guid? userId,
        [FromQuery] string? sessionId,
        CancellationToken ct)
    {
        await _cart.RemoveAsync(userId, sessionId, productId, ct);
        return Ok(new { status = "Ok" });
    }

    public record MergeRequest(string SessionId);

    /// <summary>Слить гостевую корзину (sessionId) в корзину текущего пользователя после login/register.</summary>
    [Authorize]
    [HttpPost("merge")]
    public async Task<IActionResult> Merge([FromBody] MergeRequest body, CancellationToken ct)
    {
        var raw = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        if (!Guid.TryParse(raw, out var userId))
            return Unauthorized();

        if (string.IsNullOrWhiteSpace(body.SessionId))
            return BadRequest(new { error = "sessionId required" });

        await _cart.MergeGuestToUserAsync(body.SessionId, userId, ct);
        return Ok(new { status = "Ok" });
    }

    [HttpPost("checkout")]
    public async Task<IActionResult> Checkout(
        [FromQuery] Guid userId,
        [FromQuery] string? sessionId,
        CancellationToken ct)
    {
        try
        {
            var order = await _orders.CreateFromCartAsync(userId, sessionId, ct);
            return Ok(new { status = "Ok", orderId = order.Id, total = order.TotalAmount });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }
}
