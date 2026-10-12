# Deployment

## Обзор

Проект Perry подготовлен для контейнеризированного развёртывания с использованием Docker.

На текущем этапе подготовлена схема развёртывания через Docker Compose и публикации Docker-образов в GitHub Container Registry (GHCR).

Полное развёртывание в облачной инфраструктуре на данном этапе не выполняется.

---

## Архитектура развёртывания

Основной процесс выглядит следующим образом:

```text
Разработчик
     ↓
GitHub
     ↓
Push / Pull Request
     ↓
GitHub Actions
     ↓
Сборка и тестирование
     ↓
Сборка Docker-образов
     ↓
GitHub Container Registry
     ↓
Развёртывание
Docker-образы

Для проекта используются два собственных Docker-образа:

Backend API
ghcr.io/itstep-perry/perry-api
Web-приложение
ghcr.io/itstep-perry/perry-web

Образы собираются на основе Dockerfile:

src/Perry.Api/Dockerfile
src/Perry.Web/Dockerfile
Теги Docker-образов

При публикации используются:

latest

и SHA соответствующего Git-коммита.

Пример:

ghcr.io/itstep-perry/perry-api:latest
ghcr.io/itstep-perry/perry-api:<commit-sha>

ghcr.io/itstep-perry/perry-web:latest
ghcr.io/itstep-perry/perry-web:<commit-sha>

Тег с Git SHA позволяет определить, какой именно commit соответствует Docker-образу.

GitHub Actions

Публикация Docker-образов выполняется после успешного прохождения основного CI.

Публикация выполняется для изменений, отправленных непосредственно в ветку:

main

Основной процесс:

Push в main
     ↓
GitHub Actions
     ↓
Restore
     ↓
Build
     ↓
Tests
     ↓
Docker Compose validation
     ↓
Docker Build
     ↓
Health Check
     ↓
Publish to GHCR

Если основной CI завершается ошибкой, публикация Docker-образов не выполняется.

Локальное развёртывание

Для локальной разработки (Postgres + API в compose):

```bash
cp .env.example .env
docker compose -f docker-compose.dev.yml up --build -d
```

Сервисы: `perry-postgres` (`:5432`), `perry-api` (`:5272` → контейнер `:8080`).

Проверка: `http://localhost:5272/api/health` и Swagger `http://localhost:5272/swagger`.

Остановка: `docker compose -f docker-compose.dev.yml down`.

## Custom server (#D01)

Корневой `docker-compose.yml` взят из ветки `deploy`: только `perry-api`, без встроенного Postgres.
Нужен внешний PostgreSQL и переменные в `.env`:

- `ConnectionString` — строка подключения к БД
- `NETWORK_MODE` — обычно `host` (по умолчанию)
- `JWT_KEY` / SMTP / Auth — как в `.env.example`

```bash
cp .env.example .env
# заполнить ConnectionString, JWT_KEY (секреты не коммитить)
docker compose up --build -d
```

При `network_mode: host` API слушает порт из `ASPNETCORE_URLS` (по умолчанию `8080`):

- health: `http://localhost:8080/api/health`
- swagger: `http://localhost:8080/swagger`

Фактический деплой на конкретный хост (SSH/IP) — отдельно, когда команда даст доступы.

Остановка

- Локально: `docker compose -f docker-compose.dev.yml down` (с данными: добавьте `-v`).
- Custom server: `docker compose down`.

Конфигурация и секреты

Секреты не коммитить. Локально — `.env` (в `.gitignore`). Пример переменных — `.env.example`
(`ConnectionString`, `NETWORK_MODE`, `JWT_KEY`, SMTP, Auth). Файл `passwod_Azure.txt` и любые
Azure/SSH пароли — только локально, не в git и не в PR.

Текущий статус развёртывания

- `docker-compose.dev.yml` — локальный Postgres + API (CI).
- `docker-compose.yml` — custom server (из ветки `deploy`, #D01).
- Образ API: `src/Perry.Api/Dockerfile`, публикация в GHCR после green CI на `main`.
- Фактический деплой на конкретный хост — когда команда даст SSH и `ConnectionString`.