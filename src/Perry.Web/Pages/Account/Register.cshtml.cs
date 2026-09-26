using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace Perry.Web.Pages.Account;

/// <summary>Deprecated: регистрация через Perry Auth Service + React FE.</summary>
public class RegisterModel : PageModel
{
    public const string StubMessage =
        "Регистрация перенесена в Perry Auth Service и React-приложение.";

    [BindProperty] public string Email { get; set; } = string.Empty;
    [BindProperty] public string Password { get; set; } = string.Empty;
    [BindProperty] public string ConfirmPassword { get; set; } = string.Empty;

    public string Notice { get; } = StubMessage;
    public string? Error { get; set; }

    public void OnGet() { }

    public IActionResult OnPost()
    {
        Error = StubMessage;
        return Page();
    }
}
