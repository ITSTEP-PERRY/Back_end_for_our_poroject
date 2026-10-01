# Backend Routes — Perry

**Изображения:** `diagram.png` (для слайдов) · `diagram.mmd` · `diagram.svg`

---

## Что изображено

Группы REST-эндпоинтов **Perry.Api** (префикс `/api`).

| Контроллер | Prefix | Назначение |
|------------|--------|------------|
| CategoriesController | `api/categories` | дерево, CRUD (admin) |
| ProductsController | `api/products` | каталог, PDP, CRUD, image |
| ReviewController | `api/reviews` | отзывы покупателя + модерация |
| CartController | `api/cart` | корзина, merge |
| OrdersController | `api/orders` | checkout, мои заказы, admin list/status |
| WishlistController | `api/wishlist` | избранное |
| StockNotifyController | `api/products/{id}/notify` | уведомить о наличии |
| AdminWishlistController | `api/admin/wishlist` | статистика |
| AdminUserProductsController | `api/admin/users/...` | popular-products |
| DevAdminAuthController | `api/dev` | DEV: admin-login, me, auth-internal-status |
| Program | `api/health` | healthcheck API+SQL |

**Не в Product API:** `users-api` → Admin Service (`/api/admin/users`).

---

## Как это работает

1. Все контроллеры регистрируются convention-based в `AddControllers()`.
2. Публичные GET каталога — без JWT; запись отзывов / checkout / wishlist — с Bearer.
3. Admin-операции требуют role **Admin** (политики в `AuthorizationPolicies`).
4. Swagger: `http://localhost:5272/swagger`.
