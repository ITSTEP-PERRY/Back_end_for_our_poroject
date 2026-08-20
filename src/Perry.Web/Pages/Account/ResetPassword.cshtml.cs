using Perry.Infrastructure.Auth;
using Perry.Infrastructure.Persistence;
using Perry.Infrastructure.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;

namespace Perry.Web.Pages.Account;

/// <summary>Reset password — новый пароль после Forgot password.</summary>
public class ResetPasswordModel : PageModel
{
    private readonly AppDbContext _db;
    private readonly IKdfService _kdf;
    private readonly IPasswordResetService _reset;

    public ResetPasswordModel(AppDbContext db, IKdfService kdf, IPasswordResetService reset)
    {
        _db = db;
        _kdf = kdf;
        _reset = reset;
    }

    [BindProperty(SupportsGet = true)]
    public string Token { get; set; } = string.Empty;

    [BindProperty]
    public string NewPassword { get; set; } = string.Empty;

    [BindProperty]
    public string RepeatPassword { get; set; } = string.Empty;

    public bool PasswordEmpty { get; set; }
    public bool PasswordMismatch { get; set; }
    public bool PasswordWeak { get; set; }
    public string? Error { get; set; }

    public IActionResult OnGet()
    {
        if (string.IsNullOrWhiteSpace(Token) || _reset.GetEmail(Token) is null)
            return RedirectToPage("/Account/ForgotPassword");
        return Page();
    }

    public async Task<IActionResult> OnPostAsync(CancellationToken ct)
    {
        var email = _reset.GetEmail(Token);
        if (email is null)
            return RedirectToPage("/Account/ForgotPassword");

        PasswordEmpty = string.IsNullOrWhiteSpace(NewPassword);
        PasswordMismatch = !string.Equals(NewPassword, RepeatPassword, StringComparison.Ordinal);
        PasswordWeak = !PasswordEmpty && (NewPassword.Length < 8
            || !NewPassword.Any(char.IsUpper)
            || !NewPassword.Any(char.IsLower)
            || !NewPassword.Any(char.IsDigit));

        if (PasswordEmpty || PasswordMismatch || PasswordWeak)
            return Page();

        var access = await _db.UserAccesses
            .Include(a => a.User)
            .FirstOrDefaultAsync(a => a.Login == email || a.User.Email == email, ct);

        if (access is null || access.User.DeletedAtUtc != null)
        {
            Error = "Account not found.";
            return Page();
        }

        var salt = Guid.NewGuid().ToString();
        access.Salt = salt;
        access.Dk = _kdf.Dk(NewPassword, salt);
        await _db.SaveChangesAsync(ct);

        _reset.Invalidate(Token);

        return RedirectToPage("/Account/AuthSuccess", new { kind = "reset" });
    }
}
