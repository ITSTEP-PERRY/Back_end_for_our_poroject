using System.Security.Claims;
using System.Security.Cryptography;
using Perry.Api.Auth;
using Perry.Domain.Entities;
using Perry.Infrastructure.Auth;
using Perry.Infrastructure.Persistence;
using Perry.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Perry.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IKdfService _kdf;
    private readonly IJwtTokenService _jwt;
    private readonly IPasswordResetService _reset;
    private readonly IEmailSender _email;

    public AuthController(
        AppDbContext db,
        IKdfService kdf,
        IJwtTokenService jwt,
        IPasswordResetService reset,
        IEmailSender email)
    {
        _db = db;
        _kdf = kdf;
        _jwt = jwt;
        _reset = reset;
        _email = email;
    }

    public record LoginRequest(string Login, string Password);
    public record RegisterRequest(string Name, string Email, string Login, string Password);
    public record ForgotRequest(string Email);

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest body, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(body.Login) || string.IsNullOrWhiteSpace(body.Password))
            return BadRequest(new { error = "Login и password обязательны." });

        var access = await _db.UserAccesses
            .Include(a => a.User)
            .FirstOrDefaultAsync(a => a.Login == body.Login.Trim(), ct);

        if (access is null || access.User.DeletedAtUtc != null)
            return Unauthorized(new { error = "Wrong or invalid email address / password." });

        var dk = _kdf.Dk(body.Password, access.Salt);
        if (!string.Equals(dk, access.Dk, StringComparison.OrdinalIgnoreCase))
            return Unauthorized(new { error = "Wrong or invalid email address / password." });

        return Ok(BuildAuthResponse(access));
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest body, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(body.Name) ||
            string.IsNullOrWhiteSpace(body.Email) ||
            string.IsNullOrWhiteSpace(body.Login) ||
            string.IsNullOrWhiteSpace(body.Password))
            return BadRequest(new { error = "Все поля обязательны." });

        var login = body.Login.Trim();
        var email = body.Email.Trim();

        if (await _db.UserAccesses.AnyAsync(a => a.Login == login, ct))
            return Conflict(new { error = "Login уже занят." });
        if (await _db.Users.AnyAsync(u => u.Email == email && u.DeletedAtUtc == null, ct))
            return Conflict(new { error = "Email уже занят." });

        var salt = Convert.ToHexString(RandomNumberGenerator.GetBytes(8));
        var user = new User
        {
            Id = Guid.NewGuid(),
            Name = body.Name.Trim(),
            Email = email,
            RegisteredAtUtc = DateTime.UtcNow
        };
        var access = new UserAccess
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            Login = login,
            Salt = salt,
            Dk = _kdf.Dk(body.Password, salt),
            RoleId = "Guest"
        };

        _db.Users.Add(user);
        _db.UserAccesses.Add(access);
        await _db.SaveChangesAsync(ct);

        access.User = user;
        return Ok(BuildAuthResponse(access));
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> Me(CancellationToken ct)
    {
        var userId = GetUserId();
        if (userId is null) return Unauthorized();

        var access = await _db.UserAccesses
            .AsNoTracking()
            .Include(a => a.User)
            .FirstOrDefaultAsync(a => a.UserId == userId, ct);

        if (access is null || access.User.DeletedAtUtc != null)
            return Unauthorized();

        return Ok(new
        {
            id = access.UserId,
            name = access.User.Name,
            email = access.User.Email,
            login = access.Login,
            roleId = access.RoleId
        });
    }

    [HttpPost("forgot-password")]
    public async Task<IActionResult> Forgot([FromBody] ForgotRequest body, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(body.Email))
            return BadRequest(new { error = "Email обязателен." });

        var user = await _db.Users.AsNoTracking()
            .FirstOrDefaultAsync(u => u.Email == body.Email.Trim() && u.DeletedAtUtc == null, ct);

        // Не раскрываем, существует ли email
        if (user is not null)
        {
            var code = _reset.CreateToken(user.Email);
            await _email.SendEmailAsync(user.Email, "Perry password reset", $"Your reset token: {code}", ct);
        }

        return Ok(new { status = "Ok" });
    }

    private object BuildAuthResponse(UserAccess access)
    {
        var token = _jwt.CreateToken(
            access.UserId,
            access.Login,
            access.User.Name,
            access.User.Email,
            access.RoleId);

        return new
        {
            token,
            user = new
            {
                id = access.UserId,
                name = access.User.Name,
                email = access.User.Email,
                login = access.Login,
                roleId = access.RoleId
            }
        };
    }

    private Guid? GetUserId()
    {
        var raw = User.FindFirstValue(ClaimTypes.NameIdentifier)
                  ?? User.FindFirstValue("sub");
        return Guid.TryParse(raw, out var id) ? id : null;
    }
}
