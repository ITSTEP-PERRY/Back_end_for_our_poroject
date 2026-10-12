# Smoke-сценарий защиты (#84)

Короткий прогон перед демо. React `:3000` + API `:5272`.

## Подготовка

```bash
# API
cd D:\Perry\My_Amazon2
$env:NUGET_PACKAGES = "D:\nuget-packages"
dotnet run --project src\Perry.Api --launch-profile http

# FE (другой терминал)
cd D:\Perry
npm run dev
```

Открыть http://localhost:3000  
Swagger: http://localhost:5272/swagger  
Админ (Razor, опционально): http://localhost:5122/Admin/Login — stub  
Админ React: http://localhost:3000/admin/login  
- Azure Auth Admin (email/пароль от команды) → Users + Product  
- локально `Admin` / `Admin` → только Product API  

Стык Auth Internal (#97): после plaintext от Влада →  
`GET http://localhost:5272/api/dev/auth-internal-status` → `tokenOk: true`  
Подробнее: [СТЫКИ-ЛОКАЛЬНО.md](../стыки/СТЫКИ-ЛОКАЛЬНО.md)

---

## #108 — Auth → Product (Bearer, без Internal)

Цель: access JWT принимается Product API на защищённых маршрутах. Internal (`#97`) **не** входит в этот чеклист.

| # | Шаг | Ожидание |
|---|-----|----------|
| 1 | `GET /api/reviews/me` без Bearer | **401** |
| 2 | Login Auth: `POST /auth-api/api/auth/login` (email/пароль Auth) **или** DEV `POST /api/dev/admin-login` Admin/Admin | JWT (`accessToken`) |
| 3 | `GET /auth-api/api/auth/me` с Bearer (только живой Auth) | 200, профиль |
| 4 | `GET /api/reviews/me` с тем же Bearer | **не 401** (200 + список) |
| 5 | `GET /api/wishlist` с Bearer | **не 401** |
| 6 | Internal (после Влада): `GET /api/dev/auth-internal-status` | `credentialConfigured: true`, `tokenOk: true` |

**Прогон 05.10.2026 (частичный, без учётки Azure Auth в среде):**

| Проверка | Результат |
|----------|-----------|
| `reviews/me` без JWT | 401 |
| DEV Admin JWT → `reviews/me` | 200 |
| DEV Admin JWT → `wishlist` | 200 |
| Auth Azure `POST /api/auth/login` | timeout/недоступен с этой машины (HTTP 0) |
| `auth-internal-status` | `credentialConfigured=true`, `tokenOk=false` (ждём регистрацию `local-service`) |

Полный `#108` с живым Auth-логином — после доступности Azure Auth + учётки команды. Internal — после ответа Влада.

---

## Чеклист (покупатель)

| # | Шаг | Ожидание |
|---|-----|----------|
| 1 | Главная | Категории с фото, карусели товаров |
| 2 | Меню ☰ | Overlay: Catalog + дерево категорий; guest → Log in / Create account |
| 3 | Register → Login | JWT, иконка Account ведёт в кабинет |
| 4 | Меню ☰ (auth) | My orders / Wishlist / Account settings / Log out |
| 5 | Catalog → товар | Галерея, About, отзывы (несколько штук) |
| 6 | Create review | Форма → Publish → отзыв в списке (**после #99–#100**; см. [ОТЗЫВЫ-ПОКУПАТЕЛЕЙ.md](./ОТЗЫВЫ-ПОКУПАТЕЛЕЙ.md)) |
| 7 | Add to cart → Cart | Qty / Remove / summary |
| 8 | Proceed to checkout | Заказ создан → `/orders/:id` |
| 9 | Account → Wishlist | Add from PDP, Remove confirm |
| 10 | Account → Settings | Name / password / email OTP / logout / delete (UI) |

## Чеклист (админ)

| # | Шаг | Ожидание |
|---|-----|----------|
| 1 | `/admin/login` | Вход Admin |
| 2 | Products / Categories / Orders / Users | Списки открываются |

## Если упало

- Пустые категории на главной → перезапуск API (сидер `EnsureShopLooksAliveAsync`)
- 401 на review/checkout → заново Login
- Корзина пустая после login → добавить товар ещё раз (guest merge)

## Связь с Trello

Топ-5 спринта: #23 меню · #50/#49/#51 корзина · #52 checkout · #44 create review · **#84 этот документ**.
