namespace Perry.Domain.Entities;

/// <summary>
/// Пользователь системы (из homework ASP-421).
/// Для админки и будущей зоны Auth.
/// </summary>

[Obsolete("Deprecated: Use Auth service instead")]
public class User
{
    public Guid Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string Avatar { get; set; } = string.Empty;

    public DateTime? Birthdate { get; set; }

    public DateTime RegisteredAtUtc { get; set; } = DateTime.UtcNow;

    public DateTime? DeletedAtUtc { get; set; }

    public ICollection<UserAccess> Accesses { get; set; } = new List<UserAccess>();
}
