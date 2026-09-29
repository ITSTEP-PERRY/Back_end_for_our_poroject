using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using Perry.Infrastructure.Options;
using Perry.Infrastructure.Services;

namespace Perry.Api.Controllers;

/// <summary>
/// DEV-only: локальный Admin/Admin для React :3000 + диагностика стыка Auth Internal (#97).
/// Prod / Staging — 404.
/// </summary>
[ApiController]
[Route("api/dev")]
public sealed class DevAdminAuthController : ControllerBase
{
    /// <summary>Тот же Guid, что в DbSeeder для демо-админа.</summary>
    public static readonly Guid LocalAdminUserId = Guid.Parse("d78e94a9-cf1d-43f3-9ecd-643149b9e95a");

    private readonly IHostEnvironment _env;
    private readonly IConfiguration _configuration;
    private readonly IAuthInternalClient _authInternal;

    public DevAdminAuthController(
        IHostEnvironment env,
        IConfiguration configuration,
        IAuthInternalClient authInternal)
    {
        _env = env;
        _configuration = configuration;
        _authInternal = authInternal;
    }

    public sealed record DevLoginRequest(string? Login, string? Email, string? Password);

    [HttpPost("admin-login")]
    [AllowAnonymous]
    public IActionResult AdminLogin([FromBody] DevLoginRequest body)
    {
        if (!_env.IsDevelopment())
            return NotFound();

        var login = (body.Login ?? body.Email ?? "").Trim();
        var password = body.Password ?? "";
        if (!string.Equals(login, "Admin", StringComparison.Ordinal)
            || !string.Equals(password, "Admin", StringComparison.Ordinal))
        {
            return Unauthorized(new { message = "Invalid login or password." });
        }

        var jwt = ResolveJwt();
        if (string.IsNullOrWhiteSpace(jwt.SigningSecret) && !jwt.SkipSignatureValidation)
            return StatusCode(500, new { message = "Jwt signing secret is not configured." });

        var token = MintAdminToken(jwt);
        return Ok(new
        {
            accessToken = token,
            token,
            user = new
            {
                id = LocalAdminUserId,
                userId = LocalAdminUserId,
                name = "Admin",
                email = "admin@localhost",
                login = "Admin",
                role = "Admin",
                roleId = "Admin",
            }
        });
    }

    [HttpGet("me")]
    [Authorize]
    public IActionResult Me()
    {
        if (!_env.IsDevelopment())
            return NotFound();

        var id = User.FindFirstValue("sub")
                 ?? User.FindFirstValue(ClaimTypes.NameIdentifier)
                 ?? LocalAdminUserId.ToString();
        var role = User.FindFirstValue("role")
                   ?? User.FindFirstValue(ClaimTypes.Role)
                   ?? "Admin";
        var name = User.FindFirstValue("name") ?? "Admin";
        var email = User.FindFirstValue("email") ?? "admin@localhost";

        return Ok(new
        {
            id,
            userId = id,
            name,
            email,
            login = "Admin",
            role,
            roleId = role,
        });
    }

    /// <summary>
    /// Диагностика #97 без утечки секрета: есть ли credential и получается ли Internal token.
    /// </summary>
    [HttpGet("auth-internal-status")]
    [AllowAnonymous]
    public async Task<IActionResult> AuthInternalStatus(CancellationToken ct)
    {
        if (!_env.IsDevelopment())
            return NotFound();

        var baseUrl = _configuration["AuthService:BaseUrl"] ?? "";
        var serviceName = _configuration["AuthService:ServiceName"] ?? "local-service";
        var configured = _authInternal.IsConfigured;
        string? tokenProbe = null;
        string? error = null;
        if (configured)
        {
            try
            {
                tokenProbe = await _authInternal.GetServiceTokenAsync(ct);
            }
            catch (Exception ex)
            {
                error = ex.Message;
            }
        }

        return Ok(new
        {
            authBaseUrl = baseUrl,
            serviceName,
            credentialConfigured = configured,
            tokenOk = !string.IsNullOrEmpty(tokenProbe),
            hint = configured
                ? (tokenProbe is null
                    ? "Credential задан, но /internal/auth/token не ответил 200 — сверьте имя сервиса и plaintext с Владом (#97)."
                    : "Internal token OK.")
                : "Впишите AuthService__ServiceCredential в локальный .env (plaintext от Влада, #97).",
            error
        });
    }

    private JwtOptions ResolveJwt()
    {
        var jwt = _configuration.GetSection("Jwt").Get<JwtOptions>() ?? new JwtOptions();
        if (string.IsNullOrWhiteSpace(jwt.SigningSecret))
            jwt.SigningSecret = _configuration["Jwt:Key"] ?? string.Empty;
        if (string.IsNullOrWhiteSpace(jwt.Issuer))
            jwt.Issuer = _configuration["Jwt:Issuer"] ?? "Perry.AuthService";
        if (string.IsNullOrWhiteSpace(jwt.Audience))
            jwt.Audience = _configuration["Jwt:Audience"] ?? "Perry.Client";
        return jwt;
    }

    private static string MintAdminToken(JwtOptions jwt)
    {
        var claims = new List<Claim>
        {
            new("sub", LocalAdminUserId.ToString()),
            new("role", "Admin"),
            new("name", "Admin"),
            new("email", "admin@localhost"),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString("N")),
        };

        var keyBytes = Encoding.UTF8.GetBytes(
            string.IsNullOrWhiteSpace(jwt.SigningSecret)
                ? "dev-placeholder-not-used-when-skip-signature"
                : jwt.SigningSecret);
        var creds = new SigningCredentials(
            new SymmetricSecurityKey(keyBytes),
            SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: jwt.Issuer,
            audience: jwt.Audience,
            claims: claims,
            notBefore: DateTime.UtcNow,
            expires: DateTime.UtcNow.AddHours(12),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
