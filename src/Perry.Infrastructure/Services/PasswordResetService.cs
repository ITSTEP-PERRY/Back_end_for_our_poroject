using Microsoft.Extensions.Caching.Memory;

namespace Perry.Infrastructure.Services;

public class PasswordResetService : IPasswordResetService
{
    private readonly IMemoryCache _cache;
    private const string Prefix = "perry:pwdreset:";
    private static readonly TimeSpan Lifetime = TimeSpan.FromMinutes(30);

    public PasswordResetService(IMemoryCache cache)
    {
        _cache = cache;
    }

    public string CreateToken(string email)
    {
        var token = Convert.ToHexString(Guid.NewGuid().ToByteArray())
            + Convert.ToHexString(Guid.NewGuid().ToByteArray());
        var key = Prefix + token;
        _cache.Set(key, email.Trim().ToLowerInvariant(), Lifetime);
        return token;
    }

    public string? GetEmail(string token)
    {
        if (string.IsNullOrWhiteSpace(token))
            return null;
        return _cache.TryGetValue(Prefix + token, out var stored) && stored is string email
            ? email
            : null;
    }

    public void Invalidate(string token)
    {
        if (!string.IsNullOrWhiteSpace(token))
            _cache.Remove(Prefix + token);
    }
}
