using Perry.Domain.Entities;
using Perry.Infrastructure.Services;
using Perry.Web.Extensions;
using Perry.Web.ViewModels;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace Perry.Web.Pages.Cart;

/// <summary>Корзина — Figma Cart V2 (full / empty / guest) + Recently viewed.</summary>
public class IndexModel : PageModel
{
    private readonly ICartService _cart;
    private readonly IOrderService _orders;
    private readonly IViewedProductsService _viewed;

    public IndexModel(ICartService cart, IOrderService orders, IViewedProductsService viewed)
    {
        _cart = cart;
        _orders = orders;
        _viewed = viewed;
    }

    public IReadOnlyList<CartItem> Items { get; private set; } = [];
    public List<ProductCardVm> ViewedProducts { get; private set; } = [];
    public decimal Total { get; private set; }
    public bool IsAuthenticated => User.Identity?.IsAuthenticated ?? false;
    public string? Message { get; set; }
    public string? Error { get; set; }

    public async Task OnGetAsync(CancellationToken ct)
    {
        await LoadAsync(ct);
    }

    public async Task<IActionResult> OnPostUpdateAsync(Guid productId, int quantity, CancellationToken ct)
    {
        try
        {
            var (userId, sid) = Resolve();
            await _cart.UpdateQuantityAsync(userId, sid, productId, quantity, ct);
            Message = "Количество обновлено.";
        }
        catch (Exception ex)
        {
            Error = ex.Message;
        }

        await LoadAsync(ct);
        return Page();
    }

    public async Task<IActionResult> OnPostRemoveAsync(Guid productId, CancellationToken ct)
    {
        var (userId, sid) = Resolve();
        await _cart.RemoveAsync(userId, sid, productId, ct);
        Message = "Товар удалён из корзины.";
        await LoadAsync(ct);
        return Page();
    }

    public async Task<IActionResult> OnPostCheckoutAsync(CancellationToken ct)
    {
        var userId = HttpContext.GetUserId();
        if (userId is null)
        {
            Error = "Чтобы оформить заказ, войдите в аккаунт.";
            await LoadAsync(ct);
            return Page();
        }

        try
        {
            var sid = HttpContext.Request.Cookies[HttpContextCartExtensions.GuestCookieName];
            var recipientName = HttpContext.User.Identity?.Name;
            var order = await _orders.CreateFromCartAsync(userId.Value, sid, recipientName, ct);
            return RedirectToPage("/Orders/Details", new { id = order.Id });
        }
        catch (Exception ex)
        {
            Error = ex.Message;
            await LoadAsync(ct);
            return Page();
        }
    }

    private async Task LoadAsync(CancellationToken ct)
    {
        var (userId, sid) = Resolve();
        Items = await _cart.GetItemsAsync(userId, sid, ct);
        Total = await _cart.GetTotalAsync(userId, sid, ct);
        ViewedProducts = (await _viewed.GetViewedProductsAsync(8, ct)).ToCardVms();
    }

    private (Guid? userId, string? sid) Resolve()
    {
        var userId = HttpContext.GetUserId();
        var sid = userId.HasValue ? null : HttpContext.GetOrCreateGuestSessionId();
        return (userId, sid);
    }
}
