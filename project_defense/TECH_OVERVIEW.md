# Tech Overview — Perry

## Frontend

| Технология | Версия / заметка |
|------------|------------------|
| React | 19 |
| Vite | 8 |
| TypeScript | 6 |
| React Router | 7 |
| Ant Design | 6 (точечно) |
| State | React Context (Auth, Cart, Wishlist) |

## Backend (Product)

| Технология | Заметка |
|------------|---------|
| .NET | 8 |
| ASP.NET Core | Web API + Swagger |
| EF Core | 8 + Npgsql |
| PostgreSQL | 16 (Docker / Supabase) |
| JWT | HS256 shared with Auth Service |
| Docker Compose | postgres + api (+ optional web) |

## Внешние сервисы команды

| Сервис | Роль |
|--------|------|
| perry-auth-service | Login / JWT / Internal |
| perry-admin-service | Admin users CRUD |
| (опц.) perry-admin-front :3001 | Эталон admin UI команды |

## Репозитории

- Витрина + наша админка: рабочая копия `D:\Perry` (ITSTEP perry-front / локальный порт)
- Product API: `My_Amazon2` → Teslyar75 + ITSTEP Back_end
