using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Perry.Api.Extensions;
using Perry.Infrastructure.Options;

namespace Perry.Tests;

public class JwtSecurityTests
{
    private const string Issuer = "perry-security-tests";
    private const string Audience = "perry-security-tests-client";

    // Test-only keys, not real application credentials.
    private const string SigningSecret =
        "perry-unit-test-signing-key-at-least-32-bytes-long";

    private const string WrongSigningSecret =
        "different-unit-test-signing-key-at-least-32-bytes-long";

    [Fact]
    public void Valid_signed_token_is_accepted()
    {
        var token = CreateToken(
            SigningSecret,
            DateTime.UtcNow.AddMinutes(-1),
            DateTime.UtcNow.AddMinutes(10));

        var principal = new JwtSecurityTokenHandler().ValidateToken(
            token,
            GetValidationParameters(),
            out var validatedToken);

        Assert.NotNull(validatedToken);
        Assert.True(principal.Identity?.IsAuthenticated);
    }

    [Fact]
    public void Token_with_wrong_signature_is_rejected()
    {
        var token = CreateToken(
            WrongSigningSecret,
            DateTime.UtcNow.AddMinutes(-1),
            DateTime.UtcNow.AddMinutes(10));

        Assert.ThrowsAny<SecurityTokenException>(() =>
            new JwtSecurityTokenHandler().ValidateToken(
                token,
                GetValidationParameters(),
                out _));
    }

    [Fact]
    public void Expired_token_is_rejected()
    {
        var token = CreateToken(
            SigningSecret,
            DateTime.UtcNow.AddMinutes(-20),
            DateTime.UtcNow.AddMinutes(-10));

        Assert.Throws<SecurityTokenExpiredException>(() =>
            new JwtSecurityTokenHandler().ValidateToken(
                token,
                GetValidationParameters(),
                out _));
    }

    [Fact]
    public void Production_rejects_signature_bypass()
    {
        var options = new JwtOptions
        {
            SkipSignatureValidation = true
        };

        var exception = Assert.Throws<InvalidOperationException>(
            () => options.ValidateProductionSettings(isDevelopment: false));

        Assert.Contains(
            "permitted only in Development",
            exception.Message);
    }

    [Theory]
    [InlineData(false, false)]
    [InlineData(false, true)]
    [InlineData(true, true)]
    public void Safe_environment_combinations_are_allowed(
        bool skipSignatureValidation,
        bool isDevelopment)
    {
        var options = new JwtOptions
        {
            SkipSignatureValidation = skipSignatureValidation
        };

        options.ValidateProductionSettings(isDevelopment);
    }

    private static TokenValidationParameters GetValidationParameters()
    {
        var services = new ServiceCollection();

        services.AddLogging();

        services.AddJwtAuthentication(new JwtOptions
        {
            Issuer = Issuer,
            Audience = Audience,
            SigningSecret = SigningSecret,
            SkipSignatureValidation = false
        });

        using var provider = services.BuildServiceProvider();

        var options = provider
            .GetRequiredService<IOptionsMonitor<JwtBearerOptions>>()
            .Get(JwtBearerDefaults.AuthenticationScheme);

        return options.TokenValidationParameters.Clone();
    }

    private static string CreateToken(
        string signingKey,
        DateTime notBefore,
        DateTime expires)
    {
        var credentials = new SigningCredentials(
            new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(signingKey)),
            SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: Issuer,
            audience: Audience,
            claims:
            [
                new Claim("sub", "perry-test-user")
            ],
            notBefore: notBefore,
            expires: expires,
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}