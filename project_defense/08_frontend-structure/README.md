# Frontend Structure — Perry

**Изображения:** `diagram.png` (для слайдов) · `diagram.mmd` · `diagram.svg`

---

## Что изображено

Структура `D:\Perry\src/` — React + Vite.

| Папка | Содержимое |
|-------|------------|
| `app/` | `router.tsx`, Auth/Cart/Wishlist Context, RequireAuth |
| `pages/` | витрина, auth, account, admin |
| `widgets/` | AppShell, ProductCard, admin-модалки |
| `api/` | `client.ts`, `index.ts` (facade), types, media |
| `styles/` | storefront.css, auth.css, admin.css |
| `theme/`, `hooks/`, `forms/`, `Components/` | UI-хелперы |

Точка входа: `main.tsx` → `App.tsx` (провайдеры + `RouterProvider`).

**Без Redux** — React Context + локальный state страниц (Ant Design точечно).

---

## Как это работает

1. `App` оборачивает дерево в Auth → Cart → Wishlist → Router.
2. `api/client.ts` — fetch с Bearer, base URL через Vite proxy.
3. `api/index.ts` — `authApi`, `productsApi`, `ordersApi`, `categoriesApi`, `usersApi`, …
4. Страницы дергают facade; виджеты переиспользуются (карточка товара, admin tree).
