using Perry.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Perry.Infrastructure.Persistence.Configurations;

/// <summary>
/// Fluent API: таблица Products — цены, индексы для фильтров, связь с Category.
/// </summary>
public class ProductConfiguration : IEntityTypeConfiguration<Product>
{
    public void Configure(EntityTypeBuilder<Product> builder)
    {
        builder.ToTable("Products");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Name).HasMaxLength(500).IsRequired();
        builder.Property(x => x.Description).HasMaxLength(4000).IsRequired();
        builder.Property(x => x.Sku).HasMaxLength(100).IsRequired();
        builder.Property(x => x.Brand).HasMaxLength(200).IsRequired();
        builder.Property(x => x.Slug).HasMaxLength(220).IsRequired();

        // Точность денег: 18 цифр всего, 2 после запятой
        builder.Property(x => x.Price).HasPrecision(18, 2);
        builder.Property(x => x.OldPrice).HasPrecision(18, 2);
        builder.Property(x => x.AverageRating).HasPrecision(3, 2);

        // Enum храним как int в БД
        builder.Property(x => x.Status).HasConversion<int>();

        // Вычисляемое свойство — колонки в БД нет
        builder.Ignore(x => x.DiscountPercent);

        builder.HasIndex(x => x.Sku).IsUnique();
        builder.HasIndex(x => x.Slug).IsUnique();
        builder.HasIndex(x => x.CategoryId);
        builder.HasIndex(x => x.Brand);
        builder.HasIndex(x => x.Status);
        builder.HasIndex(x => x.Price);
        builder.HasIndex(x => x.ViewCount);
        builder.HasIndex(x => x.OrderCount);

        builder.HasOne(x => x.Category)
            .WithMany(x => x.Products)
            .HasForeignKey(x => x.CategoryId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
