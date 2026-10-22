using Microsoft.EntityFrameworkCore;
using Perry.Domain.Enums;
using Perry.Infrastructure.Persistence;

namespace Perry.Infrastructure.Services;

/// <summary>#A21 / #A22 - аналитика продавца: покупатели и данные для графиков.</summary>
public interface ISellerAnalyticsService
{
    /// <param name="sellerId">null - по всем товарам (только для Admin).</param>
    Task<SellerCustomersPage> GetCustomersAsync(
        Guid? sellerId, int page, int pageSize, string? search, CancellationToken ct = default);

    /// <param name="period">day (30 дней) | month (12 месяцев) | year (с первой продажи).</param>
    /// <param name="status">Фильтр по статусу заказа (null - все).</param>
    /// <param name="wholeOrderAmount">true (Admin) - amount по Order.TotalAmount; false (Seller) - по позициям продавца.</param>
    Task<SellerChart> GetChartAsync(
        Guid? sellerId, ChartPeriod period, DateTime? nowUtc = null, CancellationToken ct = default,
        OrderStatus? status = null, bool wholeOrderAmount = false);
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

/// <summary>
/// Точка графика. Day - "yyyy-MM-dd" (только period=day), Month - 0..11, январь = 0 (только period=month),
/// Year - год точки. Statuses - число разных заказов по каждому статусу (все 6 ключей, ключи = имена enum).
/// </summary>
public sealed record SellerChartPoint(
    string Label, decimal Amount, int OrdersCount, int BuyersCount,
    string? Day, int? Month, int Year,
    IReadOnlyDictionary<string, int> Statuses);

public sealed record SellerChart(string Period, IReadOnlyList<SellerChartPoint> Points);

public sealed class SellerAnalyticsService : ISellerAnalyticsService
{
    private readonly AppDbContext _db;

    public SellerAnalyticsService(AppDbContext db) => _db = db;

    private sealed record SaleRow(Guid OrderId, Guid UserId, DateTime OrderDateUtc, string? RecipientName,
        decimal Amount, OrderStatus Status, decimal OrderTotal);

    /// <summary>
    /// Позиции заказов продавца. Amount - по позициям продавца, OrderTotal - Order.TotalAmount.
    /// Агрегация в памяти: SQLite (тесты) не умеет Sum по decimal.
    /// </summary>
    private async Task<List<SaleRow>> LoadSalesAsync(Guid? sellerId, DateTime? fromUtc, bool includeCancelled, CancellationToken ct)
    {
        var q = _db.OrderItems.AsNoTracking().AsQueryable();
        if (!includeCancelled)
            q = q.Where(i => i.Order.Status != OrderStatus.Cancelled);
        if (sellerId is { } sid)
            q = q.Where(i => i.Product.SellerId == sid);
        if (fromUtc is { } from)
            q = q.Where(i => i.Order.OrderDateUtc >= from);

        return await q
            .Select(i => new SaleRow(i.OrderId, i.Order.UserId, i.Order.OrderDateUtc, i.Order.RecipientName,
                i.TotalPrice, i.Order.Status, i.Order.TotalAmount))
            .ToListAsync(ct);
    }

    /// <summary>#A22: Cancelled и Returned включены (ответ Мартынова 17.10).</summary>
    public async Task<SellerCustomersPage> GetCustomersAsync(
        Guid? sellerId, int page, int pageSize, string? search, CancellationToken ct = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var rows = await LoadSalesAsync(sellerId, null, includeCancelled: true, ct);
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
                    null, // TODO(A22): email из Auth Internal - вопрос у Мартынова (Reviewing).
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
        Guid? sellerId, ChartPeriod period, DateTime? nowUtc = null, CancellationToken ct = default,
        OrderStatus? status = null, bool wholeOrderAmount = false)
    {
        var now = nowUtc ?? DateTime.UtcNow;
        var today = DateTime.SpecifyKind(now.Date, DateTimeKind.Utc);

        DateTime? from = period switch
        {
            ChartPeriod.Day => today.AddDays(-29),
            ChartPeriod.Month => new DateTime(today.Year, today.Month, 1, 0, 0, 0, DateTimeKind.Utc).AddMonths(-11),
            _ => null,
        };

        var rows = await LoadSalesAsync(sellerId, from, includeCancelled: true, ct);
        rows = rows.Where(r => r.OrderDateUtc <= now).ToList();
        if (status is { } st)
            rows = rows.Where(r => r.Status == st).ToList();

        Func<DateTime, DateTime> bucket = period switch
        {
            ChartPeriod.Day => d => DateTime.SpecifyKind(d.Date, DateTimeKind.Utc),
            ChartPeriod.Month => d => new DateTime(d.Year, d.Month, 1, 0, 0, 0, DateTimeKind.Utc),
            _ => d => new DateTime(d.Year, 1, 1, 0, 0, 0, DateTimeKind.Utc),
        };

        var starts = new List<DateTime>();
        switch (period)
        {
            case ChartPeriod.Day:
                for (var d = from!.Value; d <= today; d = d.AddDays(1)) starts.Add(d);
                break;
            case ChartPeriod.Month:
                for (var d = from!.Value; d <= today; d = d.AddMonths(1)) starts.Add(d);
                break;
            default:
                var firstYear = rows.Count > 0 ? rows.Min(r => r.OrderDateUtc).Year : today.Year;
                for (var y = firstYear; y <= today.Year; y++) starts.Add(new DateTime(y, 1, 1, 0, 0, 0, DateTimeKind.Utc));
                break;
        }

        var groups = rows.GroupBy(r => bucket(r.OrderDateUtc)).ToDictionary(g => g.Key, g => g.ToList());
        var points = starts.Select(s =>
        {
            var g = groups.TryGetValue(s, out var list) ? list : new List<SaleRow>();
            // Без фильтра статуса amount/ordersCount/buyersCount считаются без Cancelled; statuses - по всем.
            var money = status is null ? g.Where(r => r.Status != OrderStatus.Cancelled).ToList() : g;
            var amount = wholeOrderAmount
                ? money.GroupBy(r => r.OrderId).Sum(x => x.First().OrderTotal)
                : money.Sum(r => r.Amount);
            var statuses = Enum.GetValues<OrderStatus>().ToDictionary(
                x => x.ToString(),
                x => g.Where(r => r.Status == x).Select(r => r.OrderId).Distinct().Count());
            return new SellerChartPoint(
                period switch
                {
                    ChartPeriod.Day => s.ToString("yyyy-MM-dd"),
                    ChartPeriod.Month => s.ToString("yyyy-MM"),
                    _ => s.ToString("yyyy"),
                },
                amount,
                money.Select(r => r.OrderId).Distinct().Count(),
                money.Select(r => r.UserId).Distinct().Count(),
                period == ChartPeriod.Day ? s.ToString("yyyy-MM-dd") : null,
                period == ChartPeriod.Month ? s.Month - 1 : null,
                s.Year,
                statuses);
        }).ToList();

        return new SellerChart(period.ToString().ToLowerInvariant(), points);
    }
}
