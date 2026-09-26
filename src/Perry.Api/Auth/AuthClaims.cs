using System.Security.Claims;

namespace Perry.Api.Auth;

/// <summary>
/// Чтение claims из JWT Auth Service (#94/#95).
/// Пока поддерживаем распространённые варианты; точный контракт — карточка #95 у Влада.
/// </summary>
public static class AuthClaims
{
    public static Guid? GetUserId(ClaimsPrincipal user)
    {
        var raw =
            user.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? user.FindFirstValue("sub")
            ?? user.FindFirstValue("userId")
            ?? user.FindFirstValue("uid");
        return Guid.TryParse(raw, out var id) ? id : null;
    }

    public static string? GetDisplayName(ClaimsPrincipal user)
    {
        var name =
            user.FindFirstValue("name")
            ?? user.FindFirstValue(ClaimTypes.Name)
            ?? user.FindFirstValue("unique_name")
            ?? user.Identity?.Name;
        return string.IsNullOrWhiteSpace(name) ? null : name.Trim();
    }

    public static string? GetEmail(ClaimsPrincipal user)
    {
        var email =
            user.FindFirstValue(ClaimTypes.Email)
            ?? user.FindFirstValue("email")
            ?? user.FindFirstValue("preferred_username");
        return string.IsNullOrWhiteSpace(email) ? null : email.Trim();
    }
}
