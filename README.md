# Perry React storefront (`perry-front`)

## Быстрый запуск — две иконки

| Ярлык | Что запускает | URL |
|-------|----------------|-----|
| **Perry Desktop** | Desktop-витрина (Vite) | http://localhost:3000 |
| **Perry Mobile** | Mobile (Expo Web) | http://localhost:8081 |

После clone один раз:  
`powershell -ExecutionPolicy Bypass -File .\Install-Perry-Shortcuts.ps1`  
(иконки появятся в корне репо и на рабочем столе).

Либо двойной клик по `start-desktop.cmd` / `start-mobile.cmd` (алиасы: `Запуск-Desktop.cmd` / `Запуск-Mobile.cmd`).  
Нужен **Perry.Api** на `:5272`. Подробнее: [docs/инструкции/КАК-ЗАПУСКАТЬ.md](./docs/инструкции/КАК-ЗАПУСКАТЬ.md).  
Локальный admin: `Admin`/`Admin` через `/api/dev/admin-login` **только в Development**; в Production эндпоинта нет (#109).  
Тесты: `dotnet test Perry.sln` (#85, xUnit + SQLite in-memory).

**Отчёт 01.10.2026 (mobile Figma 1:1 + backend):** [docs/журнал/2026-10-01.md](./docs/журнал/2026-10-01.md)  
**Отчёт 02.10.2026 (DummyJSON — фото витрин):** [docs/журнал/2026-10-02.md](./docs/журнал/2026-10-02.md)  
**Отчёт 03.10.2026 (Auth · отзывы · цены · vibe-prompts):** [docs/журнал/2026-10-03.md](./docs/журнал/2026-10-03.md)  
**Отчёт 04.10.2026 (Translate · фото отзывов · checkout):** [docs/журнал/2026-10-04.md](./docs/журнал/2026-10-04.md)  
**Отчёт 04.10.2026 (вечер — аватар · имя в отзывах · админ · 401):** [docs/журнал/2026-10-04-account-avatar.md](./docs/журнал/2026-10-04-account-avatar.md)  
**Отчёт 04.10.2026 (checkout · сессия · аватар админа):** [docs/журнал/2026-10-04-checkout-admin.md](./docs/журнал/2026-10-04-checkout-admin.md)  
**Отчёт 05.10.2026 (Helpful · тесты · A14/A15 · готовность ~96%):** [docs/журнал/2026-10-05.md](./docs/журнал/2026-10-05.md)  
**Vibe-prompts (собрать Perry с нуля через ИИ):** [vibe-prompts/README.md](./vibe-prompts/README.md) · сценарий [run-vibe-sequence.cmd](./vibe-prompts/run-vibe-sequence.cmd) · [порядок агентов](./vibe-prompts/AGENTS-AND-SEQUENCE.md) · [грабли](./vibe-prompts/PITFALLS.md)  
**Как залить фото у себя:** [docs/инструкции/НАПОЛНЕНИЕ-ФОТО-DUMMYJSON.md](./docs/инструкции/НАПОЛНЕНИЕ-ФОТО-DUMMYJSON.md)

**Готовность проекта (05.10.2026, ~96%):** [docs/продукт/ГОТОВНОСТЬ-ПРОЕКТА-2026-10-04.md](./docs/продукт/ГОТОВНОСТЬ-ПРОЕКТА-2026-10-04.md) · было ~87–88% вечером 04.10 · [02.10 (~85%)](./docs/продукт/ГОТОВНОСТЬ-ПРОЕКТА-2026-10-02.md)  
**Что ещё сделать и зачем:** [docs/продукт/ЧТО-ЕЩЁ-СДЕЛАТЬ.md](./docs/продукт/ЧТО-ЕЩЁ-СДЕЛАТЬ.md)

---

Vite + React 19 витрина маркетплейса **Perry**. Визуал по макету **Figma** (приоритет №1) и эталону Razor `site.css` / `auth.css`. Данные — из `Perry.Api` (proxy `/api` → `http://localhost:5272`).

**Mobile (Expo):** папка [`mobile/`](./mobile/) · [README](./mobile/README.md) · план [docs/продукт/МОБИЛЬНОЕ-ПРИЛОЖЕНИЕ-REACT.md](./docs/продукт/МОБИЛЬНОЕ-ПРИЛОЖЕНИЕ-REACT.md) · решение [docs/продукт/РЕШЕНИЕ-MOBILE-С-КОДОМ.md](./docs/продукт/РЕШЕНИЕ-MOBILE-С-КОДОМ.md)

Backend: [Back_end_for_our_poroject](https://github.com/ITSTEP-PERRY/Back_end_for_our_poroject)  
**Figma-перепись 30.09 (~22 экрана):** [docs/журнал/2026-09-30-figma-rewrite.md](./docs/журнал/2026-09-30-figma-rewrite.md) · [чеклист](./docs/продукт/FIGMA-REWRITE-CHECKLIST.md)  
**Хроника всей работы:** [docs/ХРОНИКА-РАБОТЫ.md](./docs/ХРОНИКА-РАБОТЫ.md) · оглавление [docs/README.md](./docs/README.md)  
**Готовность проекта (срез 05.10, ~96%):** [docs/продукт/ГОТОВНОСТЬ-ПРОЕКТА-2026-10-04.md](./docs/продукт/ГОТОВНОСТЬ-ПРОЕКТА-2026-10-04.md) · [docs/продукт/ЧТО-ЕЩЁ-СДЕЛАТЬ.md](./docs/продукт/ЧТО-ЕЩЁ-СДЕЛАТЬ.md)  
**Trello (карточки):** [docs/инструкции/TRELLO-TODO.md](./docs/инструкции/TRELLO-TODO.md) · доска [ITSTEP-PERRY](https://trello.com/b/bwEYs3Kq/itstep-perry)  
**Отчёт 28.09 (весь день):** [docs/журнал/2026-09-28.md](./docs/журнал/2026-09-28.md) · срезы: [#A03–#A07](./docs/журнал/2026-09-28-a03-a07.md) · [#95 Auth](./docs/журнал/2026-09-28-auth-95.md) · [отзывы #99–#104](./docs/продукт/ОТЗЫВЫ-ПОКУПАТЕЛЕЙ.md)  
**Стыки микросервисов (для команды):** [docs/стыки/СТЫКИ-МИКРОСЕРВИСОВ.md](./docs/стыки/СТЫКИ-МИКРОСЕРВИСОВ.md) · **решение с кодом:** [docs/стыки/РЕШЕНИЕ-СТЫКОВ-С-КОДОМ.md](./docs/стыки/РЕШЕНИЕ-СТЫКОВ-С-КОДОМ.md) · **в Telegram:** [docs/стыки/СООБЩЕНИЕ-В-ЧАТ-СТЫКИ.md](./docs/стыки/СООБЩЕНИЕ-В-ЧАТ-СТЫКИ.md) · [docs/стыки/AUTH-INTEGRATION.md](./docs/стыки/AUTH-INTEGRATION.md)  
**Админка:** [docs/продукт/НАША-АДМИНКА.md](./docs/продукт/НАША-АДМИНКА.md) · [docs/продукт/РЕШЕНИЕ-ФРОНТ-АДМИН.md](./docs/продукт/РЕШЕНИЕ-ФРОНТ-АДМИН.md)  
**Срез 26.09 (#94 Auth / без Users):** [docs/журнал/2026-09-26.md](./docs/журнал/2026-09-26.md) · [docs/журнал/2026-09-26-срез.md](./docs/журнал/2026-09-26-срез.md) · [docs/стыки/AUTH-INTEGRATION.md](./docs/стыки/AUTH-INTEGRATION.md) · [docs/стыки/ВОПРОСЫ-КОМАНДЕ.md](./docs/стыки/ВОПРОСЫ-КОМАНДЕ.md) · [docs/продукт/ADMIN-КОМАНДА.md](./docs/продукт/ADMIN-КОМАНДА.md)  
**Срез 25.09 (lightbox / auth tokens / orders stats):** [docs/журнал/2026-09-25.md](./docs/журнал/2026-09-25.md) · [docs/журнал/2026-09-25-orders-stats.md](./docs/журнал/2026-09-25-orders-stats.md)  
**Спринт 19.09:** [docs/журнал/2026-09-19.md](./docs/журнал/2026-09-19.md)  
Сводка (каталог/PDP/auth): [docs/журнал/2026-09-17.md](./docs/журнал/2026-09-17.md)  
**Account:** [docs/продукт/ACCOUNT-КАБИНЕТ.md](./docs/продукт/ACCOUNT-КАБИНЕТ.md) · [docs/журнал/2026-09-17-account.md](./docs/журнал/2026-09-17-account.md)  
**Скриншоты (04.10.2026, 43 шт.):** [docs/screenshots/README.md](./docs/screenshots/README.md) · [полный каталог с подписями](./docs/screenshots/2026-10-04/README.md)

---

## Срез 30.09.2026 — перепись ~22 экранов под Figma

Закрыта перепись витрины и админки под канон **Figma Prototype**: Home, каталог, PDP, auth-flow, cart/checkout, legal, 404, account, admin (~22 уникальных экрана + состояния/модалки). Чеклист закрыт.

| Документ | О чём |
|----------|--------|
| **[ОТЧЁТ-FIGMA-REWRITE-2026-09-30.md](./docs/журнал/2026-09-30-figma-rewrite.md)** | **Отчёт: что сделано по 22 экранам** |
| [FIGMA-REWRITE-CHECKLIST.md](./docs/продукт/FIGMA-REWRITE-CHECKLIST.md) | Чеклист экранов (все 🟢) |
| [FIGMA-PAGE-INVENTORY.md](./docs/продукт/FIGMA-PAGE-INVENTORY.md) | Инвентарь node-id макета |

Ветка: `feature/figma-storefront-port`.

---

## Срез 28.09.2026 — итог дня (#A03–#A07 · #95 · #99–#104)

Полный отчёт: [ОТЧЁТ-2026-09-28.md](./docs/журнал/2026-09-28.md).

| Блок | Что |
|------|-----|
| **#A03–#A07** | Seed orders · ReviewController · checkout address/payment · `/api/health` · popular-by-user · CI green |
| **#95** | JWT HS256 secret от Auth → Product валидирует подпись (`.env`, не в git) |
| **#99–#104** | Create `POST /api/reviews` · AuthClaims UserId · unique · `GET /me` · Account «My reviews» · tags |
| Auth next | **#96** iss/aud · **#97** credential · **#98** claims |

Backend: `feature/categories-facets-figma-storefront` в [Back_end_for_our_poroject](https://github.com/ITSTEP-PERRY/Back_end_for_our_poroject). Front: `feature/figma-storefront-port`.

---

## Срез 26.09.2026 — Auth / без Users (#94)

| # | Что |
|---|-----|
| **#94** | Product API: удалены `Users`/`UserAccesses`/`UserRoles`, FK; только `UserId` из JWT Auth Service |
| **#95** | Карточка Владу: JWT claims / issuer / Internal API ([Trello](https://trello.com/c/T28F0b7e)) |
| FE | `VITE_AUTH_API_URL` + `authApi`/`usersApi` → Auth Service; каталог/корзина — Product |

Подробнее: [ОТЧЁТ-2026-09-26.md](./docs/журнал/2026-09-26-срез.md), [ИЗМЕНЕНИЯ-2026-09-26.md](./docs/журнал/2026-09-26.md), [AUTH-INTEGRATION.md](./docs/стыки/AUTH-INTEGRATION.md), [ВОПРОСЫ-КОМАНДЕ.md](./docs/стыки/ВОПРОСЫ-КОМАНДЕ.md), [СВЕСТИ-ДВЕ-ЛИНИИ.md](./docs/продукт/СВЕСТИ-ДВЕ-ЛИНИИ.md).

---

## Срез 25.09.2026 — что сделано

Кратко по закрытым карточкам и коду (ветка `feature/figma-storefront-port`). Полные тексты: [ИЗМЕНЕНИЯ-2026-09-25.md](./docs/журнал/2026-09-25.md), [ИЗМЕНЕНИЯ-2026-09-25-orders-stats.md](./docs/журнал/2026-09-25-orders-stats.md).

| # | Что |
|---|-----|
| **#41 / #43** | Общий `ImageLightbox` — fullscreen фото на PDP и в отзывах |
| **#32** | Empty state каталога (поиск/фильтры без результатов) |
| **#62** | SVG-иконки соцсетей в футере |
| **#16** | Secure Forgot — единый ответ без раскрытия email |
| **#73** | Cart API без `?userId=` (только JWT / sessionId) |
| **#93** | **Admin Orders:** статусы Ordered / Received / Shipped / ReadyToPickup / Cancelled / Returned; фильтры status + даты + orderId; `statusCounts`, `totalAmount`, `totalOrderCompare` / `totalAmountCompare` |

**Admin Orders (#93)** — экран `/admin/orders`: поиск по orderId, фильтр статуса, диапазон дат / «This month», чипы количества по статусам, % сравнения с предыдущим периодом.

Backend-пара: [Back_end_for_our_poroject](https://github.com/ITSTEP-PERRY/Back_end_for_our_poroject) (`AuthTokens` #15, admin orders API #93).

---

## Скриншоты витрины (04.10.2026)

Актуальные кадры (43 шт.): главная → каталог → товар → корзина/checkout → кабинет → auth → legal → админка.  
Таблица и полный каталог: [docs/screenshots/README.md](./docs/screenshots/README.md) · [2026-10-04](./docs/screenshots/2026-10-04/README.md).

### Главная

#### 01 · Home — hero + Trending deals

![Home hero](./docs/screenshots/2026-10-04/home/01-home-hero.png)

Hero «Sale -50%», категории, Trending deals.

#### 02 · Home — Welcome back

![Home welcome](./docs/screenshots/2026-10-04/home/02-home-welcome-cta.png)

Персональный CTA: Go to catalog / My orders.

#### 03 · Home — Women's fashion: sale

![Home sale](./docs/screenshots/2026-10-04/home/03-home-womens-fashion-sale.png)

Карусель Sale + футер.

#### 04 · Home — меню категорий

![Home menu categories](./docs/screenshots/2026-10-04/home/04-home-menu-categories.png)

Аватар + дерево категорий.

#### 05 · Home — меню аккаунта

![Home menu account](./docs/screenshots/2026-10-04/home/05-home-menu-account.png)

Cart / Orders / Wishlist / Settings / Log out.

### Каталог

#### 06 · Fashion

![Catalog Fashion](./docs/screenshots/2026-10-04/catalog/06-catalog-fashion.png)

Сетка товаров, фильтры Brand / Fabric type.

### Страница товара

#### 07 · Product page

![Product page](./docs/screenshots/2026-10-04/product/07-product-nike-pdp.png)

Nike Air Jordan 1: галерея, Buy now / Add to cart.

#### 08 · Lightbox фото

![Product lightbox](./docs/screenshots/2026-10-04/product/08-product-image-lightbox.png)

Полноэкранный просмотр (1/4).

#### 09 · Specs + отзывы на PDP

![Product specs reviews](./docs/screenshots/2026-10-04/product/09-product-specs-reviews.png)

Характеристики и блок Customer reviews.

#### 10 · Customer reviews

![Product reviews](./docs/screenshots/2026-10-04/product/10-product-reviews.png)

Рейтинг, теги, Create review, Helpful / Translate.

### Корзина и Checkout

#### 11 · Shopping cart

![Cart](./docs/screenshots/2026-10-04/cart-checkout/11-cart.png)

Позиции, Qty, Proceed to checkout.

#### 12 · Checkout — Country

![Checkout country](./docs/screenshots/2026-10-04/cart-checkout/12-checkout-country.png)

Ukraine, Card, Place order.

#### 13 · Checkout — State

![Checkout state](./docs/screenshots/2026-10-04/cart-checkout/13-checkout-state-ua.png)

Выбор области Украины.

#### 14 · Checkout — City

![Checkout city](./docs/screenshots/2026-10-04/cart-checkout/14-checkout-city.png)

Города Odesa Oblast.

#### 15 · Checkout — Card details

![Checkout card details](./docs/screenshots/2026-10-04/cart-checkout/15-checkout-card-details.png)

Номер карты, срок, CVV.

### Личный кабинет

#### 16 · Wishlist

![Wishlist](./docs/screenshots/2026-10-04/account/16-account-wishlist.png)

Избранное + аватар в сайдбаре.

#### 17 · My reviews

![My reviews](./docs/screenshots/2026-10-04/account/17-account-my-reviews.png)

Отзывы пользователя.

#### 18 · Edit photo

![Edit photo](./docs/screenshots/2026-10-04/account/18-account-edit-photo.png)

Обрезка аватара.

#### 19 · Change name

![Change name](./docs/screenshots/2026-10-04/account/19-account-change-name.png)

Смена имени / фамилии.

#### 20 · Change email

![Change email](./docs/screenshots/2026-10-04/account/20-account-change-email.png)

Новый email + код подтверждения.

#### 21 · Change password

![Change password](./docs/screenshots/2026-10-04/account/21-account-change-password.png)

Смена пароля.

### Auth

#### 22 · Login

![Login](./docs/screenshots/2026-10-04/auth/22-auth-login.png)

#### 23 · Login — ошибки

![Login errors](./docs/screenshots/2026-10-04/auth/23-auth-login-errors.png)

#### 24 · Register

![Register](./docs/screenshots/2026-10-04/auth/24-auth-register.png)

#### 25 · Register — ошибки

![Register errors](./docs/screenshots/2026-10-04/auth/25-auth-register-errors.png)

#### 26–28 · Verify email

![Verify empty](./docs/screenshots/2026-10-04/auth/26-auth-verify-empty.png)

![Verify filled](./docs/screenshots/2026-10-04/auth/27-auth-verify-filled.png)

![Verify error](./docs/screenshots/2026-10-04/auth/28-auth-verify-error.png)

#### 29–30 · Forgot password

![Forgot](./docs/screenshots/2026-10-04/auth/29-auth-forgot.png)

![Forgot error](./docs/screenshots/2026-10-04/auth/30-auth-forgot-error.png)

### Legal

#### 31 · Terms

![Terms](./docs/screenshots/2026-10-04/legal/31-terms.png)

#### 32 · License

![License](./docs/screenshots/2026-10-04/legal/32-license.png)

#### 33 · Privacy

![Privacy](./docs/screenshots/2026-10-04/legal/33-privacy.png)

### Админка

#### 34 · Dashboard

![Admin dashboard](./docs/screenshots/2026-10-04/admin/34-admin-dashboard.png)

#### 35 · Products

![Admin Products](./docs/screenshots/2026-10-04/admin/35-admin-products.png)

#### 36 · Create product

![Admin Create product](./docs/screenshots/2026-10-04/admin/36-admin-create-product.png)

#### 37 · Categories

![Admin Categories](./docs/screenshots/2026-10-04/admin/37-admin-categories.png)

#### 38 · Edit subcategory

![Admin Edit subcategory](./docs/screenshots/2026-10-04/admin/38-admin-categories-edit.png)

#### 39 · Reviews

![Admin Reviews](./docs/screenshots/2026-10-04/admin/39-admin-reviews.png)

#### 40 · Orders

![Admin Orders](./docs/screenshots/2026-10-04/admin/40-admin-orders.png)

#### 41 · Users

![Admin Users](./docs/screenshots/2026-10-04/admin/41-admin-users.png)

#### 42 · Users — Columns

![Admin Users Columns](./docs/screenshots/2026-10-04/admin/42-admin-users-columns.png)

#### 43 · Users — empty

![Admin Users empty](./docs/screenshots/2026-10-04/admin/43-admin-users-empty.png)

---

## Account — маршруты

| Маршрут | Экран |
|---------|--------|
| `/account/orders` | My orders + модалка Details |
| `/account/wishlist` | Wishlist + Remove confirm |
| `/account/reviews` | My reviews |
| `/account/settings` | Settings + модалки photo/name/password/email/logout/delete |

- Сайдбар: аватар, Customer/Admin, навигация Account
- Wishlist через API (`WishlistContext`)
- Смена email: пароль + 6-значный код

---

## Что изменено (сводка)

### Витрина под Figma
- Полный порт UI: Home, каталог, PDP, корзина, заказы, профиль, legal-страницы.
- Стили перенесены из Razor: `src/styles/storefront.css`, `src/styles/auth.css`, `src/styles/admin.css`.
- Ant Design ConfigProvider с витрины убран — разметка и классы как в макете/Razor.
- Ассеты: `public/icons/*`, `public/images/home/*`, `SiginSignup.png`.

### Home
- Hero-слайдер, карусели категорий, **Trending deals**, **Sale**.
- CTA-блок **Abundance of goods** (Sign up / Log in) — как в кадре 26 / Figma.

### Каталог `/products` (Figma Product List V2)
- Сайдбар: **Brand**, **Fabric type**, **Size**, **Color**, **Price**, **Customer reviews**.
- Сортировка, grid/list, пагинация, breadcrumbs.
- Fallback-списки брендов/тканей/цветов из макета, если API ещё без facets.
- Адаптив: кнопка Filters на mobile.

### Product page `/products/:id`
- Галерея + бейдж скидки, About product, buy-box.
- Buy-box: Status, **Delivery**, **Payment methods**, **Security**, **Returns**, qty, Buy now / Add to cart, wish list.
- **Customer reviews**: сводка, bars, Frequent tags, Helpful / Translate, See more.
- Карусели по Figma: **You may also like**, **Best sellers in {category}**.

### Auth (экраны 12–25)
| Маршрут | Экран |
|---------|--------|
| `/login` | Welcome back |
| `/register` | Create account → `/finishing-touches` |
| `/verify-code` | Send code (после 3 неудачных логинов) |
| `/forgot-password` | Forgot password |
| `/reset-password` | Reset password |
| `/finishing-touches` | First / Last name |
| `/auth/success` | Congratulations! |

### Legal
- `/terms`, `/privacy`, `/license` — полные тексты + навигация Legal notice.

### Админка React `/admin/*` (обновлено 19.09)
- Login, Dashboard, Products (список + create/edit), Categories (CRUD + inactive), **Reviews** (Hide/Approve/Delete), Orders, Users (Active/Deleted + restore).

### API-клиент
- `src/api/` — categories, products (facets/filters), auth JWT, cart session, orders.
- Контексты: `AuthContext`, `CartContext`, `RequireAuth`.

### Инфра Vite
- Proxy `/api`, `/uploads` → `:5272`.
- `server.watch.ignored` для `My_Amazon2` / backend — чтобы `dotnet build` не ронял Vite (`EBUSY`).
- `.env.example` с `VITE_API_PROXY`.

---

## Запуск

```bash
# Terminal 1 — API (из backend-репо)
cd My_Amazon2/src/Perry.Api   # или клон Back_end_for_our_poroject
dotnet run --launch-profile http
# Swagger: http://localhost:5272/swagger

# Terminal 2 — React
npm install
npm run dev
# App: http://localhost:3000
```

### Демо
- Админ: `Admin` / `Admin` → `/admin/login`
- Покупатель: `/register`

### Маршруты

| Path | Описание |
|------|----------|
| `/` | Home |
| `/products` | Каталог + фильтры |
| `/products/:id` | PDP |
| `/cart` | Корзина |
| `/account/orders` | My orders (JWT) |
| `/account/wishlist` | Wishlist (JWT) |
| `/account/settings` | Account settings (JWT) |
| `/orders`, `/profile` | Редирект → `/account/*` |
| `/login` … `/auth/success` | Auth-поток |
| `/terms`, `/privacy`, `/license` | Legal |
| `/admin/*` | Админка |

### Notes
- Cart guest: `localStorage.perry_cart_session`
- JWT: `localStorage.perry_token`
- Приоритет дизайна: **Figma** → скриншоты backend README 26–33 → Razor CSS
