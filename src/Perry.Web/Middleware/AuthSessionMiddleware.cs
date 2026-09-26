using System.Security.Claims;
using System.Text.Json;

namespace Perry.Web.Middleware;

/// <summary>
/// Читает JSON-сессию Session["SignIn"] (UserAccessSessionDto) и строит ClaimsPrincipal.
/// ?logout=1 — выход. Источник пользователей — Perry Auth Service; DTO только для legacy session JSON.
/// </summary>
public class AuthSessionMiddleware
{
    public const string SessionKey = "SignIn";

    private readonly RequestDelegate _next;

    public AuthSessionMiddleware(RequestDelegate next) => _next = next;

    public async Task InvokeAsync(HttpContext context)
    {
        if (context.Request.Query.ContainsKey("logout"))
        {
            context.Session.Remove(SessionKey);
            var path = context.Request.Path.Value ?? string.Empty;
            context.Response.Redirect(
                path.StartsWith("/Admin", StringComparison.OrdinalIgnoreCase)
                    ? "/Admin/Login"
                    : "/");
            return;
        }

        var json = context.Session.GetString(SessionKey);
        if (!string.IsNullOrEmpty(json))
        {
            try
            {
                var access = JsonSerializer.Deserialize<UserAccessSessionDto>(json);
                if (access is not null)
                {
                    var claims = new List<Claim>
                    {
                        new(ClaimTypes.Name, access.UserName),
                        new(ClaimTypes.Email, access.Email),
                        new("Id", access.UserId.ToString()),
                        new(ClaimTypes.NameIdentifier, access.Login),
                        new(ClaimTypes.Role, access.RoleId)
                    };

                    context.User = new ClaimsPrincipal(
                        new ClaimsIdentity(claims, nameof(AuthSessionMiddleware)));
                }
            }
            catch
            {
                context.Session.Remove(SessionKey);
            }
        }

        await _next(context);
    }
}

/// <summary>Упрощённый DTO для сессии (без циклов навигации EF).</summary>
public class UserAccessSessionDto
{
    public Guid UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Login { get; set; } = string.Empty;
    public string RoleId { get; set; } = string.Empty;
}

public static class AuthSessionMiddlewareExtensions
{
    public static IApplicationBuilder UseAuthSession(this IApplicationBuilder app) =>
        app.UseMiddleware<AuthSessionMiddleware>();
}
