using Perry.Domain.Entities;
using Perry.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Perry.Infrastructure.Services;

/// <summary>Пользователи: update / soft-delete (homework UserService).</summary>
public interface IUserService
{
    Task<User?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task UpdateAsync(Guid id, string name, string email, CancellationToken ct = default);
    Task SoftDeleteAsync(Guid id, CancellationToken ct = default);
    Task RestoreAsync(Guid id, CancellationToken ct = default);
    Task<IReadOnlyList<User>> GetAllAsync(CancellationToken ct = default);
}

public class UserService : IUserService
{
    private readonly AppDbContext _db;

    public UserService(AppDbContext db) => _db = db;

    public Task<User?> GetByIdAsync(Guid id, CancellationToken ct = default) =>
        _db.Users.AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == id && u.DeletedAtUtc == null, ct);

    public async Task UpdateAsync(Guid id, string name, string email, CancellationToken ct = default)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == id && u.DeletedAtUtc == null, ct)
            ?? throw new InvalidOperationException("Пользователь не найден.");

        if (string.IsNullOrWhiteSpace(name) || string.IsNullOrWhiteSpace(email))
            throw new InvalidOperationException("Имя и email обязательны.");

        var emailTaken = await _db.Users.AnyAsync(
            u => u.Email == email.Trim() && u.Id != id && u.DeletedAtUtc == null, ct);
        if (emailTaken)
            throw new InvalidOperationException("Email уже занят.");

        user.Name = name.Trim();
        user.Email = email.Trim();
        await _db.SaveChangesAsync(ct);
    }

    public async Task SoftDeleteAsync(Guid id, CancellationToken ct = default)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == id, ct)
            ?? throw new InvalidOperationException("Пользователь не найден.");
        user.DeletedAtUtc = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
    }

    public async Task RestoreAsync(Guid id, CancellationToken ct = default)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == id, ct)
            ?? throw new InvalidOperationException("Пользователь не найден.");
        user.DeletedAtUtc = null;
        await _db.SaveChangesAsync(ct);
    }

    public async Task<IReadOnlyList<User>> GetAllAsync(CancellationToken ct = default) =>
        await _db.Users.AsNoTracking()
            .Include(u => u.Accesses)
            .Where(u => u.DeletedAtUtc == null)
            .OrderByDescending(u => u.RegisteredAtUtc)
            .Take(200)
            .ToListAsync(ct);
}
