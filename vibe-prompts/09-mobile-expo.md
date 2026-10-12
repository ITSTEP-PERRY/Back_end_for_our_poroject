# 09 — Mobile Expo

[← Оглавление](./README.md) · [← 08 Admin](./08-admin-panel.md) · **Далее:** [10 — Figma →](./10-figma-polish.md)

## Зачем этот шаг

Мобильное приложение на тех же API/Auth.

## Промпт для ИИ

```text
Контекст: те же Product API + Auth, что и desktop. Нужен mobile/ на Expo.

Стек: Expo + TypeScript, SecureStore для token, тот же контракт API.
Web: proxy /api и /auth-api; native — EXPO_PUBLIC_PRODUCT_URL / AUTH_URL.

Экраны:
- Home, Catalog, Product PDP, Cart, Checkout
- Login, Register (multi-step: register → SendCode verify → complete с Name/Surname с формы)
- Account, Orders, Wishlist, Settings, Legal
- Menu drawer: guest vs signed-in

Важно:
- DEV Admin/Admin → /api/dev/admin-login + флаг local admin для /dev/me
  иначе корзина Admin на phone ≠ Admin на desktop
- Create review: полноценная форма или честный stub «use web» — не молчаливый no-op
- Не класть password в navigation params; pending registration в memory

Запуск: npx expo start → :8081
Сверь ключевые экраны с Figma mobile.
```

## Грабли mobile

- Android emulator: `localhost` не работает → `10.0.2.2:5272` или LAN IP ПК.
- Expo Web: CORS/`/api` proxy как на Vite; native — абсолютные URL.
- Admin DEV: тот же фиксированный Guid, что desktop — иначе корзина «не сходится».
- JWT в SecureStore; password не в route params.
- UI — отдельные Figma iPhone frames (card modals), не сжатый desktop.

## Связанные шаги

- Auth flow: [07 — Desktop Auth UI](./07-desktop-auth-ui.md) (тот же контракт)
- Корзина: [03](./03-cart-checkout-orders.md) · [PITFALLS](./PITFALLS.md)
- Дальше: [10 — Figma polish](./10-figma-polish.md)
