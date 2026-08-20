namespace Perry.Infrastructure.Services;

/// <summary>Одноразовые токены сброса пароля (TTL 30 минут, in-memory).</summary>
public interface IPasswordResetService
{
    string CreateToken(string email);
    string? GetEmail(string token);
    void Invalidate(string token);
}
