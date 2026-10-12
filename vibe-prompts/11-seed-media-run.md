# 11 — Сиды, медиа, локальный запуск

[← Оглавление](./README.md) · [← 10 Figma](./10-figma-polish.md) · **Далее:** [12 — Smoke →](./12-smoke-and-defense.md)

## Зачем этот шаг

Данные, картинки, ярлыки запуска для демо.

## Промпт для ИИ

```text
Контекст: Perry почти готов. Нужны данные и картинки.

1) DbSeeder при старте Dev:
   - категории с иконками
   - товары с ценами/скидками/рейтингами
   - несколько OutOfStock для Notify
   - отзывы-заглушки с человеческими AuthorName (не GUID)
   - демо-заказы для admin

2) Медиа:
   - primary imageUrl + галерея
   - можно тянуть публичные URL (DummyJSON product images) в сидер
   - Upload админом: URL или multipart — документируй путь
   - resolveMediaUrl на фронте

3) DX запуска (Windows ок):
   - Create-Shortcuts.cmd → Perry API / Desktop / Mobile
   - start-api.cmd: docker postgres → wait → dotnet run
   - start-desktop.cmd / start-mobile.cmd
   - README: порядок API → Desktop/Mobile
   - .env.example без секретов; Jwt secret согласован с Auth или SkipSignature в Dev

4) Проверка:
   - swagger :5272
   - витрина с фото
   - Admin/Admin DEV на desktop и mobile с одним userId
```

## Связанные шаги

- Каталог: [02 — Catalog](./02-catalog-pdp.md)
- Дальше: [12 — Smoke & defense](./12-smoke-and-defense.md)
