namespace Perry.Domain.Entities;

/// <summary>Роль пользователя с CRUD-флагами (из homework ASP-421).</summary>
[Obsolete("Deprecated: Use Auth service instead")]
public class UserRole
{
    public string Id { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public bool CanCreate { get; set; }

    public bool CanRead { get; set; }

    public bool CanUpdate { get; set; }

    public bool CanDelete { get; set; }
}
