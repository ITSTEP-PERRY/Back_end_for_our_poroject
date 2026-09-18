using Perry.Infrastructure.Persistence;
using Perry.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Perry.Api.Controllers;

[ApiController]
[Route("api/users")]
[Authorize(Roles = "Admin")]
public class UsersController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IUserService _users;

    public UsersController(AppDbContext db, IUserService users)
    {
        _db = db;
        _users = users;
    }

    public record RoleRequest(string RoleId);

    /// <summary>
    /// GET /api/users?status=active|deleted|all&amp;role=Admin
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> List(
        [FromQuery] string status = "active",
        [FromQuery] string? role = null,
        CancellationToken ct = default)
    {
        var query = _db.Users.AsNoTracking().Include(u => u.Accesses).AsQueryable();

        status = (status ?? "active").Trim().ToLowerInvariant();
        if (status == "deleted")
            query = query.Where(u => u.DeletedAtUtc != null);
        else if (status == "all")
        { /* no filter */ }
        else
            query = query.Where(u => u.DeletedAtUtc == null);

        if (!string.IsNullOrWhiteSpace(role))
        {
            var roleId = role.Trim();
            query = query.Where(u => u.Accesses.Any(a => a.RoleId == roleId));
        }

        var list = await query
            .OrderByDescending(u => u.RegisteredAtUtc)
            .Take(200)
            .Select(u => new
            {
                u.Id,
                u.Name,
                u.Email,
                login = u.Accesses.Select(a => a.Login).FirstOrDefault() ?? "",
                roleId = u.Accesses.Select(a => a.RoleId).FirstOrDefault() ?? "Guest",
                registeredAtUtc = u.RegisteredAtUtc,
                deletedAtUtc = u.DeletedAtUtc,
                isDeleted = u.DeletedAtUtc != null
            })
            .ToListAsync(ct);

        return Ok(list);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> SoftDelete(Guid id, CancellationToken ct)
    {
        await _users.SoftDeleteAsync(id, ct);
        return NoContent();
    }

    [HttpPost("{id:guid}/restore")]
    public async Task<IActionResult> Restore(Guid id, CancellationToken ct)
    {
        await _users.RestoreAsync(id, ct);
        return Ok(new { status = "Ok" });
    }

    [HttpPut("{id:guid}/role")]
    public async Task<IActionResult> SetRole(Guid id, [FromBody] RoleRequest body, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(body.RoleId))
            return BadRequest(new { error = "RoleId обязателен." });

        var access = await _db.UserAccesses.FirstOrDefaultAsync(a => a.UserId == id, ct);
        if (access is null) return NotFound();

        access.RoleId = body.RoleId.Trim();
        await _db.SaveChangesAsync(ct);
        return Ok(new { status = "Ok", roleId = access.RoleId });
    }
}
