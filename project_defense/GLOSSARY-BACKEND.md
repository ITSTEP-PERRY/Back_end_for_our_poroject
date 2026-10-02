# Словарик бэкендера — Perry (Product API)

Файл с **ASCII-именем** (`GLOSSARY-BACKEND.md`), чтобы ссылки вида `[JWT](./GLOSSARY-BACKEND.md#jwt)` стабильно работали в Cursor / VS Code Preview и на GitHub.

Документ защиты: [DEFENSE_BACKEND.md](./DEFENSE_BACKEND.md).

---

## Оглавление

- [API](#api)
- [ASP.NET Core](#aspnet-core)
- [Auth](#auth)
- [Bearer](#bearer)
- [BE](#be)
- [CDN](#cdn)
- [CI / CD](#ci-cd)
- [CLI](#cli)
- [CORS](#cors)
- [CRUD](#crud)
- [CSS](#css)
- [Controller](#controller)
- [DB / БД](#db)
- [DI](#di)
- [DNS](#dns)
- [DTO](#dto)
- [EF / EF Core](#ef)
- [Env / .env](#env)
- [FE](#fe)
- [FK](#fk)
- [GUID / Uuid](#guid)
- [HTTP / HTTPS](#http)
- [HS256](#hs256)
- [HTML](#html)
- [IaaS / PaaS](#paas)
- [IDE](#ide)
- [IdP](#idp)
- [iss / aud](#iss-aud)
- [JSON](#json)
- [JWT](#jwt)
- [LAN](#lan)
- [LocalDB](#localdb)
- [MVP](#mvp)
- [Npgsql](#npgsql)
- [ORM](#orm)
- [OS](#os)
- [PDP](#pdp)
- [PK](#pk)
- [PNG / SVG](#png-svg)
- [PR](#pr)
- [Prod / Production](#prod)
- [Proxy](#proxy)
- [QA](#qa)
- [REST](#rest)
- [Repo](#repo)
- [RPC](#rpc)
- [SaaS](#saas)
- [SDK](#sdk)
- [SHA](#sha)
- [SLA](#sla)
- [SMTP](#smtp)
- [SPA](#spa)
- [SQL](#sql)
- [SSH](#ssh)
- [SSL / TLS](#tls)
- [SSO](#sso)
- [Swagger / OpenAPI](#swagger)
- [UI / UX](#ui-ux)
- [URI / URL](#url)
- [UUID](#uuid)
- [VM](#vm)
- [Vite](#vite)
- [WWW](#www)
- [XML](#xml)
- [YAML](#yaml)
- [.NET 8](#dotnet)
- [NuGet](#nuget)
- [Product API](#product-api)
- [Perry.Api](#perry-api)
- [Perry.Domain](#perry-domain)
- [Perry.Infrastructure](#perry-infra)
- [Auth Service](#auth-service)
- [Admin Service](#admin-service)
- [#94](#trello-94)
- [#95](#trello-95)
- [#97](#trello-97)
- [#73](#trello-73)
- [#A08](#trello-a08)
- [#A05 / #A10–#A13](#trello-a05)
- [#99–#104](#trello-reviews)
- [MB01](#mb01)
- [sessionId](#sessionid)
- [UserId](#userid)
- [DbSeeder](#dbseeder)
- [DummyJSON](#dummyjson)
- [facets](#facets)
- [merge (cart)](#merge)
- [checkout](#checkout)
- [claims](#claims)
- [resource server](#resource-server)
- [service-to-service / S2S](#s2s)
- [cleartext](#cleartext)
- [10.0.2.2](#android-localhost)
- [Done / To Do / In Progress](#trello-cols)
- [ITSTEP-PERRY](#itstep-perry)
- [AuthClaims](#authclaims)
- [PostgreSQL](#postgresql)
- [Program.cs](#program-cs)
- [Jwt__SigningSecret](#jwt-signing-secret)
- [MigrateAsync](#migrate-async)
- [[Authorize]](#authorize)
- [AppDbContext](#appdbcontext)
- [HTTP 200](#http-200)
- [HTTP 201](#http-201)
- [HTTP 204](#http-204)
- [HTTP 400](#http-400)
- [HTTP 401](#http-401)
- [HTTP 403](#http-403)
- [HTTP 404](#http-404)
- [HTTP 409](#http-409)
- [HTTP 500](#http-500)

---

## Термины

<a id="api"></a>

### API

**Application Programming Interface.** «Дверь» сервиса: набор URL, по которым клиент получает/отправляет данные (у нас REST JSON).

<a id="aspnet-core"></a>

### ASP.NET Core

**платформа Microsoft.** Для веб-API и сайтов; на ней стоит Perry.Api.

<a id="auth"></a>

### Auth

**Authentication / Authorization (сервис).** Отдельный Auth Service: логин, регистрация, выдача JWT. Не путать с Product API.

<a id="bearer"></a>

### Bearer

**Bearer token (схема HTTP).** Способ передать JWT: заголовок `Authorization: Bearer <токен>`.

<a id="be"></a>

### BE

**Backend.** Серверная часть (Api, БД). Метка на Trello.

<a id="cdn"></a>

### CDN

**Content Delivery Network.** Сеть раздачи файлов; картинки DummyJSON часто на CDN.

<a id="ci-cd"></a>

### CI / CD

**Continuous Integration / Delivery.** Автосборки в GitHub Actions (build, test, gitleaks…).

<a id="cli"></a>

### CLI

**Command Line Interface.** Работа из терминала (`dotnet`, `npm`).

<a id="cors"></a>

### CORS

**Cross-Origin Resource Sharing.** Можно ли сайту с `:3000` звать API на `:5272`. Настраивается в Api.

<a id="crud"></a>

### CRUD

**Create, Read, Update, Delete.** Базовые операции над данными.

<a id="css"></a>

### CSS

**Cascading Style Sheets.** Стили фронта; бэкендеру почти не нужен.

<a id="controller"></a>

### Controller

**ASP.NET контроллер.** Класс в Api: принимает HTTP и зовёт Service.

<a id="db"></a>

### DB / БД

**Database.** База данных; у Product — PostgreSQL.

<a id="di"></a>

### DI

**Dependency Injection.** Подсистема .NET: «подставь сервис в конструктор» (`AddScoped`…).

<a id="dns"></a>

### DNS

**Domain Name System.** Имена хостов → IP.

<a id="dto"></a>

### DTO

**Data Transfer Object.** Объект «для провода» (JSON), не обязательно = таблица БД.

<a id="ef"></a>

### EF / EF Core

**Entity Framework Core.** ORM: C#-запросы → SQL к Postgres.

<a id="env"></a>

### Env / .env

**Environment variables.** Секреты и строки подключения вне git (`ConnectionStrings__…`, `Jwt__…`).

<a id="fe"></a>

### FE

**Frontend.** Клиент (React, мобилка). Метка Trello.

<a id="fk"></a>

### FK

**Foreign Key.** Внешний ключ в БД. После #94 FK на Users в Product нет.

<a id="guid"></a>

### GUID / Uuid

**Globally Unique Identifier.** Уникальный id. У нас UserId, sessionId, id сущностей.

<a id="http"></a>

### HTTP / HTTPS

**HyperText Transfer Protocol (Secure).** Протокол запросов. HTTPS — с шифрованием (Auth на Azure).

<a id="hs256"></a>

### HS256

**HMAC SHA-256.** Алгоритм подписи JWT общим секретом (Auth + Product).

<a id="html"></a>

### HTML

**HyperText Markup Language.** Разметка страниц; отдаёт фронт.

<a id="paas"></a>

### IaaS / PaaS

**Infrastructure / Platform as a Service.** Типы облака; Azure Container Apps у Auth — скорее PaaS.

<a id="ide"></a>

### IDE

**Integrated Development Environment.** Cursor / VS / Rider.

<a id="idp"></a>

### IdP

**Identity Provider.** Кто выдаёт личность; у нас — Auth Service.

<a id="iss-aud"></a>

### iss / aud

**Issuer / Audience (JWT claims).** Кто выпустил токен и для кого. ≈ Perry.AuthService / Perry.Client.

<a id="json"></a>

### JSON

**JavaScript Object Notation.** Формат тел API: `{ "price": 10 }`.

<a id="jwt"></a>

### JWT

**JSON Web Token.** Подписанный «пропуск» после логина. Product проверяет, Auth выдаёт.

<a id="lan"></a>

### LAN

**Local Area Network.** Локальная сеть; телефон → `http://192.168.x.x:5272`.

<a id="localdb"></a>

### LocalDB

**SQL Server LocalDB.** Старый локальный SQL; заменён Postgres (#A08).

<a id="mvp"></a>

### MVP

**Minimum Viable Product.** Минимально рабочий набор фич для демо.

<a id="npgsql"></a>

### Npgsql

**.NET PostgreSQL driver.** Драйвер EF/ADO для PostgreSQL.

<a id="orm"></a>

### ORM

**Object-Relational Mapper.** Мост «классы C# ↔ таблицы SQL» (EF Core).

<a id="os"></a>

### OS

**Operating System.** Windows / Linux / Android / iOS.

<a id="pdp"></a>

### PDP

**Product Detail Page.** Страница товара. API: `GET /api/products/{id}`.

<a id="pk"></a>

### PK

**Primary Key.** Первичный ключ таблицы (`Id`).

<a id="png-svg"></a>

### PNG / SVG

**форматы картинок.** Слайды в project_defense — PNG; схемы ещё Mermaid/SVG.

<a id="pr"></a>

### PR

**Pull Request.** Предложение слить ветку в GitHub.

<a id="prod"></a>

### Prod / Production

**рабочая среда.** «Боевой» сервер, не Development.

<a id="proxy"></a>

### Proxy

**прокси.** В dev Vite пересылает `/api` → `:5272`, чтобы обойти CORS.

<a id="qa"></a>

### QA

**Quality Assurance.** Тесты / вопросы на защите (DEFENSE_QA).

<a id="rest"></a>

### REST

**Representational State Transfer.** Стиль API: ресурсы + GET/POST/PUT/DELETE.

<a id="repo"></a>

### Repo

**Repository.** 1) репозиторий GitHub; 2) паттерн доступа к данным.

<a id="rpc"></a>

### RPC

**Remote Procedure Call.** Другой стиль API; мы в основном REST.

<a id="saas"></a>

### SaaS

**Software as a Service.** Готовый сервис в облаке.

<a id="sdk"></a>

### SDK

**Software Development Kit.** Набор библиотек под платформу.

<a id="sha"></a>

### SHA

**Secure Hash Algorithm.** Семейство хешей; в HS256 — HMAC-SHA-256.

<a id="sla"></a>

### SLA

**Service Level Agreement.** Договорённость о доступности.

<a id="smtp"></a>

### SMTP

**Simple Mail Transfer Protocol.** Отправка почты (коды, notify) — #14.

<a id="spa"></a>

### SPA

**Single Page Application.** Один HTML + React (витрина `:3000`).

<a id="sql"></a>

### SQL

**Structured Query Language.** Язык запросов к БД; EF пишет SQL за нас.

<a id="ssh"></a>

### SSH

**Secure Shell.** Удалённый терминал.

<a id="tls"></a>

### SSL / TLS

**шифрование транспорта.** Шифрование HTTPS.

<a id="sso"></a>

### SSO

**Single Sign-On.** Один вход на много сервисов; у нас близко по духу JWT.

<a id="swagger"></a>

### Swagger / OpenAPI

**документация API.** Страница `:5272/swagger`.

<a id="ui-ux"></a>

### UI / UX

**User Interface / Experience.** Экран и удобство; зона FE.

<a id="url"></a>

### URI / URL

**адрес ресурса.** `http://localhost:5272/api/products`.

<a id="uuid"></a>

### UUID

**Universally Unique Identifier.** То же семейство, что GUID; sessionId корзины.

<a id="vm"></a>

### VM

**Virtual Machine.** Виртуальная машина.

<a id="vite"></a>

### Vite

**сборщик / dev-server.** Dev-сервер фронта `:3000` + proxy.

<a id="www"></a>

### WWW

**World Wide Web.** «Веб» в быту.

<a id="xml"></a>

### XML

**eXtensible Markup Language.** Старый формат; у нас почти везде JSON.

<a id="yaml"></a>

### YAML

**YAML Ain't Markup Language.** Часто конфиги CI (`*.yml`).

<a id="dotnet"></a>

### .NET 8

**платформа Microsoft.** Runtime нашего Api.

<a id="nuget"></a>

### NuGet

**пакетный менеджер .NET.** Как npm, но для C#.

<a id="product-api"></a>

### Product API

**Perry Product backend.** Бэкенд каталога и заказов на порту **:5272**.

<a id="perry-api"></a>

### Perry.Api

**проект Web API.** Controllers, JWT, Swagger, Program.cs.

<a id="perry-domain"></a>

### Perry.Domain

**слой Domain.** Сущности без EF.

<a id="perry-infra"></a>

### Perry.Infrastructure

**слой Infrastructure.** EF, Services, Storage, AuthInternalClient.

<a id="auth-service"></a>

### Auth Service

**Backend-client / Azure.** Сервис логина команды; выдаёт user JWT.

<a id="admin-service"></a>

### Admin Service

**users-api.** CRUD пользователей админки.

<a id="trello-94"></a>

### #94

**Trello.** Users убраны из Product DB.

<a id="trello-95"></a>

### #95

**Trello.** Стык JWT: shared secret, claims, iss/aud.

<a id="trello-97"></a>

### #97

**Trello / Internal Auth.** Product → Auth service-to-service.

<a id="trello-73"></a>

### #73

**Trello.** Убрали userId из query — только из JWT.

<a id="trello-a08"></a>

### #A08

**Trello.** Миграция на PostgreSQL.

<a id="trello-a05"></a>

### #A05 / #A10–#A13

**Trello.** Поля заказа: shipping/payment, last update, seller, orderNumber, notify.

<a id="trello-reviews"></a>

### #99–#104

**Trello.** Пакет отзывов (create, AuthClaims, unique, /me, tags).

<a id="mb01"></a>

### MB01

**Trello / docs.** Как мобилке подключить Login/Main/List/PDP к бэку.

<a id="sessionid"></a>

### sessionId

**UUID гостевой корзины.** До login; потом `POST /api/cart/merge`.

<a id="userid"></a>

### UserId

**Guid из JWT.** Claim `sub` → Guid в заказах/wishlist/отзывах.

<a id="dbseeder"></a>

### DbSeeder

**код сидера.** При старте (Dev) наполняет БД демо-данными.

<a id="dummyjson"></a>

### DummyJSON

**внешний каталог фото.** CDN с товарными фото для сида витрины.

<a id="facets"></a>

### facets

**агрегаты фильтров.** Бренды/цвета/размеры в ответе списка товаров.

<a id="merge"></a>

### merge (cart)

**склейка корзин.** Гостевая корзина → корзина залогиненного user.

<a id="checkout"></a>

### checkout

**оформление заказа.** `POST /api/orders/checkout`.

<a id="claims"></a>

### claims

**поля JWT.** `sub`, `email`, `role`…

<a id="resource-server"></a>

### resource server

**принимает JWT.** Product валидирует токен, не выдаёт его.

<a id="s2s"></a>

### service-to-service / S2S

**сервер→сервер.** Internal #97, без браузера.

<a id="cleartext"></a>

### cleartext

**нешифрованный HTTP.** На Android для `http://10.0.2.2` иногда нужно разрешить.

<a id="android-localhost"></a>

### 10.0.2.2

**Android Emulator.** «localhost» хост-машины с эмулятора.

<a id="trello-cols"></a>

### Done / To Do / In Progress

**колонки Trello.** Статусы карточек на доске.

<a id="itstep-perry"></a>

### ITSTEP-PERRY

**org / доска.** Команда на GitHub и Trello.

<a id="authclaims"></a>

### AuthClaims

**хелпер в Api.** Читает `sub` / email / name из JWT. Файл: `src/Perry.Api/Auth/AuthClaims.cs`.

<a id="postgresql"></a>

### PostgreSQL

**СУБД Product.** После #A08 — основная БД Api.

<a id="program-cs"></a>

### Program.cs

**точка входа.** DI, CORS, JWT, migrate, seeder. `src/Perry.Api/Program.cs`.

<a id="jwt-signing-secret"></a>

### Jwt__SigningSecret

**секрет HS256.** Общий с Auth; только в `.env`, не в git.

<a id="migrate-async"></a>

### MigrateAsync

**EF migrate.** При старте Api применяет миграции к БД.

<a id="authorize"></a>

### [Authorize]

**атрибут ASP.NET.** Эндпоинт только для аутентифицированных.

<a id="appdbcontext"></a>

### AppDbContext

**EF DbContext.** Контекст Product API.

<a id="http-200"></a>

### HTTP 200

**OK.** Успешный ответ.

<a id="http-201"></a>

### HTTP 201

**Created.** Ресурс создан.

<a id="http-204"></a>

### HTTP 204

**No Content.** Успех без тела.

<a id="http-400"></a>

### HTTP 400

**Bad Request.** Кривое тело / валидация.

<a id="http-401"></a>

### HTTP 401

**Unauthorized.** Нет или битый JWT.

<a id="http-403"></a>

### HTTP 403

**Forbidden.** JWT есть, прав мало.

<a id="http-404"></a>

### HTTP 404

**Not Found.** Нет сущности или неверный URL.

<a id="http-409"></a>

### HTTP 409

**Conflict.** Напр. второй отзыв на тот же товар.

<a id="http-500"></a>

### HTTP 500

**Internal Server Error.** Упало на сервере — смотри логи.

---

## Путаница

| Говорят | Не путать с |
|---------|-------------|

| Authentication (кто ты) | Authorization (что можно) |

| Auth Service (выдаёт JWT) | AuthClaims (читает JWT) |

| Token JWT | sessionId корзины |

| Migrate (EF) | merge (корзина) |


---

*Кириллический ярлык:* [СЛОВАРИК-БЭКЕНД.md](./СЛОВАРИК-БЭКЕНД.md) → ведёт сюда.
