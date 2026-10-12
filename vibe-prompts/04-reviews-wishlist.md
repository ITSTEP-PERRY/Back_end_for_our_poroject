# 04 — Отзывы и Wishlist

[← Оглавление](./README.md) · [← 03 Cart](./03-cart-checkout-orders.md) · **Далее:** [05 — Auth JWT →](./05-auth-jwt-bridge.md)

## Зачем этот шаг

Отзывы с нормальным AuthorName и wishlist для авторизованных.

## Промпт для ИИ

```text
Контекст: Perry Product API.

Reviews:
- POST /api/reviews [Authorize] body: productId, rating 1..5, title, body, tags[], images[]
- UserId ТОЛЬКО из JWT. AuthorName: НЕ Identity.Name если это GUID(sub).
  Бери firstName+lastName / name / email / "Customer". При наличии Auth Internal — подтяни профиль.
- Один отзыв на пару (userId, productId) → 409 Conflict если повтор
- GET reviews в составе product detail; GET /api/reviews/me
- Admin moderation: approve/disable/delete (policy Admin)
- Tags: "High quality", "Worth the price", "Fits the description", …

Wishlist:
- GET/POST/DELETE /api/wishlist [Authorize], ключ userId+productId

На фронте позже модалка Create review (звёзды, title≤60, body≤1000, tags, photos≤10).
Заложи API так, чтобы модалка легла без ломки контракта.

Сценарий: User JWT создаёт отзыв → виден в PDP → повтор даёт 409.
```

## Грабли (см. [PITFALLS](./PITFALLS.md))

- `NameClaimType = sub` → `Identity.Name` = UUID → в карточке отзыва «цифровой набор» вместо ника.
- На фронте: если `authorName` похож на GUID и совпадает с `user.id` — покажи `user.name` / email.
- Сообщение 401 «log in again as Admin» на Create review — баг копирайта клиента, не требование роли.
- 409 = уже оставлял отзыв на этот товар, не «нет прав».

## Связанные шаги

- Предохранитель: [PITFALLS](./PITFALLS.md)
- Auth claims: [05 — Auth JWT bridge](./05-auth-jwt-bridge.md)
- UI модалки: [07 — Auth UI](./07-desktop-auth-ui.md), [10 — Figma](./10-figma-polish.md)
