# Архитектура проекта Perry

## Общая архитектура

Проект Perry состоит из web-приложения, backend API и базы данных SQL Server.

Для контейнеризации используется Docker Compose.

```text
                    Пользователь
                         │
                         ▼
                  ┌─────────────┐
                  │ Perry Web   │
                  │    :5000    │
                  └──────┬──────┘
                         │
                         ▼
                  ┌─────────────┐
                  │ Perry API   │
                  │    :5001    │
                  └──────┬──────┘
                         │
                         ▼
                  ┌─────────────┐
                  │ SQL Server  │
                  │    :1433    │
                  └─────────────┘
                  CI/CD архитектура

После добавления автоматизации процесс разработки выглядит следующим образом:

                       Разработчик
                            │
                            ▼
                    Feature-ветка
                            │
                            ▼
                         GitHub
                            │
                  ┌─────────┴─────────┐
                  │                   │
             Pull Request           Push
                  │                   │
                  └─────────┬─────────┘
                            ▼
                    GitHub Actions
                            │
                            ▼
                ┌─────────────────────┐
                │   Restore .NET      │
                │   Build             │
                │   Tests             │
                │   Docker validation │
                │   Docker Build      │
                └──────────┬──────────┘
                           │
                           ▼
                    Health Check
                           │
                     ┌─────┴─────┐
                     │           │
                  Успех        Ошибка
                     │           │
                     ▼           ▼
                  GHCR        CI Failed
                     │
                     ▼
              Docker Images
                     │
          ┌──────────┴──────────┐
          │                     │
          ▼                     ▼
      perry-api             perry-web
Docker-окружение

Docker Compose запускает три основных сервиса:

┌─────────────────────────────────────────┐
│              Docker Compose             │
│                                         │
│  ┌────────────┐  ┌────────────┐         │
│  │ perry-web  │  │ perry-api  │         │
│  │   :5000    │─▶│   :5001    │         │
│  └────────────┘  └─────┬──────┘         │
│                        │                │
│                        ▼                │
│                 ┌────────────┐          │
│                 │ perry-sql  │          │
│                 │   :1433    │          │
│                 └────────────┘          │
│                                         │
└─────────────────────────────────────────┘
CI/CD поток

Полный процесс изменения приложения:

Разработка
    ↓
Feature branch
    ↓
Pull Request
    ↓
GitHub Actions
    ↓
Restore
    ↓
Build
    ↓
Tests
    ↓
Docker Build
    ↓
Запуск Docker Compose
    ↓
Health Check
    ↓
CI успешно
    ↓
Merge в main
    ↓
GitHub Actions
    ↓
Публикация Docker Images
    ↓
GHCR
Компоненты системы
Компонент	Назначение
GitHub	Хранение исходного кода и Pull Requests
GitHub Actions	Автоматизация CI/CD
.NET 8	Backend и Web-приложение
Docker	Контейнеризация
Docker Compose	Запуск локального окружения
SQL Server 2022	База данных
GHCR	Хранение Docker-образов
/health	Проверка доступности API
Порты
Сервис	Порт
Perry Web	5000
Perry API	5001
SQL Server	1433
Docker Images

После успешного CI Docker-образы публикуются в GitHub Container Registry:

ghcr.io/itstep-perry/perry-api
ghcr.io/itstep-perry/perry-web

Для образов используются теги:

latest

и SHA соответствующего Git-коммита.

Секреты

Пароль SQL Server не хранится непосредственно в исходном коде.

Для передачи пароля используется:

SA_PASSWORD

Локально значение передаётся через переменные окружения.

В GitHub Actions используется GitHub Secret.

Результат

Актуальная архитектура проекта включает не только приложение и Docker-инфраструктуру, но и автоматизированный процесс CI/CD:

GitHub
   ↓
GitHub Actions
   ↓
Build + Tests
   ↓
Docker
   ↓
Health Check
   ↓
GHCR
   ↓
Deployment