using Perry.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Perry.Infrastructure.Persistence.Configurations;

/// <summary>Таблица ProductReviews — рейтинг 1..5 проверяется CHECK-ограничением.</summary>
public class ProductReviewConfiguration : IEntityTypeConfiguration<ProductReview>
{
    public void Configure(EntityTypeBuilder<ProductReview> builder)
    {
        builder.ToTable("ProductReviews");

        builder.HasKey(x => x.Id);
        builder.Property(x => x.AuthorName).HasMaxLength(200).IsRequired();
        builder.Property(x => x.Title).HasMaxLength(300).IsRequired();
        builder.Property(x => x.Body).HasMaxLength(4000).IsRequired();

        builder.HasIndex(x => x.ProductId);
        builder.HasIndex(x => x.UserId);
        builder.HasIndex(x => x.Rating);
        // #101 — один отзыв на товар от одного пользователя Auth
        builder.HasIndex(x => new { x.UserId, x.ProductId }).IsUnique();

        // PostgreSQL: identifiers in double quotes (SQL Server [] is invalid).
        builder.ToTable(t => t.HasCheckConstraint(
            "CK_ProductReviews_Rating",
            "\"Rating\" >= 1 AND \"Rating\" <= 5"));

        builder.HasOne(x => x.Product)
            .WithMany(x => x.Reviews)
            .HasForeignKey(x => x.ProductId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
