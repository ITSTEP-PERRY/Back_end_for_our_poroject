using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace Perry.Web.Pages.Account;

/// <summary>Deprecated: вход через Perry Auth Service + React FE.</summary>
public class LoginModel : PageModel
{
    public const string StubMessage =
        "Авторизация перенесена в Perry Auth Service и React-приложение. Эта страница больше не выполняет вход.";

    [BindProperty]
    public string Login { get; set; } = string.Empty;

    [BindProperty]
    public string Password { get; set; } = string.Empty;

    [BindProperty(SupportsGet = true)]
    public string? ReturnUrl { get; set; }

    public string Notice { get; } = StubMessage;

    public string? Error { get; set; }

    public string? VerifyRedirectUrl { get; set; }

    public void OnGet()
    {
    }

    public IActionResult OnPost()
    {
        Error = StubMessage;
        return Page();
    }
}
