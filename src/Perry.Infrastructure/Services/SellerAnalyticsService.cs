using Microsoft.EntityFrameworkCore;
using Perry.Domain.Enums;
using Perry.Infrastructure.Persistence;

namespace Perry.Infrastructure.Services;

/// <summary>#A21 / #A22 — аналитика продавца: покупатели и данные для графиков.</summary>
public interface ISellerAnalyticsService
{
    /// <param name="sellerId">null — по всем товарам (только для Admin).</param>
    Task<SellerCustomersPage> GetCustomersAsync(
        Guid? sellerId, int page, int pageSize, string? search, CancellationToken ct = default);

    /// <param name="period">day (30 дней) | month (12 месяцев) | year (от первой продажи).</param>
    Task<SellerChart> GetChartAsync(
        Guid? sellerId, ChartPeriod period, DateTime? nowUtc = null, CancellationToken ct = default);
}

public enum ChartPeriod { Day, Month, Year }

public sealed record SellerCustomerItem(
    Guid UserId,
    string? Name,
    string? Email,
    int OrdersCount,
    decimal TotalAmount,
    DateTime LastOrderAt);

public sealed record SellerCustomersPage(
    int Page, int PageSize, int TotalCount, int TotalPages, IReadOnlyList<SellerCustomerItem> Items);

public sealed record SellerChartPoint(string Label, decimal Amount, int OrdersCount, int BuyersCount);

public sealed record SellerChart(string Period, IReadOnlyList<SellerChartPoint> Points);

public sealed class SellerAnalyticsService : ISellerAnalyticsService
{
    private readonly AppDbContext _db;

    public SellerAnalyticsService(AppDbContext db) => _db = db;

    private sealed record SaleRow(Guid OrderId, Guid UserId, DateTime OrderDateUtc, string? RecipientName, decimal Amount);

    /// <summary>
    /// Позиции заказов продавца (Cancelled исключены). Сумма — по позициям продавца, не Order.TotalAmount.
    /// Агрегация в памяти: SQLite (тесты) не умеет Sum по decimal.
    /// </summary>
    private async Task<List<SaleRow>> LoadSalesAsync(Guid? sellerId, DateTime? fromUtc, CancellationToken ct)
    {
        var q = _db.OrderItems.AsNoTracking()
            .Where(i => i.Order.Status != OrderStatus.Cancelled);
        if (sellerId is { } sid)
            q = q.Where(i => i.Product.SellerId == sid);
        if (fromUtc is { } from)
            q = q.Where(i => i.Order.OrderDateUtc >= from);

        return await q
            .Select(i => new SaleRow(i.OrderId, i.Order.UserId, i.Order.OrderDateUtc, i.Order.RecipientName, i.TotalPrice))
            .ToListAsync(ct);
    }

    public async Task<SellerCustomersPage> GetCustomersAsync(
        Guid? sellerId, int page, int pageSize, string? search, CancellationToken ct = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var rows = await LoadSalesAsync(sellerId, null, ct);
        IEnumerable<SellerCustomerItem> customers = rows
            .GroupBy(r => r.UserId)
            .Select(g =>
            {
                var last = g.OrderByDescending(r => r.OrderDateUtc).First();
                return new SellerCustomerItem(
                    g.Key,
                    g.Where(r => !string.IsNullOrWhiteSpace(r.RecipientName))
                        .OrderByDescending(r => r.OrderDateUtc)
                        .Select(r => r.RecipientName)
                        .FirstOrDefault(),
                    null, // TODO(A22): email из Auth Internal — открытый вопрос к Мартынову.
                    g.Select(r => r.OrderId).Distinct().Count(),
                    g.Sum(r => r.Amount),
                    last.OrderDateUtc);
            });

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            customers = customers.Where(c =>
                (c.Name?.Contains(term, StringComparison.OrdinalIgnoreCase) ?? false)
                || (c.Email?.Contains(term, StringComparison.OrdinalIgnoreCase) ?? false));
        }

        var list = customers.OrderByDescending(c => c.LastOrderAt).ToList();
        var total = list.Count;
        var items = list.Skip((page - 1) * pageSize).Take(pageSize).ToList();
        return new SellerCustomersPage(page, pageSize, total, (int)Math.Ceiling(total / (double)pageSize), items);
    }

    public async Task<SellerChart> GetChartAsync(
        Guid? sellerId, ChartPeriod period, DateTime? nowUtc = null, CancellationToken ct = default)
    {
        var now = nowUtc ?? DateTime.UtcNow;
        var today = DateTime.SpecifyKind(now.Date, DateTimeKind.Utc);

        DateTime? from = period switch
        {
            ChartPeriod.Day => today.AddDays(-29),
            ChartPeriod.Month => new DateTime(today.Year, today.Month, 1, 0, 0, 0, DateTimeKind.Utc).AddMonths(-11),
            _ => null,
        };

        var rows = await LoadSalesAsync(sellerId, from, ct);

        Func<DateTime, string> key = period switch
        {
            ChartPeriod.Day => d => d.ToString("yyyy-MM-dd"),
            ChartPeriod.Month => d => d.ToString("yyyy-MM"),
            _ => d => d.ToString("yyyy"),
        };

        var labels = new List<string>();
        switch (period)
        {
            case ChartPeriod.Day:
                for (var d = from!.Value; d <= today; d = d.AddDays(1)) labels.Add(key(d));
                break;
            case ChartPeriod.Month:
                for (var d = from!.Value; d <= today; d = d.AddMonths(1)) labels.Add(key(d));
                break;
            default:
                var firstYear = rows.Count > 0 ? rows.Min(r => r.OrderDateUtc).Year : today.Year;
                for (var y = firstYear; y <= today.Year; y++) labels.Add(y.ToString("D4"));
                break;
        }

        var groups = rows.Where(r => r.OrderDateUtc <= now).GroupBy(r => key(r.OrderDateUtc)).ToDictionary(g => g.Key);
        var points = labels.Select(l => groups.TryGetValue(l, out var g)
                ? new SellerChartPoint(l, g.Sum(r => r.Amount), g.Select(r => r.OrderId).Distinct().Count(),
                    g.Select(r => r.UserId).Distinct().Count())
                : new SellerChartPoint(l, 0m, 0, 0))
            .ToList();

        return new SellerChart(period.ToString().ToLowerInvariant(), points);
    }
}
