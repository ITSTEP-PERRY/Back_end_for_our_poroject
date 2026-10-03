# Как запустить Product API (этот репозиторий)

Репозиторий: **[Teslyar75/My_Amazon2](https://github.com/Teslyar75/My_Amazon2)** — бэкенд зоны товаров (**Perry.Api**).

После запуска:

| Что | URL |
|-----|-----|
| Swagger | http://localhost:5272/swagger |
| Health | http://localhost:5272/api/health |
| Пример каталога | http://localhost:5272/api/products?page=1&pageSize=5 |

---

## 0. Что поставить на ПК (один раз)

| ПО | Зачем | Проверка в терминале |
|----|--------|----------------------|
| **[.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)** | Сборка и `dotnet run` | `dotnet --version` → начинается с `8.` |
| **[Docker Desktop](https://www.docker.com/products/docker-desktop/)** | PostgreSQL в контейнере | `docker version` без ошибки |
| Git | Клон репозитория | `git --version` |

Windows: после установки Docker Desktop — запустите его и дождитесь статуса **Running** (кит в трее).

---

## 1. Клон

```powershell
git clone https://github.com/Teslyar75/My_Amazon2.git
cd My_Amazon2
```

---

## 2. Файл `.env` (один раз)

В корне репозитория:

```powershell
copy .env.example .env
```

Для локального демо **можно ничего не менять**: в примере уже есть Postgres `perry` / `changeme` и stub SMTP.

Если нужны **логин / корзина по JWT** как у команды — в `.env` подставьте тот же секрет, что у Auth Service:

```env
Jwt__SigningSecret=...одинаковый_с_Auth...
Jwt__Key=...то_же_самое...
JWT_KEY=...то_же_самое...
```

Без общего секрета каталог и health всё равно работают; защищённые эндпоинты с токеном Auth — нет.

Подробнее про Docker/env: [docker.md](./docker.md).

---

## 3. Самый простой способ — ярлык / `.cmd`

### 3.1. Создать ярлык (один раз)

В корне клона:

```powershell
powershell -ExecutionPolicy Bypass -File .\Install-Perry-Shortcuts.ps1
```

Появятся:

- `Perry API.lnk` в корне репозитория  
- `Perry API.lnk` на рабочем столе  

### 3.2. Запуск каждый день

1. Убедитесь, что **Docker Desktop запущен**.  
2. Дважды кликните **Perry API** (или `start-api.cmd` / `Запуск-API.cmd`).  
3. Дождитесь в консоли строк вроде `Now listening on: http://localhost:5272`.  
4. Откройте http://localhost:5272/swagger  

Окно консоли **не закрывайте**, пока работаете с API. Остановка: `Ctrl+C`.

Скрипт сам:

1. поднимает Postgres (`docker compose up -d postgres`);  
2. при отсутствии `.env` копирует `.env.example`;  
3. запускает `dotnet run --project src\Perry.Api --launch-profile http`.

---

## 4. Запуск вручную (без ярлыка)

```powershell
cd путь\к\My_Amazon2

# если ещё нет .env
copy .env.example .env

# БД
docker compose up -d postgres

# API
dotnet run --project src\Perry.Api --launch-profile http
```

Альтернатива — весь стек в Docker (API внутри контейнера на хосте тоже `:5272`):

```powershell
docker compose up --build
```

См. [docker.md](./docker.md).

---

## 5. Проверка, что всё живо

В браузере или PowerShell:

```powershell
Invoke-RestMethod http://localhost:5272/api/health
```

Ожидается что-то вроде: `"status":"Healthy"`, `"database":"up"`.

Дальше:

```text
GET http://localhost:5272/api/categories
GET http://localhost:5272/api/products?page=1&pageSize=1
```

Миграции и seed выполняются при старте API — отдельно гонять EF обычно не нужно.

---

## 6. Типичные сбои

| Симптом | Что сделать |
|---------|-------------|
| `docker` не находится / pipe error | Запустить **Docker Desktop**, подождать ~30 с, повторить |
| Порт `5432` занят | Остановить другой Postgres или сменить порт в `docker-compose.yml` и connection string |
| Порт `5272` занят | Закрыть старый `dotnet run` / другой процесс на 5272 |
| API стартует, `database` не `up` | `docker compose ps` — контейнер `perry-postgres` должен быть healthy |
| JWT / 401 на защищённых методах | Совпадение `Jwt__SigningSecret` с Auth; либо перелогин на витрине (просроченный токен) |
| Нет SDK | Установить .NET **8** SDK (не только runtime) |

Общий разбор: [troubleshooting.md](./troubleshooting.md).

---

## 7. Что это за порты

| Порт | Сервис |
|------|--------|
| **5272** | Perry.Api (Product) — этот репозиторий |
| **5432** | PostgreSQL (Docker `perry-postgres`) |
| 3000 / 8081 | Витрина Desktop / Mobile — **другой** репозиторий (`perry-front`), сюда не входит |

Витрина ходит в Product по `http://localhost:5272` (прокси `/api`). Auth — Azure Auth Service, не этот репо.

---

## 8. Файлы в корне репо

| Файл | Назначение |
|------|------------|
| `start-api.cmd` | Основной запуск |
| `Запуск-API.cmd` | Короткий алиас → `start-api.cmd` |
| `Install-Perry-Shortcuts.ps1` | Создаёт `Perry API.lnk` |
| `.env.example` | Шаблон настроек → копировать в `.env` |
| `docker-compose.yml` | Postgres (+ опционально api/web) |

Файлы `*.lnk` в git **не** хранятся — их создаёт скрипт установки.

---

*Репозиторий: Teslyar75/My_Amazon2 · обновлено: 2026-10-03*
