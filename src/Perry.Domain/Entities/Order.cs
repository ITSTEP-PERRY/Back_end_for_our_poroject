using Perry.Domain.Enums;

namespace Perry.Domain.Entities;

/// <summary>
/// Заказ покупателя. UserId — из Auth Service (JWT), без локальной таблицы Users (#94).
/// </summary>
public class Order
{
    public Guid Id { get; set; }

    /// <summary>Id пользователя из Perry Auth JWT.</summary>
    public Guid UserId { get; set; }

    public DateTime OrderDateUtc { get; set; } = DateTime.UtcNow;

    public decimal TotalAmount { get; set; }

    public int ItemsCount { get; set; }

    public OrderStatus Status { get; set; } = OrderStatus.ReadyToPickup;

    /// <summary>Имя получателя (из JWT claims или клиента).</summary>
    public string? RecipientName { get; set; }

    public string? ShippingAddress { get; set; }

    public string? PaymentType { get; set; }

    public DateTime? CompletedAtUtc { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAtUtc { get; set; }

    public ICollection<OrderItem> Items { get; set; } = new List<OrderItem>();
}
