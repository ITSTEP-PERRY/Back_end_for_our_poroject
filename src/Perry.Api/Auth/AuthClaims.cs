using System.Security.Claims;

namespace Perry.Api.Auth;

/// <summary>
/// Чтение claims из JWT Auth Service (#94/#95/#98).
/// Толерантно к именам claims — сузим после сверки живого payload с Владом.
/// </summary>
public static class AuthClaims
{
    public static Guid? GetUserId(ClaimsPrincipal user)
    {
        var raw =
            user.FindFirstValue("sub")
            ?? user.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? user.FindFirstValue("userId")
            ?? user.FindFirstValue("uid")
            ?? user.FindFirstValue("id");
        return Guid.TryParse(raw, out var id) ? id : null;
    }

    public static string? GetDisplayName(ClaimsPrincipal user)
    {
        var name =
            user.FindFirstValue("name")
            ?? user.FindFirstValue("fullName")
            ?? user.FindFirstValue(ClaimTypes.Name)
            ?? user.FindFirstValue("unique_name")
            ?? user.Identity?.Name;
        return string.IsNullOrWhiteSpace(name) ? null : name.Trim();
    }

    public static string? GetEmail(ClaimsPrincipal user)
    {
        var email =
            user.FindFirstValue("email")
            ?? user.FindFirstValue(ClaimTypes.Email)
            ?? user.FindFirstValue("preferred_username");
        return string.IsNullOrWhiteSpace(email) ? null : email.Trim();
    }

    public static string? GetRole(ClaimsPrincipal user)
    {
        var role =
            user.FindFirstValue("role")
            ?? user.FindFirstValue(ClaimTypes.Role)
            ?? user.FindFirstValue("roles");
        return string.IsNullOrWhiteSpace(role) ? null : role.Trim();
    }
}
