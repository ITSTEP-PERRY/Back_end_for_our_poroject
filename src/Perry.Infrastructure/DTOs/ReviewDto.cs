using System.ComponentModel.DataAnnotations;

namespace Perry.Infrastructure.DTOs;

public sealed class PostReviewDto
{
    [Required]
    public Guid UserId { get;set; }
    [Required]
    public Guid ProductId { get;set; }
    public string? AuthorName { get;set; }
    [Required]
    public int Rating { get;set; }
    public string? Title { get;set; }
    public string? Body { get;set; }
    public string[]? Images { get;set; }
}
    
