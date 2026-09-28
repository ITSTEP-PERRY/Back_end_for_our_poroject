using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Perry.Api.Auth;
using Perry.Api.Filters;
using Perry.Api.Utils;
using Perry.Domain.Entities;
using Perry.Domain.Errors;
using Perry.Domain.Utils;
using Perry.Infrastructure.DTOs;
using Perry.Infrastructure.Interfaces;
using Perry.Infrastructure.Options;
using Perry.Infrastructure.Persistence;

namespace Perry.Api.Controllers;

[ApiController]
[Route("api/reviews")]
[ServiceFilter(typeof(ModelValidateActionFilter))]
public class ReviewController : ControllerBase
{
    private readonly ILogger<ReviewController> _logger;
    private readonly AppDbContext _db;
    private readonly IReviewRepository _reviewRepository;
    private readonly IAuthorizationService _authorizationService;

    public ReviewController(
        ILogger<ReviewController> logger,
        AppDbContext db,
        IReviewRepository reviewRepository,
        IAuthorizationService authorizationService)
    {
        _db = db;
        _logger = logger;
        _reviewRepository = reviewRepository;
        _authorizationService = authorizationService;
    }

    private IList<ProductReview> ConvertImagesToLinks(IList<ProductReview> reviews)
    {
        for (var i = 0; i < reviews.Count; i++)
        {
            reviews[i] = reviews[i] with
            {
                Images = reviews[i].Images.Select(img =>
                    img with
                    {
                        Url = ApiHelpers.GetImageUrl(
                            Request,
                            Url.Action("GetReviewImage", "Review", new { img.Id }),
                            img.Url)
                    }).ToList()
            };
        }

        return reviews;
    }

    private CreatedReviewDto MapCreated(ProductReview review)
    {
        var withLinks = ConvertImagesToLinks(new List<ProductReview> { review })[0];
        return new CreatedReviewDto
        {
            Id = withLinks.Id,
            ProductId = withLinks.ProductId,
            UserId = withLinks.UserId,
            AuthorName = withLinks.AuthorName,
            Rating = withLinks.Rating,
            Title = withLinks.Title,
            Body = withLinks.Body,
            CreatedAtUtc = withLinks.CreatedAtUtc,
            IsApproved = withLinks.IsApproved,
            Tags = withLinks.Tags?.Select(t => t.Name).Where(n => !string.IsNullOrWhiteSpace(n)).ToArray()
                   ?? Array.Empty<string>(),
            Images = withLinks.Images?.Select(i => i.Url).Where(u => !string.IsNullOrWhiteSpace(u)).ToArray()
                     ?? Array.Empty<string>(),
        };
    }

    [HttpGet]
    public async Task<IActionResult> GetAllReviews([FromQuery] QueryOptions options, Guid? id, CancellationToken ct)
    {
        var user = HttpContext.User;
        if (!(await _authorizationService.AuthorizeAsync(user, AuthorizationPolicies.AdminAccess)).Succeeded)
        {
            options.FilterObjects.RemoveAll(f => f.PropertyName == nameof(ProductReview.IsApproved));
            options.FilterObjects.Add(new FilterObject
                { PropertyName = nameof(ProductReview.IsApproved), Value = "true" });
        }

        var result = await _reviewRepository.GetAllReviews(options, id, ct);
        if (result.Value != null)
        {
            var review = result.Value;
            review.PagedList.Items = ConvertImagesToLinks(review.PagedList.Items);
            return Ok(review);
        }

        return StatusCode(500);
    }

    /// <summary>#102 — отзывы текущего пользователя (включая скрытые).</summary>
    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> GetMyReviews([FromQuery] QueryOptions options, CancellationToken ct)
    {
        var userId = AuthClaims.GetUserId(User);
        if (userId is null) return Unauthorized();

        options.FilterObjects.RemoveAll(f => f.PropertyName == nameof(ProductReview.IsApproved));

        var result = await _reviewRepository.GetReviewsByUserId(userId.Value, options, includeHidden: true, ct);
        if (result.Value is null) return StatusCode(500);

        result.Value.PagedList.Items = ConvertImagesToLinks(result.Value.PagedList.Items);
        return Ok(result.Value);
    }

    [HttpGet("user-product-id/{id}")]
    public async Task<IActionResult> GetReviewsByUserOrProductId(
        [FromQuery] QueryOptions options,
        Guid id,
        CancellationToken ct)
    {
        var user = HttpContext.User;
        if (!(await _authorizationService.AuthorizeAsync(user, AuthorizationPolicies.AdminAccess)).Succeeded)
        {
            options.FilterObjects.RemoveAll(f => f.PropertyName == nameof(ProductReview.IsApproved));
            options.FilterObjects.Add(new FilterObject
                { PropertyName = nameof(ProductReview.IsApproved), Value = "true" });
        }

        var result = await _reviewRepository.GetReviewsByUserOrProductId(id, options, ct);
        if (result.Value != null)
        {
            var review = result.Value;
            review.PagedList.Items = ConvertImagesToLinks(review.PagedList.Items);
            return Ok(review);
        }

        return StatusCode(500);
    }

    [HttpGet("id/{id}")]
    public async Task<IActionResult> GetReviewById(Guid id, CancellationToken ct)
    {
        var user = HttpContext.User;
        var result = await _reviewRepository.GetReviewById(id, ct);
        if (result.Value != null)
        {
            var review = result.Value;
            var isAdmin = (await _authorizationService.AuthorizeAsync(user, AuthorizationPolicies.AdminAccess)).Succeeded;
            var isOwner = AuthClaims.GetUserId(user) == review.UserId;
            if (!isAdmin && !isOwner && !review.IsApproved)
                return Forbid();

            review.Images = review.Images.Select(img =>
                img with
                {
                    Url = ApiHelpers.GetImageUrl(Request, Url.Action("GetReviewImage", "Review", new { img.Id }),
                        img.Url)
                }).ToList();
            return Ok(review);
        }

        return NotFound();
    }

    /// <summary>#99/#100/#104 — создать отзыв; UserId только из JWT.</summary>
    [HttpPost]
    [Authorize]
    public async Task<IActionResult> PostProductReview([FromBody] PostReviewDto dto, CancellationToken ct)
    {
        if (dto.Rating is > 5 or <= 0) return BadRequest(new { error = "Rating must be 1..5" });

        var userId = AuthClaims.GetUserId(User);
        if (userId is null) return Unauthorized();

        dto.UserId = userId.Value;
        dto.AuthorName = AuthClaims.GetDisplayName(User)
                         ?? AuthClaims.GetEmail(User)
                         ?? "Customer";

        var result = await _reviewRepository.PostProductReview(dto, ct);
        if (result.Succeeded && result.Value != null)
            return CreatedAtAction(nameof(GetReviewById), new { id = result.Value.Id }, MapCreated(result.Value));

        if (result.Error?.Code == QueryError.Conflict.Code)
            return Conflict(new { error = result.Error.Description ?? "Review already exists" });
        if (result.Error?.Code == QueryError.EntityNotExist.Code)
            return NotFound(new { error = "Product not found" });

        _logger.LogWarning("PostProductReview failed: {Code}", result.Error?.Code);
        return StatusCode(500, new { error = "Failed to create review" });
    }

    [HttpPatch("disable/{reviewId}")]
    [Authorize(Policy = AuthorizationPolicies.AdminAccess)]
    public async Task<IActionResult> DisableReview(Guid reviewId, CancellationToken ct)
    {
        var result = await _reviewRepository.SetApproveReview(reviewId, ct);
        if (result) return NoContent();
        return NotFound();
    }

    [HttpPatch("disable-many")]
    [Authorize(Policy = AuthorizationPolicies.AdminAccess)]
    public async Task<IActionResult> DisableManyReviews([FromBody] ManyProductReview reviews, CancellationToken ct)
    {
        if (reviews.ReviewIds is null || reviews.ReviewIds.Count == 0)
            return BadRequest(new { error = "reviewIds required" });

        var result = await _reviewRepository.SetApproveForAllReview(reviews.ReviewIds, reviews.Approved, ct);
        if (result) return NoContent();
        return NotFound();
    }

    [HttpDelete("{reviewId:guid}")]
    [Authorize(Policy = AuthorizationPolicies.AdminAccess)]
    public async Task<IActionResult> DeleteReview(Guid reviewId, CancellationToken ct)
    {
        var review = await _db.ProductReviews
            .Include(r => r.Tags)
            .Include(r => r.Images)
            .FirstOrDefaultAsync(r => r.Id == reviewId, ct);
        if (review is null) return NotFound();

        var productId = review.ProductId;
        _db.ProductReviewTags.RemoveRange(review.Tags);
        _db.ProductReviewImages.RemoveRange(review.Images);
        _db.ProductReviews.Remove(review);
        await _db.SaveChangesAsync(ct);
        await _reviewRepository.RecalculateProductReviewStatsAsync(productId, ct);
        return NoContent();
    }

    [HttpPost("grade/{reviewId}")]
    [Authorize]
    public async Task<IActionResult> SetGrade(Guid reviewId, CancellationToken ct)
    {
        var userId = AuthClaims.GetUserId(User);
        if (userId is null) return Unauthorized();
        var result = await _reviewRepository.SetGrade(reviewId, userId.Value, ct);
        if (result) return NoContent();
        return NotFound();
    }

    [HttpPost("report/{reviewId}")]
    [Authorize]
    public async Task<IActionResult> SetReport(Guid reviewId, CancellationToken ct)
    {
        var userId = AuthClaims.GetUserId(User);
        if (userId is null) return Unauthorized();
        var result = await _reviewRepository.Report(reviewId, userId.Value, ct);
        if (result) return NoContent();
        return NotFound();
    }

    [HttpGet("my/{reviewId}")]
    [Authorize]
    public async Task<IActionResult> GetMyGradeById(Guid reviewId, CancellationToken ct)
    {
        var userId = AuthClaims.GetUserId(User);
        if (userId is null) return Unauthorized();
        var result = await _reviewRepository.GetMyGrade(reviewId, userId.Value, ct);
        if (result) return Ok(result.Value);
        return NotFound();
    }

    [HttpGet("image/{id}")]
    public async Task<IActionResult> GetReviewImage(Guid id, CancellationToken ct)
    {
        var image = await _db.ProductReviewImages.FirstOrDefaultAsync(r => r.Id == id, ct);
        if (image != null)
        {
            var (mime, data) = Helpers.GetImageTypeFromBase64(image.Url);
            if (mime != null)
                return File(image.Url, mime);
        }

        return NotFound("No image found");
    }
}
