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

Для локального запуска используется Docker Compose.

Основной файл:

docker-compose.yml

Перед запуском необходимо убедиться, что задана переменная окружения:

SA_PASSWORD

После этого выполняется:

docker compose build

Запуск:

docker compose up -d

Проверка:

docker compose ps
Используемые сервисы

Docker Compose запускает три основных сервиса:

sqlserver
api
web

Контейнеры:

perry-sql
perry-api
perry-web

Порты:

SQL Server → 1433
API        → 5001
Web        → 5000
Проверка после развёртывания

После запуска необходимо проверить состояние контейнеров:

docker compose ps

Все три контейнера должны находиться в состоянии Up.

Затем проверяется API:

http://localhost:5001/health

При успешной работе API возвращает:

Healthy

Web-приложение проверяется по адресу:

http://localhost:5000

Swagger API:

http://localhost:5001/swagger
Перезапуск после изменения кода

После изменения исходного кода Docker-образы необходимо пересобрать:

docker compose up -d --build

После этого рекомендуется выполнить:

docker compose ps

и проверить health endpoint:

http://localhost:5001/health
Остановка

Для остановки Docker-окружения:

docker compose down

При необходимости удалить также данные Docker volume:

docker compose down -v

Удаление volume приводит к удалению сохранённых данных SQL Server, поэтому эту команду следует использовать осторожно.

Конфигурация и секреты

Секретные данные не должны храниться непосредственно в Git-репозитории.

Пароль SQL Server передаётся через переменную:

SA_PASSWORD

Для GitHub Actions используется GitHub Actions Secret:

SA_PASSWORD

Локально секрет может находиться в .env.

Файл .env не должен попадать в Git.

Для примера переменных окружения используется:

.env.example

В .env.example не должны находиться реальные пароли и другие секреты.