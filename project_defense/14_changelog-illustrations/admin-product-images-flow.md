# Как добавляются новые товары и их изображения

```mermaid
flowchart TD
  A[Admin: /admin/products/new] --> B[AdminProductEditPage]
  B --> C[Поля: name, price, category, stock...]
  B --> D["imageUrls[] — до 10 URL<br/>prompt Image URL"]
  C --> E[productsApi.create]
  D --> E
  E --> F["POST /api/products + JWT Admin/Seller"]
  F --> G[ProductsController]
  G --> H[Создать Product в EF]
  G --> I[ApplyImages / NormalizeProductImages]
  I --> J["ProductImages: Url, IsPrimary, SortOrder"]
  H --> K[(PostgreSQL)]
  J --> K
  K --> L[Витрина GET /api/products]
  L --> M{Тип Url}
  M -->|https CDN| N[Клиент грузит с CDN]
  M -->|/uploads/file| O[Файл wwwroot/uploads DiskStorage]
  M -->|data base64| P["GET /api/products/image/{id}"]
  N --> Q[Карточка / PDP]
  O --> Q
  P --> Q
```

**Суть:** админ не грузит multipart в текущей форме — передаёт URL. API сохраняет строки в `ProductImages`. Локальные файлы предусмотрены через `DiskStorageService` → `wwwroot/uploads` (относительный `/uploads/...`).
