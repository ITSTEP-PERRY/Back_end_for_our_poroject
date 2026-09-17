using Perry.Domain.Entities;
using Perry.Domain.Enums;
using Perry.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Perry.Infrastructure.Persistence;

/// <summary>
/// Заполняет БД демо-данными при первом запуске (если таблица Products пустая).
/// Нужно для тестирования главной и карточки товара.
/// </summary>
public static class DbSeeder
{
    /// <summary>Только применить EF-миграции (для API / Azure при старте).</summary>
    public static async Task MigrateAsync(IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await db.Database.MigrateAsync();
    }

    public static async Task SeedAsync(IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        await db.Database.MigrateAsync();
        await EnsureProductSlugsAsync(db);

        if (!await db.Products.AnyAsync())
        {
            await SeedDemoCatalogAsync(db);
        }

        await EnsureCatalogFilterAttributesAsync(db);
        await EnsureProductPageDemoAsync(db);
    }

    /// <summary>Дополняет dress демо-данными Product Page (about / reviews), если БД уже была.</summary>
    private static async Task EnsureProductPageDemoAsync(AppDbContext db)
    {
        var dress = await db.Products
            .Include(p => p.AboutItems)
            .Include(p => p.Reviews).ThenInclude(r => r.Tags)
            .Include(p => p.Attributes)
            .FirstOrDefaultAsync(p => p.Name.Contains("Dress") || p.Sku == "DKT-DR-2024" || p.Sku == "5498209487628");
        if (dress is null) return;

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
                Url = "https://picsum.photos/seed/dress-review/160/160"
            });
            dress.AverageRating = 4m;
            dress.ReviewCount = Math.Max(dress.ReviewCount, 3);
            changed = true;
        }

        if (changed)
            await db.SaveChangesAsync();
    }

    private static async Task SeedDemoCatalogAsync(AppDbContext db)
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

        AddImages(db, roku.Id, "roku");
        AddImages(db, tee1.Id, "tshirt");
        AddImages(db, tee2.Id, "tee");
        AddImages(db, tee3.Id, "croptee");
        AddImages(db, tee4.Id, "oversize");
        AddImages(db, dress.Id, "dress");
        AddImages(db, shoes.Id, "shoes");
        AddImages(db, headset.Id, "headphones");
        AddImages(db, keyboard.Id, "keyboard");
        AddImages(db, hat.Id, "hat");

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
            Url = $"https://picsum.photos/seed/dress-review/160/160"
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
        CreatedAtUtc = DateTime.UtcNow
    };

    private static void AddImages(AppDbContext db, Guid productId, string seed)
    {
        for (var i = 0; i < 4; i++)
        {
            db.ProductImages.Add(new ProductImage
            {
                Id = Guid.NewGuid(),
                ProductId = productId,
                Url = $"https://picsum.photos/seed/{seed}{i}/640/640",
                SortOrder = i,
                IsPrimary = i == 0,
                IsVideo = false,
                AltText = seed
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
