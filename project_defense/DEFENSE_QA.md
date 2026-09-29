# Вопросы и ответы — Perry (защита)

Краткие ответы. Детали — в папках `01_`…`14_`.

---

### Зачем три бэкенда?

Разделение ответственности: Auth — личность и JWT; Product — каталог/заказы; Admin Service — CRUD пользователей. Product не хранит Users (#94).

### Как фронт ходит на Azure без CORS?

В dev Vite proxy: `/auth-api`, `/users-api` — same-origin с `:3000`.

### Откуда UserId в заказах?

Из JWT claim `sub` (`AuthClaims`), не из локальной таблицы Users.

### Как связан JWT Auth и Product?

Общий HS256 secret, Issuer `Perry.AuthService`, Audience `Perry.Client`.

### Что такое Internal Auth #97?

Service-to-service: Product получает service-token и читает `/internal/users/{id}` (например имя получателя).

### Зачем Admin/Admin?

Только Development: локальный вход в админку без Azure, `POST /api/dev/admin-login`.

### Какая БД?

PostgreSQL через EF Core + Npgsql (Docker или Supabase). SQL Server больше не используется.

### Как устроена корзина гостя?

UUID `perry_cart_session` в localStorage → `/api/cart?sessionId=` → после login merge.

### Где Redux?

В нашей витрине нет — Context. Redux/Ant эталон — у `perry-admin-front` команды.

### Что в админке на :3000?

Products, Categories, Reviews, Orders, Users (Users → Admin Service).

### Как деплой / CI?

GitHub Actions: build, test, compose, gitleaks; publish images на main; Azure WebApp — если есть publish profile.

### Миграции?

EF migrations при старте Api + DbSeeder.
