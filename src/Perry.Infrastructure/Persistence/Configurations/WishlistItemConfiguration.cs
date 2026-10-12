using Perry.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Perry.Infrastructure.Persistence.Configurations;

public class WishlistItemConfiguration : IEntityTypeConfiguration<WishlistItem>
{
    public void Configure(EntityTypeBuilder<WishlistItem> builder)
    {
        builder.ToTable("WishlistItems");
        builder.HasKey(x => x.Id);

        builder.HasIndex(x => new { x.UserId, x.ProductId }).IsUnique();
        builder.HasIndex(x => x.UserId);
        builder.HasIndex(x => x.ProductId);
        builder.HasIndex(x => x.CreatedAtUtc);

        // No FK to Users — Auth Service owns identities (#94)
        builder.HasOne(x => x.Product)
            .WithMany()
            .HasForeignKey(x => x.ProductId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
