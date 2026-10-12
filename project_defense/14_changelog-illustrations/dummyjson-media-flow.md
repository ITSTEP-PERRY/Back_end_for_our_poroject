# Как витрина получила фото реального товара (DummyJSON)

```mermaid
flowchart TD
  A[Старт Perry.Api Development] --> B[DbSeeder]
  B --> C{Каталог DummyJSON}
  C -->|сеть| D["GET https://dummyjson.com/products"]
  C -->|fallback| E[Embedded dummyjson-products.json]
  D --> F[ParseDummyProducts]
  E --> F
  F --> G[DummyPack: title, brand, price, images/thumbnail]
  G --> H[EnsureDummyJsonProducts / refresh demo URLs]
  H --> I["Product SKU = DJ-xxx"]
  H --> J["ProductImages.Url = https://cdn.dummyjson.com/..."]
  J --> K[PostgreSQL]
  K --> L["GET /api/products"]
  L --> M{Url абсолютный https?}
  M -->|да| N[Отдаём CDN URL как есть]
  M -->|base64 / relative| O["GET /api/products/image/id или origin+/uploads"]
  N --> P[Browser / Mobile Image]
  O --> P
```

**Суть:** не генерируем «заглушки» вручную — берём готовые товарные фото с CDN DummyJSON и кладём URL в `ProductImages`. Клиент грузит картинку напрямую с CDN.
