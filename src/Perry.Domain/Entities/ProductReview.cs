namespace Perry.Domain.Entities;

/// <summary>
/// Отзыв покупателя о товаре (блок Customer Reviews на Product Page).
/// </summary>
public record ProductReview
{
    public Guid Id { get; set; }

    public Guid ProductId { get; set; }

    public Product Product { get; set; } = null!;

    /// <summary>
    /// Id пользователя из модуля Auth (часть диплома другого участника).
    /// </summary>
    public Guid UserId { get; set; }

    /// <summary>Имя автора, отображаемое в отзыве.</summary>
    public string? AuthorName { get; set; } = string.Empty;

    /// <summary>Оценка от 1 до 5 звёзд.</summary>
    public int Rating { get; set; }

    /// <summary>Краткий заголовок отзыва.</summary>
    public string? Title { get; set; } = string.Empty;

    /// <summary>Текст отзыва.</summary>
    public string? Body { get; set; } = string.Empty;

    /// <summary>Модерация: показывать на сайте только после одобрения.</summary>
    public bool IsApproved { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    /// <summary>Фото, прикреплённые к отзыву.</summary>
    public ICollection<ProductReviewImage> Images { get; set; } = new List<ProductReviewImage>();

    /// <summary>Теги («easy to use» и т.п.) для блока Frequent tags.</summary>
    public ICollection<ProductReviewTag> Tags { get; set; } = new List<ProductReviewTag>();
    
    /// <summary>Grades by another users for current review</summary>
    public ICollection<ProductReviewGrade> Grades { get; set; } = new List<ProductReviewGrade>();
}
