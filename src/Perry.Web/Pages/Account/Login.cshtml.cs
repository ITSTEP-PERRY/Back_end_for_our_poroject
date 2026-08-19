using System.Text.Json;
using Perry.Domain.Entities;
using Perry.Infrastructure.Auth;
using Perry.Infrastructure.Persistence;
using Perry.Infrastructure.Services;
using Perry.Web.Extensions;
using Perry.Web.Middleware;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

namespace Perry.Web.Pages.Account;

/// <summary>Вход покупателя (и админа). После 3 неудачных попыток — верификация по коду на email.</summary>
public class LoginModel : PageModel
{
    private readonly AppDbContext _db;
    private readonly IKdfService _kdf;
    private readonly ICartService _cart;
    private readonly IEmailCodeService _emailCode;
    private readonly IEmailSender _emailSender;
    private readonly IMemoryCache _cache;
    private readonly ILogger<LoginModel> _logger;

    public LoginModel(
        AppDbContext db,
        IKdfService kdf,
        ICartService cart,
        IEmailCodeService emailCode,
        IEmailSender emailSender,
        IMemoryCache cache,
        ILogger<LoginModel> logger)
    {
        _db = db;
        _kdf = kdf;
        _cart = cart;
        _emailCode = emailCode;
        _emailSender = emailSender;
        _cache = cache;
        _logger = logger;
    }

    [BindProperty]
    public string Login { get; set; } = string.Empty;

    [BindProperty]
    public string Password { get; set; } = string.Empty;

    [BindProperty(SupportsGet = true)]
    public string? ReturnUrl { get; set; }

    public string? Error { get; set; }

    /// <summary>
    /// После 3 неудач — URL страницы кода. Редирект делаем и через HTTP 303, и через JS
    /// (встроенный браузер Cursor иногда игнорирует Location после POST).
    /// </summary>
    public string? VerifyRedirectUrl { get; set; }

    public void OnGet()
    {
    }

    public async Task<IActionResult> OnPostAsync(CancellationToken ct)
    {
        var login = (Login ?? string.Empty).Trim();
        Login = login;

        var access = await _db.UserAccesses
            .AsNoTracking()
            .Include(a => a.User)
            .FirstOrDefaultAsync(a => a.Login == login || a.User.Email == login, ct);

        if (access is null || access.User.DeletedAtUtc != null
            || !string.Equals(_kdf.Dk(Password, access.Salt), access.Dk, StringComparison.OrdinalIgnoreCase))
        {
            return await HandleFailedAttemptAsync(login, access, ct);
        }

        ClearAttempts(login);
        await SignInAsync(access, ct);

        if (access.RoleId == "Admin" && string.IsNullOrEmpty(ReturnUrl))
            return RedirectToPage("/Admin/Index");

        if (!string.IsNullOrEmpty(ReturnUrl) && Url.IsLocalUrl(ReturnUrl))
            return Redirect(ReturnUrl);

        return RedirectToPage("/Index");
    }

    private async Task<IActionResult> HandleFailedAttemptAsync(
        string login,
        UserAccess? access,
        CancellationToken ct)
    {
        var attempts = IncrementAttempts(login);
        _logger.LogWarning("Login failed for {Login}, attempt {Attempt}/3", login, attempts);

        if (attempts < 3)
        {
            Error = $"Неверный логин или пароль. (попытка {attempts}/3)";
            return Page();
        }

        ClearAttempts(login);

        var emailToVerify = access?.User.Email;
        if (string.IsNullOrWhiteSpace(emailToVerify))
        {
            var loginLower = login.ToLowerInvariant();
            var known = await _db.Users.AsNoTracking()
                .FirstOrDefaultAsync(
                    u => u.Email.ToLower() == loginLower
                         || _db.UserAccesses.Any(a => a.UserId == u.Id && a.Login.ToLower() == loginLower),
                    ct);
            emailToVerify = known?.Email;
        }

        if (string.IsNullOrWhiteSpace(emailToVerify) && login.Contains('@'))
            emailToVerify = login;

        if (string.IsNullOrWhiteSpace(emailToVerify))
        {
            Error = "Неверный логин или пароль.";
            return Page();
        }

        var code = _emailCode.GenerateCode(emailToVerify);
        await _emailSender.SendEmailAsync(
            emailToVerify,
            "Perry verification code",
            $"Your verification code: {code}",
            ct);

        VerifyRedirectUrl = Url.Page(
            "/Account/VerifyCode",
            values: new { email = emailToVerify, returnUrl = ReturnUrl });

        _logger.LogWarning("Redirecting {Login} to VerifyCode → {Url}", login, VerifyRedirectUrl);

        // 200 + JS redirect: надёжнее HTTP-редиректа после POST во встроенном браузере Cursor.
        return Page();
    }

    private int IncrementAttempts(string login)
    {
        var key = AttemptKey(login);
        var attempts = (_cache.TryGetValue(key, out int n) ? n : 0) + 1;
        _cache.Set(key, attempts, TimeSpan.FromMinutes(30));
        HttpContext.Session.SetInt32(key, attempts);
        return attempts;
    }

    private void ClearAttempts(string login)
    {
        var key = AttemptKey(login);
        _cache.Remove(key);
        HttpContext.Session.Remove(key);
    }

    private static string AttemptKey(string login) =>
        "perry:login_attempts:" + (login ?? string.Empty).Trim().ToLowerInvariant();

    private async Task SignInAsync(UserAccess access, CancellationToken ct)
    {
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
    }
}
