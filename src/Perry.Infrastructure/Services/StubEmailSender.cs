using Microsoft.Extensions.Logging;

namespace Perry.Infrastructure.Services;

/// <summary>Заглушка SMTP: не шлёт письма, пишет код в лог (для разработки).</summary>
public class StubEmailSender : IEmailSender
{
    private readonly ILogger<StubEmailSender> _logger;

    public StubEmailSender(ILogger<StubEmailSender> logger)
    {
        _logger = logger;
    }

    public Task SendEmailAsync(string to, string subject, string body, CancellationToken ct = default)
    {
        _logger.LogWarning(
            "[STUB EMAIL] To={To}; Subject={Subject}; Body={Body}",
            to, subject, body);
        return Task.CompletedTask;
    }
}
