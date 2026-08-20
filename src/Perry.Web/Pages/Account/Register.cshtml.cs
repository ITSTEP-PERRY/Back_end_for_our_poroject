using Perry.Domain.Entities;
using Perry.Infrastructure.Auth;
using Perry.Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;

namespace Perry.Web.Pages.Account;

/// <summary>Регистрация покупателя (роль Guest) — UI Create account (perry-front).</summary>
public class RegisterModel : PageModel
{
    private readonly AppDbContext _db;
    private readonly IKdfService _kdf;

    public RegisterModel(AppDbContext db, IKdfService kdf)
    {
        _db = db;
        _kdf = kdf;
    }

    [BindProperty] public string Email { get; set; } = string.Empty;
    [BindProperty] public string Password { get; set; } = string.Empty;
    [BindProperty] public string ConfirmPassword { get; set; } = string.Empty;
    public string? Error { get; set; }

    public void OnGet() { }

    public async Task<IActionResult> OnPostAsync(CancellationToken ct)
    {
        var email = Email?.Trim() ?? string.Empty;

        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(Password))
        {
            Error = "Заполните все поля.";
            return Page();
        }

        if (!email.Contains('@') || email.IndexOf('@') <= 0 || email.IndexOf('@') >= email.Length - 1)
        {
            Error = "Wrong or invalid email adress";
            return Page();
        }

        if (Password.Length < 8
            || !Password.Any(char.IsUpper)
            || !Password.Any(char.IsLower)
            || !Password.Any(char.IsDigit))
        {
            Error = "Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 digit, and be at least 8 characters long";
            return Page();
        }

        if (!string.Equals(Password, ConfirmPassword, StringComparison.Ordinal))
        {
            Error = "Passwords must match";
            return Page();
        }

        if (await _db.UserAccesses.AnyAsync(a => a.Login == email, ct)
            || await _db.Users.AnyAsync(u => u.Email == email, ct))
        {
            Error = "Этот email уже зарегистрирован.";
            return Page();
        }

        var at = email.IndexOf('@');
        var name = at > 0 ? email[..at] : email;
        if (string.IsNullOrWhiteSpace(name))
            name = email;

        var salt = Guid.NewGuid().ToString();
        var user = new User
        {
            Id = Guid.NewGuid(),
            Name = name,
            Email = email,
            RegisteredAtUtc = DateTime.UtcNow
        };
        _db.Users.Add(user);
        _db.UserAccesses.Add(new UserAccess
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            RoleId = "Guest",
            Login = email,
            Salt = salt,
            Dk = _kdf.Dk(Password, salt)
        });
        await _db.SaveChangesAsync(ct);

        HttpContext.Session.SetString(FinishingTouchesModel.SessionUserIdKey, user.Id.ToString());
        return RedirectToPage("/Account/FinishingTouches");
    }
}
