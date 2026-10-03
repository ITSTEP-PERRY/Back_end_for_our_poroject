# 02 — Каталог и PDP

[← Оглавление](./README.md) · [← 01 Skeleton](./01-backend-skeleton.md) · **Далее:** [03 — Корзина →](./03-cart-checkout-orders.md)

## Зачем этот шаг

Рабочий каталог, деталка товара и сидер товаров.

## Промпт для ИИ

```text
Контекст: Perry Product API уже с каркасом и Postgres.

Реализуй полноценный каталог:

API:
- GET /api/categories (дерево/список со slug, iconUrl, parentId)
- GET /api/products с пагинацией, search, categoryId, sort (price/popular/newest), фильтр по статусу
- GET /api/products/{id} — деталка: images, attributes, aboutItems, averageRating, reviewCount,
  related products, saleRelated, status (InStock/OutOfStock)
- Admin: POST/PUT/DELETE products и categories (только роль Admin)
- Учёт просмотров (viewCount) — мягко, без спама

Модель Product (минимум полей):
Id, Name, Slug, Description, Price, OldPrice?, DiscountPercent?, Sku, Status, Stock,
CategoryId, SellerId?, ImageUrl (primary), ViewCount, OrderCount, CreatedAtUtc

Сделай DbSeeder: 5–8 категорий, 30+ товаров с реалистичными именами и ценами.
Картинки пока placeholder URL (позже DummyJSON).

Ответы JSON стабильные для фронта: camelCase, списки items + totalCount/page.

Добавь интеграционный smoke: curl списка продуктов и одной деталки.
```

## Связанные шаги

- Дальше: [03 — Корзина / orders](./03-cart-checkout-orders.md)
- Фото и сиды: [11 — Seed & media](./11-seed-media-run.md)
