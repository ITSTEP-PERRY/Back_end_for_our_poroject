namespace Perry.Domain.Entities;

/// <summary>Товар в избранном пользователя (Wishlist).</summary>
public class WishlistItem
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    public User User { get; set; } = null!;

    public Guid ProductId { get; set; }

    public Product Product { get; set; } = null!;

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}
