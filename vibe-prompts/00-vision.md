# 00 — Видение продукта Perry

[← Оглавление](./README.md) · [PITFALLS](./PITFALLS.md) · **Далее:** [01 — Каркас API →](./01-backend-skeleton.md)

## Зачем этот шаг

Зафиксировать продукт, границы микросервисов и дерево монорепо — без глубокой реализации.

## Промпт для ИИ

Скопируй всё внутри блока ниже:

```text
Ты помогаешь с нуля собрать учебный маркетплейс «Perry» (команда ITSTEP-PERRY).

Продукт: онлайн-витрина товаров (электроника/гаджеты), как упрощённый Amazon:
каталог, карточка товара (PDP), корзина, оформление заказа, отзывы, wishlist,
личный кабинет, админка товаров/заказов/отзывов, мобильное приложение.

Архитектура (обязательно соблюдай):
1) Product API — наш бэкенд ASP.NET Core 8 + PostgreSQL.
   Ответственность: products, categories, cart, orders, reviews, wishlist, admin stats.
   НЕТ таблицы Users. Идентичность только через JWT (UserId / role из claims).
2) Auth Service — ВНЕШНИЙ (уже есть у другой подкоманды).
   Login/register/JWT/refresh. Мы только интегрируемся.
3) Admin Users Service — отдельный сервис списка пользователей (не Product API).
4) Desktop — React + Vite + React Router, порт 3000, макеты Figma.
5) Mobile — Expo / React Native, порт 8081, те же API.

Цель этого чата: зафиксировать vision и структуру монорепо, без глубокой реализации.

Сделай:
- Дерево папок репозитория (src/Perry.Api, Perry.Domain, Perry.Infrastructure, frontend/, mobile/, docs/).
- README с командами запуска (Docker Postgres, dotnet run API :5272, vite :3000, expo :8081).
- Краткую диаграмму потоков: Browser → Auth; Browser → Product API + JWT; Mobile → то же.
- Список MVP-экранов desktop и mobile.

Не пиши пока полные контроллеры и UI. Только каркас и соглашения.
Когда закончишь — кратко напиши, что готово к шагу «backend skeleton».
```

## После ответа ИИ

Переходи к [01 — Каркас Product API](./01-backend-skeleton.md).
