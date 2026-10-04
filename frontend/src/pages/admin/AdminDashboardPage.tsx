import { Link } from "react-router-dom";

const SECTIONS = [
  { to: "/admin/products", title: "Products", hint: "Create and edit catalog items" },
  { to: "/admin/categories", title: "Categories", hint: "Manage category tree" },
  { to: "/admin/reviews", title: "Reviews", hint: "Moderate customer reviews" },
  { to: "/admin/orders", title: "Orders", hint: "Track and update orders" },
  { to: "/admin/users", title: "Users", hint: "Browse accounts (Admin API)" },
] as const;

export function AdminDashboardPage() {
  return (
    <div className="ap-dash">
      <h1 className="ap-dash__title">Admin dashboard</h1>
      <p className="ap-dash__lead">Choose a section to manage the store.</p>
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
