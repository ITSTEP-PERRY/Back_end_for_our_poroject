# Docker / env для команды (#5)

Единый способ поднять **SQL Server + Perry.Api** без LocalDB.

Связано: [SMTP-НАСТРОЙКА.md](./SMTP-НАСТРОЙКА.md), [SMOKE-ЗАЩИТА.md](./SMOKE-ЗАЩИТА.md).

---

## Что в репозитории

| Файл | Назначение |
|------|------------|
| `docker-compose.yml` | сервисы `sqlserver` + `api` |
| `.env.example` | шаблон переменных (скопировать в `.env`) |
| `src/Perry.Api/Dockerfile` | образ API (порт контейнера **8080**) |

React-витрина (`D:\Perry`, Vite `:3000`) в Docker **не** входит — её гоняют локально с proxy на API.

---

## Быстрый старт

```bash
cd My_Amazon2
cp .env.example .env
# при необходимости отредактируйте SA_PASSWORD / JWT_KEY

docker compose up --build
```

| Сервис | URL |
|--------|-----|
| API + Swagger | http://localhost:5272/swagger |
| SQL Server | `localhost,1433` — user `sa`, пароль из `.env` |

Миграции и seed выполняются при старте API (`DbSeeder.MigrateAsync` / `SeedAsync` в Development).

Админ по умолчанию: **`Admin` / `Admin`**.

---

## Локально без Docker (как раньше)

```bash
# API
dotnet run --project src/Perry.Api --launch-profile http
# → http://localhost:5272/swagger
# БД: (localdb)\mssqllocaldb → Perry

# Фронт (из корня D:\Perry)
npm run dev
# → http://localhost:3000  (proxy /api → :5272)
```

---

## Переменные окружения

| Переменная | Описание |
|------------|----------|
| `SA_PASSWORD` | пароль `sa` для SQL Server (сложный, иначе контейнер не стартует) |
| `JWT_KEY` | ключ подписи JWT (≥32 символа) |
| `SMTP_USE_STUB` | `true` — stub в лог; `false` — Gmail App Password |
| `SMTP_FROM` / `SMTP_USERNAME` / `SMTP_PASSWORD` | только если stub выключен |

Connection string API в compose собирается автоматически на хост `sqlserver`.

---

## Типичные проблемы

1. **SQL не healthy** — пароль слишком простой; смените `SA_PASSWORD` (≥8, буквы+цифры+символ).  
2. **API 502 с фронта** — compose не поднят или порт 5272 занят; `docker compose ps`.  
3. **Письма не приходят** — при stub смотрите логи контейнера `perry-api`; реальный SMTP — [SMTP-НАСТРОЙКА.md](./SMTP-НАСТРОЙКА.md).
