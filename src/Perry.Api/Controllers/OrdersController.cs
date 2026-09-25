using System.Security.Claims;
using Perry.Domain.Enums;
using Perry.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Perry.Api.Controllers;

[ApiController]
[Route("api/orders")]
public class OrdersController : ControllerBase
{
    private readonly IOrderService _orders;

    public OrdersController(IOrderService orders) => _orders = orders;

    public record CheckoutRequest(string? SessionId);
    public record StatusRequest(string Status);

    [Authorize]
    [HttpGet]
    public async Task<IActionResult> Mine(CancellationToken ct)
    {
        var userId = GetUserId();
        if (userId is null) return Unauthorized();

        var list = await _orders.GetUserOrdersAsync(userId.Value, ct);
        return Ok(list.Select(MapOrder));
    }

    [Authorize]
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> ById(Guid id, CancellationToken ct)
    {
        var userId = GetUserId();
        if (userId is null) return Unauthorized();

        var isAdmin = User.IsInRole("Admin");
        var order = await _orders.GetByIdAsync(id, isAdmin ? null : userId, ct);
        return order is null ? NotFound() : Ok(MapOrder(order));
    }

    [Authorize]
    [HttpPost("checkout")]
    public async Task<IActionResult> Checkout([FromBody] CheckoutRequest body, CancellationToken ct)
    {
        var userId = GetUserId();
        if (userId is null) return Unauthorized();

        try
        {
            var order = await _orders.CreateFromCartAsync(userId.Value, body.SessionId, ct);
            return Ok(MapOrder(order));
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [Authorize(Roles = "Admin")]
    [HttpGet("admin")]
    public async Task<IActionResult> All(
        [FromQuery] string? status,
        [FromQuery] DateTime? fromUtc,
        [FromQuery] DateTime? toUtc,
        [FromQuery] string? orderId,
        CancellationToken ct)
    {
        OrderStatus? parsed = null;
        if (!string.IsNullOrWhiteSpace(status))
        {
            if (!Enum.TryParse<OrderStatus>(status, true, out var s))
                return BadRequest(new
                {
                    error = "Неизвестный статус.",
                    allowed = Enum.GetNames<OrderStatus>()
                });
            parsed = s;
        }

        var result = await _orders.GetAdminOrdersAsync(new AdminOrdersQuery
        {
            Status = parsed,
            FromUtc = fromUtc,
            ToUtc = toUtc,
            OrderId = orderId
        }, ct);

        return Ok(new
        {
            items = result.Items.Select(o => new
            {
                o.Id,
                orderDateUtc = o.OrderDateUtc,
                status = o.Status.ToString(),
                totalAmount = o.TotalAmount,
                itemsCount = o.Items.Count,
                userName = o.User?.Name,
                items = o.Items.Select(i => new
                {
                    i.ProductId,
                    productName = i.ProductName,
                    i.Quantity,
                    unitPrice = i.ProductPrice
                })
            }),
            totalOrders = result.TotalOrders,
            totalAmount = result.TotalAmount,
            statusCounts = result.StatusCounts,
            totalOrderCompare = result.TotalOrderCompare,
            totalAmountCompare = result.TotalAmountCompare,
            period = result.PeriodFromUtc is null && result.PeriodToUtc is null
                ? null
                : new { fromUtc = result.PeriodFromUtc, toUtc = result.PeriodToUtc },
            comparePeriod = result.CompareFromUtc is null
                ? null
                : new { fromUtc = result.CompareFromUtc, toUtc = result.CompareToUtc }
        });
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("{id:guid}/status")]
    public async Task<IActionResult> SetStatus(Guid id, [FromBody] StatusRequest body, CancellationToken ct)
    {
        if (!Enum.TryParse<OrderStatus>(body.Status, true, out var status))
            return BadRequest(new { error = "Неизвестный статус." });

        await _orders.UpdateStatusAsync(id, status, ct);
        return Ok(new { status = "Ok" });
    }

    private static object MapOrder(Domain.Entities.Order o) => new
    {
        o.Id,
        orderDateUtc = o.OrderDateUtc,
        status = o.Status.ToString(),
        totalAmount = o.TotalAmount,
        itemsCount = o.ItemsCount > 0 ? o.ItemsCount : o.Items.Count,
        userName = o.User?.Name,
        recipientName = o.RecipientName ?? o.User?.Name,
        shippingAddress = o.ShippingAddress,
        paymentType = o.PaymentType ?? "Cash",
        items = o.Items.Select(i => new
        {
            i.ProductId,
            productName = i.ProductName,
            productDescription = i.ProductDescription,
            i.Quantity,
            unitPrice = i.ProductPrice,
            lineTotal = i.TotalPrice,
            imageUrl = i.ProductImageUrl
        })
    };

    private Guid? GetUserId()
    {
        var raw = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        return Guid.TryParse(raw, out var id) ? id : null;
    }
}
