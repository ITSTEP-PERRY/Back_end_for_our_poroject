# Auth integration — Product API ↔ Perry Auth Service

Связано: Trello **#94** (Users out) · **#95** (JWT / secrets от Auth — получено 28.09).  
Вопросы: [ВОПРОСЫ-КОМАНДЕ.md](./ВОПРОСЫ-КОМАНДЕ.md).

## Сервисы

| Роль | Репо / URL |
|------|------------|
| **Auth** (Влада) | [Backend-client](https://github.com/ITSTEP-PERRY/Backend-client) · [API.md](https://github.com/ITSTEP-PERRY/Backend-client/blob/main/docs/API.md) |
| Prod Auth | https://perry-auth-service.orangeplant-910928aa.swedencentral.azurecontainerapps.io/ |
| **Product API** | [Back_end_for_our_poroject](https://github.com/ITSTEP-PERRY/Back_end_for_our_poroject) · локально `:5272` |
| **Front** | [perry-front](https://github.com/ITSTEP-PERRY/perry-front) · `VITE_AUTH_API_URL` → Auth, `/api` → Product |

## Что сделано в Product API (#94 + #95)

- Users/FK убраны; в заказах/wishlist только `Guid UserId`.
- Login/register/admin-users — только Auth Service.
- Claims: `AuthClaims` (`sub` / `nameid` / `userId`, `name`, `email`, `role`).
- **Подпись access JWT:** HS256, общий `Jwt:SigningSecret` с Auth (в `.env`, не в git).
- DEV `SkipSignatureValidation` **выключен** по умолчанию (можно включить только как аварийный флаг).

## Конфиг JWT (Product API)

Секреты — только `.env` / User Secrets / host env (см. `.env.example`):

```text
Jwt__SigningSecret=<тот же Jwt:SigningSecret, что у Auth>
Jwt__Key=<то же>
Jwt__Issuer=Perry.AuthService
Jwt__Audience=Perry.Client
Jwt__SkipSignatureValidation=false
Jwt__MapInboundClaims=false
Jwt__RoleClaimType=role
Jwt__NameClaimType=sub
AuthService__BaseUrl=https://perry-auth-service...
AuthService__ServiceName=local-service
# AuthService__ServiceCredential=<plaintext credential, НЕ hash>
```

Issuer/Audience в Development уже `Perry.AuthService` / `Perry.Client`. Если реальный access token имеет другие `iss`/`aud` — поправьте `.env` и сверьте payload на jwt.io.

## Internal JWT (service-to-service)

Endpoint: `POST {Auth}/internal/auth/token`

```json
{ "serviceName": "local-service", "credential": "<plaintext>" }
```

Ответ: `{ accessToken, tokenType, expiresIn }` → Bearer для `GET /internal/users/{id}` (permissions `users.read` / `users.manage`).

В конфиге Auth у команды есть `InternalJwt:Services:0:CredentialHash` — это **хэш**, не пароль сервиса. Product’у нужен **plaintext credential** (попросить у Влада отдельно). Hash и InternalJwt:SigningSecret в Product **не кладём** и на фронт не отдаём.

Не для Product / не коммитить: `Resend:*`, `ConnectionStrings` Auth (Supabase), `VerificationCodes:HashSecret`, `InternalJwt:SigningSecret`.

## Front

- `VITE_AUTH_API_URL` — Auth Service.
- `authApi` / `usersApi` → Auth; каталог/корзина/заказы → Product с тем же access Bearer.

## Статус вопросов #95

| # | Вопрос | Статус |
|---|--------|--------|
| 1–3 | UserId / Guid / role | Частично: читаем `sub`/`nameid`/`userId` + `role` (`User`/`Admin` по API.md) |
| 4 | Issuer / Audience | Рабочие значения Product: `Perry.AuthService` / `Perry.Client` — **подтвердить** по реальному токену |
| 5 | Подпись | ✅ HS256 shared secret (`Jwt:SigningSecret`) |
| 6 | name / email | AuthClaims читает; наличие в токене — проверить login |
| 7 | Internal JWT | ✅ endpoint известен; ⏳ ждём plaintext `credential` для `local-service` |
| 8 | CORS | Product CORS уже включает `:3000`/`:3001`; CORS Auth — у Влада |
