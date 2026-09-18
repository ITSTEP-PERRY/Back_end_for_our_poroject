using System.Text;
using Perry.Api.Auth;
using Perry.Infrastructure;
using Perry.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Perry API",
        Version = "v1",
        Description =
            "REST for the Perry React storefront (:3000) and admin.\n\n" +
            "**Auth:** `POST /api/auth/login` → JWT Bearer.\n\n" +
            "**Main groups:** auth, categories, products, reviews, cart, orders, wishlist, users, admin/reviews, notify."
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
        Description = "Paste JWT only (Swagger adds the Bearer prefix). Get a token via POST /api/auth/login.",
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
builder.Services.AddSingleton<IJwtTokenService, JwtTokenService>();

var jwtKey = builder.Configuration["Jwt:Key"] ?? "PerryDevSecretKey_ChangeMe_32chars!!";
builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "Perry",
            ValidAudience = builder.Configuration["Jwt:Audience"] ?? "Perry",
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });
builder.Services.AddAuthorization();

builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
        policy.WithOrigins(
                "http://localhost:3000",
                "http://127.0.0.1:3000")
            .AllowAnyHeader()
            .AllowAnyMethod());
});

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
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
