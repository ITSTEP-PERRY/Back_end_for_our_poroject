# 10 — Визуал под Figma и адаптив

[← Оглавление](./README.md) · [← 09 Mobile](./09-mobile-expo.md) · **Далее:** [11 — Seed →](./11-seed-media-run.md)

## Зачем этот шаг

Выровнять UI с макетом, поправить цены/паддинги/footer/menu.

## Промпт для ИИ

```text
Контекст: Perry desktop/mobile уже функциональны. Нужен polish под Figma.

Desktop storefront (типичные баги вёрстки):
- CSS variables: --ink #0e2042, header blue, --accent #b8ea48
- --home-pad: clamp для 17–19″; на 1920 ≈ 160px как в Desktop-Main
- Carousels categories + products, стрелки, snap
- Product cards ~226×356: НЕ ставь max-height: 356px вместе с растущим padding/font —
  иначе overflow:hidden срезает низ цены и «съедает» точку в $129.99
- Footer: Support/Legal/Social компактной группой по центру + copyright; не space-between на 100% ширины
- Sandwich menu <900px: guest (Sign in / Sign up) vs user (имя, email, logout) + иконки категорий
- Create review modal: 5 stars, Title 0/60, Description 0/1000, tag chips, Photos 0/10, Cancel + Create (accent)

Mobile (отдельные frames, не desktop):
- Login/Register/Send code — white card на dimmed overlay, close (X)
- Home/PDP/Cart по iPhone Figma; safe-area insets

Правила:
- UI English; бренд PERRY заметный в header/footer
- Hero/home — одна композиция, не dashboard из карточек-статов
- Motion умеренный (carousel, hover)

Пройдись Home → PDP (цена на карточке в related) → Cart → Login → Create review.
Перед правками прочитай vibe-prompts/PITFALLS.md (секция Design).
```

## Связанные шаги

- Грабли: [PITFALLS](./PITFALLS.md)
- База витрины: [06 — Desktop Vite](./06-desktop-vite.md)
- Дальше: [11 — Seed & run](./11-seed-media-run.md)
