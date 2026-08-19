namespace Perry.Infrastructure.Services;

/// <summary>Отправка email-сообщений (SMTP).</summary>
public interface IEmailSender
{
    Task SendEmailAsync(string to, string subject, string body, CancellationToken ct = default);
}
