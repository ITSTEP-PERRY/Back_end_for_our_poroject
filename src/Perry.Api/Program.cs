
using System.Text.Json.Serialization;
using System.Security.Cryptography.X509Certificates;
using DotNetEnv;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.OpenApi.Models;
using Perry.Api.Auth;
using Perry.Api.Extensions;
using Perry.Api.Filters;
using Perry.Infrastructure;
using Perry.Infrastructure.Persistence;
using Perry.Infrastructure.Options;

// Local secrets: `.env` next to csproj or solution root (gitignored). See .env.example.
foreach (var envPath in new[]
         {
             Path.Combine(Directory.GetCurrentDirectory(), ".env"),
             Path.Combine(AppContext.BaseDirectory, ".env"),
             Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), "..", "..", "..", ".env")),
             Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), "..", "..", "..", "..", ".env")),
         })
{
    if (File.Exists(envPath))
    {
        Env.Load(envPath);
        break;
    }
}

var builder = WebApplication.CreateBuilder(args);

// Review photos arrive as base64 data-URLs in JSON before we persist them to /uploads.
builder.WebHost.ConfigureKestrel(o => o.Limits.MaxRequestBodySize = 40 * 1024 * 1024);

builder.Services.AddControllers().AddJsonOptions(options =>
{
    options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
});

builder.Services.Configure<Microsoft.AspNetCore.Http.Features.FormOptions>(o =>
{
    o.MultipartBodyLengthLimit = 40 * 1024 * 1024;
});

builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Perry Product API",
        Version = "v1",
        Description =
            "REST for the Perry React storefront (:3000) and admin (:3001).\n\n" +
            "**Auth:** JWT from Perry Auth Service.\n\n" +
            "**Main groups:** categories, products, reviews, cart, orders, wishlist, admin/*."
    });

    c.CustomSchemaIds(t => t.FullName?.Replace("+", ".") ?? t.Name);

    c.TagActionsBy(api =>
    {
        var controller = api.ActionDescriptor.RouteValues.TryGetValue("controller", out var name)
            ? name
            : "Other";

        return new[] { controller ?? "Other" };
    });

    c.OrderActionsBy(api =>
        $"{api.ActionDescriptor.RouteValues["controller"]}_{api.HttpMethod}_{api.RelativePath}");

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "Paste access JWT from Perry Auth Service (Swagger adds Bearer prefix).",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

builder.Services.AddInfrastructure(builder.Configuration);

// ============================================================
// STAGE 7: ASP.NET CORE DATA PROTECTION SECURITY HARDENING
// ============================================================
//
// In Kubernetes:
// - Persist encryption keys on a dedicated PVC.
// - Encrypt newly created keys using an X.509 certificate.
// - Load certificate settings from environment variables.
// - Do not store private keys or passwords in source control.
//
// Local development without DataProtection:KeysPath continues
// using ASP.NET Core's default Data Protection configuration.
// ============================================================

var dpKeysPath = builder.Configuration["DataProtection:KeysPath"];

if (!string.IsNullOrWhiteSpace(dpKeysPath))
{
    var certificatePath =
        builder.Configuration["DataProtection:CertificatePath"];

    var certificatePassword =
        builder.Configuration["DataProtection:CertificatePassword"];

    if (string.IsNullOrWhiteSpace(certificatePath) ||
        string.IsNullOrWhiteSpace(certificatePassword))
    {
        throw new InvalidOperationException(
            "Data Protection certificate path and password must be configured.");
    }

    if (!Directory.Exists(dpKeysPath))
    {
        throw new DirectoryNotFoundException(
            $"Data Protection key directory does not exist: {dpKeysPath}");
    }

    var certificate = X509CertificateLoader.LoadPkcs12FromFile(
        certificatePath,
        certificatePassword,
        X509KeyStorageFlags.EphemeralKeySet);

    if (!certificate.HasPrivateKey)
    {
        throw new InvalidOperationException(
            "Data Protection certificate must contain a private key.");
    }

    builder.Services.AddDataProtection()
        .PersistKeysToFileSystem(new DirectoryInfo(dpKeysPath))
        .ProtectKeysWithCertificate(certificate);
}

// ============================================================
// DISTRIBUTED CACHE AND SESSION
// ============================================================

builder.Services.AddDistributedMemoryCache();

builder.Services.AddSession(o =>
{
    o.IdleTimeout = TimeSpan.FromHours(12);
    o.Cookie.HttpOnly = true;
    o.Cookie.IsEssential = true;
});

// JWT — shared HS256 secret with Perry Auth Service (#95).
// Prefer env / .env over appsettings placeholders.
var jwt = builder.Configuration.GetSection("Jwt").Get<JwtOptions>()
          ?? new JwtOptions();

if (string.IsNullOrWhiteSpace(jwt.SigningSecret))
    jwt.SigningSecret = builder.Configuration["Jwt:Key"] ?? string.Empty;

if (string.IsNullOrWhiteSpace(jwt.Issuer))
    jwt.Issuer = builder.Configuration["Jwt:Issuer"] ?? "Perry.AuthService";

if (string.IsNullOrWhiteSpace(jwt.Audience))
    jwt.Audience = builder.Configuration["Jwt:Audience"] ?? "Perry.Client";

// Treat unfilled .env.example placeholders as missing.
static bool IsMissingJwtSecret(string? s) =>
    string.IsNullOrWhiteSpace(s)
    || s.Contains("PASTE_", StringComparison.OrdinalIgnoreCase)
    || s.Contains("YOUR_", StringComparison.OrdinalIgnoreCase);

if (jwt.SkipSignatureValidation && !builder.Environment.IsDevelopment())
{
    throw new InvalidOperationException(
        "Jwt:SkipSignatureValidation is permitted only in Development.");
}
if (IsMissingJwtSecret(jwt.SigningSecret))
{
    const string localDevSecret = "changeme-dev-jwt-signing-key-32chars";

    if (builder.Environment.IsDevelopment())
    {
        jwt.SigningSecret = localDevSecret;
    }
    else if (!jwt.SkipSignatureValidation)
    {
        throw new InvalidOperationException(
            "JWT signing secret is not configured (Jwt:SigningSecret or Jwt:Key / .env).");
    }
    else
    {
        jwt.SigningSecret = "dev-placeholder-not-used-when-skip-signature";
    }
}

builder.Services.AddJwtAuthentication(jwt);

// #217 — CORS origins from config / env (Cors__AllowedOrigins),
// not hard-coded only.
static string[] ResolveCorsOrigins(IConfiguration configuration)
{
    var fromConfig =
        configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
        ?? Array.Empty<string>();

    var fromEnv =
        configuration["Cors:AllowedOrigins"]
        ?? configuration["Cors__AllowedOrigins"]
        ?? string.Empty;

    var parsedEnv = fromEnv.Split(
        ',',
        StringSplitOptions.RemoveEmptyEntries |
        StringSplitOptions.TrimEntries);

    var defaults = new[]
    {
        "https://admin.perrydev.space",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "http://localhost:8081",
        "http://127.0.0.1:8081",
    };

    return fromConfig
        .Concat(parsedEnv)
        .Concat(defaults)
        .Where(o => !string.IsNullOrWhiteSpace(o))
        .Select(o => o.Trim().TrimEnd('/'))
        .Distinct(StringComparer.OrdinalIgnoreCase)
        .ToArray();
}

var corsOrigins = ResolveCorsOrigins(builder.Configuration);

builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
        policy.WithOrigins(corsOrigins)
            .AllowCredentials()
            .AllowAnyHeader()
            .AllowAnyMethod());
});

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy(
        AuthorizationPolicies.AdminAccess,
        policy => policy
            .RequireAuthenticatedUser()
            .RequireRole("Admin"));

    options.AddPolicy(
        AuthorizationPolicies.SellerAccess,
        policy => policy
            .RequireAuthenticatedUser()
            .RequireRole("Seller"));
});

builder.Services.AddScoped<ModelValidateActionFilter>();

var app = builder.Build();

// ============================================================
// DATABASE MIGRATIONS
// ============================================================

await DbSeeder.MigrateAsync(app.Services);

if (app.Environment.IsDevelopment())
{
    await DbSeeder.SeedAsync(app.Services);
}

// ============================================================
// SWAGGER
// ============================================================

app.UseSwagger();

app.UseSwaggerUI(o =>
{
    o.DocumentTitle = "Perry API";
    o.SwaggerEndpoint("/swagger/v1/swagger.json", "Perry API v1");
    o.DisplayRequestDuration();
});

app.UseCors("Frontend");

// ============================================================
// STATIC FILES / UPLOADS
// ============================================================

// Review photos: DiskStorageService writes to ContentRoot/wwwroot/uploads.
// Map /uploads/* explicitly — default UseStaticFiles alone was 404
// in this host layout.
var uploadsDir = Path.Combine(
    app.Environment.ContentRootPath,
    "wwwroot",
    "uploads");

Directory.CreateDirectory(uploadsDir);

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider =
        new Microsoft.Extensions.FileProviders.PhysicalFileProvider(uploadsDir),

    RequestPath = "/uploads",
    ServeUnknownFileTypes = true,
});

app.UseStaticFiles();

// ============================================================
// AUTHENTICATION AND AUTHORIZATION
// ============================================================

app.UseSession();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// ============================================================
// HEALTH CHECKS
// ============================================================

app.MapGet("/health", () =>
    Results.Ok(new { status = "Healthy" }));

// #A06 — healthcheck (API + SQL)
app.MapGet("/api/health", async (
    AppDbContext db,
    CancellationToken ct) =>
{
    try
    {
        var ok = await db.Database.CanConnectAsync(ct);

        return ok
            ? Results.Ok(new
            {
                status = "Healthy",
                database = "up",
                utc = DateTime.UtcNow
            })
            : Results.Json(new
            {
                status = "Unhealthy",
                database = "down"
            }, statusCode: 503);
    }
    catch (Exception ex)
    {
        return Results.Json(new
        {
            status = "Unhealthy",
            database = "error",
            error = ex.Message
        }, statusCode: 503);
    }
}).AllowAnonymous();

app.Run();
