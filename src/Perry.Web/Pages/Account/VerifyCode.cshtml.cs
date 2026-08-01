using System.Text.Json;
using Perry.Infrastructure.Persistence;
using Perry.Infrastructure.Services;
using Perry.Web.Extensions;
using Perry.Web.Middleware;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;

namespace Perry.Web.Pages.Account;

/// <summary>Ввод 6-значного кода подтверждения email после 3 неудачных попыток входа.</summary>
public class VerifyCodeModel : PageModel
{
    private readonly AppDbContext _db;
    private readonly ICartService _cart;
    private readonly IEmailCodeService _emailCode;
    private readonly IEmailSender _emailSender;
    private readonly IConfiguration _configuration;

    public VerifyCodeModel(
        AppDbContext db,
        ICartService cart,
        IEmailCodeService emailCode,
        IEmailSender emailSender,
        IConfiguration configuration)
    {
        _db = db;
        _cart = cart;
        _emailCode = emailCode;
        _emailSender = emailSender;
        _configuration = configuration;
    }

    [BindProperty(SupportsGet = true)]
    public string Email { get; set; } = string.Empty;

    [BindProperty(SupportsGet = true)]
    public string? ReturnUrl { get; set; }

    [BindProperty]
    public string Code { get; set; } = string.Empty;

    public string? Error { get; set; }

    /// <summary>Для заглушки SMTP показываем код на странице.</summary>
    public string? DevCodeHint { get; set; }

    public IActionResult OnGet()
    {
        if (string.IsNullOrWhiteSpace(Email))
            return RedirectToPage("/Account/Login");

        RefreshDevHint();
        return Page();
    }

    public async Task<IActionResult> OnPostAsync(CancellationToken ct)
    {
        Email = (Email ?? string.Empty).Trim();
        var digits = NormalizeDigits(Code);

        RefreshDevHint();

        if (string.IsNullOrWhiteSpace(Email) || digits.Length != 6)
        {
            Error = "Incorrect code, try again";
            return Page();
        }

        if (!_emailCode.Matches(Email, digits))
        {
            Error = "Incorrect code, try again";
            RefreshDevHint();
            return Page();
        }

        var access = await _db.UserAccesses
            .AsNoTracking()
            .Include(a => a.User)
            .FirstOrDefaultAsync(a => a.Login == Email || a.User.Email == Email, ct);

        if (access is null || access.User.DeletedAtUtc != null)
        {
            Error = "Account not found for this email";
            return Page();
        }

        _emailCode.Invalidate(Email);

        HttpContext.Session.SetString(AuthSessionMiddleware.SessionKey, JsonSerializer.Serialize(
            new UserAccessSessionDto
            {
                UserId = access.UserId,
                UserName = access.User.Name,
                Email = access.User.Email,
                Login = access.Login,
                RoleId = access.RoleId
            }));

        if (HttpContext.Request.Cookies.TryGetValue(HttpContextCartExtensions.GuestCookieName, out var sid)
            && !string.IsNullOrWhiteSpace(sid))
        {
            await _cart.MergeGuestToUserAsync(sid, access.UserId, ct);
        }

        if (access.RoleId == "Admin" && string.IsNullOrEmpty(ReturnUrl))
            return RedirectToPage("/Admin/Index");

        if (!string.IsNullOrEmpty(ReturnUrl) && Url.IsLocalUrl(ReturnUrl))
            return Redirect(ReturnUrl);

        return RedirectToPage("/Index");
    }

    public async Task<IActionResult> OnPostResendAsync(CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(Email))
            return RedirectToPage("/Account/Login");

        var code = _emailCode.GenerateCode(Email);
        await _emailSender.SendEmailAsync(
            Email,
            "Perry verification code",
            $"Your verification code: {code}",
            ct);

        RefreshDevHint();
        return Page();
    }

    private void RefreshDevHint()
    {
        if (_configuration.GetValue("Smtp:UseStub", true))
            DevCodeHint = _emailCode.PeekCode(Email);
    }

    private static string NormalizeDigits(string? value) =>
        string.IsNullOrWhiteSpace(value)
            ? string.Empty
            : new string(value.Where(char.IsDigit).ToArray());
}
