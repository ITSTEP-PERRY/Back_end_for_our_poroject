# Frontend Auth Flow — Perry

**Изображения:** `diagram.png` (для слайдов) · `diagram.mmd` · `diagram.svg`

---

## Что изображено

Потоки входа на фронте: обычный пользователь и DEV-админ.

---

## Как это работает

### Покупатель

1. `/login` → `authApi.login` → `POST /auth-api/api/auth/login`.
2. Токен → `localStorage.perry_token`.
3. `AuthContext` держит `user`, `isAdmin` (`roleId === "Admin"`).
4. При старте: `authApi.me()` → `/auth-api/api/auth/me`.
5. При 401 на Product — logout / повторный login.

### DEV Admin

1. В `import.meta.env.DEV` логин `Admin`/`Admin`.
2. Вместо Auth: `POST /api/dev/admin-login`.
3. Флаг `perry_local_admin=1`; me через `/api/dev/me`.
4. Доступ к `/admin/*` и Product admin endpoints.

### Заголовок

Все `apiFetch` добавляют `Authorization: Bearer <perry_token>` (`client.ts`).
