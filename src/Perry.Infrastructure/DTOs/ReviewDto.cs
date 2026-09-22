using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using Perry.Infrastructure.Options;

namespace Perry.Infrastructure.DTOs;

public sealed record PostReviewDto
{
    [JsonIgnore]
    public  Guid UserId { get;set; }
    [Required]
    public Guid ProductId { get;set; }
    public string? AuthorName { get;set; }
    [Required]
    public int Rating { get;set; }
    public string? Title { get;set; }
    public string? Body { get;set; }
    public string[]? Images { get;set; }
}

public record ProductReviewStatistic
{
    public int TotalReviews { get;set; }
    public int TotalComments { get;set; }
    
}

public sealed record ProductReviewDto
{
    PagedList<ProductReviewDto>? PagedList { get; set; }
    
}
    
