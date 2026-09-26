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
    Task<AdminOrdersResult> GetAdminOrdersAsync(AdminOrdersQuery query, CancellationToken ct = default);
    /// <param name="recipientName">Имя из JWT claims Auth Service (опционально).</param>
    Task<Order> CreateFromCartAsync(Guid userId, string? sessionId, string? recipientName = null, CancellationToken ct = default);
    Task UpdateStatusAsync(Guid orderId, OrderStatus status, CancellationToken ct = default);
    /// <summary>Повторить заказ: очистить корзину и добавить позиции снова (homework RepeatOrder).</summary>
    Task RepeatOrderAsync(Guid userId, Guid orderId, CancellationToken ct = default);
}

public sealed class AdminOrdersQuery
{
    public OrderStatus? Status { get; init; }
    public DateTime? FromUtc { get; init; }
    public DateTime? ToUtc { get; init; }
    public string? OrderId { get; init; }
}

public sealed class AdminOrdersResult
{
    public required IReadOnlyList<Order> Items { get; init; }
    public int TotalOrders { get; init; }
    public decimal TotalAmount { get; init; }
    public required IReadOnlyDictionary<string, int> StatusCounts { get; init; }
    public double? TotalOrderCompare { get; init; }
    public double? TotalAmountCompare { get; init; }
    public DateTime? PeriodFromUtc { get; init; }
    public DateTime? PeriodToUtc { get; init; }
    public DateTime? CompareFromUtc { get; init; }
    public DateTime? CompareToUtc { get; init; }
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
            .Where(o => o.UserId == userId)
            .OrderByDescending(o => o.OrderDateUtc)
            .ToListAsync(ct);

    public async Task<Order?> GetByIdAsync(Guid orderId, Guid? userId = null, CancellationToken ct = default)
    {
        var q = _db.Orders.AsNoTracking().Include(o => o.Items).AsQueryable();
        if (userId.HasValue)
            q = q.Where(o => o.UserId == userId);

        return await q.FirstOrDefaultAsync(o => o.Id == orderId, ct);
    }

    public async Task<IReadOnlyList<Order>> GetAllAsync(CancellationToken ct = default) =>
        await _db.Orders
            .AsNoTracking()
            .Include(o => o.Items)
            .OrderByDescending(o => o.OrderDateUtc)
            .Take(200)
            .ToListAsync(ct);

    public async Task<AdminOrdersResult> GetAdminOrdersAsync(AdminOrdersQuery query, CancellationToken ct = default)
    {
        var baseQ = _db.Orders.AsNoTracking().Include(o => o.Items).AsQueryable();

        if (!string.IsNullOrWhiteSpace(query.OrderId))
        {
            var raw = query.OrderId.Trim();
            if (Guid.TryParse(raw, out var oid))
                baseQ = baseQ.Where(o => o.Id == oid);
            else
                baseQ = baseQ.Where(o => o.Id.ToString().Contains(raw));
        }

        if (query.Status.HasValue)
            baseQ = baseQ.Where(o => o.Status == query.Status.Value);

        var hasPeriod = query.FromUtc.HasValue || query.ToUtc.HasValue;
        DateTime? from = query.FromUtc;
        DateTime? to = query.ToUtc;
        if (from.HasValue && to.HasValue && to < from)
            (from, to) = (to, from);

        var periodQ = baseQ;
        if (from.HasValue)
            periodQ = periodQ.Where(o => o.OrderDateUtc >= from.Value);
        if (to.HasValue)
            periodQ = periodQ.Where(o => o.OrderDateUtc < to.Value);

        var items = await periodQ
            .OrderByDescending(o => o.OrderDateUtc)
            .Take(500)
            .ToListAsync(ct);

        var totalOrders = items.Count;
        // Для точных агрегатов по фильтру без Take — отдельно
        var aggQ = baseQ;
        if (from.HasValue)
            aggQ = aggQ.Where(o => o.OrderDateUtc >= from.Value);
        if (to.HasValue)
            aggQ = aggQ.Where(o => o.OrderDateUtc < to.Value);

        totalOrders = await aggQ.CountAsync(ct);
        var totalAmount = await aggQ.SumAsync(o => (decimal?)o.TotalAmount, ct) ?? 0m;

        var grouped = await aggQ
            .GroupBy(o => o.Status)
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .ToListAsync(ct);

        var statusCounts = Enum.GetValues<OrderStatus>()
            .ToDictionary(s => s.ToString(), s => 0);
        foreach (var g in grouped)
            statusCounts[g.Status.ToString()] = g.Count;

        double? orderCompare = null;
        double? amountCompare = null;
        DateTime? cmpFrom = null;
        DateTime? cmpTo = null;

        if (hasPeriod && from.HasValue && to.HasValue)
        {
            var duration = to.Value - from.Value;
            if (duration <= TimeSpan.Zero)
                duration = TimeSpan.FromDays(1);
            cmpTo = from.Value;
            cmpFrom = from.Value - duration;

            var prevQ = baseQ
                .Where(o => o.OrderDateUtc >= cmpFrom && o.OrderDateUtc < cmpTo);
            var prevOrders = await prevQ.CountAsync(ct);
            var prevAmount = await prevQ.SumAsync(o => (decimal?)o.TotalAmount, ct) ?? 0m;

            orderCompare = PercentDelta(totalOrders, prevOrders);
            amountCompare = PercentDelta((double)totalAmount, (double)prevAmount);
        }

        return new AdminOrdersResult
        {
            Items = items,
            TotalOrders = totalOrders,
            TotalAmount = totalAmount,
            StatusCounts = statusCounts,
            TotalOrderCompare = orderCompare,
            TotalAmountCompare = amountCompare,
            PeriodFromUtc = from,
            PeriodToUtc = to,
            CompareFromUtc = cmpFrom,
            CompareToUtc = cmpTo
        };
    }

    private static double? PercentDelta(double current, double previous)
    {
        if (previous == 0)
            return current == 0 ? 0 : 100;
        return Math.Round((current - previous) / previous * 100.0, 2);
    }

    public async Task<Order> CreateFromCartAsync(
        Guid userId,
        string? sessionId,
        string? recipientName = null,
        CancellationToken ct = default)
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

        var order = new Order
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            OrderDateUtc = DateTime.UtcNow,
            TotalAmount = items.Sum(i => i.Quantity * i.Product.Price),
            ItemsCount = items.Sum(i => i.Quantity),
            Status = OrderStatus.Ordered,
            RecipientName = string.IsNullOrWhiteSpace(recipientName) ? null : recipientName.Trim(),
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
        if (status == OrderStatus.ReadyToPickup)
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
