using Perry.Domain.Entities;
using Perry.Domain.Primitives;
using Perry.Infrastructure.DTOs;
using Perry.Infrastructure.Options;

namespace Perry.Infrastructure.Interfaces;

public interface IReviewRepository
{
    public Task<Result<ProductReviewDto>> GetAllReviews(QueryOptions options, Guid? id, CancellationToken cancellationToken);
    public Task<Result<ProductReviewDto>> GetReviewsByUserOrProductId(Guid id, QueryOptions options, CancellationToken cancellationToken);
    public Task<Result<ProductReview>> GetReviewById(Guid id, CancellationToken cancellationToken);
    public Task<Result> PostProductReview(PostReviewDto dto, CancellationToken cancellationToken);
    public Task<Result> SetApproveReview (Guid reviewId, CancellationToken cancellationToken);
    public Task<Result> SetApproveForAllReview (IList<Guid> reviewId, bool approve, CancellationToken cancellationToken);
    public Task<Result> SetGrade(Guid reviewId,Guid userId, CancellationToken cancellationToken);
    public Task<Result> Report(Guid reviewId,Guid userId, CancellationToken cancellationToken);
    public Task<Result<ProductReviewGrade?>> GetMyGrade(Guid reviewId,Guid userId, CancellationToken cancellationToken);
}