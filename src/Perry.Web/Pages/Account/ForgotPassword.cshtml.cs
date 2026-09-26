using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace Perry.Web.Pages.Account;

/// <summary>Deprecated: сброс пароля через Perry Auth Service + React FE.</summary>
public class ForgotPasswordModel : PageModel
{
    public const string StubMessage =
        "Восстановление пароля перенесено в Perry Auth Service и React-приложение.";

    [BindProperty]
    public string Email { get; set; } = string.Empty;

    public string Notice { get; } = StubMessage;
    public bool EmailInvalid { get; set; }
    public bool Submitted { get; set; }
    public string? DevResetHint { get; set; }

    public void OnGet() { }

    public IActionResult OnPost()
    {
        Submitted = true;
        return Page();
    }
}
