import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useWishlist } from "../../app/WishlistContext";
import type { WishlistItemDto } from "../../api/types";

export function AccountWishlistPage() {
  const { items, loading, error, refresh, remove } = useWishlist();
  const [query, setQuery] = useState("");
  const [pendingRemove, setPendingRemove] = useState<WishlistItemDto | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (i) =>
        i.product.name.toLowerCase().includes(q) ||
        i.product.brand.toLowerCase().includes(q),
    );
  }, [items, query]);

  const confirmRemove = async () => {
    if (!pendingRemove) return;
    setBusy(true);
    try {
      await remove(pendingRemove.productId);
      setPendingRemove(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="account-panel">
      <div className="wishlist-head">
        <h1 className="account-panel__title">Wishlist</h1>
        <form
          className="wishlist-search"
          onSubmit={(e) => e.preventDefault()}
          role="search"
        >
          <input
            type="search"
            placeholder="Search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search wishlist"
          />
          <button type="submit" aria-label="Search">
            <img src="/icons/search.svg" alt="" width={16} height={16} />
          </button>
        </form>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {loading && <div className="empty-state">Loading…</div>}

      {!loading && filtered.length === 0 && (
        <div className="empty-state">
          {items.length === 0 ? (
            <>
              Your wishlist is empty. <Link to="/products">Browse products</Link>
            </>
          ) : (
            "No matches."
          )}
        </div>
      )}

      <div className="wishlist-grid">
        {filtered.map((item) => {
          const p = item.product;
          const oos = p.status === "OutOfStock";
          return (
            <article key={item.id} className={`wishlist-card${oos ? " is-oos" : ""}`}>
              <div className="wishlist-card__media">
                <button
                  type="button"
                  className="wishlist-card__remove"
                  onClick={() => setPendingRemove(item)}
                >
                  Remove
                </button>
                <Link to={`/products/${p.id}`}>
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt={p.name} loading="lazy" />
                  ) : (
                    <div className="img-placeholder" />
                  )}
                </Link>
              </div>
              <div className="wishlist-card__body">
                <Link className="wishlist-card__title" to={`/products/${p.id}`}>
                  {p.name}
                </Link>
                <div className="wishlist-card__rating">
                  <img src="/icons/star.svg" alt="" width={16} height={16} />
                  <span>{Math.round(p.averageRating)}</span>
                  <img src="/icons/reviews.svg" alt="" width={16} height={16} />
                  <span>{p.reviewCount.toLocaleString()}</span>
                </div>
                <div className="wishlist-card__price">
                  <strong>$ {p.price.toFixed(2)}</strong>
                  {p.oldPrice != null && p.oldPrice > p.price && (
                    <s>$ {p.oldPrice.toFixed(2)}</s>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {pendingRemove && (
        <div className="acc-modal-backdrop" role="presentation" onClick={() => setPendingRemove(null)}>
          <div
            className="acc-modal confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="wishlist-remove-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="wishlist-remove-title">Are you sure?</h2>
            <p>This action will remove this item from your wishlist.</p>
            <div className="confirm-modal__actions">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setPendingRemove(null)}
                disabled={busy}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-accent"
                onClick={() => void confirmRemove()}
                disabled={busy}
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
