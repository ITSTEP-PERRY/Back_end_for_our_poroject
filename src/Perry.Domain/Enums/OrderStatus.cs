namespace Perry.Domain.Enums;

/// <summary>
/// Статусы заказа (Admin Orders + кабинет покупателя).
/// Числовые значения совместимы с прежними Pending/Paid/… (0–4); Returned = 5.
/// </summary>
public enum OrderStatus
{
    /// <summary>Бывший Pending.</summary>
    Ordered = 0,

    /// <summary>Бывший Paid.</summary>
    Received = 1,

    Shipped = 2,

    /// <summary>Бывший Completed.</summary>
    ReadyToPickup = 3,

    Cancelled = 4,

    Returned = 5
}
