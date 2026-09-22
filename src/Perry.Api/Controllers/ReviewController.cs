using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Perry.Infrastructure.Persistence;

namespace Perry.Api.Controllers;

[ApiController]
[Route("api/users")]
[Authorize(Roles = "Admin")]
public class ReviewController: ControllerBase
{
    private readonly ILogger<ReviewController> _logger;
    private readonly AppDbContext _db;
    
    public ReviewController(ILogger<ReviewController> logger,AppDbContext db)
    {
        _db = db;
        _logger = logger;
    }

    // public async Task<IActionResult> GetAllReviews()
    // {
    //     
    // } 
}