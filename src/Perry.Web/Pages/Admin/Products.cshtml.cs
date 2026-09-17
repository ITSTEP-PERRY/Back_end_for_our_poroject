using Perry.Domain.Entities;
using Perry.Domain.Enums;
using Perry.Infrastructure.Persistence;
using Perry.Infrastructure.Services;
using Perry.Web.Filters;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;

namespace Perry.Web.Pages.Admin;

/// <summary>
/// Admin panel: Product — список по категории + правая панель карточки (Figma).
/// </summary>
[AdminOnly]
public class ProductsModel : PageModel
{
    private const int PageSize = 7;
    private readonly AppDbContext _db;

    public ProductsModel(AppDbContext db) => _db = db;

    [BindProperty(SupportsGet = true)]
    public Guid? CategoryId { get; set; }

    [BindProperty(SupportsGet = true)]
    public string? Q { get; set; }

    [BindProperty(SupportsGet = true)]
    public int PageNumber { get; set; } = 1;

    [BindProperty(SupportsGet = true)]
    public Guid? SelectedId { get; set; }

    public List<CategoryNodeVm> CategoryTree { get; private set; } = [];
    public List<Category> AllCategories { get; private set; } = [];
    public string SelectedCategoryName { get; private set; } = "All";
    public bool CategoryChosen { get; private set; }

    public List<ProductRowVm> Products { get; private set; } = [];
    public ProductPanelVm? SelectedProduct { get; private set; }
    public int TotalCount { get; private set; }
    public int TotalPages { get; private set; }

    public string? Message { get; set; }
    public string? Error { get; set; }

    public async Task OnGetAsync(CancellationToken ct)
    {
        await LoadAsync(ct);
    }

    public async Task<IActionResult> OnPostDeleteAsync(Guid id, CancellationToken ct)
    {
        var product = await _db.Products.FindAsync([id], ct);
        if (product is not null)
        {
            product.Status = ProductStatus.Archived;
            product.UpdatedAtUtc = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);
            Message = "Товар архивирован.";
        }

        SelectedId = null;
        await LoadAsync(ct);
        return Page();
    }

    public async Task<IActionResult> OnPostRestoreAsync(Guid id, [FromServices] IProductService products, CancellationToken ct)
    {
        await products.RestoreAsync(id, ct);
        Message = "Товар восстановлен.";
        SelectedId = id;
        await LoadAsync(ct);
        return Page();
    }

    private async Task LoadAsync(CancellationToken ct)
    {
        AllCategories = await _db.Categories.AsNoTracking()
            .Where(c => c.IsActive)
            .OrderBy(c => c.SortOrder)
            .ThenBy(c => c.Name)
            .ToListAsync(ct);

        CategoryTree = BuildTree(AllCategories, null, 0);

        // null CategoryId → «All»; иначе фильтр по ветке
        CategoryChosen = true;
        if (CategoryId is Guid cid)
        {
            var cat = AllCategories.FirstOrDefault(c => c.Id == cid);
            SelectedCategoryName = cat?.Name ?? "All";
        }
        else
        {
            SelectedCategoryName = "All";
        }

        var query = _db.Products.AsNoTracking()
            .Include(p => p.Images)
            .Include(p => p.Category)
            .AsQueryable();

        if (CategoryId is Guid filterId)
        {
            var ids = CollectSubtreeIds(filterId, AllCategories);
            query = query.Where(p => ids.Contains(p.CategoryId));
        }

        if (!string.IsNullOrWhiteSpace(Q))
        {
            var term = Q.Trim();
            query = query.Where(p =>
                p.Name.Contains(term) ||
                p.Brand.Contains(term) ||
                p.Sku.Contains(term));
        }

        query = query.Where(p => p.Status != ProductStatus.Archived);

        TotalCount = await query.CountAsync(ct);
        TotalPages = Math.Max(1, (int)Math.Ceiling(TotalCount / (double)PageSize));
        if (PageNumber < 1) PageNumber = 1;
        if (PageNumber > TotalPages) PageNumber = TotalPages;

        var pageItems = await query
            .OrderByDescending(p => p.CreatedAtUtc)
            .Skip((PageNumber - 1) * PageSize)
            .Take(PageSize)
            .ToListAsync(ct);

        Products = pageItems.Select(p => new ProductRowVm
        {
            Id = p.Id,
            Name = p.Name,
            Price = p.Price,
            OldPrice = p.OldPrice,
            AverageRating = p.AverageRating,
            ImageUrl = p.Images.FirstOrDefault(i => i.IsPrimary)?.Url
                       ?? p.Images.OrderBy(i => i.SortOrder).FirstOrDefault()?.Url
        }).ToList();

        if (SelectedId is Guid sid)
        {
            var full = await _db.Products.AsNoTracking()
                .Include(p => p.Images)
                .Include(p => p.AboutItems)
                .Include(p => p.Attributes)
                .Include(p => p.Category)
                .FirstOrDefaultAsync(p => p.Id == sid, ct);

            if (full is not null)
            {
                var images = full.Images.OrderBy(i => i.SortOrder).Select(i => i.Url).ToList();
                SelectedProduct = new ProductPanelVm
                {
                    Id = full.Id,
                    Name = full.Name,
                    Brand = full.Brand,
                    Description = full.Description,
                    Price = full.Price,
                    OldPrice = full.OldPrice,
                    StockQuantity = full.StockQuantity,
                    Status = full.Status,
                    AverageRating = full.AverageRating,
                    ReviewCount = full.ReviewCount,
                    CategoryName = full.Category?.Name ?? "—",
                    ImageUrls = images,
                    AboutCount = full.AboutItems.Count,
                    AttributeCount = full.Attributes.Count
                };
            }
        }
    }

    private static List<CategoryNodeVm> BuildTree(List<Category> all, Guid? parentId, int depth)
    {
        return all
            .Where(c => c.ParentCategoryId == parentId)
            .Select(c => new CategoryNodeVm
            {
                Id = c.Id,
                Name = c.Name,
                Depth = depth,
                Children = BuildTree(all, c.Id, depth + 1)
            })
            .ToList();
    }

    private static HashSet<Guid> CollectSubtreeIds(Guid rootId, List<Category> all)
    {
        var result = new HashSet<Guid> { rootId };
        var queue = new Queue<Guid>();
        queue.Enqueue(rootId);
        while (queue.Count > 0)
        {
            var id = queue.Dequeue();
            foreach (var child in all.Where(c => c.ParentCategoryId == id))
            {
                if (result.Add(child.Id))
                    queue.Enqueue(child.Id);
            }
        }
        return result;
    }

    public class CategoryNodeVm
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public int Depth { get; set; }
        public List<CategoryNodeVm> Children { get; set; } = [];
    }

    public class ProductRowVm
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public decimal? OldPrice { get; set; }
        public decimal AverageRating { get; set; }
        public string? ImageUrl { get; set; }
    }

    public class ProductPanelVm
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Brand { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public decimal? OldPrice { get; set; }
        public int StockQuantity { get; set; }
        public ProductStatus Status { get; set; }
        public decimal AverageRating { get; set; }
        public int ReviewCount { get; set; }
        public string CategoryName { get; set; } = string.Empty;
        public List<string> ImageUrls { get; set; } = [];
        public int AboutCount { get; set; }
        public int AttributeCount { get; set; }
    }
}
