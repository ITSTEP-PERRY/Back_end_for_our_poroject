# Backend Auth Flow — Perry

**Изображения:** `diagram.png` (для слайдов) · `diagram.mmd` · `diagram.svg`

---

## Что изображено

Три связанных потока аутентификации.

### A. Пользователь (Auth Service)

Login → JWT → Product API принимает Bearer.

### B. DEV Admin

`Admin` / `Admin` → `POST /api/dev/admin-login` (только Development).

### C. Internal (#97)

Product → Auth `POST /internal/auth/token` → вызовы `internal/users/{id}`.

---

## Как это работает

### Login (покупатель)

1. FE: `POST /auth-api/api/auth/login` { email, password }.
2. Auth Service возвращает access token (HS256).
3. FE кладёт токен в `localStorage` (`perry_token`).
4. Запросы к Product: `Authorization: Bearer …`.
5. Product: `JwtAuthenticationService` — тот же `Jwt__SigningSecret`, Issuer `Perry.AuthService`, Audience `Perry.Client`.
6. `AuthClaims.GetUserId` читает `sub` (и запасные claim types).

### DEV Admin

1. FE в DEV: логин `Admin`/`Admin` → `POST /api/dev/admin-login`.
2. Api выпускает JWT с `role=Admin` (тот же signing secret).
3. `perry_local_admin=1`; `GET /api/dev/me` для восстановления сессии.

### Protected endpoint

1. Нет Bearer → 401 на `[Authorize]`.
2. Невалидная подпись / exp → 401.
3. Нужна роль Admin, а role=User → 403.

### Internal

1. Credential из `AuthService__ServiceCredential`.
2. Token для serviceName `local-service`.
3. Диагностика: `GET /api/dev/auth-internal-status`.
