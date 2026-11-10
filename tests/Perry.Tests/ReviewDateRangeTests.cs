using Perry.Domain.Entities;
using Perry.Infrastructure.Repositories;
using Perry.Tests.Helpers;

namespace Perry.Tests;

/// <summary>#A23 — ReviewRepository.ApplyDateRange.</summary>
public class ReviewDateRangeTests
{
    private static TestDb Seed(params DateTime[] dates)
    {
        var fx = new TestDb();
        var product = fx.SeedProduct();
        foreach (var d in dates)
            fx.Db.ProductReviews.Add(new ProductReview
            {
                Id = Guid.NewGuid(), ProductId = product.Id, UserId = Guid.NewGuid(), Rating = 5,
                IsApproved = true, CreatedAtUtc = DateTime.SpecifyKind(d, DateTimeKind.Utc)
            });
        fx.Db.SaveChanges();
        return fx;
    }

    private static int Count(TestDb fx, DateTime? from, DateTime? to) =>
        ReviewRepository.ApplyDateRange(fx.Db.ProductReviews, from, to).Count();

    private static readonly DateTime[] Dates =
    {
        new(2026, 10, 1, 10, 0, 0), new(2026, 10, 5, 23, 59, 0), new(2026, 10, 10, 0, 0, 0)
    };

    [Fact]
    public void Only_from_is_inclusive()
    {
        using var fx = Seed(Dates);
        Assert.Equal(2, Count(fx, new DateTime(2026, 10, 5, 23, 59, 0), null));
    }

    [Fact]
    public void Only_to_date_without_time_means_end_of_day()
    {
        using var fx = Seed(Dates);
        Assert.Equal(2, Count(fx, null, new DateTime(2026, 10, 5)));
    }

    [Fact]
    public void Both_bounds()
    {
        using var fx = Seed(Dates);
        Assert.Equal(1, Count(fx, new DateTime(2026, 10, 2), new DateTime(2026, 10, 9)));
        Assert.Equal(3, Count(fx, new DateTime(2026, 10, 1, 10, 0, 0), new DateTime(2026, 10, 10)));
    }

    [Fact]
    public void To_with_time_is_inclusive()
    {
        using var fx = Seed(Dates);
        Assert.Equal(1, Count(fx, null, new DateTime(2026, 10, 1, 10, 0, 0)));
    }

    [Fact]
    public void No_bounds_returns_all()
    {
        using var fx = Seed(Dates);
        Assert.Equal(3, Count(fx, null, null));
    }
}
