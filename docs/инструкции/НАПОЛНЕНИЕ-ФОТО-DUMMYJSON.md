# Как загрузить фото витрины (DummyJSON)

Инструкция для команды: после `git pull` наполнить **свою** БД Product API реалистичными фото товаров.

**Источник:** [DummyJSON Products](https://dummyjson.com/docs/products) → CDN `cdn.dummyjson.com`  
**Код:** `src/Perry.Infrastructure/Persistence/DbSeeder.cs`  
**Отчёт:** [журнал/2026-10-02.md](../журнал/2026-10-02.md)

Фото **не лежат в git** — в БД пишутся URL. Нужен интернет (или хотя бы доступ к CDN при просмотре витрины).

---

## Что получите

- ~194 товара с SKU `DJ-001` … (идемпотентно — повторный запуск не плодит дубли)
- Разделы **Beauty**, **Home & Kitchen** (если ещё не было)
- Старые picsum/unsplash на демо-товарах и плитках категорий → DummyJSON
- Итого в каталоге обычно **~200+** позиций с `imageUrl` на `cdn.dummyjson.com`

---

## Вариант A — локальный Docker Postgres (рекомендуется для своей копии)

### 1. Обновить код Product API

```bash
git pull
```

Репозитории с сидером:

- https://github.com/Teslyar75/My_Amazon2  
- https://github.com/ITSTEP-PERRY/Back_end_for_our_poroject  

Ветка: `main` (коммит с DummyJSON seed).

### 2. Поднять Postgres

Из корня solution (где `docker-compose.yml`):

```bash
docker compose up -d postgres
```

Дождитесь `healthy` (`docker ps`).

### 3. Локальный `.env` на Postgres

В корне solution или в `src/Perry.Api` файл **`.env`** (не коммитить):

```env
ConnectionStrings__DefaultConnection=Host=localhost;Port=5432;Database=perry;Username=perry;Password=changeme
ASPNETCORE_ENVIRONMENT=Development
```

Остальные ключи JWT — как в `.env.example` / у команды.

> Важно: сидер вызывается **только в Development** (`Program.cs`).  
> В Production / Staging фото сами не появятся.

### 4. Запустить API

```bash
cd src/Perry.Api
dotnet run --launch-profile http
```

Или URL: `http://0.0.0.0:5272` / профиль `http` → порт **5272**.

При старте:

1. миграции;
2. `SeedAsync` → загрузка DummyJSON (сеть) или embedded JSON;
3. импорт `DJ-*` + замена плейсхолдеров.

Первый прогон может занять **несколько минут** (много отзывов/картинок в логе EF — это нормально).

### 5. Проверка

```text
http://localhost:5272/swagger
GET /api/products?page=1&pageSize=5
```

Ожидаемо:

- `total` ≈ 200+
- у `items[].imageUrl` хост `cdn.dummyjson.com`

Витрина:

- Desktop: http://localhost:3000  
- Mobile: http://localhost:8081  

(нужен запущенный front из perry-front).

---

## Вариант B — общая Supabase команды

Если в `.env` строка на **общий** pooler Supabase:

1. `git pull` + API в **Development**.
2. Сидер при старте **допишет** недостающие `DJ-*` и поправит picsum/unsplash.
3. Уже залитые `DJ-*` **не дублируются** (SKU уникальны).

Не триггерьте сид на продакшен-окружении без договорённости с командой.

---

## Вариант C — фото не появились

| Симптом | Что сделать |
|---------|-------------|
| `total` маленький, нет `DJ-` | Убедиться: `ASPNETCORE_ENVIRONMENT=Development`, перезапустить API |
| В логе нет Seed / нет DummyJSON | Смотрите `Program.cs`: Seed только в Development |
| URL есть, картинки серые | Проверить интернет / доступ к `cdn.dummyjson.com` |
| Подключились не к той БД | Сверить `ConnectionStrings__DefaultConnection` в `.env` |
| Хотите «с нуля» локально | `docker compose down -v` (⚠️ сотрёт том Postgres) → снова `up` → `dotnet run` |

Повторный старт API безопасен: сидер идемпотентен по `DJ-*`.

---

## Что не нужно делать

- Не скачивать фото вручную в `/uploads`
- Не копировать картинки с Amazon / магазинов
- Не коммитить `.env` и дампы БД с секретами

---

## Краткая шпаргалка

```bash
git pull
docker compose up -d postgres
# .env → localhost Postgres + Development
cd src/Perry.Api && dotnet run --launch-profile http
# открыть /api/products — imageUrl с cdn.dummyjson.com
```

Вопросы по стыку Auth/JWT — см. [стыки/](../стыки/README.md). Запуск витрины — [КАК-ЗАПУСКАТЬ.md](./КАК-ЗАПУСКАТЬ.md).
