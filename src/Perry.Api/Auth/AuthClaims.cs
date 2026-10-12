using System.Security.Claims;

namespace Perry.Api.Auth;

/// <summary>
/// Чтение claims из JWT Auth Service (#94/#95/#98).
/// Auth access-token часто содержит только sub/email/role — без name.
/// NameClaimType по умолчанию = sub, поэтому Identity.Name = UUID и нельзя
/// использовать его как display name в отзывах.
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
        var first =
            user.FindFirstValue("firstName")
            ?? user.FindFirstValue("given_name")
            ?? user.FindFirstValue("givenName");
        var last =
            user.FindFirstValue("lastName")
            ?? user.FindFirstValue("family_name")
            ?? user.FindFirstValue("familyName");
        var fromParts = string.Join(
            " ",
            new[] { first, last }.Where(s => !string.IsNullOrWhiteSpace(s))).Trim();
        if (!string.IsNullOrWhiteSpace(fromParts))
            return fromParts;

        foreach (var candidate in new[]
                 {
                     user.FindFirstValue("name"),
                     user.FindFirstValue("fullName"),
                     user.FindFirstValue("unique_name"),
                     user.FindFirstValue(ClaimTypes.Name),
                     user.Identity?.Name,
                 })
        {
            if (IsUsableDisplayName(candidate))
                return candidate!.Trim();
        }

        return null;
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

    /// <summary>
    /// Reject empty values, bare user-id GUIDs (NameClaimType=sub), and emails —
    /// reviews should show a person name, not a mailbox.
    /// </summary>
    public static bool IsUsableDisplayName(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return false;
        var trimmed = value.Trim();
        if (Guid.TryParse(trimmed, out _)) return false;
        if (trimmed.Contains('@')) return false;
        return true;
    }
}
