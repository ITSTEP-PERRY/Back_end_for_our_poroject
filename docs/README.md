# Документация Perry

Маркетплейс **Perry** (диплом, зона товаров) — ASP.NET Core 8, макет Figma, паттерны из [HomeWork_25.10.2025](https://github.com/Teslyar75/HomeWork_25.10.2025.git).

| Файл | Содержание |
|------|------------|
| [ПРОДЕЛАННАЯ-РАБОТА.md](./ПРОДЕЛАННАЯ-РАБОТА.md) | Архитектура, сущности, API, витрина, админка, сервисы, миграции |
| [КЛИЕНТСКАЯ-ЧАСТЬ.md](./КЛИЕНТСКАЯ-ЧАСТЬ.md) | Дерево и зоны кода покупателя (Account / Cart / Orders / Auth) |
| [КАК-ВЫПОЛНЯТЬ-ЗАДАНИЕ.md](./КАК-ВЫПОЛНЯТЬ-ЗАДАНИЕ.md) | Как запустить, сценарии проверки, что осталось по желанию |
| [ИНТЕГРАЦИЯ-HOMEWORK-АДМИНКА.md](./ИНТЕГРАЦИЯ-HOMEWORK-АДМИНКА.md) | Что перенесено из homework → Perry |

---

## Быстрый старт

```bash
cd D:\Perry\My_Amazon2
dotnet run --project src/Perry.Web --launch-profile http
```

Открывай именно **http://localhost:5122/** (не `https://`). В Development HTTPS-редирект отключён.

| Что | URL / данные |
|-----|----------------|
| Витрина | http://localhost:5122/ |
| Каталог | http://localhost:5122/Products |
| Админка | http://localhost:5122/Admin/Login — **`Admin` / `Admin`** |
| Покупатель | `/Account/Register` → Login; после 3 fails → `/Account/VerifyCode` |
| API + Swagger | `dotnet run --project src/Perry.Api` → порт из консоли `/swagger` |

БД: `(localdb)\mssqllocaldb` → **`Perry`**.

---

## Скриншоты

Каталог картинок с подписями: **[screenshots/README.md](./screenshots/README.md)**

| # | Экран | Файл |
|---|--------|------|
| 1 | Главная | [01-home.png](./screenshots/01-home.png) |
| 2 | Каталог + фильтры | [02-catalog.png](./screenshots/02-catalog.png) |
| 3 | Sign in | [03-login.png](./screenshots/03-login.png) |
| 4 | Admin Dashboard | [04-admin-dashboard.png](./screenshots/04-admin-dashboard.png) |
| 5 | Admin категории/товары | [05-admin-catalog.png](./screenshots/05-admin-catalog.png) |
| 6 | Admin Users | [06-admin-users.png](./screenshots/06-admin-users.png) |
| 7 | Product Page | [07-product-details.png](./screenshots/07-product-details.png) |
| 8 | Cart (update) | [08-cart-update.png](./screenshots/08-cart-update.png) |
| 9 | Profile | [09-profile.png](./screenshots/09-profile.png) |
| 10 | Related products | [10-related-products.png](./screenshots/10-related-products.png) |
| 11 | Cart (full) | [11-cart-full.png](./screenshots/11-cart-full.png) |
| 12 | Welcome back | [12-auth-login.png](./screenshots/12-auth-login.png) |
| 13 | Welcome back — ошибки | [13-auth-login-errors.png](./screenshots/13-auth-login-errors.png) |
| 14 | Create account | [14-auth-register.png](./screenshots/14-auth-register.png) |
| 15 | Create account — ошибки | [15-auth-register-errors.png](./screenshots/15-auth-register-errors.png) |
| 16 | Send code (пусто) | [16-auth-verify-empty.png](./screenshots/16-auth-verify-empty.png) |
| 17 | Send code — ввод + таймер | [17-auth-verify-filled.png](./screenshots/17-auth-verify-filled.png) |
| 18 | Send code — ошибка | [18-auth-verify-error.png](./screenshots/18-auth-verify-error.png) |
