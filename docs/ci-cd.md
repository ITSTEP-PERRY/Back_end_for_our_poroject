# CI/CD

## Обзор

В проекте Perry используется GitHub Actions для автоматической проверки изменений в исходном коде.

CI-пайплайн автоматически выполняется после отправки изменений в репозиторий или создания Pull Request.

Основная задача CI — проверить, что проект корректно собирается, Docker-окружение запускается, а API становится доступным.

При изменениях в ветке `main` после успешного прохождения CI Docker-образы также публикуются в GitHub Container Registry (GHCR).

---

## Запуск CI

CI запускается в следующих случаях:

- при `push` в ветку `main`;
- при `push` в ветки `feature/**`;
- при создании или обновлении Pull Request в ветку `main`.

Файл GitHub Actions находится по пути:

```text
.github/workflows/ci.yml
Этапы CI-пайплайна

Пайплайн выполняет следующие действия:

Получает исходный код из GitHub.
Устанавливает .NET 8.
Восстанавливает зависимости проекта.
Собирает решение Perry в конфигурации Release.
Запускает автоматические тесты.
Проверяет конфигурацию Docker Compose.
Собирает Docker-образы.
Запускает Docker Compose.
Проверяет состояние контейнеров.
Проверяет доступность API через health check.
Останавливает Docker-окружение.

Общая схема:

Push / Pull Request
        ↓
  GitHub Actions
        ↓
  Получение кода
        ↓
     .NET 8
        ↓
Восстановление зависимостей
        ↓
   Сборка проекта
        ↓
   Автоматические тесты
        ↓
Проверка Docker Compose
        ↓
   Сборка Docker
        ↓
Запуск контейнеров
        ↓
   Health Check
        ↓
Остановка контейнеров
Проверка сборки

Для сборки используется команда:

dotnet build Perry.sln --configuration Release --no-restore

Перед сборкой выполняется восстановление зависимостей:

dotnet restore Perry.sln

Если сборка завершается с ошибкой, CI-пайплайн считается неуспешным.

Тестирование

После сборки выполняется:

dotnet test Perry.sln --configuration Release --no-build --verbosity normal

Этот этап позволяет автоматически проверить тесты проекта.

Если тесты завершаются с ошибкой, дальнейшие этапы CI не должны считаться успешными.

Проверка Docker

Перед запуском окружения выполняется проверка конфигурации Docker Compose:

docker compose config

Затем собираются Docker-образы:

docker compose build

После этого запускается окружение:

docker compose up -d

В проекте используются следующие основные контейнеры:

perry-sql — SQL Server;
perry-api — backend API;
perry-web — web-приложение.
Health Check

Для проверки доступности backend API используется endpoint:

GET /health

Локальный адрес:

http://localhost:5001/health

При корректной работе API endpoint возвращает:

Healthy

CI ожидает успешный ответ от /health.

Если API не становится доступным, CI-пайплайн завершается с ошибкой.

GitHub Container Registry

После успешного выполнения основного CI для изменений, отправленных непосредственно в main, Docker-образы публикуются в GitHub Container Registry (GHCR).

Используются два Docker-образа:

ghcr.io/itstep-perry/perry-api
ghcr.io/itstep-perry/perry-web

Для каждого образа создаются два типа тегов:

latest;
SHA текущего Git-коммита.

Пример:

ghcr.io/itstep-perry/perry-api:latest
ghcr.io/itstep-perry/perry-api:<commit-sha>
ghcr.io/itstep-perry/perry-web:latest
ghcr.io/itstep-perry/perry-web:<commit-sha>

Использование SHA позволяет связать Docker-образ с конкретным состоянием исходного кода.

Секреты

Чувствительные данные не должны храниться непосредственно в исходном коде или Docker Compose.

Пароль SQL Server передаётся через секрет GitHub Actions:

SA_PASSWORD

В Docker Compose используется переменная окружения:

${SA_PASSWORD}

Таким образом, пароль не хранится непосредственно в конфигурации репозитория.

Файл .env используется для локальных настроек и не должен добавляться в Git.

Для примера переменных окружения используется:

.env.example

В .env.example не должны находиться реальные пароли, токены или другие секретные данные.

Результат выполнения CI

Успешное выполнение CI означает, что:

исходный код успешно получен из репозитория;
зависимости успешно восстановлены;
решение успешно собирается;
тесты выполняются успешно;
конфигурация Docker Compose корректна;
Docker-образы успешно собираются;
контейнеры запускаются;
API становится доступным;
health check проходит успешно.

Если один из обязательных этапов завершается с ошибкой, GitHub Actions показывает неуспешный результат выполнения CI.

Используемые технологии

В CI/CD используются:

GitHub;
GitHub Actions;
.NET 8;
Docker;
Docker Compose;
GitHub Container Registry (GHCR).

Основная схема доставки:

Разработчик
     ↓
GitHub
     ↓
Push / Pull Request
     ↓
GitHub Actions
     ↓
Build + Tests
     ↓
Docker Build
     ↓
Health Check
     ↓
GHCR