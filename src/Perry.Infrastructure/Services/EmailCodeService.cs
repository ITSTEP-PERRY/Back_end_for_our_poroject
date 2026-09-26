using Perry.Domain.Entities;
using Perry.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Perry.Infrastructure.Services;

public class EmailCodeService : IEmailCodeService
{
    private readonly AppDbContext _db;
    private static readonly TimeSpan Lifetime = TimeSpan.FromMinutes(10);

    public EmailCodeService(AppDbContext db)
    {
        _db = db;
    }

    public string GenerateCode(string email)
    {
        var key = NormalizeEmail(email);
        var purpose = ResolvePurpose(key);
        CleanupExpired(purpose, key);

        var active = _db.AuthTokens
            .Where(t => t.Purpose == purpose && t.LookupKey == key && t.UsedAtUtc == null)
            .ToList();
        foreach (var old in active)
            old.UsedAtUtc = DateTime.UtcNow;

        var code = Random.Shared.Next(100000, 999999).ToString();
        _db.AuthTokens.Add(new AuthToken
        {
            Id = Guid.NewGuid(),
            Purpose = purpose,
            LookupKey = key,
            Secret = code,
            CreatedAtUtc = DateTime.UtcNow,
            ExpiresAtUtc = DateTime.UtcNow.Add(Lifetime)
        });
        _db.SaveChanges();
        return code;
    }

    public bool Matches(string email, string code)
    {
        var key = NormalizeEmail(email);
        var purpose = ResolvePurpose(key);
        var normalized = NormalizeCode(code);
        if (string.IsNullOrEmpty(normalized))
            return false;

        var now = DateTime.UtcNow;
        return _db.AuthTokens.AsNoTracking().Any(t =>
            t.Purpose == purpose
            && t.LookupKey == key
            && t.UsedAtUtc == null
            && t.ExpiresAtUtc > now
            && t.Secret == normalized);
    }

    public bool TryVerify(string email, string code)
    {
        if (!Matches(email, code))
            return false;

        Invalidate(email);
        return true;
    }

    public void Invalidate(string email)
    {
        var key = NormalizeEmail(email);
        var purpose = ResolvePurpose(key);
        var now = DateTime.UtcNow;
        var rows = _db.AuthTokens
            .Where(t => t.Purpose == purpose && t.LookupKey == key && t.UsedAtUtc == null)
            .ToList();
        foreach (var row in rows)
            row.UsedAtUtc = now;
        if (rows.Count > 0)
            _db.SaveChanges();
    }

    public bool HasCode(string email)
    {
        var key = NormalizeEmail(email);
        var purpose = ResolvePurpose(key);
        var now = DateTime.UtcNow;
        return _db.AuthTokens.AsNoTracking().Any(t =>
            t.Purpose == purpose
            && t.LookupKey == key
            && t.UsedAtUtc == null
            && t.ExpiresAtUtc > now);
    }

    public string? PeekCode(string email)
    {
        var key = NormalizeEmail(email);
        var purpose = ResolvePurpose(key);
        var now = DateTime.UtcNow;
        return _db.AuthTokens.AsNoTracking()
            .Where(t =>
                t.Purpose == purpose
                && t.LookupKey == key
                && t.UsedAtUtc == null
                && t.ExpiresAtUtc > now)
            .OrderByDescending(t => t.CreatedAtUtc)
            .Select(t => t.Secret)
            .FirstOrDefault();
    }

    private void CleanupExpired(string purpose, string key)
    {
        var now = DateTime.UtcNow;
        var stale = _db.AuthTokens
            .Where(t =>
                t.Purpose == purpose
                && t.LookupKey == key
                && (t.ExpiresAtUtc <= now || t.UsedAtUtc != null))
            .ToList();
        if (stale.Count == 0)
            return;
        _db.AuthTokens.RemoveRange(stale);
        _db.SaveChanges();
    }

    /// <summary>
    /// AuthController кладёт в ключ "email-change:{userId}:{email}" —
    /// такие ключи идут в purpose email_change, остальное — email_verify.
    /// </summary>
    private static string ResolvePurpose(string key) =>
        key.StartsWith("email-change:", StringComparison.Ordinal)
            ? AuthTokenPurposes.EmailChange
            : AuthTokenPurposes.EmailVerify;

    private static string NormalizeEmail(string email) =>
        (email ?? string.Empty).Trim().ToLowerInvariant();

    private static string NormalizeCode(string code)
    {
        if (string.IsNullOrWhiteSpace(code))
            return string.Empty;
        return new string(code.Where(char.IsDigit).ToArray());
    }
}
