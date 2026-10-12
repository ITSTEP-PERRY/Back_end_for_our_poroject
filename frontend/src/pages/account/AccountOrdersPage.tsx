import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ordersApi } from "../../api";
import type { OrderDto } from "../../api/types";
import { OrderDetailsModal } from "../../widgets/OrderDetailsModal";

const STATUS_LABEL: Record<string, string> = {
  Ordered: "Ordered",
  Received: "Received",
  Shipped: "Shipped",
  ReadyToPickup: "Ready for pickup",
  Cancelled: "Cancelled",
  Returned: "Returned",
  // legacy API names
  Pending: "Ordered",
  Paid: "Received",
  Completed: "Ready for pickup",
};

const STATUS_CLASS: Record<string, string> = {
  Ordered: "is-ordered",
  Received: "is-received",
  Shipped: "is-shipped",
  ReadyToPickup: "is-pickup",
  Cancelled: "is-cancelled",
  Returned: "is-cancelled",
  Pending: "is-ordered",
  Paid: "is-received",
  Completed: "is-pickup",
};

function formatOrderDate(iso: string) {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
}

function shortId(id: string) {
  const digits = id.replace(/\D/g, "");
  if (digits.length >= 6) return digits.slice(-6);
  return id.slice(0, 6).toUpperCase();
}

export function AccountOrdersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    ordersApi
      .mine()
      .then((list) => {
        setOrders(list);
        const openId = searchParams.get("open");
        if (openId && list.some((o) => o.id === openId)) {
          setSelectedId(openId);
          const next = new URLSearchParams(searchParams);
          next.delete("open");
          setSearchParams(next, { replace: true });
        }
      })
      .catch((e: Error) => {
        setError(e.message);
      })
      .finally(() => setLoading(false));
    // open query handled once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selected = useMemo(
    () => orders.find((o) => o.id === selectedId) ?? null,
    [orders, selectedId],
  );

  return (
    <section className="account-panel">
      <h1 className="account-panel__title">My orders</h1>

      {error && <div className="alert alert-error">{error}</div>}
      {loading && <div className="empty-state">Loading…</div>}

      {!loading && !error && orders.length === 0 && (
        <div className="empty-state">
          No orders yet. <Link to="/products">Shop now</Link>
        </div>
      )}

      {orders.length > 0 && (
        <div className="orders-box">
          {orders.map((o) => {
            const label = STATUS_LABEL[o.status] ?? o.status;
            const statusClass = STATUS_CLASS[o.status] ?? "";
            const count = o.itemsCount || o.items?.length || 0;
            return (
              <article key={o.id} className="order-row">
                <div className="order-row__main">
                  <div className="order-row__head">
                    <strong>Order {o.orderNumber || `#${shortId(o.id)}`}</strong>
                    <span className={`order-status ${statusClass}`}>{label}</span>
                  </div>
                  <div className="order-row__meta">Ordered on {formatOrderDate(o.orderDateUtc)}</div>
                </div>
                <div className="order-row__side">
                  <div className="order-row__count">
                    Ordered {count} item{count === 1 ? "" : "s"}
                  </div>
                  <div className="order-row__price">$ {o.totalAmount.toFixed(2)}</div>
                  <button
                    type="button"
                    className="btn btn-outline order-row__details"
                    onClick={() => setSelectedId(o.id)}
                  >
                    Details
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {selected && (
        <OrderDetailsModal
          order={selected}
          onClose={() => setSelectedId(null)}
          onLoaded={(fresh) =>
            setOrders((prev) => prev.map((o) => (o.id === fresh.id ? fresh : o)))
          }
        />
      )}
    </section>
  );
}
