using Perry.Domain.Entities;
using Perry.Infrastructure.Persistence;
using Perry.Infrastructure.Services;
using Perry.Infrastructure.Storage;
using Perry.Web.Filters;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;
using System.Text.RegularExpressions;

namespace Perry.Web.Pages.Admin;

/// <summary>
/// Admin panel: Category — дерево, подкатегории, правая панель (Figma).
/// </summary>
[AdminOnly]
public class CategoriesModel : PageModel
{
    private readonly AppDbContext _db;
    private readonly IStorageService _storage;

    public CategoriesModel(AppDbContext db, IStorageService storage)
    {
        _db = db;
        _storage = storage;
    }

    [BindProperty(SupportsGet = true)]
    public Guid? CategoryId { get; set; }

    [BindProperty(SupportsGet = true)]
    public string? Q { get; set; }

    [BindProperty(SupportsGet = true)]
    public Guid? SelectedId { get; set; }

    [BindProperty]
    public CategoryEditForm Form { get; set; } = new();

    public List<ProductsModel.CategoryNodeVm> CategoryTree { get; private set; } = [];
    public List<Category> AllCategories { get; private set; } = [];
    public string SelectedCategoryName { get; private set; } = "Choose category...";
    public bool HasCategoryFilter { get; private set; }

    public List<SubcategoryVm> Subcategories { get; private set; } = [];
    public CategoryPanelVm? SelectedCategory { get; private set; }

    public string? Message { get; set; }
    public string? Error { get; set; }

    public async Task OnGetAsync(CancellationToken ct)
    {
        await LoadAsync(ct);
        if (SelectedCategory is not null)
            FillForm(SelectedCategory);
        else
            Form = new CategoryEditForm { ParentCategoryId = CategoryId };
    }

    public async Task<IActionResult> OnPostSaveAsync(CancellationToken ct)
    {
        await LoadAsync(ct);

        if (string.IsNullOrWhiteSpace(Form.Name))
        {
            Error = "Название категории обязательно.";
            return Page();
        }

        var slug = string.IsNullOrWhiteSpace(Form.Slug)
            ? NormalizeSlug(Form.Name)
            : NormalizeSlug(Form.Slug);

        if (Form.Id is Guid existingId)
        {
            var cat = await _db.Categories.FirstOrDefaultAsync(c => c.Id == existingId, ct);
            if (cat is null)
            {
                Error = "Категория не найдена.";
                return Page();
            }

            if (await _db.Categories.AnyAsync(c => c.Slug == slug && c.Id != existingId, ct))
            {
                Error = "Такой slug уже занят.";
                return Page();
            }

            if (Form.ParentCategoryId == existingId)
            {
                Error = "Категория не может быть родителем самой себе.";
                return Page();
            }

            cat.Name = Form.Name.Trim();
            cat.Slug = slug;
            cat.ParentCategoryId = Form.ParentCategoryId;
            cat.SortOrder = Form.SortOrder;
            cat.IsActive = Form.IsActive;

            if (Form.Image is { Length: > 0 })
            {
                try
                {
                    cat.ImageUrl = "/uploads/" + _storage.Save(Form.Image);
                }
                catch (Exception ex)
                {
                    Error = "Ошибка изображения: " + ex.Message;
                    return Page();
                }
            }

            await _db.SaveChangesAsync(ct);
            Message = "Категория сохранена.";
            SelectedId = cat.Id;
        }
        else
        {
            if (await _db.Categories.AnyAsync(c => c.Slug == slug, ct))
            {
                Error = "Такой slug уже занят.";
                return Page();
            }

            string? imageUrl = null;
            if (Form.Image is { Length: > 0 })
            {
                try
                {
                    imageUrl = "/uploads/" + _storage.Save(Form.Image);
                }
                catch (Exception ex)
                {
                    Error = "Ошибка изображения: " + ex.Message;
                    return Page();
                }
            }

            var cat = new Category
            {
                Id = Guid.NewGuid(),
                Name = Form.Name.Trim(),
                Slug = slug,
                ParentCategoryId = Form.ParentCategoryId ?? CategoryId,
                SortOrder = Form.SortOrder,
                ImageUrl = imageUrl,
                IsActive = true,
                CreatedAtUtc = DateTime.UtcNow
            };
            _db.Categories.Add(cat);
            await _db.SaveChangesAsync(ct);
            Message = "Категория создана.";
            SelectedId = cat.Id;
            if (cat.ParentCategoryId is Guid parent)
                CategoryId = parent;
        }

        await LoadAsync(ct);
        if (SelectedCategory is not null)
            FillForm(SelectedCategory);
        return Page();
    }

    public async Task<IActionResult> OnPostDeactivateAsync(Guid id, [FromServices] ICategoryService categories, CancellationToken ct)
    {
        await categories.SoftDeactivateAsync(id, ct);
        Message = "Категория деактивирована.";
        SelectedId = null;
        await LoadAsync(ct);
        Form = new CategoryEditForm { ParentCategoryId = CategoryId };
        return Page();
    }

    private void FillForm(CategoryPanelVm panel)
    {
        Form = new CategoryEditForm
        {
            Id = panel.Id,
            Name = panel.Name,
            Slug = panel.Slug,
            ParentCategoryId = panel.ParentCategoryId,
            SortOrder = panel.SortOrder,
            IsActive = panel.IsActive,
            CurrentImageUrl = panel.ImageUrl
        };
    }

    private async Task LoadAsync(CancellationToken ct)
    {
        AllCategories = await _db.Categories.AsNoTracking()
            .OrderBy(c => c.SortOrder)
            .ThenBy(c => c.Name)
            .ToListAsync(ct);

        var active = AllCategories.Where(c => c.IsActive).ToList();
        CategoryTree = BuildTree(active, null, 0);

        HasCategoryFilter = CategoryId is not null;
        if (CategoryId is Guid cid)
        {
            var cat = AllCategories.FirstOrDefault(c => c.Id == cid);
            SelectedCategoryName = cat?.Name ?? "Choose category...";

            var subsQuery = AllCategories
                .Where(c => c.ParentCategoryId == cid && c.IsActive)
                .AsEnumerable();

            if (!string.IsNullOrWhiteSpace(Q))
            {
                var term = Q.Trim();
                subsQuery = subsQuery.Where(c => c.Name.Contains(term, StringComparison.OrdinalIgnoreCase));
            }

            Subcategories = subsQuery
                .Select(c => new SubcategoryVm
                {
                    Id = c.Id,
                    Name = c.Name,
                    Slug = c.Slug,
                    ImageUrl = c.ImageUrl,
                    ProductCount = _db.Products.Count(p => p.CategoryId == c.Id)
                })
                .ToList();
        }
        else
        {
            SelectedCategoryName = "Choose category...";
            Subcategories = [];
        }

        var panelId = SelectedId ?? CategoryId;
        if (panelId is Guid pid)
        {
            var c = AllCategories.FirstOrDefault(x => x.Id == pid);
            if (c is not null)
            {
                SelectedCategory = new CategoryPanelVm
                {
                    Id = c.Id,
                    Name = c.Name,
                    Slug = c.Slug,
                    ImageUrl = c.ImageUrl,
                    ParentCategoryId = c.ParentCategoryId,
                    ParentName = AllCategories.FirstOrDefault(p => p.Id == c.ParentCategoryId)?.Name,
                    SortOrder = c.SortOrder,
                    IsActive = c.IsActive,
                    SubCount = AllCategories.Count(x => x.ParentCategoryId == c.Id && x.IsActive),
                    ProductCount = await _db.Products.CountAsync(p => p.CategoryId == c.Id, ct)
                };
            }
        }
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

    private static string NormalizeSlug(string slug) =>
        Regex.Replace(slug.Trim().ToLowerInvariant(), @"[^a-z0-9\-]+", "-").Trim('-');

    public class CategoryEditForm
    {
        public Guid? Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Slug { get; set; }
        public Guid? ParentCategoryId { get; set; }
        public int SortOrder { get; set; }
        public bool IsActive { get; set; } = true;
        public string? CurrentImageUrl { get; set; }
        public IFormFile? Image { get; set; }
    }

    public class SubcategoryVm
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public string? ImageUrl { get; set; }
        public int ProductCount { get; set; }
    }

    public class CategoryPanelVm
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public string? ImageUrl { get; set; }
        public Guid? ParentCategoryId { get; set; }
        public string? ParentName { get; set; }
        public int SortOrder { get; set; }
        public bool IsActive { get; set; }
        public int SubCount { get; set; }
        public int ProductCount { get; set; }
    }
}
