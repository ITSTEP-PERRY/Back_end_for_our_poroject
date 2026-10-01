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

    [BindProperty(SupportsGet = true)]
    public string? Mode { get; set; }

    [BindProperty]
    public CategoryEditForm Form { get; set; } = new();

    public List<Category> AllCategories { get; private set; } = [];
    public List<Category> RootCategories { get; private set; } = [];
    public string SelectedCategoryName { get; private set; } = "Choose category...";
    public bool HasCategoryFilter { get; private set; }
    public TreeNodeVm? TreeRoot { get; private set; }
    public CategoryPanelVm? SelectedCategory { get; private set; }

    public string? Message { get; set; }
    public string? Error { get; set; }

    public async Task OnGetAsync(CancellationToken ct)
    {
        await LoadAsync(ct);
        if (Mode == "create")
        {
            Form = new CategoryEditForm
            {
                ParentCategoryId = CategoryId,
                IsActive = true
            };
        }
        else if (Mode == "edit" && SelectedCategory is not null)
        {
            FillForm(SelectedCategory);
        }
        else if (SelectedCategory is not null)
        {
            FillForm(SelectedCategory);
        }
        else
        {
            Form = new CategoryEditForm { ParentCategoryId = CategoryId, IsActive = true };
        }
    }

    public async Task<IActionResult> OnPostSaveAsync(CancellationToken ct)
    {
        await LoadAsync(ct);

        if (string.IsNullOrWhiteSpace(Form.Name))
        {
            Error = "Название категории обязательно.";
            Mode = Form.Id is null ? "create" : "edit";
            return Page();
        }

        var slug = string.IsNullOrWhiteSpace(Form.Slug)
            ? NormalizeSlug(Form.Name)
            : NormalizeSlug(Form.Slug);

        var description = string.IsNullOrWhiteSpace(Form.Description)
            ? null
            : Form.Description.Trim();
        if (description is { Length: > 300 })
            description = description[..300];

        if (Form.Id is Guid existingId)
        {
            var cat = await _db.Categories.FirstOrDefaultAsync(c => c.Id == existingId, ct);
            if (cat is null)
            {
                Error = "Категория не найдена.";
                Mode = "edit";
                return Page();
            }

            if (await _db.Categories.AnyAsync(c => c.Slug == slug && c.Id != existingId, ct))
            {
                Error = "Такой slug уже занят.";
                Mode = "edit";
                return Page();
            }

            if (Form.ParentCategoryId == existingId)
            {
                Error = "Категория не может быть родителем самой себе.";
                Mode = "edit";
                return Page();
            }

            cat.Name = Form.Name.Trim();
            cat.Slug = slug;
            cat.Description = description;
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
                    Mode = "edit";
                    return Page();
                }
            }

            await _db.SaveChangesAsync(ct);
            Message = "Категория сохранена.";
            SelectedId = cat.Id;
            if (cat.ParentCategoryId is Guid parent)
                CategoryId ??= parent;
        }
        else
        {
            if (await _db.Categories.AnyAsync(c => c.Slug == slug, ct))
            {
                Error = "Такой slug уже занят.";
                Mode = "create";
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
                    Mode = "create";
                    return Page();
                }
            }

            var cat = new Category
            {
                Id = Guid.NewGuid(),
                Name = Form.Name.Trim(),
                Slug = slug,
                Description = description,
                ParentCategoryId = Form.ParentCategoryId ?? CategoryId,
                SortOrder = Form.SortOrder,
                ImageUrl = imageUrl,
                IsActive = Form.IsActive,
                CreatedAtUtc = DateTime.UtcNow
            };
            _db.Categories.Add(cat);
            await _db.SaveChangesAsync(ct);
            Message = "Категория создана.";
            SelectedId = cat.Id;
            if (cat.ParentCategoryId is Guid parent)
                CategoryId = parent;
        }

        Mode = null;
        await LoadAsync(ct);
        if (SelectedCategory is not null)
            FillForm(SelectedCategory);
        return RedirectToPage(new { CategoryId, SelectedId, Q });
    }

    public async Task<IActionResult> OnPostDeactivateAsync(
        Guid id,
        [FromServices] ICategoryService categories,
        CancellationToken ct)
    {
        await categories.SoftDeactivateAsync(id, ct);
        Message = "Категория деактивирована.";
        if (SelectedId == id)
            SelectedId = CategoryId;
        Mode = null;
        return RedirectToPage(new { CategoryId, SelectedId, Q });
    }

    public async Task<IActionResult> OnPostDeleteManyAsync(
        [FromForm] List<Guid> ids,
        [FromServices] ICategoryService categories,
        CancellationToken ct)
    {
        if (ids.Count == 0)
        {
            Error = "Выберите категории.";
            await LoadAsync(ct);
            return Page();
        }

        foreach (var id in ids.Distinct())
            await categories.SoftDeactivateAsync(id, ct);

        Message = $"Деактивировано: {ids.Count}.";
        SelectedId = CategoryId;
        return RedirectToPage(new { CategoryId, SelectedId, Q });
    }

    private void FillForm(CategoryPanelVm panel)
    {
        Form = new CategoryEditForm
        {
            Id = panel.Id,
            Name = panel.Name,
            Slug = panel.Slug,
            Description = panel.Description,
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

        RootCategories = AllCategories.Where(c => c.IsActive && c.ParentCategoryId is null).ToList();

        HasCategoryFilter = CategoryId is not null;
        if (CategoryId is Guid cid)
        {
            var cat = AllCategories.FirstOrDefault(c => c.Id == cid);
            SelectedCategoryName = cat?.Name ?? "Choose category...";

            if (cat is not null && cat.IsActive)
            {
                TreeRoot = BuildFilteredTree(cat, 0);
                if (!string.IsNullOrWhiteSpace(Q) && TreeRoot is not null && !TreeMatches(TreeRoot, Q.Trim()))
                    TreeRoot = null;
            }
        }
        else
        {
            SelectedCategoryName = "Choose category...";
            TreeRoot = null;
        }

        var panelId = SelectedId ?? CategoryId;
        if (panelId is Guid pid)
        {
            var c = AllCategories.FirstOrDefault(x => x.Id == pid);
            if (c is not null)
            {
                SelectedCategory = ToPanel(c);
            }
        }
    }

    private CategoryPanelVm ToPanel(Category c)
    {
        var root = c;
        while (root.ParentCategoryId is Guid p)
        {
            var parent = AllCategories.FirstOrDefault(x => x.Id == p);
            if (parent is null) break;
            root = parent;
        }

        return new CategoryPanelVm
        {
            Id = c.Id,
            Name = c.Name,
            Slug = c.Slug,
            Description = c.Description,
            ImageUrl = c.ImageUrl,
            ParentCategoryId = c.ParentCategoryId,
            ParentName = AllCategories.FirstOrDefault(p => p.Id == c.ParentCategoryId)?.Name,
            RootName = root.Name,
            SortOrder = c.SortOrder,
            IsActive = c.IsActive,
            SubCount = AllCategories.Count(x => x.ParentCategoryId == c.Id && x.IsActive),
            ProductCount = _db.Products.Count(p => p.CategoryId == c.Id)
        };
    }

    private TreeNodeVm BuildFilteredTree(Category node, int depth)
    {
        var children = AllCategories
            .Where(c => c.ParentCategoryId == node.Id && c.IsActive)
            .Select(c => BuildFilteredTree(c, depth + 1))
            .ToList();

        if (!string.IsNullOrWhiteSpace(Q))
        {
            var term = Q.Trim();
            children = children.Where(ch => TreeMatches(ch, term)).ToList();
        }

        return new TreeNodeVm
        {
            Id = node.Id,
            Name = node.Name,
            Depth = depth,
            Children = children
        };
    }

    private static bool TreeMatches(TreeNodeVm node, string term) =>
        node.Name.Contains(term, StringComparison.OrdinalIgnoreCase)
        || node.Children.Any(c => TreeMatches(c, term));

    private static string NormalizeSlug(string slug) =>
        Regex.Replace(slug.Trim().ToLowerInvariant(), @"[^a-z0-9\-]+", "-").Trim('-');

    public class CategoryEditForm
    {
        public Guid? Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Slug { get; set; }
        public string? Description { get; set; }
        public Guid? ParentCategoryId { get; set; }
        public int SortOrder { get; set; }
        public bool IsActive { get; set; } = true;
        public string? CurrentImageUrl { get; set; }
        public IFormFile? Image { get; set; }
    }

    public class TreeNodeVm
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public int Depth { get; set; }
        public List<TreeNodeVm> Children { get; set; } = [];
    }

    public class CategoryPanelVm
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? ImageUrl { get; set; }
        public Guid? ParentCategoryId { get; set; }
        public string? ParentName { get; set; }
        public string? RootName { get; set; }
        public int SortOrder { get; set; }
        public bool IsActive { get; set; }
        public int SubCount { get; set; }
        public int ProductCount { get; set; }
    }
}
