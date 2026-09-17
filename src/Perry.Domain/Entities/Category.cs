namespace Perry.Domain.Entities;

/// <summary>
/// Категория каталога. Дерево: ParentCategory → SubCategories
/// (как Fashion → Women's fashion → Casual Women's Clothing в админке).
/// </summary>
public class Category
{
    public Guid Id { get; set; }

    /// <summary>Отображаемое имя категории.</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>URL-friendly код (например clothes-women-tshirts). Уникален.</summary>
    public string Slug { get; set; } = string.Empty;

    /// <summary>Текстовое описание категории (для фронта / SEO).</summary>
    public string? Description { get; set; }

    /// <summary>Картинка категории на главной / в меню (URL в JSON).</summary>
    public string? ImageUrl { get; set; }

    /// <summary>Иконка категории в меню / фильтрах (URL в JSON).</summary>
    public string? IconUrl { get; set; }

    /// <summary>Порядок сортировки в списке (меньше — выше).</summary>
    public int SortOrder { get; set; }

    public bool IsActive { get; set; } = true;

    /// <summary>Null = корневая категория. Иначе — id родителя.</summary>
    public Guid? ParentCategoryId { get; set; }

    /// <summary>Родительская категория (self-reference).</summary>
    public Category? ParentCategory { get; set; }

    /// <summary>Дочерние подкатегории.</summary>
    public ICollection<Category> SubCategories { get; set; } = new List<Category>();

    /// <summary>Товары, привязанные к этой категории.</summary>
    public ICollection<Product> Products { get; set; } = new List<Product>();

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}
