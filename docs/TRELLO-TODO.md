# Trello ToDo — Perry (по макету Figma)

Документ для переноса на доску **Trello**.  
Источник макета: [Дипломна робота (Copy)](https://www.figma.com/design/cF0bKFsmenH6rrshGV0yO7/) · страница `Wireframe`.  
Оригинал комиссии (нужен edit): [Дипломна робота](https://www.figma.com/design/4d4a4NOMFigwJbKMlOpL2n/).

**Как пользоваться**
1. Создайте доску: колонки `Backlog` → `To Do` → `In Progress` → `Review` → `Done`.
2. Создайте карточку на каждую задачу ниже (номер = ID карточки).
3. Метки (labels): `FE` · `BE` · `Admin` · `Mobile` · `Design` · `Docs` · `P0` / `P1` / `P2`.
4. Статус в скобках — текущее состояние кода на момент составления списка.

Легенда статуса: ✅ Done · 🟡 Partial · ⬜ To Do · 🔵 In Progress (если уже взяли)

---

## Предлагаемые списки (колонки Trello)

| Колонка | Смысл |
|---------|--------|
| **Done** | Уже закрыто (можно завести карточки и сразу перенести) |
| **To Do / Sprint** | Ближайшие задачи к защите и демо |
| **Backlog** | По макету есть, но не блокер защиты |
| **Blocked** | Нужен доступ / решение команды |

---

## Epic A. Инфраструктура и бренд

| # | Задача | Метки | Статус | Figma / примечание |
|---|--------|-------|--------|--------------------|
| **1** | Solution ASP.NET Core 8: Domain + Infrastructure + Web + Api | BE | ✅ | — |
| **2** | EF Core модель, миграции, LocalDB `Perry` | BE | ✅ | — |
| **3** | DbSeeder: категории, товары, отзывы, атрибуты | BE | ✅ | — |
| **4** | Ребрендинг DuSoleil → **Perry** (namespaces, UI, БД) | FE BE Docs | ✅ | — |
| **5** | Docker / docker-compose / env для команды | BE Docs | 🟡 | Есть `docker-compose`, `.env.example` — проверить единый гайд |
| **6** | Получить **edit** на оригинал Figma комиссии для MCP/пиксель-сверки | Design | ⬜ | `4d4a4NOMFigwJbKMlOpL2n` |

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
| **14** | Реальный SMTP (Gmail App Password), без stub | BE P1 | ⬜ | Сейчас `Smtp:UseStub` |
| **15** | Хранить коды/токены в БД (не только MemoryCache) | BE P1 | ⬜ | — |
| **16** | Безопасный Forgot: единый ответ «если email есть — отправили» | BE P2 | ⬜ | — |

---

## Epic C. Главная (Desktop - Main)

| # | Задача | Метки | Статус | Figma |
|---|--------|-------|--------|-------|
| **17** | Header: menu, PERRY, Search, Account, Cart | FE | ✅ | `Desktop - Main V3.x` |
| **18** | Hero-слайдер с рабочими стрелками (баннеры без baked-in UI) | FE | ✅ | Main V3 |
| **19** | Карусели категорий (2 ряда) | FE BE | ✅ | Main |
| **20** | Trending deals + Sale карусели | FE BE | ✅ | Main |
| **21** | CTA «Abundance of goods» + Sign up / Log in | FE | ✅ | Main |
| **22** | Back to top + footer (Support / Legal / Social) | FE | 🟡 | Social — плейсхолдеры иконок |
| **23** | Меню каталога (overlay): без аккаунта / с аккаунтом customer | FE P0 | ⬜ | `Desktop - Menu (without account)` · `Desktop - Menu (with account: customer)` · `Main V3.3 - Menu` |
| **24** | Состояния главной: authorized vs guest (разный CTA/меню) | FE P1 | 🟡 | `Main V2 (authorization)` / `(no authorization)` |
| **25** | Реальные изображения товаров вместо picsum seed | Design BE P1 | ⬜ | — |

---

## Epic D. Product List (каталог)

| # | Задача | Метки | Статус | Figma |
|---|--------|-------|--------|-------|
| **26** | Страница `/Products` + breadcrumbs | FE BE | ✅ | `Desktop - Product List Page V2` |
| **27** | Фильтры: Brand, Fabric/Material, Size, Color, Price, Reviews | FE BE | ✅ | Product List V2 |
| **28** | «N filters applied», sort, grid/list, pagination | FE | ✅ | Product List V2 |
| **29** | Out of stock + кнопка Notify when available (UI) | FE | 🟡 | Кнопка есть, бэкенд notify — нет |
| **30** | Backend «Notify when available» (email/подписка) | BE P1 | ⬜ | — |
| **31** | Поиск из header → каталог с query | FE BE | 🟡 | Search bar в макете |
| **32** | Пустой результат поиска / фильтров (empty state по макету) | FE P2 | ⬜ | — |

---

## Epic E. Product Page (PDP)

| # | Задача | Метки | Статус | Figma |
|---|--------|-------|--------|-------|
| **33** | Базовая PDP: галерея, About, buy-box, details | FE BE | ✅ | `Desktop - Product Page (without options)` |
| **34** | Customer reviews: summary, tags, filters, Create review | FE BE | 🟡 | Список/теги есть; create — форма; Helpful/Translate — UI |
| **35** | Related + Fashion: sale карусели | FE BE | ✅ | низ PDP |
| **36** | Модалка / экран **Delivery** | FE P1 | ⬜ | `Desktop - Product Page (delivery)` |
| **37** | Модалка **Payment methods** | FE P1 | ⬜ | `(payment methods)` |
| **38** | Модалка **Security** | FE P1 | ⬜ | `(security)` |
| **39** | Модалка **Returns** | FE P1 | ⬜ | `(returns)` |
| **40** | Блок / модалка **About seller** | FE BE P1 | ⬜ | `(about seller)` |
| **41** | Lightbox фото товара | FE P1 | ⬜ | `(good's photo)` |
| **42** | Видео товара в галерее | FE BE P2 | ⬜ | `(good's video)` |
| **43** | Открыть фото в комментариях (lightbox отзыва) | FE P1 | ⬜ | `(open photo in comments) V2` |
| **44** | Create review — полный UX по макету (рейтинг UI, теги, фото) | FE BE P0 | 🟡 | `(create review)` |
| **45** | Helpful / Translate — рабочая логика (не только кнопки) | FE BE P2 | ⬜ | — |
| **46** | Wish list (Add to wish list) | FE BE P1 | ⬜ | buy-box в PDP |
| **47** | Варианты товара (size/color options), если появятся в финальном макете | FE BE P2 | ⬜ | кадр «without options» — сейчас без опций |

---

## Epic F. Cart & Checkout

| # | Задача | Метки | Статус | Figma |
|---|--------|-------|--------|-------|
| **48** | Корзина guest + user + merge | FE BE | ✅ | `Desktop - Cart` / `Cart V2` |
| **49** | Cart empty state | FE | 🟡 | `Cart - no items` · `Cart V2 - no items` |
| **50** | Cart V2 full view (пиксель под макет) | FE P0 | 🟡 | `Desktop - Cart V2 - full view` |
| **51** | Cart для неавторизованного (CTA Log in) | FE P1 | 🟡 | `Cart V2 - not logged in` |
| **52** | Checkout / оформление заказа по макету (если кадр есть у команды) | FE BE P0 | 🟡 | Заказ есть в коде; сверить UI с макетом |
| **53** | Страница заказов покупателя `/Orders` | FE BE | ✅ | — |
| **54** | Buy again | FE BE | ✅ | — |

---

## Epic G. Account / Profile

| # | Задача | Метки | Статус | Figma |
|---|--------|-------|--------|-------|
| **55** | Profile: просмотр / edit / soft-delete | FE BE | ✅ | — |
| **56** | Recently viewed | FE BE | ✅ | — |
| **57** | Страница / вкладка Wish list | FE BE P1 | ⬜ | связано с #46 |
| **58** | История заказов UI ближе к макету | FE P2 | 🟡 | — |

---

## Epic H. Legal

| # | Задача | Метки | Статус | Figma |
|---|--------|-------|--------|-------|
| **59** | Terms and conditions | FE Docs | ✅ | `Desktop - Terms and conditions` |
| **60** | License agreement | FE Docs | ✅ | `Desktop - License agreement` |
| **61** | Privacy policy | FE Docs | ✅ | `Desktop - Privacy policy` |
| **62** | Иконки Social media в футере (вместо плейсхолдеров) | FE Design P2 | ⬜ | footer Main |

---

## Epic I. Admin panel

| # | Задача | Метки | Статус | Figma |
|---|--------|-------|--------|-------|
| **63** | Admin Log in | FE BE | ✅ | `Desktop - Admin panel: Log in` |
| **64** | Dashboard (статистика + быстрые формы) | FE BE | ✅ | — |
| **65** | Admin Category: CRUD, subcategory, delete/edit | FE BE | 🟡 | Много кадров Category (create/edit/delete) — добить UI под макет |
| **66** | Admin Product: create/edit/choose category | FE BE | 🟡 | `Admin panel: Product` |
| **67** | Admin Orders list | FE BE | ✅ | `Admin panel: Order (default)` |
| **68** | Admin Users: роли, delete/restore, фильтры статусов | FE BE | 🟡 | серия `User (…)` |
| **69** | Admin Reviews moderation | FE BE P1 | ⬜ | `Admin panel: Reviews (default)` |
| **70** | Архивация / restore товаров, deactivate category | BE | ✅ | — |

---

## Epic J. API

| # | Задача | Метки | Статус | Figma |
|---|--------|-------|--------|-------|
| **71** | REST: categories / products GET+POST+DELETE | BE | ✅ | — |
| **72** | REST: cart + checkout | BE | ✅ | — |
| **73** | JWT / cookie auth для API (убрать query `userId`) | BE P1 | ⬜ | — |
| **74** | PUT category/product через API | BE P2 | ⬜ | — |
| **75** | API отзывов отдельным ресурсом | BE P2 | ⬜ | — |
| **76** | Swagger актуализировать под финальные контракты | BE Docs P2 | 🟡 | — |

---

## Epic K. Mobile (макеты iPhone)

| # | Задача | Метки | Статус | Figma |
|---|--------|-------|--------|-------|
| **77** | Адаптив главной (mobile Main) | FE Mobile P1 | 🟡 | `iPhone … - Main` · `Android Large - Main` |
| **78** | Mobile Product List | FE Mobile P1 | 🟡 | `iPhone … - Product List Page` |
| **79** | Mobile Product Page (swipe / see more) | FE Mobile P1 | ⬜ | `Product Page V2 - slide up` и др. |
| **80** | Mobile Log in / Sign up / Send code | FE Mobile | 🟡 | `Sign up & Log in - Mobile` |
| **81** | Mobile Menu (account / no account) | FE Mobile P1 | ⬜ | `iPhone … - Menu` |
| **82** | Mobile PDP: delivery / payment / returns / seller sheets | FE Mobile P2 | ⬜ | Mobile - Product Page (…) |

---

## Epic L. Качество, ошибки, защита

| # | Задача | Метки | Статус | Figma |
|---|--------|-------|--------|-------|
| **83** | Страница Error 404 по макету | FE P1 | ⬜ | `Desktop - Error 404` |
| **84** | Smoke-сценарий защиты (Register→Login→Buy→Admin) | Docs P0 | ⬜ | — |
| **85** | Unit / integration тесты критичных сервисов | BE P2 | ⬜ | — |
| **86** | Актуализировать скриншоты README (уже 01–33) | Docs | ✅ | `docs/screenshots` |
| **87** | Документ «проделанная работа» § витрина | Docs | ✅ | `ПРОДЕЛАННАЯ-РАБОТА.md` §13 |
| **88** | Речь на 1 мин про stub SMTP / демо-дыры | Docs P0 | ⬜ | см. СОВЕТЫ-И-РЕКОМЕНДАЦИИ |

---

## Рекомендуемый порядок для Trello (ближайший спринт)

Перенесите в **To Do** в таком порядке:

1. **23** — боковое Menu (гость / customer)  
2. **50** — Cart V2 под макет  
3. **44** — Create review UX  
4. **36–40** — модалки Delivery / Payment / Security / Returns / About seller  
5. **69** — Admin Reviews  
6. **29–30** — Notify when available  
7. **46** — Wish list  
8. **83** — 404  
9. **14** — реальный SMTP (если нужно на защите)  
10. **84** + **88** — демо-сценарий и речь  

В **Done** сразу: 1–4, 7–13, 17–21, 26–28, 33, 35, 48, 53–55, 59–61, 63–64, 67, 71–72, 86–87.

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
| Docs / QA защиты | 84, 86–88 |
| Design | 6, 25, 62 |

---

*Составлено по кадрам Wireframe Figma + текущему состоянию Perry Web/Api. При появлении edit на оригинал комиссии — уточнить node-id и приоритеты с руководителем.*
