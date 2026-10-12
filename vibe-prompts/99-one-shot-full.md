# 99 — One-shot (длинный старт)

[← Оглавление](./README.md) · [PITFALLS](./PITFALLS.md)

> **Почему номер 99?** Это не «шаг 99». Файл специально в конце списка (`99`),  
> чтобы не путать с обязательными `00`–`12`. Используй только как запасной one-shot.
>
> Лучше: [PITFALLS](./PITFALLS.md) → [00](./00-vision.md) → … → [12](./12-smoke-and-defense.md).

## Промпт для ИИ

```text
Собери с нуля учебный маркетплейс Perry (ITSTEP):

Монорепо:
- src/Perry.Api + Domain + Infrastructure — ASP.NET Core 8, EF Core, PostgreSQL (Docker)
- frontend/ — React+Vite+TS витрина :3000, proxy /api /auth-api /users-api
- mobile/ — Expo :8081, тот же API/Auth

Product API: categories, products/PDP, cart(+guest sessionId + merge), orders/checkout,
reviews (1 на user+product), wishlist, admin CRUD/moderation. БЕЗ таблицы Users.
JWT от внешнего Auth (Issuer Perry.AuthService, Audience Perry.Client). Display name ≠ sub UUID.
DEV Admin/Admin → /api/dev/admin-login.

Auth UI multi-step: register(confirmPassword) → verify-email → complete-registration → login.
Desktop Figma storefront + admin shell. Mobile зеркало ключевых экранов.
Seed + картинки. Скрипты start-api/desktop/mobile.

Сначала предложи план файлов и milestones на 1 экран, затем реализуй milestone 1
(API health + products list + Vite home). Дальше жди «продолжай» для следующего milestone.
```

## Рекомендуемый путь вместо one-shot

1. [00 — Vision](./00-vision.md)  
2. [01 — Backend skeleton](./01-backend-skeleton.md)  
3. … до [12 — Smoke](./12-smoke-and-defense.md)
