# Frontend Routes — Perry

**Изображения:** `diagram.png` (для слайдов) · `diagram.mmd` · `diagram.svg`

---

## Что изображено

Маршруты React Router 7 (`src/app/router.tsx`).

### Витрина (`AppShell`)

| Path | Страница |
|------|----------|
| `/` | Home |
| `/products`, `/products/:id` | Каталог / PDP |
| `/cart` | Корзина |
| `/terms`, `/privacy`, `/license` | Юр. страницы |
| `/account/*` | Кабинет (RequireAuth) |

### Auth (`AuthShell`)

`/login`, `/register`, `/forgot-password`, `/verify-code`, `/reset-password`, …

### Admin

| Path | Страница |
|------|----------|
| `/admin/login` | Вход |
| `/admin` | Dashboard |
| `/admin/products` | Товары |
| `/admin/categories` | Категории |
| `/admin/reviews` | Модерация отзывов |
| `/admin/orders` | Заказы |
| `/admin/users` | Пользователи (Admin Service) |

`AdminShell` редиректит на login, если `!isAdmin`.

---

## Как это работает

1. Публичные страницы доступны гостю.
2. `/account/*` — только с JWT (`RequireAuth` → `/login`).
3. `/admin/*` — только role Admin (DEV Admin или Auth Admin).
4. Legacy `/orders`, `/profile` → редирект в account.
