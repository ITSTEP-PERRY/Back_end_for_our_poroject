using Perry.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Perry.Infrastructure.Persistence;

/// <summary>
/// Контекст Entity Framework Core — «мост» между C#-сущностями и таблицами SQL Server.
/// Каждый DbSet&lt;T&gt; соответствует таблице в базе данных Perry.
/// </summary>
public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    // --- Каталог ---
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<ProductImage> ProductImages => Set<ProductImage>();
    public DbSet<ProductAttribute> ProductAttributes => Set<ProductAttribute>();
    public DbSet<ProductAboutItem> ProductAboutItems => Set<ProductAboutItem>();

    // --- Отзывы ---
    public DbSet<ProductReview> ProductReviews => Set<ProductReview>();
    public DbSet<ProductReviewImage> ProductReviewImages => Set<ProductReviewImage>();
    public DbSet<ProductReviewTag> ProductReviewTags => Set<ProductReviewTag>();

    // --- Корзина ---
    public DbSet<Cart> Carts => Set<Cart>();
    public DbSet<CartItem> CartItems => Set<CartItem>();

    // --- Заказы ---
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();

    // --- Избранное ---
    public DbSet<WishlistItem> WishlistItems => Set<WishlistItem>();

    // --- Notify when available ---
    public DbSet<StockNotifyRequest> StockNotifyRequests => Set<StockNotifyRequest>();

    // --- Пользователи / админка (из homework ASP-421) ---
    public DbSet<User> Users => Set<User>();
    public DbSet<UserAccess> UserAccesses => Set<UserAccess>();
    public DbSet<UserRole> UserRoles => Set<UserRole>();

    // --- Auth коды / токены (#15) ---
    public DbSet<AuthToken> AuthTokens => Set<AuthToken>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Подтягивает все IEntityTypeConfiguration<> из этой сборки
        // (папка Persistence/Configurations).
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
        base.OnModelCreating(modelBuilder);
    }
}
