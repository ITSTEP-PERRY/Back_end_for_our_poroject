# Docker / env для команды (#5 · #A08)

Единый способ поднять **PostgreSQL + Perry.Api** (SQL Server больше не используется).

Связано: [ОТЧЁТ-2026-09-29-A08-A09.md](./ОТЧЁТ-2026-09-29-A08-A09.md), [SMOKE-ЗАЩИТА.md](./SMOKE-ЗАЩИТА.md).

---

## Что в репозитории

| Файл | Назначение |
|------|------------|
| `docker-compose.yml` | сервисы `postgres` + `api` (+ optional `web`) |
| `.env.example` | шаблон (`POSTGRES_*`, `JWT_KEY`, …) |
| `src/Perry.Api/Dockerfile` | образ API (порт контейнера **8080**) |

React-витрина (`D:\Perry`, Vite `:3000`) в Docker **не** входит — локально с proxy на API.

---

## Быстрый старт

```bash
cd My_Amazon2
cp .env.example .env
# при необходимости переопределите POSTGRES_PASSWORD и JWT_KEY
# (в compose уже есть безопасные defaults для CI / локального старта)

docker compose up --build
# или только БД:
docker compose up -d postgres
dotnet run --project src/Perry.Api --launch-profile http
```

| Сервис | URL |
|--------|-----|
| API + Swagger | http://localhost:5272/swagger |
| PostgreSQL | `localhost:5432` — user/db `perry`, пароль из `.env` |

Миграции и seed — при старте API (`DbSeeder`).

---

## Локально без Docker

Нужен PostgreSQL 16+ и connection string в `appsettings.Development.json` / `.env`:

```text
Host=localhost;Port=5432;Database=perry;Username=perry;Password=…
```

```bash
dotnet run --project src/Perry.Api --launch-profile http
```

---

## Переменные

| Переменная | Описание |
|------------|----------|
| `POSTGRES_DB` / `USER` / `PASSWORD` | БД в compose |
| `ConnectionStrings__DefaultConnection` | Npgsql URI для API вне compose |
| `JWT_KEY` | = `Jwt__SigningSecret` (общий с Auth) |
