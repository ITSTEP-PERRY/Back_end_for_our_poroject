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
Админ (Razor, опционально): http://localhost:5122/Admin/Login — `Admin` / `Admin`

---

## Чеклист (покупатель)

| # | Шаг | Ожидание |
|---|-----|----------|
| 1 | Главная | Категории с фото, карусели товаров |
| 2 | Меню ☰ | Overlay: Catalog + дерево категорий; guest → Log in / Create account |
| 3 | Register → Login | JWT, иконка Account ведёт в кабинет |
| 4 | Меню ☰ (auth) | My orders / Wishlist / Account settings / Log out |
| 5 | Catalog → товар | Галерея, About, отзывы (несколько штук) |
| 6 | Create review | Форма → Publish → отзыв в списке |
| 7 | Add to cart → Cart | Qty / Remove / summary |
| 8 | Proceed to checkout | Заказ создан → `/account/orders?open=…` + модалка Details |
| 8a | Login после guest-корзины | Позиции остаются (merge `POST /api/cart/merge`) |
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
