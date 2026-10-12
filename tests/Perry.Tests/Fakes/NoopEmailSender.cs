using Perry.Infrastructure.Services;

namespace Perry.Tests.Fakes;

public sealed class NoopEmailSender : IEmailSender
{
    public List<(string To, string Subject, string Body)> Sent { get; } = [];

    public Task SendEmailAsync(string to, string subject, string body, CancellationToken ct = default)
    {
        Sent.Add((to, subject, body));
        return Task.CompletedTask;
    }
}
