using Perry.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Perry.Infrastructure.Persistence.Configurations;

public class OrderConfiguration : IEntityTypeConfiguration<Order>
{
    public void Configure(EntityTypeBuilder<Order> builder)
    {
        builder.ToTable("Orders");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.TotalAmount).HasPrecision(18, 2);
        builder.Property(x => x.Status).HasConversion<int>();
        builder.Property(x => x.RecipientName).HasMaxLength(200);
        builder.Property(x => x.ShippingAddress).HasMaxLength(500);
        builder.Property(x => x.PaymentType).HasMaxLength(50);
        builder.HasIndex(x => x.UserId);
        builder.HasIndex(x => x.OrderDateUtc);

        builder.HasOne(x => x.User)
            .WithMany()
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
