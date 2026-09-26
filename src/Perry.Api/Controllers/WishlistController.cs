using System.Security.Claims;
using Perry.Domain.Entities;
using Perry.Domain.Enums;
using Perry.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Perry.Api.Controllers;

[ApiController]
[Route("api/wishlist")]
[Authorize]
public class WishlistController : ControllerBase
{
    private readonly AppDbContext _db;

    public WishlistController(AppDbContext db) => _db = db;

    public record AddRequest(Guid ProductId);

    [HttpGet]
    public async Task<IActionResult> Mine([FromQuery] string? search, CancellationToken ct)
    {
        var userId = GetUserId();
        if (userId is null) return Unauthorized();

        var q = _db.WishlistItems
            .AsNoTracking()
            .Include(w => w.Product)
                .ThenInclude(p => p.Images)
            .Where(w => w.UserId == userId);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLowerInvariant();
            q = q.Where(w => w.Product.Name.ToLower().Contains(s) || w.Product.Brand.ToLower().Contains(s));
        }

        var items = await q
            .OrderByDescending(w => w.CreatedAtUtc)
            .Select(w => new
            {
                w.Id,
                w.ProductId,
                product = new
                {
                    id = w.Product.Id,
                    name = w.Product.Name,
                    brand = w.Product.Brand,
                    price = w.Product.Price,
                    oldPrice = w.Product.OldPrice,
                    averageRating = w.Product.AverageRating,
                    reviewCount = w.Product.ReviewCount,
                    status = w.Product.Status.ToString(),
                    imageUrl = w.Product.Images
                        .OrderByDescending(i => i.IsPrimary)
                        .ThenBy(i => i.SortOrder)
                        .Select(i => i.Url)
                        .FirstOrDefault()
                },
                createdAtUtc = w.CreatedAtUtc
            })
            .ToListAsync(ct);

        var mapped = items.Select(w => new
        {
            w.Id,
            w.ProductId,
            product = new
            {
                w.product.id,
                w.product.name,
                w.product.brand,
                w.product.price,
                w.product.oldPrice,
                discountPercent = w.product.oldPrice is > 0 && w.product.oldPrice > w.product.price
                    ? (int?)Math.Round((double)((w.product.oldPrice.Value - w.product.price) / w.product.oldPrice.Value * 100))
                    : null,
                w.product.averageRating,
                w.product.reviewCount,
                w.product.status,
                w.product.imageUrl
            },
            w.createdAtUtc
        });

        return Ok(mapped);
    }

    [HttpGet("ids")]
    public async Task<IActionResult> Ids(CancellationToken ct)
    {
        var userId = GetUserId();
        if (userId is null) return Unauthorized();

        var ids = await _db.WishlistItems
            .AsNoTracking()
            .Where(w => w.UserId == userId)
            .Select(w => w.ProductId)
            .ToListAsync(ct);

        return Ok(ids);
    }

    [HttpPost]
    public async Task<IActionResult> Add([FromBody] AddRequest body, CancellationToken ct)
    {
        var userId = GetUserId();
        if (userId is null) return Unauthorized();

        var exists = await _db.Products.AnyAsync(
            p => p.Id == body.ProductId && p.Status != ProductStatus.Archived, ct);
        if (!exists) return NotFound(new { error = "Товар не найден." });

        var already = await _db.WishlistItems
            .AnyAsync(w => w.UserId == userId && w.ProductId == body.ProductId, ct);
        if (already) return Ok(new { status = "Ok" });

        _db.WishlistItems.Add(new WishlistItem
        {
            Id = Guid.NewGuid(),
            UserId = userId.Value,
            ProductId = body.ProductId,
            CreatedAtUtc = DateTime.UtcNow
        });
        await _db.SaveChangesAsync(ct);
        return Ok(new { status = "Ok" });
    }

    [HttpDelete("{productId:guid}")]
    public async Task<IActionResult> Remove(Guid productId, CancellationToken ct)
    {
        var userId = GetUserId();
        if (userId is null) return Unauthorized();

        var item = await _db.WishlistItems
            .FirstOrDefaultAsync(w => w.UserId == userId && w.ProductId == productId, ct);
        if (item is null) return NotFound();

        _db.WishlistItems.Remove(item);
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }

    private Guid? GetUserId()
    {
        var raw = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        return Guid.TryParse(raw, out var id) ? id : null;
    }
}
