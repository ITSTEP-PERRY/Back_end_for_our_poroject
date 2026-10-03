# Известные сложности Perry (обязательно к прочтению)

[← Оглавление](./README.md)

Это не теория — это то, на чём команда уже спотыкалась.  
Перед крупным шагом копируй блок **«Промпт-предохранитель»** в чат с ИИ.

Связанные шаги: [05 Auth](./05-auth-jwt-bridge.md) · [07 Auth UI](./07-desktop-auth-ui.md) · [03 Cart](./03-cart-checkout-orders.md) · [04 Reviews](./04-reviews-wishlist.md) · [10 Figma](./10-figma-polish.md) · [09 Mobile](./09-mobile-expo.md)

---

## 1. Дизайн / Figma

| Боль | Почему больно | Что делать |
|------|----------------|------------|
| Desktop 1920 vs 17–19″ | В макете pad ~160px; на меньших мониторах контент «липнет» к краям | CSS `--home-pad: clamp(...)`, не хардкод 160 везде |
| Карточки товаров режут цену | `max-height: 356px` + `overflow: hidden` + крупный `clamp()` шрифт → точка в `$129.99` пропадает, цифры обрезаны | Не фиксируй высоту жёстче контента; `price` с `flex-shrink: 0`, `white-space: nowrap` |
| Footer «разъезжается» | `space-between` на всю ширину ≠ Figma (колонки группой по центру) | Центрировать Support/Legal/Social + copyright bar |
| Sandwich menu | Гость vs user, иконки категорий из Figma легко забыть | Отдельные блоки Not signed in / user info + category icons |
| Mobile ≠ Desktop UI | Отдельные iPhone frames; модалки login/register поверх dim backdrop | Не переносить desktop layout 1:1 в RN |
| Create review modal | Счётчики `0 / 60`, tags chips, photos `0/10` — легко сделать «просто форму» | Держать структуру как в Figma node Create review |

---

## 2. Auth и роли

| Боль | Почему больно | Что делать |
|------|----------------|------------|
| Register «упрощённый» | Auth ждёт `{ email, password, confirmPassword }`, потом verify + complete | Multi-step UI; register **не** возвращает JWT |
| JWT без name | В токене часто только `sub`, `email`, `role` | Не бери `Identity.Name` — при `NameClaimType=sub` это UUID |
| Отзыв с UUID вместо ника | AuthorName = sub | `GetDisplayName` отклоняет GUID; fallback email / Auth Internal / "Customer" |
| «Нужен Admin для отзыва» | Фронт на любой Product 401 писал «log in again as Admin» | Разные тексты 401: product ≠ users-admin |
| Admin/Admin vs Azure Admin | DEV логин выдаёт **другой** UserId, чем Auth Admin | Один DEV Guid на desktop+mobile; объяснить команде |
| Корзина «разная» | `perry_cart_session` localStorage vs SecureStore; разный UserId | Merge по UserId; одинаковый DEV admin id |

Контракт Auth register (запомни):

```text
register → verify-email → complete-registration → login
```

---

## 3. Архитектура и стыки

| Боль | Почему больно | Что делать |
|------|----------------|------------|
| Users в Product | Исторически хотели таблицу Users | Users только Auth/Admin Service; Product хранит Guid |
| CORS с Azure Auth | Браузер с localhost не ходит на Azure напрямую | Vite/Metro proxy `/auth-api`, `/users-api` |
| Android emulator | `localhost` — это сам эмулятор | `10.0.2.2` или LAN IP |
| Две линии фронта | Старый antd/Redux vs рабочая Figma-витрина | Не смешивать; source of truth — `frontend/` storefront |
| Один отзыв на товар | Unique (userId, productId) → 409 | Понятное сообщение, не «Unauthorized» |
| Фото | DummyJSON CDN vs `/uploads` | `resolveMediaUrl` на FE/mobile |

---

## Промпт-предохранитель для ИИ

Скопируй в чат **перед** реализацией Auth, reviews, cart или Figma-polish:

```text
Учти жёсткие грабли проекта Perry (уже ловили в проде/демо):

DESIGN
- Home side pads: clamp для 17–19″, на 1920 ≈ 160px.
- Product card: не режь цену overflow/max-height — decimal point должен быть виден.
- Footer: колонки по центру, не space-between на всю ширину.
- Mobile auth: card-modal на dim backdrop, не desktop layout.
- Create review: stars, title≤60, body≤1000, tag chips, photos 0/10.

AUTH
- Register только { email, password, confirmPassword } → verify-email → complete-registration → login.
- Register response ≠ AuthResponse (нет accessToken).
- JWT часто без name; NameClaimType=sub → Identity.Name = UUID — НЕ писать в AuthorName/UI.
- Product 401 ≠ «log in as Admin». Admin нужен только admin/users API.
- DEV Admin/Admin → Product /dev/admin-login с ФИКСИРОВАННЫМ Guid на desktop и mobile.

CART
- Guest sessionId в storage; после login — merge.
- Разный UserId = разная корзина (частая путаница Admin DEV vs Auth user).

REVIEWS
- 1 review per (userId, productId) → 409.
- AuthorName human-readable; FE: если authorName похож на GUID и это текущий user — покажи user.name.

STACK
- No Users table in Product DB.
- Proxy /api /auth-api /users-api in Vite; Expo web same idea; Android 10.0.2.2.
- UI copy English.

Не повторяй эти ошибки. Если сомневаешься — явно напиши, какое решение выбираешь.
```

---

## Куда вставлять в поток

| После шага | Зачем |
|------------|--------|
| [05](./05-auth-jwt-bridge.md) | JWT / display name |
| [07](./07-desktop-auth-ui.md) | multi-step register |
| [03](./03-cart-checkout-orders.md) / [09](./09-mobile-expo.md) | корзина sync |
| [04](./04-reviews-wishlist.md) | AuthorName + 401 |
| [10](./10-figma-polish.md) | цены, footer, pads |
