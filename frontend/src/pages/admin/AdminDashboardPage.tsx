import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ordersApi, productsApi, reviewsApi } from "../../api";
import type { AdminOrdersResponse, OrderDto } from "../../api/types";

const SECTIONS = [
  { to: "/admin/products", title: "Products", hint: "Create and edit catalog items" },
  { to: "/admin/categories", title: "Categories", hint: "Manage category tree" },
  { to: "/admin/reviews", title: "Reviews", hint: "Moderate customer reviews" },
  { to: "/admin/orders", title: "Orders", hint: "Track and update orders" },
  { to: "/admin/users", title: "Users", hint: "Browse accounts (Admin API)" },
] as const;

const QUICK = [
  { to: "/admin/products/new", label: "Create product" },
  { to: "/admin/reviews?status=pending", label: "Moderate reviews" },
  { to: "/admin/orders", label: "Open orders" },
  { to: "/admin/users", label: "Customers" },
] as const;

function currentMonthRangeUtc() {
  const now = new Date();
  const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const to = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  return { from: from.toISOString(), to: to.toISOString() };
}

function money(v: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(v);
}

export function AdminDashboardPage() {
  const [orders, setOrders] = useState<AdminOrdersResponse | null>(null);
  const [recent, setRecent] = useState<OrderDto[]>([]);
  const [productTotal, setProductTotal] = useState<number | null>(null);
  const [pendingReviews, setPendingReviews] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const month = currentMonthRangeUtc();
    let cancelled = false;

    void (async () => {
      try {
        const [monthOrders, recentOrders, products, pending] = await Promise.all([
          ordersApi.admin({ fromUtc: month.from, toUtc: month.to, pageSize: 1 }),
          ordersApi.admin({ pageSize: 6 }),
          productsApi.list({ page: 1, pageSize: 1 }),
          reviewsApi.adminList({ status: "pending" }),
        ]);
        if (cancelled) return;
        setOrders(monthOrders);
        setRecent(recentOrders.items ?? []);
        setProductTotal(products.total ?? products.items?.length ?? 0);
        setPendingReviews(pending.length);
        setError(null);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load dashboard");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const ordered = orders?.statusCounts?.Ordered ?? 0;
  const shipped = orders?.statusCounts?.Shipped ?? 0;

  return (
    <div className="ap-dash">
      <h1 className="ap-dash__title">Admin dashboard</h1>
      <p className="ap-dash__lead">Store pulse this month — then jump into a section.</p>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="ap-dash__kpis">
        <div className="ap-dash__kpi">
          <span className="ap-dash__kpi-label">Orders (month)</span>
          <strong className="ap-dash__kpi-value">{orders ? orders.totalOrders : "—"}</strong>
        </div>
        <div className="ap-dash__kpi">
          <span className="ap-dash__kpi-label">Revenue (month)</span>
          <strong className="ap-dash__kpi-value">
            {orders ? money(orders.totalAmount) : "—"}
          </strong>
        </div>
        <div className="ap-dash__kpi">
          <span className="ap-dash__kpi-label">Catalog products</span>
          <strong className="ap-dash__kpi-value">{productTotal ?? "—"}</strong>
        </div>
        <div className="ap-dash__kpi">
          <span className="ap-dash__kpi-label">Reviews to moderate</span>
          <strong className="ap-dash__kpi-value">{pendingReviews ?? "—"}</strong>
        </div>
        <div className="ap-dash__kpi">
          <span className="ap-dash__kpi-label">Ordered / Shipped</span>
          <strong className="ap-dash__kpi-value">
            {orders ? `${ordered} / ${shipped}` : "—"}
          </strong>
        </div>
      </div>

      <div className="ap-dash__quick">
        {QUICK.map((q) => (
          <Link key={q.to} className="ap-btn ap-btn--accent" to={q.to}>
            {q.label}
          </Link>
        ))}
      </div>

      <section className="ap-dash__recent">
        <div className="ap-dash__recent-head">
          <h2 className="ap-dash__section-title">Recent orders</h2>
          <Link className="ap-dash__more" to="/admin/orders">
            View all
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="ap-dash__empty">No orders yet.</p>
        ) : (
          <ul className="ap-dash__order-list">
            {recent.map((o) => (
              <li key={o.id}>
                <Link className="ap-dash__order" to={`/admin/orders?selectedId=${o.id}`}>
                  <span className="ap-dash__order-id">
                    {o.orderNumber || `#${o.id.slice(0, 8)}`}
                  </span>
                  <span className="ap-dash__order-meta">
                    {o.userName || o.userEmail || "Customer"} · {o.status}
                  </span>
                  <span className="ap-dash__order-amount">{money(o.totalAmount)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <h2 className="ap-dash__section-title">Sections</h2>
      <div className="ap-dash__grid">
        {SECTIONS.map((s) => (
          <Link key={s.to} className="ap-dash__tile" to={s.to}>
            <span className="ap-dash__tile-title">{s.title}</span>
            <span className="ap-dash__tile-hint">{s.hint}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
