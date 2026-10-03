import { useEffect, useState, type FormEvent } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { categoriesApi } from "../../api";
import type { CategoryDto } from "../../api/types";
import { useAuth } from "../../app/AuthContext";
import { useCart } from "../../app/CartContext";
import { useIsMobile } from "../../hooks/useMediaQuery";

const LEGAL_PATHS = new Set(["/privacy", "/terms", "/license"]);

function flattenCategories(nodes: CategoryDto[], depth = 0): { cat: CategoryDto; depth: number }[] {
  const out: { cat: CategoryDto; depth: number }[] = [];
  for (const n of nodes) {
    out.push({ cat: n, depth });
    if (n.subCategories?.length) out.push(...flattenCategories(n.subCategories, depth + 1));
  }
  return out;
}

export function AppShell() {
  const { user, logout, isAdmin } = useAuth();
  const { count } = useCart();
  const isMobile = useIsMobile();
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [showTop, setShowTop] = useState(false);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const navigate = useNavigate();
  const location = useLocation();
  const isLegal = LEGAL_PATHS.has(location.pathname);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 400);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    categoriesApi.tree().then(setCategories).catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (location.pathname.startsWith("/products")) {
      const q = new URLSearchParams(location.search).get("search") || "";
      setSearch(q);
    }
  }, [location.pathname, location.search]);

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    const q = search.trim();
    navigate(q ? `/products?search=${encodeURIComponent(q)}` : "/products");
    setMenuOpen(false);
  };

  const closeMenu = () => setMenuOpen(false);
  const flatCats = flattenCategories(categories).slice(0, 24);

  return (
    <div className={`shell${isLegal ? " legal-shell" : ""}`}>
      <header className="site-header">
        <div className="header-inner">
          <div className="header-brand">
            <button
              type="button"
              className="header-menu"
              aria-label="Menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
            >
              <img src="/icons/menu.svg" alt="" width={24} height={24} />
            </button>
            <Link className="logo" to="/">
              PERRY
            </Link>
          </div>

          <form className="search-form" onSubmit={onSearch}>
            <input
              type="search"
              name="search"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button type="submit" aria-label="Search">
              <img src="/icons/search.svg" alt="" width={24} height={24} />
            </button>
          </form>

          <nav className="header-actions">
            {user ? (
              <Link to="/account/orders" className="header-icon" aria-label={user.name}>
                <img src="/icons/account.svg" alt="" width={24} height={24} />
              </Link>
            ) : (
              <Link to="/login" className="header-icon" aria-label="Sign in">
                <img src="/icons/account.svg" alt="" width={24} height={24} />
              </Link>
            )}
            {user && (
              <Link to="/account/wishlist" className="header-icon" aria-label="Wishlist">
                <img src="/icons/star.svg" alt="" width={22} height={22} />
              </Link>
            )}
            {isAdmin && (
              <Link to="/admin/products" className="header-link">
                Admin
              </Link>
            )}
            <Link to="/cart" className="header-icon" aria-label="Cart">
              <img src="/icons/cart.svg" alt="" width={24} height={24} />
              {count > 0 && <span className="cart-badge">{count}</span>}
            </Link>
          </nav>
        </div>

        <button
          type="button"
          className={`site-menu-backdrop ${menuOpen ? "is-open" : ""}`}
          aria-label="Close menu"
          onClick={closeMenu}
        />
        <nav className={`mobile-nav ${menuOpen ? "is-open" : ""}`} aria-label="Catalog menu" data-figma="1860:2944">
          <NavLink to="/" onClick={closeMenu}>
            Home
          </NavLink>
          <NavLink to="/products" onClick={closeMenu}>
            Catalog
          </NavLink>
          {flatCats.map(({ cat, depth }) => (
            <NavLink
              key={cat.id}
              to={`/products?categoryId=${cat.id}`}
              onClick={closeMenu}
              style={{ paddingLeft: 8 + depth * 12 }}
            >
              {cat.name}
            </NavLink>
          ))}
          <NavLink to="/cart" onClick={closeMenu}>
            Cart
          </NavLink>
          {user ? (
            <>
              <NavLink to="/account/orders" onClick={closeMenu}>
                My orders
              </NavLink>
              <NavLink to="/account/wishlist" onClick={closeMenu}>
                Wishlist
              </NavLink>
              <NavLink to="/account/reviews" onClick={closeMenu}>
                My reviews
              </NavLink>
              <NavLink to="/account/settings" onClick={closeMenu}>
                Account settings
              </NavLink>
              {isAdmin && (
                <NavLink to="/admin/products" onClick={closeMenu}>
                  Admin
                </NavLink>
              )}
              <button
                type="button"
                className="header-link"
                style={{ background: "transparent", border: 0, textAlign: "left", padding: "10px 12px", cursor: "pointer", color: "inherit", fontWeight: 600 }}
                onClick={() => {
                  logout();
                  closeMenu();
                  navigate("/");
                }}
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" onClick={closeMenu}>
                Log in
              </NavLink>
              <NavLink to="/register" onClick={closeMenu}>
                Create account
              </NavLink>
            </>
          )}
          {!isMobile && (
            <button
              type="button"
              className="header-link"
              style={{ background: "transparent", border: 0, textAlign: "left", padding: "10px 12px", cursor: "pointer", color: "var(--link)", fontWeight: 600 }}
              onClick={closeMenu}
            >
              Close menu
            </button>
          )}
        </nav>
      </header>

      <main className="site-main">
        <Outlet />
      </main>

      <footer className="site-footer">
        <div className="footer-inner">
          <div className="footer-col">
            <h4>Support</h4>
            <Link to="/contact">Contact us</Link>
            <Link to="/faq">FAQ</Link>
          </div>
          <div className="footer-col">
            <h4>Legal notice</h4>
            <Link to="/terms">Terms and conditions</Link>
            <Link to="/license">License agreement</Link>
            <Link to="/privacy">Privacy Policy</Link>
          </div>
          <div className="footer-col">
            <h4>Social media</h4>
            <div className="social-row">
              {(
                [
                  ["Facebook", "/icons/social-facebook.svg", "https://facebook.com"],
                  ["X", "/icons/social-x.svg", "https://x.com"],
                  ["Instagram", "/icons/social-instagram.svg", "https://instagram.com"],
                  ["Mail", "/icons/social-mail.svg", "mailto:support@perry.demo"],
                  ["Telegram", "/icons/social-telegram.svg", "https://t.me"],
                ] as const
              ).map(([label, icon, href]) => (
                <a
                  key={label}
                  href={href}
                  className="social-row__link"
                  target={href.startsWith("mailto:") ? undefined : "_blank"}
                  rel={href.startsWith("mailto:") ? undefined : "noopener noreferrer"}
                  aria-label={label}
                  title={`${label} (demo)`}
                >
                  <img src={icon} alt="" width={16} height={16} />
                </a>
              ))}
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span className="logo logo-sm">PERRY</span>
          <span className="footer-bottom__copy">© 2024 Du Soleil. All rights reserved.</span>
        </div>
      </footer>

      {!isLegal && showTop && (
        <button type="button" className="to-top" aria-label="Back to top" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          <img src="/icons/to-top.svg" alt="" width={24} height={24} />
        </button>
      )}
    </div>
  );
}

export function AdminShell() {
  const { logout, isAdmin, loading, user } = useAuth();
  const navigate = useNavigate();
  const [drawer, setDrawer] = useState(false);

  useEffect(() => {
    if (!loading && !isAdmin) navigate("/admin/login", { replace: true });
  }, [loading, isAdmin, navigate]);

  if (loading || !isAdmin) return <div className="shell-loading">Loading…</div>;

  const close = () => setDrawer(false);

  return (
    <div className="admin-shell admin-body">
      <header className="admin-header">
        <div className="admin-header__inner">
          <button
            type="button"
            className="admin-header__icon-btn"
            aria-label="Menu"
            aria-expanded={drawer}
            onClick={() => setDrawer(true)}
          >
            <img src="/icons/menu.svg" alt="" width={24} height={24} />
          </button>
          <Link className="admin-header__logo" to="/admin">
            PERRY
          </Link>
          <nav className="admin-header__nav">
            <NavLink to="/admin/products" className="admin-header__link">
              Products
            </NavLink>
            <NavLink to="/admin/categories" className="admin-header__link">
              Categories
            </NavLink>
            <NavLink to="/admin/reviews" className="admin-header__link">
              Reviews
            </NavLink>
            <NavLink to="/admin/orders" className="admin-header__link">
              Orders
            </NavLink>
            <NavLink to="/admin/users" className="admin-header__link">
              Users
            </NavLink>
          </nav>
          <div className="admin-header__right">
            <Link className="admin-header__icon-btn" to="/" title="Store">
              <img src="/icons/home.svg" alt="" width={22} height={22} />
            </Link>
            <button
              type="button"
              className="admin-header__icon-btn"
              title="Logout"
              onClick={() => {
                logout();
                navigate("/admin/login");
              }}
            >
              <img src="/icons/account.svg" alt="" width={24} height={24} />
            </button>
          </div>
        </div>
      </header>

      {drawer && (
        <>
          <div className="admin-drawer-backdrop" onClick={close} />
          <aside className="admin-drawer" role="dialog" aria-label="Admin menu">
            <div className="admin-drawer__user">
              <strong>{user?.name || "Administrator"}</strong>
              <span>Administrator</span>
            </div>
            <NavLink to="/admin/products" onClick={close}>
              Products
            </NavLink>
            <NavLink to="/admin/categories" onClick={close}>
              Category
            </NavLink>
            <NavLink to="/admin/reviews" onClick={close}>
              Reviews
            </NavLink>
            <NavLink to="/admin/orders" onClick={close}>
              Orders
            </NavLink>
            <NavLink to="/admin/users" onClick={close}>
              Users
            </NavLink>
            <NavLink to="/admin" end onClick={close}>
              Dashboard
            </NavLink>
            <NavLink to="/" onClick={close}>
              Store
            </NavLink>
            <button
              type="button"
              onClick={() => {
                logout();
                navigate("/admin/login");
              }}
            >
              Logout
            </button>
          </aside>
        </>
      )}

      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}
