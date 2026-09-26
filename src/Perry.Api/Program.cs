using System.Text;
using System.Text.Json.Serialization;
using DotNetEnv;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Perry.Api.Auth;
using Perry.Infrastructure;
using Perry.Infrastructure.Persistence;
using Microsoft.OpenApi.Models;
using Perry.Api.Extensions;
using Perry.Api.Filters;
using Perry.Infrastructure.Interfaces;
using Perry.Infrastructure.Options;

Env.Load();
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers().AddJsonOptions(options =>
{
    options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
});
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Perry Product API",
        Version = "v1",
        Description =
            "REST for the Perry React storefront (:3000) and admin.\n\n" +
            "**Auth:** JWT from Perry Auth Service (Влада). Login/register — на Auth API, не здесь.\n\n" +
            "**Main groups:** categories, products, reviews, cart, orders, wishlist, admin/*, notify.\n\n" +
            "Users tables removed (#94). UserId comes from JWT claims (see #95)."
    });
    // Nested records like CartController.AddRequest / WishlistController.AddRequest collide on schemaId.
    c.CustomSchemaIds(t => t.FullName?.Replace("+", ".") ?? t.Name);
    c.TagActionsBy(api =>
    {
        var controller = api.ActionDescriptor.RouteValues.TryGetValue("controller", out var name)
            ? name
            : "Other";
        return new[] { controller ?? "Other" };
    });
    c.OrderActionsBy(api => $"{api.ActionDescriptor.RouteValues["controller"]}_{api.HttpMethod}_{api.RelativePath}");
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description =
            "Paste access JWT from Perry Auth Service (Swagger adds Bearer prefix). " +
            "Claim for user id: sub / nameid / userId (#95).",
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
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});

builder.Services.AddInfrastructure(builder.Configuration);
// builder.Services.AddSingleton<IJwtTokenService, JwtTokenService>();
builder.Services.AddDistributedMemoryCache();
builder.Services.AddSession(o =>
{
    o.IdleTimeout = TimeSpan.FromHours(12);
    o.Cookie.HttpOnly = true;
    o.Cookie.IsEssential = true;
});

// JWT: по умолчанию локальный HS256 (dev). Для Auth Влада — Jwt:Issuer/Audience/Key из User Secrets / env (#95).
var jwtKey = builder.Configuration["Jwt:Key"] ?? "PerryDevSecretKey_ChangeMe_32chars!!";
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "Perry";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "Perry";
var mapInbound = builder.Configuration.GetValue("Jwt:MapInboundClaims", true);

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.MapInboundClaims = mapInbound;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            RoleClaimType = builder.Configuration["Jwt:RoleClaimType"] ?? "role",
            NameClaimType = builder.Configuration["Jwt:NameClaimType"] ?? "name"
        };
    });
builder.Services.AddAuthorization();
var jwt = builder.Configuration.GetSection("Jwt").Get<JwtOptions>() ?? new JwtOptions();
if (string.IsNullOrWhiteSpace(jwt.SigningSecret))
    throw new InvalidOperationException("JWT signing secret is not configured.");

builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
        policy.WithOrigins(["https://admin.perrydev.space",
                "http://localhost:3000",
                "http://10.1.0.17:3000"
            ])
            .AllowCredentials()
            .AllowAnyHeader()
            .AllowAnyMethod());
});

// builder.Services.AddJwtAuthentication(jwt);

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy(AuthorizationPolicies.AdminAccess, policy =>
        policy.RequireAuthenticatedUser().RequireRole("Admin") );
    options.AddPolicy(AuthorizationPolicies.SellerAccess, policy =>
        policy.RequireAuthenticatedUser().RequireRole("Seller"));
});

builder.Services.AddScoped<ModelValidateActionFilter>();

var app = builder.Build();

await DbSeeder.MigrateAsync(app.Services);
if (app.Environment.IsDevelopment())
{
    await DbSeeder.SeedAsync(app.Services);
}

app.UseSwagger();
app.UseSwaggerUI(o =>
{
    o.DocumentTitle = "Perry API";
    o.SwaggerEndpoint("/swagger/v1/swagger.json", "Perry API v1");
    o.DisplayRequestDuration();
});

app.UseCors("Frontend");
app.UseSession();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
