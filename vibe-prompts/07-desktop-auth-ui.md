# 07 — Auth UI на desktop

[← Оглавление](./README.md) · [← 06 Desktop](./06-desktop-vite.md) · **Далее:** [08 — Admin →](./08-admin-panel.md)

## Зачем этот шаг

Login / multi-step register / account по контракту Auth.

## Промпт для ИИ

```text
Контекст: Vite-витрина Perry + внешний Auth Service.

Реализуй auth flow по контракту Auth (swagger):

Register multi-step (НЕ один POST с name/login):
1) POST /api/auth/register { email, password, confirmPassword }
   → requiresEmailVerification, код на почту
2) UI Verify code → POST /api/auth/verify-email { email, code } → registrationToken
3) Finishing touches → POST /api/auth/complete-registration { registrationToken, firstName, lastName }
4) POST /api/auth/login { email, password } → accessToken + user → сохранить token

Экраны (Figma-style modal):
- /login, /register, /verify-code?email=&context=register, /finishing-touches
- /forgot-password, /reset-password, /auth/success
- Account: orders, wishlist, settings, my reviews
- Sandwich/mobile nav: Sign in / Sign up если гость; имя+email+logout если user

AuthContext:
- login ставит token+user
- register только стартует шаг 1 (без JWT)
- me() через Auth /auth/me; DEV Admin через /dev/me при флаге

DEV: Admin/Admin → Product /api/dev/admin-login (не Azure).

После логина: cart merge по sessionId.

Ошибки Auth вида { message, errors: { field: [] } } показывай текстом полей.
Create review доступен обычному User; 401 → «sign in again», не «as Admin».
```

## Грабли

Сверься с [PITFALLS — Auth](./PITFALLS.md#2-auth-и-роли) перед кодом:  
confirmPassword, нет JWT после register, UUID-имена, ложный «Admin required».

## Связанные шаги

- Контракт JWT: [05 — Auth bridge](./05-auth-jwt-bridge.md)
- Предохранитель: [PITFALLS](./PITFALLS.md)
- Дальше: [08 — Admin panel](./08-admin-panel.md)
