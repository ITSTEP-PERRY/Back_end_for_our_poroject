# Desktop - Main — размеры из Figma (px)

Источник: node `722:5792` · файл `cF0bKFsmenH6rrshGV0yO7` · выгрузка 2026-09-30.

| Элемент | Node | W × H | Примечание |
|---------|------|-------|------------|
| Canvas | 722:5792 | **1920 × 2782** | Desktop - Main |
| Content width | — | **1600** | inset x=160 → pad = (1920−1600)/2 = **160** |
| Header | 722:6618 | **1920 × 64** | sticky bar |
| Menu / Account / Cart icons | — | **36 × 36** | |
| Search bar | 722:6639 | **950 × 40** | |
| Hero | 722:5793 | **1600 × 352** | aspect 1600/352 |
| Hero arrows | 936:1916 | **40 × 40** | |
| Hero dots (active pill) | 722:5796 | **92 × 8** | inactive dots **8 × 8** |
| Category row | 761:1860 | **1602 × 274** | |
| Category card | 761:1849 | **247 × 274** | 6 в ряд; gap ≈ **24** |
| Product track | 761:1864 | **1436 × 356** | |
| Product card | 761:1865 | **226 × 356** | 6 в ряд; gap ≈ **16** |
| Product image | 761:1867 | **178 × 178** | внутри карточки |
| Section title | 761:1863 | h **40** | «Trending deals» ~219×40 |
| See all | 761:2045 | ~93 × 25 | |
| CTA block | 2729:8646 | **1600 × 308** | radius 8 |
| CTA Sign up btn | 2729:8659 | **240 × 72** | radius 4 |
| CTA Log in btn | 2729:8661 | **218 × 72** | |
| CTA media | 2729:8664 | **703 × 260** | |
| Footer | 722:5812 | **1920 × 262** | |
| Back to top | 722:6597 | **62 × 62** | |

## CSS tokens (см. `src/styles/storefront.css` → `.home`)

```css
--figma-canvas: 1920px;
--figma-content: 1600px;
--figma-pad: 160px;
--figma-header-h: 64px;
--figma-hero-h: 352px;
--figma-cat-w: 247px;
--figma-cat-h: 274px;
--figma-cat-gap: 24px;
--figma-prod-w: 226px;
--figma-prod-h: 356px;
--figma-prod-gap: 16px;
--figma-prod-img: 178px;
--figma-cta-h: 308px;
--figma-cta-btn-h: 72px;
--figma-cta-media-w: 703px;
--figma-cta-media-h: 260px;
--figma-footer-h: 262px;
--figma-to-top: 62px;
```

На узких экранах масштабируем пропорционально `min(100vw, 1920)`, сохраняя aspect / ratio карточек.
