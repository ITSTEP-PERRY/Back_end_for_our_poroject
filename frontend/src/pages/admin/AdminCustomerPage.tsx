import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ordersApi, usersApi } from "../../api";
import type { OrderDto } from "../../api/types";

type Customer = {
  id: string;
  name: string;
  email: string;
  roleId: string;
  login: string;
  registeredAtUtc: string;
  deletedAtUtc?: string | null;
  isDeleted?: boolean;
};

function money(v: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(v);
}

export function AdminCustomerPage() {
  const { userId = "" } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = async () => {
    if (!userId) return;
    setBusy(true);
    setError(null);
    try {
      const [u, o] = await Promise.all([
        usersApi.get(userId),
        ordersApi.admin({ userId, pageSize: 50 }),
      ]);
      setUser(u);
      setOrders(o.items ?? []);
      setTotalOrders(o.totalOrders ?? o.items?.length ?? 0);
      setTotalAmount(o.totalAmount ?? 0);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message.includes("401") || e.message.includes("Unauthorized")
            ? "Users API needs Auth Admin JWT (not local Admin/Admin)."
            : e.message
          : "Failed to load customer",
      );
      setUser(null);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    void reload();
  }, [userId]);

  if (!userId) {
    return (
      <div className="ap-customer">
        <p className="ap-dash__empty">Missing customer id.</p>
        <Link to="/admin/users">Back to users</Link>
      </div>
    );
  }

  return (
    <div className="ap-customer" data-figma="a15-customer">
      <div className="ap-customer__nav">
        <button type="button" className="ap-btn" onClick={() => navigate("/admin/users")}>
          ← Users
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {!user && !error && <p className="ap-dash__empty">{busy ? "Loading…" : "Customer not found."}</p>}

      {user && (
        <>
          <header className="ap-customer__head">
            <div>
              <h1 className="ap-dash__title">{user.name || "Customer"}</h1>
              <p className="ap-dash__lead">{user.email}</p>
            </div>
            <span
              className={`ap-status ${user.isDeleted ? "ap-status--cancelled" : "ap-status--completed"}`}
            >
              {user.isDeleted ? "Deleted" : "Active"}
            </span>
          </header>

          <div className="ap-customer__meta">
            <div>
              <span className="ap-dash__kpi-label">Login</span>
              <strong>@{user.login || "—"}</strong>
            </div>
            <div>
              <span className="ap-dash__kpi-label">Role</span>
              <strong>{user.roleId}</strong>
            </div>
            <div>
              <span className="ap-dash__kpi-label">Registered</span>
              <strong>
                {user.registeredAtUtc ? new Date(user.registeredAtUtc).toLocaleString() : "—"}
              </strong>
            </div>
            <div>
              <span className="ap-dash__kpi-label">Orders</span>
              <strong>{totalOrders}</strong>
            </div>
            <div>
              <span className="ap-dash__kpi-label">Lifetime spent</span>
              <strong>{money(totalAmount)}</strong>
            </div>
          </div>

          <div className="ap-customer__actions">
            <Link className="ap-btn" to={`/admin/users?selectedId=${user.id}`}>
              Manage in Users list
            </Link>
            <Link className="ap-btn ap-btn--accent" to="/admin/orders">
              Orders board
            </Link>
          </div>

          <section className="ap-dash__recent">
            <h2 className="ap-dash__section-title">Order history</h2>
            {orders.length === 0 ? (
              <p className="ap-dash__empty">No orders for this customer.</p>
            ) : (
              <ul className="ap-dash__order-list">
                {orders.map((o) => (
                  <li key={o.id}>
                    <Link className="ap-dash__order" to={`/admin/orders?selectedId=${o.id}`}>
                      <span className="ap-dash__order-id">
                        {o.orderNumber || `#${o.id.slice(0, 8)}`}
                      </span>
                      <span className="ap-dash__order-meta">
                        {new Date(o.orderDateUtc).toLocaleDateString()} · {o.status} ·{" "}
                        {o.itemsCount} items
                      </span>
                      <span className="ap-dash__order-amount">{money(o.totalAmount)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
