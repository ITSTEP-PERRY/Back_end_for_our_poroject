# Figma assets — Desktop - Main

Локальная выгрузка макета главной, чтобы не зависеть от короткоживущих URL Figma MCP (~7 дней).

| | |
|--|--|
| Figma | [Дипломна робота (Copy)](https://www.figma.com/design/cF0bKFsmenH6rrshGV0yO7/?node-id=722-5792) |
| Frame | `Desktop - Main` · node `722:5792` · 1920×2782 |
| Тип | **Wireframe** (серые плейсхолдеры с ✕) — структура и тексты, не финальные фото |
| Дата выгрузки | 2026-09-30 |

## Структура папки

```
figma-assets/desktop-main/
  reference/00-full.png     — весь экран
  header/header.png         — 722:6618
  hero/hero.png             — 722:5793 (1600×352)
  categories/row-1.png      — 761:1860 (ряд карточек категорий)
  products/trending.png     — 761:1864
  products/best-sellers.png — 763:2146
  cta/cta-banner.png        — 2729:8646 («Be aware of the variety»)
  footer/footer.png         — 722:5812
  icons/                    — back-to-top из Figma + SVG из public/icons
  images-filled/            — уже залитые hero/cta фото из public/images/home
  MANIFEST.md               — этот файл
```

## Как использовать в коде

1. **Сверка layout** — смотрим PNG в `reference/` и секциях.
2. **Иконки в UI** — берём из `icons/*.svg` (или уже подключённые `/icons/...` в `public`).
3. **Контентные фото** — wireframe даёт ✕; живые картинки в `images-filled/` и `public/images/home/`.
4. **Данные** — категории/товары с API (`:5272`), не из PNG.

## Следующие страницы

Для каждой новой страницы: `figma-assets/<page-slug>/` по тому же шаблону  
(`reference` + секции + `MANIFEST.md`).

## Связь с React

| Блок макета | Код |
|-------------|-----|
| Header | `src/widgets/layout/AppShell.tsx` |
| Hero / cats / deals / CTA | `src/pages/HomePage.tsx` |
| Product card | `src/widgets/ProductCard.tsx` |
| Styles + токены размеров | `src/styles/storefront.css` (`:root` `--figma-*`, `.home*`) |
| Размеры (таблица) | [DIMENSIONS.md](./DIMENSIONS.md) |
| Footer / to-top | `AppShell.tsx` |
