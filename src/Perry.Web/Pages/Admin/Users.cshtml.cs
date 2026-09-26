using Perry.Web.Filters;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace Perry.Web.Pages.Admin;

/// <summary>Deprecated: управление пользователями — Perry Auth Service + React FE.</summary>
[AdminOnly]
public class UsersModel : PageModel
{
    public string Notice { get; } =
        "Список пользователей и роли управляются в Perry Auth Service и React-приложении. Данные здесь не отображаются.";

    public IReadOnlyList<UserRow> Rows { get; private set; } = [];

    public void OnGet()
    {
    }

    public class UserRow
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Login { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public DateTime RegisteredAtUtc { get; set; }
    }
}
