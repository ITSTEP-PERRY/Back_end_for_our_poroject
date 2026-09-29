namespace Perry.Infrastructure.Options;

public sealed class AuthServiceOptions
{
    public const string SectionName = "AuthService";

    /// <summary>Origin Auth без хвоста / </summary>
    public string BaseUrl { get; set; } = "";

    public string ServiceName { get; set; } = "local-service";

    /// <summary>Plaintext credential — только из env / User Secrets (#97).</summary>
    public string ServiceCredential { get; set; } = "";
}
