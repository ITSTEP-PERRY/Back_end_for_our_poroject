# Auth integration — Product API ↔ Perry Auth Service

Связано: Trello **#94** (убрать Users из Product), **#95** (уточнить JWT у Влада).  
Отчёт дня: [ОТЧЁТ-2026-09-26.md](./ОТЧЁТ-2026-09-26.md) · вопросы: [ВОПРОСЫ-КОМАНДЕ.md](./ВОПРОСЫ-КОМАНДЕ.md).

## Сервисы

| Роль | Репо / URL |
|------|------------|
| **Auth** (Влада) | [Backend-client](https://github.com/ITSTEP-PERRY/Backend-client) · [API.md](https://github.com/ITSTEP-PERRY/Backend-client/blob/main/docs/API.md) |
| Prod Auth | https://perry-auth-service.orangeplant-910928aa.swedencentral.azurecontainerapps.io/ |
| **Product API** | [Back_end_for_our_poroject](https://github.com/ITSTEP-PERRY/Back_end_for_our_poroject) · локально `:5272` |
| **Front** | [perry-front](https://github.com/ITSTEP-PERRY/perry-front) · `VITE_AUTH_API_URL` → Auth, `/api` proxy → Product |

## Что сделано в Product API (#94)

- Удалены сущности/таблицы `Users`, `UserAccesses`, `UserRoles` и EF-конфиги.
- Миграция `DropUserTables` — снимает FK `Orders`/`WishlistItems` → `Users`, дропает user-таблицы.
- `Order` / `WishlistItem` хранят только `Guid UserId` (без navigation).
- Локальные `/api/auth/*` и `/api/users` убраны — login/register/me/admin users только на Auth Service.
- Claims читаются через `AuthClaims` (`sub` / `nameid` / `userId`, `name`, `email`, role claim configurable).

## Конфиг JWT (Product API)

`appsettings` / User Secrets / env:

```text
Jwt__Key=
Jwt__Issuer=
Jwt__Audience=
Jwt__RoleClaimType=role
Jwt__NameClaimType=name
Jwt__MapInboundClaims=true
AuthService__BaseUrl=https://perry-auth-service...
```

Пока дефолт — локальный HS256 (`Perry` / `Perry`). После ответа Влада (#95) подставить реальные Issuer/Audience/Key (или JWKS).

## Front

- `VITE_AUTH_API_URL` — база Auth Service (см. `.env.example`).
- `authApi` / `usersApi` ходят на Auth; каталог/корзина/заказы — на Product с тем же Bearer.

## Ждём от Влада (#95)

1. Claim с UserId  
2. Формат id (Guid?)  
3. Role claim + значения `User`/`Admin`  
4. Issuer / Audience  
5. HS256 secret или JWKS  
6. Есть ли `name`/`email` в access token  
7. Как получить Internal JWT для `/internal/users/{id}`  
8. CORS для `localhost:3000` / prod front  
