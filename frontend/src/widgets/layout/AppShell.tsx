import { useEffect, useState, type FormEvent } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { categoriesApi } from "../../api";
import { resolveMediaUrl } from "../../api/media";
import type { CategoryDto } from "../../api/types";
import { useAuth } from "../../app/AuthContext";
import { useCart } from "../../app/CartContext";
import { useIsMobile } from "../../hooks/useMediaQuery";

const LEGAL_PATHS = new Set(["/privacy", "/terms", "/license"]);

/** Figma sandwich menu category icons (icon-park / material names → local assets). */
function categoryMenuIcon(cat: CategoryDto): string {
  const fromApi = resolveMediaUrl(cat.iconUrl);
  if (fromApi) return fromApi;
  const key = `${cat.slug ?? ""} ${cat.name ?? ""}`.toLowerCase();
  if (key.includes("fashion") || key.includes("women") || key.includes("shirt") || key.includes("dress") || key.includes("tee"))
    return "/icons/admin/hanger.svg";
  if (key.includes("electronic") || key.includes("pc") || key.includes("stream") || key.includes("accessories"))
    return "/icons/admin/electronics.svg";
  if (key.includes("beauty") || key.includes("cosmetic"))
    return "/icons/admin/beauty.svg";
  if (key.includes("sport"))
    return "/icons/admin/sport.svg";
  if (key.includes("home") || key.includes("kitchen") || key.includes("furniture") || key.includes("household"))
    return "/icons/admin/home.svg";
  return "/icons/catalog.svg";
}

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
              <Link to="/admin" className="header-link">
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
          {user ? (
            <div className="mobile-nav__auth" data-figma="2004:5947">
              <div className="mobile-nav__avatar" aria-hidden>
                {user.avatar ? (
                  <img src={resolveMediaUrl(user.avatar) || user.avatar} alt="" />
                ) : (
                  <img src="/icons/account.svg" alt="" width={28} height={28} />
                )}
              </div>
              <div className="mobile-nav__auth-text">
                <div className="mobile-nav__auth-title">{user.name || user.login}</div>
                <div className="mobile-nav__auth-sub">{isAdmin ? "Administrator" : "Customer"}</div>
              </div>
            </div>
          ) : (
            <div className="mobile-nav__auth" data-figma="1860:3778">
              <div className="mobile-nav__avatar mobile-nav__avatar--guest" aria-hidden>
                <img src="/icons/account.svg" alt="" width={28} height={28} />
              </div>
              <div className="mobile-nav__auth-text">
                <div className="mobile-nav__auth-title">Not signed in</div>
                <div className="mobile-nav__auth-sub">Log in to enjoy a more pleasant experience</div>
              </div>
            </div>
          )}

          {!user && (
            <div className="mobile-nav__auth-actions">
              <Link to="/register" className="mobile-nav__btn mobile-nav__btn--primary" onClick={closeMenu}>
                Sign up
              </Link>
              <Link to="/login" className="mobile-nav__btn mobile-nav__btn--secondary" onClick={closeMenu}>
                Log in
              </Link>
            </div>
          )}

          <div className="mobile-nav__divider" />

          <NavLink to="/products" className="mobile-nav__row" onClick={closeMenu}>
            <img src="/icons/catalog.svg" alt="" width={24} height={24} />
            <span>Product catalog</span>
          </NavLink>
          {flatCats.map(({ cat, depth }) => (
            <NavLink
              key={cat.id}
              to={`/products?categoryId=${cat.id}`}
              className="mobile-nav__row"
              onClick={closeMenu}
              style={{ paddingLeft: 12 + depth * 14 }}
            >
              {depth === 0 ? (
                <img src={categoryMenuIcon(cat)} alt="" width={24} height={24} />
              ) : (
                <span className="mobile-nav__row-spacer" aria-hidden />
              )}
              <span>{cat.name}</span>
            </NavLink>
          ))}

          <div className="mobile-nav__divider" />

          <NavLink to="/" className="mobile-nav__row" onClick={closeMenu}>
            <img src="/icons/home.svg" alt="" width={24} height={24} />
            <span>Home</span>
          </NavLink>
          <NavLink to="/cart" className="mobile-nav__row" onClick={closeMenu}>
            <img src="/icons/cart.svg" alt="" width={24} height={24} />
            <span>Cart</span>
          </NavLink>
          {user && (
            <>
              <NavLink to="/account/orders" className="mobile-nav__row" onClick={closeMenu}>
                <img src="/icons/reviews.svg" alt="" width={24} height={24} />
                <span>My orders</span>
              </NavLink>
              <NavLink to="/account/wishlist" className="mobile-nav__row" onClick={closeMenu}>
                <img src="/icons/star.svg" alt="" width={24} height={24} />
                <span>Wishlist</span>
              </NavLink>
              <NavLink to="/account/reviews" className="mobile-nav__row" onClick={closeMenu}>
                <img src="/icons/reviews.svg" alt="" width={24} height={24} />
                <span>My reviews</span>
              </NavLink>
              <NavLink to="/account/settings" className="mobile-nav__row" onClick={closeMenu}>
                <img src="/icons/account.svg" alt="" width={24} height={24} />
                <span>Account settings</span>
              </NavLink>
              {isAdmin && (
                <NavLink to="/admin" className="mobile-nav__row" onClick={closeMenu}>
                  <img src="/icons/admin/pencil.svg" alt="" width={24} height={24} />
                  <span>Admin</span>
                </NavLink>
              )}
              <button
                type="button"
                className="mobile-nav__row mobile-nav__row--button"
                onClick={() => {
                  logout();
                  closeMenu();
                  navigate("/");
                }}
              >
                <img src="/icons/logout.svg" alt="" width={24} height={24} />
                <span>Log out</span>
              </button>
            </>
          )}
          {!isMobile && (
            <button type="button" className="mobile-nav__close" onClick={closeMenu}>
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
  const displayName = user?.name || "Administrator";
  const initial = (displayName.trim()?.[0] || user?.login?.[0] || "A").toUpperCase();
  const avatarSrc = resolveMediaUrl(user?.avatar) || user?.avatar || null;

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
            <NavLink to="/admin" end className="admin-header__link">
              Dashboard
            </NavLink>
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
            <Link
              className="admin-header__icon-btn admin-header__avatar-btn"
              to="/account/settings"
              title="Profile"
            >
              {avatarSrc ? (
                <img className="admin-header__avatar" src={avatarSrc} alt="" />
              ) : (
                <img src="/icons/account.svg" alt="" width={24} height={24} />
              )}
            </Link>
          </div>
        </div>
      </header>

      {drawer && (
        <>
          <div className="admin-drawer-backdrop" onClick={close} />
          <aside className="admin-drawer" role="dialog" aria-label="Admin menu">
            <Link className="admin-drawer__user" to="/account/settings" onClick={close}>
              {avatarSrc ? (
                <img className="admin-drawer__avatar" src={avatarSrc} alt="" />
              ) : (
                <span className="admin-drawer__avatar admin-drawer__avatar--initial" aria-hidden>
                  {initial}
                </span>
              )}
              <span className="admin-drawer__user-text">
                <strong>{displayName}</strong>
                <span>Administrator</span>
              </span>
            </Link>
            <NavLink to="/admin" end onClick={close}>
              Dashboard
            </NavLink>
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
