using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Perry.Api.Auth;
using Perry.Domain.Entities;
using Perry.Infrastructure.Persistence;

namespace Perry.Api.Controllers;

[ApiController]
[Route("api/products/{productId:guid}/reviews")]
public class ReviewsController : ControllerBase
{
    private readonly AppDbContext _db;

    public ReviewsController(AppDbContext db) => _db = db;

    public record CreateReviewRequest(
        int Rating,
        string Title,
        string Body,
        string[]? Tags = null,
        string[]? ImageUrls = null);

    /// <summary>Создать отзыв (логин обязателен). Сразу IsApproved=true для демо.</summary>
    [Authorize]
    [HttpPost]
    public async Task<IActionResult> Create(Guid productId, [FromBody] CreateReviewRequest body, CancellationToken ct)
    {
        var userId = AuthClaims.GetUserId(User);
        if (userId is null) return Unauthorized();

        if (body.Rating is < 1 or > 5)
            return BadRequest(new { error = "Rating must be 1..5." });
        if (string.IsNullOrWhiteSpace(body.Title) || string.IsNullOrWhiteSpace(body.Body))
            return BadRequest(new { error = "Title and body are required." });

        var product = await _db.Products.FirstOrDefaultAsync(p => p.Id == productId, ct);
        if (product is null) return NotFound(new { error = "Product not found." });

        var author = AuthClaims.GetDisplayName(User)
            ?? AuthClaims.GetEmail(User)
            ?? "Customer";

        var reviewId = Guid.NewGuid();
        var review = new ProductReview
        {
            Id = reviewId,
            ProductId = productId,
            UserId = userId,
            AuthorName = author,
            Rating = body.Rating,
            Title = body.Title.Trim(),
            Body = body.Body.Trim(),
            IsApproved = true,
            CreatedAtUtc = DateTime.UtcNow
        };

        _db.ProductReviews.Add(review);

        foreach (var tag in (body.Tags ?? Array.Empty<string>())
                     .Select(t => t.Trim())
                     .Where(t => t.Length > 0)
                     .Distinct(StringComparer.OrdinalIgnoreCase)
                     .Take(8))
        {
            _db.ProductReviewTags.Add(new ProductReviewTag
            {
                Id = Guid.NewGuid(),
                ReviewId = reviewId,
                Name = tag
            });
        }

        foreach (var url in (body.ImageUrls ?? Array.Empty<string>())
                     .Select(u => u.Trim())
                     .Where(u => u.StartsWith("http", StringComparison.OrdinalIgnoreCase))
                     .Take(4))
        {
            _db.ProductReviewImages.Add(new ProductReviewImage
            {
                Id = Guid.NewGuid(),
                ReviewId = reviewId,
                Url = url
            });
        }

        var approvedRatings = await _db.ProductReviews
            .Where(r => r.ProductId == productId && r.IsApproved)
            .Select(r => r.Rating)
            .ToListAsync(ct);
        approvedRatings.Add(body.Rating);
        product.ReviewCount = Math.Max(product.ReviewCount + 1, approvedRatings.Count);
        product.AverageRating = Math.Round((decimal)approvedRatings.Average(), 1);

        await _db.SaveChangesAsync(ct);

        return Ok(new
        {
            id = reviewId,
            authorName = review.AuthorName,
            review.Rating,
            review.Title,
            review.Body,
            review.CreatedAtUtc,
            tags = body.Tags ?? Array.Empty<string>(),
            images = body.ImageUrls ?? Array.Empty<string>()
        });
    }
}
