# 08 — Админка (desktop)

[← Оглавление](./README.md) · [← 07 Auth UI](./07-desktop-auth-ui.md) · **Далее:** [09 — Mobile →](./09-mobile-expo.md)

## Зачем этот шаг

Admin shell: products, categories, orders, reviews, users.

## Промпт для ИИ

```text
Контекст: Perry frontend + Product API. Users admin — отдельный Users API.

Сделай /admin/* за RequireAuth + role Admin:

Экраны:
- Dashboard (плитки: products, categories, orders, reviews, users)
- Products list + create/edit (имя, цена, oldPrice, category, status, stock, images URLs)
- Categories CRUD
- Orders list: фильтры status/даты/search, смена статуса
- Reviews moderation: approve/hide/delete
- Users: список из perry-admin-service (/users-api), не из Product и не из Auth /admin

Login:
- /admin/login или общий login; Admin JWT обязателен для mutate
- DEV Admin/Admin допустим локально

UI: отдельный AdminShell, не смешивать со storefront chrome.
Таблицы простые, без over-engineering.

Проверь: обычный User → 403 на admin API; Admin проходит smoke CRUD продукта.
```

## Связанные шаги

- API admin endpoints: [02](./02-catalog-pdp.md), [03](./03-cart-checkout-orders.md), [04](./04-reviews-wishlist.md)
- Дальше: [09 — Mobile Expo](./09-mobile-expo.md)
