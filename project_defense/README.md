# Project Defense Materials — Perry

**Project:** Perry (интернет-магазин / diploma ITSTEP)  
**Purpose:** Материалы для защиты: архитектура, потоки, маршруты, auth  
**Repos:** `D:\Perry` (React) + `D:\Perry\My_Amazon2` (Product API)

---

## Документы (корень)

| File | Description |
|------|-------------|
| `README.md` | Этот индекс |
| **`DEFENSE_BACKEND.md`** | **Отчёт перед комиссией: Product API без админки** + Done-карточки Trello (BE) |
| **`GLOSSARY-BACKEND.md`** | Словарик бэкендера (якоря `#jwt`…) · ярлык [СЛОВАРИК-БЭКЕНД.md](./СЛОВАРИК-БЭКЕНД.md) |
| `ARCHITECTURE_DIAGRAMS.md` | Сводка всех диаграмм + Mermaid |
| `TECH_OVERVIEW.md` | Стек технологий |
| `DEFENSE_SPEECH.md` | Черновик устной речи (общий FE+API) |
| `DEFENSE_QA.md` | Типовые вопросы комиссии (общие) |
| **`qa/`** | **Q&A по членам команды** (Сергей / Влад / Яна / Илона / sanyamart13) |

---

## Диаграммы (каждая в отдельной папке)

В каждой папке: **`README.md`** + **`diagram.png`** (готово к слайдам) + исходники `diagram.mmd` / `diagram.svg`.  
Пересборка PNG: `npx mmdc -i diagram.mmd -o diagram.png -c mermaid-config.json -b '#0f1419' -s 2`

### Backend / система

| Папка | Описание |
|-------|----------|
| `01_architecture-overview/` | Общая архитектура: Browser, Vite, Product API, Auth, Admin Service, PostgreSQL |
| `02_architecture-request-flow/` | Маршрутизация Vite proxy: `/api`, `/auth-api`, `/users-api`, `/uploads` |
| `03_backend-structure/` | Solution: Perry.Api / Domain / Infrastructure / Web |
| `04_backend-database-layer/` | EF Core + Npgsql, сущности Product DB |
| `05_backend-routes/` | Контроллеры и префиксы `/api/*` |
| `06_backend-request-flow/` | HTTP: CORS → JWT → Controller → Service → DB |
| `07_backend-auth-flow/` | JWT Auth Service + DEV Admin/Admin + Internal #97 |

### Frontend

| Папка | Описание |
|-------|----------|
| `08_frontend-structure/` | Структура `src/`: app, pages, widgets, api |
| `09_frontend-routes/` | React Router: витрина, account, admin |
| `10_frontend-auth-flow/` | Login Auth / локальный Admin, Bearer, me |
| `11_frontend-state-flow/` | AuthContext, CartContext, WishlistContext |
| `12_frontend-cart-checkout-flow/` | Корзина sessionId → merge → checkout → заказы |

### Интеграции и изменения

| Папка | Описание |
|-------|----------|
| `13_auth-microservices/` | Auth Service + Admin Users Service + Product (стыки #94–#97) |
| `14_changelog-illustrations/` | Иллюстрации доработок + **DummyJSON-медиа** + **admin product/images** |
| `qa/` | Q&A по членам команды для комиссии |

---

## Быстрый запуск для демо

```powershell
# API (из My_Amazon2, с .env → Postgres/Supabase)
cd D:\Perry\My_Amazon2
$env:ASPNETCORE_ENVIRONMENT='Development'
dotnet run --project src/Perry.Api --urls http://localhost:5272

# FE
cd D:\Perry
npm run dev
```

- Витрина: http://localhost:3000  
- Swagger: http://localhost:5272/swagger  
- Админ DEV: http://localhost:3000/admin/login → `Admin` / `Admin`

---

## Использование на защите

1. Слайды — SVG / экспорт PNG из папок `01_`…`14_`
2. README в папке — текст объяснения схемы
3. `DEFENSE_SPEECH.md` — устное выступление
4. `DEFENSE_QA.md` — ответы комиссии
