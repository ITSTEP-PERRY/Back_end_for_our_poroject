using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Perry.Domain.Entities;
using Perry.Domain.Enums;
using Perry.Infrastructure.Persistence;

namespace Perry.Tests.Helpers;

/// <summary>SQLite in-memory DbContext; connection kept open for the fixture lifetime.</summary>
public sealed class TestDb : IDisposable
{
    private readonly SqliteConnection _connection;

    public AppDbContext Db { get; }

    public TestDb()
    {
        _connection = new SqliteConnection("Data Source=:memory:");
        _connection.Open();

        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite(_connection)
            .Options;

        Db = new AppDbContext(options);
        Db.Database.EnsureCreated();
    }

    public Category SeedCategory(string name = "Test Cat")
    {
        var cat = new Category
        {
            Id = Guid.NewGuid(),
            Name = name,
            Slug = "cat-" + Guid.NewGuid().ToString("N")[..8],
            IsActive = true,
            SortOrder = 0
        };
        Db.Categories.Add(cat);
        Db.SaveChanges();
        return cat;
    }

    public Product SeedProduct(Category? category = null, int stock = 10, decimal price = 25m, string? name = null)
    {
        category ??= SeedCategory();
        var product = new Product
        {
            Id = Guid.NewGuid(),
            Name = name ?? "Test Product",
            Description = "desc",
            Sku = "SKU-" + Guid.NewGuid().ToString("N")[..8].ToUpperInvariant(),
            Brand = "Perry",
            Slug = "p-" + Guid.NewGuid().ToString("N")[..8],
            CategoryId = category.Id,
            Price = price,
            StockQuantity = stock,
            Status = stock <= 0 ? ProductStatus.OutOfStock : ProductStatus.Active,
            CreatedAtUtc = DateTime.UtcNow
        };
        Db.Products.Add(product);
        Db.SaveChanges();
        return product;
    }

    public void Dispose()
    {
        Db.Dispose();
        _connection.Dispose();
    }
}
