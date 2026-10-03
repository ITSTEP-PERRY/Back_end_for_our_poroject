import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { usersApi } from "../../api";
import { AdminConfirmModal } from "../../widgets/admin/AdminConfirmModal";
import { AdminEmptyBlob } from "../../widgets/admin/AdminEmptyBlob";

type UserRow = {
  id: string;
  name: string;
  email: string;
  roleId: string;
  login: string;
  registeredAtUtc: string;
  deletedAtUtc?: string | null;
  isDeleted?: boolean;
};

const ROLES = ["Admin", "User"] as const;

const ALL_COLUMNS = [
  { id: "name", label: "Name" },
  { id: "email", label: "Email" },
  { id: "role", label: "Role" },
  { id: "status", label: "Status" },
  { id: "login", label: "Login" },
  { id: "registered", label: "Registered" },
] as const;

type ColId = (typeof ALL_COLUMNS)[number]["id"];

const DEFAULT_COLS: ColId[] = ["name", "email", "role", "status"];

export function AdminUsersPage() {
  const [params, setParams] = useSearchParams();
  const selectedId = params.get("selectedId") || undefined;
  const status = params.get("status") || "active";
  const role = params.get("role") || "";
  const q = params.get("q") || "";
  const [users, setUsers] = useState<UserRow[]>([]);
  const [search, setSearch] = useState(q);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [cols, setCols] = useState<ColId[]>(DEFAULT_COLS);
  const [colsOpen, setColsOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const colsRef = useRef<HTMLDivElement>(null);

  const reload = () =>
    usersApi
      .list({ status, role: role || undefined })
      .then((rows) => {
        setUsers(rows);
        setError(null);
      })
      .catch((e: Error) =>
        setError(
          e.message.includes("401") || e.message.includes("Unauthorized")
            ? "Users API (Azure) принимает только JWT от Auth Service. Локальный Admin/Admin открывает Product API, но не Users — войдите email/паролем Auth Admin."
            : e.message,
        ),
      );

  useEffect(() => {
    void reload();
  }, [status, role]);

  useEffect(() => setSearch(q), [q]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!colsRef.current?.contains(e.target as Node)) setColsOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return users;
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(qq) ||
        u.email.toLowerCase().includes(qq) ||
        u.login.toLowerCase().includes(qq),
    );
  }, [users, q]);

  const selected = filtered.find((u) => u.id === selectedId) ?? null;

  const setFilter = (key: string, value?: string) => {
    const next = new URLSearchParams(params);
    if (!value) next.delete(key);
    else next.set(key, value);
    if (key !== "selectedId") next.delete("selectedId");
    setParams(next);
  };

  const emptyText = role
    ? "No users in the selected role"
    : q
      ? `Nothing found for “${q}”`
      : "No users in the selected role";

  return (
    <div data-figma="2720:5575">
      {error && <div className="alert alert-error">{error}</div>}

      <div className="ap-toolbar ap-toolbar--users">
        <span className="ap-toolbar__label">Role</span>
        <select
          className="ap-select"
          value={role || "all"}
          aria-label="Filter by role"
          onChange={(e) => setFilter("role", e.target.value === "all" ? undefined : e.target.value)}
        >
          <option value="all">All</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>

        <div className="ap-chips">
          {(
            [
              ["active", "Active"],
              ["deleted", "Deleted"],
              ["all", "All status"],
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
          onSubmit={(e: FormEvent) => {
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

        <div className="ap-cols" ref={colsRef}>
          <button
            type="button"
            className="ap-cols__trigger"
            aria-expanded={colsOpen}
            onClick={() => setColsOpen((v) => !v)}
          >
            Columns
            <span className="ap-cat__chevron" aria-hidden="true" />
          </button>
          {colsOpen && (
            <div className="ap-cols__menu">
              {ALL_COLUMNS.map((c) => (
                <label key={c.id} className="ap-cols__item">
                  <input
                    type="checkbox"
                    checked={cols.includes(c.id)}
                    onChange={() =>
                      setCols((prev) =>
                        prev.includes(c.id)
                          ? prev.filter((x) => x !== c.id)
                          : [...prev, c.id],
                      )
                    }
                  />
                  {c.label}
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="ap-layout">
        <section className="ap-list">
          {filtered.length === 0 ? (
            <AdminEmptyBlob text={emptyText} />
          ) : (
            <div className="ap-table ap-table--users">
              <div
                className="ap-table__head"
                style={{ gridTemplateColumns: `repeat(${Math.max(cols.length, 1)}, minmax(0,1fr)) 40px` }}
              >
                {cols.map((id) => (
                  <span key={id}>{ALL_COLUMNS.find((c) => c.id === id)?.label}</span>
                ))}
                <span />
              </div>
              {filtered.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  className={`ap-table__row ${selectedId === u.id ? "is-selected" : ""}`}
                  style={{ gridTemplateColumns: `repeat(${Math.max(cols.length, 1)}, minmax(0,1fr)) 40px` }}
                  onClick={() => setFilter("selectedId", u.id)}
                >
                  {cols.map((id) => {
                    if (id === "name")
                      return (
                        <span key={id} className="ap-table__name">
                          <strong title={u.name}>{u.name}</strong>
                        </span>
                      );
                    if (id === "email")
                      return (
                        <span key={id} className="ap-table__cell" title={u.email}>
                          {u.email}
                        </span>
                      );
                    if (id === "role")
                      return (
                        <span key={id} className="ap-table__cell">
                          {u.roleId}
                        </span>
                      );
                    if (id === "status")
                      return (
                        <span key={id}>
                          <span
                            className={`ap-status ${u.isDeleted ? "ap-status--cancelled" : "ap-status--completed"}`}
                          >
                            {u.isDeleted ? "Deleted" : "Active"}
                          </span>
                        </span>
                      );
                    if (id === "login")
                      return (
                        <span key={id} className="ap-table__cell">
                          @{u.login || "—"}
                        </span>
                      );
                    return (
                      <span key={id} className="ap-table__cell">
                        {u.registeredAtUtc ? new Date(u.registeredAtUtc).toLocaleDateString() : "—"}
                      </span>
                    );
                  })}
                  <span />
                </button>
              ))}
            </div>
          )}
        </section>

        <aside className="ap-panel">
          {!selected ? (
            <div className="ap-panel__empty">
              <p>Select a user to manage</p>
            </div>
          ) : (
            <div className="ap-panel__preview">
              <h2 className="ap-panel__title">{selected.name}</h2>
              <p className="ap-panel__meta">{selected.email}</p>
              <p className="ap-panel__meta">Login: {selected.login || "—"}</p>
              <p className="ap-panel__meta">
                Registered: {new Date(selected.registeredAtUtc).toLocaleString()}
              </p>
              {selected.isDeleted && selected.deletedAtUtc && (
                <p className="ap-panel__meta">
                  Deleted: {new Date(selected.deletedAtUtc).toLocaleString()}
                </p>
              )}
              <label className="ap-field">
                Role
                <select
                  value={selected.roleId}
                  disabled={busy || !!selected.isDeleted}
                  onChange={async (e) => {
                    setBusy(true);
                    setError(null);
                    try {
                      await usersApi.setRole(selected.id, e.target.value);
                      await reload();
                    } catch (err) {
                      setError(err instanceof Error ? err.message : "Role update failed");
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </label>
              <div className="ap-panel__actions">
                {selected.isDeleted ? (
                  <button
                    type="button"
                    className="ap-btn ap-btn--accent"
                    disabled={busy}
                    onClick={async () => {
                      setBusy(true);
                      try {
                        await usersApi.restore(selected.id);
                        await reload();
                      } catch (err) {
                        setError(err instanceof Error ? err.message : "Restore failed");
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    Restore
                  </button>
                ) : (
                  <button
                    type="button"
                    className="ap-btn ap-btn--danger-outline"
                    disabled={busy}
                    onClick={() => setConfirmDeleteId(selected.id)}
                  >
                    <img src="/icons/admin/trash.svg" alt="" width={16} height={16} />
                    Delete
                  </button>
                )}
              </div>
            </div>
          )}
        </aside>
      </div>

      {confirmDeleteId && (
        <AdminConfirmModal
          message="You can't recover this user. Soft-delete will hide the account from the active list."
          busy={busy}
          onCancel={() => setConfirmDeleteId(null)}
          onConfirm={async () => {
            setBusy(true);
            try {
              await usersApi.softDelete(confirmDeleteId);
              setConfirmDeleteId(null);
              const next = new URLSearchParams(params);
              next.delete("selectedId");
              setParams(next);
              await reload();
            } catch (err) {
              setError(err instanceof Error ? err.message : "Delete failed");
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
