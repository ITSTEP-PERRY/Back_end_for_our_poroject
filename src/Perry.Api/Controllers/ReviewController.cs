using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Perry.Api.Auth;
using Perry.Api.Filters;
using Perry.Api.Utils;
using Perry.Domain.Entities;
using Perry.Domain.Utils;
using Perry.Infrastructure.DTOs;
using Perry.Infrastructure.Interfaces;
using Perry.Infrastructure.Options;
using Perry.Infrastructure.Persistence;

namespace Perry.Api.Controllers;

[ApiController]
[Route("api/reviews")]
[ServiceFilter<ModelValidateActionFilter>]
public class ReviewController: ControllerBase
{
    private readonly ILogger<ReviewController> _logger;
    private readonly AppDbContext _db;
    private readonly IReviewRepository _reviewRepository;
    private readonly IAuthorizationService _authorizationService;
    
    public ReviewController(ILogger<ReviewController> logger,AppDbContext db,  IReviewRepository reviewRepository,  IAuthorizationService authorizationService)
    {
        _db = db;
        _logger = logger;
        _reviewRepository = reviewRepository;
        _authorizationService = authorizationService;
    }
    private IList<ProductReview> ConvertImagesToLinks (IList<ProductReview> reviews,HttpRequest request, IUrlHelper helper)
    {
        for (int i = 0; i < reviews.Count; i++)
        {
            reviews[i] = reviews[i] with 
            { 
                Images = reviews[i].Images.Select(img => 
                    img with { Url = ApiHelpers.GetImageUrl(Request, Url.Action("GetReviewImage", "Review", new {img.Id}), img.Url) }).ToList() 
            };
        }
        return reviews;
    }
    
    
    [HttpGet]
    public async Task<IActionResult> GetAllReviews([FromQuery] QueryOptions options, CancellationToken ct)
    {
        var user = HttpContext.User;
        if (!(await _authorizationService.AuthorizeAsync(user, AuthorizationPolicies.AdminAccess)).Succeeded)
        {
            options.FilterPropertyName = nameof(ProductReview.IsApproved);
            options.FilterPropertyValue = true.ToString();
        }
        
        var result = await _reviewRepository.GetAllReviews(options, ct);
        if (result.Value != null)
        {
            var review = result.Value;
            review.Items = ConvertImagesToLinks(review.Items, Request, Url);
            return Ok(review);
        }
        return StatusCode(500);
    }

    [HttpGet("user-product-id/{id}")]
    public async Task<IActionResult> GetReviewsByUserOrProductId([FromQuery] QueryOptions options,Guid id, CancellationToken ct)
    {
        var user = HttpContext.User;
        if (!(await _authorizationService.AuthorizeAsync(user, AuthorizationPolicies.AdminAccess)).Succeeded)
        {
            options.FilterPropertyName = nameof(ProductReview.IsApproved);
            options.FilterPropertyValue = true.ToString();
        }
        
        var result = await _reviewRepository.GetReviewsByUserOrProductId(id, options, ct);
        if (result.Value != null)
        {
            var review = result.Value;
            review.Items = ConvertImagesToLinks(review.Items, Request, Url);
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
            if (!(await _authorizationService.AuthorizeAsync(user, AuthorizationPolicies.AdminAccess)).Succeeded && !review.IsApproved)
            {
                return Forbid();
            }
            review.Images = review.Images.Select(img =>
                img with
                {
                    Url = ApiHelpers.GetImageUrl(Request, Url.Action("GetReviewImage", "Review", new { img.Id }),
                        img.Url)
                }).ToList();
            return Ok(review);
        }
        return StatusCode(500);
    }
    
    [HttpPost]
    public async Task<IActionResult> PostProductReview(PostReviewDto dto, CancellationToken ct)
    {
        var userId = HttpContext.User.FindFirst(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
        if (userId == null) return Unauthorized();
        dto.UserId = new Guid(userId);
        
        var result = await _reviewRepository.PostProductReview(dto, ct);
        if(result) return Created();
        return StatusCode(500);
    }

    [HttpPatch("disable/{reviewId}")]
    [Authorize(Policy = AuthorizationPolicies.AdminAccess)]
    public async Task<IActionResult> DisableReview(Guid reviewId, CancellationToken ct)
    {
        var result = await _reviewRepository.SetApproveReview(reviewId, ct);
        if (result) return NoContent();
        return NotFound();
    }
    
    [HttpPost("grade/{reviewId}")]
    [Authorize]
    public async Task<IActionResult> SetGrade(Guid reviewId, CancellationToken ct)
    {
        var userId = HttpContext.User.FindFirst(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
        if (userId == null) return Unauthorized();
        var result = await _reviewRepository.SetGrade(reviewId,new Guid(userId), ct);
        if (result) return NoContent();
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