import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { reviewsApi } from "../../api";
import { AdminConfirmModal } from "../../widgets/admin/AdminConfirmModal";

type AdminReview = {
  id: string;
  productId: string;
  productName: string;
  authorName: string;
  rating: number;
  title: string;
  body: string;
  isApproved: boolean;
  createdAtUtc: string;
  tags: string[];
};

export function AdminReviewsPage() {
  const [params, setParams] = useSearchParams();
  const selectedId = params.get("selectedId") || undefined;
  const status = params.get("status") || "all";
  const q = params.get("q") || "";
  const [items, setItems] = useState<AdminReview[]>([]);
  const [search, setSearch] = useState(q);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const reload = () =>
    reviewsApi
      .adminList({ status, q: q || undefined })
      .then(setItems)
      .catch((e: Error) => setError(e.message));

  useEffect(() => {
    void reload();
  }, [status, q]);

  useEffect(() => setSearch(q), [q]);

  const selected = useMemo(
    () => items.find((r) => r.id === selectedId) ?? null,
    [items, selectedId],
  );

  const setFilter = (key: string, value?: string) => {
    const next = new URLSearchParams(params);
    if (!value) next.delete(key);
    else next.set(key, value);
    if (key !== "selectedId") next.delete("selectedId");
    setParams(next);
  };

  return (
    <div data-figma="3448:3131">
      {error && <div className="alert alert-error">{error}</div>}

      <div className="ap-toolbar">
        <span className="ap-toolbar__label">Reviews</span>
        <div className="ap-chips">
          {(
            [
              ["all", "All"],
              ["pending", "Hidden"],
              ["approved", "Visible"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={`ap-chip ${status === value ? "is-active" : ""}`}
              onClick={() => setFilter("status", value)}
            >
              {label}
            </button>
          ))}
        </div>
        <form
          className="ap-search"
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            setFilter("q", search.trim() || undefined);
          }}
        >
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
              <p className="ap-empty__text">{q ? `Nothing found for “${q}”` : "No reviews yet"}</p>
            </div>
          ) : (
            <div className="ap-table ap-table--reviews">
              <div className="ap-table__head">
                <span>Product</span>
                <span>Author</span>
                <span>Rating</span>
                <span>Status</span>
                <span />
              </div>
              {items.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  className={`ap-table__row ${selectedId === r.id ? "is-selected" : ""}`}
                  onClick={() => setFilter("selectedId", r.id)}
                >
                  <span className="ap-table__name">
                    <strong>{r.productName}</strong>
                    <span className="ap-slug">{r.title}</span>
                  </span>
                  <span>{r.authorName}</span>
                  <span className="ap-table__rating">
                    <img src="/icons/star.svg" alt="" width={18} height={18} />
                    {r.rating}
                  </span>
                  <span>
                    <span
                      className={`ap-status ${r.isApproved ? "ap-status--completed" : "ap-status--pending"}`}
                    >
                      {r.isApproved ? "Visible" : "Hidden"}
                    </span>
                  </span>
                  <span />
                </button>
              ))}
            </div>
          )}
        </section>

        <aside className="ap-panel">
          {!selected ? (
            <div className="ap-panel__empty">
              <p>Select a review to moderate</p>
            </div>
          ) : (
            <div className="ap-panel__preview">
              <h2 className="ap-panel__title">{selected.title}</h2>
              <p className="ap-panel__meta">
                {selected.productName} · {selected.authorName} ·{" "}
                {new Date(selected.createdAtUtc).toLocaleString()}
              </p>
              <p className="ap-panel__meta">
                Rating: {selected.rating} ★ ·{" "}
                {selected.isApproved ? "Visible on storefront" : "Hidden from storefront"}
              </p>
              <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.45 }}>{selected.body}</p>
              {selected.tags.length > 0 && (
                <p className="ap-panel__meta">Tags: {selected.tags.join(", ")}</p>
              )}
              <div className="ap-panel__actions">
                {selected.isApproved ? (
                  <button
                    type="button"
                    className="ap-panel__btn"
                    disabled={busy}
                    onClick={async () => {
                      setBusy(true);
                      setError(null);
                      try {
                        await reviewsApi.reject(selected.id);
                        await reload();
                      } catch (e) {
                        setError(e instanceof Error ? e.message : "Failed");
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    Hide
                  </button>
                ) : (
                  <button
                    type="button"
                    className="ap-panel__btn"
                    disabled={busy}
                    onClick={async () => {
                      setBusy(true);
                      setError(null);
                      try {
                        await reviewsApi.approve(selected.id);
                        await reload();
                      } catch (e) {
                        setError(e instanceof Error ? e.message : "Failed");
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    Approve
                  </button>
                )}
                <button
                  type="button"
                  className="ap-panel__btn ap-panel__btn--danger"
                  disabled={busy}
                  onClick={() => setConfirmDeleteId(selected.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          )}
        </aside>
      </div>

      {confirmDeleteId && (
        <AdminConfirmModal
          message="Delete this review permanently? This cannot be undone."
          busy={busy}
          onCancel={() => setConfirmDeleteId(null)}
          onConfirm={async () => {
            setBusy(true);
            try {
              await reviewsApi.remove(confirmDeleteId);
              setConfirmDeleteId(null);
              const next = new URLSearchParams(params);
              next.delete("selectedId");
              setParams(next);
              await reload();
            } catch (e) {
              setError(e instanceof Error ? e.message : "Delete failed");
              setConfirmDeleteId(null);
            } finally {
              setBusy(false);
            }
          }}
        />
      )}
    </div>
  );
}
