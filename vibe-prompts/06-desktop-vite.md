# 06 — Desktop витрина (React + Vite)

[← Оглавление](./README.md) · [← 05 Auth JWT](./05-auth-jwt-bridge.md) · **Далее:** [07 — Auth UI →](./07-desktop-auth-ui.md)

## Зачем этот шаг

Витрина на :3000 с proxy к API и базовыми экранами каталога.

## Промпт для ИИ

```text
Контекст: Product API Perry на :5272 работает. Нужен frontend/.

Стек: React + TypeScript + Vite + React Router. Порт 3000.
Структура: src/app (router, AuthContext, CartContext), src/api, src/pages, src/widgets, src/styles.

Vite proxy:
- /api → http://localhost:5272
- /auth-api → Azure Auth Service (changeOrigin), rewrite убрать префикс
- /users-api → Admin Users service

Экраны MVP:
- Home: hero carousel, categories, product carousels, CTA
- Catalog / Products list + filters/sort
- Product PDP: gallery, price, stock, add to cart, reviews, related
- Cart, Checkout
- Legal: Terms, Privacy, FAQ, Contact
- Header/Footer (PERRY brand, search, cart badge, account)

api client:
- apiFetch с base product|auth|users
- На 401 для product НЕ пиши «log in as Admin» — обычный user тоже ходит в reviews/cart
- normalize медиа URL

ProductCard: цена с toFixed(2); на home не обрезай overflow так, чтобы пропала точка в цене
(не фиксируй max-height жёстче контента на широких экранах).

Запуск: npm install && npm run dev → http://localhost:3000
Сверь список товаров с API.
```

## Грабли дизайна / DX

- Без proxy браузер получит CORS на Azure Auth — всегда same-origin `/auth-api`.
- Не тащи старую antd/Redux-линию в эту витрину — source of truth: Figma storefront в `frontend/`.
- Цены и pads: см. [10](./10-figma-polish.md) и [PITFALLS](./PITFALLS.md).

## Связанные шаги

- Дальше: [07 — Auth UI](./07-desktop-auth-ui.md)
- Визуал: [10 — Figma polish](./10-figma-polish.md)
- Грабли: [PITFALLS](./PITFALLS.md)
