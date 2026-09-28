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
    
    public async Task<Result<ProductReviewDto>> GetAllReviews(QueryOptions options,Guid? id,  CancellationToken cancellationToken)
    {
        IQueryable<ProductReview> query =  _dbContext.ProductReviews
            .Select(r =>new ProductReview
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
            })
            .AsNoTracking();
        
        if(id != null) query = query.Where(r => r.ProductId == id ||  r.UserId == id) ;
        
        var pageList = await PagedList<ProductReview>.CreateAsync(query, options,  cancellationToken);

        var statQuery = _dbContext.ProductReviews.AsQueryable();
        
        if(id != null) statQuery = statQuery.Where(r => r.ProductId == id ||  r.UserId == id) ;
        
        
        var stats = await GetReviewStatistic(statQuery, options, cancellationToken);
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
                TotalHelpful = r.Grades.Count(g => g.IsHelpful),
                TotalReported = r.Grades.Count(g => g.Reported),
            })
            .AsNoTracking();
        
        var pageList = await PagedList<ProductReview>.CreateAsync(query, options,  cancellationToken);
        var statQuery = _dbContext.ProductReviews.AsQueryable();
        
        var stats = await GetReviewStatistic(statQuery, options, cancellationToken);
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

    
    public async Task<Result> SetApproveForAllReview(IList<Guid> reviewIds,bool approve, CancellationToken cancellationToken)
    {
        var reviews = await _dbContext.ProductReviews.Where(r => reviewIds.Contains(r.Id))
            .ToListAsync(cancellationToken);
        
        reviews.ForEach(r => r.IsApproved = approve);
        
        await _dbContext.SaveChangesAsync(cancellationToken);
        return Result.Success();
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
    
    public async Task<Result> Report(Guid reviewId,Guid userId, CancellationToken cancellationToken)
    {
        var grade = _dbContext.ProductReviewGrades
            .FirstOrDefault(r => r.ReviewId == reviewId && r.UserId == userId);
        if (grade != null)
        {
            grade.Reported = !grade.Reported;
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
                    Reported = true
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

    public async Task<Result<ProductReviewGrade?>> GetMyGrade(Guid reviewId, Guid userId, CancellationToken cancellationToken)
    {
        var grade = await _dbContext.ProductReviewGrades.FirstOrDefaultAsync(r => r.ReviewId == reviewId && r.UserId == userId, cancellationToken);
        return grade == null ? QueryError.EntityNotExist : grade;
    }
    
    private async Task<ProductReviewStatistic> GetReviewStatistic(IQueryable<ProductReview> query, QueryOptions options, CancellationToken cancellationToken)
    {
        ProductReviewStatistic stats = new();
        
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