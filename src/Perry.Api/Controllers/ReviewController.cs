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
using Perry.Infrastructure.Services;
using Perry.Infrastructure.Storage;
using System.Net.Http.Json;

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
    private readonly IAuthInternalClient _authInternal;
    private readonly IStorageService _storage;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;

    public ReviewController(
        ILogger<ReviewController> logger,
        AppDbContext db,
        IReviewRepository reviewRepository,
        IAuthorizationService authorizationService,
        IAuthInternalClient authInternal,
        IStorageService storage,
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration)
    {
        _db = db;
        _logger = logger;
        _reviewRepository = reviewRepository;
        _authorizationService = authorizationService;
        _authInternal = authInternal;
        _storage = storage;
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
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
            AuthorAvatarUrl = withLinks.AuthorAvatarUrl,
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

    /// <summary>
    /// Sync Auth profile onto all of the user's reviews: display name + avatar (/uploads).
    /// Fixes older rows that stored email or GUID as AuthorName.
    /// </summary>
    [HttpPut("me/avatar")]
    [Authorize]
    public async Task<IActionResult> SyncMyAvatar(CancellationToken ct)
    {
        var userId = AuthClaims.GetUserId(User);
        if (userId is null) return Unauthorized();

        var name = await ResolveAuthorNameAsync(userId.Value, ct);
        var url = await ResolveAuthorAvatarUrlAsync(userId.Value, ct);
        var reviews = await _db.ProductReviews.Where(r => r.UserId == userId.Value).ToListAsync(ct);
        foreach (var r in reviews)
        {
            if (AuthClaims.IsUsableDisplayName(name))
                r.AuthorName = name;
            if (!string.IsNullOrWhiteSpace(url))
                r.AuthorAvatarUrl = url;
        }
        await _db.SaveChangesAsync(ct);
        return Ok(new { updated = reviews.Count, authorName = name, authorAvatarUrl = url });
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
        dto.AuthorName = await ResolveAuthorNameAsync(userId.Value, ct);
        dto.AuthorAvatarUrl = await ResolveAuthorAvatarUrlAsync(userId.Value, ct);

        var result = await _reviewRepository.PostProductReview(dto, ct);
        if (result.Succeeded && result.Value != null)
            return CreatedAtAction(nameof(GetReviewById), new { id = result.Value.Id }, MapCreated(result.Value));

        if (result.Error?.Code == QueryError.Conflict.Code)
            return Conflict(new { error = result.Error.Description ?? "Review already exists" });
        if (result.Error?.Code == QueryError.EntityNotExist.Code)
            return NotFound(new { error = "Product not found" });
        if (result.Error?.Code == "InvalidImage")
            return BadRequest(new { error = result.Error.Description ?? "Invalid review photo" });

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
    public async Task<IActionResult> GetReviewImage(
        Guid id,
        [FromServices] Perry.Infrastructure.Storage.IStorageService storage,
        CancellationToken ct)
    {
        var image = await _db.ProductReviewImages.FirstOrDefaultAsync(r => r.Id == id, ct);
        if (image is null) return NotFound("No image found");

        if (image.Url.StartsWith("http", StringComparison.OrdinalIgnoreCase))
            return Redirect(image.Url);

        if (image.Url.StartsWith("/uploads", StringComparison.OrdinalIgnoreCase))
        {
            try
            {
                var bytes = storage.Load(image.Url);
                var ext = Path.GetExtension(image.Url).ToLowerInvariant();
                var mime = ext switch
                {
                    ".png" => "image/png",
                    ".gif" => "image/gif",
                    ".webp" => "image/webp",
                    ".bmp" => "image/bmp",
                    _ => "image/jpeg",
                };
                return File(bytes, mime, enableRangeProcessing: false);
            }
            catch (FileNotFoundException)
            {
                return NotFound("No image found");
            }
        }

        var (mimeType, data) = Helpers.GetImageTypeFromBase64(image.Url);
        if (mimeType is null || data is null) return NotFound("No image found");

        if (data.Contains(','))
            data = data.Split(',')[1];

        var imageBytes = Convert.FromBase64String(data);
        return File(imageBytes, mimeType, enableRangeProcessing: false);
    }

    /// <summary>
    /// Auth JWT usually has no name claim; Identity.Name is sub (UUID).
    /// Prefer Auth Internal profile, then claims, then email — never a bare GUID.
    /// </summary>
    private async Task<string> ResolveAuthorNameAsync(Guid userId, CancellationToken ct)
    {
        try
        {
            if (_authInternal.IsConfigured)
            {
                var profile = await _authInternal.GetUserAsync(userId, ct);
                if (AuthClaims.IsUsableDisplayName(profile?.DisplayName))
                    return profile!.DisplayName!.Trim();
            }
        }
        catch (Exception ex)
        {
            _logger.LogDebug(ex, "Auth internal profile lookup failed for {UserId}", userId);
        }

        return AuthClaims.GetDisplayName(User)
               ?? AuthClaims.GetEmail(User)
               ?? "Customer";
    }

    /// <summary>
    /// Public avatar for PDP: prefer absolute URL from Auth Internal; otherwise copy
    /// bytes from Auth <c>/api/account/avatar</c> (caller Bearer) into Product /uploads.
    /// </summary>
    private async Task<string?> ResolveAuthorAvatarUrlAsync(Guid userId, CancellationToken ct)
    {
        try
        {
            if (_authInternal.IsConfigured)
            {
                var profile = await _authInternal.GetUserAsync(userId, ct);
                var fromProfile = profile?.AvatarUrl ?? profile?.Avatar;
                if (IsPublicAvatarUrl(fromProfile))
                    return fromProfile!.Trim();
            }
        }
        catch (Exception ex)
        {
            _logger.LogDebug(ex, "Auth internal avatar lookup failed for {UserId}", userId);
        }

        var authHeader = Request.Headers.Authorization.ToString();
        if (string.IsNullOrWhiteSpace(authHeader))
            return null;

        var authBase = (_configuration["AuthService:BaseUrl"] ?? "").TrimEnd('/');
        if (string.IsNullOrWhiteSpace(authBase))
            return null;

        try
        {
            var client = _httpClientFactory.CreateClient();
            using var req = new HttpRequestMessage(HttpMethod.Get, $"{authBase}/api/account/avatar");
            req.Headers.TryAddWithoutValidation("Authorization", authHeader);
            using var res = await client.SendAsync(req, ct);
            if (!res.IsSuccessStatusCode)
                return null;

            var ctHeader = res.Content.Headers.ContentType?.MediaType ?? "";
            if (ctHeader.Contains("json", StringComparison.OrdinalIgnoreCase))
            {
                var json = await res.Content.ReadFromJsonAsync<Dictionary<string, object?>>(cancellationToken: ct);
                var href = json?.GetValueOrDefault("avatarUrl")?.ToString()
                           ?? json?.GetValueOrDefault("url")?.ToString()
                           ?? json?.GetValueOrDefault("avatar")?.ToString();
                return IsPublicAvatarUrl(href) ? href!.Trim() : null;
            }

            var bytes = await res.Content.ReadAsByteArrayAsync(ct);
            if (bytes.Length == 0)
                return null;
            var mime = string.IsNullOrWhiteSpace(ctHeader) ? "image/jpeg" : ctHeader;
            return _storage.SaveBytes(bytes, mime);
        }
        catch (Exception ex)
        {
            _logger.LogDebug(ex, "Could not copy Auth avatar for review author {UserId}", userId);
            return null;
        }
    }

    private static bool IsPublicAvatarUrl(string? url) =>
        !string.IsNullOrWhiteSpace(url)
        && (url.StartsWith("https://", StringComparison.OrdinalIgnoreCase)
            || url.StartsWith("http://", StringComparison.OrdinalIgnoreCase)
            || url.StartsWith("/uploads/", StringComparison.OrdinalIgnoreCase));
}
