import { Link } from "react-router-dom";

export function ContactPage() {
  return (
    <div className="page-wrap support-page" data-figma="support">
      <h1>Contact us</h1>
      <p className="support-page__lead">
        Questions about orders, delivery, or your Perry account? Reach our support team — we usually
        reply within one business day.
      </p>
      <div className="support-card">
        <h2>Email</h2>
        <p>
          <a href="mailto:support@perry.demo">support@perry.demo</a>
        </p>
        <h2>Hours</h2>
        <p>Mon–Fri, 09:00–18:00 (UTC+3)</p>
        <h2>Useful links</h2>
        <ul>
          <li>
            <Link to="/faq">FAQ</Link>
          </li>
          <li>
            <Link to="/account/orders">My orders</Link>
          </li>
          <li>
            <Link to="/terms">Terms and conditions</Link>
          </li>
        </ul>
      </div>
    </div>
  );
}

export function FaqPage() {
  return (
    <div className="page-wrap support-page" data-figma="faq">
      <h1>FAQ</h1>
      <p className="support-page__lead">Quick answers about shopping on Perry.</p>

      <div className="support-card">
        <details open>
          <summary>How do I track my order?</summary>
          <p>
            Open <Link to="/account/orders">My orders</Link> — status and details update after checkout.
          </p>
        </details>
        <details>
          <summary>What payment methods are available?</summary>
          <p>
            Cash on delivery and card (demo). You choose the method on the{" "}
            <Link to="/checkout">Checkout</Link> page.
          </p>
        </details>
        <details>
          <summary>How do returns work?</summary>
          <p>
            Unused items in original packaging can usually be returned within 14 days. See{" "}
            <Link to="/terms">Terms and conditions</Link> for full rules.
          </p>
        </details>
        <details>
          <summary>I forgot my password</summary>
          <p>
            Use <Link to="/forgot-password">Forgot password</Link> to request a reset link.
          </p>
        </details>
      </div>

      <p className="support-page__more">
        Still need help? <Link to="/contact">Contact us</Link>
      </p>
    </div>
  );
}
