# Отчёт: Mobile Expo — аудит окон, ссылок и сверка с Figma

**Дата:** 2026-10-01  
**Код:** [`mobile/`](../mobile/) (Expo / React Native)  
**Figma iPhone (канон):** [cF0bKFsmenH6rrshGV0yO7](https://www.figma.com/design/cF0bKFsmenH6rrshGV0yO7/) · 390×844  
**Цветные баннеры:** [xFLIIfNIIiBHaMcijSE84I](https://www.figma.com/design/xFLIIfNIIiBHaMcijSE84I/) (Groups 1142 / 1164 / 887)  
**Серии Trello:** `#M00–#M10` (API/каркас) · `#MU00–#MU11` (UI окон)

---

## 1. Краткий вердикт

| Слой | Статус |
|------|--------|
| Все окна из `#MU01–#MU11` **есть в коде** и зарегистрированы в навигации | ✅ |
| Основные CTA / меню / auth / каталог / PDP / cart / checkout **кликабельны** | ✅ |
| Пиксель-перфект 1:1 по всем слоям Figma | 🟡 **близко**, не 100% (wireframe vs цвет, нет отдельных iPhone Cart/Checkout) |
| Мёртвые ссылки футера Contact / FAQ / License | ✅ **исправлено** в этом аудите (stubs) |
| Полные тексты Legal / Contact / FAQ | 🟡 stubs (как web-паритет навигации, полный текст на сайте) |

---

## 2. Инвентарь экранов в коде

### 2.1. Файлы `mobile/src/screens/`

| Файл | Экран(ы) | Роль |
|------|----------|------|
| `HomeScreen.tsx` | Home / Main | Hero, категории, Trending/Sale, mid CTA, нижний баннер, футер |
| `ProductsScreen.tsx` | Product List | Filters + sort, сетка 2 кол. |
| `ProductScreen.tsx` | PDP + See more sheet | Галерея, wishlist, qty, Add to cart, slide-up |
| `LoginScreen.tsx` | Log in | Модалка overlay |
| `RegisterScreen.tsx` | Sign up | Модалка overlay |
| `ForgotPasswordScreen.tsx` | Forgot password | Модалка → Send code |
| `SendCodeScreen.tsx` | Send code | 6 digit + Confirm / Resend |
| `CartScreen.tsx` | Cart empty / full | Qty, remove, checkout |
| `CheckoutScreen.tsx` | Checkout | Адрес / place order |
| `AccountScreen.tsx` | Account hub | Guest / customer |
| `AccountExtras.tsx` | Wishlist, Reviews, Settings, Legal stubs | Contact/FAQ/License/Terms/Privacy |
| `OrdersScreen.tsx` | My orders | Список |
| `OrderDetailsScreen.tsx` | Order details | Детали заказа |

### 2.2. Shell-компоненты

| Компонент | Figma / web |
|-----------|-------------|
| `Header.tsx` | Шапка `#4A7BD9`, search `#F4FAFF` + кнопка `#B8EA48` |
| `MenuDrawer.tsx` | Menu guest `2006:9189` / customer `2004:5947` |
| `SiteFooter.tsx` | Footer Support / Legal / Social + bar `#1F50AA` |
| `ProductCard.tsx` | Карточка списка / rail Home |
| `FiltersSheet.tsx` | Filters bottom sheet (facets API) |
| `FigmaIcons.tsx` | SVG menu / search / cart / star / chat из Figma |
| `FloatingLabelInput.tsx` | Auth inputs |
| `PrimaryButton.tsx` | CTA |

### 2.3. Навигация

**Tabs:** Home · Catalog · Cart · Account  

**Root stack:** MainTabs, Login, Register, ForgotPassword, SendCode, Terms, Privacy, Contact, FAQ, License, Orders, Wishlist, Reviews, Settings, Products, Product, Cart, Checkout, OrderDetails  

**Nested stacks:** HomeStack (Home→Products→Product), CatalogStack, CartStack, AccountStack  

---

## 3. Сверка с Figma (`#MU*`)

| # | Окно | Figma node | Код | UI vs макет | Примечание |
|---|------|------------|-----|-------------|------------|
| MU01 | Log in | `2446:3513` | `LoginScreen` | 🟢 близко | Эталон: overlay, floating labels, Stay signed in, Forgot |
| MU02 | Sign up | `2446:4342` | `RegisterScreen` | 🟢 близко | Name/Surname/Email/Password/Confirm, Terms checkbox |
| MU03 | Send code | `2446:4913` | `SendCodeScreen` | 🟢 близко | 6 полей, Confirm, Resend; verify API пока stub |
| MU04 | Forgot password | auth mobile | `ForgotPasswordScreen` | 🟢 | → `replace("SendCode")` |
| MU05 | Home / Main | `806:1722` | `HomeScreen` | 🟡 | Hero 390×220, rails, CTA Group 887, footer; ассеты из цветного файла / `public/images/home` |
| MU06 | Product List | `839:1735` | `ProductsScreen` | 🟢 | Filters pill + sort + 2-col cards |
| MU07 | PDP + See more | `1376:1973` · `2006:7641` | `ProductScreen` | 🟢 | Heart на фото, Add to cart `#0E2042`, sheet |
| MU08 | Menu g/c | `2006:9189` · `2004:5947` | `MenuDrawer` | 🟢 | Full-screen PERRY + X |
| MU09 | Cart | Cart V2 → mobile | `CartScreen` | 🟡 | Нет отдельного iPhone-кадра; empty/full/guest есть |
| MU10 | Checkout | mobile form | `CheckoutScreen` | 🟡 | Рабочая форма, не пиксель-кадр |
| MU11 | Account hub | Menu customer | `AccountScreen` + Orders/Wishlist/Reviews/Settings | 🟢 / 🟡 | Hub + списки; Settings — stub текста |

**Цвета (канон web/Figma цветной):**

| Токен | Значение | Где |
|-------|----------|-----|
| `--header` / `--footer-top` | `#4A7BD9` | Header, верх футера |
| `--header-2` | `#1F50AA` | Низ футера |
| `--accent` / primary | `#B8EA48` | Search btn, Sign up, badges |
| `--ink` | `#0E2042` | Текст, Add to cart |

Wireframe-файл iPhone часто серый; **цвет** берём из web tokens + цветного ассет-пакета и скрина футера заказчика.

---

## 4. Аудит ссылок и кнопок

### 4.1. Header

| Элемент | Действие | Статус |
|---------|----------|--------|
| Menu ☰ | открывает `MenuDrawer` | ✅ |
| Search submit | `CatalogTab` → Products (± search) | ✅ |
| Cart | `CartTab` | ✅ |

### 4.2. Menu (guest / customer)

| Элемент | → | Статус |
|---------|---|--------|
| Sign up / Log in | Register / Login (root) | ✅ |
| Catalog | Products | ✅ |
| Terms / Privacy | Legal stubs | ✅ |
| My orders / Wishlist / Reviews / Settings | root screens | ✅ |
| Log out | `logout()` | ✅ |

### 4.3. Home

| Элемент | → | Статус |
|---------|---|--------|
| Hero / Shop now | Products | ✅ |
| Category card / See all | Products + categoryId | ✅ |
| Product card | Product `{ id }` | ✅ |
| Trending / Sale See all | Products + sort | ✅ |
| Нижний баннер Sign in / Log in | Register / Login | ✅ |
| Нижний баннер (auth) Go to catalog | Products | ✅ |
| Footer Terms / Privacy / Contact / FAQ / License | stubs | ✅ (после фикса) |
| Footer social | `Linking.openURL` | ✅ (внешние demo URL) |

### 4.4. Auth

| Поток | Статус |
|-------|--------|
| Login → Forgot → SendCode | ✅ |
| Login ↔ Register | ✅ |
| Register → Terms / Privacy | ✅ |
| Register success → goBack (JWT) | ✅ (без SendCode — API сразу логинит) |

### 4.5. Catalog / PDP

| Элемент | Статус |
|---------|--------|
| Filters → API facets | ✅ |
| Sort sheet | ✅ |
| Card → PDP | ✅ |
| Heart → wishlist (или Login) | ✅ |
| Add to cart | ✅ |
| See more sheet | ✅ |

### 4.6. Cart / Checkout / Account

| Элемент | Статус |
|---------|--------|
| Browse catalog / Checkout / Log in | ✅ |
| Place order → Orders | ✅ |
| Orders → OrderDetails | ✅ |
| Wishlist → Product + Remove | ✅ |
| Account guest/customer rows | ✅ |

### 4.7. Исправлено в ходе аудита

- **Contact us / FAQ / License** в футере были текстом без `onPress` → stubs `Contact` / `FAQ` / `License` в root stack + `LegalScreen`.

---

## 5. Проделанная работа (сводка сессии / mobile UI)

1. **Каркас Expo** в `mobile/`: API client, SecureStore, Auth/Cart context, Metro Auth proxy для web (`/auth-api`).  
2. **Auth UI** под Figma: Login, Sign up, Forgot, Send code (модалки + floating labels).  
3. **Shell:** синяя шапка `#4A7BD9`, tab bar, Menu guest/customer, SiteFooter.  
4. **Home:** hero-ассеты, карусели категорий/товаров, mid «Shop now», нижний баннер `cta-banner.png`, футер.  
5. **Catalog:** FiltersSheet + sort, ProductCard Figma-пропорции, иконки star/chat.  
6. **PDP:** галерея, wishlist, qty, Add to cart, See more.  
7. **Cart / Checkout / Orders / Wishlist / Account.**  
8. **Аудит 2026-10-01:** инвентарь окон, сверка `#MU*`, проверка ссылок, починка мёртвых ссылок футера, этот отчёт.

---

## 6. Оставшиеся gaps (честный список)

| Gap |Severity | Рекомендация |
|-----|----------|--------------|
| Нет отдельных iPhone-кадров Cart/Checkout | P1 | Верстка по web Cart V2 + цвет Perry; уточнить у дизайна |
| Legal / Contact / FAQ — stubs | P2 | Подтянуть текст с web LegalPage или CMS |
| Send code без реального verify endpoint | P2 | Дождаться Auth API; UI готов |
| SiteFooter только на Home | P2 | Добавить на Catalog/PDP/Account scroll при необходимости |
| Полный пиксель всех отступов vs wireframe | P1 | Поэкранная сверка со скринами эмулятора 390px |
| Social icons — Ionicons, не SVG из Figma | P3 | Экспорт иконок из цветного макета |
| Диск C: ENOSPC мешал `get_design_context` | ops | Держать ≥2 ГБ свободно для Figma MCP |

---

## 7. Как проверить вручную (smoke)

1. `cd mobile && npx expo start --web --port 8081`  
2. Product API `:5272` + Auth (прямой / proxy).  
3. Home → hero swipe → категория → PDP → Add to cart → Cart → Checkout (login).  
4. ☰ guest: Sign up / Log in / Catalog / Terms.  
5. ☰ customer: Orders / Wishlist / Reviews / Settings / Log out.  
6. Footer: Contact, FAQ, Terms, License, Privacy, social.  
7. Login → Forgot password → Send code UI.  
8. Catalog: Filters + Sort.

---

## 8. Связанные документы

- [СООБЩЕНИЕ-В-ЧАТ-MOBILE-UI.md](./СООБЩЕНИЕ-В-ЧАТ-MOBILE-UI.md) — `#MU00–#MU11`  
- [СООБЩЕНИЕ-В-ЧАТ-MOBILE.md](./СООБЩЕНИЕ-В-ЧАТ-MOBILE.md) — `#M00–#M10`  
- [РЕШЕНИЕ-MOBILE-С-КОДОМ.md](./РЕШЕНИЕ-MOBILE-С-КОДОМ.md) — гайд по коду  
- [mobile/README.md](../mobile/README.md) — запуск Expo  

---

*Документ зафиксирован по состоянию репозитория на 2026-10-01 после тотального аудита навигации и сверки с каноном Figma iPhone + цветными токенами шапки/футера.*
