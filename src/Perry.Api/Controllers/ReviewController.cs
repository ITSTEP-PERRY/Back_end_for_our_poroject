using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Perry.Api.Utils;
using Perry.Domain.Utils;
using Perry.Infrastructure.Persistence;

namespace Perry.Api.Controllers;

[ApiController]
[Route("api/reviews")]
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
        var host = Request.Scheme + "://" + Request.Host.Value;
        Console.WriteLine(host);
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