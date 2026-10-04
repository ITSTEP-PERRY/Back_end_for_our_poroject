import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { resolveMediaUrl } from "../../api/media";
import { useAuth } from "../../app/AuthContext";

export function AccountShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  if (!user) return null;

  const roleLabel = user.roleId === "Admin" ? "Admin" : "Customer";
  const initial = (user.name?.trim()?.[0] || user.login?.[0] || "?").toUpperCase();
  const avatarSrc = resolveMediaUrl(user.avatar) || user.avatar || null;

  return (
    <div className="account-page" data-figma="1852:3311">
      <nav className="breadcrumbs breadcrumbs--account" aria-label="Breadcrumb">
        <Link className="breadcrumbs__home" to="/" aria-label="Home">
          <img src="/icons/home.svg" alt="" width={16} height={16} />
        </Link>
        <span className="breadcrumbs__sep">/</span>
        <span>Account</span>
      </nav>

      <div className="account-layout">
        <aside className="account-nav">
          <div className="account-nav__profile">
            {avatarSrc ? (
              <img className="account-nav__avatar" src={avatarSrc} alt="" />
            ) : (
              <div className="account-nav__avatar account-nav__avatar--initial" aria-hidden>
                {initial}
              </div>
            )}
            <div>
              <div className="account-nav__name">{user.name}</div>
              <div className="account-nav__role">{roleLabel}</div>
            </div>
          </div>

          <nav className="account-nav__list" aria-label="Account">
            <NavLink
              to="/account/orders"
              className={({ isActive }) => `account-nav__link${isActive ? " is-active" : ""}`}
            >
              My orders
            </NavLink>
            <NavLink
              to="/account/wishlist"
              className={({ isActive }) => `account-nav__link${isActive ? " is-active" : ""}`}
            >
              Wishlist
            </NavLink>
            <NavLink
              to="/account/reviews"
              className={({ isActive }) => `account-nav__link${isActive ? " is-active" : ""}`}
            >
              My reviews
            </NavLink>
            <NavLink
              to="/account/settings"
              className={({ isActive }) => `account-nav__link${isActive ? " is-active" : ""}`}
            >
              Account settings
            </NavLink>
          </nav>

          <button
            type="button"
            className="account-nav__logout"
            onClick={() => {
              logout();
              navigate("/");
            }}
          >
            Log out
          </button>
        </aside>

        <div className="account-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
