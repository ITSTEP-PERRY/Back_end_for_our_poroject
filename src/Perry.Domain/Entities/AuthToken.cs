namespace Perry.Domain.Entities;

/// <summary>
/// Одноразовый код/токен auth (подтверждение email, смена email, сброс пароля).
/// Хранится в БД, чтобы переживать рестарт API и работать при нескольких инстансах.
/// </summary>
public class AuthToken
{
    public Guid Id { get; set; }

    /// <summary>Назначение: email_verify | email_change | password_reset.</summary>
    public string Purpose { get; set; } = string.Empty;

    /// <summary>
    /// Ключ поиска: нормализованный email / email-change key,
    /// либо сам reset-token (для password_reset).
    /// </summary>
    public string LookupKey { get; set; } = string.Empty;

    /// <summary>Значение: 6-значный код или email владельца reset-токена.</summary>
    public string Secret { get; set; } = string.Empty;

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public DateTime ExpiresAtUtc { get; set; }

    /// <summary>Когда использовали / инвалидировали (null = ещё активен).</summary>
    public DateTime? UsedAtUtc { get; set; }
}

public static class AuthTokenPurposes
{
    public const string EmailVerify = "email_verify";
    public const string EmailChange = "email_change";
    public const string PasswordReset = "password_reset";
}
