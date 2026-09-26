namespace Perry.Domain.Entities;

/// <summary>Подписка «Notify when available» для товара out of stock.</summary>
public class StockNotifyRequest
{
    public Guid Id { get; set; }

    public Guid ProductId { get; set; }

    public Product Product { get; set; } = null!;

    /// <summary>Email для уведомления (гость или аккаунт).</summary>
    public string Email { get; set; } = string.Empty;

    public Guid? UserId { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    /// <summary>Когда письмо о наличии уже отправили (null = ещё ждём).</summary>
    public DateTime? NotifiedAtUtc { get; set; }
}
