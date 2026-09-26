using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace Perry.Web.Pages.Account;

/// <summary>Deprecated: профиль после регистрации — Perry Auth Service + React FE.</summary>
public class FinishingTouchesModel : PageModel
{
    public const string SessionUserIdKey = "perry:pending_profile_user";

    public const string StubMessage =
        "Завершение регистрации перенесено в Perry Auth Service и React-приложение.";

    [BindProperty]
    public string FirstName { get; set; } = string.Empty;

    [BindProperty]
    public string LastName { get; set; } = string.Empty;

    public string Notice { get; } = StubMessage;
    public bool FirstNameMissing { get; set; }
    public bool LastNameMissing { get; set; }

    public IActionResult OnGet() => Page();

    public IActionResult OnPost()
    {
        FirstNameMissing = false;
        LastNameMissing = false;
        return Page();
    }
}
