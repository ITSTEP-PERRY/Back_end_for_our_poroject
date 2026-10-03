using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Perry.Infrastructure.Options;

namespace Perry.Infrastructure.Services;

public interface IAuthInternalClient
{
    /// <summary>true, если в конфиге есть plaintext ServiceCredential (#97).</summary>
    bool IsConfigured { get; }

    Task<string?> GetServiceTokenAsync(CancellationToken ct = default);

    Task<AuthInternalUserDto?> GetUserAsync(Guid userId, CancellationToken ct = default);
}

/// <summary>
/// Service-to-service к Auth: POST /internal/auth/token → GET /internal/users/{id}.
/// Credential — только из env (AuthService__ServiceCredential), не из git.
/// </summary>
public sealed class AuthInternalClient : IAuthInternalClient
{
    private readonly HttpClient _http;
    private readonly AuthServiceOptions _opts;
    private readonly IMemoryCache _cache;
    private readonly ILogger<AuthInternalClient> _log;

    public AuthInternalClient(
        HttpClient http,
        IOptions<AuthServiceOptions> opts,
        IMemoryCache cache,
        ILogger<AuthInternalClient> log)
    {
        _http = http;
        _opts = opts.Value;
        _cache = cache;
        _log = log;
    }

    public bool IsConfigured => !string.IsNullOrWhiteSpace(_opts.ServiceCredential);

    public async Task<AuthInternalUserDto?> GetUserAsync(Guid userId, CancellationToken ct = default)
    {
        var token = await GetServiceTokenAsync(ct);
        if (token is null) return null;

        using var req = new HttpRequestMessage(HttpMethod.Get, $"internal/users/{userId:D}");
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        using var res = await _http.SendAsync(req, ct);
        if (!res.IsSuccessStatusCode)
        {
            _log.LogWarning("Auth internal users/{UserId} → {Status}", userId, (int)res.StatusCode);
            return null;
        }

        return await res.Content.ReadFromJsonAsync<AuthInternalUserDto>(cancellationToken: ct);
    }

    public async Task<string?> GetServiceTokenAsync(CancellationToken ct = default)
    {
        if (!IsConfigured)
        {
            _log.LogDebug("AuthService:ServiceCredential is empty — Internal API skipped");
            return null;
        }

        const string cacheKey = "auth:internal:token";
        if (_cache.TryGetValue(cacheKey, out string? cached) && !string.IsNullOrEmpty(cached))
            return cached;

        var body = new
        {
            serviceName = _opts.ServiceName,
            credential = _opts.ServiceCredential
        };

        using var res = await _http.PostAsJsonAsync("internal/auth/token", body, ct);
        if (!res.IsSuccessStatusCode)
        {
            _log.LogWarning("Auth internal token → {Status}", (int)res.StatusCode);
            return null;
        }

        var dto = await res.Content.ReadFromJsonAsync<InternalTokenResponse>(cancellationToken: ct);
        var access = dto?.AccessToken ?? dto?.AccessTokenSnake;
        if (string.IsNullOrEmpty(access)) return null;

        var ttl = TimeSpan.FromSeconds(Math.Max(60, (dto?.ExpiresIn ?? 3600) - 60));
        _cache.Set(cacheKey, access, ttl);
        return access;
    }

    private sealed class InternalTokenResponse
    {
        [JsonPropertyName("accessToken")]
        public string? AccessToken { get; set; }

        [JsonPropertyName("access_token")]
        public string? AccessTokenSnake { get; set; }

        [JsonPropertyName("expiresIn")]
        public int? ExpiresIn { get; set; }
    }
}

public sealed class AuthInternalUserDto
{
    [JsonPropertyName("id")]
    public Guid Id { get; set; }

    [JsonPropertyName("email")]
    public string? Email { get; set; }

    [JsonPropertyName("name")]
    public string? Name { get; set; }

    [JsonPropertyName("fullName")]
    public string? FullName { get; set; }

    [JsonPropertyName("firstName")]
    public string? FirstName { get; set; }

    [JsonPropertyName("lastName")]
    public string? LastName { get; set; }

    [JsonPropertyName("role")]
    public string? Role { get; set; }

    public string? DisplayName
    {
        get
        {
            var fromParts = string.Join(
                " ",
                new[] { FirstName, LastName }.Where(s => !string.IsNullOrWhiteSpace(s))).Trim();
            if (!string.IsNullOrWhiteSpace(fromParts)) return fromParts;
            if (!string.IsNullOrWhiteSpace(Name)) return Name;
            if (!string.IsNullOrWhiteSpace(FullName)) return FullName;
            return Email;
        }
    }
}
