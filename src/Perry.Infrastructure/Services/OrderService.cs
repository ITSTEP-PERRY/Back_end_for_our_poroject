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
    /// <param name="shippingAddress">Адрес доставки с клиента (#A05).</param>
    /// <param name="paymentType">Способ оплаты с клиента (#A05).</param>
    Task<Order> CreateFromCartAsync(
        Guid userId,
        string? sessionId,
        string? recipientName = null,
        string? shippingAddress = null,
        string? paymentType = null,
        CancellationToken ct = default);
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

    /// <summary>#A09</summary>
    public Guid? ProductId { get; init; }
    public Guid? UserId { get; init; }
    public string? PaymentType { get; init; }
    /// <summary>email / sku / product name / shipping address / recipient</summary>
    public string? Search { get; init; }
    /// <summary>orderDate (default) | totalAmount</summary>
    public string? SortBy { get; init; }
    public bool SortDesc { get; init; } = true;
    public int Page { get; init; } = 1;
    public int PageSize { get; init; } = 20;
    /// <summary>UserIds matched by email via Auth Internal (optional).</summary>
    public IReadOnlyCollection<Guid>? EmailMatchedUserIds { get; init; }
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
    public int Page { get; init; }
    public int PageSize { get; init; }
    public int TotalPages { get; init; }
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
        var page = query.Page < 1 ? 1 : query.Page;
        var pageSize = query.PageSize < 1 ? 20 : Math.Min(query.PageSize, 100);

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

        if (query.UserId.HasValue)
            baseQ = baseQ.Where(o => o.UserId == query.UserId.Value);

        if (query.ProductId.HasValue)
        {
            var pid = query.ProductId.Value;
            baseQ = baseQ.Where(o => o.Items.Any(i => i.ProductId == pid));
        }

        if (!string.IsNullOrWhiteSpace(query.PaymentType))
        {
            var pay = query.PaymentType.Trim();
            baseQ = baseQ.Where(o => o.PaymentType != null && o.PaymentType.ToLower() == pay.ToLower());
        }

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var q = query.Search.Trim().ToLower();
            var skuProductIds = await _db.Products.AsNoTracking()
                .Where(p => p.Sku.ToLower().Contains(q))
                .Select(p => p.Id)
                .ToListAsync(ct);
            var emailIds = (query.EmailMatchedUserIds ?? Array.Empty<Guid>()).ToList();
            baseQ = baseQ.Where(o =>
                (o.ShippingAddress != null && o.ShippingAddress.ToLower().Contains(q))
                || (o.RecipientName != null && o.RecipientName.ToLower().Contains(q))
                || emailIds.Contains(o.UserId)
                || o.Items.Any(i =>
                    i.ProductName.ToLower().Contains(q)
                    || (i.ProductDescription != null && i.ProductDescription.ToLower().Contains(q))
                    || skuProductIds.Contains(i.ProductId)));
        }

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

        var sortBy = (query.SortBy ?? "orderDate").Trim().ToLowerInvariant();
        IOrderedQueryable<Order> ordered = sortBy switch
        {
            "totalamount" or "amount" or "total" => query.SortDesc
                ? periodQ.OrderByDescending(o => o.TotalAmount).ThenByDescending(o => o.OrderDateUtc)
                : periodQ.OrderBy(o => o.TotalAmount).ThenByDescending(o => o.OrderDateUtc),
            _ => query.SortDesc
                ? periodQ.OrderByDescending(o => o.OrderDateUtc)
                : periodQ.OrderBy(o => o.OrderDateUtc)
        };

        var totalOrders = await periodQ.CountAsync(ct);
        var totalAmount = await periodQ.SumAsync(o => (decimal?)o.TotalAmount, ct) ?? 0m;
        var totalPages = totalOrders == 0 ? 0 : (int)Math.Ceiling(totalOrders / (double)pageSize);

        var items = await ordered
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        var grouped = await periodQ
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
            CompareToUtc = cmpTo,
            Page = page,
            PageSize = pageSize,
            TotalPages = totalPages
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
        string? shippingAddress = null,
        string? paymentType = null,
        CancellationToken ct = default)
    {
        var items = await _cart.GetItemsAsync(userId, sessionId, ct);
        if (items.Count == 0)
            throw new InvalidOperationException("Корзина пуста.");

        var address = string.IsNullOrWhiteSpace(shippingAddress)
            ? "Canada, Ontario, Something Street, 1919"
            : shippingAddress.Trim();
        var pay = string.IsNullOrWhiteSpace(paymentType) ? "Cash" : paymentType.Trim();
        var allowedPay = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "Cash", "Card", "Online" };
        if (!allowedPay.Contains(pay))
            throw new InvalidOperationException("Неизвестный paymentType. Допустимо: Cash, Card, Online.");

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
            ShippingAddress = address,
            PaymentType = pay,
            CreatedAtUtc = DateTime.UtcNow,
            // #A10 — last update starts at create; refreshed on status change
            UpdatedAtUtc = DateTime.UtcNow
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
        // #A10 — track last status change
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
            await _cart.AddAsync(userId, null, item.ProductId, item.Quantity, ct);
    }
}
