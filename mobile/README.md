# Perry Mobile (Expo)

Клиент покупателя на **Expo / React Native** под тот же Auth + Product API, что и web-витрина.  
Макеты: Figma iPhone frames (`cF0bKFsmenH6rrshGV0yO7`).  
План: `docs/МОБИЛЬНОЕ-ПРИЛОЖЕНИЕ-REACT.md` · решение: `docs/РЕШЕНИЕ-MOBILE-С-КОДОМ.md`.  
**Отчёт 01.10:** `docs/ОТЧЁТ-2026-10-01.md`.

**Вне скоупа:** админка, Internal Auth (#97).

## Быстрый запуск

Двойной клик по ярлыку **Perry Mobile** (корень репо / рабочий стол) → http://localhost:8081  
Или: `..\start-mobile.cmd` · установка ярлыков: `..\Install-Perry-Shortcuts.ps1`.  
Нужен **Perry.Api** на `:5272`.

## Запуск (вручную)

```bash
cd mobile
cp .env.example .env
# поправьте EXPO_PUBLIC_PRODUCT_URL под среду
npm start
# затем: a (Android) / i (iOS) / w (web)
```

| Среда | `EXPO_PUBLIC_PRODUCT_URL` |
|-------|--------------------------|
| Android emulator | `http://10.0.2.2:5272` |
| iOS simulator | `http://localhost:5272` |
| Телефон в LAN | `http://<IP-ПК>:5272` |

Auth по умолчанию — Azure Auth Service (как web).

Нужен запущенный **Perry.Api** на `:5272`.

## Что уже есть (MVP каркас)

| Экран | Figma / роль |
|-------|----------------|
| Home | iPhone Main — категории, trending, CTA |
| Catalog | Product List 2 колонки |
| PDP | галерея swipe, buy-box, wishlist |
| Cart / Checkout / Orders | guest session + merge + checkout |
| Login / Register / Forgot | Sign up & Log in - Mobile |
| Menu guest/customer | iPhone Menu |
| Account / Wishlist / Reviews | P1 stubs wired to API |

API-слой — порт с `perry-front` `src/api/*` + SecureStore + absolute media URLs.

## Структура

```text
mobile/
  App.tsx
  src/api/          # client, token, media, types, endpoints
  src/auth/         # AuthContext
  src/cart/         # CartContext
  src/components/   # Header, ProductCard, MenuDrawer, PrimaryButton
  src/navigation/   # tabs + stack
  src/screens/      # Home, Products, Product, Cart, Checkout, Auth, Account…
  src/theme/        # Perry colors
```

## Smoke

1. `GET {PRODUCT}/api/health`  
2. Home показывает товары  
3. Login → JWT в SecureStore  
4. PDP → To cart → Checkout → My orders  

## Примечание по навигации

Корневой stack + tabs; Menu открывает экраны Login/Orders/Wishlist и т.д.  
Пиксель-перфект Figma можно добить итерациями — сейчас приоритет: данные с API + layout 390px.
