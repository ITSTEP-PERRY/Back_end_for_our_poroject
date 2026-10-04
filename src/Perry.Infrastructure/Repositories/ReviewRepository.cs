using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Perry.Domain.Entities;
using Perry.Domain.Errors;
using Perry.Domain.Primitives;
using Perry.Infrastructure.DTOs;
using Perry.Infrastructure.Interfaces;
using Perry.Infrastructure.Options;
using Perry.Infrastructure.Persistence;
using Perry.Infrastructure.Storage;

namespace Perry.Infrastructure.Repositories;

public class ReviewRepository : IReviewRepository
{
    private readonly ILogger<ReviewRepository> _logger;
    private readonly AppDbContext _dbContext;
    private readonly IStorageService _storage;

    public ReviewRepository(
        ILogger<ReviewRepository> logger,
        AppDbContext dbContext,
        IStorageService storage)
    {
        _logger = logger;
        _dbContext = dbContext;
        _storage = storage;
    }

    public async Task<Result<ProductReviewDto>> GetAllReviews(QueryOptions options, Guid? id, CancellationToken cancellationToken)
    {
        IQueryable<ProductReview> query = ProjectReviews(_dbContext.ProductReviews);

        if (id != null) query = query.Where(r => r.ProductId == id || r.UserId == id);

        var pageList = await PagedList<ProductReview>.CreateAsync(query, options, cancellationToken);
        var statQuery = _dbContext.ProductReviews.AsQueryable();
        if (id != null) statQuery = statQuery.Where(r => r.ProductId == id || r.UserId == id);

        var stats = await GetReviewStatistic(statQuery, options, cancellationToken);
        return new ProductReviewDto
        {
            PagedList = pageList,
            Statistic = stats
        };
    }

    public async Task<Result<ProductReviewDto>> GetReviewsByUserOrProductId(Guid id, QueryOptions options, CancellationToken cancellationToken)
    {
        IQueryable<ProductReview> query = ProjectReviews(_dbContext.ProductReviews)
            .Where(r => r.ProductId == id || r.UserId == id);

        var pageList = await PagedList<ProductReview>.CreateAsync(query, options, cancellationToken);
        var stats = await GetReviewStatistic(
            _dbContext.ProductReviews.Where(r => r.ProductId == id || r.UserId == id),
            options,
            cancellationToken);
        return new ProductReviewDto
        {
            PagedList = pageList,
            Statistic = stats
        };
    }

    public async Task<Result<ProductReviewDto>> GetReviewsByUserId(
        Guid userId,
        QueryOptions options,
        bool includeHidden,
        CancellationToken cancellationToken)
    {
        IQueryable<ProductReview> baseQuery = _dbContext.ProductReviews.Where(r => r.UserId == userId);
        if (!includeHidden)
            baseQuery = baseQuery.Where(r => r.IsApproved);

        var query = ProjectReviews(baseQuery);
        var pageList = await PagedList<ProductReview>.CreateAsync(query, options, cancellationToken);
        var stats = await GetReviewStatistic(baseQuery, options, cancellationToken);
        return new ProductReviewDto
        {
            PagedList = pageList,
            Statistic = stats
        };
    }

    public async Task<Result<ProductReview>> GetReviewById(Guid id, CancellationToken cancellationToken)
    {
        var review = await ProjectReviews(_dbContext.ProductReviews.Where(r => r.Id == id))
            .FirstOrDefaultAsync(cancellationToken);
        if (review == null) return QueryError.EntityNotExist;
        return review;
    }

    public async Task<Result<ProductReview>> PostProductReview(PostReviewDto dto, CancellationToken cancellationToken)
    {
        try
        {
            var productExists = await _dbContext.Products.AnyAsync(p => p.Id == dto.ProductId, cancellationToken);
            if (!productExists) return QueryError.EntityNotExist;

            var duplicate = await _dbContext.ProductReviews
                .AnyAsync(r => r.UserId == dto.UserId && r.ProductId == dto.ProductId, cancellationToken);
            if (duplicate) return QueryError.Conflict;

            var author = string.IsNullOrWhiteSpace(dto.AuthorName) ? "Customer" : dto.AuthorName.Trim();
            // Never persist JWT sub / userId as the public author label.
            if (Guid.TryParse(author, out _))
                author = "Customer";
            var title = string.IsNullOrWhiteSpace(dto.Title) ? "Review" : dto.Title.Trim();
            var body = string.IsNullOrWhiteSpace(dto.Body) ? "" : dto.Body.Trim();

            var entity = new ProductReview
            {
                Id = Guid.NewGuid(),
                UserId = dto.UserId,
                ProductId = dto.ProductId,
                Body = body,
                CreatedAtUtc = DateTime.UtcNow,
                Title = title,
                AuthorName = author,
                Rating = dto.Rating,
                IsApproved = true,
            };

            _dbContext.ProductReviews.Add(entity);

            if (dto.Images != null)
            {
                foreach (var image in dto.Images.Where(i => !string.IsNullOrWhiteSpace(i)))
                {
                    string url;
                    try
                    {
                        url = PersistReviewImage(image.Trim());
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Review image rejected");
                        return new Error("InvalidImage", ex.Message);
                    }

                    _dbContext.ProductReviewImages.Add(new ProductReviewImage
                    {
                        Id = Guid.NewGuid(),
                        ReviewId = entity.Id,
                        Url = url
                    });
                }
            }

            if (dto.Tags != null)
            {
                foreach (var tag in dto.Tags
                             .Where(t => !string.IsNullOrWhiteSpace(t))
                             .Select(t => t.Trim())
                             .Distinct(StringComparer.OrdinalIgnoreCase)
                             .Take(8))
                {
                    _dbContext.ProductReviewTags.Add(new ProductReviewTag
                    {
                        Id = Guid.NewGuid(),
                        ReviewId = entity.Id,
                        Name = tag.Length > 100 ? tag[..100] : tag
                    });
                }
            }

            await _dbContext.SaveChangesAsync(cancellationToken);
            await RecalculateProductReviewStatsAsync(dto.ProductId, cancellationToken);

            var created = await GetReviewById(entity.Id, cancellationToken);
            return created.Succeeded && created.Value != null
                ? created.Value
                : entity;
        }
        catch (DbUpdateException ex)
        {
            // Unique (user+product) → 409. Other DB errors (e.g. Url too long) must NOT look like "already reviewed".
            var pg = ex.InnerException?.GetType().GetProperty("SqlState")?.GetValue(ex.InnerException) as string;
            if (pg == "23505")
            {
                _logger.LogWarning(ex, "PostProductReview unique conflict");
                return QueryError.Conflict;
            }

            _logger.LogError(ex, "PostProductReview db error");
            return Error.Failed;
        }
        catch (Exception e)
        {
            _logger.LogError(e, "PostProductReview failed");
            return Error.Failed;
        }
    }

    /// <summary>
    /// Data-URL фото не влезают в Url(1000) — кладём файл в wwwroot/uploads и храним короткий путь.
    /// </summary>
    private string PersistReviewImage(string image)
    {
        if (image.StartsWith("data:", StringComparison.OrdinalIgnoreCase))
            return _storage.SaveDataUrl(image);

        if (image.Length > 1000)
            throw new ArgumentException("Image URL is too long (max 1000). Upload a file instead.");

        return image;
    }

    public async Task<Result> SetApproveReview(Guid reviewId, CancellationToken cancellationToken)
    {
        var review = await _dbContext.ProductReviews.FirstOrDefaultAsync(r => r.Id == reviewId, cancellationToken);
        if (review is null) return QueryError.EntityNotExist;

        review.IsApproved = !review.IsApproved;
        await _dbContext.SaveChangesAsync(cancellationToken);
        await RecalculateProductReviewStatsAsync(review.ProductId, cancellationToken);
        return Result.Success();
    }

    public async Task<Result> SetApproveForAllReview(IList<Guid> reviewIds, bool approve, CancellationToken cancellationToken)
    {
        var reviews = await _dbContext.ProductReviews
            .Where(r => reviewIds.Contains(r.Id))
            .ToListAsync(cancellationToken);
        if (reviews.Count == 0) return QueryError.EntityNotExist;

        foreach (var r in reviews)
            r.IsApproved = approve;

        await _dbContext.SaveChangesAsync(cancellationToken);

        foreach (var productId in reviews.Select(r => r.ProductId).Distinct())
            await RecalculateProductReviewStatsAsync(productId, cancellationToken);

        return Result.Success();
    }

    public async Task<Result> SetGrade(Guid reviewId, Guid userId, CancellationToken cancellationToken)
    {
        var grade = await _dbContext.ProductReviewGrades
            .FirstOrDefaultAsync(r => r.ReviewId == reviewId && r.UserId == userId, cancellationToken);
        if (grade != null)
        {
            grade.IsHelpful = !grade.IsHelpful;
        }
        else
        {
            var review = await _dbContext.ProductReviews.FirstOrDefaultAsync(r => r.Id == reviewId, cancellationToken);
            if (review is null) return QueryError.EntityNotExist;

            _dbContext.ProductReviewGrades.Add(new ProductReviewGrade
            {
                UserId = userId,
                ReviewId = review.Id,
                IsHelpful = true
            });
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }

    public async Task<Result> Report(Guid reviewId, Guid userId, CancellationToken cancellationToken)
    {
        var grade = await _dbContext.ProductReviewGrades
            .FirstOrDefaultAsync(r => r.ReviewId == reviewId && r.UserId == userId, cancellationToken);
        if (grade != null)
        {
            grade.Reported = !grade.Reported;
        }
        else
        {
            var review = await _dbContext.ProductReviews.FirstOrDefaultAsync(r => r.Id == reviewId, cancellationToken);
            if (review is null) return QueryError.EntityNotExist;

            _dbContext.ProductReviewGrades.Add(new ProductReviewGrade
            {
                UserId = userId,
                ReviewId = review.Id,
                Reported = true
            });
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }

    public async Task<Result<ProductReviewGrade?>> GetMyGrade(Guid reviewId, Guid userId, CancellationToken cancellationToken)
    {
        var grade = await _dbContext.ProductReviewGrades
            .FirstOrDefaultAsync(r => r.ReviewId == reviewId && r.UserId == userId, cancellationToken);
        return grade == null ? QueryError.EntityNotExist : grade;
    }

    public async Task RecalculateProductReviewStatsAsync(Guid productId, CancellationToken cancellationToken)
    {
        var product = await _dbContext.Products.FirstOrDefaultAsync(p => p.Id == productId, cancellationToken);
        if (product is null) return;

        var approved = await _dbContext.ProductReviews.AsNoTracking()
            .Where(r => r.ProductId == productId && r.IsApproved)
            .Select(r => r.Rating)
            .ToListAsync(cancellationToken);

        product.ReviewCount = approved.Count;
        product.AverageRating = approved.Count == 0
            ? 0
            : (decimal)Math.Round(approved.Average(r => r), 1);
        product.UpdatedAtUtc = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    private static IQueryable<ProductReview> ProjectReviews(IQueryable<ProductReview> source) =>
        source.Select(r => new ProductReview
        {
            Id = r.Id,
            ProductId = r.ProductId,
            AuthorName = r.AuthorName,
            Body = r.Body,
            CreatedAtUtc = r.CreatedAtUtc,
            IsApproved = r.IsApproved,
            Rating = r.Rating,
            Tags = r.Tags,
            Title = r.Title,
            UserId = r.UserId,
            Images = r.Images,
            TotalHelpful = r.Grades.Count(g => g.IsHelpful),
            TotalReported = r.Grades.Count(g => g.Reported),
        }).AsNoTracking();

    private async Task<ProductReviewStatistic> GetReviewStatistic(
        IQueryable<ProductReview> query,
        QueryOptions options,
        CancellationToken cancellationToken)
    {
        var stats = new ProductReviewStatistic();
        query = PagedList<ProductReview>.CreateQuery(query, options);

        stats.TotalReviews = await query.CountAsync(cancellationToken);
        stats.TotalComments = await query
            .Where(r => !string.IsNullOrWhiteSpace(r.Title) || !string.IsNullOrWhiteSpace(r.Body))
            .CountAsync(cancellationToken);

        stats.Statistics = await query.GroupBy(r => r.Rating).Select(r => new Statistic<int>
        {
            Name = r.Key.ToString(),
            Value = r.Count()
        }).ToListAsync(cancellationToken);
        return stats;
    }
}
