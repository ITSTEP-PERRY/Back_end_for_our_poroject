using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Perry.Infrastructure.Persistence;

namespace Perry.Api.Controllers;

/// <summary>
/// #A07 — для админа: популярные товары пользователя (по заказам + wishlist).
/// </summary>
[ApiController]
[Route("api/admin/users")]
[Authorize(Roles = "Admin")]
public class AdminUserProductsController : ControllerBase
{
    private readonly AppDbContext _db;

    public AdminUserProductsController(AppDbContext db) => _db = db;

    /// <summary>
    /// GET /api/admin/users/{userId}/popular-products?take=10
    /// Ранжирование: сумма Quantity в заказах (вес 10) + наличие в wishlist (вес 3).
    /// </summary>
    [HttpGet("{userId:guid}/popular-products")]
    public async Task<IActionResult> PopularByUser(Guid userId, [FromQuery] int take = 10, CancellationToken ct = default)
    {
        take = Math.Clamp(take, 1, 50);

        var orderAgg = await _db.OrderItems.AsNoTracking()
            .Where(i => i.Order.UserId == userId)
            .GroupBy(i => i.ProductId)
            .Select(g => new { ProductId = g.Key, Qty = g.Sum(x => x.Quantity) })
            .ToListAsync(ct);

        var wishlistIds = await _db.WishlistItems.AsNoTracking()
            .Where(w => w.UserId == userId)
            .Select(w => w.ProductId)
            .ToListAsync(ct);

        var scores = new Dictionary<Guid, int>();
        foreach (var o in orderAgg)
            scores[o.ProductId] = o.Qty * 10;
        foreach (var wid in wishlistIds)
            scores[wid] = scores.GetValueOrDefault(wid) + 3;

        if (scores.Count == 0)
            return Ok(new { userId, items = Array.Empty<object>() });

        var topIds = scores.OrderByDescending(kv => kv.Value).Take(take).Select(kv => kv.Key).ToList();
        var products = await _db.Products.AsNoTracking()
            .Include(p => p.Images)
            .Where(p => topIds.Contains(p.Id))
            .ToListAsync(ct);

        var items = topIds
            .Select(id => products.FirstOrDefault(p => p.Id == id))
            .Where(p => p is not null)
            .Select(p =>
            {
                var img = p!.Images.FirstOrDefault(i => i.IsPrimary)?.Url
                    ?? p.Images.OrderBy(i => i.SortOrder).FirstOrDefault()?.Url;
                var orderQty = orderAgg.FirstOrDefault(o => o.ProductId == p.Id)?.Qty ?? 0;
                var inWishlist = wishlistIds.Contains(p.Id);
                return new
                {
                    p.Id,
                    p.Name,
                    p.Slug,
                    p.Brand,
                    p.Price,
                    p.OldPrice,
                    p.AverageRating,
                    p.ReviewCount,
                    p.ViewCount,
                    p.OrderCount,
                    imageUrl = img,
                    score = scores[p.Id],
                    orderedQuantity = orderQty,
                    inWishlist
                };
            })
            .ToList();

        return Ok(new { userId, items });
    }
}
