using Perry.Infrastructure.Persistence;
using Perry.Infrastructure.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;

namespace Perry.Web.Pages.Account;

/// <summary>Forgot password — ввод email для сброса пароля (макет perry-front).</summary>
public class ForgotPasswordModel : PageModel
{
    private readonly AppDbContext _db;
    private readonly IPasswordResetService _reset;
    private readonly IEmailSender _emailSender;
    private readonly IConfiguration _configuration;

    public ForgotPasswordModel(
        AppDbContext db,
        IPasswordResetService reset,
        IEmailSender emailSender,
        IConfiguration configuration)
    {
        _db = db;
        _reset = reset;
        _emailSender = emailSender;
        _configuration = configuration;
    }

    [BindProperty]
    public string Email { get; set; } = string.Empty;

    public bool EmailInvalid { get; set; }

    public string? DevResetHint { get; set; }

    public void OnGet() { }

    public async Task<IActionResult> OnPostAsync(CancellationToken ct)
    {
        var email = (Email ?? string.Empty).Trim();
        Email = email;

        if (string.IsNullOrWhiteSpace(email)
            || !email.Contains('@')
            || email.IndexOf('@') <= 0
            || email.IndexOf('@') >= email.Length - 1)
        {
            EmailInvalid = true;
            return Page();
        }

        var user = await _db.Users.AsNoTracking()
            .FirstOrDefaultAsync(u => u.Email == email && u.DeletedAtUtc == null, ct);

        if (user is null)
        {
            // По макету — ошибка на поле email
            EmailInvalid = true;
            return Page();
        }

        var token = _reset.CreateToken(user.Email);
        var resetUrl =
            $"{Request.Scheme}://{Request.Host}{Url.Page("/Account/ResetPassword", new { token })}";

        await _emailSender.SendEmailAsync(
            user.Email,
            "Perry password reset",
            $"Reset your password: {resetUrl}",
            ct);

        if (_configuration.GetValue("Smtp:UseStub", true))
            DevResetHint = resetUrl;

        // В stub сразу ведём на Reset; ссылка также в письме/логе
        return RedirectToPage("/Account/ResetPassword", new { token });
    }
}
