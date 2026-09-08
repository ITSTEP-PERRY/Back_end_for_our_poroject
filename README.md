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
| [docs/КАТАЛОГ-ТОВАРОВ-АРХИТЕКТУРА.md](./docs/КАТАЛОГ-ТОВАРОВ-АРХИТЕКТУРА.md) | Дизайн каталога: Product + Variants + атрибуты |
| [docs/ВОССТАНОВЛЕНИЕ-ПАРОЛЯ.md](./docs/ВОССТАНОВЛЕНИЕ-ПАРОЛЯ.md) | Forgot / Reset / Finishing touches: сценарии пользователя |
| [docs/СОВЕТЫ-И-РЕКОМЕНДАЦИИ.md](./docs/СОВЕТЫ-И-РЕКОМЕНДАЦИИ.md) | Что добить до защиты vs что на потом |
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
- **VerifyCode:** после 3 неудачных попыток входа — 6-значный код (stub SMTP), экран `/Account/VerifyCode`.
- **Forgot / Reset password:** `/Account/ForgotPassword` → `/Account/ResetPassword` → Congratulations.
- **Finishing touches** после Register + экран **Congratulations!**
- **Витрина по макету:** главная (hero-слайдер, категории, Trending deals, CTA), Product List с фильтрами, Product Page (галерея, About, buy-box, reviews, related).
- **Legal pages:** `/Terms`, `/License`, `/Privacy` + sidebar Legal notice.
- Документы: категории, архитектура каталога, восстановление пароля, советы к защите.
- Подробности: [docs/ПРОДЕЛАННАЯ-РАБОТА.md](./docs/ПРОДЕЛАННАЯ-РАБОТА.md), [docs/ВОССТАНОВЛЕНИЕ-ПАРОЛЯ.md](./docs/ВОССТАНОВЛЕНИЕ-ПАРОЛЯ.md).

## Скриншоты

Подробные описания: **[docs/screenshots/README.md](./docs/screenshots/README.md)**  
Сценарии Forgot/Reset/Finishing: **[docs/ВОССТАНОВЛЕНИЕ-ПАРОЛЯ.md](./docs/ВОССТАНОВЛЕНИЕ-ПАРОЛЯ.md)**

| Экран | Описание | Превью |
|-------|----------|--------|
| **Главная (витрина)** | Hero Sale, категории, Trending deals | ![Home storefront](./docs/screenshots/26-home-storefront.png) |
| **Product Page** | Галерея, About, buy-box, Product details | ![Product Page](./docs/screenshots/27-product-page.png) |
| **Каталог + фильтры** | Material / Size / Color, grid | ![Catalog filters](./docs/screenshots/28-catalog-filters.png) |
| **Customer reviews** | Сводка, tags, Helpful / Translate | ![Reviews](./docs/screenshots/29-product-reviews.png) |
| **Related + footer** | Fashion: sale и подвал | ![Related footer](./docs/screenshots/32-product-related-footer.png) |
| **Terms** | Terms and conditions | ![Terms](./docs/screenshots/33-terms.png) |
| **License** | License agreement | ![License](./docs/screenshots/30-license.png) |
| **Privacy** | Privacy policy | ![Privacy](./docs/screenshots/31-privacy.png) |
| Главная (ранний кадр) | Hero и категории | ![Home](./docs/screenshots/01-home.png) |
| Каталог (ранний кадр) | Product List с сайдбаром | ![Catalog](./docs/screenshots/02-catalog.png) |
| Sign in (старый кадр) | Ранний кадр входа | ![Login](./docs/screenshots/03-login.png) |
| **Welcome back** | Вход покупателя (Email / Password) | ![Welcome back](./docs/screenshots/12-auth-login.png) |
| Welcome back — ошибки | Пустые поля: сообщения валидации | ![Login errors](./docs/screenshots/13-auth-login-errors.png) |
| **Create account** | Регистрация Email + Password + Confirm | ![Create account](./docs/screenshots/14-auth-register.png) |
| Create account — ошибки | Неверный email / слабый пароль / mismatch | ![Register errors](./docs/screenshots/15-auth-register-errors.png) |
| **Send code** (пусто) | 6 полей кода после 3 fails Login | ![Send code](./docs/screenshots/16-auth-verify-empty.png) |
| Send code — ввод + таймер | Код введён, Resend 0:59 | ![Send code filled](./docs/screenshots/17-auth-verify-filled.png) |
| Send code — ошибка | Incorrect code, try again | ![Send code error](./docs/screenshots/18-auth-verify-error.png) |
| **Forgot password** | Ввод email для сброса пароля | ![Forgot password](./docs/screenshots/19-auth-forgot.png) |
| Forgot password — ошибка | Wrong or invalid email address | ![Forgot error](./docs/screenshots/20-auth-forgot-error.png) |
| **Reset password** | New password + Repeat password | ![Reset password](./docs/screenshots/21-auth-reset.png) |
| Reset password — ошибки | Necessary to continue / Passwords must match | ![Reset error](./docs/screenshots/22-auth-reset-error.png) |
| **Finishing touches** | First name + Last name после Register | ![Finishing](./docs/screenshots/23-auth-finishing.png) |
| Finishing touches — ошибки | First/Last name is required | ![Finishing error](./docs/screenshots/24-auth-finishing-error.png) |
| **Congratulations!** | Успех регистрации или сброса пароля | ![Success](./docs/screenshots/25-auth-success.png) |
| Admin Dashboard | Статистика и формы создания | ![Admin](./docs/screenshots/04-admin-dashboard.png) |
| Admin категории/товары | Таблицы категорий и товаров | ![Admin tables](./docs/screenshots/05-admin-catalog.png) |
| Admin Users | Список пользователей | ![Users](./docs/screenshots/06-admin-users.png) |
| Product Page (ранний кадр) | Карточка товара | ![PDP](./docs/screenshots/07-product-details.png) |
| Cart | Корзина | ![Cart](./docs/screenshots/08-cart-update.png) |
| Profile | Профиль покупателя | ![Profile](./docs/screenshots/09-profile.png) |
| Related / Best sellers | Похожие / бестселлеры | ![Related](./docs/screenshots/10-related-products.png) |
| Cart (несколько позиций) | Полная корзина | ![Cart full](./docs/screenshots/11-cart-full.png) |
