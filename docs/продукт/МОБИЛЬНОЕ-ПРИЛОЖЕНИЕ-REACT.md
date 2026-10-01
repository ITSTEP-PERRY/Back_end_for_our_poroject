# Мобильная версия на React под наш бэкенд

**Цель:** клиент для покупателя (витрина) на **React Native / Expo**, без переписывания Product API и Auth.  
**Бэкенд остаётся:** Perry Product API + Perry Auth Service (Azure) + (опционально) Users admin — **только web**.  
**Не в скоупе мобилки:** админка `/admin`, Razor, Internal Auth (#97).

Связанные: [AUTH-INTEGRATION.md](./AUTH-INTEGRATION.md) · [СТЫКИ-ЛОКАЛЬНО.md](./СТЫКИ-ЛОКАЛЬНО.md) · [ОТЧЁТ-2026-09-29.md](./ОТЧЁТ-2026-09-29.md) · витрина-эталон: [perry-front](https://github.com/ITSTEP-PERRY/perry-front)

---

## 1. Вывод в одну фразу

**Бэкенд уже готов как API для мобилки.** Работа = новый React Native (Expo) фронт + тонкая подгонка URL/JWT/медиа. Переписывать Product/Auth не нужно.

---

## 2. Что переиспользуем как есть

| Сервис | Зачем мобилке |
|--------|----------------|
| **Auth Service** (Azure) | `login` / `register` / `refresh` / `me` → access JWT |
| **Product API** | каталог, PDP, корзина, checkout, заказы, отзывы, wishlist |
| **JWT claims** | `sub` (UserId), `role` — как на web |
| **Контракты JSON** | те же DTO, что ест текущий React `:3000` |

Админ-service / React `/admin` / Razor — **не** входят в mobile MVP.

---

## 3. Какой стек мобилки (рекомендация)

| Вариант | Когда | Трудозатраты* |
|---------|--------|----------------|
| **A. Expo (React Native)** ★ | «Настоящее» приложение iOS/Android | **основной план** ниже |
| **B. Capacitor** вокруг текущего Vite React | быстрый «ярлык» на телефон | меньше, UX web-like |
| **C. PWA** | без сторов, только браузер | меньше всего |

\*Относительно команды 1–2 человека, знакомых с React.

**Рекомендуем A (Expo):** один код iOS/Android, TypeScript, тот же опыт, что у web-команды, без переписывания бэка.

---

## 4. Архитектура

```text
┌─────────────────────────┐
│  Expo / React Native    │
│  (экраны витрины)       │
└───────────┬─────────────┘
            │ HTTPS + Bearer access JWT
     ┌──────┴──────┐
     ▼             ▼
 Auth Service   Product API
 (login/me)     (catalog/cart/orders/…)
```

- Базовые URL — из env (`EXPO_PUBLIC_AUTH_URL`, `EXPO_PUBLIC_PRODUCT_URL`).
- Токен — `SecureStore` (не AsyncStorage для access/refresh в проде).
- Картинки — абсолютные URL с Product / CDN (уже через `resolveMediaUrl` на web — ту же логику перенести).

---

## 5. Объём работ (чеклист)

### Фаза 0 — Решение и каркас (0.5–1 день)

- [ ] Выбор: Expo (Managed) + TypeScript + React Navigation
- [ ] Репо: `perry-mobile` (или папка в monorepo) — **отдельно** от perry-front admin
- [ ] Env: Auth origin, Product origin, `APP_ENV`
- [ ] API-клиент: порт логики из `src/api/*` web (fetch + Bearer + refresh)
- [ ] Тема: цвета Perry (`#B8EA48`, чернила `#0e2042`) — без копипасты всего CSS

### Фаза 1 — Auth (1–2 дня)

- [ ] Экраны: Login, Register (упрощённый flow), Forgot (если успеете)
- [ ] `POST /api/auth/login` → сохранить access (+ refresh, если Auth отдаёт)
- [ ] `GET /api/auth/me` при старте
- [ ] Logout / очистка SecureStore
- [ ] Обработка 401 → re-login / refresh
- [ ] **Smoke:** логин тестовым User → me ок

*Admin JWT на мобилке не нужен.*

### Фаза 2 — Каталог и Home (2–4 дня)

- [ ] Home: категории, блоки товаров (trending / sale — как позволит API)
- [ ] Catalog: список + фильтры (цена, бренд, атрибуты — по текущему Product API)
- [ ] Category tree / выбор категории
- [ ] PDP: галерея, цена, about, атрибуты, Add to cart / wishlist
- [ ] Медиа: единый `resolveMediaUrl` под абсолютные пути Product

### Фаза 3 — Корзина и заказы (2–3 дня)

- [ ] Cart: sessionId (гость) + merge после логина (как web)
- [ ] Qty / remove / totals
- [ ] Checkout → `POST /api/orders/checkout`
- [ ] My orders list + order details
- [ ] Статусы заказа — read-only

### Фаза 4 — Отзывы и аккаунт (2–3 дня)

- [ ] PDP: список отзывов, форма create (`POST /api/reviews`) с JWT
- [ ] Account: wishlist add/remove
- [ ] Account settings: имя / (пароль / email — если Auth endpoints готовы)
- [ ] `GET /api/reviews/me` — «мои отзывы»

### Фаза 5 — Полировка и магазины (2–5 дней)

- [ ] Пустые состояния, ошибки сети, pull-to-refresh
- [ ] Splash / иконки / имя приложения
- [ ] Deep link (опционально): `perry://product/{id}`
- [ ] Сборка: EAS Build (Android AAB / iOS если есть Apple Developer)
- [ ] Smoke на устройстве + на эмуляторе

---

## 6. API, которые мобилке точно нужны

Уже есть на Product / Auth (ориентир — текущий web-клиент):

| Область | Примеры |
|---------|---------|
| Auth | `/api/auth/login`, `/register`, `/me`, `/refresh`, forgot/reset |
| Categories | `GET /api/categories` |
| Products | list + facets, `GET /api/products/{id\|slug}` |
| Cart | get / add / update / remove / merge |
| Orders | checkout, mine, by id |
| Reviews | list by product, create, me, helpful/report (по желанию) |
| Wishlist | list / add / remove |
| Health | `GET /api/health` (диагностика) |

**Не нужно в mobile MVP:** admin orders/products/categories/users, Internal token (#97), Dev `Admin/Admin`.

---

## 7. Что может понадобиться на бэкенде (мало)

Обычно **ничего критичного**. Возможные точечные правки (если всплывут на smoke):

| Тема | Действие |
|------|----------|
| CORS | Для native не обязателен; для Expo Web — да |
| Абсолютные URL картинок | Проверить, что мобилка не ломается на относительных `/uploads/...` |
| Refresh token | Уточнить у Auth контракт refresh (web уже ходит в Auth) |
| Rate limits / размер pageSize | Не отдавать гигантские страницы на слабому каналу |
| Push-уведомления | **Отдельная** задача (не в MVP): device token + сервис |

Переписывать домен Product / схему БД под мобилку **не** требуется.

---

## 8. Оценка трудозатрат (ориентир)

| Объём | Человек-дни (1 dev, знакомый с RN) |
|-------|-------------------------------------|
| MVP: Auth + Home + Catalog + PDP + Cart + Checkout | **10–15** |
| + Wishlist + Reviews + Account | **+4–6** |
| + Сторы (EAS, иконки, тест на 2 ОС) | **+3–5** |
| **Итого «дипломный mobile клиент»** | **~3–5 недель** calendar |

Два человека (UI + API-клиент) — ближе к **2–3 неделям**.

Capacitor/PWA вместо RN — часто **в 2–3 раза меньше**, но это не «native UI».

---

## 9. Организация работы («виртуальное участие»)

Возможное разделение:

| Роль | Зона |
|------|------|
| **Мы (Product)** | Стабильный API, `.env.example`, smoke Postman/Swagger, фиксы URL/JWT |
| **Mobile** | Expo-приложение, экраны по Figma mobile (iPhone 390) |
| **Auth (Влад)** | Login/refresh без сюрпризов; CORS только если нужен Expo Web |

Мы можем:

1. Отдать контракт API + этот документ.  
2. Держать Product/Auth как есть.  
3. При необходимости помочь с `api/`-слоем (порт с web TypeScript).

---

## 10. Критерии готовности MVP

- [ ] Установка на Android (и/или iOS simulator)
- [ ] Регистрация/логин → JWT в SecureStore
- [ ] Просмотр каталога и PDP с фото
- [ ] Корзина → заказ → заказ виден в «My orders»
- [ ] Хотя бы один отзыв от авторизованного пользователя
- [ ] Нет зависимости от админки и от Internal credential

---

## 11. Риски

| Риск | Митигация |
|------|-----------|
| Figma mobile не до конца | Брать web-адаптив + iPhone frames из того же файла |
| Разные iss/aud JWT | Уже закрываем стыками #96/#98 на Product |
| Относительные image URL | Нормализация на клиенте + проверка Product |
| Срок диплома | Резать Account/Reviews → post-MVP; сначала checkout |
| Публикация в App Store | Часто хватает APK/TestFlight или демо на эмуляторе |

---

## 12. Предлагаемый порядок старта (первая неделя)

1. `npx create-expo-app perry-mobile -t expo-template-blank-typescript`  
2. Перенести/адаптировать `api/client` + типы с web  
3. Auth screens + SecureStore  
4. Home + Product list + PDP (read-only)  
5. Cart + checkout  
6. Smoke против `localhost:5272` (эмулятор → `10.0.2.2` / LAN IP машины) и против Azure Auth  

---

## 13. Итог

| Вопрос | Ответ |
|--------|--------|
| Переписывать бэкенд? | **Нет** |
| Пристегнуть mobile к нашему API? | **Да** |
| Основная работа? | UI + navigation + api-клиент + store токена + медиа |
| Админка в приложении? | **Нет** (остаётся web) |
| Документ для команды | этот файл + стабильный Swagger Product |

После утверждения скоупа можно завести репо `perry-mobile` и чеклист фаз 0–1 в Trello.
