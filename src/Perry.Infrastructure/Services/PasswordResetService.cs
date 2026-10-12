using Perry.Domain.Entities;
using Perry.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Perry.Infrastructure.Services;

public class PasswordResetService : IPasswordResetService
{
    private readonly AppDbContext _db;
    private static readonly TimeSpan Lifetime = TimeSpan.FromMinutes(30);

    public PasswordResetService(AppDbContext db)
    {
        _db = db;
    }

    public string CreateToken(string email)
    {
        var normalizedEmail = email.Trim().ToLowerInvariant();
        InvalidateActiveForEmail(normalizedEmail);
        CleanupStale();

        var token = Convert.ToHexString(Guid.NewGuid().ToByteArray())
            + Convert.ToHexString(Guid.NewGuid().ToByteArray());

        _db.AuthTokens.Add(new AuthToken
        {
            Id = Guid.NewGuid(),
            Purpose = AuthTokenPurposes.PasswordReset,
            LookupKey = token,
            Secret = normalizedEmail,
            CreatedAtUtc = DateTime.UtcNow,
            ExpiresAtUtc = DateTime.UtcNow.Add(Lifetime)
        });
        _db.SaveChanges();
        return token;
    }

    public string? GetEmail(string token)
    {
        if (string.IsNullOrWhiteSpace(token))
            return null;

        var now = DateTime.UtcNow;
        return _db.AuthTokens.AsNoTracking()
            .Where(t =>
                t.Purpose == AuthTokenPurposes.PasswordReset
                && t.LookupKey == token
                && t.UsedAtUtc == null
                && t.ExpiresAtUtc > now)
            .Select(t => t.Secret)
            .FirstOrDefault();
    }

    public void Invalidate(string token)
    {
        if (string.IsNullOrWhiteSpace(token))
            return;

        var row = _db.AuthTokens.FirstOrDefault(t =>
            t.Purpose == AuthTokenPurposes.PasswordReset
            && t.LookupKey == token
            && t.UsedAtUtc == null);
        if (row is null)
            return;

        row.UsedAtUtc = DateTime.UtcNow;
        _db.SaveChanges();
    }

    private void InvalidateActiveForEmail(string normalizedEmail)
    {
        var now = DateTime.UtcNow;
        var active = _db.AuthTokens
            .Where(t =>
                t.Purpose == AuthTokenPurposes.PasswordReset
                && t.Secret == normalizedEmail
                && t.UsedAtUtc == null)
            .ToList();
        foreach (var row in active)
            row.UsedAtUtc = now;
        if (active.Count > 0)
            _db.SaveChanges();
    }

    private void CleanupStale()
    {
        var now = DateTime.UtcNow;
        var stale = _db.AuthTokens
            .Where(t =>
                t.Purpose == AuthTokenPurposes.PasswordReset
                && (t.ExpiresAtUtc <= now || t.UsedAtUtc != null))
            .Take(100)
            .ToList();
        if (stale.Count == 0)
            return;
        _db.AuthTokens.RemoveRange(stale);
        _db.SaveChanges();
    }
}
