using Perry.Domain.Entities;
using Perry.Domain.Enums;
using Perry.Infrastructure.Persistence;
using Perry.Infrastructure.Services;
using Perry.Web.Extensions;
using Perry.Web.ViewModels;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;

namespace Perry.Web.Pages.Products;

/// <summary>
/// Карточка товара (Desktop - Product Page): галерея, about, buy-box,
/// product details, customer reviews, related carousels.
/// </summary>
public class DetailsModel : PageModel
{
    private readonly AppDbContext _db;
    private readonly IViewedProductsService _viewed;
    private readonly IProductService _products;

    public DetailsModel(AppDbContext db, IViewedProductsService viewed, IProductService products)
    {
        _db = db;
        _viewed = viewed;
        _products = products;
    }

    public ProductDetailsVm? Product { get; private set; }
    public List<ProductCardVm> Related { get; private set; } = [];
    public List<ProductCardVm> SaleRelated { get; private set; } = [];
    public List<ProductCardVm> BestInCategory { get; private set; } = [];
    public List<ProductCardVm> ViewedProducts { get; private set; } = [];
    public Dictionary<int, int> RatingDistribution { get; private set; } = new();
    public List<string> FrequentTags { get; private set; } = [];
    public List<ReviewVm> FilteredReviews { get; private set; } = [];
    public int? RatingFilter { get; private set; }

    public async Task<IActionResult> OnGetAsync(string id, int? rating, CancellationToken cancellationToken)
    {
        var productId = await ResolveProductIdAsync(id, cancellationToken);
        if (productId is null)
            return NotFound();

        RatingFilter = rating is >= 1 and <= 5 ? rating : null;

        Product = await _db.Products
            .AsNoTracking()
            .Where(p => p.Id == productId)
            .Select(p => new ProductDetailsVm
            {
                Id = p.Id,
                Name = p.Name,
                Slug = p.Slug,
                Description = p.Description,
                Sku = p.Sku,
                Brand = p.Brand,
                Price = p.Price,
                OldPrice = p.OldPrice,
                DiscountPercent = p.OldPrice != null && p.OldPrice > p.Price
                    ? (int?)Math.Round((p.OldPrice.Value - p.Price) / p.OldPrice.Value * 100)
                    : null,
                StockQuantity = p.StockQuantity,
                Status = p.Status,
                AverageRating = p.AverageRating,
                ReviewCount = p.ReviewCount,
                IsBestSeller = p.IsBestSeller,
                CategoryId = p.CategoryId,
                CategoryName = p.Category.Name,
                ParentCategoryName = p.Category.ParentCategory != null ? p.Category.ParentCategory.Name : null,
                GrandparentCategoryName = p.Category.ParentCategory != null && p.Category.ParentCategory.ParentCategory != null
                    ? p.Category.ParentCategory.ParentCategory.Name
                    : null,
                ParentCategoryId = p.Category.ParentCategoryId,
                GrandparentCategoryId = p.Category.ParentCategory != null
                    ? p.Category.ParentCategory.ParentCategoryId
                    : null,
                Images = p.Images.OrderBy(i => i.SortOrder)
                    .Select(i => new ImageVm { Url = i.Url, IsPrimary = i.IsPrimary, IsVideo = i.IsVideo })
                    .ToList(),
                Attributes = p.Attributes.OrderBy(a => a.SortOrder)
                    .Select(a => new AttrVm { Name = a.Name, Value = a.Value })
                    .ToList(),
                AboutItems = p.AboutItems.OrderBy(a => a.SortOrder)
                    .Select(a => new AboutVm { Title = a.Title, Description = a.Description })
                    .ToList(),
                Reviews = p.Reviews.Where(r => r.IsApproved).OrderByDescending(r => r.CreatedAtUtc)
                    .Select(r => new ReviewVm
                    {
                        AuthorName = r.AuthorName,
                        Rating = r.Rating,
                        Title = r.Title,
                        Body = r.Body,
                        CreatedAtUtc = r.CreatedAtUtc,
                        Tags = r.Tags.Select(t => t.Name).ToList(),
                        Images = r.Images.Select(i => i.Url).ToList(),
                        HelpfulCount = 0
                    })
                    .ToList()
            })
            .FirstOrDefaultAsync(cancellationToken);

        if (Product is null)
            return NotFound();

        Product.Breadcrumbs = BuildBreadcrumbs(Product);

        var approved = Product.Reviews;
        var total = Math.Max(1, approved.Count);
        RatingDistribution = Enumerable.Range(1, 5)
            .ToDictionary(
                star => star,
                star => (int)Math.Round(100.0 * approved.Count(r => r.Rating == star) / total));

        // Demo-friendly bars when few reviews: keep percentages summing roughly to 100.
        if (approved.Count == 0 && Product.ReviewCount > 0)
        {
            RatingDistribution = new Dictionary<int, int>
            {
                [5] = 65, [4] = 16, [3] = 10, [2] = 4, [1] = 5
            };
        }

        FrequentTags = approved
            .SelectMany(r => r.Tags)
            .GroupBy(t => t)
            .OrderByDescending(g => g.Count())
            .Select(g => g.Key)
            .Take(8)
            .ToList();

        FilteredReviews = RatingFilter is null
            ? approved
            : approved.Where(r => r.Rating == RatingFilter).ToList();

        // Stable faux helpful counts for UI parity with mockup.
        for (var i = 0; i < FilteredReviews.Count; i++)
            FilteredReviews[i].HelpfulCount = i switch { 0 => 0, 1 => 25, 2 => 0, _ => i % 3 };

        _viewed.AddViewedProduct(productId.Value);

        Related = (await _products.GetRelatedAsync(productId.Value, 8, cancellationToken)).ToCardVms();

        var others = _db.Products
            .AsNoTracking()
            .Where(x => x.Id != productId
                && (x.Status == ProductStatus.Active || x.Status == ProductStatus.OutOfStock));

        BestInCategory = await MapCards(
            others.Where(x => x.CategoryId == Product.CategoryId).Where(x => x.IsBestSeller).Take(8),
            cancellationToken);
        if (BestInCategory.Count == 0)
            BestInCategory = Related;

        if (Related.Count == 0)
            Related = BestInCategory;

        SaleRelated = await MapCards(
            others.Where(x => x.OldPrice != null && x.OldPrice > x.Price).Take(8),
            cancellationToken);
        if (SaleRelated.Count == 0)
            SaleRelated = Related;

        ViewedProducts = (await _viewed.GetViewedProductsAsync(8, cancellationToken))
            .Where(x => x.Id != productId)
            .ToCardVms();

        return Page();
    }

    private static List<CrumbVm> BuildBreadcrumbs(ProductDetailsVm p)
    {
        var list = new List<CrumbVm>();
        if (!string.IsNullOrEmpty(p.GrandparentCategoryName))
            list.Add(new CrumbVm { Id = p.GrandparentCategoryId, Name = p.GrandparentCategoryName });
        if (!string.IsNullOrEmpty(p.ParentCategoryName))
            list.Add(new CrumbVm { Id = p.ParentCategoryId, Name = p.ParentCategoryName });
        list.Add(new CrumbVm { Id = p.CategoryId, Name = p.CategoryName });
        return list;
    }

    private async Task<Guid?> ResolveProductIdAsync(string id, CancellationToken ct)
    {
        if (Guid.TryParse(id, out var guid))
            return guid;

        var bySlug = await _products.GetBySlugAsync(id, ct);
        return bySlug?.Id;
    }

    [BindProperty]
    public int AddQuantity { get; set; } = 1;

    [BindProperty]
    public int ReviewRating { get; set; } = 5;

    [BindProperty]
    public string ReviewTitle { get; set; } = string.Empty;

    [BindProperty]
    public string ReviewBody { get; set; } = string.Empty;

    [BindProperty]
    public string ReviewAuthor { get; set; } = string.Empty;

    public async Task<IActionResult> OnPostAddToCartAsync(
        string id,
        string? buyNow,
        [FromServices] ICartService cart,
        CancellationToken ct)
    {
        var productId = await ResolveProductIdAsync(id, ct);
        if (productId is null)
            return NotFound();

        try
        {
            var userId = HttpContext.GetUserId();
            var sid = userId.HasValue ? null : HttpContext.GetOrCreateGuestSessionId();
            await cart.AddAsync(userId, sid, productId.Value, AddQuantity <= 0 ? 1 : AddQuantity, ct);
            if (!string.IsNullOrEmpty(buyNow))
                return RedirectToPage("/Cart/Index");
            TempData["Flash"] = "Added to cart.";
        }
        catch (Exception ex)
        {
            TempData["FlashError"] = ex.Message;
        }

        return RedirectToPage(new { id });
    }

    public async Task<IActionResult> OnPostCreateReviewAsync(string id, CancellationToken ct)
    {
        var productId = await ResolveProductIdAsync(id, ct);
        if (productId is null)
            return NotFound();

        if (ReviewRating is < 1 or > 5 || string.IsNullOrWhiteSpace(ReviewBody))
        {
            TempData["FlashError"] = "Укажите оценку 1–5 и текст отзыва.";
            return RedirectToPage(new { id });
        }

        var product = await _db.Products.FirstOrDefaultAsync(p => p.Id == productId, ct);
        if (product is null)
            return NotFound();

        var author = string.IsNullOrWhiteSpace(ReviewAuthor)
            ? (User.Identity?.Name ?? "Guest")
            : ReviewAuthor.Trim();

        _db.ProductReviews.Add(new ProductReview
        {
            Id = Guid.NewGuid(),
            ProductId = productId.Value,
            UserId = HttpContext.GetUserId(),
            AuthorName = author,
            Rating = ReviewRating,
            Title = string.IsNullOrWhiteSpace(ReviewTitle) ? "Review" : ReviewTitle.Trim(),
            Body = ReviewBody.Trim(),
            IsApproved = true,
            CreatedAtUtc = DateTime.UtcNow
        });

        await _db.SaveChangesAsync(ct);

        var stats = await _db.ProductReviews
            .Where(r => r.ProductId == productId && r.IsApproved)
            .GroupBy(_ => 1)
            .Select(g => new { Count = g.Count(), Avg = g.Average(x => x.Rating) })
            .FirstAsync(ct);

        product.ReviewCount = stats.Count;
        product.AverageRating = Math.Round((decimal)stats.Avg, 2);
        product.UpdatedAtUtc = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);

        TempData["Flash"] = "Review published.";
        return RedirectToPage(new { id });
    }

    private static async Task<List<ProductCardVm>> MapCards(IQueryable<Product> query, CancellationToken ct) =>
        await query.Select(p => new ProductCardVm
        {
            Id = p.Id,
            Name = p.Name,
            Brand = p.Brand,
            Slug = p.Slug,
            Price = p.Price,
            OldPrice = p.OldPrice,
            DiscountPercent = p.OldPrice != null && p.OldPrice > p.Price
                ? (int?)Math.Round((p.OldPrice.Value - p.Price) / p.OldPrice.Value * 100)
                : null,
            AverageRating = p.AverageRating,
            ReviewCount = p.ReviewCount,
            IsBestSeller = p.IsBestSeller,
            Status = p.Status,
            ImageUrl = p.Images.Where(i => i.IsPrimary).Select(i => i.Url).FirstOrDefault()
                ?? p.Images.OrderBy(i => i.SortOrder).Select(i => i.Url).FirstOrDefault()
        }).ToListAsync(ct);

    public class ProductDetailsVm
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Sku { get; set; } = string.Empty;
        public string Brand { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public decimal? OldPrice { get; set; }
        public int? DiscountPercent { get; set; }
        public int StockQuantity { get; set; }
        public ProductStatus Status { get; set; }
        public decimal AverageRating { get; set; }
        public int ReviewCount { get; set; }
        public bool IsBestSeller { get; set; }
        public Guid CategoryId { get; set; }
        public string CategoryName { get; set; } = string.Empty;
        public string? ParentCategoryName { get; set; }
        public string? GrandparentCategoryName { get; set; }
        public Guid? ParentCategoryId { get; set; }
        public Guid? GrandparentCategoryId { get; set; }
        public List<CrumbVm> Breadcrumbs { get; set; } = [];
        public List<ImageVm> Images { get; set; } = [];
        public List<AttrVm> Attributes { get; set; } = [];
        public List<AboutVm> AboutItems { get; set; } = [];
        public List<ReviewVm> Reviews { get; set; } = [];
    }

    public class CrumbVm
    {
        public Guid? Id { get; set; }
        public string Name { get; set; } = string.Empty;
    }

    public class ImageVm
    {
        public string Url { get; set; } = string.Empty;
        public bool IsPrimary { get; set; }
        public bool IsVideo { get; set; }
    }

    public class AttrVm
    {
        public string Name { get; set; } = string.Empty;
        public string Value { get; set; } = string.Empty;
    }

    public class AboutVm
    {
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
    }

    public class ReviewVm
    {
        public string AuthorName { get; set; } = string.Empty;
        public int Rating { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Body { get; set; } = string.Empty;
        public DateTime CreatedAtUtc { get; set; }
        public List<string> Tags { get; set; } = [];
        public List<string> Images { get; set; } = [];
        public int HelpfulCount { get; set; }
    }
}
