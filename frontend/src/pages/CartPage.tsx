import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../app/AuthContext";
import { useCart } from "../app/CartContext";

export function CartPage() {
  const { cart, setQty, remove } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!cart) return <div className="empty-state">Loading cart…</div>;

  if (cart.items.length === 0) {
    return (
      <div
        className="page-wrap cart-page"
        data-figma={user ? "2550:12482" : "2550:12483"}
      >
        <h1 className="cart-page__title">Shopping cart</h1>
        <div className="empty-state cart-empty">
          <h2>Your cart is empty</h2>
          <p>Browse the catalog and add something you like.</p>
          <div className="cart-empty__actions">
            <Link className="btn btn-primary" to="/products">
              Go to catalog
            </Link>
            {!user && (
              <Link className="btn btn-outline" to="/login" state={{ from: { pathname: "/cart" } }}>
                Sign in
              </Link>
            )}
          </div>
          {!user && (
            <p className="guest-hint">
              Not logged in — <Link to="/login">Sign in</Link> to keep cart across devices.
            </p>
          )}
        </div>
      </div>
    );
  }

  const itemCount = cart.items.reduce((s, i) => s + i.quantity, 0);

  return (
    <div className="page-wrap cart-page" data-figma="2550:12481">
      <h1 className="cart-page__title">Shopping cart</h1>

      <div className="cart-layout">
        <div className="cart-items">
          {cart.items.map((i) => (
            <article key={i.id} className="cart-row">
              <Link className="cart-row__img" to={`/products/${i.productId}`}>
                {i.imageUrl ? (
                  <img src={i.imageUrl} alt={i.productName} />
                ) : (
                  <div className="img-placeholder" />
                )}
              </Link>
              <div className="cart-row__info">
                <Link to={`/products/${i.productId}`}>{i.productName}</Link>
                <div className="muted">${i.productPrice.toFixed(2)}</div>
                <div className="qty-form">
                  <label>
                    Qty
                    <input
                      type="number"
                      min={1}
                      value={i.quantity}
                      onChange={(e) => void setQty(i.productId, Math.max(1, Number(e.target.value) || 1))}
                    />
                  </label>
                </div>
                <button type="button" className="btn btn-link" onClick={() => void remove(i.productId)}>
                  Remove
                </button>
              </div>
              <div className="cart-row__sum">
                <strong>${i.totalPrice.toFixed(2)}</strong>
              </div>
            </article>
          ))}
        </div>

        <aside className="cart-summary">
          <h2>Order summary</h2>
          <div className="buy-row">
            <span>Items</span>
            <span>{itemCount}</span>
          </div>
          <div className="buy-row cart-total">
            <span>Total</span>
            <strong>${cart.totalAmount.toFixed(2)}</strong>
          </div>

          {user ? (
            <button
              className="btn btn-primary cart-summary__cta"
              type="button"
              onClick={() => navigate("/checkout")}
            >
              Proceed to checkout
            </button>
          ) : (
            <div className="cart-summary__guest">
              <p className="guest-hint">Sign in to place an order.</p>
              <Link
                className="btn btn-primary cart-summary__cta"
                to="/login"
                state={{ from: { pathname: "/checkout" } }}
              >
                Sign in
              </Link>
              <Link className="btn btn-outline cart-summary__cta" to="/register">
                Create account
              </Link>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
