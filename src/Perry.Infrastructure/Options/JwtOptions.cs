namespace Perry.Infrastructure.Options;

public sealed class JwtOptions
{
        public string Issuer { get; set; } = string.Empty;
        public string Audience { get; set; } = string.Empty;
        public string SigningSecret { get; set; } = string.Empty;
}