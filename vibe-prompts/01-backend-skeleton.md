# 01 — Каркас Product API

[← Оглавление](./README.md) · [← 00 Vision](./00-vision.md) · **Далее:** [02 — Каталог →](./02-catalog-pdp.md)

## Зачем этот шаг

Поднятый API со Swagger, Postgres в Docker и пустыми слоями Domain/Infrastructure/Api.

## Промпт для ИИ

```text
Контекст: маркетплейс Perry. Нужен Product API на ASP.NET Core 8.

Стек:
- Solution: Perry.Domain, Perry.Infrastructure, Perry.Api
- EF Core + PostgreSQL (Docker compose: сервис postgres, БД perry)
- Clean-ish слои: Entities в Domain, DbContext/Repositories/Services в Infrastructure, Controllers в Api
- Swagger на http://localhost:5272/swagger
- Health: GET /api/health
- CORS для localhost:3000 и localhost:8081

Сделай:
1) docker-compose.yml с Postgres (user/password/db = perry).
2) AppDbContext, миграция InitialPostgreSQL (или EnsureCreated для демо — лучше миграции).
3) Базовые сущности-заготовки: Product, Category, ProductImage, Cart/CartItem, Order/OrderItem,
   ProductReview, WishlistItem. UserId везде Guid?, без FK на Users.
4) Program.cs: DI, JWT placeholder (Issuer=Perry.AuthService, Audience=Perry.Client,
   SigningSecret из env/appsettings), MapControllers, Swagger.
5) start-api.cmd: поднять docker postgres → dotnet run --project src/Perry.Api --launch-profile http.
6) .env.example с Jwt__* и ConnectionStrings__Default.

Критерии готовности: swagger открывается, /api/health = 200, БД поднимается из Docker.
Пока эндпоинты каталога можно stub'ами.
```

## Связанные шаги

- Дальше: [02 — Каталог и PDP](./02-catalog-pdp.md)
- Auth JWT подробнее: [05 — Стык с Auth](./05-auth-jwt-bridge.md)
