namespace Perry.Domain.Entities;

/// <summary>Фото, приложенное к отзыву (открытие фото в комментариях в макете).</summary>
public record ProductReviewImage
{
    public Guid Id { get; set; }

    public Guid ReviewId { get; set; }

    public ProductReview Review { get; set; } = null!;

    public string Url { get; set; } = string.Empty;
}
