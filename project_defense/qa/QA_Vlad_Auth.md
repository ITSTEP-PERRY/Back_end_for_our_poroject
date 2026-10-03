# Защита — Влад (Auth Service)

**Роль:** Auth Service (`Backend-client`) — регистрация, логин, JWT, профиль пользователя, Internal API для Product.  
**Репо:** [ITSTEP-PERRY/Backend-client](https://github.com/ITSTEP-PERRY/Backend-client).

---

### Чем ты занимался?

Сервис аутентификации: register/login/forgot/reset, выдача JWT, `/me`, роли, Internal endpoint для других сервисов (#97).

### Зачем отдельный Auth, а не логин в Product?

Пароли и users — одна зона ответственности. Product не должен хранить хеши паролей (#94).

### Что внутри JWT?

Access token HS256: `sub` (UserId), роль, iss/aud. Product валидирует тем же секретом.

### Кто задаёт Issuer / Audience / secret?

Auth — источник правды; Product и Front настраивают те же значения (#95/#96/#98).

### Что такое Internal Auth?

S2S: Product (или другой сервис) обменивает credential на service-token и читает `/internal/users/{id}` — без выдачи user-пароля.

### Как Front логинится?

`POST` login на Auth → Bearer в запросах к Product (и к Admin Service для users).

### CORS?

CORS Auth — зона Auth (localhost:3000 / Azure origin). Product CORS отдельно.

### Где хранятся пользователи админки?

Users CRUD для админки — Admin Service (`users-api`); Auth владеет identity.

### Что показать на демо?

Login → токен → `me` → тот же Bearer на Product (`/api/orders`, reviews).
