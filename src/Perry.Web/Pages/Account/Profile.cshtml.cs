using System.Security.Claims;
using Perry.Domain.Entities;
using Perry.Infrastructure.Services;
using Perry.Web.Extensions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace Perry.Web.Pages.Account;

/// <summary>Профиль покупателя (read-only из claims; редактирование — Auth Service + React).</summary>
public class ProfileModel : PageModel
{
    private readonly IOrderService _orders;

    public ProfileModel(IOrderService orders) => _orders = orders;

    public ProfileAccountView? Account { get; private set; }
    public string? LoginName { get; private set; }
    public string? RoleId { get; private set; }
    public IReadOnlyList<Order> RecentOrders { get; private set; } = [];
    public int TotalOrders { get; private set; }
    public string? Message { get; set; }
    public string? Error { get; set; }

    [BindProperty]
    public string EditName { get; set; } = string.Empty;

    [BindProperty]
    public string EditEmail { get; set; } = string.Empty;

    public async Task<IActionResult> OnGetAsync(CancellationToken ct)
    {
        return await LoadAsync(ct) ?? Page();
    }

    public Task<IActionResult> OnPostUpdateAsync(CancellationToken ct)
    {
        Error =
            "Изменение профиля перенесено в Perry Auth Service и React-приложение.";
        return LoadAndPageAsync(ct);
    }

    public Task<IActionResult> OnPostDeleteAsync(CancellationToken ct)
    {
        Error =
            "Удаление аккаунта перенесено в Perry Auth Service и React-приложение.";
        return LoadAndPageAsync(ct);
    }

    private async Task<IActionResult> LoadAndPageAsync(CancellationToken ct) =>
        await LoadAsync(ct) ?? Page();

    private async Task<IActionResult?> LoadAsync(CancellationToken ct)
    {
        var userId = HttpContext.GetUserId();
        if (userId is null)
            return RedirectToPage("/Account/Login", new { returnUrl = "/Account/Profile" });

        var principal = HttpContext.User;
        var name = principal.FindFirstValue(ClaimTypes.Name) ?? string.Empty;
        var email = principal.FindFirstValue(ClaimTypes.Email) ?? string.Empty;
        LoginName = principal.FindFirstValue(ClaimTypes.NameIdentifier);
        RoleId = principal.FindFirstValue(ClaimTypes.Role);

        Account = new ProfileAccountView
        {
            Name = name,
            Email = email,
            RegisteredAtUtc = null
        };
        EditName = name;
        EditEmail = email;

        var orders = await _orders.GetUserOrdersAsync(userId.Value, ct);
        TotalOrders = orders.Count;
        RecentOrders = orders.Take(5).ToList();
        return null;
    }

    public sealed class ProfileAccountView
    {
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public DateTime? RegisteredAtUtc { get; set; }
    }
}
