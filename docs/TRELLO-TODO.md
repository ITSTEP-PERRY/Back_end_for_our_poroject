# Trello ToDo — Perry (по макету Figma)

Документ для переноса на доску **Trello**.  
Источник макета: [Дипломна робота (Copy)](https://www.figma.com/design/cF0bKFsmenH6rrshGV0yO7/) · страница `Wireframe`.  
Оригинал комиссии (нужен edit): [Дипломна робота](https://www.figma.com/design/4d4a4NOMFigwJbKMlOpL2n/).

**Как пользоваться**
1. Создайте доску: колонки `Backlog` → `To Do` → `In Progress` → `Review` → `Done`.
2. Создайте карточку на каждую задачу ниже (номер = ID карточки).
3. Метки (labels): `FE` · `BE` · `Admin` · `Mobile` · `Design` · `Docs` · `P0` / `P1` / `P2`.
4. Статус — синхронизирован с доской **ITSTEP-PERRY** на **25.09.2026**.

Легенда статуса: ✅ Done · 🟡 Partial · ⬜ To Do / Backlog · 🚫 Blocked · 🔵 In Progress · 🟣 Review

Срез дня: [ИЗМЕНЕНИЯ-2026-09-25.md](./ИЗМЕНЕНИЯ-2026-09-25.md)

---

## Предлагаемые списки (колонки Trello)

| Колонка | Смысл |
|---------|--------|
| **Done** | Уже закрыто |
| **To Do / Sprint** | Ближайшие задачи к защите и демо |
| **Backlog** | По макету есть, но не блокер защиты |
| **Blocked** | Нужен доступ / решение команды |
| **Review** | Код готов, ждёт ревью/мерж |

---

## Epic A. Инфраструктура и бренд

| # | Задача | Метки | Статус | Figma / примечание |
|---|--------|-------|--------|--------------------|
| **1** | Solution ASP.NET Core 8: Domain + Infrastructure + Web + Api | BE | ✅ | — |
| **2** | EF Core модель, миграции, LocalDB `Perry` | BE | ✅ | — |
| **3** | DbSeeder: категории, товары, отзывы, атрибуты | BE | ✅ | — |
| **4** | Ребрендинг DuSoleil → **Perry** (namespaces, UI, БД) | FE BE Docs | ✅ | — |
| **5** | Docker / docker-compose / env для команды | BE Docs | ✅ | `docker-compose`, `.env.example`, гайд |
| **6** | Получить **edit** на оригинал Figma комиссии для MCP/пиксель-сверки | Design | 🚫 | Blocked · `4d4a4NOMFigwJbKMlOpL2n` |

---

## Epic B. Auth (покупатель) — макеты Login / Sign up

| # | Задача | Метки | Статус | Figma |
|---|--------|-------|--------|-------|
| **7** | Welcome back — `/Account/Login` | FE BE | ✅ | `Desktop - Log In` |
| **8** | Create account — `/Account/Register` | FE BE | ✅ | `Desktop - Sing Up (create account)` |
| **9** | Send code / VerifyCode после 3 fails | FE BE | ✅ | `Desktop - Sing Up (sent code)` · mobile `Send code` |
| **10** | Finishing touches (имя/фамилия) | FE BE | ✅ | `Desktop - Sing Up (finish)` |
| **11** | Congratulations / AuthSuccess | FE | ✅ | — |
| **12** | Forgot password | FE BE | ✅ | `Desktop - Forgot password` |
| **13** | Reset password | FE BE | ✅ | — |
| **14** | Реальный SMTP (Gmail App Password), без stub | BE P1 | ✅ | Гайд SMTP; на демо можно stub + речь |
| **15** | Хранить коды/токены в БД (не только MemoryCache) | BE P1 | ✅ | `AuthTokens` · миграция `AddAuthTokens` (25.09) |
| **16** | Безопасный Forgot: единый ответ «если email есть — отправили» | BE P2 | ✅ | FE + API + Razor (25.09) |

---

## Epic C. Главная (Desktop - Main)

| # | Задача | Метки | Статус | Figma |
|---|--------|-------|--------|-------|
| **17** | Header: menu, PERRY, Search, Account, Cart | FE | ✅ | `Desktop - Main V3.x` |
| **18** | Hero-слайдер с рабочими стрелками (баннеры без baked-in UI) | FE | ✅ | Main V3 |
| **19** | Карусели категорий (2 ряда) | FE BE | ✅ | Main |
| **20** | Trending deals + Sale карусели | FE BE | ✅ | Main |
| **21** | CTA «Abundance of goods» + Sign up / Log in | FE | ✅ | Main |
| **22** | Back to top + footer (Support / Legal / Social) | FE | ✅ | Social icons — #62 |
| **23** | Меню каталога (overlay): без аккаунта / с аккаунтом customer | FE P0 | ✅ | Menu with/without account |
| **24** | Состояния главной: authorized vs guest (разный CTA/меню) | FE P1 | ✅ | Main auth / no auth |
| **25** | Реальные изображения товаров вместо picsum seed | Design BE P1 | ⬜ | Backlog |

---

## Epic D. Product List (каталог)

| # | Задача | Метки | Статус | Figma |
|---|--------|-------|--------|-------|
| **26** | Страница `/Products` + breadcrumbs | FE BE | ✅ | `Desktop - Product List Page V2` |
| **27** | Фильтры: Brand, Fabric/Material, Size, Color, Price, Reviews | FE BE | ✅ | Product List V2 |
| **28** | «N filters applied», sort, grid/list, pagination | FE | ✅ | Product List V2 |
| **29** | Out of stock + кнопка Notify when available (UI) | FE | ✅ | — |
| **30** | Backend «Notify when available» (email/подписка) | BE P1 | ✅ | `StockNotifyRequests` |
| **31** | Поиск из header → каталог с query | FE BE | ✅ | Search bar |
| **32** | Пустой результат поиска / фильтров (empty state по макету) | FE P2 | ✅ | 25.09 |

---

## Epic E. Product Page (PDP)

| # | Задача | Метки | Статус | Figma |
|---|--------|-------|--------|-------|
| **33** | Базовая PDP: галерея, About, buy-box, details | FE BE | ✅ | `Desktop - Product Page (without options)` |
| **34** | Customer reviews: summary, tags, filters, Create review | FE BE | ✅ | Список/теги/create |
| **35** | Related + Fashion: sale карусели | FE BE | ✅ | низ PDP |
| **36** | Модалка / экран **Delivery** | FE P1 | ✅ | `Desktop - Product Page (delivery)` |
| **37** | Модалка **Payment methods** | FE P1 | ✅ | `(payment methods)` |
| **38** | Модалка **Security** | FE P1 | ✅ | `(security)` |
| **39** | Модалка **Returns** | FE P1 | ✅ | `(returns)` |
| **40** | Блок / модалка **About seller** | FE BE P1 | ✅ | `(about seller)` |
| **41** | Lightbox фото товара | FE P1 | ✅ | `ImageLightbox` (25.09) |
| **42** | Видео товара в галерее | FE BE P2 | ⬜ | Backlog · `(good's video)` |
| **43** | Открыть фото в комментариях (lightbox отзыва) | FE P1 | ✅ | тот же lightbox (25.09) |
| **44** | Create review — полный UX по макету (рейтинг UI, теги, фото) | FE BE P0 | ✅ | `(create review)` |
| **45** | Helpful / Translate — рабочая логика (не только кнопки) | FE BE P2 | ⬜ | Backlog |
| **46** | Wish list (Add to wish list) | FE BE P1 | ✅ | buy-box + API #91 |
| **47** | Варианты товара (size/color options), если появятся в финальном макете | FE BE P2 | 🚫 | Blocked · ждём макет / #6 |

---

## Epic F. Cart & Checkout

| # | Задача | Метки | Статус | Figma |
|---|--------|-------|--------|-------|
| **48** | Корзина guest + user + merge | FE BE | ✅ | `Desktop - Cart` / `Cart V2` |
| **49** | Cart empty state | FE | ✅ | `Cart - no items` |
| **50** | Cart V2 full view (пиксель под макет) | FE P0 | ✅ | `Desktop - Cart V2 - full view` |
| **51** | Cart для неавторизованного (CTA Log in) | FE P1 | ✅ | `Cart V2 - not logged in` |
| **52** | Checkout / оформление заказа по макету (если кадр есть у команды) | FE BE P0 | ✅ | Заказ в коде |
| **53** | Страница заказов покупателя `/Orders` | FE BE | ✅ | — |
| **54** | Buy again | FE BE | ✅ | — |

---

## Epic G. Account / Profile

| # | Задача | Метки | Статус | Figma |
|---|--------|-------|--------|-------|
| **55** | Profile: просмотр / edit / soft-delete | FE BE | ✅ | — |
| **56** | Recently viewed | FE BE | ✅ | — |
| **57** | Страница / вкладка Wish list | FE BE P1 | ✅ | связано с #46/#91 |
| **58** | История заказов UI ближе к макету | FE P2 | ✅ | — |
| **89** | Account shell: Wishlist / My orders / Settings | FE BE | ✅ | React + API |

---

## Epic H. Legal

| # | Задача | Метки | Статус | Figma |
|---|--------|-------|--------|-------|
| **59** | Terms and conditions | FE Docs | ✅ | `Desktop - Terms and conditions` |
| **60** | License agreement | FE Docs | ✅ | `Desktop - License agreement` |
| **61** | Privacy policy | FE Docs | ✅ | `Desktop - Privacy policy` |
| **62** | Иконки Social media в футере (вместо плейсхолдеров) | FE Design P2 | ✅ | SVG (25.09) |

---

## Epic I. Admin panel

| # | Задача | Метки | Статус | Figma |
|---|--------|-------|--------|-------|
| **63** | Admin Log in | FE BE | ✅ | `Desktop - Admin panel: Log in` |
| **64** | Dashboard (статистика + быстрые формы) | FE BE | ✅ | — |
| **65** | Admin Category: CRUD, subcategory, delete/edit | FE BE | ✅ | Category create/edit/delete |
| **66** | Admin Product: create/edit/choose category | FE BE | ✅ | `Admin panel: Product` |
| **67** | Admin Orders list | FE BE | ✅ | `Admin panel: Order (default)` |
| **68** | Admin Users: роли, delete/restore, фильтры статусов | FE BE | ✅ | серия `User (…)` |
| **69** | Admin Reviews moderation | FE BE P1 | ✅ | `Admin panel: Reviews (default)` |
| **70** | Архивация / restore товаров, deactivate category | BE | ✅ | — |

---

## Epic J. API

| # | Задача | Метки | Статус | Figma |
|---|--------|-------|--------|-------|
| **71** | REST: categories / products GET+POST+DELETE | BE | ✅ | — |
| **72** | REST: cart + checkout | BE | ✅ | — |
| **73** | JWT / cookie auth для API (убрать query `userId`) | BE P1 | ✅ | Cart: userId только из JWT (25.09) |
| **74** | PUT category/product через API | BE P2 | ⬜ | Backlog |
| **75** | API отзывов отдельным ресурсом | BE P2 | ⬜ | Backlog |
| **76** | Swagger актуализировать под финальные контракты | BE Docs P2 | ✅ | — |

---

## Epic K. Mobile (макеты iPhone)

| # | Задача | Метки | Статус | Figma |
|---|--------|-------|--------|-------|
| **77** | Адаптив главной (mobile Main) | FE Mobile P1 | ✅ | `iPhone … - Main` |
| **78** | Mobile Product List | FE Mobile P1 | ✅ | `iPhone … - Product List Page` |
| **79** | Mobile Product Page (swipe / see more) | FE Mobile P1 | ⬜ | Backlog · делает другой |
| **80** | Mobile Log in / Sign up / Send code | FE Mobile | ✅ | `Sign up & Log in - Mobile` |
| **81** | Mobile Menu (account / no account) | FE Mobile P1 | ⬜ | Backlog · делает другой |
| **82** | Mobile PDP: delivery / payment / returns / seller sheets | FE Mobile P2 | 🚫 | Blocked · после #79 |

---

## Epic L. Качество, ошибки, защита

| # | Задача | Метки | Статус | Figma |
|---|--------|-------|--------|-------|
| **83** | Страница Error 404 по макету | FE P1 | ✅ | `Desktop - Error 404` |
| **84** | Smoke-сценарий защиты (Register→Login→Buy→Admin) | Docs P0 | ✅ | `SMOKE-ЗАЩИТА.md` |
| **85** | Unit / integration тесты критичных сервисов | BE P2 | ⬜ | Backlog |
| **86** | Актуализировать скриншоты README (уже 01–33) | Docs | ✅ | `docs/screenshots` |
| **87** | Документ «проделанная работа» § витрина | Docs | ✅ | хроника / проделанная работа |
| **88** | Речь на 1 мин про stub SMTP / демо-дыры | Docs P0 | ✅ | `РЕЧЬ-SMTP-ДЕМО.md` |
| **92** | Графические слайды: обзор проекта и узлы | Docs Design P0 | ⬜ | To Do на доске |

---

## Epic M. Product analytics & wishlist (сент. 2026)

| # | Задача | Метки | Статус | Примечание |
|---|--------|-------|--------|------------|
| **90** | Product API: statistics (views / popular / orders) | BE | 🟣 | Код ✅ · на доске Review |
| **91** | Product Wishlist: CRUD + admin stats по месяцам | FE BE Admin | 🟣 | Код ✅ · на доске Review |

---

## Состояние доски (25.09.2026)

| Колонка | Номера |
|---------|--------|
| **Done** | 1–5, 7–24, 26–41, 43–44, 46, 48–73, 76–78, 80, 83–84, 86–89 |
| **Review** | 90, 91 |
| **To Do** | 92 |
| **Backlog** | 25, 42, 45, 74, 75, 79, 81, 85 |
| **Blocked** | 6, 47, 82 |
| **In Progress** | — |

### Приоритеты оставшегося

| Tier | Задачи | Зачем |
|------|--------|-------|
| **P0** | **#92** слайды | Речь/демо на защите |
| **P1** | **#81** / **#79** mobile (другой), **#25** фото | Полировка демо |
| **P2** | **#74** **#75** **#45** **#42** **#85** | Не блокер |
| **Blocked** | **#6** **#47** **#82** | Внешний доступ / зависимости |

**Закрыто 25.09:** #15, #16, #32, #41, #43, #62, #73.

---

## Шаблон описания карточки Trello

```text
Title: [#N] Краткое название

Labels: FE / BE / P0 …

Description:
- Макет: <имя кадра Figma>
- Ссылка: https://www.figma.com/design/cF0bKFsmenH6rrshGV0yO7/?node-id=...
- Acceptance:
  - …
  - …
- Зависит от: #…
- Репозиторий: Back_end_for_our_poroject / My_Amazon2
```

---

## Роли (предложение для команды)

| Роль | Зона номеров |
|------|----------------|
| Frontend витрина | 17–47, 77–82 |
| Backend / API | 1–3, 14–15, 29–30, 46, 71–75 |
| Admin | 63–70 |
| Auth | 7–16 |
| Docs / QA защиты | 84, 86–88, 92 |
| Design | 6, 25, 62 |

---

*Составлено по кадрам Wireframe Figma + доске ITSTEP-PERRY. Статусы обновлены 25.09.2026.*
