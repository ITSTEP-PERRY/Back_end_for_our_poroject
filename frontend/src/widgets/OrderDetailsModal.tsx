import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ordersApi } from "../api";
import type { OrderDto } from "../api/types";

const STATUS_LABEL: Record<string, string> = {
  Ordered: "Ordered",
  Received: "Received",
  Shipped: "Shipped",
  ReadyToPickup: "Ready for pickup",
  Cancelled: "Cancelled",
  Returned: "Returned",
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

type Props = {
  order: OrderDto;
  onClose: () => void;
  onLoaded?: (order: OrderDto) => void;
};

export function OrderDetailsModal({ order: initial, onClose, onLoaded }: Props) {
  const [order, setOrder] = useState(initial);
  const [loading, setLoading] = useState(!initial.items?.length);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    ordersApi
      .byId(initial.id)
      .then((fresh) => {
        if (cancelled) return;
        setOrder(fresh);
        onLoaded?.(fresh);
      })
      .catch(() => {
        if (!cancelled) setOrder(initial);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [initial.id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const label = STATUS_LABEL[order.status] ?? order.status;
  const statusClass = STATUS_CLASS[order.status] ?? "";

  return (
    <div className="acc-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="acc-modal order-details-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-details-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="acc-modal__close" aria-label="Close" onClick={onClose}>
          ×
        </button>

        <header className="order-details-modal__head">
          <h2 id="order-details-title">Order #{shortId(order.id)}</h2>
          <span className={`order-status ${statusClass}`}>{label}</span>
        </header>

        {loading ? (
          <p className="muted">Loading…</p>
        ) : (
          <>
            <ul className="order-details-modal__items">
              {(order.items ?? []).map((item, idx) => (
                <li key={`${item.productId}-${idx}`} className="order-details-item">
                  <Link to={`/products/${item.productId}`} className="order-details-item__img">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt="" />
                    ) : (
                      <div className="img-placeholder" />
                    )}
                  </Link>
                  <div className="order-details-item__info">
                    <Link to={`/products/${item.productId}`}>{item.productName}</Link>
                    {item.productDescription && (
                      <p className="order-details-item__desc">
                        {item.productDescription.slice(0, 120)}
                        {item.productDescription.length > 120 ? "…" : ""}
                      </p>
                    )}
                  </div>
                  <div className="order-details-item__prices">
                    <span>
                      {item.quantity} × ${item.unitPrice.toFixed(2)}
                    </span>
                    <strong>${(item.lineTotal ?? item.unitPrice * item.quantity).toFixed(2)}</strong>
                  </div>
                </li>
              ))}
            </ul>

            <div className="order-details-modal__total">
              {(order.status === "Ordered" ||
                order.status === "Received" ||
                order.status === "Pending" ||
                order.status === "Paid") && (
                <button type="button" className="btn btn-outline" disabled title="Coming soon">
                  How to cancel order?
                </button>
              )}
              <div className="order-details-modal__total-sum">
                <span>Total:</span>
                <strong>${order.totalAmount.toFixed(2)}</strong>
              </div>
            </div>

            <section className="order-details-modal__extra">
              <h3>Additional information</h3>
              <dl>
                <div>
                  <dt>Recipient&apos;s name:</dt>
                  <dd>{order.recipientName || order.userName || "—"}</dd>
                </div>
                <div>
                  <dt>Address:</dt>
                  <dd>{order.shippingAddress || "—"}</dd>
                </div>
                <div>
                  <dt>Payment type:</dt>
                  <dd>{order.paymentType || "Cash"}</dd>
                </div>
                <div>
                  <dt>Ordered on:</dt>
                  <dd>{formatOrderDate(order.orderDateUtc)}</dd>
                </div>
              </dl>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
