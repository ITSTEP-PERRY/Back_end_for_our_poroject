import { Link } from "react-router-dom";

export function AdminDashboardPage() {
  return (
    <div>
      <h1 className="page-title">Admin dashboard</h1>
      <div className="cat-grid">
        <Link className="cat-tile" to="/admin/products">
          Products
        </Link>
        <Link className="cat-tile" to="/admin/categories">
          Categories
        </Link>
        <Link className="cat-tile" to="/admin/reviews">
          Reviews
        </Link>
        <Link className="cat-tile" to="/admin/orders">
          Orders
        </Link>
        <Link className="cat-tile" to="/admin/users">
          Users
        </Link>
      </div>
    </div>
  );
}
