using System.IdentityModel.Tokens.Jwt;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Perry.Infrastructure.Options;

namespace Perry.Api.Extensions;

public static class JwtAuthenticationService
{
    public static IServiceCollection AddJwtAuthentication(this IServiceCollection services, JwtOptions jwtOptions)
    {
        services.AddAuthentication(opts =>
            {
                opts.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                opts.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
                opts.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            })
            .AddJwtBearer(opts =>
            {
                opts.SaveToken = true;
                // Auth JWT uses short claim names ("role", "sub"). Default remapping
                // breaks [Authorize(Roles=...)] when RoleClaimType is "role".
                opts.MapInboundClaims = false;

                var parameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidIssuer = jwtOptions.Issuer,
                    ValidateAudience = true,
                    ValidAudience = jwtOptions.Audience,
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.FromMinutes(2),
                    NameClaimType = string.IsNullOrWhiteSpace(jwtOptions.NameClaimType)
                        ? JwtRegisteredClaimNames.Sub
                        : jwtOptions.NameClaimType,
                    RoleClaimType = string.IsNullOrWhiteSpace(jwtOptions.RoleClaimType)
                        ? "role"
                        : jwtOptions.RoleClaimType,
                };

                if (jwtOptions.SkipSignatureValidation)
                {
                    // Local DEV until #95 shared secret/JWKS.
                    // JwtBearer 8 uses JsonWebTokenHandler by default — SignatureValidator
                    // is ignored there; force the classic handler + unsigned accept.
                    parameters.ValidateIssuerSigningKey = false;
                    parameters.RequireSignedTokens = false;
                    parameters.SignatureValidator = (token, _) => new JwtSecurityToken(token);
                    opts.UseSecurityTokenValidators = true;
                }
                else
                {
                    parameters.ValidateIssuerSigningKey = true;
                    parameters.IssuerSigningKey = new SymmetricSecurityKey(
                        Encoding.UTF8.GetBytes(jwtOptions.SigningSecret));
                    parameters.ValidAlgorithms = [SecurityAlgorithms.HmacSha256];
                }

                opts.TokenValidationParameters = parameters;

                opts.Events = new JwtBearerEvents
                {
                    OnAuthenticationFailed = ctx =>
                    {
                        var logger = ctx.HttpContext.RequestServices
                            .GetRequiredService<ILoggerFactory>()
                            .CreateLogger("JwtAuth");
                        logger.LogWarning(ctx.Exception, "JWT auth failed: {Message}", ctx.Exception.Message);
                        return Task.CompletedTask;
                    }
                };
            });
        return services;
    }
}
