using System.Text.Json.Serialization;
using DotNetEnv;
using Perry.Api.Auth;
using Perry.Infrastructure;
using Perry.Infrastructure.Persistence;
using Microsoft.OpenApi.Models;
using Perry.Api.Extensions;
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
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Perry API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme.",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "bearer"
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

builder.Services.AddJwtAuthentication(jwt);

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy(AuthorizationPolicies.AdminAccess, policy =>
        policy.RequireAuthenticatedUser().RequireRole("Admin") );
    options.AddPolicy(AuthorizationPolicies.SellerAccess, policy =>
        policy.RequireAuthenticatedUser().RequireRole("Seller"));
});


var app = builder.Build();

await DbSeeder.MigrateAsync(app.Services);
if (app.Environment.IsDevelopment())
{
    await DbSeeder.SeedAsync(app.Services);
}
app.UseCors("Frontend");

app.UseSwagger();
app.UseSwaggerUI();

app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
