using Perry.Infrastructure.Persistence;
using Perry.Infrastructure.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Perry.Api.Controllers;

/// <summary>
/// API категорий каталога.
/// Маршрут: /api/categories
/// Нужен для меню, breadcrumbs и фильтра «Category» в админке / на фронте.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class CategoriesController : ControllerBase
{
    private readonly AppDbContext _db;

    public CategoriesController(AppDbContext db)
    {
        _db = db;
    }

    /// <summary>
    /// Полное дерево категорий (все уровни).
    /// GET /api/categories
    /// GET /api/categories?includeInactive=true — только для Admin (админка React).
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetTree(
        [FromQuery] bool includeInactive = false,
        CancellationToken cancellationToken = default)
    {
        if (includeInactive && !User.IsInRole("Admin"))
            return Forbid();

        var query = _db.Categories.AsNoTracking().AsQueryable();
        if (!includeInactive)
            query = query.Where(c => c.IsActive);

        var all = await query
            .OrderBy(c => c.SortOrder)
            .ThenBy(c => c.Name)
            .Select(c => new CategoryNode(
                c.Id, c.Name, c.Slug, c.Description, c.ImageUrl, c.IconUrl,
                c.IsActive, c.SortOrder, c.ParentCategoryId))
            .ToListAsync(cancellationToken);

        return Ok(BuildTree(all, null));
    }

    private record CategoryNode(
        Guid Id, string Name, string Slug, string? Description, string? ImageUrl, string? IconUrl,
        bool IsActive, int SortOrder, Guid? ParentCategoryId);

    private static object BuildTree(List<CategoryNode> all, Guid? parentId) =>
        all.Where(c => c.ParentCategoryId == parentId)
            .Select(c => new
            {
                c.Id,
                c.Name,
                c.Slug,
                c.Description,
                c.ImageUrl,
                c.IconUrl,
                c.IsActive,
                c.SortOrder,
                c.ParentCategoryId,
                SubCategories = BuildTree(all, c.Id)
            })
            .ToList();

    [HttpGet("{slug}")]
    public async Task<IActionResult> GetBySlug(string slug, CancellationToken cancellationToken)
    {
        var category = await _db.Categories.AsNoTracking()
            .Where(c => c.Slug == slug)
            .Select(c => new
            {
                c.Id,
                c.Name,
                c.Slug,
                c.Description,
                c.ImageUrl,
                c.IconUrl,
                c.IsActive,
                c.SortOrder,
                c.ParentCategoryId
            })
            .FirstOrDefaultAsync(cancellationToken);
        return category is null ? NotFound() : Ok(category);
    }

    /// <summary>
    /// Тело создания/обновления категории.
    /// Картинки и иконка передаются URL-ами в JSON (без multipart).
    /// </summary>
    public record CategoryWriteRequest(
        string Name,
        string? Slug = null,
        string? Description = null,
        string? ImageUrl = null,
        string? IconUrl = null,
        Guid? ParentCategoryId = null,
        int SortOrder = 0,
        bool IsActive = true);

    /// <summary>POST /api/categories</summary>
    [HttpPost]
    public async Task<IActionResult> Create(
        [FromBody] CategoryWriteRequest body,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(body.Name))
            return BadRequest(new { error = "Name обязателен." });

        var slug = string.IsNullOrWhiteSpace(body.Slug)
            ? SlugHelper.FromName(body.Name)
            : body.Slug.Trim().ToLowerInvariant();
        slug = SlugHelper.Unique(slug, s => _db.Categories.Any(c => c.Slug == s));

        var entity = new Domain.Entities.Category
        {
            Id = Guid.NewGuid(),
            Name = body.Name.Trim(),
            Slug = slug,
            Description = NormalizeText(body.Description),
            ImageUrl = NormalizeUrl(body.ImageUrl),
            IconUrl = NormalizeUrl(body.IconUrl),
            ParentCategoryId = body.ParentCategoryId,
            SortOrder = body.SortOrder,
            IsActive = body.IsActive,
            CreatedAtUtc = DateTime.UtcNow
        };
        _db.Categories.Add(entity);
        await _db.SaveChangesAsync(ct);

        return CreatedAtAction(nameof(GetBySlug), new { slug = entity.Slug }, ToDto(entity));
    }

    /// <summary>PUT /api/categories/{id}</summary>
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] CategoryWriteRequest body, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(body.Name))
            return BadRequest(new { error = "Name обязателен." });

        var entity = await _db.Categories.FirstOrDefaultAsync(c => c.Id == id, ct);
        if (entity is null)
            return NotFound();

        var slug = string.IsNullOrWhiteSpace(body.Slug)
            ? entity.Slug
            : body.Slug.Trim().ToLowerInvariant();

        if (await _db.Categories.AnyAsync(c => c.Slug == slug && c.Id != id, ct))
            return Conflict(new { error = "Slug уже занят." });

        if (body.ParentCategoryId == id)
            return BadRequest(new { error = "Категория не может быть родителем самой себе." });

        entity.Name = body.Name.Trim();
        entity.Slug = slug;
        entity.Description = NormalizeText(body.Description);
        entity.ImageUrl = NormalizeUrl(body.ImageUrl);
        entity.IconUrl = NormalizeUrl(body.IconUrl);
        entity.ParentCategoryId = body.ParentCategoryId;
        entity.SortOrder = body.SortOrder;
        entity.IsActive = body.IsActive;

        await _db.SaveChangesAsync(ct);
        return Ok(ToDto(entity));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> SoftDelete(Guid id, [FromServices] ICategoryService categories, CancellationToken ct)
    {
        await categories.SoftDeactivateAsync(id, ct);
        return NoContent();
    }

    private static object ToDto(Domain.Entities.Category c) => new
    {
        c.Id,
        c.Name,
        c.Slug,
        c.Description,
        c.ImageUrl,
        c.IconUrl,
        c.IsActive,
        c.SortOrder,
        c.ParentCategoryId
    };

    private static string? NormalizeText(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private static string? NormalizeUrl(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
