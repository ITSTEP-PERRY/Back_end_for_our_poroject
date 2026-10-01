using Perry.Domain.Entities;
using Perry.Domain.Primitives;
using Perry.Infrastructure.DTOs;
using Perry.Infrastructure.Options;

namespace Perry.Infrastructure.Interfaces;

public interface IReviewRepository
{
    Task<Result<ProductReviewDto>> GetAllReviews(QueryOptions options, Guid? id, CancellationToken cancellationToken);
    Task<Result<ProductReviewDto>> GetReviewsByUserOrProductId(Guid id, QueryOptions options, CancellationToken cancellationToken);
    Task<Result<ProductReviewDto>> GetReviewsByUserId(Guid userId, QueryOptions options, bool includeHidden, CancellationToken cancellationToken);
    Task<Result<ProductReview>> GetReviewById(Guid id, CancellationToken cancellationToken);
    Task<Result<ProductReview>> PostProductReview(PostReviewDto dto, CancellationToken cancellationToken);
    Task<Result> SetApproveReview(Guid reviewId, CancellationToken cancellationToken);
    Task<Result> SetApproveForAllReview(IList<Guid> reviewId, bool approve, CancellationToken cancellationToken);
    Task<Result> SetGrade(Guid reviewId, Guid userId, CancellationToken cancellationToken);
    Task<Result> Report(Guid reviewId, Guid userId, CancellationToken cancellationToken);
    Task<Result<ProductReviewGrade?>> GetMyGrade(Guid reviewId, Guid userId, CancellationToken cancellationToken);
    Task RecalculateProductReviewStatsAsync(Guid productId, CancellationToken cancellationToken);
}
