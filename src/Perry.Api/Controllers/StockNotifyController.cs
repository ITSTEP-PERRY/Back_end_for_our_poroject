using System.Security.Claims;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Perry.Domain.Entities;
using Perry.Infrastructure.Persistence;
using Perry.Infrastructure.Services;

namespace Perry.Api.Controllers;

/// <summary>Подписка на уведомление о наличии товара.</summary>
[ApiController]
[Route("api/products/{productId:guid}/notify")]
public class StockNotifyController : ControllerBase
{
    private static readonly Regex EmailRx = new(
        @"^[^@\s]+@[^@\s]+\.[^@\s]+$",
        RegexOptions.Compiled | RegexOptions.IgnoreCase);

    private readonly AppDbContext _db;
    private readonly IEmailSender _email;

    public StockNotifyController(AppDbContext db, IEmailSender email)
    {
        _db = db;
        _email = email;
    }

    public record NotifyRequest(string? Email = null);

    /// <summary>
    /// POST /api/products/{id}/notify
    /// Авторизованный: email из профиля (или body). Гость: email в body обязателен.
    /// </summary>
    [HttpPost]
    [AllowAnonymous]
    public async Task<IActionResult> Subscribe(Guid productId, [FromBody] NotifyRequest? body, CancellationToken ct)
    {
        var product = await _db.Products.AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == productId, ct);
        if (product is null)
            return NotFound(new { error = "Product not found." });

        var userId = GetUserId();
        string? email = body?.Email?.Trim();

        if (userId is not null)
        {
            var user = await _db.Users.AsNoTracking()
                .FirstOrDefaultAsync(u => u.Id == userId && u.DeletedAtUtc == null, ct);
            if (user is null) return Unauthorized();
            if (string.IsNullOrWhiteSpace(email))
                email = user.Email;
        }

        if (string.IsNullOrWhiteSpace(email) || !EmailRx.IsMatch(email))
            return BadRequest(new { error = "Valid email is required." });

        email = email.Trim().ToLowerInvariant();

        var existing = await _db.StockNotifyRequests
            .FirstOrDefaultAsync(x => x.ProductId == productId && x.Email == email, ct);

        if (existing is null)
        {
            _db.StockNotifyRequests.Add(new StockNotifyRequest
            {
                Id = Guid.NewGuid(),
                ProductId = productId,
                Email = email,
                UserId = userId,
                CreatedAtUtc = DateTime.UtcNow
            });
            await _db.SaveChangesAsync(ct);
        }

        await _email.SendEmailAsync(
            email,
            $"Perry — notify when available: {product.Name}",
            $"We'll email you at {email} when \"{product.Name}\" is back in stock.\n\n— Perry",
            ct);

        return Ok(new { status = "Ok", email, alreadySubscribed = existing is not null });
    }

    private Guid? GetUserId()
    {
        var raw = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        return Guid.TryParse(raw, out var id) ? id : null;
    }
}
