Развертывание проекта для разработчика

1. Получение проекта

git clone https://github.com/ITSTEP-PERRY/Back_end_for_our_poroject
cd Back_end_for_our_poroject

git checkout main
git pull origin main

git checkout -b feature/<название-задачи>


2. Необходимое ПО

- Git
- Docker Desktop
- .NET 8 SDK
- Visual Studio / Rider / VS Code

Проверка:

git --version
docker --version
dotnet --version


3. Запуск Docker-среды

docker compose up --build

Проверка контейнеров:

docker compose ps

Остановка:

docker compose down


4. Настройка переменных окружения

Создать .env из примера:

cp .env.example .env

Windows PowerShell:

Copy-Item .env.example .env

Секретные данные не добавлять в Git.


5. Запуск отдельных сервисов

Backend:

docker compose up --build api

Frontend:

docker compose up --build web

Database:

docker compose up sqlserver

Для запуска всей системы:

docker compose up --build


6. Проверка работоспособности

docker compose ps

Проверить логи Backend:

docker logs perry-api

Swagger API:

http://localhost:5001/swagger

Frontend:

http://localhost:5000

Проверить:
- открытие Frontend;
- загрузку данных из Backend;
- работу API через Swagger;
- подключение Backend к Database;
- отсутствие критических ошибок в логах.


7. Правила работы с Git

Основная ветка:

main

Для разработки создавать feature-ветку:

feature/<название-задачи>

Примеры:

feature/env-example
feature/git-workflow
feature/docker

Не выполнять разработку непосредственно в main.

Перед началом работы:

git checkout main
git pull origin main

Изменения из feature-ветки передаются в main через Pull Request.


8. Ответственные за компоненты

Backend / ASP.NET Core — Backend-разработчик
Frontend / React — Frontend-разработчик
Database — Backend + DevOps
Docker / Docker Compose — DevOps
Git / CI/CD — DevOps
API integration — Frontend + Backend + DevOps
Архитектура проекта — Команда + руководитель

