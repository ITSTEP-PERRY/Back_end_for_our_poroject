using Microsoft.Extensions.Caching.Memory;

namespace Perry.Infrastructure.Services;

public class EmailCodeService : IEmailCodeService
{
    private readonly IMemoryCache _cache;
    private const string Prefix = "perry:verify:";
    private static readonly TimeSpan Lifetime = TimeSpan.FromMinutes(10);

    public EmailCodeService(IMemoryCache cache)
    {
        _cache = cache;
    }

    public string GenerateCode(string email)
    {
        var key = Prefix + NormalizeEmail(email);
        var code = Random.Shared.Next(100000, 999999).ToString();
        _cache.Set(key, code, Lifetime);
        return code;
    }

    public bool Matches(string email, string code)
    {
        var key = Prefix + NormalizeEmail(email);
        var normalized = NormalizeCode(code);
        return _cache.TryGetValue(key, out var stored)
            && stored is string storedCode
            && string.Equals(storedCode, normalized, StringComparison.Ordinal);
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
        _cache.Remove(Prefix + NormalizeEmail(email));
    }

    public bool HasCode(string email)
    {
        var key = Prefix + NormalizeEmail(email);
        return _cache.TryGetValue(key, out _);
    }

    public string? PeekCode(string email)
    {
        var key = Prefix + NormalizeEmail(email);
        return _cache.TryGetValue(key, out var stored) && stored is string code ? code : null;
    }

    private static string NormalizeEmail(string email) =>
        (email ?? string.Empty).Trim().ToLowerInvariant();

    private static string NormalizeCode(string code)
    {
        if (string.IsNullOrWhiteSpace(code))
            return string.Empty;
        return new string(code.Where(char.IsDigit).ToArray());
    }
}
