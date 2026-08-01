namespace Perry.Infrastructure.Services;

/// <summary>Генерация, хранение и проверка 6-значного кода подтверждения email (10 минут).</summary>
public interface IEmailCodeService
{
    string GenerateCode(string email);
    bool TryVerify(string email, string code);
    /// <summary>Проверить код без удаления (чтобы не сжигать его до успешного входа).</summary>
    bool Matches(string email, string code);
    void Invalidate(string email);
    bool HasCode(string email);
    string? PeekCode(string email);
}
