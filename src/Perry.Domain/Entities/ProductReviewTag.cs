namespace Perry.Domain.Entities;

/// <summary>
/// Тег отзыва (например «easy to use», «remote control»).
/// Нужен для блока Frequent tags на Product Page.
/// </summary>
public record ProductReviewTag
{
    public Guid Id { get; set; }

    public Guid ReviewId { get; set; }

    public ProductReview Review { get; set; } = null!;

    public string Name { get; set; } = string.Empty;
}
