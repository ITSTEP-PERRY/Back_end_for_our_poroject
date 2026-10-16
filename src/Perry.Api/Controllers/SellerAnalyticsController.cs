using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Perry.Api.Auth;
using Perry.Infrastructure.Services;

namespace Perry.Api.Controllers;

/// <summary>
/// #A21 / #A22 — аналитика продавца. Seller видит только свои товары;
/// Admin — все или конкретного продавца через <c>sellerId</c>.
/// </summary>
[ApiController]
[Route("api/admin")]
[Authorize(Roles = "Admin,Seller")]
public class SellerAnalyticsController : ControllerBase
{
    private readonly ISellerAnalyticsService _analytics;

    public SellerAnalyticsController(ISellerAnalyticsService analytics) => _analytics = analytics;

    private bool TryResolveSeller(Guid? requested, out Guid? sellerId)
    {
        if (User.IsInRole("Admin"))
        {
            sellerId = requested;
            return true;
        }
        sellerId = AuthClaims.GetUserId(User);
        return sellerId is not null;
    }

    /// <summary>#A22 — покупатели продавца (без Cancelled), сортировка по lastOrderAt desc.</summary>
    /// <param name="page">Страница (с 1).</param>
    /// <param name="pageSize">Размер страницы (1–100).</param>
    /// <param name="search">Поиск по имени/email.</param>
    /// <param name="sellerId">Только для Admin.</param>
    /// <param name="ct">Cancellation.</param>
    [HttpGet("customers")]
    public async Task<IActionResult> GetCustomers(
        [FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? search = null,
        [FromQuery] Guid? sellerId = null, CancellationToken ct = default)
    {
        if (!TryResolveSeller(sellerId, out var sid))
            return Unauthorized(new { error = "SellerId (JWT sub) required." });
        return Ok(await _analytics.GetCustomersAsync(sid, page, pageSize, search, ct));
    }

    /// <summary>#A21 — данные для графиков: amount, ordersCount, buyersCount (UTC, без Cancelled, пустые периоды = 0).</summary>
    /// <param name="period">day (30 дней) | month (12 месяцев) | year (от первой продажи).</param>
    /// <param name="sellerId">Только для Admin.</param>
    /// <param name="ct">Cancellation.</param>
    [HttpGet("statistics/chart")]
    public async Task<IActionResult> GetChart(
        [FromQuery] string period = "month", [FromQuery] Guid? sellerId = null, CancellationToken ct = default)
    {
        if (!Enum.TryParse<ChartPeriod>(period, ignoreCase: true, out var p) || int.TryParse(period, out _))
            return Problem(statusCode: StatusCodes.Status400BadRequest,
                title: "Invalid period", detail: "period must be day | month | year.");
        if (!TryResolveSeller(sellerId, out var sid))
            return Unauthorized(new { error = "SellerId (JWT sub) required." });
        return Ok(await _analytics.GetChartAsync(sid, p, null, ct));
    }
}
