using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Perry.Api.Auth;
using Perry.Domain.Enums;
using Perry.Infrastructure.Persistence;

namespace Perry.Api.Controllers;

/// <summary>#A21 — одна точка графика: подпись периода и агрегаты.</summary>
public sealed record ChartPoint(string Label, decimal Amount, int OrdersCount, int Customers);

/// <summary>#A21 — ответ для графиков админки.</summary>
public sealed record ChartResponse(string Period, IReadOnlyList<ChartPoint> Points);

/// <summary>
/// #A21 — данные для графиков администратора.
/// Возвращает amount, ordersCount, customers по месяцам (последние 12),
/// по дням (последние 30) и по годам (с первого заказа до текущего).
/// </summary>
[ApiController]
[Route("api/admin/stats")]
[Authorize(Roles = "Admin,Seller")]
public class AdminStatsController : ControllerBase
{
    private readonly AppDbContext _db;

    public AdminStatsController(AppDbContext db) => _db = db;

    /// <summary>
    /// GET /api/admin/stats/chart?period=months|days|years&amp;sellerId={guid}
    /// </summary>
    [HttpGet("chart")]
    public async Task<IActionResult> GetChart(
        [FromQuery] string period = "months",
        [FromQuery] Guid? sellerId = null,
        CancellationToken ct = default)
    {
        var seller = ResolveSeller(sellerId);
        if (seller == Guid.Empty) return Unauthorized();

        // Cancelled — не доход. Считаем по позициям: у продавца только его товары.
        var query = _db.OrderItems.AsNoTracking()
            .Where(i => i.Order.Status != OrderStatus.Cancelled);
        if (seller.HasValue)
            query = query.Where(i => i.Product.SellerId == seller.Value);

        period = (period ?? string.Empty).ToLowerInvariant();
        var now = DateTime.UtcNow;

        var points = period switch
        {
            "days" => await GetByDaysAsync(query, now, ct),
            "year" or "years" => await GetByYearsAsync(query, now, ct),
            _ => await GetByMonthsAsync(query, now, ct)
        };

        return Ok(new ChartResponse(period, points));
    }

    /// <summary>
    /// Admin видит всех (или конкретного sellerId), Seller — только себя.
    /// Guid.Empty = в JWT нет sub (не авторизован).
    /// </summary>
    private Guid? ResolveSeller(Guid? requestedSellerId)
    {
        if (!User.IsInRole("Seller") || User.IsInRole("Admin"))
            return requestedSellerId;

        var ownId = AuthClaims.GetUserId(User);
        return ownId ?? Guid.Empty;
    }

    private static async Task<IReadOnlyList<ChartPoint>> GetByMonthsAsync(
        IQueryable<Domain.Entities.OrderItem> query, DateTime now, CancellationToken ct)
    {
        var firstMonth = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc).AddMonths(-11);
        var rows = await LoadAsync(query, firstMonth, now, ct);

        var points = new List<ChartPoint>(12);
        for (var i = 0; i < 12; i++)
        {
            var start = firstMonth.AddMonths(i);
            var end = start.AddMonths(1);
            points.Add(BuildPoint(start.ToString("MMM"), rows, start, end));
        }
        return points;
    }

    private async Task<IReadOnlyList<ChartPoint>> GetByDaysAsync(
        IQueryable<Domain.Entities.OrderItem> query, DateTime now, CancellationToken ct)
    {
        var today = new DateTime(now.Year, now.Month, now.Day, 0, 0, 0, DateTimeKind.Utc);
        var firstDay = today.AddDays(-29);
        var rows = await LoadAsync(query, firstDay, now, ct);

        var points = new List<ChartPoint>(30);
        for (var i = 0; i < 30; i++)
        {
            var start = firstDay.AddDays(i);
            var end = start.AddDays(1);
            points.Add(BuildPoint(start.ToString("MMM dd"), rows, start, end));
        }
        return points;
    }

    private async Task<IReadOnlyList<ChartPoint>> GetByYearsAsync(
        IQueryable<Domain.Entities.OrderItem> query, DateTime now, CancellationToken ct)
    {
        var firstOrderUtc = await query
            .OrderBy(i => i.Order.OrderDateUtc)
            .Select(i => (DateTime?)i.Order.OrderDateUtc)
            .FirstOrDefaultAsync(ct);

        var firstYear = firstOrderUtc?.Year ?? now.Year;
        var start = new DateTime(firstYear, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        var rows = await LoadAsync(query, start, now, ct);

        var points = new List<ChartPoint>(now.Year - firstYear + 1);
        for (var year = firstYear; year <= now.Year; year++)
        {
            var yearStart = new DateTime(year, 1, 1, 0, 0, 0, DateTimeKind.Utc);
            points.Add(BuildPoint(year.ToString(), rows, yearStart, yearStart.AddYears(1)));
        }
        return points;
    }

    /// <summary>
    /// Один запрос на весь диапазон: суммы и уникальных покупателей считаем в памяти.
    /// Так работает и на PostgreSQL (prod), и на SQLite (тесты) без потери точности decimal.
    /// </summary>
    private static async Task<List<OrderRow>> LoadAsync(
        IQueryable<Domain.Entities.OrderItem> query, DateTime fromUtc, DateTime toUtc, CancellationToken ct)
    {
        return await query
            .Where(i => i.Order.OrderDateUtc >= fromUtc && i.Order.OrderDateUtc <= toUtc)
            .Select(i => new OrderRow(i.OrderId, i.Order.OrderDateUtc, i.TotalPrice, i.Order.UserId))
            .ToListAsync(ct);
    }

    private static ChartPoint BuildPoint(
        string label, List<OrderRow> rows, DateTime fromUtc, DateTime toUtc)
    {
        var bucket = rows.Where(r => r.OrderDateUtc >= fromUtc && r.OrderDateUtc < toUtc).ToList();
        return new ChartPoint(
            label,
            bucket.Sum(r => r.Amount),
            bucket.Select(r => r.OrderId).Distinct().Count(),
            bucket.Select(r => r.UserId).Distinct().Count());
    }

    private readonly record struct OrderRow(Guid OrderId, DateTime OrderDateUtc, decimal Amount, Guid UserId);
}
