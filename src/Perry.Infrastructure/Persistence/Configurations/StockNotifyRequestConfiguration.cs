using Perry.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Perry.Infrastructure.Persistence.Configurations;

public class StockNotifyRequestConfiguration : IEntityTypeConfiguration<StockNotifyRequest>
{
    public void Configure(EntityTypeBuilder<StockNotifyRequest> builder)
    {
        builder.ToTable("StockNotifyRequests");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Email).HasMaxLength(256).IsRequired();
        builder.HasIndex(x => new { x.ProductId, x.Email }).IsUnique();
        builder.HasIndex(x => x.ProductId);

        builder.HasOne(x => x.Product)
            .WithMany()
            .HasForeignKey(x => x.ProductId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
