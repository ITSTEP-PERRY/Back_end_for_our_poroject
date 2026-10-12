# Защита — Яна Буяновская (Desktop FE + Admin UI)

**Роль:** вёрстка и UX витрины и админки по Figma (серия Y01–Y22): shell, каталог, PDP, auth-экраны, cart/checkout, account, admin products/categories/orders/reviews/users.  
**Стек:** React + Vite, Context, CSS/`ap-*`, proxy на Product/Auth/Users.

---

### Чем ты занималась?

Экраны desktop по Prototype: Home, Product List/PDP, login/signup/forgot, cart/checkout, кабинет, админка (products/categories/orders/reviews/users) + 404/legal.

### Как устроен фронт?

Vite SPA `:3000`. Состояние — Context (Auth/Cart/Wishlist), не Redux в этой линии витрины.

### Как фронт ходит на API без CORS в dev?

Vite proxy: `/api` → Product `:5272`, `/auth-api` → Auth, `/users-api` → Admin Service.

### Откуда данные товаров?

`GET /api/products`, `GET /api/products/{id}` — Product API; картинки — URL из ответа (CDN DummyJSON или абсолютный URL).

### Как админ добавляет товар и фото?

`/admin/products/new` → форма → `productsApi.create` → `POST /api/products` с `imageUrls[]` (до 10 URL). Файл с диска в текущей форме — через URL (CDN или `/uploads/...`).

### Где админ логин?

`/admin/login` — JWT с ролью Admin (Auth); в Dev возможен локальный admin-login на Product.

### Корзина гостя?

`sessionId` в localStorage → cart API → после login merge (как на бэке).

### Чем админка Users отличается от Products?

Products/Categories/Orders/Reviews → Product API. Users → Admin Service (`/users-api`), не Product DB.

### Что с мобильной версией?

Native — зона Илоны (Expo). Web-адаптив — отдельные карточки; твоя зона — desktop Figma + admin UI.

### Что показать комиссии?

Сквозной сценарий: Home → каталог/фильтры → PDP → cart → checkout; плюс один экран админки (например products или orders).
