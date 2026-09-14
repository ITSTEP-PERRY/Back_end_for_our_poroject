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
Структура Docker-окружения

Общая схема:

                Docker Compose
                      |
        +-------------+-------------+
        |             |             |
        ↓             ↓             ↓
   SQL Server        API           Web
   perry-sql      perry-api     perry-web
     :1433          :5001         :5000
        |             |
        +-------------+
              |
          Database
            Perry
Сервисы
SQL Server

Контейнер:

perry-sql

Используемый образ:

mcr.microsoft.com/mssql/server:2022-latest

Порт:

1433:1433

Для хранения данных используется Docker volume:

sqlserver_data

Volume подключается к:

/var/opt/mssql

Это позволяет сохранять данные базы данных между перезапусками контейнера.

Backend API

Контейнер:

perry-api

Dockerfile:

src/Perry.Api/Dockerfile

Внутренний порт приложения:

8080

Порт на компьютере:

5001

Доступ к API:

http://localhost:5001

Swagger:

http://localhost:5001/swagger

Health Check:

http://localhost:5001/health
Web

Контейнер:

perry-web

Dockerfile:

src/Perry.Web/Dockerfile

Внутренний порт приложения:

8080

Порт на компьютере:

5000

Доступ к web-приложению:

http://localhost:5000
Переменные окружения

Пароль SQL Server не хранится непосредственно в docker-compose.yml.

Используется переменная:

SA_PASSWORD

В Docker Compose она передаётся через:

${SA_PASSWORD}

Переменная используется для:

SQL Server;
backend API;
web-приложения.

Локальные секретные значения хранятся в .env.

Файл .env не должен добавляться в Git.

Для примера конфигурации используется:

.env.example

В .env.example должны находиться только примерные значения без реальных секретов.

Проверка конфигурации

Перед запуском окружения рекомендуется проверить конфигурацию:

docker compose config

Команда проверяет корректность файла docker-compose.yml.

При использовании секретных переменных итоговая конфигурация может содержать раскрытые значения переменных в выводе команды.

Поэтому вывод docker compose config не следует публиковать в открытом виде, если он содержит секретные данные.

Сборка Docker-образов

Для сборки всех образов используется:

docker compose build

Команда собирает:

perry-api
perry-web

SQL Server не собирается локально, поскольку используется готовый официальный Docker-образ.

Запуск окружения

Для запуска всех сервисов в фоновом режиме:

docker compose up -d

После запуска рекомендуется проверить состояние контейнеров:

docker compose ps

При корректном запуске должны работать:

perry-sql
perry-api
perry-web
Просмотр логов

Для просмотра логов всех сервисов:

docker compose logs

Для просмотра последних 100 строк:

docker compose logs --tail=100

Для просмотра логов конкретного сервиса:

docker compose logs api
docker compose logs web
docker compose logs sqlserver

Для просмотра логов в режиме реального времени:

docker compose logs -f
Проверка API

После запуска контейнеров необходимо проверить health endpoint:

http://localhost:5001/health

При успешном запуске API должен вернуть:

Healthy

Также можно проверить Swagger:

http://localhost:5001/swagger
Остановка окружения

Для остановки контейнеров:

docker compose down

Эта команда останавливает и удаляет контейнеры Docker Compose.

Docker volume базы данных при этом сохраняется, если отдельно не используется команда удаления volumes.

Полный цикл запуска

Для запуска проекта с чистой сборкой можно использовать:

docker compose down
docker compose build
docker compose up -d
docker compose ps

После этого проверить:

http://localhost:5000

и:

http://localhost:5001/health
Пересборка после изменения кода

Если исходный код был изменён, необходимо пересобрать Docker-образы:

docker compose up -d --build

После пересборки рекомендуется проверить состояние:

docker compose ps

И при необходимости посмотреть логи:

docker compose logs --tail=100
Остановка и очистка

Для остановки и удаления контейнеров:

docker compose down

Для удаления контейнеров вместе с volumes:

docker compose down -v

Команда docker compose down -v удаляет volume базы данных, поэтому использовать её следует осторожно.

Проверка работоспособности

Минимальная проверка Docker-окружения включает:

Проверку конфигурации:
docker compose config
Сборку:
docker compose build
Запуск:
docker compose up -d
Проверку контейнеров:
docker compose ps
Проверку API:
http://localhost:5001/health
Проверку web-приложения:
http://localhost:5000
Остановку:
docker compose down

Успешное прохождение этих проверок подтверждает, что Docker-окружение проекта Perry может быть собрано и запущено заново.