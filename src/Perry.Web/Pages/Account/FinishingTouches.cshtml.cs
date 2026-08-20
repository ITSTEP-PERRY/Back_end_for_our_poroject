using System.Text.Json;
using Perry.Infrastructure.Persistence;
using Perry.Infrastructure.Services;
using Perry.Web.Extensions;
using Perry.Web.Middleware;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;

namespace Perry.Web.Pages.Account;

/// <summary>Finishing touches — имя/фамилия после регистрации (макет perry-front).</summary>
public class FinishingTouchesModel : PageModel
{
    public const string SessionUserIdKey = "perry:pending_profile_user";

    private readonly AppDbContext _db;
    private readonly ICartService _cart;

    public FinishingTouchesModel(AppDbContext db, ICartService cart)
    {
        _db = db;
        _cart = cart;
    }

    [BindProperty]
    public string FirstName { get; set; } = string.Empty;

    [BindProperty]
    public string LastName { get; set; } = string.Empty;

    public bool FirstNameMissing { get; set; }
    public bool LastNameMissing { get; set; }

    public IActionResult OnGet()
    {
        var id = HttpContext.Session.GetString(SessionUserIdKey);
        if (string.IsNullOrEmpty(id) || !Guid.TryParse(id, out _))
            return RedirectToPage("/Account/Register");
        return Page();
    }

    public async Task<IActionResult> OnPostAsync(CancellationToken ct)
    {
        var idRaw = HttpContext.Session.GetString(SessionUserIdKey);
        if (string.IsNullOrEmpty(idRaw) || !Guid.TryParse(idRaw, out var userId))
            return RedirectToPage("/Account/Register");

        FirstNameMissing = string.IsNullOrWhiteSpace(FirstName);
        LastNameMissing = string.IsNullOrWhiteSpace(LastName);
        if (FirstNameMissing || LastNameMissing)
            return Page();

        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId, ct);
        if (user is null)
            return RedirectToPage("/Account/Register");

        user.Name = $"{FirstName.Trim()} {LastName.Trim()}".Trim();
        await _db.SaveChangesAsync(ct);

        var access = await _db.UserAccesses.AsNoTracking()
            .FirstOrDefaultAsync(a => a.UserId == userId, ct);
        if (access != null)
        {
            HttpContext.Session.SetString(AuthSessionMiddleware.SessionKey, JsonSerializer.Serialize(
                new UserAccessSessionDto
                {
                    UserId = user.Id,
                    UserName = user.Name,
                    Email = user.Email,
                    Login = access.Login,
                    RoleId = access.RoleId
                }));

            if (HttpContext.Request.Cookies.TryGetValue(HttpContextCartExtensions.GuestCookieName, out var sid)
                && !string.IsNullOrWhiteSpace(sid))
            {
                await _cart.MergeGuestToUserAsync(sid, user.Id, ct);
            }
        }

        HttpContext.Session.Remove(SessionUserIdKey);
        return RedirectToPage("/Account/AuthSuccess", new { kind = "register" });
    }
}
