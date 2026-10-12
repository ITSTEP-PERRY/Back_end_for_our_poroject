# Changelog Illustrations — Perry

Иллюстрации ключевых доработок (сентябрь 2026), полезные на защите при рассказе «что сделали мы».

## Файлы (PNG готовы)

| PNG | Тема |
|-----|------|
| `diagram.png` | Сводка спринта |
| `pg-migration-flow.png` | #A08 PostgreSQL |
| `admin-orders-flow.png` | #A09 / #A10 заказы |
| `admin-categories-flow.png` | Админ-категории |
| `ci-compose-gitleaks-flow.png` | CI |
| `dummyjson-media-flow.md` / `.mmd` | Фото витрины из DummyJSON CDN |
| `admin-product-images-flow.md` / `.mmd` | Новый товар + imageUrls в админке |

Все копии для слайдов также в `../views_project/` (01–18).  
Схемы медиа также встроены в [`../DEFENSE_BACKEND.md`](../DEFENSE_BACKEND.md) §10 «Медиа».

---

## Кратко для слайда

1. **БД** — ушли с SQL Server на PostgreSQL; CI и локальный compose.
2. **Заказы** — admin filters + `lastUpdateUtc` на create/status.
3. **Категории UI** — дерево с чекбоксами, CRUD-модалки под Figma.
4. **Качество** — починен CI (compose env + gitleaks tree scan).
5. **Медиа** — DummyJSON CDN при seed; админ добавляет товар с URL картинок.
