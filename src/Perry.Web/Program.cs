using Perry.Infrastructure;
using Perry.Infrastructure.Persistence;
using Perry.Web.Middleware;

// Витрина + админка (паттерн из homework HomeWork_25.10.2025).

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddRazorPages();
builder.Services.AddInfrastructure(builder.Configuration);

// Session-auth как в homework
builder.Services.AddDistributedMemoryCache();
builder.Services.AddSession(options =>
{
    options.IdleTimeout = TimeSpan.FromHours(8);
    options.Cookie.HttpOnly = true;
    options.Cookie.IsEssential = true;
});
builder.Services.AddHttpContextAccessor();

var app = builder.Build();

// await DbSeeder.SeedAsync(app.Services);

if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Error");
    app.UseHsts();
    app.UseHttpsRedirection();
}

app.UseStaticFiles();
app.UseRouting();
app.UseSession();
app.UseAuthSession(); // ClaimsPrincipal из Session["SignIn"]
app.UseAuthorization();
app.MapRazorPages();

app.Run();
