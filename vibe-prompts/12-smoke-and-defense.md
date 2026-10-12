# 12 — Smoke и защита

[← Оглавление](./README.md) · [← 11 Seed](./11-seed-media-run.md) · [One-shot 99](./99-one-shot-full.md)

## Зачем этот шаг

Чеклист приёмки и короткие ответы для комиссии.

## Промпт для ИИ

```text
Контекст: Perry собран. Нужен чеклист приёмки и речь для комиссии.

Составь и выполни smoke (скрипт или чеклист):

Backend:
[ ] /api/health 200
[ ] GET /api/products возвращает items
[ ] GET product by id с reviews
[ ] Register/login через Auth (или DEV Admin)
[ ] POST review под User JWT → 201; повтор → 409
[ ] AuthorName не GUID
[ ] Cart add → checkout → order in /orders
[ ] Admin endpoints 403 для User, 200 для Admin

Desktop:
[ ] Home carousels, PDP add to cart
[ ] Login/Register multi-step
[ ] Create review без текста «as Admin» на обычном 401
[ ] Account orders/wishlist
[ ] Admin products/orders

Mobile:
[ ] Login + Admin DEV
[ ] Cart sync (same userId)
[ ] PDP + catalog

Для защиты подготовь короткие ответы:
- Почему нет Users в Product DB?
- Как стыкуется JWT с Auth?
- Чем Desktop отличается от Mobile?
- Как появляются фото товаров?
- Что такое sessionId корзины?

Положи чеклист в docs/ или project_defense/SMOKE.md.
```

## Навигация

- Грабли (проверь, что не вернулись): [PITFALLS](./PITFALLS.md)
- В начало: [README](./README.md)
- Сначала: [00 — Vision](./00-vision.md)
