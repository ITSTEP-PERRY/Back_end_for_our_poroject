# Perry — промпты для вайбкодеров

Гайд, чтобы **собрать Perry с нуля** через диалог с ИИ (Cursor / ChatGPT и т.п.).

## Как пользоваться

### Автосценарий (рекомендуется)

Двойной клик: **[run-vibe-sequence.cmd](./run-vibe-sequence.cmd)**  

Скрипт по очереди копирует каждый промпт в буфер → вставляешь в Cursor Agent (Ctrl+V) → Enter для следующего шага.  

Подробно: [HOW-TO-RUN-SEQUENCE.md](./HOW-TO-RUN-SEQUENCE.md) · сколько агентов: [AGENTS-AND-SEQUENCE.md](./AGENTS-AND-SEQUENCE.md)

### Вручную

1. Прочитай [**PITFALLS.md**](./PITFALLS.md) — реальные грабли дизайна и стыков (5 минут).
2. Открывай файлы по порядку `00` → `12`.
3. Скопируй блок **«Промпт для ИИ»** (fence ` ```text `).
4. Вставь в чат. Когда шаг готов — ссылка **Далее**.
5. Перед Auth / reviews / cart / Figma-polish вставляй ещё [промпт-предохранитель](./PITFALLS.md#промпт-предохранитель-для-ии).

> Один файл = один крупный шаг. Не проси ИИ «сделай весь Amazon сразу» (кроме опционального one-shot).

## Оглавление

| # | Файл | Тема |
|---|------|------|
| — | [**PITFALLS.md**](./PITFALLS.md) | Сложности дизайна и интеграции (читать рано) |
| — | [**AGENTS-AND-SEQUENCE.md**](./AGENTS-AND-SEQUENCE.md) | Сколько агентов и порядок фаз |
| — | [**HOW-TO-RUN-SEQUENCE.md**](./HOW-TO-RUN-SEQUENCE.md) | Скрипт последовательного запуска |
| 00 | [00-vision.md](./00-vision.md) | Продукт, границы системы, дерево репо |
| 01 | [01-backend-skeleton.md](./01-backend-skeleton.md) | Product API + Postgres + Docker |
| 02 | [02-catalog-pdp.md](./02-catalog-pdp.md) | Каталог, категории, PDP |
| 03 | [03-cart-checkout-orders.md](./03-cart-checkout-orders.md) | Корзина, checkout, заказы |
| 04 | [04-reviews-wishlist.md](./04-reviews-wishlist.md) | Отзывы и wishlist |
| 05 | [05-auth-jwt-bridge.md](./05-auth-jwt-bridge.md) | Стык с Auth Service (JWT) |
| 06 | [06-desktop-vite.md](./06-desktop-vite.md) | React-витрина Vite |
| 07 | [07-desktop-auth-ui.md](./07-desktop-auth-ui.md) | Login / register multi-step / account |
| 08 | [08-admin-panel.md](./08-admin-panel.md) | Админка |
| 09 | [09-mobile-expo.md](./09-mobile-expo.md) | Expo / React Native |
| 10 | [10-figma-polish.md](./10-figma-polish.md) | Визуал Figma, адаптив |
| 11 | [11-seed-media-run.md](./11-seed-media-run.md) | Сиды, фото, скрипты запуска |
| 12 | [12-smoke-and-defense.md](./12-smoke-and-defense.md) | Smoke и защита |
| 99 | [99-one-shot-full.md](./99-one-shot-full.md) | Опциональный one-shot (**не шаг 13**; номер 99 = «в конце») |

**Старт:** [PITFALLS](./PITFALLS.md) → [00 — Видение](./00-vision.md)

## Карта сложностей → шаги

| Сложность | Куда смотреть |
|-----------|----------------|
| Цены обрезаны / нет точки в `$129.99` | [PITFALLS](./PITFALLS.md) · [10 Figma](./10-figma-polish.md) |
| Register не создаёт аккаунт | [07 Auth UI](./07-desktop-auth-ui.md) · [05 JWT](./05-auth-jwt-bridge.md) |
| В отзыве UUID вместо имени | [04 Reviews](./04-reviews-wishlist.md) · [PITFALLS](./PITFALLS.md) |
| «Нужен Admin» для отзыва | [PITFALLS](./PITFALLS.md) · [07](./07-desktop-auth-ui.md) |
| Корзина desktop ≠ mobile | [03 Cart](./03-cart-checkout-orders.md) · [09 Mobile](./09-mobile-expo.md) |
| CORS / Azure Auth из браузера | [06 Desktop](./06-desktop-vite.md) · [05](./05-auth-jwt-bridge.md) |
| Android не видит API | [09 Mobile](./09-mobile-expo.md) |
| Footer / pads 17–19″ | [10 Figma](./10-figma-polish.md) |

## Правила стека (копируй в чат)

```text
Правила Perry:
- Пиши рабочий код, не псевдокод.
- Auth Service внешний — не пиши полный Auth с нуля.
- Product API НЕ хранит Users — только UserId (Guid) из JWT.
- Desktop: frontend/ Vite :3000. Mobile: mobile/ Expo :8081. API :5272 + Swagger. Postgres Docker.
- UI-копирайт English. Документацию можно на русском.
- Product 401 ≠ «log in as Admin». AuthorName ≠ JWT sub (GUID).
- Register: confirmPassword → verify-email → complete-registration → login (без JWT на шаге 1).
- Перед спорными местами сверься с vibe-prompts/PITFALLS.md.
```

## Живой референс

- Это репо: https://github.com/Teslyar75/My_Amazon2  
- Командный mirror API: https://github.com/ITSTEP-PERRY/Back_end_for_our_poroject  
- Frontend (команда): https://github.com/ITSTEP-PERRY/perry-front  
- Отчёт дня появления пакета: [docs/журнал/2026-10-03.md](../docs/журнал/2026-10-03.md)  
- Защита: [project_defense/DEFENSE_BACKEND.md](../project_defense/DEFENSE_BACKEND.md)
