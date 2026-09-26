using Perry.Domain.Enums;

namespace Perry.Domain.Entities;

/// <summary>
/// Основная сущность товара (карточка Product Page и строка в каталоге).
/// Соответствует экранам: Product List, Product Page, Admin panel: Product.
/// </summary>
public class Product
{
    /// <summary>Уникальный идентификатор (GUID).</summary>
    public Guid Id { get; set; }

    /// <summary>Название товара, как на витрине.</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>Полное описание товара.</summary>
    public string Description { get; set; } = string.Empty;

    /// <summary>Артикул / SKU (уникальный код товара, виден на Product Page).</summary>
    public string Sku { get; set; } = string.Empty;

    /// <summary>Бренд (используется в фильтрах списка товаров).</summary>
    public string Brand { get; set; } = string.Empty;

    /// <summary>URL-slug (homework Product.Slug) — /Products/{slug}.</summary>
    public string Slug { get; set; } = string.Empty;

    /// <summary>Внешний ключ на категорию каталога.</summary>
    public Guid CategoryId { get; set; }

    /// <summary>Навигационное свойство: категория, к которой относится товар.</summary>
    public Category Category { get; set; } = null!;

    /// <summary>Текущая цена продажи.</summary>
    public decimal Price { get; set; }

    /// <summary>Старая цена (для зачёркнутой цены и расчёта скидки). Null — без скидки.</summary>
    public decimal? OldPrice { get; set; }

    /// <summary>Остаток на складе. 0 → обычно статус OutOfStock.</summary>
    public int StockQuantity { get; set; }

    /// <summary>Жизненный цикл товара: черновик / активен / нет в наличии / архив.</summary>
    public ProductStatus Status { get; set; } = ProductStatus.Draft;

    /// <summary>Средний рейтинг (кэш для списка; пересчитывается при новых отзывах).</summary>
    public decimal AverageRating { get; set; }

    /// <summary>Количество отзывов (кэш для списка).</summary>
    public int ReviewCount { get; set; }

    /// <summary>Флаг «Best seller» (бейдж на карточке в макете).</summary>
    public bool IsBestSeller { get; set; }

    /// <summary>Счётчик просмотров карточки (GET product by id), с антиспамом на API.</summary>
    public int ViewCount { get; set; }

    /// <summary>Сколько единиц товара продано (сумма Quantity в заказах).</summary>
    public int OrderCount { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAtUtc { get; set; }

    /// <summary>Галерея фото/видео товара.</summary>
    public ICollection<ProductImage> Images { get; set; } = new List<ProductImage>();

    /// <summary>Характеристики (таблица specs: Color, Weight и т.д.).</summary>
    public ICollection<ProductAttribute> Attributes { get; set; } = new List<ProductAttribute>();

    /// <summary>Пункты аккордеона «About product».</summary>
    public ICollection<ProductAboutItem> AboutItems { get; set; } = new List<ProductAboutItem>();

    /// <summary>Отзывы покупателей.</summary>
    public ICollection<ProductReview> Reviews { get; set; } = new List<ProductReview>();

    /// <summary>Позиции корзин, где лежит этот товар.</summary>
    public ICollection<CartItem> CartItems { get; set; } = new List<CartItem>();

    /// <summary>
    /// Процент скидки, считается из Price и OldPrice.
    /// Не хранится в БД (Ignore в EF) — вычисляется на лету.
    /// </summary>
    public int? DiscountPercent =>
        OldPrice is > 0 && OldPrice > Price
            ? (int)Math.Round((OldPrice.Value - Price) / OldPrice.Value * 100)
            : null;
}
