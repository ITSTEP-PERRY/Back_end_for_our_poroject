# Mobile Expo ↔ Figma iPhone — сверка окон + бэкенд

**Дата:** 2026-10-01  
**Код:** `mobile/` · **Figma iPhone:** [cF0bKFsmenH6rrshGV0yO7](https://www.figma.com/design/cF0bKFsmenH6rrshGV0yO7/)  
**Цвет / Cart V2:** [xFLIIfNIIiBHaMcijSE84I](https://www.figma.com/design/xFLIIfNIIiBHaMcijSE84I/)  
**API:** Product `:5272` + Auth (Metro proxy `/api`, `/uploads`, `/auth-api`)

---

## Вердикт

Все окна `#MU01–#MU11` есть в навигации, UI приведён к канону Figma (iPhone wireframe + цветные токены Perry), данные идут через тот же Product/Auth backend, что и web.

| # | Окно | Figma | Экран | UI | Backend |
|---|------|-------|-------|----|---------|
| MU01 | Log in | `2446:3513` | `LoginScreen` | ✅ модалка, floating labels, Stay signed in, Forgot | `authApi.login` |
| MU02 | Sign up | `2446:4342` | `RegisterScreen` | ✅ Create account + Terms checkbox | `authApi.register` |
| MU03 | Send code | `2446:4913` | `SendCodeScreen` | ✅ 6 digits, Confirm, Resend | `authApi.forgot` (resend); verify UI-local |
| MU04 | Forgot password | auth mobile | `ForgotPasswordScreen` | ✅ → Send code | `authApi.forgot` |
| MU05 | Home / Main | `806:1722` | `HomeScreen` | ✅ hero 390×220, cats, Trending/Sale, CTA, footer | `categoriesApi` + `productsApi` |
| MU06 | Product List | `839:1735` | `ProductsScreen` | ✅ Filters + sort + 2-col + pager | `productsApi.list` + facets |
| MU07 | PDP + See more | `1376:1973` · `2006:7641` (+ цвет `2548:9286`) | `ProductScreen` | ✅ sticky To cart/Buy/Qty, gallery, reviews, related, See more sheet | `productsApi.byId`, cart, wishlist |
| MU08 | Menu g/c | `2006:9189` · `2004:5947` | `MenuDrawer` | ✅ guest Sign up/Log in; customer + **Catalog** | auth / nav |
| MU09 | Cart | Cart V2 `2550:12481/12482` | `CartScreen` | ✅ empty / full / guest summary | `CartContext` → cart API |
| MU10 | Checkout | web `4577:28174` | `CheckoutScreen` | ✅ recipient / address / Card\|Cash / summary | `ordersApi.checkout` |
| MU11 | Account hub | Menu customer | `AccountScreen` + Orders / Wishlist / Reviews / Settings / Legal | ✅ + Catalog | orders / wishlist / reviews API |

---

## Что доведено в этой итерации

1. **PDP** — sticky-бар как на iPhone (`To cart` / `Buy` / Quantity / heart), бейдж скидки, стрелки галереи, sheet «See more», reviews + related с API.  
2. **Cart** — layout Cart V2: Shopping cart, Order summary, guest Sign in / Create account.  
3. **Checkout** — полная форма как web (country/state/city, Card/Cash, validation) → `POST /orders/checkout`.  
4. **Menu / Account** — у customer добавлен **Catalog** (как в Figma `2004:5947`).  
5. **Product List** — пагинация 1…N как в макете.

---

## Цвета (канон)

| Токен | Hex | Где |
|-------|-----|-----|
| primary / accent | `#B8EA48` | CTA, Sign up, search btn |
| ink | `#0E2042` | текст, Buy |
| header / footer-top | `#4A7BD9` | Header, верх футера |
| header-2 | `#1F50AA` | низ футера |
| objects | `#F4FAFF` | sticky bar, summary |

Wireframe iPhone часто серый — **цвет** берём из токенов + цветного файла.

---

## Smoke-чеклист

1. Home → категория → Catalog → PDP.  
2. PDP: To cart / Buy / wishlist (login) / See more.  
3. Cart empty → Go to catalog; full → qty / Remove → Checkout.  
4. Checkout (login) → Place order → My orders.  
5. Menu guest: Sign up / Log in / Catalog / Legal.  
6. Menu customer: orders / wishlist / reviews / settings / Catalog / logout.  
7. Login → Forgot → Send code → Resend.

---

## Известные оговорки

- Отдельных iPhone-кадров Cart/Checkout в wireframe-файле нет → верстка по Cart V2 / Checkout web, узкий layout.  
- Send code: отдельного verify-endpoint нет — Confirm локальный, Resend бьёт в `forgot`.  
- Create review на mobile — stub (фото-форма на web).  
- Перезапуск Metro с `--clear`, если Home/картинки «не отражается».
