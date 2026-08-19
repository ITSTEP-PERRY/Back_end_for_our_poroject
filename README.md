# Perry

Дипломный маркетплейс **Perry** на **ASP.NET Core 8** — витрина + админка + REST API.
Рабочее название совпадает с фронтом команды: [perry-front](https://github.com/ITSTEP-PERRY/perry-front.git).
Проекты решения: `Perry.Domain`, `Perry.Infrastructure`, `Perry.Web`, `Perry.Api`.

## Документация

Этот README — краткий обзор. **Подробности по архитектуре, клиентской части, запуску и интеграциям** лежат в папке **[docs/](./docs/)** (начни с [docs/README.md](./docs/README.md)).

| Файл | О чём |
|------|--------|
| [docs/README.md](./docs/README.md) | Оглавление и быстрый старт |
| [docs/ПРОДЕЛАННАЯ-РАБОТА.md](./docs/ПРОДЕЛАННАЯ-РАБОТА.md) | Архитектура, сущности, API, витрина, чеклист |
| [docs/КАТЕГОРИИ.md](./docs/КАТЕГОРИИ.md) | Categories: таблица, seed, JSON API, витрина |
| [docs/КЛИЕНТСКАЯ-ЧАСТЬ.md](./docs/КЛИЕНТСКАЯ-ЧАСТЬ.md) | Дерево Account / Cart / Orders / Auth (покупатель) |
| [docs/КАК-ВЫПОЛНЯТЬ-ЗАДАНИЕ.md](./docs/КАК-ВЫПОЛНЯТЬ-ЗАДАНИЕ.md) | Запуск, smoke-тесты, что доделать по желанию |
| [docs/ИНТЕГРАЦИЯ-HOMEWORK-АДМИНКА.md](./docs/ИНТЕГРАЦИЯ-HOMEWORK-АДМИНКА.md) | Что перенесено из homework |

## Запуск

```bash
dotnet run --project src/Perry.Web --launch-profile http
```

Открывай **http://localhost:5122/** (не https — иначе браузер может показать «нет доступа»).

- Админ: `/Admin/Login` — `Admin` / `Admin`  
- API: `dotnet run --project src/Perry.Api` → `/swagger`

БД: `(localdb)\mssqllocaldb` → `Perry`.

## Что сделано недавно

- Ребрендинг **DuSoleil → Perry** (solution, проекты, namespaces, БД, UI).
- UI входа и регистрации по макету команды ([perry-front](https://github.com/ITSTEP-PERRY/perry-front.git)): Welcome back + Create account, валидация полей.
- **VerifyCode:** после 3 неудачных попыток входа — 6-значный код (stub SMTP / опционально Gmail), экран `/Account/VerifyCode`.
- Подробности: [docs/ПРОДЕЛАННАЯ-РАБОТА.md](./docs/ПРОДЕЛАННАЯ-РАБОТА.md) §11.

## Скриншоты

Подробные описания: **[docs/screenshots/README.md](./docs/screenshots/README.md)**

| Экран | Превью |
|-------|--------|
| Главная | ![Home](./docs/screenshots/01-home.png) |
| Каталог + фильтры | ![Catalog](./docs/screenshots/02-catalog.png) |
| Sign in (старый кадр) | ![Login](./docs/screenshots/03-login.png) |
| **Welcome back** | ![Welcome back](./docs/screenshots/12-auth-login.png) |
| Welcome back — ошибки | ![Login errors](./docs/screenshots/13-auth-login-errors.png) |
| **Create account** | ![Create account](./docs/screenshots/14-auth-register.png) |
| Create account — ошибки | ![Register errors](./docs/screenshots/15-auth-register-errors.png) |
| **Send code** (пусто) | ![Send code](./docs/screenshots/16-auth-verify-empty.png) |
| Send code — ввод + таймер | ![Send code filled](./docs/screenshots/17-auth-verify-filled.png) |
| Send code — ошибка | ![Send code error](./docs/screenshots/18-auth-verify-error.png) |
| Admin Dashboard | ![Admin](./docs/screenshots/04-admin-dashboard.png) |
| Admin категории/товары | ![Admin tables](./docs/screenshots/05-admin-catalog.png) |
| Admin Users | ![Users](./docs/screenshots/06-admin-users.png) |
| Product Page + Add to cart | ![PDP](./docs/screenshots/07-product-details.png) |
| Cart | ![Cart](./docs/screenshots/08-cart-update.png) |
| Profile | ![Profile](./docs/screenshots/09-profile.png) |
| Related / Best sellers | ![Related](./docs/screenshots/10-related-products.png) |
| Cart (несколько позиций) | ![Cart full](./docs/screenshots/11-cart-full.png) |
