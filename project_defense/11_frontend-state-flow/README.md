# Frontend State Flow — Perry

**Изображения:** `diagram.png` (для слайдов) · `diagram.mmd` · `diagram.svg`

---

## Что изображено

Потоки состояния без Redux — три Context + localStorage.

| Store | Файл | Данные |
|-------|------|--------|
| AuthContext | `app/AuthContext.tsx` | user, loading, login/logout, isAdmin |
| CartContext | `app/CartContext.tsx` | cart, count, sessionId |
| WishlistContext | `app/WishlistContext.tsx` | wishlist ids / items |

localStorage: `perry_token`, `perry_cart_session`, `perry_local_admin`.

---

## Как это работает

1. **Auth** — источник истины для «кто я» и роли; страницы читают `useAuth()`.
2. **Cart** — гостевая корзина по UUID `perry_cart_session`; после login — `POST /api/cart/merge`.
3. **Wishlist** — только для авторизованных; синхронизация с `/api/wishlist`.
4. Страницы (Products, Orders, Admin) держат **локальный** `useState` для списков/фильтров — не дублируют в глобальный store.
5. Нет Zustand/Redux в текущей витрине (в отличие от эталона `perry-admin-front`).
