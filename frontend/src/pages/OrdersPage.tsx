import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ordersApi } from "../api";
import type { OrderDto } from "../api/types";

export function OrdersPage() {
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    ordersApi
      .mine()
      .then(setOrders)
      .catch((e: Error) => setError(e.message));
  }, []);

  return (
    <div className="page-wrap">
      <h1>Order history</h1>
      {error && <div className="alert alert-error">{error}</div>}
      {orders.length === 0 && !error ? (
        <div className="empty-state">
          No orders yet. <Link to="/products">Shop now</Link>
        </div>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Items</th>
              <th>Total</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td>{new Date(o.orderDateUtc).toLocaleString()}</td>
                <td>{o.itemsCount}</td>
                <td>${o.totalAmount.toFixed(2)}</td>
                <td>{o.status}</td>
                <td>
                  <Link to={`/orders/${o.id}`}>Details</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
