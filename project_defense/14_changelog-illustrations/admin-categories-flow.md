# Admin categories UI

```mermaid
flowchart TD
  P[AdminCategoriesPage] --> T[AdminCategoryTree]
  P --> M[AdminCategoryFormModal]
  P --> C[AdminConfirmModal]
  T --> API[categoriesApi /api/categories]
  M --> API
```

**Суть:** дерево, multi-select, CRUD, иконки, empty states — parity со скринами Figma.
