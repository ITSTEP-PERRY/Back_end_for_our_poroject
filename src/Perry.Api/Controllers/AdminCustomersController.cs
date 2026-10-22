using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Perry.Api.Auth;
using Perry.Domain.Enums;
using Perry.Infrastructure.Persistence;
using Perry.Infrastructure.Services;

namespace Perry.Api.Controllers;

/// <summary>#A22 — покупатель продавца со сводкой по заказам.</summary>
public sealed record AdminCustomerDto(
    Guid UserId,
    string? Name,
    string? Email,
    int TotalOrders,
    decimal TotalSpent,
    DateTime? LastOrderDate);

/// <summary>#A22 — ответ GET /api/admin/customers.</summary>
public sealed record AdminCustomersResponse(IReadOnlyList<AdminCustomerDto> Customers);

/// <summary>
/// #A22 — покупатели продавца.
/// Возвращает всех покупателей, у которых есть хотя бы один заказ
/// с товаром данного продавца.
/// </summary>
[ApiController]
[Route("api/admin/customers")]
[Authorize(Roles = "Admin,Seller")]
public class AdminCustomersController : ControllerBase
{
    private const int AuthLookupConcurrency = 6;

    private readonly AppDbContext _db;
    private readonly IAuthInternalClient _authInternal;

    public AdminCustomersController(AppDbContext db, IAuthInternalClient authInternal)
    {
        _db = db;
        _authInternal = authInternal;
    }

    /// <summary>
    /// GET /api/admin/customers?sellerId={guid}
    /// Admin — все покупатели (или конкретного продавца), Seller — только свои.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetCustomers(
        [FromQuery] Guid? sellerId = null,
        CancellationToken ct = default)
    {
        var seller = ResolveSeller(sellerId);
        if (seller == Guid.Empty) return Unauthorized();

        // Cancelled — не покупка: считаем только позиции (сумма по товарам продавца, без доставки).
        var items = _db.OrderItems.AsNoTracking()
            .Where(i => i.Order.Status != OrderStatus.Cancelled);
        if (seller.HasValue)
            items = items.Where(i => i.Product.SellerId == seller.Value);

        var rows = await items
            .Select(i => new { i.OrderId, i.Order.UserId, i.Order.OrderDateUtc, i.TotalPrice })
            .ToListAsync(ct);

        var grouped = rows
            .GroupBy(r => r.UserId)
            .Select(g => new
            {
                UserId = g.Key,
                TotalOrders = g.Select(r => r.OrderId).Distinct().Count(),
                TotalSpent = g.Sum(r => r.TotalPrice),
                LastOrderDate = g.Max(r => (DateTime?)r.OrderDateUtc)
            })
            .OrderByDescending(c => c.LastOrderDate)
            .ToList();

        var profiles = await LoadProfilesAsync(grouped.Select(c => c.UserId).ToList(), ct);

        var customers = grouped.Select(c =>
        {
            profiles.TryGetValue(c.UserId, out var profile);
            return new AdminCustomerDto(
                c.UserId,
                profile?.DisplayName,
                profile?.Email,
                c.TotalOrders,
                c.TotalSpent,
                c.LastOrderDate);
        }).ToList();

        return Ok(new AdminCustomersResponse(customers));
    }

    /// <summary>
    /// Admin видит всех (или конкретного sellerId), Seller — только себя.
    /// Guid.Empty = в JWT нет sub (не авторизован).
    /// </summary>
    private Guid? ResolveSeller(Guid? requestedSellerId)
    {
        if (!User.IsInRole("Seller") || User.IsInRole("Admin"))
            return requestedSellerId;

        var ownId = AuthClaims.GetUserId(User);
        return ownId ?? Guid.Empty;
    }

    /// <summary>
    /// Имена/почты из Auth Internal; недоступность Auth не ломает список —
    /// покупатель остаётся с одним userId.
    /// </summary>
    private async Task<Dictionary<Guid, AuthInternalUserDto>> LoadProfilesAsync(
        IReadOnlyCollection<Guid> userIds, CancellationToken ct)
    {
        var result = new Dictionary<Guid, AuthInternalUserDto>();
        if (!_authInternal.IsConfigured || userIds.Count == 0)
            return result;

        using var throttle = new SemaphoreSlim(AuthLookupConcurrency);
        var tasks = userIds.Select(async userId =>
        {
            await throttle.WaitAsync(ct);
            try
            {
                var profile = await _authInternal.GetUserAsync(userId, ct);
                return (userId, profile);
            }
            catch
            {
                return (userId, (AuthInternalUserDto?)null);
            }
            finally
            {
                throttle.Release();
            }
        });

        foreach (var (userId, profile) in await Task.WhenAll(tasks))
        {
            if (profile is not null) result[userId] = profile;
        }
        return result;
    }
}
