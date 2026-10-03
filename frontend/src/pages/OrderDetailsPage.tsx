import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ordersApi } from "../api";
import type { OrderDto } from "../api/types";

export function OrderDetailsPage() {
  const { id } = useParams();
  const [order, setOrder] = useState<OrderDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    ordersApi
      .byId(id)
      .then(setOrder)
      .catch((e: Error) => setError(e.message));
  }, [id]);

  if (error) return <div className="page-wrap empty-state">{error}</div>;
  if (!order) return <div className="page-wrap empty-state">Loading…</div>;

  return (
    <div className="page-wrap">
      <p>
        <Link to="/orders">← Orders</Link>
      </p>
      <h1>Order details</h1>
      <p className="muted">
        {new Date(order.orderDateUtc).toLocaleString()} · {order.status}
      </p>

      <table className="admin-table">
        <thead>
          <tr>
            <th>Product</th>
            <th>Qty</th>
            <th>Price</th>
            <th>Sum</th>
          </tr>
        </thead>
        <tbody>
          {(order.items ?? []).map((i, idx) => (
            <tr key={idx}>
              <td>
                <Link to={`/products/${i.productId}`}>{i.productName}</Link>
              </td>
              <td>{i.quantity}</td>
              <td>${i.unitPrice.toFixed(2)}</td>
              <td>${(i.unitPrice * i.quantity).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="buy-row" style={{ marginTop: 16, maxWidth: 320 }}>
        <span>Total</span>
        <strong>${order.totalAmount.toFixed(2)}</strong>
      </div>
    </div>
  );
}
