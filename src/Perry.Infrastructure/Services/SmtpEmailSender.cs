using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Perry.Infrastructure.Services;

public class SmtpEmailSender : IEmailSender
{
    private readonly string _host;
    private readonly int _port;
    private readonly string _from;
    private readonly string _username;
    private readonly string _password;
    private readonly bool _enableSsl;
    private readonly ILogger<SmtpEmailSender> _logger;

    public SmtpEmailSender(IConfiguration configuration, ILogger<SmtpEmailSender> logger)
    {
        var smtp = configuration.GetSection("Smtp");
        _host = smtp["Host"] ?? "smtp.gmail.com";
        _port = int.TryParse(smtp["Port"], out var p) ? p : 587;
        _from = smtp["From"] ?? throw new InvalidOperationException("Smtp:From is required");
        _username = smtp["Username"] ?? _from;
        _password = smtp["Password"] ?? throw new InvalidOperationException("Smtp:Password is required");
        _enableSsl = !bool.TryParse(smtp["EnableSsl"], out var ssl) || ssl;
        _logger = logger;
    }

    public async Task SendEmailAsync(string to, string subject, string body, CancellationToken ct = default)
    {
        using var client = new SmtpClient(_host, _port)
        {
            EnableSsl = _enableSsl,
            Credentials = new NetworkCredential(_username, _password)
        };
        using var message = new MailMessage(_from, to, subject, body)
        {
            IsBodyHtml = false
        };
        await client.SendMailAsync(message, ct);
        _logger.LogInformation("Verification code sent to {To}", to);
    }
}
