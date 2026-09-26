using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace Perry.Web.Pages.Account;

/// <summary>Deprecated: верификация через Perry Auth Service + React FE.</summary>
public class VerifyCodeModel : PageModel
{
    public const string StubMessage =
        "Подтверждение email перенесено в Perry Auth Service и React-приложение.";

    [BindProperty(SupportsGet = true)]
    public string Email { get; set; } = string.Empty;

    [BindProperty(SupportsGet = true)]
    public string? ReturnUrl { get; set; }

    [BindProperty]
    public string Code { get; set; } = string.Empty;

    public string Notice { get; } = StubMessage;
    public string? Error { get; set; }
    public string? DevCodeHint { get; set; }

    public IActionResult OnGet()
    {
        if (string.IsNullOrWhiteSpace(Email))
            return RedirectToPage("/Account/Login");
        return Page();
    }

    public IActionResult OnPost()
    {
        Error = StubMessage;
        return Page();
    }

    public IActionResult OnPostResend() => Page();
}
