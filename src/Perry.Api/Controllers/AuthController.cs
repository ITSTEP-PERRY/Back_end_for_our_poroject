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
    private readonly IEmailCodeService _emailCodes;

    public AuthController(
        AppDbContext db,
        IKdfService kdf,
        IJwtTokenService jwt,
        IPasswordResetService reset,
        IEmailSender email,
        IEmailCodeService emailCodes)
    {
        _db = db;
        _kdf = kdf;
        _jwt = jwt;
        _reset = reset;
        _email = email;
        _emailCodes = emailCodes;
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
            avatar = access.User.Avatar,
            login = access.Login,
            roleId = access.RoleId
        });
    }

    public record UpdateProfileRequest(string? Name, string? Email, string? Avatar);
    public record ChangePasswordRequest(string CurrentPassword, string NewPassword);
    public record SendEmailCodeRequest(string NewEmail, string Password);
    public record ChangeEmailRequest(string NewEmail, string Password, string Code);

    [Authorize]
    [HttpPut("me")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest body, CancellationToken ct)
    {
        var userId = GetUserId();
        if (userId is null) return Unauthorized();

        var access = await _db.UserAccesses
            .Include(a => a.User)
            .FirstOrDefaultAsync(a => a.UserId == userId, ct);

        if (access is null || access.User.DeletedAtUtc != null)
            return Unauthorized();

        if (!string.IsNullOrWhiteSpace(body.Name))
            access.User.Name = body.Name.Trim();

        // Email меняется только через /me/email (пароль + код).
        if (body.Avatar is not null)
            access.User.Avatar = body.Avatar.Trim();

        await _db.SaveChangesAsync(ct);

        return Ok(MapUser(access));
    }

    [Authorize]
    [HttpPut("me/password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest body, CancellationToken ct)
    {
        var userId = GetUserId();
        if (userId is null) return Unauthorized();

        if (string.IsNullOrWhiteSpace(body.CurrentPassword) || string.IsNullOrWhiteSpace(body.NewPassword))
            return BadRequest(new { error = "Current and new password are required." });

        if (!IsStrongPassword(body.NewPassword))
            return BadRequest(new
            {
                error = "Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 digit, and be at least 8 characters long"
            });

        var access = await _db.UserAccesses
            .Include(a => a.User)
            .FirstOrDefaultAsync(a => a.UserId == userId, ct);

        if (access is null || access.User.DeletedAtUtc != null)
            return Unauthorized();

        var currentDk = _kdf.Dk(body.CurrentPassword, access.Salt);
        if (!string.Equals(currentDk, access.Dk, StringComparison.OrdinalIgnoreCase))
            return BadRequest(new { error = "Current password is incorrect." });

        var salt = Convert.ToHexString(RandomNumberGenerator.GetBytes(8));
        access.Salt = salt;
        access.Dk = _kdf.Dk(body.NewPassword, salt);
        await _db.SaveChangesAsync(ct);

        return Ok(new { status = "Ok" });
    }

    [Authorize]
    [HttpPost("me/email/send-code")]
    public async Task<IActionResult> SendEmailChangeCode([FromBody] SendEmailCodeRequest body, CancellationToken ct)
    {
        var userId = GetUserId();
        if (userId is null) return Unauthorized();

        if (string.IsNullOrWhiteSpace(body.Password))
            return BadRequest(new { error = "This field is required to be filled first" });

        if (string.IsNullOrWhiteSpace(body.NewEmail))
            return BadRequest(new { error = "New email is required." });

        var access = await _db.UserAccesses
            .Include(a => a.User)
            .FirstOrDefaultAsync(a => a.UserId == userId, ct);

        if (access is null || access.User.DeletedAtUtc != null)
            return Unauthorized();

        var dk = _kdf.Dk(body.Password, access.Salt);
        if (!string.Equals(dk, access.Dk, StringComparison.OrdinalIgnoreCase))
            return BadRequest(new { error = "Current password is incorrect." });

        var newEmail = body.NewEmail.Trim();
        if (string.Equals(newEmail, access.User.Email, StringComparison.OrdinalIgnoreCase))
            return BadRequest(new { error = "New email must be different from the current one." });

        var taken = await _db.Users.AnyAsync(
            u => u.Email == newEmail && u.Id != userId && u.DeletedAtUtc == null, ct);
        if (taken) return Conflict(new { error = "Email already in use." });

        var code = _emailCodes.GenerateCode(EmailChangeKey(userId.Value, newEmail));
        await _email.SendEmailAsync(
            newEmail,
            "Perry email change code",
            $"Your verification code: {code}",
            ct);

        return Ok(new
        {
            status = "Ok",
            // В Dev/Stub удобно видеть код в ответе (как в auth-flow).
            code = code
        });
    }

    [Authorize]
    [HttpPut("me/email")]
    public async Task<IActionResult> ChangeEmail([FromBody] ChangeEmailRequest body, CancellationToken ct)
    {
        var userId = GetUserId();
        if (userId is null) return Unauthorized();

        if (string.IsNullOrWhiteSpace(body.Password))
            return BadRequest(new { error = "This field is required to be filled first" });

        if (string.IsNullOrWhiteSpace(body.NewEmail))
            return BadRequest(new { error = "New email is required." });

        if (string.IsNullOrWhiteSpace(body.Code) || body.Code.Trim().Length < 6)
            return BadRequest(new { error = "Incorrect code, try again" });

        var access = await _db.UserAccesses
            .Include(a => a.User)
            .FirstOrDefaultAsync(a => a.UserId == userId, ct);

        if (access is null || access.User.DeletedAtUtc != null)
            return Unauthorized();

        var dk = _kdf.Dk(body.Password, access.Salt);
        if (!string.Equals(dk, access.Dk, StringComparison.OrdinalIgnoreCase))
            return BadRequest(new { error = "Current password is incorrect." });

        var newEmail = body.NewEmail.Trim();
        var taken = await _db.Users.AnyAsync(
            u => u.Email == newEmail && u.Id != userId && u.DeletedAtUtc == null, ct);
        if (taken) return Conflict(new { error = "Email already in use." });

        if (!_emailCodes.TryVerify(EmailChangeKey(userId.Value, newEmail), body.Code))
            return BadRequest(new { error = "Incorrect code, try again" });

        access.User.Email = newEmail;
        await _db.SaveChangesAsync(ct);

        return Ok(MapUser(access));
    }

    private static string EmailChangeKey(Guid userId, string newEmail) =>
        $"email-change:{userId:N}:{newEmail.Trim().ToLowerInvariant()}";

    private static bool IsStrongPassword(string password)
    {
        if (string.IsNullOrWhiteSpace(password) || password.Length < 8) return false;
        var hasUpper = password.Any(char.IsUpper);
        var hasLower = password.Any(char.IsLower);
        var hasDigit = password.Any(char.IsDigit);
        return hasUpper && hasLower && hasDigit;
    }

    private static object MapUser(UserAccess access) => new
    {
        id = access.UserId,
        name = access.User.Name,
        email = access.User.Email,
        avatar = access.User.Avatar,
        login = access.Login,
        roleId = access.RoleId
    };

    [Authorize]
    [HttpDelete("me")]
    public async Task<IActionResult> DeleteMe(CancellationToken ct)
    {
        var userId = GetUserId();
        if (userId is null) return Unauthorized();

        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId, ct);
        if (user is null) return NotFound();

        user.DeletedAtUtc = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return NoContent();
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

        return Ok(new
        {
            status = "Ok",
            message = "If an account exists for this email, we sent password reset instructions."
        });
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
                avatar = access.User.Avatar,
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
