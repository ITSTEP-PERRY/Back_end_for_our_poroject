import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { reviewsApi } from "../../api";

type MyReview = Awaited<ReturnType<typeof reviewsApi.mine>>[number];

export function AccountReviewsPage() {
  const [items, setItems] = useState<MyReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const list = await reviewsApi.mine();
        if (!cancelled) setItems(list);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Could not load reviews");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="account-panel">
      <h1 className="account-panel__title">My reviews</h1>
      <p className="account-panel__lead" style={{ marginBottom: "1rem", opacity: 0.8 }}>
        Reviews you left on products. Hidden by admin stay here with a badge.
      </p>

      {error && <div className="alert alert-error">{error}</div>}
      {loading && <div className="empty-state">Loading…</div>}
      {!loading && !error && items.length === 0 && (
        <div className="empty-state">
          You have not published any reviews yet.{" "}
          <Link to="/products">Browse catalog</Link>
        </div>
      )}

      {!loading && items.length > 0 && (
        <ul className="account-review-list" style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {items.map((r) => (
            <li
              key={r.id}
              className="account-review-card"
              style={{
                borderTop: "1px solid rgba(0,0,0,0.08)",
                padding: "1rem 0",
              }}
            >
              <div style={{ display: "flex", gap: "0.75rem", alignItems: "baseline", flexWrap: "wrap" }}>
                <Link to={`/products/${r.productId}`} style={{ fontWeight: 600 }}>
                  Product
                </Link>
                <span aria-label={`${r.rating} stars`}>{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
                {!r.isApproved && (
                  <span
                    style={{
                      fontSize: "0.75rem",
                      padding: "0.15rem 0.5rem",
                      background: "#f3e8e8",
                      color: "#8a2f2f",
                    }}
                  >
                    Hidden
                  </span>
                )}
                <span style={{ marginLeft: "auto", fontSize: "0.85rem", opacity: 0.7 }}>
                  {new Date(r.createdAtUtc).toLocaleDateString()}
                </span>
              </div>
              {r.title && <div style={{ fontWeight: 600, marginTop: "0.35rem" }}>{r.title}</div>}
              {r.body && <p style={{ margin: "0.35rem 0 0" }}>{r.body}</p>}
              {r.tags.length > 0 && (
                <div style={{ marginTop: "0.5rem", fontSize: "0.85rem", opacity: 0.75 }}>
                  {r.tags.join(" · ")}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
