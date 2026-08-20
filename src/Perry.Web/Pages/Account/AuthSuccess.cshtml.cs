using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace Perry.Web.Pages.Account;

/// <summary>Congratulations — успешная регистрация или сброс пароля.</summary>
public class AuthSuccessModel : PageModel
{
    [BindProperty(SupportsGet = true)]
    public string Kind { get; set; } = "register";

    public string Title { get; private set; } = "Congratulations!";
    public string Subtitle { get; private set; } = "The registration was completed";
    public string CtaText { get; private set; } = "Let's start shopping";
    public string CtaPage { get; private set; } = "/Index";

    public void OnGet()
    {
        if (string.Equals(Kind, "reset", StringComparison.OrdinalIgnoreCase))
        {
            Title = "Congratulations!";
            Subtitle = "Your password has been reset";
            CtaText = "Log in";
            CtaPage = "/Account/Login";
        }
        else
        {
            Title = "Congratulations!";
            Subtitle = "The registration was completed";
            CtaText = "Let's start shopping";
            CtaPage = "/Index";
        }
    }
}
