# Docker

## Обзор

Проект Perry использует Docker для запуска приложения в изолированном окружении.

Для управления несколькими контейнерами используется Docker Compose.

Docker-окружение состоит из трёх основных сервисов:

- `sqlserver` — база данных SQL Server 2022;
- `api` — backend API на ASP.NET Core 8;
- `web` — web-приложение на ASP.NET Core 8.

Конфигурация находится в файле:

```text
docker-compose.yml