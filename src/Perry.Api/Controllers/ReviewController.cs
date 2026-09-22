using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Perry.Api.Filters;
using Perry.Api.Utils;
using Perry.Domain.Entities;
using Perry.Domain.Utils;
using Perry.Infrastructure.DTOs;
using Perry.Infrastructure.Persistence;

namespace Perry.Api.Controllers;

[ApiController]
[Route("api/reviews")]
[ServiceFilter<ModelValidateActionFilter>]
public class ReviewController: ControllerBase
{
    private readonly ILogger<ReviewController> _logger;
    private readonly AppDbContext _db;
    
    public ReviewController(ILogger<ReviewController> logger,AppDbContext db)
    {
        _db = db;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> GetAllReviews()
    {
        var reviews = await _db.ProductReviews
            .AsNoTracking()
            .Select(r =>new
            {
                r.Id,
                r.ProductId,
                r.Body,
                r.CreatedAtUtc,
                r.IsApproved,
                r.Rating,
                Tags = r.Tags.Select(t => t.Name),
                r.Title,
                r.UserId,
                Images = r.Images.Select(i => 
                    ApiHelpers.GetImageUrl(Request,Url.Action("GetReviewImage", "Review", new{i.Id}), i.Url))
            })
            .ToListAsync();
        
        return Ok(reviews);
    }

    [HttpGet("id/{id}")]
    public async Task<IActionResult> GetProductReviewById(Guid id)
    {
        var reviews = await _db.ProductReviews
            .AsNoTracking()
            .Where(r => r.Id == id || r.UserId ==id || r.ProductId == id)
            .Select(r =>new
            {
                r.Id,
                r.ProductId,
                r.Body,
                r.CreatedAtUtc,
                r.IsApproved,
                r.Rating,
                Tags = r.Tags.Select(t => t.Name),
                r.Title,
                r.UserId,
                Images = r.Images.Select(i => 
                    ApiHelpers.GetImageUrl(Request,Url.Action("GetReviewImage", "Review", new{i.Id}), i.Url))
            })
            .ToListAsync();
        
        return Ok(reviews);
    }

    [HttpPost]
    public async Task<IActionResult> PostProductReview(PostReviewDto dto)
    {
        var review = _db.ProductReviews.Add(new ProductReview
        {
            UserId = dto.UserId,
            ProductId = dto.ProductId,
            Body = dto.Body,
            CreatedAtUtc = DateTime.UtcNow,
            Title = dto.Title,
            AuthorName = dto.AuthorName,
            Rating = dto.Rating,
            IsApproved = true,
        });
        if (dto.Images != null)
        {
            foreach (var image in dto.Images)
            {
                _db.ProductReviewImages.Add(new ProductReviewImage
                {
                    Review = review.Entity,
                    Url = image
                });
            }
        }
        await  _db.SaveChangesAsync();
        
        return Created();
    }

    [HttpPatch("disable/{reviewId}")]
    public async Task<IActionResult> DisableReview(Guid reviewId)
    {
        var review = _db.ProductReviews.FirstOrDefault(r => r.Id == reviewId);
        if (review != null)
        {
            review.IsApproved = false;
            await _db.SaveChangesAsync();
            return NoContent();
        }
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
            {
                return File(image.Url, mime);
            }
        }
        return NotFound("No image found");
    }
}