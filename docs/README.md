# Документация Perry

**Начни здесь:** [ХРОНИКА-РАБОТЫ.md](./ХРОНИКА-РАБОТЫ.md) — единый документ: последовательность всей работы, запуск, smoke, бэклог.

---

## Инструкции (как пользоваться)

| Файл | О чём |
|------|--------|
| [ACCOUNT-КАБИНЕТ.md](./ACCOUNT-КАБИНЕТ.md) | Wishlist / My orders / Settings — пошагово |
| [ВОССТАНОВЛЕНИЕ-ПАРОЛЯ.md](./ВОССТАНОВЛЕНИЕ-ПАРОЛЯ.md) | Forgot / Reset / Finishing / VerifyCode |
| [SMTP-НАСТРОЙКА.md](./SMTP-НАСТРОЙКА.md) | Stub → реальный Gmail |
| [РЕЧЬ-SMTP-ДЕМО.md](./РЕЧЬ-SMTP-ДЕМО.md) | Речь на защиту (~1 мин) |
| [SMOKE-ЗАЩИТА.md](./SMOKE-ЗАЩИТА.md) | Чеклист Register→Buy→Admin |
| [docker.md](./docker.md) | docker compose + `.env` |
| [КАК-ВЫПОЛНЯТЬ-ЗАДАНИЕ.md](./КАК-ВЫПОЛНЯТЬ-ЗАДАНИЕ.md) | Запуск и разбор кода |

## Доска Trello (как вели задачи)

| Файл | О чём |
|------|--------|
| [TRELLO-TODO.md](./TRELLO-TODO.md) | Нумерация карточек #1–#88 с доски [ITSTEP-PERRY](https://trello.com/b/bwEYs3Kq/itstep-perry) — видно, что работа шла через Trello |

## Срезы по датам (история этапов)

| Файл | О чём |
|------|--------|
| [ИЗМЕНЕНИЯ-2026-09-17.md](./ИЗМЕНЕНИЯ-2026-09-17.md) | Каталог / PDP / React-порт |
| [ИЗМЕНЕНИЯ-Account-2026-09-17.md](./ИЗМЕНЕНИЯ-Account-2026-09-17.md) | Account |
| [ИЗМЕНЕНИЯ-2026-09-19.md](./ИЗМЕНЕНИЯ-2026-09-19.md) | Спринт к защите |

## Углубление

| Файл | О чём |
|------|--------|
| [КАТЕГОРИИ.md](./КАТЕГОРИИ.md) | Categories API / seed |
| [КАТАЛОГ-ТОВАРОВ-АРХИТЕКТУРА.md](./КАТАЛОГ-ТОВАРОВ-АРХИТЕКТУРА.md) | Product + Variants |
| [TRELLO-TODO.md](./TRELLO-TODO.md) | Карточки #1–#88 |

## Скриншоты

| Галерея | Ссылка |
|---------|--------|
| Витрина / auth / legal | [screenshots/README.md](./screenshots/README.md) |
| Account (14) | [screenshots/account/](./screenshots/account/) |
| Спринт 19.09 (15) | [screenshots/sprint-2026-09-19/README.md](./screenshots/sprint-2026-09-19/README.md) |

---

## Быстрый старт (демо)

```bash
# API
dotnet run --project src/Perry.Api --launch-profile http
# → http://localhost:5272/swagger

# React (perry-front)
npm run dev
# → http://localhost:3000
# Admin: /admin/login — Admin / Admin
```

Подробности и хроника: **[ХРОНИКА-РАБОТЫ.md](./ХРОНИКА-РАБОТЫ.md)**.
