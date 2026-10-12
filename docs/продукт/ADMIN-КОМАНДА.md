# Perry Admin — своя функциональная + эталон команды

## Решение (26.09)

**Админка UI — наша** (`:3000/admin`) — **в ITSTEP-репо не пушим**.  
**Витрина / дизайн / фичи / Product API — в репо команды.**  
Эталон их админки: [perry-admin-front](https://github.com/ITSTEP-PERRY/perry-admin-front) `:3001`.

Документ: [РЕШЕНИЕ-ФРОНТ-АДМИН.md](./РЕШЕНИЕ-ФРОНТ-АДМИН.md)

## Роли

| Приложение | Репо | Порт | Задача |
|------------|------|------|--------|
| **Витрина + наша админка** | perry-front | `:3000` | Покупатель + полный `/admin` |
| **Админ-эталон команды** | perry-admin-front | `:3001` | Ant+Redux shell (reference) |
| **Product API** | [Teslyar75/My_Amazon2](https://github.com/Teslyar75/My_Amazon2) / команда | `:5272` | Каталог / заказы / reviews |
| **Auth** | Backend-client | Azure | Login / JWT |
| **Users admin API** | perry-admin-service | Azure | `/api/admin/users` |

## Локальный запуск нашей админки

```bash
# API
dotnet run --project My_Amazon2/src/Perry.Api --launch-profile http
# FE
npm run dev
# http://localhost:3000/admin
```

Нужна учётка Auth с ролью **Admin**.

Прокси Vite: `/api` → Product, `/auth-api` → Auth, `/users-api` → perry-admin-service.

## Что в нашей `/admin`

- Products — список, category tree, preview, edit
- Categories — дерево + inactive, CRUD
- Reviews — master–detail, Hide / Approve / Delete
- Orders — список, stats #93, детали, смена статуса
- Users — Active / Deleted / All, role, soft-delete / restore

## Эталон команды (`:3001`)

```bash
cd d:\perry-admin-front
npm run dev
```

`.env.development`: Product `/product-api`, Auth `/auth-api`, Users `/users-api`.
