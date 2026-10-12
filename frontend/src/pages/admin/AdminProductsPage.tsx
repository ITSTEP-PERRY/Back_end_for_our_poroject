import { type FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { categoriesApi, productsApi } from "../../api";
import type { CategoryDto, ProductDetail, ProductListItem } from "../../api/types";
import { AdminCategoryDropdown } from "../../widgets/admin/AdminCategoryDropdown";

function pageNumbers(current: number, total: number) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const out: number[] = [1];
  if (current > 3) out.push(-1);
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) out.push(i);
  if (current < total - 2) out.push(-1);
  out.push(total);
  return out;
}

export function AdminProductsPage() {
  const [params, setParams] = useSearchParams();
  const categoryId = params.get("categoryId") || undefined;
  const selectedId = params.get("selectedId") || undefined;
  const q = params.get("q") || "";
  const page = Number(params.get("page") || "1");
  const [cats, setCats] = useState<CategoryDto[]>([]);
  const [items, setItems] = useState<ProductListItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState(q);
  const [detail, setDetail] = useState<ProductDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    categoriesApi.tree().then(setCats).catch(() => setCats([]));
  }, []);

  useEffect(() => {
    setSearch(q);
    productsApi
      .list({ categoryId, search: q || undefined, page, pageSize: 12, sort: "newest" })
      .then((r) => {
        setItems(r.items);
        setTotalPages(r.totalPages);
      })
      .catch((e: Error) => setError(e.message));
  }, [categoryId, q, page]);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    productsApi
      .byId(selectedId)
      .then(setDetail)
      .catch(() => setDetail(null));
  }, [selectedId]);

  const selectedCategoryName = useMemo(() => {
    const walk = (nodes: CategoryDto[]): string | undefined => {
      for (const n of nodes) {
        if (n.id === categoryId) return n.name;
        if (n.subCategories?.length) {
          const hit = walk(n.subCategories);
          if (hit) return hit;
        }
      }
      return undefined;
    };
    return categoryId ? walk(cats) : undefined;
  }, [cats, categoryId]);

  const setOne = (key: string, value?: string) => {
    const next = new URLSearchParams(params);
    if (!value) next.delete(key);
    else next.set(key, value);
    if (key !== "page" && key !== "selectedId") next.delete("page");
    setParams(next);
  };

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    setOne("q", search.trim() || undefined);
  };

  const createTo = categoryId
    ? `/admin/products/new?categoryId=${categoryId}`
    : "/admin/products/new";

  return (
    <div data-figma="2145:3214">
      {error && <div className="alert alert-error">{error}</div>}

      <div className="ap-toolbar">
        <span className="ap-toolbar__label">Category</span>
        <AdminCategoryDropdown
          tree={cats}
          value={categoryId}
          placeholder="Choose category..."
          allLabel="All"
          onChange={(id) => {
            const next = new URLSearchParams(params);
            if (id) next.set("categoryId", id);
            else next.delete("categoryId");
            next.delete("selectedId");
            next.delete("page");
            setParams(next);
          }}
        />
        <form className="ap-search" onSubmit={onSearch} role="search">
          <img className="ap-search__icon" src="/icons/search.svg" alt="" width={20} height={16} />
          <input
            className="ap-search__input"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
          />
        </form>
      </div>

      <div className="ap-layout">
        <section className="ap-list">
          {items.length === 0 ? (
            <div className="ap-empty">
              <div className="ap-empty__ph" aria-hidden="true" />
              <p className="ap-empty__text">
                {q
                  ? `Nothing found for “${q}”`
                  : categoryId
                    ? "No products in the selected category"
                    : "No products yet"}
              </p>
              <Link className="ap-create-card" to={createTo}>
                <span className="ap-create-card__plus">+</span>
                <span>Create product</span>
              </Link>
            </div>
          ) : (
            <>
              <div className="ap-table">
                <div className="ap-table__head">
                  <span className="ap-table__cb" aria-hidden="true" />
                  <span />
                  <span className="ap-table__name">Product name</span>
                  <span className="ap-table__rating">Rating</span>
                  <span className="ap-table__price">Price</span>
                  <Link className="ap-table__add" to={createTo} title="Create product">
                    +
                  </Link>
                </div>
                {items.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className={`ap-table__row ${selectedId === p.id ? "is-selected" : ""}`}
                    onClick={() => setOne("selectedId", p.id)}
                  >
                    <span className="ap-table__cb">
                      <span className={`ap-check ${selectedId === p.id ? "is-on" : ""}`} />
                    </span>
                    <span className="ap-table__thumb">
                      {p.imageUrl ? <img src={p.imageUrl} alt="" /> : null}
                    </span>
                    <span className="ap-table__name">{p.name}</span>
                    <span className="ap-table__rating">
                      <img src="/icons/star.svg" alt="" width={20} height={20} />
                      <span>{p.averageRating.toFixed(1)}</span>
                    </span>
                    <span className="ap-table__price">
                      <span className="ap-price">${p.price.toFixed(2)}</span>
                      {p.oldPrice != null && p.oldPrice > p.price && (
                        <span className="ap-price ap-price--old">${p.oldPrice.toFixed(2)}</span>
                      )}
                    </span>
                    <span />
                  </button>
                ))}
              </div>

              {totalPages > 1 && (
                <nav className="ap-pager" aria-label="Pagination">
                  <button
                    type="button"
                    className={`ap-pager__btn ${page <= 1 ? "is-disabled" : ""}`}
                    onClick={() => setOne("page", String(page - 1))}
                  >
                    ‹
                  </button>
                  {pageNumbers(page, totalPages).map((n, i) =>
                    n < 0 ? (
                      <span key={`e${i}`} className="ap-pager__btn ap-pager__ellipsis">
                        …
                      </span>
                    ) : (
                      <button
                        key={n}
                        type="button"
                        className={`ap-pager__btn ${n === page ? "is-current" : ""}`}
                        onClick={() => setOne("page", String(n))}
                      >
                        {n}
                      </button>
                    ),
                  )}
                  <button
                    type="button"
                    className={`ap-pager__btn ${page >= totalPages ? "is-disabled" : ""}`}
                    onClick={() => setOne("page", String(page + 1))}
                  >
                    ›
                  </button>
                </nav>
              )}
            </>
          )}
        </section>

        <aside className="ap-panel">
          {!detail ? (
            <div className="ap-panel__empty">
              <p>Select a product to see its information</p>
            </div>
          ) : (
            <div className="ap-panel__preview">
              <div className={`ap-panel__hero ${detail.images[0] ? "" : "is-ph"}`}>
                {detail.images[0] && <img src={detail.images[0].url} alt={detail.name} />}
              </div>
              <div className="ap-panel__thumbs">
                {[0, 1, 2].map((i) => {
                  const img = detail.images[i];
                  const extra = Math.max(0, detail.images.length - 3);
                  return (
                    <div key={i} className={`ap-panel__thumb ${img ? "" : "is-ph"}`}>
                      {img && <img src={img.url} alt="" />}
                      {i === 2 && extra > 0 && <span className="ap-panel__more">+{extra}</span>}
                    </div>
                  );
                })}
              </div>
              <h2 className="ap-panel__title">{detail.name}</h2>
              <p className="ap-panel__meta">
                <span>{detail.category.name}</span>
                <span> · </span>
                <span>{detail.brand}</span>
                <span> · </span>
                <span>${detail.price.toFixed(2)}</span>
              </p>
              <p className="ap-panel__meta">
                About: {detail.aboutItems.length} · Specs: {detail.attributes.length} · Stock:{" "}
                {detail.stockQuantity}
              </p>
              {selectedCategoryName && (
                <p className="ap-panel__meta">Filter: {selectedCategoryName}</p>
              )}
              <Link className="ap-panel__reviews" to={`/products/${detail.id}`}>
                See all customer reviews ({detail.reviewCount})
              </Link>
              <div className="ap-panel__actions">
                <Link className="ap-panel__btn" to={`/admin/products/${detail.id}`}>
                  Edit
                </Link>
                <button
                  type="button"
                  className="ap-panel__btn ap-panel__btn--danger"
                  onClick={async () => {
                    if (!confirm("Archive product?")) return;
                    await productsApi.remove(detail.id);
                    const next = new URLSearchParams(params);
                    next.delete("selectedId");
                    setParams(next);
                    setItems((prev) => prev.filter((x) => x.id !== detail.id));
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
