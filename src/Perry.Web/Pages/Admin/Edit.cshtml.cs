using Perry.Domain.Entities;
using Perry.Domain.Enums;
using Perry.Infrastructure.Persistence;
using Perry.Infrastructure.Services;
using Perry.Infrastructure.Storage;
using Perry.Web.Filters;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;

namespace Perry.Web.Pages.Admin;

/// <summary>
/// Создание / редактирование карточки товара: базовые поля + About + Specs (Figma / PDP).
/// </summary>
[AdminOnly]
public class EditModel : PageModel
{
    private readonly AppDbContext _db;
    private readonly IStorageService _storage;

    public EditModel(AppDbContext db, IStorageService storage)
    {
        _db = db;
        _storage = storage;
    }

    [BindProperty(SupportsGet = true)]
    public Guid Id { get; set; }

    [BindProperty(SupportsGet = true)]
    public bool Create { get; set; }

    [BindProperty(SupportsGet = true)]
    public Guid? CategoryId { get; set; }

    [BindProperty]
    public ProductEditForm Form { get; set; } = new();

    public List<Category> Categories { get; private set; } = [];
    public List<ProductsModel.CategoryNodeVm> CategoryTree { get; private set; } = [];
    public string? Message { get; set; }
    public string? Error { get; set; }
    public List<string> CurrentImageUrls { get; private set; } = [];
    public bool IsCreate => Create || Id == Guid.Empty;

    public async Task<IActionResult> OnGetAsync(CancellationToken ct)
    {
        await LoadCategoriesAsync(ct);

        if (IsCreate)
        {
            Form = new ProductEditForm
            {
                CategoryId = CategoryId ?? Guid.Empty,
                StockQuantity = 1,
                Status = ProductStatus.Active,
                AboutItems = [new AboutFormItem()],
                Attributes = [new AttrFormItem()]
            };
            return Page();
        }

        var product = await _db.Products
            .Include(p => p.Images)
            .Include(p => p.AboutItems)
            .Include(p => p.Attributes)
            .FirstOrDefaultAsync(p => p.Id == Id, ct);

        if (product is null)
            return NotFound();

        Form = new ProductEditForm
        {
            Name = product.Name,
            Description = product.Description,
            Sku = product.Sku,
            Slug = product.Slug,
            Brand = product.Brand,
            Price = product.Price,
            OldPrice = product.OldPrice,
            StockQuantity = product.StockQuantity,
            CategoryId = product.CategoryId,
            Status = product.Status,
            IsBestSeller = product.IsBestSeller,
            AboutItems = product.AboutItems.OrderBy(a => a.SortOrder)
                .Select(a => new AboutFormItem { Title = a.Title, Description = a.Description })
                .ToList(),
            Attributes = product.Attributes.OrderBy(a => a.SortOrder)
                .Select(a => new AttrFormItem { Name = a.Name, Value = a.Value, IsFilterable = a.IsFilterable })
                .ToList()
        };

        if (Form.AboutItems.Count == 0)
            Form.AboutItems.Add(new AboutFormItem());
        if (Form.Attributes.Count == 0)
            Form.Attributes.Add(new AttrFormItem());

        CurrentImageUrls = product.Images.OrderBy(i => i.SortOrder).Select(i => i.Url).ToList();
        return Page();
    }

    public async Task<IActionResult> OnPostAsync(CancellationToken ct)
    {
        await LoadCategoriesAsync(ct);

        if (string.IsNullOrWhiteSpace(Form.Name) || Form.CategoryId == Guid.Empty)
        {
            Error = "Название и категория обязательны.";
            return Page();
        }

        Product product;
        if (IsCreate)
        {
            var sku = string.IsNullOrWhiteSpace(Form.Sku)
                ? "SKU-" + Guid.NewGuid().ToString("N")[..8].ToUpperInvariant()
                : Form.Sku.Trim();

            if (await _db.Products.AnyAsync(p => p.Sku == sku, ct))
            {
                Error = "SKU уже занят.";
                return Page();
            }

            product = new Product
            {
                Id = Guid.NewGuid(),
                Sku = sku,
                CreatedAtUtc = DateTime.UtcNow
            };
            _db.Products.Add(product);
            Id = product.Id;
            Create = false;
        }
        else
        {
            product = await _db.Products
                .Include(p => p.Images)
                .Include(p => p.AboutItems)
                .Include(p => p.Attributes)
                .FirstOrDefaultAsync(p => p.Id == Id, ct);

            if (product is null)
                return NotFound();
        }

        product.Name = Form.Name.Trim();
        product.Description = Form.Description?.Trim() ?? string.Empty;
        if (!string.IsNullOrWhiteSpace(Form.Sku))
            product.Sku = Form.Sku.Trim();
        product.Slug = string.IsNullOrWhiteSpace(Form.Slug)
            ? SlugHelper.Unique(SlugHelper.FromName(product.Name), s => _db.Products.Any(p => p.Slug == s && p.Id != product.Id))
            : Form.Slug.Trim().ToLowerInvariant();
        product.Brand = Form.Brand?.Trim() ?? string.Empty;
        product.Price = Form.Price;
        product.OldPrice = Form.OldPrice;
        product.StockQuantity = Form.StockQuantity;
        product.CategoryId = Form.CategoryId;
        product.Status = Form.StockQuantity <= 0 && Form.Status == ProductStatus.Active
            ? ProductStatus.OutOfStock
            : Form.Status;
        product.IsBestSeller = Form.IsBestSeller;
        product.UpdatedAtUtc = DateTime.UtcNow;

        if (Form.Image is { Length: > 0 })
        {
            try
            {
                var url = "/uploads/" + _storage.Save(Form.Image);
                var primary = product.Images.FirstOrDefault(i => i.IsPrimary);
                if (primary is null)
                {
                    _db.ProductImages.Add(new ProductImage
                    {
                        Id = Guid.NewGuid(),
                        ProductId = product.Id,
                        Url = url,
                        IsPrimary = true,
                        SortOrder = 0
                    });
                }
                else
                {
                    primary.Url = url;
                }
            }
            catch (Exception ex)
            {
                Error = "Ошибка загрузки изображения: " + ex.Message;
                CurrentImageUrls = product.Images.OrderBy(i => i.SortOrder).Select(i => i.Url).ToList();
                return Page();
            }
        }

        // About items — полная замена
        _db.ProductAboutItems.RemoveRange(product.AboutItems);
        var aboutOrder = 0;
        foreach (var item in Form.AboutItems ?? [])
        {
            if (string.IsNullOrWhiteSpace(item.Title) && string.IsNullOrWhiteSpace(item.Description))
                continue;
            _db.ProductAboutItems.Add(new ProductAboutItem
            {
                Id = Guid.NewGuid(),
                ProductId = product.Id,
                Title = item.Title?.Trim() ?? string.Empty,
                Description = item.Description?.Trim() ?? string.Empty,
                SortOrder = aboutOrder++
            });
        }

        // Attributes — полная замена
        _db.ProductAttributes.RemoveRange(product.Attributes);
        var attrOrder = 0;
        foreach (var item in Form.Attributes ?? [])
        {
            if (string.IsNullOrWhiteSpace(item.Name) && string.IsNullOrWhiteSpace(item.Value))
                continue;
            _db.ProductAttributes.Add(new ProductAttribute
            {
                Id = Guid.NewGuid(),
                ProductId = product.Id,
                Name = item.Name?.Trim() ?? string.Empty,
                Value = item.Value?.Trim() ?? string.Empty,
                IsFilterable = item.IsFilterable,
                SortOrder = attrOrder++
            });
        }

        await _db.SaveChangesAsync(ct);
        return RedirectToPage(new { id = product.Id, create = false });
    }

    private async Task LoadCategoriesAsync(CancellationToken ct)
    {
        Categories = await _db.Categories.AsNoTracking()
            .Where(c => c.IsActive)
            .OrderBy(c => c.SortOrder)
            .ThenBy(c => c.Name)
            .ToListAsync(ct);

        CategoryTree = BuildTree(Categories, null, 0);
    }

    private static List<ProductsModel.CategoryNodeVm> BuildTree(List<Category> all, Guid? parentId, int depth) =>
        all.Where(c => c.ParentCategoryId == parentId)
            .Select(c => new ProductsModel.CategoryNodeVm
            {
                Id = c.Id,
                Name = c.Name,
                Depth = depth,
                Children = BuildTree(all, c.Id, depth + 1)
            })
            .ToList();

    public class ProductEditForm
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? Sku { get; set; }
        public string? Slug { get; set; }
        public string? Brand { get; set; }
        public decimal Price { get; set; }
        public decimal? OldPrice { get; set; }
        public int StockQuantity { get; set; }
        public Guid CategoryId { get; set; }
        public ProductStatus Status { get; set; }
        public bool IsBestSeller { get; set; }
        public IFormFile? Image { get; set; }
        public List<AboutFormItem> AboutItems { get; set; } = [];
        public List<AttrFormItem> Attributes { get; set; } = [];
    }

    public class AboutFormItem
    {
        public string? Title { get; set; }
        public string? Description { get; set; }
    }

    public class AttrFormItem
    {
        public string? Name { get; set; }
        public string? Value { get; set; }
        public bool IsFilterable { get; set; }
    }
}
