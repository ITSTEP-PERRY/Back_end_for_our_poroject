using Perry.Domain.Entities;
using Perry.Domain.Enums;
using Perry.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Perry.Infrastructure.Services;

/// <summary>Заказы: создание из корзины, история (homework OrderService).</summary>
public interface IOrderService
{
    Task<IReadOnlyList<Order>> GetUserOrdersAsync(Guid userId, CancellationToken ct = default);
    Task<Order?> GetByIdAsync(Guid orderId, Guid? userId = null, CancellationToken ct = default);
    Task<IReadOnlyList<Order>> GetAllAsync(CancellationToken ct = default);
    Task<Order> CreateFromCartAsync(Guid userId, string? sessionId, CancellationToken ct = default);
    Task UpdateStatusAsync(Guid orderId, OrderStatus status, CancellationToken ct = default);
    /// <summary>Повторить заказ: очистить корзину и добавить позиции снова (homework RepeatOrder).</summary>
    Task RepeatOrderAsync(Guid userId, Guid orderId, CancellationToken ct = default);
}

public class OrderService : IOrderService
{
    private readonly AppDbContext _db;
    private readonly ICartService _cart;

    public OrderService(AppDbContext db, ICartService cart)
    {
        _db = db;
        _cart = cart;
    }

    public async Task<IReadOnlyList<Order>> GetUserOrdersAsync(Guid userId, CancellationToken ct = default) =>
        await _db.Orders
            .AsNoTracking()
            .Include(o => o.Items)
            .Include(o => o.User)
            .Where(o => o.UserId == userId)
            .OrderByDescending(o => o.OrderDateUtc)
            .ToListAsync(ct);

    public async Task<Order?> GetByIdAsync(Guid orderId, Guid? userId = null, CancellationToken ct = default)
    {
        var q = _db.Orders.AsNoTracking().Include(o => o.Items).Include(o => o.User).AsQueryable();
        if (userId.HasValue)
            q = q.Where(o => o.UserId == userId);

        return await q.FirstOrDefaultAsync(o => o.Id == orderId, ct);
    }

    public async Task<IReadOnlyList<Order>> GetAllAsync(CancellationToken ct = default) =>
        await _db.Orders
            .AsNoTracking()
            .Include(o => o.User)
            .Include(o => o.Items)
            .OrderByDescending(o => o.OrderDateUtc)
            .Take(200)
            .ToListAsync(ct);

    public async Task<Order> CreateFromCartAsync(Guid userId, string? sessionId, CancellationToken ct = default)
    {
        var items = await _cart.GetItemsAsync(userId, sessionId, ct);
        if (items.Count == 0)
            throw new InvalidOperationException("Корзина пуста.");

        var productIds = items.Select(i => i.ProductId).ToList();
        var products = await _db.Products
            .Include(p => p.Category)
            .Include(p => p.Images)
            .Where(p => productIds.Contains(p.Id))
            .ToDictionaryAsync(p => p.Id, ct);

        foreach (var item in items)
        {
            if (!products.TryGetValue(item.ProductId, out var product))
                throw new InvalidOperationException($"Товар больше недоступен.");

            if (product.StockQuantity < item.Quantity)
                throw new InvalidOperationException(
                    $"Недостаточно «{product.Name}». Доступно: {product.StockQuantity}.");
        }

        var user = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId, ct);

        var order = new Order
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            OrderDateUtc = DateTime.UtcNow,
            TotalAmount = items.Sum(i => i.Quantity * i.Product.Price),
            ItemsCount = items.Sum(i => i.Quantity),
            Status = OrderStatus.Pending,
            RecipientName = user?.Name,
            ShippingAddress = "Canada, Ontario, Something Street, 1919",
            PaymentType = "Cash",
            CreatedAtUtc = DateTime.UtcNow
        };
        _db.Orders.Add(order);

        foreach (var item in items)
        {
            var product = products[item.ProductId];
            var image = product.Images.FirstOrDefault(i => i.IsPrimary)?.Url
                ?? product.Images.OrderBy(i => i.SortOrder).FirstOrDefault()?.Url;

            _db.OrderItems.Add(new OrderItem
            {
                Id = Guid.NewGuid(),
                OrderId = order.Id,
                ProductId = product.Id,
                ProductName = product.Name,
                ProductDescription = product.Description,
                ProductPrice = product.Price,
                Quantity = item.Quantity,
                TotalPrice = item.Quantity * product.Price,
                ProductImageUrl = image,
                CategoryName = product.Category?.Name ?? "—",
                CreatedAtUtc = DateTime.UtcNow
            });

            product.StockQuantity -= item.Quantity;
            if (product.StockQuantity <= 0)
            {
                product.StockQuantity = 0;
                product.Status = ProductStatus.OutOfStock;
            }
            product.OrderCount += item.Quantity;
            product.UpdatedAtUtc = DateTime.UtcNow;
        }

        await _cart.ClearAsync(userId, sessionId, ct);
        await _db.SaveChangesAsync(ct);
        return order;
    }

    public async Task UpdateStatusAsync(Guid orderId, OrderStatus status, CancellationToken ct = default)
    {
        var order = await _db.Orders.FirstOrDefaultAsync(o => o.Id == orderId, ct)
            ?? throw new ArgumentException("Заказ не найден.");

        order.Status = status;
        order.UpdatedAtUtc = DateTime.UtcNow;
        if (status == OrderStatus.Completed)
            order.CompletedAtUtc = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);
    }

    public async Task RepeatOrderAsync(Guid userId, Guid orderId, CancellationToken ct = default)
    {
        var order = await GetByIdAsync(orderId, userId, ct)
            ?? throw new InvalidOperationException("Заказ не найден или не принадлежит вам.");

        await _cart.ClearAsync(userId, null, ct);

        foreach (var item in order.Items)
        {
            var product = await _db.Products.FirstOrDefaultAsync(
                p => p.Id == item.ProductId && p.Status != ProductStatus.Archived, ct);

            if (product is null || product.StockQuantity <= 0)
                continue;

            var qty = Math.Min(item.Quantity, product.StockQuantity);
            await _cart.AddAsync(userId, null, product.Id, qty, ct);
        }
    }
}
