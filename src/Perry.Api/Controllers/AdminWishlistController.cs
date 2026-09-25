using System.Globalization;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Perry.Infrastructure.Persistence;

namespace Perry.Api.Controllers;

/// <summary>
/// Wishlist-статистика для админа/продавца (#91).
/// Пользовательский CRUD — /api/wishlist (One User → Many products).
/// </summary>
[ApiController]
[Route("api/admin/wishlist")]
[Authorize(Roles = "Admin")]
public class AdminWishlistController : ControllerBase
{
    private readonly AppDbContext _db;

    public AdminWishlistController(AppDbContext db) => _db = db;

    /// <summary>
    /// Статистика wishlist по товару: сколько пользователей добавили + по месяцам.
    /// GET /api/admin/wishlist/products/{productId}/stats?year=2026
    /// </summary>
    [HttpGet("products/{productId:guid}/stats")]
    public async Task<IActionResult> ProductStats(
        Guid productId,
        [FromQuery] int? year = null,
        CancellationToken ct = default)
    {
        var productExists = await _db.Products.AsNoTracking().AnyAsync(p => p.Id == productId, ct);
        if (!productExists) return NotFound(new { error = "Товар не найден." });

        var y = year ?? DateTime.UtcNow.Year;

        var items = await _db.WishlistItems.AsNoTracking()
            .Where(w => w.ProductId == productId)
            .Select(w => new { w.UserId, w.CreatedAtUtc })
            .ToListAsync(ct);

        var wishlistUserCount = items.Select(i => i.UserId).Distinct().Count();
        var firstAddedAtUtc = items.Count == 0 ? (DateTime?)null : items.Min(i => i.CreatedAtUtc);
        var lastAddedAtUtc = items.Count == 0 ? (DateTime?)null : items.Max(i => i.CreatedAtUtc);

        var byMonth = Enumerable.Range(1, 12)
            .Select(month =>
            {
                var count = items.Count(i => i.CreatedAtUtc.Year == y && i.CreatedAtUtc.Month == month);
                var name = CultureInfo.InvariantCulture.DateTimeFormat.GetMonthName(month);
                return new
                {
                    year = y,
                    month,
                    monthName = name,
                    label = $"{name} → {count}",
                    count
                };
            })
            .Where(x => x.count > 0 || year.HasValue)
            .ToList();

        // If no year filter requested, also return compact non-zero months across all years.
        object monthly;
        if (year.HasValue)
        {
            monthly = byMonth;
        }
        else
        {
            monthly = items
                .GroupBy(i => new { i.CreatedAtUtc.Year, i.CreatedAtUtc.Month })
                .OrderBy(g => g.Key.Year).ThenBy(g => g.Key.Month)
                .Select(g =>
                {
                    var name = CultureInfo.InvariantCulture.DateTimeFormat.GetMonthName(g.Key.Month);
                    var count = g.Count();
                    return new
                    {
                        year = g.Key.Year,
                        month = g.Key.Month,
                        monthName = name,
                        label = $"{name} {g.Key.Year} → {count}",
                        count
                    };
                })
                .ToList();
        }

        return Ok(new
        {
            productId,
            wishlistUserCount,
            totalAdds = items.Count,
            firstAddedAtUtc,
            lastAddedAtUtc,
            byMonth = monthly
        });
    }

    /// <summary>
    /// Сводка: товары с числом пользователей в wishlist (топ).
    /// GET /api/admin/wishlist/summary?take=20
    /// </summary>
    [HttpGet("summary")]
    public async Task<IActionResult> Summary([FromQuery] int take = 20, CancellationToken ct = default)
    {
        if (take < 1) take = 20;
        if (take > 100) take = 100;

        var rows = await _db.WishlistItems.AsNoTracking()
            .GroupBy(w => w.ProductId)
            .Select(g => new
            {
                productId = g.Key,
                wishlistUserCount = g.Select(x => x.UserId).Distinct().Count(),
                totalAdds = g.Count(),
                firstAddedAtUtc = g.Min(x => x.CreatedAtUtc),
                lastAddedAtUtc = g.Max(x => x.CreatedAtUtc)
            })
            .OrderByDescending(x => x.wishlistUserCount)
            .ThenByDescending(x => x.totalAdds)
            .Take(take)
            .ToListAsync(ct);

        var productIds = rows.Select(r => r.productId).ToList();
        var products = await _db.Products.AsNoTracking()
            .Where(p => productIds.Contains(p.Id))
            .Select(p => new
            {
                p.Id,
                p.Name,
                p.Brand,
                p.Slug,
                ImageUrl = p.Images.Where(i => i.IsPrimary).Select(i => i.Url).FirstOrDefault()
                    ?? p.Images.OrderBy(i => i.SortOrder).Select(i => i.Url).FirstOrDefault()
            })
            .ToDictionaryAsync(p => p.Id, ct);

        var items = rows.Select(r =>
        {
            products.TryGetValue(r.productId, out var p);
            return new
            {
                r.productId,
                name = p?.Name,
                brand = p?.Brand,
                slug = p?.Slug,
                imageUrl = p?.ImageUrl,
                r.wishlistUserCount,
                r.totalAdds,
                r.firstAddedAtUtc,
                r.lastAddedAtUtc
            };
        });

        return Ok(new { take = rows.Count, items });
    }

    /// <summary>
    /// Глобальная статистика добавлений в wishlist по месяцам.
    /// GET /api/admin/wishlist/monthly?year=2026
    /// Пример ответа: June → 20
    /// </summary>
    [HttpGet("monthly")]
    public async Task<IActionResult> Monthly([FromQuery] int? year = null, CancellationToken ct = default)
    {
        var y = year ?? DateTime.UtcNow.Year;
        var items = await _db.WishlistItems.AsNoTracking()
            .Where(w => w.CreatedAtUtc.Year == y)
            .Select(w => w.CreatedAtUtc)
            .ToListAsync(ct);

        var byMonth = Enumerable.Range(1, 12)
            .Select(month =>
            {
                var count = items.Count(d => d.Month == month);
                var name = CultureInfo.InvariantCulture.DateTimeFormat.GetMonthName(month);
                return new
                {
                    year = y,
                    month,
                    monthName = name,
                    label = $"{name} → {count}",
                    count
                };
            })
            .ToList();

        return Ok(new { year = y, total = items.Count, byMonth });
    }
}
