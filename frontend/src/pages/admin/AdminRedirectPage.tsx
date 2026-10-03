const ADMIN_URL =
  (import.meta.env.VITE_ADMIN_URL as string | undefined)?.replace(/\/$/, "") ||
  "http://localhost:3001";

/** Прототип /admin убран — источник правды: perry-admin-front команды. */
export function AdminRedirectPage() {
  return (
    <div className="page-wrap" style={{ maxWidth: 520, margin: "4rem auto", textAlign: "center" }}>
      <h1 style={{ fontSize: "1.5rem", marginBottom: "0.75rem" }}>Admin moved</h1>
      <p style={{ color: "#555", marginBottom: "1.5rem" }}>
        Админка ведётся в репозитории команды <code>perry-admin-front</code> (Ant Design + Redux).
        Прототип внутри витрины больше не используется.
      </p>
      <a
        className="btn btn-primary"
        href={ADMIN_URL}
        style={{ display: "inline-block", padding: "0.75rem 1.25rem" }}
      >
        Open admin → {ADMIN_URL}
      </a>
    </div>
  );
}
