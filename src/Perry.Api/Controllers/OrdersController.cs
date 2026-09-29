using Perry.Api.Auth;
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
    private readonly IAuthInternalClient _authInternal;

    public OrdersController(IOrderService orders, IAuthInternalClient authInternal)
    {
        _orders = orders;
        _authInternal = authInternal;
    }

    public record CheckoutRequest(
        string? SessionId,
        string? ShippingAddress,
        string? PaymentType,
        string? RecipientName);
    public record StatusRequest(string Status);

    [Authorize]
    [HttpGet]
    public async Task<IActionResult> Mine(CancellationToken ct)
    {
        var userId = AuthClaims.GetUserId(User);
        if (userId is null) return Unauthorized();

        var list = await _orders.GetUserOrdersAsync(userId.Value, ct);
        return Ok(list.Select(MapOrder));
    }

    [Authorize]
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> ById(Guid id, CancellationToken ct)
    {
        var userId = AuthClaims.GetUserId(User);
        if (userId is null) return Unauthorized();

        var isAdmin = User.IsInRole("Admin");
        var order = await _orders.GetByIdAsync(id, isAdmin ? null : userId, ct);
        return order is null ? NotFound() : Ok(MapOrder(order));
    }

    [Authorize]
    [HttpPost("checkout")]
    public async Task<IActionResult> Checkout([FromBody] CheckoutRequest body, CancellationToken ct)
    {
        var userId = AuthClaims.GetUserId(User);
        if (userId is null) return Unauthorized();

        try
        {
            var order = await _orders.CreateFromCartAsync(
                userId.Value,
                body.SessionId,
                body.RecipientName ?? AuthClaims.GetDisplayName(User) ?? AuthClaims.GetEmail(User),
                body.ShippingAddress,
                body.PaymentType,
                ct);
            return Ok(MapOrder(order));
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Admin orders (#A09): pagination, productId/userId, sort by totalAmount,
    /// search (shipping / product name / sku / recipient≈email), paymentType.
    /// Items shape includes the same fields as <see cref="Mine"/>.
    /// </summary>
    [Authorize(Roles = "Admin")]
    [HttpGet("admin")]
    public async Task<IActionResult> All(
        [FromQuery] string? status,
        [FromQuery] DateTime? fromUtc,
        [FromQuery] DateTime? toUtc,
        [FromQuery] string? orderId,
        [FromQuery] Guid? productId,
        [FromQuery] Guid? userId,
        [FromQuery] string? paymentType,
        [FromQuery] string? q,
        [FromQuery] string? search,
        [FromQuery] string? sortBy,
        [FromQuery] bool sortDesc = true,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
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
            OrderId = orderId,
            ProductId = productId,
            UserId = userId,
            PaymentType = paymentType,
            Search = search ?? q,
            SortBy = sortBy,
            SortDesc = sortDesc,
            Page = page,
            PageSize = pageSize
        }, ct);

        var nameByUser = new Dictionary<Guid, string>();
        var emailByUser = new Dictionary<Guid, string>();
        if (_authInternal.IsConfigured)
        {
            foreach (var uid in result.Items.Select(o => o.UserId).Distinct())
            {
                var u = await _authInternal.GetUserAsync(uid, ct);
                if (u?.DisplayName is { Length: > 0 } n)
                    nameByUser[uid] = n;
                if (u?.Email is { Length: > 0 } e)
                    emailByUser[uid] = e;
            }
        }

        return Ok(new
        {
            items = result.Items.Select(o => MapAdminOrder(o, nameByUser, emailByUser)),
            page = result.Page,
            pageSize = result.PageSize,
            totalPages = result.TotalPages,
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
        userId = o.UserId,
        orderDateUtc = o.OrderDateUtc,
        status = o.Status.ToString(),
        totalAmount = o.TotalAmount,
        itemsCount = o.ItemsCount > 0 ? o.ItemsCount : o.Items.Count,
        userName = o.RecipientName,
        recipientName = o.RecipientName,
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

    private static object MapAdminOrder(
        Domain.Entities.Order o,
        IReadOnlyDictionary<Guid, string> nameByUser,
        IReadOnlyDictionary<Guid, string> emailByUser) => new
    {
        o.Id,
        userId = o.UserId,
        orderDateUtc = o.OrderDateUtc,
        status = o.Status.ToString(),
        totalAmount = o.TotalAmount,
        itemsCount = o.ItemsCount > 0 ? o.ItemsCount : o.Items.Count,
        userName = !string.IsNullOrWhiteSpace(o.RecipientName)
            ? o.RecipientName
            : nameByUser.GetValueOrDefault(o.UserId),
        recipientName = o.RecipientName,
        userEmail = emailByUser.GetValueOrDefault(o.UserId),
        shippingAddress = o.ShippingAddress,
        paymentType = o.PaymentType ?? "Cash",
        completedAtUtc = o.CompletedAtUtc,
        createdAtUtc = o.CreatedAtUtc,
        updatedAtUtc = o.UpdatedAtUtc,
        items = o.Items.Select(i => new
        {
            i.ProductId,
            productName = i.ProductName,
            productDescription = i.ProductDescription,
            i.Quantity,
            unitPrice = i.ProductPrice,
            lineTotal = i.TotalPrice,
            imageUrl = i.ProductImageUrl,
            categoryName = i.CategoryName
        })
    };
}
