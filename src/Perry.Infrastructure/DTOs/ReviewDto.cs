using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using Perry.Domain.Entities;
using Perry.Domain.Primitives;
using Perry.Infrastructure.Options;

namespace Perry.Infrastructure.DTOs;

public sealed record PostReviewDto
{
    [JsonIgnore]
    public Guid UserId { get; set; }

    [Required]
    public Guid ProductId { get; set; }

    /// <summary>Игнорируется с клиента — заполняется из JWT на сервере.</summary>
    public string? AuthorName { get; set; }

    /// <summary>Игнорируется с клиента — заполняется из Auth / копии на диск.</summary>
    public string? AuthorAvatarUrl { get; set; }

    [Required]
    public int Rating { get; set; }

    public string? Title { get; set; }
    public string? Body { get; set; }
    public string[]? Images { get; set; }
    public string[]? Tags { get; set; }
}

public sealed record CreatedReviewDto
{
    public required Guid Id { get; init; }
    public required Guid ProductId { get; init; }
    public required Guid UserId { get; init; }
    public string? AuthorName { get; init; }
    public string? AuthorAvatarUrl { get; init; }
    public required int Rating { get; init; }
    public string? Title { get; init; }
    public string? Body { get; init; }
    public required DateTime CreatedAtUtc { get; init; }
    public required bool IsApproved { get; init; }
    public required string[] Tags { get; init; }
    public required string[] Images { get; init; }
}

public record ProductReviewStatistic
{
    public int TotalReviews { get; set; }
    public int TotalComments { get; set; }
    public List<Statistic<int>> Statistics { get; set; } = new();
}

public sealed record ProductReviewDto
{
    public required PagedList<ProductReview> PagedList { get; set; }
    public ProductReviewStatistic Statistic { get; set; } = new();
}

public sealed record ManyProductReview
{
    public List<Guid> ReviewIds { get; set; } = new();
    public bool Approved { get; set; }
}
