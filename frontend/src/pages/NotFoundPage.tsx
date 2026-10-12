import { Link } from "react-router-dom";

/**
 * Error 404 — в стиле витрины Perry (Mulish, --ink / --header / --accent).
 * Рендерится внутри AppShell → тот же header/footer, что на остальных страницах.
 */
export function NotFoundPage() {
  return (
    <div className="page-wrap not-found" data-figma="2548:8399">
      <nav className="breadcrumbs breadcrumbs--pdp" aria-label="Breadcrumb">
        <Link className="breadcrumbs__home" to="/" aria-label="Home">
          <img src="/icons/home.svg" alt="" width={16} height={16} />
        </Link>
        <span className="breadcrumbs__sep">/</span>
        <span>Page not found</span>
      </nav>

      <div className="not-found__panel">
        <p className="not-found__code" aria-hidden="true">
          404
        </p>
        <h1 className="not-found__title">Page not found</h1>
        <p className="not-found__text">
          The page you are looking for doesn’t exist or was moved. Check the address or go back to
          the storefront.
        </p>
        <div className="not-found__actions">
          <Link className="btn btn-primary" to="/">
            Go to home
          </Link>
          <Link className="btn btn-outline" to="/products">
            Browse catalog
          </Link>
        </div>
      </div>
    </div>
  );
}
