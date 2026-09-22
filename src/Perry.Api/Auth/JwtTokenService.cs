using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace Perry.Api.Auth;

[Obsolete("Deprecated; use JwtAuthenticationService instead")]
public interface IJwtTokenService
{
    string CreateToken(Guid userId, string login, string name, string email, string roleId);
}
[Obsolete("Deprecated; use JwtAuthenticationService instead")]
public class JwtTokenService : IJwtTokenService
{
    private readonly IConfiguration _config;

    public JwtTokenService(IConfiguration config) => _config = config;

    public string CreateToken(Guid userId, string login, string name, string email, string roleId)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(
            _config["Jwt:Key"] ?? "PerryDevSecretKey_ChangeMe_32chars!!"));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expires = DateTime.UtcNow.AddDays(7);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, userId.ToString()),
            new(ClaimTypes.NameIdentifier, userId.ToString()),
            new(ClaimTypes.Name, name),
            new(ClaimTypes.Email, email),
            new("login", login),
            new(ClaimTypes.Role, roleId)
        };

        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"] ?? "Perry",
            audience: _config["Jwt:Audience"] ?? "Perry",
            claims: claims,
            expires: expires,
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
