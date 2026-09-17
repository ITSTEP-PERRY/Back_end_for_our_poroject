using Perry.Domain.Entities;
using Perry.Domain.Enums;
using Perry.Infrastructure.Persistence;
using Perry.Web.ViewModels;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;

namespace Perry.Web.Pages;

/// <summary>
/// Главная (Desktop - Main): hero, 2 карусели категорий, Trending deals, Sale, CTA.
/// </summary>
public class IndexModel : PageModel
{
    private readonly AppDbContext _db;

    public IndexModel(AppDbContext db)
    {
        _db = db;
    }

    public List<CategorySpotVm> CategoryRow1 { get; private set; } = [];
    public List<CategorySpotVm> CategoryRow2 { get; private set; } = [];
    public List<ProductCardVm> TrendingDeals { get; private set; } = [];
    public List<ProductCardVm> SaleProducts { get; private set; } = [];

    public async Task OnGetAsync(CancellationToken cancellationToken)
    {
        var categories = await _db.Categories
            .AsNoTracking()
            .Where(c => c.IsActive)
            .OrderBy(c => c.SortOrder)
            .ThenBy(c => c.Name)
            .Select(c => new CategorySpotVm
            {
                Id = c.Id,
                Name = c.Name,
                ImageUrl = c.ImageUrl
            })
            .ToListAsync(cancellationToken);

        if (categories.Count == 0)
        {
            CategoryRow1 = [];
            CategoryRow2 = [];
        }
        else
        {
            // Две визуальные карусели; если категорий мало — циклически дополняем.
            CategoryRow1 = TakeCycled(categories, 0, 8);
            CategoryRow2 = TakeCycled(categories, Math.Min(6, categories.Count), 8);
        }

        var visible = _db.Products
            .AsNoTracking()
            .Where(p => p.Status == ProductStatus.Active || p.Status == ProductStatus.OutOfStock);

        TrendingDeals = await MapCards(
            visible.OrderByDescending(p => p.ReviewCount).ThenByDescending(p => p.AverageRating).Take(12),
            cancellationToken);

        SaleProducts = await MapCards(
            visible.Where(p => p.OldPrice != null && p.OldPrice > p.Price)
                .OrderByDescending(p => (p.OldPrice!.Value - p.Price) / p.OldPrice.Value)
                .Take(12),
            cancellationToken);

        if (SaleProducts.Count == 0)
            SaleProducts = TrendingDeals.Take(8).ToList();
    }

    private static List<CategorySpotVm> TakeCycled(List<CategorySpotVm> source, int start, int count)
    {
        var result = new List<CategorySpotVm>(count);
        if (source.Count == 0) return result;
        for (var i = 0; i < count; i++)
            result.Add(source[(start + i) % source.Count]);
        return result;
    }

    private static async Task<List<ProductCardVm>> MapCards(
        IQueryable<Product> query,
        CancellationToken cancellationToken)
    {
        return await query.Select(p => new ProductCardVm
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
        }).ToListAsync(cancellationToken);
    }

    public class CategorySpotVm
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? ImageUrl { get; set; }
    }
}
