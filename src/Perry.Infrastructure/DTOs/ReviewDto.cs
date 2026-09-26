using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using Perry.Domain.Entities;
using Perry.Domain.Primitives;
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
    public List<Statistic<int>> Statistics { get; set; } = new();

}

public sealed record ProductReviewDto
{
    public required PagedList<ProductReview> PagedList { get; set; }
    public ProductReviewStatistic Statistic { get; set; } = new();
}
    
