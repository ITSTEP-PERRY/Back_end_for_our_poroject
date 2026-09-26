namespace Perry.Domain.Entities;

/// <summary>Товар в избранном. UserId — из Auth Service (#94).</summary>
public class WishlistItem
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    public Guid ProductId { get; set; }

    public Product Product { get; set; } = null!;

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}
