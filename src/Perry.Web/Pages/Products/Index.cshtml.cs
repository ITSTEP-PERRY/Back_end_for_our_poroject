using Perry.Domain.Enums;
using Perry.Infrastructure.Persistence;
using Perry.Infrastructure.Services;
using Perry.Web.ViewModels;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;

namespace Perry.Web.Pages.Products;

/// <summary>
/// Product List Page V2 (Figma): фильтры Brand/Fabric/Size/Color/Price/Reviews + сетка.
/// </summary>
public class IndexModel : PageModel
{
    private readonly AppDbContext _db;
    private readonly ICategoryService _categories;

    public IndexModel(AppDbContext db, ICategoryService categories)
    {
        _db = db;
        _categories = categories;
    }

    [BindProperty(SupportsGet = true)]
    public Guid? CategoryId { get; set; }

    [BindProperty(SupportsGet = true)]
    public string? CategorySlug { get; set; }

    [BindProperty(SupportsGet = true)]
    public string? Search { get; set; }

    [BindProperty(SupportsGet = true)]
    public string[]? Brands { get; set; }

    [BindProperty(SupportsGet = true)]
    public string[]? Fabrics { get; set; }

    [BindProperty(SupportsGet = true)]
    public string[]? Sizes { get; set; }

    [BindProperty(SupportsGet = true)]
    public string[]? Colors { get; set; }

    [BindProperty(SupportsGet = true)]
    public decimal? MinPrice { get; set; }

    [BindProperty(SupportsGet = true)]
    public decimal? MaxPrice { get; set; }

    [BindProperty(SupportsGet = true)]
    public int? MinRating { get; set; }

    [BindProperty(SupportsGet = true)]
    public string Sort { get; set; } = "price_desc";

    [BindProperty(SupportsGet = true)]
    public string View { get; set; } = "grid";

    [BindProperty(SupportsGet = true)]
    public int PageNumber { get; set; } = 1;

    public string? CategoryName { get; private set; }
    public List<BreadcrumbItem> Breadcrumbs { get; private set; } = [];
    public List<ProductCardVm> Products { get; private set; } = [];
    public List<string> BrandOptions { get; private set; } = [];
    public List<string> FabricOptions { get; private set; } = [];
    public List<string> SizeOptions { get; private set; } = [];
    public List<string> ColorOptions { get; private set; } = [];
    public int Total { get; private set; }
    public int TotalPages { get; private set; }
    public int AppliedFiltersCount { get; private set; }
    public const int PageSize = 15;

    public async Task OnGetAsync(CancellationToken cancellationToken)
    {
        if (PageNumber < 1) PageNumber = 1;
        View = View is "list" ? "list" : "grid";
        Brands = Normalize(Brands);
        Fabrics = Normalize(Fabrics);
        Sizes = Normalize(Sizes);
        Colors = Normalize(Colors);

        if (!CategoryId.HasValue && !string.IsNullOrWhiteSpace(CategorySlug))
        {
            var cat = await _categories.GetBySlugAsync(CategorySlug, cancellationToken);
            if (cat is not null)
            {
                CategoryId = cat.Id;
                CategoryName = cat.Name;
            }
        }

        if (CategoryId.HasValue)
        {
            CategoryName ??= await _db.Categories.AsNoTracking()
                .Where(c => c.Id == CategoryId.Value)
                .Select(c => c.Name)
                .FirstOrDefaultAsync(cancellationToken);
            Breadcrumbs = await BuildBreadcrumbsAsync(CategoryId.Value, cancellationToken);
        }

        var query = _db.Products
            .AsNoTracking()
            .Where(p => p.Status == ProductStatus.Active || p.Status == ProductStatus.OutOfStock);

        if (CategoryId.HasValue)
            query = query.Where(p => p.CategoryId == CategoryId.Value);

        if (!string.IsNullOrWhiteSpace(Search))
            query = query.Where(p => p.Name.Contains(Search) || p.Brand.Contains(Search));

        if (Brands is { Length: > 0 })
            query = query.Where(p => Brands.Contains(p.Brand));

        if (Fabrics is { Length: > 0 })
            query = query.Where(p => p.Attributes.Any(a => a.Name == "Fabric type" && Fabrics.Contains(a.Value)));

        if (Sizes is { Length: > 0 })
            query = query.Where(p => p.Attributes.Any(a => a.Name == "Size" && Sizes.Contains(a.Value)));

        if (Colors is { Length: > 0 })
            query = query.Where(p => p.Attributes.Any(a => a.Name == "Color" && Colors.Contains(a.Value)));

        if (MinPrice.HasValue)
            query = query.Where(p => p.Price >= MinPrice.Value);

        if (MaxPrice.HasValue)
            query = query.Where(p => p.Price <= MaxPrice.Value);

        if (MinRating.HasValue)
            query = query.Where(p => p.AverageRating >= MinRating.Value);

        query = Sort switch
        {
            "price_asc" => query.OrderBy(p => p.Price),
            "rating_desc" => query.OrderByDescending(p => p.AverageRating),
            "newest" => query.OrderByDescending(p => p.CreatedAtUtc),
            _ => query.OrderByDescending(p => p.Price)
        };

        Total = await query.CountAsync(cancellationToken);
        TotalPages = Math.Max(1, (int)Math.Ceiling(Total / (double)PageSize));
        if (PageNumber > TotalPages) PageNumber = TotalPages;

        Products = await query
            .Skip((PageNumber - 1) * PageSize)
            .Take(PageSize)
            .Select(p => new ProductCardVm
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
            })
            .ToListAsync(cancellationToken);

        BrandOptions = await _db.Products.AsNoTracking()
            .Where(p => p.Status == ProductStatus.Active || p.Status == ProductStatus.OutOfStock)
            .Select(p => p.Brand)
            .Distinct()
            .OrderBy(b => b)
            .ToListAsync(cancellationToken);

        FabricOptions = await FacetValuesAsync("Fabric type", cancellationToken);
        SizeOptions = await FacetValuesAsync("Size", cancellationToken);
        ColorOptions = await FacetValuesAsync("Color", cancellationToken);

        AppliedFiltersCount =
            (Brands?.Length ?? 0) +
            (Fabrics?.Length ?? 0) +
            (Sizes?.Length ?? 0) +
            (Colors?.Length ?? 0) +
            (MinPrice.HasValue ? 1 : 0) +
            (MaxPrice.HasValue ? 1 : 0) +
            (MinRating.HasValue ? 1 : 0);
    }

    private async Task<List<string>> FacetValuesAsync(string attributeName, CancellationToken ct) =>
        await _db.ProductAttributes.AsNoTracking()
            .Where(a => a.Name == attributeName && a.IsFilterable)
            .Select(a => a.Value)
            .Distinct()
            .OrderBy(v => v)
            .ToListAsync(ct);

    private async Task<List<BreadcrumbItem>> BuildBreadcrumbsAsync(Guid categoryId, CancellationToken ct)
    {
        var all = await _db.Categories.AsNoTracking()
            .Select(c => new { c.Id, c.Name, c.Slug, c.ParentCategoryId })
            .ToListAsync(ct);

        var map = all.ToDictionary(c => c.Id);
        var stack = new Stack<BreadcrumbItem>();
        Guid? current = categoryId;
        while (current.HasValue && map.TryGetValue(current.Value, out var node))
        {
            stack.Push(new BreadcrumbItem { Name = node.Name, Slug = node.Slug, Id = node.Id });
            current = node.ParentCategoryId;
        }

        return stack.ToList();
    }

    private static string[]? Normalize(string[]? values) =>
        values?
            .Where(v => !string.IsNullOrWhiteSpace(v))
            .Select(v => v.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();

    public bool IsSelected(string[]? selected, string value) =>
        selected?.Contains(value, StringComparer.OrdinalIgnoreCase) == true;

    public class BreadcrumbItem
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
    }
}
