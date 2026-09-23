using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Perry.Domain.Entities;
using Perry.Domain.Errors;
using Perry.Domain.Primitives;
using Perry.Infrastructure.DTOs;
using Perry.Infrastructure.Interfaces;
using Perry.Infrastructure.Options;
using Perry.Infrastructure.Persistence;

namespace Perry.Infrastructure.Repositories;

public class ReviewRepository: IReviewRepository
{
    private readonly ILogger<ReviewRepository> _logger;
    private readonly AppDbContext _dbContext;
    
    public ReviewRepository(ILogger<ReviewRepository> logger, AppDbContext dbContext)
    {
        _logger = logger;
        _dbContext = dbContext;
    }
    
    public async Task<Result<ProductReviewDto>> GetAllReviews(QueryOptions options, CancellationToken cancellationToken)
    {
        IQueryable<ProductReview> query =  _dbContext.ProductReviews
            .Select(r =>new ProductReview
            {
                Id = r.Id,
                ProductId = r.ProductId,
                 Body = r.Body,
                CreatedAtUtc = r.CreatedAtUtc,
                IsApproved = r.IsApproved,
                Rating = r.Rating,
                Tags = r.Tags,
                Title = r.Title,
                UserId = r.UserId,
                Images = r.Images,
                Grades = r.Grades
            })
            .AsNoTracking();
        
        var pageList = await PagedList<ProductReview>.CreateAsync(query, options,  cancellationToken);
        var stats = await GetReviewStatistic(options, cancellationToken);
        return new ProductReviewDto
        {
            PagedList = pageList,
            Statistic = stats
        };
    }

   
    public async Task<Result<ProductReviewDto>> GetReviewsByUserOrProductId(Guid id, QueryOptions options, CancellationToken cancellationToken)
    {
        IQueryable<ProductReview> query =  _dbContext.ProductReviews
            .Where(r => r.ProductId == id || r.UserId == id)
            .Select(r =>new ProductReview
            {
                Id = r.Id,
                ProductId = r.ProductId,
                Body = r.Body,
                CreatedAtUtc = r.CreatedAtUtc,
                IsApproved = r.IsApproved,
                Rating = r.Rating,
                Tags = r.Tags,
                Title = r.Title,
                UserId = r.UserId,
                Images = r.Images,
                Grades = r.Grades
            })
            .AsNoTracking();
        
        var pageList = await PagedList<ProductReview>.CreateAsync(query, options,  cancellationToken);
        var stats = await GetReviewStatistic(options, cancellationToken);
        return new ProductReviewDto
        {
            PagedList = pageList,
            Statistic = stats
        };
    }

    public async Task<Result<ProductReview>> GetReviewById(Guid id, CancellationToken cancellationToken)
    {
        var review =  await _dbContext.ProductReviews
            .Where(r =>  r.Id == id)
            .Select(r =>new ProductReview
            {
                Id = r.Id,
                ProductId = r.ProductId,
                Body = r.Body,
                CreatedAtUtc = r.CreatedAtUtc,
                IsApproved = r.IsApproved,
                Rating = r.Rating,
                Tags = r.Tags,
                Title = r.Title,
                UserId = r.UserId,
                Images = r.Images,
            })
            .AsNoTracking()
            .FirstOrDefaultAsync(cancellationToken);
        if (review == null) return QueryError.EntityNotExist;
        return review;
    }

    public async Task<Result> PostProductReview(PostReviewDto dto, CancellationToken cancellationToken)
    {
        try
        {
            var review = _dbContext.ProductReviews.Add(new ProductReview
            {
                UserId = dto.UserId,
                ProductId = dto.ProductId,
                Body = dto.Body,
                CreatedAtUtc = DateTime.UtcNow,
                Title = dto.Title,
                AuthorName = dto.AuthorName,
                Rating = dto.Rating,
                IsApproved = true,
            });
            if (dto.Images != null)
            {
                foreach (var image in dto.Images)
                {
                    _dbContext.ProductReviewImages.Add(new ProductReviewImage
                    {
                        Review = review.Entity,
                        Url = image
                    });
                }
            }
            await  _dbContext.SaveChangesAsync(cancellationToken);
            
            return Result.Success();
        }
        catch (Exception e)
        {
            return Error.Failed;
        }
        
        
    }

    public async Task<Result> SetApproveReview(Guid reviewId, CancellationToken cancellationToken)
    {
        var review = _dbContext.ProductReviews.FirstOrDefault(r => r.Id == reviewId);
        if (review != null)
        {
            review.IsApproved = !review.IsApproved;
            await _dbContext.SaveChangesAsync(cancellationToken);
            return Result.Success();
        }
        return QueryError.EntityNotExist;
    }

    public async Task<Result> SetGrade(Guid reviewId, Guid userId, CancellationToken cancellationToken)
    {
        var grade = _dbContext.ProductReviewGrades
            .FirstOrDefault(r => r.ReviewId == reviewId && r.UserId == userId);
        if (grade != null)
        {
            grade.IsHelpful = !grade.IsHelpful;
        }
        else
        {
            var review = _dbContext.ProductReviews.FirstOrDefault(r => r.Id == reviewId);
            if (review != null)
            {
                _dbContext.ProductReviewGrades.Add(new ProductReviewGrade
                {
                    UserId = userId,
                    ReviewId = review.Id,
                    IsHelpful = true
                });
            }
            else
            {
                return QueryError.EntityNotExist;
            }

        }
        
        await _dbContext.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
    
    
    private async Task<ProductReviewStatistic> GetReviewStatistic(QueryOptions options, CancellationToken cancellationToken)
    {
        ProductReviewStatistic stats = new();
        var statQuery = _dbContext.ProductReviews.AsQueryable();
        
        statQuery = PagedList<ProductReview>.CreateQuery(statQuery, options);
        
        stats.TotalReviews = await statQuery.CountAsync(cancellationToken);
        stats.TotalComments = await statQuery
            .Where(r => !string.IsNullOrWhiteSpace(r.Title) || !string.IsNullOrWhiteSpace(r.Body))
            .CountAsync(cancellationToken);

        stats.Statistics = await statQuery.GroupBy(r => r.Rating).Select(r => new Statistic<int>
        {
            Name = r.Key.ToString(),
            Value = r.Count()
        }).ToListAsync(cancellationToken);
        return stats;
    }
}