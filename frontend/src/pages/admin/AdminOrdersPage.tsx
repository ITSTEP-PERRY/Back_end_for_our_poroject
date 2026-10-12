import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ordersApi } from "../../api";
import type { AdminOrdersResponse, OrderDto } from "../../api/types";

const STATUSES = [
  "Ordered",
  "Received",
  "Shipped",
  "ReadyToPickup",
  "Cancelled",
  "Returned",
] as const;

function statusClass(status: string) {
  const s = status.toLowerCase();
  if (s === "ordered") return "ap-status ap-status--pending";
  if (s === "received") return "ap-status ap-status--paid";
  if (s.includes("ship")) return "ap-status ap-status--shipped";
  if (s === "readytopickup") return "ap-status ap-status--completed";
  if (s.includes("cancel")) return "ap-status ap-status--cancelled";
  if (s.includes("return")) return "ap-status ap-status--cancelled";
  return "ap-status";
}

function fmtPct(v: number | null | undefined) {
  if (v == null || Number.isNaN(v)) return "—";
  const sign = v > 0 ? "+" : "";
  return `${sign}${v.toFixed(1)}%`;
}

function toInputDate(iso: string | null) {
  if (!iso) return "";
  return iso.slice(0, 10);
}

/** Inclusive calendar day → UTC midnight start */
function dayStartIso(d: string) {
  return `${d}T00:00:00.000Z`;
}

/** Inclusive "to" date → exclusive next-day UTC midnight for API `< toUtc` */
function dayEndExclusiveIso(d: string) {
  const dt = new Date(`${d}T00:00:00.000Z`);
  dt.setUTCDate(dt.getUTCDate() + 1);
  return dt.toISOString();
}

/** Current calendar month UTC → from start of month, to start of next month */
function currentMonthRangeUtc() {
  const now = new Date();
  const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const to = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  return { from: from.toISOString(), to: to.toISOString() };
}

export function AdminOrdersPage() {
  const [params, setParams] = useSearchParams();
  const selectedId = params.get("selectedId") || undefined;
  const status = params.get("status") || "";
  const orderId = params.get("orderId") || "";
  const fromUtc = params.get("fromUtc") || "";
  const toUtc = params.get("toUtc") || "";

  const [data, setData] = useState<AdminOrdersResponse | null>(null);
  const [orderIdInput, setOrderIdInput] = useState(orderId);
  const [fromInput, setFromInput] = useState(toInputDate(fromUtc || null));
  const [toInput, setToInput] = useState(toInputDate(toUtc || null));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const query = useMemo(
    () => ({
      status: status || undefined,
      orderId: orderId || undefined,
      fromUtc: fromUtc || undefined,
      toUtc: toUtc || undefined,
    }),
    [status, orderId, fromUtc, toUtc],
  );

  const reload = () => {
    setLoading(true);
    return ordersApi
      .admin(query)
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setError(null);
    void reload();
  }, [query.status, query.orderId, query.fromUtc, query.toUtc]);

  useEffect(() => setOrderIdInput(orderId), [orderId]);
  useEffect(() => setFromInput(toInputDate(fromUtc || null)), [fromUtc]);
  useEffect(() => setToInput(toInputDate(toUtc || null)), [toUtc]);

  const orders: OrderDto[] = data?.items ?? [];
  const selected = orders.find((o) => o.id === selectedId) ?? null;

  const patchParams = (patch: Record<string, string | undefined>) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    setParams(next);
  };

  const applyFilters = () => {
    patchParams({
      orderId: orderIdInput.trim() || undefined,
      fromUtc: fromInput ? dayStartIso(fromInput) : undefined,
      toUtc: toInput ? dayEndExclusiveIso(toInput) : undefined,
      selectedId: undefined,
    });
  };

  const setThisMonth = () => {
    const { from, to } = currentMonthRangeUtc();
    patchParams({ fromUtc: from, toUtc: to, selectedId: undefined });
  };

  const clearPeriod = () => {
    patchParams({ fromUtc: undefined, toUtc: undefined, selectedId: undefined });
  };

  return (
    <div data-figma="2674:2644">
      {error && <div className="alert alert-error">{error}</div>}

      <div className="ap-toolbar">
        <span className="ap-toolbar__label">Orders</span>
        <form
          className="ap-search"
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            applyFilters();
          }}
        >
          <img className="ap-search__icon" src="/icons/search.svg" alt="" width={20} height={16} />
          <input
            className="ap-search__input"
            type="search"
            value={orderIdInput}
            onChange={(e) => setOrderIdInput(e.target.value)}
            placeholder="Search by #AT456BB or orderId…"
          />
        </form>
      </div>

      <div className="ap-orders-filters">
        <label>
          Status
          <select
            value={status}
            onChange={(e) => patchParams({ status: e.target.value || undefined, selectedId: undefined })}
          >
            <option value="">All</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label>
          From
          <input type="date" value={fromInput} onChange={(e) => setFromInput(e.target.value)} />
        </label>
        <label>
          To
          <input type="date" value={toInput} onChange={(e) => setToInput(e.target.value)} />
        </label>
        <button type="button" className="btn btn-secondary" onClick={applyFilters}>
          Apply dates
        </button>
        <button type="button" className="btn btn-secondary" onClick={setThisMonth}>
          This month
        </button>
        <button type="button" className="btn btn-secondary" onClick={clearPeriod}>
          All time
        </button>
      </div>

      {data && (
        <div className="ap-orders-stats">
          <div className="ap-orders-stats__main">
            <div>
              <span className="ap-orders-stats__label">Orders</span>
              <strong>{data.totalOrders}</strong>
              {data.totalOrderCompare != null && (
                <span
                  className={
                    data.totalOrderCompare >= 0
                      ? "ap-orders-stats__cmp is-up"
                      : "ap-orders-stats__cmp is-down"
                  }
                >
                  {fmtPct(data.totalOrderCompare)}
                </span>
              )}
            </div>
            <div>
              <span className="ap-orders-stats__label">Total amount</span>
              <strong>${data.totalAmount.toFixed(2)}</strong>
              {data.totalAmountCompare != null && (
                <span
                  className={
                    data.totalAmountCompare >= 0
                      ? "ap-orders-stats__cmp is-up"
                      : "ap-orders-stats__cmp is-down"
                  }
                >
                  {fmtPct(data.totalAmountCompare)}
                </span>
              )}
            </div>
          </div>
          <div className="ap-orders-stats__counts">
            {STATUSES.map((s) => (
              <button
                key={s}
                type="button"
                className={`ap-orders-stats__chip ${status === s ? "is-active" : ""}`}
                onClick={() =>
                  patchParams({ status: status === s ? undefined : s, selectedId: undefined })
                }
              >
                <span className={statusClass(s)}>{s}</span>
                <em>{data.statusCounts[s] ?? 0}</em>
              </button>
            ))}
          </div>
          {data.comparePeriod && (
            <p className="ap-orders-stats__hint">
              Compare vs {new Date(data.comparePeriod.fromUtc).toLocaleDateString()} –{" "}
              {new Date(data.comparePeriod.toUtc).toLocaleDateString()}
            </p>
          )}
        </div>
      )}

      {loading && <p className="muted">Loading…</p>}

      <div className="ap-layout">
        <section className="ap-list">
          {orders.length === 0 ? (
            <div className="ap-empty">
              <div className="ap-empty__ph" aria-hidden="true" />
              <p className="ap-empty__text">No orders for current filters</p>
            </div>
          ) : (
            <div className="ap-table ap-table--orders">
              <div className="ap-table__head">
                <span>Date</span>
                <span>Customer</span>
                <span>Status</span>
                <span>Total</span>
                <span />
              </div>
              {orders.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  className={`ap-table__row ${selectedId === o.id ? "is-selected" : ""}`}
                  onClick={() => patchParams({ selectedId: o.id })}
                >
                  <span className="ap-table__name">
                    {o.orderNumber || o.id.slice(0, 8)}
                    <br />
                    <small>{new Date(o.orderDateUtc).toLocaleString()}</small>
                  </span>
                  <span>{o.userName || "—"}</span>
                  <span>
                    <span className={statusClass(o.status)}>{o.status}</span>
                  </span>
                  <span className="ap-table__price">${o.totalAmount.toFixed(2)}</span>
                  <span />
                </button>
              ))}
            </div>
          )}
        </section>

        <aside className="ap-panel">
          {!selected ? (
            <div className="ap-panel__empty">
              <p>Select an order to see its information</p>
            </div>
          ) : (
            <div className="ap-panel__preview">
              <h2 className="ap-panel__title">Order information</h2>
              <p className="ap-panel__meta">
                <strong>{selected.orderNumber || "—"}</strong>
              </p>
              <p className="ap-panel__meta">
                <code>{selected.id}</code>
              </p>
              <p className="ap-panel__meta">
                {new Date(selected.orderDateUtc).toLocaleString()} · {selected.userName || "Guest"}
              </p>
              <p className="ap-panel__meta">
                Items: {selected.itemsCount} · Total:{" "}
                <strong>${selected.totalAmount.toFixed(2)}</strong>
              </p>
              <label className="ap-panel__form" style={{ marginTop: 16 }}>
                Status
                <select
                  value={selected.status}
                  onChange={async (e) => {
                    await ordersApi.setStatus(selected.id, e.target.value);
                    await reload();
                  }}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              {selected.items && selected.items.length > 0 && (
                <div style={{ marginTop: 20 }}>
                  <h3 className="ap-panel__form-title" style={{ fontSize: "1rem" }}>
                    Items
                  </h3>
                  <ul style={{ paddingLeft: 18, margin: 0 }}>
                    {selected.items.map((it, i) => (
                      <li key={i} style={{ marginBottom: 8 }}>
                        {it.productName} × {it.quantity} — ${it.unitPrice.toFixed(2)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
