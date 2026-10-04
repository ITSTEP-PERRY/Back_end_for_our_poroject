# Admin Figma parity pack (Categories + Users)

Файл Figma: [Дипломна робота (Copy)](https://www.figma.com/design/cF0bKFsmenH6rrshGV0yO7/) · страница Wireframe.

**Статус выгрузки:** Figma MCP Starter сейчас в **rate limit** — свежие `get_screenshot` / `get_design_context` недоступны. Ниже: канонические `node-id` + локальные скрины (из чата / прошлых захватов). Когда лимит сбросится или будет Paid MCP — дотянуть ассеты через MCP и положить SVG/иконки в `public/icons/admin/`.

Код: `/admin/categories`, `/admin/users` — React-паритет по локальным скринам (дерево, detail, Create/Edit/Delete модалки, Users empty/Columns). Property keys — UI + localStorage.


---

## Канонические фреймы (открыть в Figma)

Базовый URL: `https://www.figma.com/design/cF0bKFsmenH6rrshGV0yO7/?node-id=`

### Categories

| Состояние | node-id | Ссылка |
|-----------|---------|--------|
| Default (empty / choose) | `2720-4728` | [open](https://www.figma.com/design/cF0bKFsmenH6rrshGV0yO7/?node-id=2720-4728) |
| Category (с деревом) | `2720-5428` | [open](https://www.figma.com/design/cF0bKFsmenH6rrshGV0yO7/?node-id=2720-5428) |
| Without subcategories | `2601-4457` | [open](https://www.figma.com/design/cF0bKFsmenH6rrshGV0yO7/?node-id=2601-4457) |
| Create category | `3095-8878` | [open](https://www.figma.com/design/cF0bKFsmenH6rrshGV0yO7/?node-id=3095-8878) |
| Create subcategory | `3095-9190` | [open](https://www.figma.com/design/cF0bKFsmenH6rrshGV0yO7/?node-id=3095-9190) |
| Edit category | `3095-9518` | [open](https://www.figma.com/design/cF0bKFsmenH6rrshGV0yO7/?node-id=3095-9518) |
| Edit subcategory | `3095-9719` | [open](https://www.figma.com/design/cF0bKFsmenH6rrshGV0yO7/?node-id=3095-9719) |
| Delete category | `2506-3048` | [open](https://www.figma.com/design/cF0bKFsmenH6rrshGV0yO7/?node-id=2506-3048) |
| Delete subcategory / bulk | `2588-2249` | [open](https://www.figma.com/design/cF0bKFsmenH6rrshGV0yO7/?node-id=2588-2249) |

Альтернативы (старые итерации, тоже в файле): `1865:3838` default, `2448:2566` create, `2499:2092` create subcategory.

### Users

| Состояние | node-id | Ссылка |
|-----------|---------|--------|
| Default | `2720-5575` | [open](https://www.figma.com/design/cF0bKFsmenH6rrshGV0yO7/?node-id=2720-5575) |
| Default without users | `2716-3824` | [open](https://www.figma.com/design/cF0bKFsmenH6rrshGV0yO7/?node-id=2716-3824) |
| Role customer, no users | `2639-5260` | [open](https://www.figma.com/design/cF0bKFsmenH6rrshGV0yO7/?node-id=2639-5260) |
| Choose columns | `2591-3618` | [open](https://www.figma.com/design/cF0bKFsmenH6rrshGV0yO7/?node-id=2591-3618) |
| Functionality / delete / restore | `2631-3094`, `2631-2454`, `2631-2153` | — |

---

## Локальные скрины в этой папке

| Файл | Содержание |
|------|------------|
| `01-category-empty-default.png` | Empty + «Select a category…» |
| `02-category-no-subcategories.png` | Fashion выбран, «Subcategory not found» |
| `03-category-create-subcategory-cta.png` | CTA «Create subcategory» |
| `04`–`07`, `09`, `20` | Дерево + детали (+ фото) |
| `08-category-dropdown-icon-picker.png` | Dropdown Category + icon grid |
| `10`, `17` | Modal Create category |
| `11`, `15` | Modal Create subcategory (+ property keys) |
| `12`, `13`, `16`, `18`, `21` | Delete confirm variants |
| `19` | Modal Edit category |
| `22` | Modal Edit subcategory |
| `14-users-empty.png` | Users empty «No users in the selected role» |

---

## Чеклист реализации (для себя)

### Categories UI
- [x] Layout: toolbar (Category dropdown + Search) + tree pane + detail panel
- [x] Nested tree: expand/collapse, checkboxes, multi-select delete
- [x] Empty states + blob illustration (question mark)
- [x] Detail: hero image, Status / Role / Parent / Main category, Edit + Delete
- [x] Modals: Create/Edit category & subcategory (image +, icon picker, Active toggle, description 0/300, property keys)
- [x] Delete confirm copy variants
- [x] Icon set for category types (hanger, electronics, …) → `public/icons/admin/`

### Users UI
- [x] Role filter + Search + Columns picker
- [x] Empty state illustration
- [x] Table + row actions (role change, delete, restore) по фреймам User

### API / данные
- [x] Categories CRUD уже есть (`categoriesApi`) — хватает для большинства окон
- [x] Property keys — UI + localStorage (нет поля в API)
- [x] Users — `usersApi` / admin-service; Columns — FE-only

---

## Когда MCP снова доступен

1. `get_screenshot` по таблице node-id выше → обновить PNG в этой папке.  
2. `get_design_context` (skill `figma-design-to-code`) на ключевые фреймы → токены, отступы, SVG.  
3. Скачать static assets из ответа MCP в `public/` (без временных Figma URL в коде).

Не коммитить/пушить, пока не попросите явно.
