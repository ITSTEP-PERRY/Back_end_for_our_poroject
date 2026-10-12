import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { categoriesApi, productsApi } from "../api";
import type { CategoryDto, ProductListItem } from "../api/types";
import { useIsMobile } from "../hooks/useMediaQuery";
import { ProductCard } from "../widgets/ProductCard";

/** Figma Product List V2 (722:2370) — fallback facet lists when API has no values yet */
const SIZE_CHIPS = [
  "2XS", "XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL",
  ...Array.from({ length: 19 }, (_, i) => String(32 + i)),
];
const FIGMA_BRANDS = [
  "PUMIEY", "Abardsion", "Trendy Queen", "Roselux", "Darong", "KevaMolly",
  "AUTOMET", "PUMA", "H&M", "Adidas", "Nike", "Zara", "Gucci", "Levi’s",
];
const FIGMA_FABRICS = [
  "Polyamide", "Elastane", "Cotton", "Silk", "Nylon", "Chiffon", "Satin",
  "Sateen", "Stockinet", "Rayon", "Organza", "Linen",
];
const FIGMA_COLORS = [
  "White", "Black", "Red", "Yellow", "Orange", "Green", "Azure", "Blue",
  "Purple", "Pink", "Brown", "Grey", "Auburn", "Burgundy", "Crimson",
  "Scarlet", "Ruby", "Magenta", "Coral", "Raspberry", "Salmon", "Copper",
  "Flame", "Tangerine", "Golden", "Amber", "Sand", "Saffron", "Cream",
];

function getMulti(params: URLSearchParams, key: string) {
  return params.getAll(key).filter(Boolean);
}

function toggleMulti(params: URLSearchParams, key: string, value: string) {
  const next = new URLSearchParams(params);
  const current = next.getAll(key);
  next.delete(key);
  const has = current.includes(value);
  (has ? current.filter((v) => v !== value) : [...current, value]).forEach((v) => next.append(key, v));
  next.delete("page");
  return next;
}

export function ProductsPage() {
  const [params, setParams] = useSearchParams();
  const categoryId = params.get("categoryId") || undefined;
  const search = params.get("search") || "";
  const page = Number(params.get("page") || "1");
  const sort = params.get("sort") || "price_desc";
  const view = params.get("view") === "list" ? "list" : "grid";
  const brands = getMulti(params, "brands");
  const fabrics = getMulti(params, "fabrics");
  const sizes = getMulti(params, "sizes");
  const colors = getMulti(params, "colors");
  const minPrice = params.get("minPrice") || "";
  const maxPrice = params.get("maxPrice") || "";
  const minRating = params.get("minRating") || "";
  const isMobile = useIsMobile();

  const [cats, setCats] = useState<CategoryDto[]>([]);
  const [items, setItems] = useState<ProductListItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [facets, setFacets] = useState({ brands: [] as string[], fabrics: [] as string[], sizes: [] as string[], colors: [] as string[] });
  const [filtersOpen, setFiltersOpen] = useState(!isMobile);
  const [brandQ, setBrandQ] = useState("");
  const [fabricQ, setFabricQ] = useState("");
  const [sizeQ, setSizeQ] = useState("");
  const [colorQ, setColorQ] = useState("");
  const [priceMin, setPriceMin] = useState(minPrice);
  const [priceMax, setPriceMax] = useState(maxPrice);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    categoriesApi.tree().then(setCats).catch(() => setCats([]));
  }, []);

  useEffect(() => {
    setPriceMin(minPrice);
    setPriceMax(maxPrice);
    productsApi
      .list({
        categoryId,
        search: search || undefined,
        page,
        pageSize: 15,
        sort,
        brands: brands.length ? brands : undefined,
        fabrics: fabrics.length ? fabrics : undefined,
        sizes: sizes.length ? sizes : undefined,
        colors: colors.length ? colors : undefined,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        minRating: minRating ? Number(minRating) : undefined,
      })
      .then((r) => {
        setItems(r.items);
        setTotalPages(r.totalPages);
        setTotal(r.total);
        if (r.facets) setFacets(r.facets);
      })
      .catch((e: Error) => setError(e.message));
  }, [categoryId, search, page, sort, brands.join(","), fabrics.join(","), sizes.join(","), colors.join(","), minPrice, maxPrice, minRating]);

  const flatCats = useMemo(() => {
    const out: { id: string; name: string; depth: number }[] = [];
    const walk = (nodes: CategoryDto[], depth: number) => {
      nodes.forEach((n) => {
        out.push({ id: n.id, name: n.name, depth });
        if (n.subCategories?.length) walk(n.subCategories, depth + 1);
      });
    };
    walk(cats, 0);
    return out;
  }, [cats]);

  const activeCategory = flatCats.find((c) => c.id === categoryId);
  const applied =
    brands.length +
    fabrics.length +
    sizes.length +
    colors.length +
    (minPrice ? 1 : 0) +
    (maxPrice ? 1 : 0) +
    (minRating ? 1 : 0);

  const setOne = (key: string, value?: string) => {
    const next = new URLSearchParams(params);
    if (!value) next.delete(key);
    else next.set(key, value);
    if (key !== "page") next.delete("page");
    setParams(next);
  };

  const clearFilters = () => {
    const next = new URLSearchParams();
    if (categoryId) next.set("categoryId", categoryId);
    if (search) next.set("search", search);
    next.set("sort", sort);
    next.set("view", view);
    setParams(next);
  };

  const clearSearchAndFilters = () => {
    const next = new URLSearchParams();
    next.set("sort", sort);
    next.set("view", view);
    setParams(next);
  };

  const onPrice = (e: FormEvent) => {
    e.preventDefault();
    const next = new URLSearchParams(params);
    if (priceMin) next.set("minPrice", priceMin);
    else next.delete("minPrice");
    if (priceMax) next.set("maxPrice", priceMax);
    else next.delete("maxPrice");
    next.delete("page");
    setParams(next);
  };

  const filterList = (opts: string[], q: string) =>
    opts.filter((o) => o.toLowerCase().includes(q.trim().toLowerCase()));

  const brandOptions = facets.brands.length ? facets.brands : FIGMA_BRANDS;
  const fabricOptions = facets.fabrics.length ? facets.fabrics : FIGMA_FABRICS;
  const colorOptions = facets.colors.length ? facets.colors : FIGMA_COLORS;
  const sizeOptions = facets.sizes.length ? facets.sizes : SIZE_CHIPS;
  const title = activeCategory?.name ?? (search ? `Search: ${search}` : "All products");

  return (
    <div className="page-wrap catalog" data-figma="722:2370">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link to="/" className="breadcrumbs__home" aria-label="Home">
          <img src="/icons/home.svg" alt="" width={16} height={16} />
        </Link>
        {activeCategory ? (
          <>
            <span className="breadcrumbs__sep">/</span>
            <span>{activeCategory.name}</span>
          </>
        ) : (
          <>
            <span className="breadcrumbs__sep">/</span>
            <span>Catalog</span>
          </>
        )}
      </nav>

      <div className="section-head catalog-head">
        <h1 className="catalog__title">{title}</h1>
        {isMobile && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setFiltersOpen((v) => !v)}>
            Filters
          </button>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="catalog-layout">
        {(filtersOpen || !isMobile) && (
          <aside className="catalog-filters" aria-label="Filters">
            <div className="filters-form">
              <details className="filter-acc" open>
                <summary>Brand</summary>
                <div className="filter-acc__body">
                  <input
                    type="search"
                    className="filter-search"
                    placeholder="Search..."
                    value={brandQ}
                    onChange={(e) => setBrandQ(e.target.value)}
                  />
                  <div className="filter-options">
                    {filterList(brandOptions, brandQ).map((b) => (
                      <label key={b} className="filter-check">
                        <input
                          type="checkbox"
                          checked={brands.includes(b)}
                          onChange={() => setParams(toggleMulti(params, "brands", b))}
                        />
                        <span>{b}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </details>

              <details className="filter-acc" open>
                <summary>Fabric type</summary>
                <div className="filter-acc__body">
                  <input
                    type="search"
                    className="filter-search"
                    placeholder="Search..."
                    value={fabricQ}
                    onChange={(e) => setFabricQ(e.target.value)}
                  />
                  <div className="filter-options">
                    {filterList(fabricOptions, fabricQ).map((f) => (
                      <label key={f} className="filter-check">
                        <input
                          type="checkbox"
                          checked={fabrics.includes(f)}
                          onChange={() => setParams(toggleMulti(params, "fabrics", f))}
                        />
                        <span>{f}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </details>

              <details className="filter-acc" open>
                <summary>Size</summary>
                <div className="filter-acc__body">
                  <input
                    type="search"
                    className="filter-search"
                    placeholder="Search..."
                    value={sizeQ}
                    onChange={(e) => setSizeQ(e.target.value)}
                  />
                  <div className="size-grid">
                    {filterList(SIZE_CHIPS, sizeQ).map((s) => {
                      const available = sizeOptions.some((o) => o.toLowerCase() === s.toLowerCase());
                      return (
                        <label key={s} className={`size-chip ${available ? "" : "is-muted"}`}>
                          <input
                            type="checkbox"
                            checked={sizes.includes(s)}
                            disabled={!available}
                            onChange={() => setParams(toggleMulti(params, "sizes", s))}
                          />
                          <span>{s}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </details>

              <details className="filter-acc" open>
                <summary>Color</summary>
                <div className="filter-acc__body">
                  <input
                    type="search"
                    className="filter-search"
                    placeholder="Search..."
                    value={colorQ}
                    onChange={(e) => setColorQ(e.target.value)}
                  />
                  <div className="filter-options">
                    {filterList(colorOptions, colorQ).map((c) => (
                      <label key={c} className="filter-check filter-color">
                        <input
                          type="checkbox"
                          checked={colors.includes(c)}
                          onChange={() => setParams(toggleMulti(params, "colors", c))}
                        />
                        <span className="swatch" data-color={c.toLowerCase()} />
                        <span>{c}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </details>

              <details className="filter-acc" open>
                <summary>Price</summary>
                <div className="filter-acc__body price-filter">
                  <form className="price-row" onSubmit={onPrice}>
                    <input
                      type="number"
                      step="0.01"
                      min={0}
                      placeholder="Min"
                      value={priceMin}
                      onChange={(e) => setPriceMin(e.target.value)}
                    />
                    <span>–</span>
                    <input
                      type="number"
                      step="0.01"
                      min={0}
                      placeholder="Max"
                      value={priceMax}
                      onChange={(e) => setPriceMax(e.target.value)}
                    />
                    <button className="btn btn-primary btn-sm" type="submit">
                      Save
                    </button>
                  </form>
                </div>
              </details>

              <details className="filter-acc" open>
                <summary>Customer reviews</summary>
                <div className="filter-acc__body">
                  {[5, 4, 3, 2, 1].map((r) => (
                    <label key={r} className="filter-check filter-stars">
                      <input
                        type="radio"
                        name="minRating"
                        checked={minRating === String(r)}
                        onChange={() => setOne("minRating", String(r))}
                      />
                      <span className="stars-row" aria-label={`${r} and up`}>
                        {Array.from({ length: 5 }, (_, s) => (
                          <span key={s} className={s < r ? "on" : "off"}>
                            ★
                          </span>
                        ))}
                      </span>
                    </label>
                  ))}
                  <label className="filter-check">
                    <input
                      type="radio"
                      name="minRating"
                      checked={!minRating}
                      onChange={() => setOne("minRating")}
                    />
                    <span>Any rating</span>
                  </label>
                </div>
              </details>

              <button type="button" className="btn btn-ghost filters-clear" onClick={clearFilters}>
                Clear filters
              </button>
            </div>
          </aside>
        )}

        <div className="catalog-main">
          <div className="catalog-toolbar">
            {applied > 0 ? (
              <button type="button" className="filters-applied" onClick={clearFilters}>
                {applied} filters applied
                <span className="filters-applied__x" aria-hidden="true">
                  ×
                </span>
              </button>
            ) : (
              <span className="filters-applied is-empty">No filters applied</span>
            )}
            <div className="catalog-toolbar__right">
              <label className="catalog-sort">
                <span className="visually-hidden">Sort by</span>
                <select
                  value={sort}
                  aria-label="Sort"
                  onChange={(e) => setOne("sort", e.target.value)}
                >
                  <option value="price_desc">From expensive to cheap</option>
                  <option value="price_asc">From cheap to expensive</option>
                  <option value="rating_desc">Top rated</option>
                  <option value="newest">Newest</option>
                </select>
              </label>
              <div className="view-toggle" role="group" aria-label="View mode">
                <button
                  type="button"
                  className={`view-btn ${view === "grid" ? "is-active" : ""}`}
                  aria-label="Grid view"
                  onClick={() => setOne("view", "grid")}
                >
                  ▦
                </button>
                <button
                  type="button"
                  className={`view-btn ${view === "list" ? "is-active" : ""}`}
                  aria-label="List view"
                  onClick={() => setOne("view", "list")}
                >
                  ☰
                </button>
              </div>
            </div>
          </div>

          <p className="catalog-count muted">{total} results</p>

          {items.length === 0 ? (
            <div className="empty-state catalog-empty">
              <div className="catalog-empty__icon" aria-hidden="true">
                <img src="/icons/search.svg" alt="" width={40} height={40} />
              </div>
              <h2 className="catalog-empty__title">
                {search ? "No results for your search" : "No products match these filters"}
              </h2>
              <p>
                {search
                  ? `We couldn’t find products for “${search}”. Try another query or clear filters.`
                  : "Try removing some filters or browse the full catalog."}
              </p>
              <div className="catalog-empty__actions">
                {(applied > 0 || minRating) && (
                  <button type="button" className="btn btn-outline" onClick={clearFilters}>
                    Clear filters
                  </button>
                )}
                <Link className="btn btn-primary" to="/products" onClick={(e) => {
                  e.preventDefault();
                  clearSearchAndFilters();
                }}>
                  Back to catalog
                </Link>
              </div>
            </div>
          ) : (
            <div className={`catalog-products ${view === "list" ? "is-list" : "is-grid"}`}>
              {items.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <nav className="pagination" aria-label="Pagination">
              {page > 1 && (
                <button type="button" className="page-arrow" onClick={() => setOne("page", String(page - 1))}>
                  ‹
                </button>
              )}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const start = Math.max(1, Math.min(page - 2, totalPages - 4));
                const n = start + i;
                if (n > totalPages) return null;
                return (
                  <button
                    key={n}
                    type="button"
                    className={n === page ? "active" : undefined}
                    onClick={() => setOne("page", String(n))}
                  >
                    {n}
                  </button>
                );
              })}
              {page < totalPages && (
                <button type="button" className="page-arrow" onClick={() => setOne("page", String(page + 1))}>
                  ›
                </button>
              )}
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}
