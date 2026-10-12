import { Link } from "react-router-dom";
import { useAuth } from "../../app/AuthContext";

export function ProfilePage() {
  const { user, logout } = useAuth();
  if (!user) return null;

  return (
    <div className="page-wrap">
      <h1>My profile</h1>

      <section className="admin-card profile-card">
        <h2>Account</h2>
        <div className="buy-row">
          <span>Login</span>
          <span>{user.login}</span>
        </div>
        <div className="buy-row">
          <span>Name</span>
          <span>{user.name}</span>
        </div>
        <div className="buy-row">
          <span>Email</span>
          <span>{user.email}</span>
        </div>
        <div className="buy-row">
          <span>Role</span>
          <span>{user.roleId}</span>
        </div>

        <div style={{ marginTop: 16, display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link className="btn btn-primary" to="/orders">
            My orders
          </Link>
          <button type="button" className="btn btn-ghost" onClick={logout}>
            Logout
          </button>
        </div>
      </section>
    </div>
  );
}
