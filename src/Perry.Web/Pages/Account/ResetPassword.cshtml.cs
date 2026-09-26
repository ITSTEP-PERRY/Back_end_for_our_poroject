using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace Perry.Web.Pages.Account;

/// <summary>Deprecated: сброс пароля через Perry Auth Service + React FE.</summary>
public class ResetPasswordModel : PageModel
{
    public const string StubMessage =
        "Сброс пароля перенесён в Perry Auth Service и React-приложение.";

    [BindProperty(SupportsGet = true)]
    public string Token { get; set; } = string.Empty;

    [BindProperty]
    public string NewPassword { get; set; } = string.Empty;

    [BindProperty]
    public string RepeatPassword { get; set; } = string.Empty;

    public string Notice { get; } = StubMessage;
    public bool PasswordEmpty { get; set; }
    public bool PasswordMismatch { get; set; }
    public bool PasswordWeak { get; set; }
    public string? Error { get; set; }

    public IActionResult OnGet() => Page();

    public IActionResult OnPost()
    {
        Error = StubMessage;
        return Page();
    }
}
