using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Perry.Infrastructure.Persistence;

namespace Perry.Api.Controllers;

/// <summary>Модерация отзывов для React-админки.</summary>
[ApiController]
[Route("api/admin/reviews")]
[Authorize(Roles = "Admin")]
public class AdminReviewsController : ControllerBase
{
    private readonly AppDbContext _db;

    public AdminReviewsController(AppDbContext db) => _db = db;

    /// <summary>
    /// GET /api/admin/reviews?status=all|pending|approved&amp;q=
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> List(
        [FromQuery] string status = "all",
        [FromQuery] string? q = null,
        CancellationToken ct = default)
    {
        var query = _db.ProductReviews.AsNoTracking()
            .Include(r => r.Product)
            .Include(r => r.Tags)
            .AsQueryable();

        status = (status ?? "all").Trim().ToLowerInvariant();
        if (status is "pending" or "hidden")
            query = query.Where(r => !r.IsApproved);
        else if (status is "approved" or "visible")
            query = query.Where(r => r.IsApproved);

        if (!string.IsNullOrWhiteSpace(q))
        {
            var term = q.Trim().ToLowerInvariant();
            query = query.Where(r =>
                r.Title.ToLower().Contains(term) ||
                r.Body.ToLower().Contains(term) ||
                r.AuthorName.ToLower().Contains(term) ||
                r.Product.Name.ToLower().Contains(term));
        }

        var list = await query
            .OrderByDescending(r => r.CreatedAtUtc)
            .Take(200)
            .Select(r => new
            {
                r.Id,
                r.ProductId,
                productName = r.Product.Name,
                r.AuthorName,
                r.Rating,
                r.Title,
                r.Body,
                r.IsApproved,
                r.CreatedAtUtc,
                tags = r.Tags.Select(t => t.Name).ToList()
            })
            .ToListAsync(ct);

        return Ok(list);
    }

    [HttpPut("{id:guid}/approve")]
    public async Task<IActionResult> Approve(Guid id, CancellationToken ct)
    {
        var review = await _db.ProductReviews.FirstOrDefaultAsync(r => r.Id == id, ct);
        if (review is null) return NotFound();

        if (!review.IsApproved)
        {
            review.IsApproved = true;
            await _db.SaveChangesAsync(ct);
            await RecalcProductAsync(review.ProductId, ct);
        }

        return Ok(new { status = "Ok", isApproved = true });
    }

    [HttpPut("{id:guid}/reject")]
    public async Task<IActionResult> Reject(Guid id, CancellationToken ct)
    {
        var review = await _db.ProductReviews.FirstOrDefaultAsync(r => r.Id == id, ct);
        if (review is null) return NotFound();

        if (review.IsApproved)
        {
            review.IsApproved = false;
            await _db.SaveChangesAsync(ct);
            await RecalcProductAsync(review.ProductId, ct);
        }

        return Ok(new { status = "Ok", isApproved = false });
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var review = await _db.ProductReviews
            .Include(r => r.Tags)
            .Include(r => r.Images)
            .FirstOrDefaultAsync(r => r.Id == id, ct);
        if (review is null) return NotFound();

        var productId = review.ProductId;
        _db.ProductReviewTags.RemoveRange(review.Tags);
        _db.ProductReviewImages.RemoveRange(review.Images);
        _db.ProductReviews.Remove(review);
        await _db.SaveChangesAsync(ct);
        await RecalcProductAsync(productId, ct);
        return NoContent();
    }

    private async Task RecalcProductAsync(Guid productId, CancellationToken ct)
    {
        var product = await _db.Products.FirstOrDefaultAsync(p => p.Id == productId, ct);
        if (product is null) return;

        var ratings = await _db.ProductReviews
            .Where(r => r.ProductId == productId && r.IsApproved)
            .Select(r => r.Rating)
            .ToListAsync(ct);

        product.ReviewCount = ratings.Count;
        product.AverageRating = ratings.Count == 0
            ? 0
            : Math.Round((decimal)ratings.Average(), 1);
        await _db.SaveChangesAsync(ct);
    }
}
