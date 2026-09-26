using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace Perry.Web.Pages.Admin;

/// <summary>Deprecated: вход администратора через Perry Auth Service + React FE.</summary>
public class LoginModel : PageModel
{
    public const string StubMessage =
        "Вход в админку перенесён в Perry Auth Service и React-приложение. Локальная Razor-админка — заглушка.";

    [BindProperty]
    public string Login { get; set; } = string.Empty;

    [BindProperty]
    public string Password { get; set; } = string.Empty;

    public string Notice { get; } = StubMessage;
    public string? Error { get; set; }

    public IActionResult OnGet()
    {
        if (User.IsInRole("Admin"))
            return RedirectToPage("/Admin/Index");
        return Page();
    }

    public IActionResult OnPost()
    {
        Error = StubMessage;
        return Page();
    }
}
