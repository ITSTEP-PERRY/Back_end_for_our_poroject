using Perry.Infrastructure;
using Perry.Infrastructure.Persistence;

// Точка входа ASP.NET Core Web API.
// Здесь собирается «конвейер» приложения: сервисы → middleware → запуск.

var builder = WebApplication.CreateBuilder(args);

// --- Регистрация сервисов (DI) ---
builder.Services.AddControllers();          // Controllers + маршрутизация API
builder.Services.AddEndpointsApiExplorer(); // Нужно для Swagger
builder.Services.AddSwaggerGen();           // UI документации API (/swagger)
builder.Services.AddInfrastructure(builder.Configuration); // EF Core + SQL Server

var app = builder.Build();

//await DbSeeder.SeedAsync(app.Services);

// --- HTTP pipeline ---
// В Development открываем Swagger, чтобы удобно тестировать endpoints
 app.UseSwagger();
 app.UseSwaggerUI();


app.UseHttpsRedirection(); // HTTP → HTTPS
app.UseAuthorization();    // Позже сюда же подключится Auth (JWT и т.д.)
app.MapControllers();      // Подключает все [ApiController]

app.Run();
