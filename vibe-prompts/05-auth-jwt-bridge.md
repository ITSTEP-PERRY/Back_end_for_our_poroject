# 05 — Стык с Auth Service (JWT)

[← Оглавление](./README.md) · [← 04 Reviews](./04-reviews-wishlist.md) · **Далее:** [06 — Desktop Vite →](./06-desktop-vite.md)

## Зачем этот шаг

Product API принимает JWT Auth; DEV Admin; без самописного Auth.

## Промпт для ИИ

```text
Контекст: Product API Perry. Auth Service УЖЕ существует (внешний).

Не реализуй полный Auth с нуля. Сделай клиентскую интеграцию:

JWT validation в Product API:
- HS256, Issuer = Perry.AuthService, Audience = Perry.Client
- MapInboundClaims = false
- RoleClaimType = "role", NameClaimType часто = "sub" → НЕ используй Identity.Name как display name
- SigningSecret общий с Auth (env Jwt__SigningSecret)
- DEV fallback: SkipSignatureValidation только как аварийный флаг

Claims helper:
- GetUserId: sub / NameIdentifier
- GetDisplayName: firstName+lastName, name, fullName; ОТКЛОНЯЙ значение если это GUID
- GetEmail, GetRole

DEV shortcut (только Development):
- POST /api/dev/admin-login { login: "Admin", password: "Admin" } → локальный JWT Admin
  с фиксированным Guid (чтобы корзина desktop/mobile совпадала)
- GET /api/dev/me

Optional Internal Auth client (service-to-service):
- POST /internal/auth/token + GET /internal/users/{id} для обогащения имён в заказах/отзывах
- Credential только из env, не в git

Документируй в AUTH-INTEGRATION.md:
- какие claims приходят в реальном токене (часто только sub, email, role)
- multi-step register Auth: register(email, password, confirmPassword)
  → verify-email → complete-registration(firstName, lastName) → login

Фронт/mobile ходят в Auth за login/register, Product — только с Bearer.
```

## Грабли

Обязательно: [PITFALLS — Auth](./PITFALLS.md#2-auth-и-роли) и [промпт-предохранитель](./PITFALLS.md#промпт-предохранитель-для-ии).

## Связанные шаги

- UI регистрации: [07 — Desktop Auth UI](./07-desktop-auth-ui.md)
- Дальше фронт: [06 — Desktop Vite](./06-desktop-vite.md)

