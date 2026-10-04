using Perry.Infrastructure.Services;

namespace Perry.Tests.Fakes;

public sealed class FakeAuthInternalClient : IAuthInternalClient
{
    public bool IsConfigured { get; set; }
    public AuthInternalUserDto? User { get; set; }

    public Task<string?> GetServiceTokenAsync(CancellationToken ct = default) =>
        Task.FromResult(IsConfigured ? "fake-token" : null);

    public Task<AuthInternalUserDto?> GetUserAsync(Guid userId, CancellationToken ct = default) =>
        Task.FromResult(User);
}
