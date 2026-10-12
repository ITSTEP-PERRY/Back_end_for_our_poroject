namespace Perry.Infrastructure.Options;

public sealed class JwtOptions
{
    public string Issuer { get; set; } = string.Empty;
    public string Audience { get; set; } = string.Empty;
    public string SigningSecret { get; set; } = string.Empty;
    public string RoleClaimType { get; set; } = "role";
    public string NameClaimType { get; set; } = "sub";
    public bool MapInboundClaims { get; set; } = true;

    /// <summary>
    /// DEV ONLY: принимать JWT Auth без общей подписи (#95). Не включать в prod.
    /// </summary>
    public bool SkipSignatureValidation { get; set; }
}
