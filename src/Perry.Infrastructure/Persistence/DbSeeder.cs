using System.Reflection;
using System.Text.Json;
using Perry.Domain.Entities;
using Perry.Domain.Enums;
using Perry.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Perry.Infrastructure.Persistence;

/// <summary>
/// Заполняет БД демо-данными при первом запуске (если таблица Products пустая).
/// Нужно для тестирования главной и карточки товара.
/// Фото витрины — реалистичные CDN-URL из DummyJSON (cdn.dummyjson.com).
/// </summary>
public static class DbSeeder
{
    private sealed record DummyPack(
        int Id,
        string Category,
        string Title,
        string Brand,
        decimal Price,
        string Description,
        decimal Rating,
        int Stock,
        string Thumbnail,
        IReadOnlyList<string> Images);

    private static IReadOnlyList<DummyPack>? _dummyCatalog;

    /// <summary>Только применить EF-миграции (для API / Azure при старте).</summary>
    public static async Task MigrateAsync(IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await db.Database.MigrateAsync();
        await EnsureReviewGradeReportedColumnAsync(db);
    }

    public static async Task SeedAsync(IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        await db.Database.MigrateAsync();
        await EnsureReviewGradeReportedColumnAsync(db);
        await EnsureProductSlugsAsync(db);

        var catalog = await LoadDummyCatalogAsync();

        if (!await db.Products.AnyAsync())
        {
            await SeedDemoCatalogAsync(db, catalog);
        }

        await EnsureDummyJsonCategoriesAsync(db);
        await EnsureDummyJsonProductsAsync(db, catalog);
        await EnsureCatalogFilterAttributesAsync(db);
        await EnsureProductPageDemoAsync(db, catalog);
        await EnsureShopLooksAliveAsync(db, catalog);
        await EnsureDemoProductVideosAsync(db);
        await EnsureDemoOrdersAsync(db);
        await EnsureOrderNumbersAsync(db);
    }

    /// <summary>
    /// #42 — 1–2 демо-товара с mp4 в галерее (IsVideo), без YouTube embed.
    /// </summary>
    private static async Task EnsureDemoProductVideosAsync(AppDbContext db)
    {
        const string demoMp4 = "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4";

        if (await db.ProductImages.AnyAsync(i => i.IsVideo))
            return;

        var products = await db.Products
            .Include(p => p.Images)
            .Where(p => p.Status == ProductStatus.Active)
            .OrderBy(p => p.Name)
            .Take(2)
            .ToListAsync();

        foreach (var p in products)
        {
            if (p.Images.Any(i => i.IsVideo))
                continue;

            var nextOrder = p.Images.Count == 0 ? 0 : p.Images.Max(i => i.SortOrder) + 1;
            db.ProductImages.Add(new ProductImage
            {
                Id = Guid.NewGuid(),
                ProductId = p.Id,
                Url = demoMp4,
                SortOrder = nextOrder,
                IsPrimary = false,
                IsVideo = true,
                AltText = $"{p.Name} demo video"
            });
        }

        if (products.Count > 0)
            await db.SaveChangesAsync();
    }

    /// <summary>
    /// Каталог DummyJSON: сначала сеть, иначе встроенный JSON (~194 товара с CDN-фото).
    /// </summary>
    private static async Task<IReadOnlyList<DummyPack>> LoadDummyCatalogAsync()
    {
        if (_dummyCatalog is { Count: > 0 })
            return _dummyCatalog;

        try
        {
            using var http = new HttpClient { Timeout = TimeSpan.FromSeconds(12) };
            await using var stream = await http.GetStreamAsync("https://dummyjson.com/products?limit=0");
            using var doc = await JsonDocument.ParseAsync(stream);
            var packs = ParseDummyProducts(doc.RootElement);
            if (packs.Count > 0)
            {
                _dummyCatalog = packs;
                return packs;
            }
        }
        catch
        {
            // offline / firewall — берём embedded snapshot
        }

        await using var embedded = Assembly.GetExecutingAssembly()
            .GetManifestResourceStream("Perry.Infrastructure.Persistence.dummyjson-products.json");
        if (embedded is null)
            return _dummyCatalog = Array.Empty<DummyPack>();

        using var embeddedDoc = await JsonDocument.ParseAsync(embedded);
        _dummyCatalog = ParseDummyProducts(embeddedDoc.RootElement);
        return _dummyCatalog;
    }

    private static IReadOnlyList<DummyPack> ParseDummyProducts(JsonElement root)
    {
        var list = new List<DummyPack>();
        // Embedded snapshot is a raw array; live API wraps { products: [...] }.
        IEnumerable<JsonElement> items = root.ValueKind == JsonValueKind.Array
            ? root.EnumerateArray()
            : root.TryGetProperty("products", out var products) && products.ValueKind == JsonValueKind.Array
                ? products.EnumerateArray()
                : Array.Empty<JsonElement>();

        foreach (var p in items)
        {
            var id = p.TryGetProperty("id", out var idEl) && idEl.TryGetInt32(out var idVal) ? idVal : 0;
            var category = p.TryGetProperty("c", out var cEl) ? cEl.GetString()
                : p.TryGetProperty("category", out var catEl) ? catEl.GetString()
                : null;
            var title = p.TryGetProperty("t", out var tEl) ? tEl.GetString()
                : p.TryGetProperty("title", out var titleEl) ? titleEl.GetString()
                : null;
            var thumb = p.TryGetProperty("th", out var thEl) ? thEl.GetString()
                : p.TryGetProperty("thumbnail", out var thumbEl) ? thumbEl.GetString()
                : null;
            var brand = p.TryGetProperty("brand", out var brandEl) ? brandEl.GetString() : null;
            var description = p.TryGetProperty("desc", out var descEl) ? descEl.GetString()
                : p.TryGetProperty("description", out var descriptionEl) ? descriptionEl.GetString()
                : null;
            var price = 0m;
            if (p.TryGetProperty("price", out var priceEl))
            {
                if (priceEl.ValueKind == JsonValueKind.Number) price = priceEl.GetDecimal();
                else if (priceEl.ValueKind == JsonValueKind.String && decimal.TryParse(priceEl.GetString(), out var parsed)) price = parsed;
            }
            var rating = 4.0m;
            if (p.TryGetProperty("rating", out var ratingEl) && ratingEl.ValueKind == JsonValueKind.Number)
                rating = Math.Round(ratingEl.GetDecimal(), 1);
            var stock = 50;
            if (p.TryGetProperty("stock", out var stockEl) && stockEl.TryGetInt32(out var stockVal))
                stock = stockVal;

            var images = new List<string>();
            if (p.TryGetProperty("i", out var iEl) && iEl.ValueKind == JsonValueKind.Array)
            {
                foreach (var img in iEl.EnumerateArray())
                {
                    var u = img.GetString();
                    if (!string.IsNullOrWhiteSpace(u)) images.Add(u!);
                }
            }
            else if (p.TryGetProperty("images", out var imagesEl) && imagesEl.ValueKind == JsonValueKind.Array)
            {
                foreach (var img in imagesEl.EnumerateArray())
                {
                    var u = img.GetString();
                    if (!string.IsNullOrWhiteSpace(u)) images.Add(u!);
                }
            }

            if (images.Count == 0 && !string.IsNullOrWhiteSpace(thumb))
                images.Add(thumb!);
            if (images.Count == 0 || string.IsNullOrWhiteSpace(category) || string.IsNullOrWhiteSpace(title))
                continue;
            if (id <= 0)
                id = Math.Abs(HashCode.Combine(category, title));

            list.Add(new DummyPack(
                id,
                category!,
                title!,
                string.IsNullOrWhiteSpace(brand) ? "Perry" : brand!,
                price > 0 ? price : 19.99m,
                string.IsNullOrWhiteSpace(description) ? title! : description!,
                rating > 0 ? rating : 4.0m,
                Math.Max(0, stock),
                thumb ?? images[0],
                images));
        }

        return list;
    }

    private static bool IsPlaceholderUrl(string? url) =>
        string.IsNullOrWhiteSpace(url)
        || url.Contains("picsum.photos", StringComparison.OrdinalIgnoreCase)
        || url.Contains("placehold.co", StringComparison.OrdinalIgnoreCase)
        || url.Contains("via.placeholder", StringComparison.OrdinalIgnoreCase)
        || url.Contains("images.unsplash.com", StringComparison.OrdinalIgnoreCase);

    private static bool IsManagedDemoUrl(string? url) =>
        IsPlaceholderUrl(url)
        || (!string.IsNullOrWhiteSpace(url)
            && !url.StartsWith("/uploads", StringComparison.OrdinalIgnoreCase)
            && !url.Contains("cdn.dummyjson.com", StringComparison.OrdinalIgnoreCase));

    private static IReadOnlyList<string> GalleryUrls(DummyPack pack)
    {
        if (pack.Images.Count > 0) return pack.Images;
        return string.IsNullOrWhiteSpace(pack.Thumbnail) ? Array.Empty<string>() : new[] { pack.Thumbnail };
    }

    private static DummyPack? PickDummyPack(IReadOnlyList<DummyPack> catalog, Product product, int index)
    {
        if (catalog.Count == 0) return null;

        var preferred = PreferredDummyCategories(product);
        var pool = preferred.Length == 0
            ? catalog
            : catalog.Where(p => preferred.Contains(p.Category, StringComparer.OrdinalIgnoreCase)).ToList();
        if (pool.Count == 0) pool = catalog;

        var seed = Math.Abs(HashCode.Combine(product.Id, product.Sku, index));
        return pool[seed % pool.Count];
    }

    private static string[] PreferredDummyCategories(Product p)
    {
        var slug = p.Category?.Slug ?? "";
        var name = (p.Name + " " + p.Brand + " " + slug).ToLowerInvariant();

        if (name.Contains("roku") || name.Contains("stream") || name.Contains("tablet"))
            return ["tablets", "smartphones", "mobile-accessories"];
        if (name.Contains("headphone") || name.Contains("headset") || name.Contains("earbud"))
            return ["mobile-accessories"];
        if (name.Contains("keyboard") || name.Contains("laptop") || name.Contains("pc"))
            return ["laptops", "mobile-accessories", "tablets"];
        if (name.Contains("phone") || name.Contains("iphone") || name.Contains("samsung"))
            return ["smartphones", "mobile-accessories"];
        if (name.Contains("shoe") || name.Contains("aqua") || name.Contains("sock"))
            return ["mens-shoes", "womens-shoes", "sports-accessories"];
        if (name.Contains("hat") || name.Contains("sunglass"))
            return ["sunglasses", "womens-bags"];
        if (name.Contains("dress"))
            return ["womens-dresses", "tops"];
        if (name.Contains("tee") || name.Contains("t-shirt") || name.Contains("shirt") || name.Contains("blouse") || name.Contains("top"))
            return ["tops", "mens-shirts", "womens-dresses"];
        if (name.Contains("watch") || name.Contains("bag") || name.Contains("jewel"))
            return ["womens-watches", "mens-watches", "womens-bags", "womens-jewellery"];
        if (name.Contains("beauty") || name.Contains("fragrance") || name.Contains("skin"))
            return ["beauty", "fragrances", "skin-care"];
        if (name.Contains("home") || name.Contains("kitchen") || name.Contains("furniture") || name.Contains("grocery"))
            return ["furniture", "home-decoration", "kitchen-accessories", "groceries"];

        if (slug.Contains("beauty"))
            return ["beauty", "fragrances", "skin-care"];
        if (slug.Contains("home") || slug.Contains("kitchen"))
            return ["furniture", "home-decoration", "kitchen-accessories", "groceries"];
        if (slug.Contains("electronic") || slug.Contains("pc") || slug.Contains("stream"))
            return ["smartphones", "laptops", "tablets", "mobile-accessories"];
        if (slug.Contains("fashion") || slug.Contains("women") || slug.Contains("casual") || slug.Contains("shirt"))
            return ["womens-dresses", "tops", "womens-shoes", "womens-bags", "womens-watches"];

        return [];
    }

    private static string PickCategoryImage(IReadOnlyList<DummyPack> catalog, Category c)
    {
        if (catalog.Count == 0)
            return CategoryVisuals(c.Slug, c.Name).Image;

        var probe = new Product
        {
            Id = c.Id,
            Sku = c.Slug,
            Name = c.Name,
            Brand = "",
            Category = c
        };
        var pack = PickDummyPack(catalog, probe, 0);
        if (pack is null)
            return CategoryVisuals(c.Slug, c.Name).Image;
        return pack.Thumbnail;
    }

    private static string PickCategoryIcon(IReadOnlyList<DummyPack> catalog, Category c)
    {
        if (catalog.Count == 0)
            return CategoryVisuals(c.Slug, c.Name).Icon;

        var probe = new Product
        {
            Id = c.Id,
            Sku = c.Slug + "-icon",
            Name = c.Name,
            Brand = "",
            Category = c
        };
        var pack = PickDummyPack(catalog, probe, 1);
        return pack?.Thumbnail ?? PickCategoryImage(catalog, c);
    }

    /// <summary>
    /// Schema drift guard for ProductReviewGrades.Reported (PostgreSQL).
    /// Fresh PG migrations already include the column — no-op when present.
    /// </summary>
    private static async Task EnsureReviewGradeReportedColumnAsync(AppDbContext db)
    {
        await db.Database.ExecuteSqlRawAsync(
            """
            DO $$
            BEGIN
              IF EXISTS (
                SELECT 1 FROM information_schema.tables
                WHERE table_schema = 'public' AND table_name = 'ProductReviewGrades'
              ) AND NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_schema = 'public'
                  AND table_name = 'ProductReviewGrades'
                  AND column_name = 'Reported'
              ) THEN
                ALTER TABLE "ProductReviewGrades"
                  ADD "Reported" boolean NOT NULL DEFAULT false;
              END IF;
            END $$;
            """);
    }

    /// <summary>
    /// #A03 — демо-заказы + OrderItems (идемпотентно).
    /// UserId — тестовый Admin из Auth (sanyamart13) для локальной админки.
    /// </summary>
    private static async Task EnsureDemoOrdersAsync(AppDbContext db)
    {
        if (await db.Orders.AnyAsync())
            return;

        var products = await db.Products
            .AsNoTracking()
            .Include(p => p.Category)
            .Include(p => p.Images)
            .Where(p => p.Status != ProductStatus.Archived)
            .OrderBy(p => p.Name)
            .Take(8)
            .ToListAsync();
        if (products.Count == 0)
            return;

        // Auth demo Admin (локально известен); плюс второй Guid для разнообразия
        var adminUserId = Guid.Parse("d78e94a9-cf1d-43f3-9ecd-643149b9e95a");
        var otherUserId = Guid.Parse("43465fbf-6e7a-4632-9c83-068851bb45f5");

        var specs = new (Guid UserId, string Recipient, string Address, string Payment, OrderStatus Status, int DaysAgo, int[] ProductIndexes)[]
        {
            (adminUserId, "Aleksandr Martynov", "Canada, Ontario, Something Street, 1919", "Cash", OrderStatus.Ordered, 1, new[] { 0, 1 }),
            (adminUserId, "Aleksandr Martynov", "Canada, Ontario, King St, 42", "Card", OrderStatus.Received, 3, new[] { 2 }),
            (otherUserId, "Vladislav Melenchuk", "Ukraine, Kyiv, Khreshchatyk 1", "Card", OrderStatus.Shipped, 5, new[] { 1, 3 }),
            (adminUserId, "Aleksandr Martynov", "Canada, Ontario, Something Street, 1919", "Cash", OrderStatus.ReadyToPickup, 8, new[] { 0, 2, 4 }),
            (otherUserId, "Guest Buyer", "USA, NY, 5th Avenue 100", "Card", OrderStatus.Cancelled, 10, new[] { 5 }),
        };

        var now = DateTime.UtcNow;
        foreach (var spec in specs)
        {
            var picks = spec.ProductIndexes
                .Where(i => i >= 0 && i < products.Count)
                .Select(i => products[i])
                .DistinctBy(p => p.Id)
                .ToList();
            if (picks.Count == 0)
                continue;

            var orderId = Guid.NewGuid();
            var orderDate = now.AddDays(-spec.DaysAgo).AddHours(-spec.DaysAgo);
            var items = new List<OrderItem>();
            var qtyBase = 1;
            foreach (var p in picks)
            {
                var qty = qtyBase;
                qtyBase = qtyBase == 1 ? 2 : 1;
                var img = p.Images.FirstOrDefault(i => i.IsPrimary)?.Url
                    ?? p.Images.OrderBy(i => i.SortOrder).FirstOrDefault()?.Url;
                items.Add(new OrderItem
                {
                    Id = Guid.NewGuid(),
                    OrderId = orderId,
                    ProductId = p.Id,
                    ProductName = p.Name,
                    ProductDescription = p.Description,
                    ProductPrice = p.Price,
                    Quantity = qty,
                    TotalPrice = qty * p.Price,
                    ProductImageUrl = img,
                    CategoryName = p.Category?.Name ?? "—",
                    CreatedAtUtc = orderDate
                });
            }

            db.Orders.Add(new Order
            {
                Id = orderId,
                OrderNumber = OrderNumberGenerator.Next(),
                UserId = spec.UserId,
                OrderDateUtc = orderDate,
                TotalAmount = items.Sum(i => i.TotalPrice),
                ItemsCount = items.Sum(i => i.Quantity),
                Status = spec.Status,
                RecipientName = spec.Recipient,
                ShippingAddress = spec.Address,
                PaymentType = spec.Payment,
                CompletedAtUtc = spec.Status == OrderStatus.ReadyToPickup ? orderDate.AddDays(2) : null,
                CreatedAtUtc = orderDate,
                UpdatedAtUtc = orderDate
            });
            db.OrderItems.AddRange(items);

            // лёгкий bump OrderCount на товарах (tracked отдельно)
            foreach (var item in items)
            {
                var tracked = await db.Products.FirstOrDefaultAsync(x => x.Id == item.ProductId);
                if (tracked is null) continue;
                tracked.OrderCount += item.Quantity;
                tracked.UpdatedAtUtc = now;
            }
        }

        await db.SaveChangesAsync();
    }

    /// <summary>#A12 — backfill short OrderNumber for rows created before the column existed.</summary>
    private static async Task EnsureOrderNumbersAsync(AppDbContext db)
    {
        var missing = await db.Orders
            .Where(o => o.OrderNumber == null || o.OrderNumber == "")
            .ToListAsync();
        if (missing.Count == 0)
            return;

        var used = new HashSet<string>(
            await db.Orders
                .Where(o => o.OrderNumber != null && o.OrderNumber != "")
                .Select(o => o.OrderNumber)
                .ToListAsync(),
            StringComparer.OrdinalIgnoreCase);

        foreach (var order in missing)
        {
            string next;
            do
            {
                next = OrderNumberGenerator.Next();
            } while (!used.Add(next));

            order.OrderNumber = next;
        }

        await db.SaveChangesAsync();
    }

    /// <summary>
    /// Категорийные фото + DummyJSON-галереи товаров + отзывы,
    /// чтобы витрина выглядела как живой магазин (для уже существующей БД тоже).
    /// </summary>
    private static async Task EnsureShopLooksAliveAsync(AppDbContext db, IReadOnlyList<DummyPack> catalog)
    {
        var changed = false;

        var categories = await db.Categories.ToListAsync();
        foreach (var c in categories)
        {
            if (IsManagedDemoUrl(c.ImageUrl))
            {
                c.ImageUrl = PickCategoryImage(catalog, c);
                changed = true;
            }
            if (IsManagedDemoUrl(c.IconUrl))
            {
                c.IconUrl = PickCategoryIcon(catalog, c);
                changed = true;
            }
            if (string.IsNullOrWhiteSpace(c.Description))
            {
                c.Description = $"Shop {c.Name} at Perry — curated picks and everyday essentials.";
                changed = true;
            }
        }

        var products = await db.Products
            .Include(p => p.Images)
            .Include(p => p.Reviews).ThenInclude(r => r.Tags)
            .Include(p => p.Reviews).ThenInclude(r => r.Images)
            .Include(p => p.Category)
            .ToListAsync();

        var productIndex = 0;
        foreach (var p in products)
        {
            var pack = PickDummyPack(catalog, p, productIndex++) ?? catalog.FirstOrDefault();
            var theme = ImageThemeFor(p);
            var gallery = pack is null ? Array.Empty<string>() : GalleryUrls(pack);

            if (gallery.Count > 0)
            {
                if (p.Images.Count == 0)
                {
                    AddImages(db, p.Id, gallery, pack!.Title);
                    changed = true;
                }
                else if (p.Images.Any(i => IsManagedDemoUrl(i.Url)))
                {
                    var ordered = p.Images.OrderBy(i => i.SortOrder).ToList();
                    for (var i = 0; i < ordered.Count; i++)
                    {
                        if (!IsManagedDemoUrl(ordered[i].Url))
                            continue;
                        ordered[i].Url = gallery[i % gallery.Count];
                        ordered[i].AltText = pack!.Title;
                        ordered[i].IsPrimary = i == 0;
                        changed = true;
                    }

                    var targetCount = Math.Min(4, gallery.Count);
                    while (p.Images.Count < targetCount)
                    {
                        var i = p.Images.Count;
                        db.ProductImages.Add(new ProductImage
                        {
                            Id = Guid.NewGuid(),
                            ProductId = p.Id,
                            Url = gallery[i % gallery.Count],
                            SortOrder = i,
                            IsPrimary = i == 0 && p.Images.Count == 0,
                            IsVideo = false,
                            AltText = pack!.Title
                        });
                        changed = true;
                    }
                }
            }
            else if (p.Images.Count == 0)
            {
                AddImages(db, p.Id, theme);
                changed = true;
            }

            if (p.Reviews.Count < 4)
            {
                var need = 4 + (Math.Abs(p.Sku.GetHashCode()) % 5); // 4..8
                var toAdd = need - p.Reviews.Count;
                for (var i = 0; i < toAdd; i++)
                {
                    var review = RandomReview(p.Id, theme, p.Reviews.Count + i, pack?.Thumbnail);
                    db.ProductReviews.Add(review);
                    p.Reviews.Add(review);
                    foreach (var tag in review.Tags)
                        db.ProductReviewTags.Add(tag);
                    if (review.Images.Count > 0)
                    {
                        foreach (var img in review.Images)
                            db.ProductReviewImages.Add(img);
                    }
                }
                changed = true;
            }
            else
            {
                foreach (var review in p.Reviews)
                {
                    foreach (var img in review.Images.Where(i => IsPlaceholderUrl(i.Url)))
                    {
                        img.Url = pack?.Thumbnail
                            ?? $"https://cdn.dummyjson.com/product-images/beauty/essence-mascara-lash-princess/thumbnail.webp";
                        changed = true;
                    }
                }
            }

            // Синхронизируем счётчики с реальными одобренными отзывами (витрина + карточка).
            var approved = p.Reviews.Where(r => r.IsApproved).ToList();
            if (approved.Count > 0)
            {
                var avg = Math.Round((decimal)approved.Average(r => r.Rating), 1);
                if (p.AverageRating != avg || p.ReviewCount < approved.Count)
                {
                    p.AverageRating = avg;
                    // Оставляем «маркетинговый» объём, но не ниже реальных отзывов.
                    p.ReviewCount = Math.Max(p.ReviewCount, approved.Count);
                    changed = true;
                }
            }
        }

        if (changed)
            await db.SaveChangesAsync();
    }

    /// <summary>Доп. разделы под DummyJSON (Beauty / Home), если их ещё нет.</summary>
    private static async Task EnsureDummyJsonCategoriesAsync(AppDbContext db)
    {
        var changed = false;
        async Task<Category> Ensure(string name, string slug, int sort, Guid? parentId = null)
        {
            var existing = await db.Categories.FirstOrDefaultAsync(c => c.Slug == slug);
            if (existing is not null) return existing;
            var cat = Cat(name, slug, sort, parentId);
            db.Categories.Add(cat);
            changed = true;
            return cat;
        }

        await Ensure("Beauty", "beauty", 3);
        await Ensure("Home & Kitchen", "home-kitchen", 4);
        if (changed)
            await db.SaveChangesAsync();
    }

    /// <summary>
    /// Импорт всех товаров DummyJSON (~194) в дерево категорий Perry по тематике разделов.
    /// SKU = DJ-{id}, идемпотентно.
    /// </summary>
    private static async Task EnsureDummyJsonProductsAsync(AppDbContext db, IReadOnlyList<DummyPack> catalog)
    {
        if (catalog.Count == 0) return;

        var categories = await db.Categories.ToListAsync();
        Guid ResolveCategoryId(string dummyCategory)
        {
            string slug = dummyCategory.ToLowerInvariant() switch
            {
                "smartphones" or "tablets" or "mobile-accessories" => "pcs-accessories",
                "laptops" => "pcs-accessories",
                "mens-shirts" or "tops" => "t-shirts",
                "womens-dresses" => "casual-womens-clothing",
                "womens-shoes" or "mens-shoes" or "sports-accessories" => "fashion",
                "sunglasses" or "womens-bags" or "womens-jewellery"
                    or "womens-watches" or "mens-watches" => "womens-fashion",
                "beauty" or "fragrances" or "skin-care" => "beauty",
                "furniture" or "home-decoration" or "kitchen-accessories" or "groceries" => "home-kitchen",
                "motorcycle" or "vehicle" => "electronics",
                _ => "electronics"
            };

            var hit = categories.FirstOrDefault(c => c.Slug == slug)
                ?? categories.FirstOrDefault(c => c.Slug == "electronics")
                ?? categories.First();
            return hit.Id;
        }

        var existingSkus = await db.Products
            .Where(p => p.Sku.StartsWith("DJ-"))
            .Select(p => p.Sku)
            .ToListAsync();
        var known = new HashSet<string>(existingSkus, StringComparer.OrdinalIgnoreCase);

        var added = 0;
        foreach (var pack in catalog)
        {
            var sku = $"DJ-{pack.Id:D3}";
            if (!known.Add(sku))
                continue;

            var product = Product(
                name: pack.Title,
                sku: sku,
                brand: pack.Brand,
                categoryId: ResolveCategoryId(pack.Category),
                price: pack.Price,
                oldPrice: pack.Price > 20 ? Math.Round(pack.Price * 1.25m, 2) : null,
                stock: pack.Stock,
                rating: pack.Rating,
                reviews: 12 + (pack.Id % 40),
                bestSeller: pack.Rating >= 4.5m || pack.Id % 7 == 0,
                description: pack.Description);

            product.Slug = SlugHelper.FromName($"{pack.Title}-{pack.Id}");
            db.Products.Add(product);
            AddImages(db, product.Id, GalleryUrls(pack), pack.Title);
            added++;
        }

        if (added > 0)
            await db.SaveChangesAsync();
    }

    private static (string Image, string Icon) CategoryVisuals(string slug, string name)
    {
        // Стабильные Unsplash-URL (crop) — разные «витринные» фото по тематике.
        var key = (slug ?? name).ToLowerInvariant();
        if (key.Contains("electronic") || key.Contains("pc") || key.Contains("accessories"))
            return (
                "https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=640&h=640&q=80",
                "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=128&h=128&q=80");
        if (key.Contains("stream"))
            return (
                "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=640&h=640&q=80",
                "https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?auto=format&fit=crop&w=128&h=128&q=80");
        if (key.Contains("fashion") || key.Contains("women") || key.Contains("casual") || key.Contains("shirt") || key.Contains("tee") || key.Contains("top"))
            return (
                "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=640&h=640&q=80",
                "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=128&h=128&q=80");
        return (
            $"https://picsum.photos/seed/cat-{SanitizeSeed(key)}/640/640",
            $"https://picsum.photos/seed/icon-{SanitizeSeed(key)}/128/128");
    }

    private static string ImageThemeFor(Product p)
    {
        var slug = p.Category?.Slug ?? "";
        var name = (p.Name + " " + p.Brand + " " + slug).ToLowerInvariant();
        if (name.Contains("roku") || name.Contains("stream")) return "stream-box";
        if (name.Contains("headphone") || name.Contains("headset")) return "audio-gear";
        if (name.Contains("keyboard")) return "mech-keyboard";
        if (name.Contains("shoe") || name.Contains("aqua")) return "water-shoes";
        if (name.Contains("hat")) return "sun-hat";
        if (name.Contains("dress")) return "summer-dress";
        if (name.Contains("tee") || name.Contains("t-shirt") || name.Contains("shirt")) return "soft-tee";
        if (slug.Contains("electronic") || slug.Contains("pc")) return "gadget-desk";
        if (slug.Contains("fashion") || slug.Contains("women")) return "fashion-rack";
        return SanitizeSeed(p.Sku);
    }

    private static string SanitizeSeed(string raw)
    {
        var chars = raw.Where(char.IsLetterOrDigit).Take(24).ToArray();
        return chars.Length == 0 ? "perry" : new string(chars).ToLowerInvariant();
    }

    private static ProductReview RandomReview(Guid productId, string theme, int index, string? photoUrl = null)
    {
        var authors = new[]
        {
            "Alex M.", "Jordan K.", "Sam Rivera", "Taylor Brooks", "Casey Nguyen",
            "Morgan Lee", "Riley Quinn", "Avery Chen", "Jamie Ortiz", "Cameron Blake",
            "Louisa Hines", "Sylvia Kennedy", "Cecilia Small", "Noah Patel", "Harper Diaz"
        };
        var titles = new[]
        {
            "Exactly as described", "Great everyday pick", "Worth the price", "Solid quality",
            "Would buy again", "Happy with this", "Nice surprise", "Does the job",
            "Comfortable and neat", "Fast favourite"
        };
        var bodies = new[]
        {
            "Arrived quickly and matched the photos. Using it daily without issues.",
            "Good build for the money. Packaging was neat and setup was simple.",
            "Looks better in person. Comfortable and fits the description well.",
            "Not perfect, but for this price I am satisfied. Recommend for casual use.",
            "Quality feels premium. Got compliments already.",
            "Works as expected. Battery/life or fabric hold up after a week of use.",
            "Colour is accurate. Size guidance was helpful.",
            "A few small quirks, still a clear upgrade over my old one."
        };
        var tagPool = new[]
        {
            "High quality", "Worth the price", "Fits the description", "Matches the photos",
            "Easy to use", "Great value", "Comfortable", "True to size", "Fast shipping", "Stylish"
        };

        var seed = Math.Abs(HashCode.Combine(productId, index, theme));
        var rating = 3 + (seed % 3); // 3..5 — витрина выглядит позитивно
        if (seed % 11 == 0) rating = 2;

        var reviewId = Guid.NewGuid();
        var review = new ProductReview
        {
            Id = reviewId,
            ProductId = productId,
            // Distinct seed UserId so unique (UserId, ProductId) holds across bulk reviews.
            UserId = Guid.NewGuid(),
            AuthorName = authors[seed % authors.Length],
            Rating = rating,
            Title = titles[(seed / 3) % titles.Length],
            Body = bodies[(seed / 5) % bodies.Length],
            IsApproved = true,
            CreatedAtUtc = DateTime.UtcNow.AddDays(-(1 + seed % 120))
        };

        var tagCount = 1 + seed % 3;
        for (var t = 0; t < tagCount; t++)
        {
            review.Tags.Add(new ProductReviewTag
            {
                Id = Guid.NewGuid(),
                ReviewId = reviewId,
                Name = tagPool[(seed + t * 4) % tagPool.Length]
            });
        }

        if (seed % 3 == 0)
        {
            review.Images.Add(new ProductReviewImage
            {
                Id = Guid.NewGuid(),
                ReviewId = reviewId,
                Url = !string.IsNullOrWhiteSpace(photoUrl)
                    ? photoUrl!
                    : $"https://cdn.dummyjson.com/product-images/beauty/essence-mascara-lash-princess/thumbnail.webp"
            });
        }

        return review;
    }

    /// <summary>Дополняет dress демо-данными Product Page (about / reviews), если БД уже была.</summary>
    private static async Task EnsureProductPageDemoAsync(AppDbContext db, IReadOnlyList<DummyPack> catalog)
    {
        var dress = await db.Products
            .Include(p => p.AboutItems)
            .Include(p => p.Reviews).ThenInclude(r => r.Tags)
            .Include(p => p.Attributes)
            .FirstOrDefaultAsync(p => p.Name.Contains("Dress") || p.Sku == "DKT-DR-2024" || p.Sku == "5498209487628");
        if (dress is null) return;

        var dressPhoto = catalog.FirstOrDefault(p => p.Category == "womens-dresses")?.Thumbnail
            ?? catalog.FirstOrDefault()?.Thumbnail
            ?? "https://cdn.dummyjson.com/product-images/womens-dresses/black-women-s-gown/thumbnail.webp";

        var changed = false;
        if (!dress.AboutItems.Any())
        {
            db.ProductAboutItems.AddRange(
                About(dress.Id, "Soft fabric", "Made of 49% rayon, 34% polyester and 17% nylon. Soft, lightweight and breathable fabric keeps you cool on warm days.", 1),
                About(dress.Id, "Unique design", "Button down shirt dress. Long sleeve shirt dresses, knee-length, side slit and two side pockets.", 2),
                About(dress.Id, "Fashion matching", "Perfect with casual shoes, sandals, slippers, sneakers or boots. You can wear a belt to create a different look.", 3),
                About(dress.Id, "Various occasions", "Great for all occasions — casual, vacation, party, working, shopping, dating or daily wear. Also perfect as a beach cover-up.", 4));
            changed = true;
        }

        if (!dress.Attributes.Any(a => a.Name == "Care instructions"))
        {
            db.ProductAttributes.AddRange(
                Attr(dress.Id, "Fabric type", "49% rayon, 34% polyester, 17% nylon", 10),
                Attr(dress.Id, "Care instructions", "Machine wash", 11),
                Attr(dress.Id, "Origin", "Imported", 12),
                Attr(dress.Id, "Closure type", "Button", 13));
            changed = true;
        }

        if (!dress.Reviews.Any())
        {
            var r1 = new ProductReview
            {
                Id = Guid.NewGuid(),
                ProductId = dress.Id,
                UserId = Guid.Parse("11111111-1111-1111-1111-111111111101"),
                AuthorName = "Louisa Hines",
                Rating = 5,
                Title = "It's true to size and has pockets",
                Body = "I absolutely adore this dress. I've gotten numerous compliments. It's incredibly comfortable!",
                IsApproved = true,
                CreatedAtUtc = DateTime.UtcNow.AddDays(-40)
            };
            var r2 = new ProductReview
            {
                Id = Guid.NewGuid(),
                ProductId = dress.Id,
                UserId = Guid.Parse("11111111-1111-1111-1111-111111111102"),
                AuthorName = "Sylvia Kennedy",
                Rating = 5,
                Title = "Elegant",
                Body = "The fabric feels like a cotton-linen blend. It fits the shoulders well and hangs loosely on the chest and waist.",
                IsApproved = true,
                CreatedAtUtc = DateTime.UtcNow.AddDays(-70)
            };
            var r3 = new ProductReview
            {
                Id = Guid.NewGuid(),
                ProductId = dress.Id,
                UserId = Guid.Parse("11111111-1111-1111-1111-111111111103"),
                AuthorName = "Cecilia Small",
                Rating = 3,
                Title = "Shift dress",
                Body = "I loved the look and color, but it was way too big. Size L felt like XL.",
                IsApproved = true,
                CreatedAtUtc = DateTime.UtcNow.AddDays(-90)
            };
            db.ProductReviews.AddRange(r1, r2, r3);
            db.ProductReviewTags.AddRange(
                new ProductReviewTag { Id = Guid.NewGuid(), ReviewId = r1.Id, Name = "High quality" },
                new ProductReviewTag { Id = Guid.NewGuid(), ReviewId = r1.Id, Name = "Actual price" },
                new ProductReviewTag { Id = Guid.NewGuid(), ReviewId = r1.Id, Name = "Worth the price" },
                new ProductReviewTag { Id = Guid.NewGuid(), ReviewId = r2.Id, Name = "Fits the description" },
                new ProductReviewTag { Id = Guid.NewGuid(), ReviewId = r2.Id, Name = "Matches the photos" });
            db.ProductReviewImages.Add(new ProductReviewImage
            {
                Id = Guid.NewGuid(),
                ReviewId = r2.Id,
                Url = dressPhoto
            });
            dress.AverageRating = 4m;
            dress.ReviewCount = Math.Max(dress.ReviewCount, 3);
            changed = true;
        }

        if (changed)
            await db.SaveChangesAsync();
    }

    private static async Task SeedDemoCatalogAsync(AppDbContext db, IReadOnlyList<DummyPack> catalog)
    {
        // --- Категории (дерево как в макете) ---
        var electronics = Cat("Electronics", "electronics", 1);
        var streaming = Cat("Streaming devices", "streaming-devices", 1, electronics.Id);
        var fashion = Cat("Fashion", "fashion", 2);
        var women = Cat("Women's fashion", "womens-fashion", 1, fashion.Id);
        var casual = Cat("Casual Women's Clothing", "casual-womens-clothing", 1, women.Id);
        var tops = Cat("Tops, Tees & Blouses", "tops-tees-blouses", 1, casual.Id);
        var tshirts = Cat("T-Shirts", "t-shirts", 1, tops.Id);
        var pcs = Cat("PCs & Accessories", "pcs-accessories", 2, electronics.Id);

        db.Categories.AddRange(electronics, streaming, fashion, women, casual, tops, tshirts, pcs);
        await db.SaveChangesAsync();

        // --- Товары ---
        var roku = Product(
            name: "Roku Express 4K+ | Roku Streaming Device 4K/HDR, Roku Voice Remote, Free & Live TV",
            sku: "3941R2",
            brand: "Roku",
            categoryId: streaming.Id,
            price: 29.00m,
            oldPrice: 39.00m,
            stock: 48,
            rating: 4.0m,
            reviews: 8620,
            bestSeller: true,
            description: "Brilliant 4K picture quality with HDR. Seamless streaming to your TV. Voice search & control with the Roku Voice Remote.");

        var tee1 = Product(
            name: "PUMIEY Women's Long Sleeve T-Shirt Soft Lightweight Tee",
            sku: "PUM-LS-001",
            brand: "PUMIEY",
            categoryId: tshirts.Id,
            price: 19.99m,
            oldPrice: 32.99m,
            stock: 120,
            rating: 4.3m,
            reviews: 448,
            bestSeller: true,
            description: "Soft stretch fabric, relaxed fit. Everyday essential for casual looks.");

        var tee2 = Product(
            name: "Abardsion Women's Classic Crew Neck Tee",
            sku: "ABR-CR-014",
            brand: "Abardsion",
            categoryId: tshirts.Id,
            price: 14.50m,
            oldPrice: 24.00m,
            stock: 80,
            rating: 4.1m,
            reviews: 312,
            bestSeller: false,
            description: "Breathable cotton blend crew neck tee for daily wear.");

        var tee3 = Product(
            name: "Trendy Queen Women's Crop Top Casual Tee",
            sku: "TQ-CR-022",
            brand: "Trendy Queen",
            categoryId: tshirts.Id,
            price: 22.00m,
            oldPrice: 29.99m,
            stock: 55,
            rating: 4.2m,
            reviews: 210,
            bestSeller: false,
            description: "Cropped casual tee for everyday outfits.");

        var tee4 = Product(
            name: "ANRABESS Women's Oversized T-Shirt",
            sku: "ANR-OV-008",
            brand: "ANRABESS",
            categoryId: tshirts.Id,
            price: 18.99m,
            oldPrice: 27.00m,
            stock: 90,
            rating: 4.4m,
            reviews: 633,
            bestSeller: true,
            description: "Oversized soft cotton tee.");

        var dress = Product(
            name: "Dokotoo Womens Dresses 2024 Summer Casual Midi Dress",
            sku: "DKT-DR-2024",
            brand: "Dokotoo",
            categoryId: casual.Id,
            price: 24.99m,
            oldPrice: 32.99m,
            stock: 35,
            rating: 4.5m,
            reviews: 1204,
            bestSeller: true,
            description: "Flowy midi dress with soft fabric. Perfect for summer days.");

        var shoes = Product(
            name: "WateLves Water Shoes Mens Quick-Dry Aqua Socks",
            sku: "WTL-WS-088",
            brand: "WateLves",
            categoryId: fashion.Id,
            price: 16.99m,
            oldPrice: null,
            stock: 0,
            rating: 4.2m,
            reviews: 567,
            bestSeller: false,
            description: "Lightweight water shoes with quick-dry mesh. Ideal for beach and pool.",
            status: ProductStatus.OutOfStock);

        var headset = Product(
            name: "Essentials Wireless On-Ear Headphones",
            sku: "ESS-HP-220",
            brand: "Essentials",
            categoryId: pcs.Id,
            price: 7.40m,
            oldPrice: 14.20m,
            stock: 200,
            rating: 4.3m,
            reviews: 1547,
            bestSeller: true,
            description: "Comfortable on-ear headphones with wireless Bluetooth connectivity.");

        var keyboard = Product(
            name: "Deals in PCs Compact Mechanical Keyboard",
            sku: "PC-KB-441",
            brand: "KeyPro",
            categoryId: pcs.Id,
            price: 45.00m,
            oldPrice: 59.00m,
            stock: 60,
            rating: 4.6m,
            reviews: 890,
            bestSeller: true,
            description: "Compact mechanical keyboard with RGB backlight for work and gaming.");

        var hat = Product(
            name: "Lack of Color Women's Ventura Hat",
            sku: "LOC-VT-003",
            brand: "Lack of Color",
            categoryId: women.Id,
            price: 89.00m,
            oldPrice: 110.00m,
            stock: 22,
            rating: 4.4m,
            reviews: 156,
            bestSeller: false,
            description: "Stylish wide-brim hat for sunny days.");

        db.Products.AddRange(roku, tee1, tee2, tee3, tee4, dress, shoes, headset, keyboard, hat);
        await db.SaveChangesAsync();

        void SeedGallery(Product product, params string[] preferredCats)
        {
            var pool = preferredCats.Length == 0
                ? catalog
                : catalog.Where(p => preferredCats.Contains(p.Category, StringComparer.OrdinalIgnoreCase)).ToList();
            if (pool.Count == 0) pool = catalog.ToList();
            var pack = pool.Count == 0
                ? null
                : pool[Math.Abs(product.Sku.GetHashCode()) % pool.Count];
            if (pack is null)
            {
                AddImages(db, product.Id, ImageThemeFor(product));
                return;
            }
            AddImages(db, product.Id, GalleryUrls(pack), pack.Title);
        }

        SeedGallery(roku, "tablets", "smartphones", "mobile-accessories");
        SeedGallery(tee1, "tops", "mens-shirts");
        SeedGallery(tee2, "tops", "mens-shirts");
        SeedGallery(tee3, "tops");
        SeedGallery(tee4, "tops", "mens-shirts");
        SeedGallery(dress, "womens-dresses");
        SeedGallery(shoes, "mens-shoes", "womens-shoes", "sports-accessories");
        SeedGallery(headset, "mobile-accessories");
        SeedGallery(keyboard, "laptops", "mobile-accessories");
        SeedGallery(hat, "sunglasses", "womens-bags");

        var dressPhoto = catalog.FirstOrDefault(p => p.Category == "womens-dresses")?.Thumbnail
            ?? "https://cdn.dummyjson.com/product-images/womens-dresses/black-women-s-gown/thumbnail.webp";

        db.ProductAttributes.AddRange(
            Attr(roku.Id, "Brand", "Roku", 1),
            Attr(roku.Id, "Color", "Black", 2),
            Attr(roku.Id, "Item weight", "1.6 ounces", 3),
            Attr(roku.Id, "Product dimensions", "3 x 1.5 x 0.83 inches", 4),
            Attr(roku.Id, "Batteries", "2 AAA batteries required", 5),
            Attr(roku.Id, "Item model number", "3941R2", 6));

        db.ProductAboutItems.AddRange(
            About(roku.Id, "Brilliant 4K picture quality", "Enjoy sharp 4K HDR streaming on compatible TVs.", 1),
            About(roku.Id, "Seamless streaming", "Launch your favorite channels in seconds from the home screen.", 2),
            About(roku.Id, "Voice search & control", "Use the Roku Voice Remote to find shows hands-free.", 3),
            About(roku.Id, "Free & Live TV", "Access free live channels and popular streaming apps.", 4),
            About(dress.Id, "Soft fabric", "Made of 49% rayon, 34% polyester and 17% nylon. Soft, lightweight and breathable fabric keeps you cool on warm days.", 1),
            About(dress.Id, "Unique design", "Button down shirt dress. Long sleeve shirt dresses, knee-length, side slit and two side pockets.", 2),
            About(dress.Id, "Fashion matching", "Perfect with casual shoes, sandals, slippers, sneakers or boots. You can wear a belt to create a different look.", 3),
            About(dress.Id, "Various occasions", "Great for all occasions — casual, vacation, party, working, shopping, dating or daily wear. Also perfect as a beach cover-up.", 4));

        db.ProductAttributes.AddRange(
            Attr(dress.Id, "Fabric type", "49% rayon, 34% polyester, 17% nylon", 1),
            Attr(dress.Id, "Care instructions", "Machine wash", 2),
            Attr(dress.Id, "Origin", "Imported", 3),
            Attr(dress.Id, "Closure type", "Button", 4));

        var review1 = new ProductReview
        {
            Id = Guid.NewGuid(),
            ProductId = roku.Id,
            UserId = Guid.Parse("22222222-2222-2222-2222-222222222201"),
            AuthorName = "Alex M.",
            Rating = 5,
            Title = "Easy to use",
            Body = "Set up in minutes. Picture looks great in 4K. Remote voice search works well.",
            IsApproved = true,
            CreatedAtUtc = DateTime.UtcNow.AddDays(-12)
        };
        var review2 = new ProductReview
        {
            Id = Guid.NewGuid(),
            ProductId = roku.Id,
            UserId = Guid.Parse("22222222-2222-2222-2222-222222222202"),
            AuthorName = "Jordan K.",
            Rating = 4,
            Title = "Great value",
            Body = "Does everything I need. Wish the remote had a headphone jack, but still recommend.",
            IsApproved = true,
            CreatedAtUtc = DateTime.UtcNow.AddDays(-5)
        };

        var dressReview1 = new ProductReview
        {
            Id = Guid.NewGuid(),
            ProductId = dress.Id,
            UserId = Guid.Parse("22222222-2222-2222-2222-222222222203"),
            AuthorName = "Louisa Hines",
            Rating = 5,
            Title = "It's true to size and has pockets",
            Body = "I absolutely adore this dress. I've gotten numerous compliments, with people saying I look stylish. It's incredibly comfortable!",
            IsApproved = true,
            CreatedAtUtc = DateTime.UtcNow.AddDays(-40)
        };
        var dressReview2 = new ProductReview
        {
            Id = Guid.NewGuid(),
            ProductId = dress.Id,
            UserId = Guid.Parse("22222222-2222-2222-2222-222222222204"),
            AuthorName = "Sylvia Kennedy",
            Rating = 5,
            Title = "Elegant",
            Body = "The fabric feels like a cotton-linen blend. It fits the shoulders well and hangs loosely on the chest and waist.",
            IsApproved = true,
            CreatedAtUtc = DateTime.UtcNow.AddDays(-70)
        };
        var dressReview3 = new ProductReview
        {
            Id = Guid.NewGuid(),
            ProductId = dress.Id,
            UserId = Guid.Parse("22222222-2222-2222-2222-222222222205"),
            AuthorName = "Cecilia Small",
            Rating = 3,
            Title = "Shift dress",
            Body = "I loved the look and color of the dress, but it was way too big. I usually order a size L, but this dress felt like an XL.",
            IsApproved = true,
            CreatedAtUtc = DateTime.UtcNow.AddDays(-90)
        };

        db.ProductReviews.AddRange(review1, review2, dressReview1, dressReview2, dressReview3);
        db.ProductReviewTags.AddRange(
            new ProductReviewTag { Id = Guid.NewGuid(), ReviewId = review1.Id, Name = "easy to use" },
            new ProductReviewTag { Id = Guid.NewGuid(), ReviewId = review1.Id, Name = "remote control" },
            new ProductReviewTag { Id = Guid.NewGuid(), ReviewId = review2.Id, Name = "great value" },
            new ProductReviewTag { Id = Guid.NewGuid(), ReviewId = dressReview1.Id, Name = "High quality" },
            new ProductReviewTag { Id = Guid.NewGuid(), ReviewId = dressReview1.Id, Name = "Actual price" },
            new ProductReviewTag { Id = Guid.NewGuid(), ReviewId = dressReview1.Id, Name = "Worth the price" },
            new ProductReviewTag { Id = Guid.NewGuid(), ReviewId = dressReview2.Id, Name = "Fits the description" },
            new ProductReviewTag { Id = Guid.NewGuid(), ReviewId = dressReview2.Id, Name = "Matches the photos" });

        db.ProductReviewImages.Add(new ProductReviewImage
        {
            Id = Guid.NewGuid(),
            ReviewId = dressReview2.Id,
            Url = dressPhoto
        });

        // Align dress card numbers with Product Page mockup vibe.
        dress.Sku = "5498209487628";
        dress.Name = "Zeagoo Women's Casual Summer Shirt Dress with Long Sleeves, Button Down Front, Pockets - Beach Cover-Up";
        dress.Price = 38.74m;
        dress.OldPrice = null;
        dress.AverageRating = 4m;
        dress.ReviewCount = 242;
        dress.Slug = "zeagoo-womens-casual-summer-shirt-dress";

        await db.SaveChangesAsync();
    }

    /// <summary>
    /// Гарантирует filterable Color / Size / Fabric type на товарах (для сайдбара Product List).
    /// </summary>
    private static async Task EnsureCatalogFilterAttributesAsync(AppDbContext db)
    {
        var products = await db.Products
            .Include(p => p.Attributes)
            .ToListAsync();
        if (products.Count == 0) return;

        var colors = new[] { "White", "Black", "Red", "Blue", "Green", "Pink", "Grey", "Beige", "Navy", "Cream" };
        var sizes = new[] { "XS", "S", "M", "L", "XL", "2XL", "3XL" };
        var fabrics = new[] { "Cotton", "Polyamide", "Elastane", "Polyester", "Linen", "Viscose" };
        var changed = false;
        var i = 0;

        foreach (var p in products)
        {
            void Ensure(string name, string value)
            {
                if (p.Attributes.Any(a => a.Name == name && a.Value == value)) return;
                var attr = Attr(p.Id, name, value, p.Attributes.Count + 1, true);
                p.Attributes.Add(attr);
                db.ProductAttributes.Add(attr);
                changed = true;
            }

            // По одному значению каждого типа на товар — чтобы фильтры работали.
            Ensure("Color", colors[i % colors.Length]);
            Ensure("Size", sizes[i % sizes.Length]);
            Ensure("Fabric type", fabrics[i % fabrics.Length]);
            if (i % 3 == 0)
                Ensure("Fabric type", fabrics[(i + 1) % fabrics.Length]);
            i++;
        }

        // Отдельная категория T-Shirts, если её ещё нет (старые БД).
        if (!await db.Categories.AnyAsync(c => c.Slug == "t-shirts"))
        {
            var tops = await db.Categories.FirstOrDefaultAsync(c => c.Slug == "tops-tees-blouses");
            var tshirts = Cat("T-Shirts", "t-shirts", 1, tops?.Id);
            db.Categories.Add(tshirts);
            changed = true;

            var teeProducts = products.Where(p =>
                p.Name.Contains("T-Shirt", StringComparison.OrdinalIgnoreCase)
                || p.Name.Contains("Tee", StringComparison.OrdinalIgnoreCase)).ToList();
            foreach (var p in teeProducts)
                p.CategoryId = tshirts.Id;
        }

        if (changed)
            await db.SaveChangesAsync();
    }

    /// <summary>Backfill Slug для уже существующих товаров после миграции.</summary>
    private static async Task EnsureProductSlugsAsync(AppDbContext db)
    {
        var missing = await db.Products
            .Where(p => p.Slug == null || p.Slug == "")
            .ToListAsync();
        if (missing.Count == 0)
            return;

        var used = await db.Products
            .Where(p => p.Slug != null && p.Slug != "")
            .Select(p => p.Slug)
            .ToListAsync();
        var usedSet = used.ToHashSet(StringComparer.OrdinalIgnoreCase);

        foreach (var p in missing)
        {
            var baseSlug = SlugHelper.FromName(string.IsNullOrWhiteSpace(p.Sku) ? p.Name : p.Sku);
            p.Slug = SlugHelper.Unique(baseSlug, s => usedSet.Contains(s));
            usedSet.Add(p.Slug);
        }

        await db.SaveChangesAsync();
    }

    private static Category Cat(string name, string slug, int order, Guid? parentId = null) => new()
    {
        Id = Guid.NewGuid(),
        Name = name,
        Slug = slug,
        SortOrder = order,
        IsActive = true,
        ParentCategoryId = parentId,
        CreatedAtUtc = DateTime.UtcNow
    };

    private static Product Product(
        string name,
        string sku,
        string brand,
        Guid categoryId,
        decimal price,
        decimal? oldPrice,
        int stock,
        decimal rating,
        int reviews,
        bool bestSeller,
        string description,
        ProductStatus status = ProductStatus.Active) => new()
    {
        Id = Guid.NewGuid(),
        Name = name,
        Sku = sku,
        Slug = SlugHelper.FromName(sku),
        Brand = brand,
        CategoryId = categoryId,
        Price = price,
        OldPrice = oldPrice,
        StockQuantity = stock,
        Status = stock <= 0 ? ProductStatus.OutOfStock : status,
        AverageRating = rating,
        ReviewCount = reviews,
        IsBestSeller = bestSeller,
        Description = description,
        // #A11 — demo seller = local Admin guid
        SellerId = Guid.Parse("d78e94a9-cf1d-43f3-9ecd-643149b9e95a"),
        CreatedAtUtc = DateTime.UtcNow
    };

    private static void AddImages(AppDbContext db, Guid productId, string seed)
    {
        // Fallback only if DummyJSON catalog is empty.
        for (var i = 0; i < 4; i++)
        {
            db.ProductImages.Add(new ProductImage
            {
                Id = Guid.NewGuid(),
                ProductId = productId,
                Url = $"https://cdn.dummyjson.com/product-images/beauty/essence-mascara-lash-princess/{Math.Min(i + 1, 1)}.webp",
                SortOrder = i,
                IsPrimary = i == 0,
                IsVideo = false,
                AltText = seed
            });
        }
    }

    private static void AddImages(AppDbContext db, Guid productId, IReadOnlyList<string> urls, string altText)
    {
        if (urls.Count == 0)
        {
            AddImages(db, productId, altText);
            return;
        }

        var count = Math.Min(4, Math.Max(1, urls.Count));
        for (var i = 0; i < count; i++)
        {
            db.ProductImages.Add(new ProductImage
            {
                Id = Guid.NewGuid(),
                ProductId = productId,
                Url = urls[i % urls.Count],
                SortOrder = i,
                IsPrimary = i == 0,
                IsVideo = false,
                AltText = altText
            });
        }
    }

    private static ProductAttribute Attr(Guid productId, string name, string value, int order, bool filterable = false) => new()
    {
        Id = Guid.NewGuid(),
        ProductId = productId,
        Name = name,
        Value = value,
        SortOrder = order,
        IsFilterable = filterable
    };

    private static ProductAboutItem About(Guid productId, string title, string description, int order) => new()
    {
        Id = Guid.NewGuid(),
        ProductId = productId,
        Title = title,
        Description = description,
        SortOrder = order
    };
}
