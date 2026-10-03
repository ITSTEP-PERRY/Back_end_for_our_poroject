# 03 — Корзина, checkout, заказы

[← Оглавление](./README.md) · [← 02 Catalog](./02-catalog-pdp.md) · **Далее:** [04 — Reviews →](./04-reviews-wishlist.md)

## Зачем этот шаг

Гостевая и user-корзина, merge после логина, checkout и admin orders.

## Промпт для ИИ

```text
Контекст: Perry Product API с каталогом.

Корзина:
- Гостевая сессия: query/header sessionId (GUID), на фронте позже localStorage perry_cart_session
- Авторизованная: UserId из JWT; при логине merge гостевой корзины в user-корзину
- Эндпоинты: GET cart, POST add, PUT quantity, DELETE item, POST merge, GET count
- Позиция: productId, quantity; цена — live или snapshot — выбери одно и документируй

Checkout / Orders:
- POST /api/orders/checkout { sessionId, shippingAddress?, paymentType?, recipientName? } → требует JWT
- Order: OrderNumber, UserId, Status (Pending/Paid/Shipped/Delivered/Cancelled), TotalAmount,
  items[], CreatedAtUtc, UpdatedAtUtc, ShippingAddress, PaymentType, RecipientName
- GET /api/orders (мои), GET /api/orders/{id}
- Admin: GET /api/orders/admin с фильтрами status/from/to/search/productId/userId + пагинация
- Admin: PATCH статуса заказа

Важно:
- Не создавать Users. RecipientName из JWT display name/email (если name = sub UUID — не использовать UUID).
- Валидируй пустую корзину на checkout.

Напиши сидер 2–3 демо-заказов для админки.
```

## Грабли (см. [PITFALLS](./PITFALLS.md))

- Desktop `localStorage` sessionId ≠ Mobile `SecureStore` — это нормально для гостя.
- После логина merge обязателен; иначе «корзина пропала».
- DEV Admin/Admin должен иметь **один и тот же Guid** на web и phone — иначе две разные корзины при «одном» Admin.
- Не путай Azure Auth Admin и локальный DEV Admin — разные UserId.

## Связанные шаги

- JWT / display name: [05 — Auth bridge](./05-auth-jwt-bridge.md)
- Mobile: [09 — Expo](./09-mobile-expo.md)
- Дальше: [04 — Reviews & wishlist](./04-reviews-wishlist.md)
