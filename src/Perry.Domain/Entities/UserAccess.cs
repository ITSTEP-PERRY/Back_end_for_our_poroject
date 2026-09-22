namespace Perry.Domain.Entities;

/// <summary>
/// Учётные данные входа + роль (из homework ASP-421).
/// Dk — derived key пароля (RFC 2898 / PbKdf1).
/// </summary>
[Obsolete("Deprecated: Use Auth service instead")]
public class UserAccess
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    public User User { get; set; } = null!;

    /// <summary>Id роли: Admin, Guest, Editor.</summary>
    public string RoleId { get; set; } = string.Empty;

    public UserRole Role { get; set; } = null!;

    public string Login { get; set; } = string.Empty;

    public string Salt { get; set; } = string.Empty;

    /// <summary>Хеш пароля (derived key).</summary>
    public string Dk { get; set; } = string.Empty;
}
