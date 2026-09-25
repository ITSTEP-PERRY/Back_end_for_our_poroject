using Perry.Domain.Enums;

namespace Perry.Domain.Entities;

/// <summary>
/// Заказ покупателя (из homework Order + под Figma Admin Order).
/// </summary>
public class Order
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    public User User { get; set; } = null!;

    public DateTime OrderDateUtc { get; set; } = DateTime.UtcNow;

    public decimal TotalAmount { get; set; }

    public int ItemsCount { get; set; }

    public OrderStatus Status { get; set; } = OrderStatus.ReadyToPickup;

    /// <summary>Имя получателя (Account → Order details).</summary>
    public string? RecipientName { get; set; }

    /// <summary>Адрес доставки.</summary>
    public string? ShippingAddress { get; set; }

    /// <summary>Способ оплаты (Cash, Card, …).</summary>
    public string? PaymentType { get; set; }

    public DateTime? CompletedAtUtc { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAtUtc { get; set; }

    public ICollection<OrderItem> Items { get; set; } = new List<OrderItem>();
}
