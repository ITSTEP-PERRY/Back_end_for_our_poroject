# Perry (Product API)

Дипломный маркетплейс **Perry** — бэкенд зоны товаров на **ASP.NET Core 8**  
(`Perry.Domain` · `Perry.Infrastructure` · `Perry.Api` · `Perry.Web`).

| | |
|--|--|
| **Доска Trello** | https://trello.com/b/bwEYs3Kq/itstep-perry |
| **Витрина (React)** | https://github.com/ITSTEP-PERRY/perry-front |
| **Auth Service** | https://github.com/ITSTEP-PERRY/Backend-client |
| **Командный mirror API** | https://github.com/ITSTEP-PERRY/Back_end_for_our_poroject |

---

## Документация = гайд для студента

Вся `docs/` собрана как **методичка**: в каком порядке собрать похожий проект.

1. **Старт здесь → [docs/ГАЙД-ДЛЯ-СТУДЕНТА.md](./docs/ГАЙД-ДЛЯ-СТУДЕНТА.md)** — шаги 0→7  
2. **[docs/журнал/](./docs/журнал/README.md)** — последовательная лента дней (вместо пар «ИЗМЕНЕНИЯ / ОТЧЁТ»)  
3. **[docs/ХРОНИКА-РАБОТЫ.md](./docs/ХРОНИКА-РАБОТЫ.md)** — этапы целиком  
4. Оглавление папок: **[docs/README.md](./docs/README.md)**

| Папка | Зачем |
|-------|--------|
| `docs/журнал/` | хронология работы |
| `docs/инструкции/` | Docker, запуск, smoke, SMTP, Trello |
| `docs/стыки/` | Auth ↔ Product |
| `docs/продукт/` | каталог, кабинет, отзывы, админка, mobile |
| `docs/screenshots/` | скрины |

Последний день журнала: [docs/журнал/2026-10-01.md](./docs/журнал/2026-10-01.md) (mobile + CORS `:8081`).

---

## Быстрый запуск

### Product API (этот репо)

```bash
cp .env.example .env
docker compose up -d postgres
dotnet run --project src/Perry.Api --launch-profile http
```

- API / Swagger: http://localhost:5272/swagger  
- Health: http://localhost:5272/api/health  
- Подробнее: [docs/инструкции/docker.md](./docs/инструкции/docker.md)

### Витрина (perry-front) — две иконки

| Ярлык | URL |
|-------|-----|
| **Perry Desktop** | http://localhost:3000 |
| **Perry Mobile** | http://localhost:8081 |

После clone фронта: `powershell -ExecutionPolicy Bypass -File .\Install-Perry-Shortcuts.ps1`  
Нужен этот API на **`:5272`**.

---

## Smoke перед защитой

[docs/инструкции/SMOKE-ЗАЩИТА.md](./docs/инструкции/SMOKE-ЗАЩИТА.md) · речь SMTP: [docs/инструкции/РЕЧЬ-SMTP-ДЕМО.md](./docs/инструкции/РЕЧЬ-SMTP-ДЕМО.md)

Архитектурные схемы: [`project_defense/`](./project_defense/).

Секреты только в локальном `.env` (не в git).
