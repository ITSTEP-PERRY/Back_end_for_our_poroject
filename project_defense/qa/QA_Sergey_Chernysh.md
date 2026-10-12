# Защита — Сергей Черныш (Product API)

**Роль:** бэкенд Product API (`Perry.Api` / Domain / Infrastructure), PostgreSQL, JWT как resource server, стыки с Auth, seed каталога, CORS под mobile.  
**Репо:** [Teslyar75/My_Amazon2](https://github.com/Teslyar75/My_Amazon2) · org `Back_end_for_our_poroject`.

---

### Чем ты занимался в проекте?

Product API: каталог, корзина, заказы, отзывы, wishlist, админ-эндпоинты Product, EF + PostgreSQL, DbSeeder (DummyJSON), Docker, health, стык JWT с Auth (#73/#94/#95).

### Почему три бэкенда, а не один?

Auth — личность и пароли; Product — торговля; Admin Service — CRUD пользователей. Product не хранит Users (#94).

### Как узнаёте покупателя без таблицы Users?

Из JWT claim `sub` → Guid (`AuthClaims`). Пишем в Order / Wishlist / Review.

### Что будет, если подставить чужой userId в query?

Закрыто в #73: userId только из токена, query не доверяем.

### Как связан секрет Auth и Product?

Общий HS256 `Jwt__SigningSecret`, Issuer/Audience согласованы. Секрет только в env.

### Где бизнес-логика?

В Infrastructure Services + Domain. Контроллер — HTTP-адаптер.

### Почему PostgreSQL?

Командный стандарт, Docker/облако; миграция с SQL Server — #A08.

### Что такое Internal Auth (#97)?

Service-to-service: Product берёт service-token и читает профиль у Auth, не копируя Users.

### Как наполняли каталог реальными фото?

DbSeeder тянет DummyJSON (`dummyjson.com` или встроенный JSON) → CDN URL `cdn.dummyjson.com` → строки в `ProductImages`. Подробности и схема — DEFENSE_BACKEND §10 «Медиа».

### Как добавляется новый товар?

`POST /api/products` с ролью Admin/Seller + JWT; картинки — массив URL (`imageUrls` / `Images`). Админ-форма React шлёт те же поля.

### Как устроена гостевая корзина?

`sessionId` (UUID) → `/api/cart?sessionId=` → после login `merge` в user-корзину.

### Что отдаёте mobile?

Тот же `/api` и JWT; CORS/`10.0.2.2`/LAN; инструкция MB01.

### Как проверить, что API живой?

`GET /api/health` → 200; Swagger на `:5272`.

### Что в Done из твоего объёма (коротко)?

Solution + EF + seeder + Docker; REST catalog/cart/orders; JWT без query userId; reviews #99–#104; PG #A08; seller/order fields #A11–#A13; wishlist/stats; health.
