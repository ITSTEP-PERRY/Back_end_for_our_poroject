using Perry.Domain.Enums;
using Perry.Infrastructure.Persistence;
using Perry.Infrastructure.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Perry.Api.Controllers;

/// <summary>
/// API товаров (витрина).
/// Маршруты:
///   GET /api/products      — список (Product List Page)
///   GET /api/products/{id} — карточка (Product Page)
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IProductStatisticsService _stats;
    private readonly IViewedProductsService _viewed;

    public ProductsController(
        AppDbContext db,
        IProductStatisticsService stats,
        IViewedProductsService viewed)
    {
        _db = db;
        _stats = stats;
        _viewed = viewed;
    }

    /// <summary>
    /// Список товаров с фильтрами, сортировкой и пагинацией
    /// (экран Product List в Figma: бренд, цена, рейтинг, поиск).
    /// Пример: GET /api/products?brand=Roku&amp;minPrice=10&amp;page=1&amp;sort=price_asc
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetList(
        [FromQuery] Guid? categoryId,
        [FromQuery] string? brand,
        [FromQuery] string[]? brands,
        [FromQuery] string[]? fabrics,
        [FromQuery] string[]? sizes,
        [FromQuery] string[]? colors,
        [FromQuery] decimal? minPrice,
        [FromQuery] decimal? maxPrice,
        [FromQuery] int? minRating,
        [FromQuery] string? search,
        [FromQuery] string sort = "price_desc",
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 15,
        CancellationToken cancellationToken = default)
    {
        if (page < 1) page = 1;
        if (pageSize is < 1 or > 100) pageSize = 15;

        brands = Normalize(brands);
        fabrics = Normalize(fabrics);
        sizes = Normalize(sizes);
        colors = Normalize(colors);

        var query = _db.Products
            .AsNoTracking()
            .Where(p => p.Status == ProductStatus.Active || p.Status == ProductStatus.OutOfStock);

        if (categoryId.HasValue)
            query = query.Where(p => p.CategoryId == categoryId.Value);

        if (!string.IsNullOrWhiteSpace(brand))
            query = query.Where(p => p.Brand == brand);

        if (brands is { Length: > 0 })
            query = query.Where(p => brands.Contains(p.Brand));

        if (fabrics is { Length: > 0 })
            query = query.Where(p => p.Attributes.Any(a => a.Name == "Fabric type" && fabrics.Contains(a.Value)));

        if (sizes is { Length: > 0 })
            query = query.Where(p => p.Attributes.Any(a => a.Name == "Size" && sizes.Contains(a.Value)));

        if (colors is { Length: > 0 })
            query = query.Where(p => p.Attributes.Any(a => a.Name == "Color" && colors.Contains(a.Value)));

        if (minPrice.HasValue)
            query = query.Where(p => p.Price >= minPrice.Value);

        if (maxPrice.HasValue)
            query = query.Where(p => p.Price <= maxPrice.Value);

        if (minRating.HasValue)
            query = query.Where(p => p.AverageRating >= minRating.Value);

        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(p => p.Name.Contains(search) || p.Brand.Contains(search));

        query = sort switch
        {
            "price_asc" => query.OrderBy(p => p.Price),
            "rating_desc" => query.OrderByDescending(p => p.AverageRating),
            "newest" => query.OrderByDescending(p => p.CreatedAtUtc),
            _ => query.OrderByDescending(p => p.Price)
        };

        var total = await query.CountAsync(cancellationToken);

        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(p => new
            {
                p.Id,
                p.Name,
                p.Slug,
                p.Brand,
                p.Price,
                p.OldPrice,
                DiscountPercent = p.OldPrice != null && p.OldPrice > p.Price
                    ? (int?)Math.Round((p.OldPrice.Value - p.Price) / p.OldPrice.Value * 100)
                    : null,
                p.AverageRating,
                p.ReviewCount,
                p.IsBestSeller,
                p.Status,
                ImageUrl = p.Images
                    .Where(i => i.IsPrimary)
                    .Select(i => i.Url)
                    .FirstOrDefault()
                    ?? p.Images.OrderBy(i => i.SortOrder).Select(i => i.Url).FirstOrDefault()
            })
            .ToListAsync(cancellationToken);

        var brandOptions = await _db.Products.AsNoTracking()
            .Where(p => p.Status == ProductStatus.Active || p.Status == ProductStatus.OutOfStock)
            .Select(p => p.Brand)
            .Distinct()
            .OrderBy(b => b)
            .ToListAsync(cancellationToken);

        var fabricOptions = await FacetValuesAsync("Fabric type", cancellationToken);
        var sizeOptions = await FacetValuesAsync("Size", cancellationToken);
        var colorOptions = await FacetValuesAsync("Color", cancellationToken);

        return Ok(new
        {
            page,
            pageSize,
            total,
            totalPages = Math.Max(1, (int)Math.Ceiling(total / (double)pageSize)),
            items,
            facets = new
            {
                brands = brandOptions,
                fabrics = fabricOptions,
                sizes = sizeOptions,
                colors = colorOptions
            }
        });
    }

    private static string[]? Normalize(string[]? values) =>
        values?
            .Where(v => !string.IsNullOrWhiteSpace(v))
            .Select(v => v.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();

    private async Task<List<string>> FacetValuesAsync(string attributeName, CancellationToken ct) =>
        await _db.ProductAttributes.AsNoTracking()
            .Where(a => a.Name == attributeName && a.IsFilterable)
            .Select(a => a.Value)
            .Distinct()
            .OrderBy(v => v)
            .ToListAsync(ct);

    /// <summary>
    /// Часто просматриваемые товары (по ViewCount).
    /// GET /api/products/popular?take=10
    /// </summary>
    [HttpGet("popular")]
    public async Task<IActionResult> GetPopular([FromQuery] int take = 10, CancellationToken cancellationToken = default)
    {
        var items = await _stats.GetMostViewedAsync(take, cancellationToken);
        return Ok(new { take = items.Count, items });
    }

    /// <summary>
    /// Полная карточка товара для Product Page:
    /// галерея, specs, about, категория + учёт просмотра.
    /// GET /api/products/{id}
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var product = await _db.Products
            .AsNoTracking()
            .Where(p => p.Id == id)
            .Select(p => new
            {
                p.Id,
                p.Name,
                p.Description,
                p.Sku,
                p.Brand,
                p.Price,
                p.OldPrice,
                DiscountPercent = p.OldPrice != null && p.OldPrice > p.Price
                    ? (int?)Math.Round((p.OldPrice.Value - p.Price) / p.OldPrice.Value * 100)
                    : null,
                p.StockQuantity,
                p.Status,
                p.AverageRating,
                p.ReviewCount,
                p.IsBestSeller,
                p.ViewCount,
                p.OrderCount,
                Category = new { p.Category.Id, p.Category.Name, p.Category.Slug },
                Images = p.Images
                    .OrderBy(i => i.SortOrder)
                    .Select(i => new { i.Id, i.Url, i.IsPrimary, i.IsVideo, i.AltText }),
                Attributes = p.Attributes
                    .OrderBy(a => a.SortOrder)
                    .Select(a => new { a.Name, a.Value }),
                AboutItems = p.AboutItems
                    .OrderBy(a => a.SortOrder)
                    .Select(a => new { a.Title, a.Description }),
                Reviews = p.Reviews
                    .Where(r => r.IsApproved)
                    .OrderByDescending(r => r.CreatedAtUtc)
                    .Select(r => new
                    {
                        r.AuthorName,
                        r.Rating,
                        r.Title,
                        r.Body,
                        r.CreatedAtUtc,
                        Tags = r.Tags.Select(t => t.Name).ToList(),
                        Images = r.Images.Select(i => i.Url).ToList()
                    })
            })
            .FirstOrDefaultAsync(cancellationToken);

        if (product is null) return NotFound();

        var viewCounted = await _stats.TryRecordViewAsync(id, clientKey: null, cancellationToken);
        _viewed.AddViewedProduct(id);

        var stats = await _stats.GetStatsAsync(id, cancellationToken);
        var viewCount = stats?.ViewCount ?? product.ViewCount;
        var orderCount = stats?.OrderCount ?? product.OrderCount;

        var related = await _db.Products
            .AsNoTracking()
            .Where(p => p.CategoryId == product.Category.Id
                && p.Id != id
                && (p.Status == ProductStatus.Active || p.Status == ProductStatus.OutOfStock))
            .OrderByDescending(p => p.IsBestSeller)
            .ThenByDescending(p => p.AverageRating)
            .Take(8)
            .Select(p => new
            {
                p.Id,
                p.Name,
                p.Slug,
                p.Brand,
                p.Price,
                p.OldPrice,
                DiscountPercent = p.OldPrice != null && p.OldPrice > p.Price
                    ? (int?)Math.Round((p.OldPrice.Value - p.Price) / p.OldPrice.Value * 100)
                    : null,
                p.AverageRating,
                p.ReviewCount,
                p.IsBestSeller,
                p.ViewCount,
                p.OrderCount,
                p.Status,
                ImageUrl = p.Images.Where(i => i.IsPrimary).Select(i => i.Url).FirstOrDefault()
                    ?? p.Images.OrderBy(i => i.SortOrder).Select(i => i.Url).FirstOrDefault()
            })
            .ToListAsync(cancellationToken);

        var saleRelated = await _db.Products
            .AsNoTracking()
            .Where(p => p.Id != id
                && p.OldPrice != null && p.OldPrice > p.Price
                && (p.Status == ProductStatus.Active || p.Status == ProductStatus.OutOfStock))
            .OrderByDescending(p => (p.OldPrice!.Value - p.Price) / p.OldPrice.Value)
            .Take(8)
            .Select(p => new
            {
                p.Id,
                p.Name,
                p.Slug,
                p.Brand,
                p.Price,
                p.OldPrice,
                DiscountPercent = (int?)Math.Round((p.OldPrice!.Value - p.Price) / p.OldPrice.Value * 100),
                p.AverageRating,
                p.ReviewCount,
                p.IsBestSeller,
                p.ViewCount,
                p.OrderCount,
                p.Status,
                ImageUrl = p.Images.Where(i => i.IsPrimary).Select(i => i.Url).FirstOrDefault()
                    ?? p.Images.OrderBy(i => i.SortOrder).Select(i => i.Url).FirstOrDefault()
            })
            .ToListAsync(cancellationToken);

        return Ok(new
        {
            product.Id,
            product.Name,
            product.Description,
            product.Sku,
            product.Brand,
            product.Price,
            product.OldPrice,
            product.DiscountPercent,
            product.StockQuantity,
            product.Status,
            product.AverageRating,
            product.ReviewCount,
            product.IsBestSeller,
            viewCount,
            orderCount,
            stats = new
            {
                viewCount,
                orderCount,
                viewCounted
            },
            product.Category,
            product.Images,
            product.Attributes,
            product.AboutItems,
            product.Reviews,
            related,
            saleRelated
        });
    }

    /// <summary>
    /// Статистика товара по Id (просмотры + заказы).
    /// GET /api/products/{id}/stats
    /// </summary>
    [HttpGet("{id:guid}/stats")]
    public async Task<IActionResult> GetStats(Guid id, CancellationToken cancellationToken)
    {
        var stats = await _stats.GetStatsAsync(id, cancellationToken);
        if (stats is null) return NotFound();

        return Ok(new
        {
            productId = id,
            viewCount = stats.Value.ViewCount,
            orderCount = stats.Value.OrderCount
        });
    }

    [HttpGet("by-slug/{slug}")]
    public async Task<IActionResult> GetBySlug(string slug, CancellationToken cancellationToken)
    {
        var product = await _db.Products
            .AsNoTracking()
            .Where(p => p.Slug == slug)
            .Select(p => new
            {
                p.Id,
                p.Name,
                p.Slug,
                p.Description,
                p.Sku,
                p.Brand,
                p.Price,
                p.OldPrice,
                p.StockQuantity,
                p.Status,
                p.AverageRating,
                p.ReviewCount,
                Category = new { p.Category.Id, p.Category.Name, p.Category.Slug }
            })
            .FirstOrDefaultAsync(cancellationToken);

        return product is null ? NotFound() : Ok(product);
    }

    /// <summary>Фото/видео товара — URL в JSON вместе с продуктом (без multipart).</summary>
    public record ProductImageInput(
        string Url,
        bool IsPrimary = false,
        bool IsVideo = false,
        string? AltText = null,
        int? SortOrder = null);

    public record AboutInput(string? Title, string? Description);
    public record AttrInput(string? Name, string? Value, bool IsFilterable = false);

    public record CreateProductRequest(
        string Name,
        string? Description,
        string? Sku,
        string? Brand,
        string? Slug,
        Guid CategoryId,
        decimal Price,
        decimal? OldPrice,
        int StockQuantity,
        IReadOnlyList<ProductImageInput>? Images = null,
        IReadOnlyList<string>? ImageUrls = null,
        IReadOnlyList<AboutInput>? AboutItems = null,
        IReadOnlyList<AttrInput>? Attributes = null);

    [HttpPost]
    public async Task<IActionResult> Create(
        [FromBody] CreateProductRequest body,
        [FromServices] IProductService products,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(body.Name) || body.CategoryId == Guid.Empty)
            return BadRequest(new { error = "Name и CategoryId обязательны." });

        var sku = string.IsNullOrWhiteSpace(body.Sku)
            ? "SKU-" + Guid.NewGuid().ToString("N")[..8].ToUpperInvariant()
            : body.Sku.Trim();

        if (await _db.Products.AnyAsync(p => p.Sku == sku, ct))
            return Conflict(new { error = "SKU занят." });

        var entity = new Domain.Entities.Product
        {
            Id = Guid.NewGuid(),
            Name = body.Name.Trim(),
            Description = body.Description?.Trim() ?? string.Empty,
            Sku = sku,
            Brand = body.Brand?.Trim() ?? "Perry",
            CategoryId = body.CategoryId,
            Price = body.Price,
            OldPrice = body.OldPrice,
            StockQuantity = body.StockQuantity,
            Status = body.StockQuantity <= 0 ? ProductStatus.OutOfStock : ProductStatus.Active,
            CreatedAtUtc = DateTime.UtcNow,
            Slug = body.Slug?.Trim() ?? string.Empty
        };

        await products.EnsureSlugAsync(entity, ct);
        if (!await products.IsSlugUniqueAsync(entity.Slug, null, ct))
            entity.Slug = SlugHelper.Unique(entity.Slug, s => _db.Products.Any(p => p.Slug == s));

        _db.Products.Add(entity);
        ApplyImages(entity.Id, body.Images, body.ImageUrls);
        ApplyAboutAndAttrs(entity.Id, body.AboutItems, body.Attributes);

        await _db.SaveChangesAsync(ct);
        return CreatedAtAction(nameof(GetById), new { id = entity.Id }, new { entity.Id, entity.Slug });
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] CreateProductRequest body, CancellationToken ct)
    {
        var entity = await _db.Products
            .Include(p => p.Images)
            .Include(p => p.AboutItems)
            .Include(p => p.Attributes)
            .FirstOrDefaultAsync(p => p.Id == id, ct);

        if (entity is null) return NotFound();
        if (string.IsNullOrWhiteSpace(body.Name) || body.CategoryId == Guid.Empty)
            return BadRequest(new { error = "Name и CategoryId обязательны." });

        entity.Name = body.Name.Trim();
        entity.Description = body.Description?.Trim() ?? string.Empty;
        if (!string.IsNullOrWhiteSpace(body.Sku)) entity.Sku = body.Sku.Trim();
        entity.Brand = body.Brand?.Trim() ?? entity.Brand;
        entity.CategoryId = body.CategoryId;
        entity.Price = body.Price;
        entity.OldPrice = body.OldPrice;
        entity.StockQuantity = body.StockQuantity;
        entity.Status = body.StockQuantity <= 0 ? ProductStatus.OutOfStock : ProductStatus.Active;
        entity.UpdatedAtUtc = DateTime.UtcNow;
        if (!string.IsNullOrWhiteSpace(body.Slug))
            entity.Slug = body.Slug.Trim().ToLowerInvariant();

        _db.ProductImages.RemoveRange(entity.Images);
        _db.ProductAboutItems.RemoveRange(entity.AboutItems);
        _db.ProductAttributes.RemoveRange(entity.Attributes);
        ApplyImages(entity.Id, body.Images, body.ImageUrls);
        ApplyAboutAndAttrs(entity.Id, body.AboutItems, body.Attributes);

        await _db.SaveChangesAsync(ct);
        return Ok(new { entity.Id, entity.Slug });
    }

    private void ApplyImages(
        Guid productId,
        IReadOnlyList<ProductImageInput>? images,
        IReadOnlyList<string>? imageUrls)
    {
        foreach (var img in NormalizeProductImages(images, imageUrls))
        {
            _db.ProductImages.Add(new Domain.Entities.ProductImage
            {
                Id = Guid.NewGuid(),
                ProductId = productId,
                Url = img.Url,
                IsPrimary = img.IsPrimary,
                IsVideo = img.IsVideo,
                AltText = img.AltText,
                SortOrder = img.SortOrder
            });
        }
    }

    private void ApplyAboutAndAttrs(
        Guid productId,
        IReadOnlyList<AboutInput>? about,
        IReadOnlyList<AttrInput>? attrs)
    {
        var ao = 0;
        foreach (var a in about ?? [])
        {
            if (string.IsNullOrWhiteSpace(a.Title) && string.IsNullOrWhiteSpace(a.Description))
                continue;
            _db.ProductAboutItems.Add(new Domain.Entities.ProductAboutItem
            {
                Id = Guid.NewGuid(),
                ProductId = productId,
                Title = a.Title?.Trim() ?? "",
                Description = a.Description?.Trim() ?? "",
                SortOrder = ao++
            });
        }

        var at = 0;
        foreach (var a in attrs ?? [])
        {
            if (string.IsNullOrWhiteSpace(a.Name) && string.IsNullOrWhiteSpace(a.Value))
                continue;
            _db.ProductAttributes.Add(new Domain.Entities.ProductAttribute
            {
                Id = Guid.NewGuid(),
                ProductId = productId,
                Name = a.Name?.Trim() ?? "",
                Value = a.Value?.Trim() ?? "",
                IsFilterable = a.IsFilterable,
                SortOrder = at++
            });
        }
    }

    private static List<(string Url, bool IsPrimary, bool IsVideo, string? AltText, int SortOrder)> NormalizeProductImages(
        IReadOnlyList<ProductImageInput>? images,
        IReadOnlyList<string>? imageUrls)
    {
        var result = new List<(string Url, bool IsPrimary, bool IsVideo, string? AltText, int SortOrder)>();

        if (images is { Count: > 0 })
        {
            var order = 0;
            var anyPrimary = images.Any(i => i.IsPrimary && !string.IsNullOrWhiteSpace(i.Url));
            foreach (var img in images)
            {
                if (string.IsNullOrWhiteSpace(img.Url))
                    continue;
                var sort = img.SortOrder ?? order;
                var primary = anyPrimary ? img.IsPrimary : result.Count == 0;
                result.Add((img.Url.Trim(), primary, img.IsVideo, img.AltText?.Trim(), sort));
                order++;
            }
            return result;
        }

        if (imageUrls is { Count: > 0 })
        {
            var order = 0;
            foreach (var url in imageUrls)
            {
                if (string.IsNullOrWhiteSpace(url))
                    continue;
                result.Add((url.Trim(), order == 0, false, null, order));
                order++;
            }
        }

        return result;
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> SoftDelete(Guid id, [FromServices] IProductService products, CancellationToken ct)
    {
        await products.SoftArchiveAsync(id, ct);
        return NoContent();
    }
}
