import { type FormEvent, type ReactNode, useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { ordersApi } from "../api";
import { useAuth } from "../app/AuthContext";
import { useCart } from "../app/CartContext";

const REQUIRED = "This field is necessary to continue!";

const COUNTRIES = ["United States", "Canada", "United Kingdom", "Germany", "Poland", "Ukraine"];
const STATES: Record<string, string[]> = {
  "United States": ["California", "New York", "Texas", "Florida", "Washington"],
  Canada: ["Ontario", "Quebec", "British Columbia"],
  "United Kingdom": ["England", "Scotland", "Wales"],
  Germany: ["Bavaria", "Berlin", "Hamburg"],
  Poland: ["Mazovia", "Lesser Poland", "Silesia"],
  Ukraine: ["Kyiv", "Lviv", "Odesa", "Kharkiv"],
};
const CITIES: Record<string, string[]> = {
  California: ["Los Angeles", "San Francisco", "San Diego"],
  "New York": ["New York", "Buffalo", "Albany"],
  Texas: ["Austin", "Houston", "Dallas"],
  Florida: ["Miami", "Orlando", "Tampa"],
  Washington: ["Seattle", "Spokane"],
  Ontario: ["Toronto", "Ottawa"],
  Quebec: ["Montreal", "Quebec City"],
  "British Columbia": ["Vancouver", "Victoria"],
  England: ["London", "Manchester"],
  Scotland: ["Edinburgh", "Glasgow"],
  Wales: ["Cardiff"],
  Bavaria: ["Munich"],
  Berlin: ["Berlin"],
  Hamburg: ["Hamburg"],
  Mazovia: ["Warsaw"],
  "Lesser Poland": ["Kraków"],
  Silesia: ["Katowice"],
  Kyiv: ["Kyiv"],
  Lviv: ["Lviv"],
  Odesa: ["Odesa"],
  Kharkiv: ["Kharkiv"],
};

type FieldErrors = Partial<
  Record<
    | "firstName"
    | "lastName"
    | "email"
    | "country"
    | "state"
    | "city"
    | "postcode"
    | "cardNumber"
    | "cardExp"
    | "cardCvv",
    string
  >
>;

function splitName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first: "", last: "" };
  if (parts.length === 1) return { first: parts[0], last: "" };
  return { first: parts[0], last: parts.slice(1).join(" ") };
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className={`co-field${error ? " co-field--error" : ""}`}>
      <span className="co-field__label">{label}</span>
      {children}
      {error && <em className="co-field__error">{error}</em>}
    </label>
  );
}

export function CheckoutPage() {
  const { user, loading } = useAuth();
  const { cart, sessionId, refresh } = useCart();
  const navigate = useNavigate();
  const nameParts = splitName(user?.name || "");

  const [firstName, setFirstName] = useState(nameParts.first);
  const [lastName, setLastName] = useState(nameParts.last);
  const [email, setEmail] = useState(user?.email || "");
  const [country, setCountry] = useState("United States");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [postcode, setPostcode] = useState("");
  const [payment, setPayment] = useState<"Cash" | "Card">("Card");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExp, setCardExp] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const parts = splitName(user.name || "");
    setFirstName((v) => v || parts.first);
    setLastName((v) => v || parts.last);
    setEmail((v) => v || user.email || "");
  }, [user]);

  const stateOptions = STATES[country] ?? [];
  const cityOptions = CITIES[state] ?? [];

  const items = cart?.items ?? [];
  const total = cart?.totalAmount ?? 0;

  const canShow = useMemo(() => !loading && !!user, [loading, user]);

  if (loading || !cart) return <div className="empty-state">Loading…</div>;
  if (!user) return <Navigate to="/login" replace state={{ from: { pathname: "/checkout" } }} />;
  if (items.length === 0) return <Navigate to="/cart" replace />;

  const validate = (): FieldErrors => {
    const next: FieldErrors = {};
    if (!firstName.trim()) next.firstName = REQUIRED;
    if (!lastName.trim()) next.lastName = REQUIRED;
    if (!email.trim()) next.email = REQUIRED;
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = "Incorrect email";
    if (!country) next.country = REQUIRED;
    if (!state) next.state = REQUIRED;
    if (!city) next.city = REQUIRED;
    if (!postcode.trim()) next.postcode = REQUIRED;
    if (payment === "Card") {
      const digits = cardNumber.replace(/\D/g, "");
      if (digits.length < 16) next.cardNumber = "Incorrect card number";
      if (!/^\d{2}\/\d{2}$/.test(cardExp.trim())) next.cardExp = "Incorrect date";
      if (!/^\d{3,4}$/.test(cardCvv.trim())) next.cardCvv = "Incorrect code";
    }
    return next;
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const next = validate();
    setErrors(next);
    setFormError(null);
    if (Object.keys(next).length) return;

    setBusy(true);
    try {
      const recipientName = `${firstName.trim()} ${lastName.trim()}`.trim();
      const shippingAddress = [city, state, postcode.trim(), country].filter(Boolean).join(", ");
      const order = await ordersApi.checkout(sessionId, {
        recipientName,
        shippingAddress,
        paymentType: payment,
      });
      await refresh();
      navigate(`/account/orders?open=${encodeURIComponent(order.id)}`);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Checkout failed");
    } finally {
      setBusy(false);
    }
  };

  if (!canShow) return null;

  return (
    <div className="checkout-page" data-figma="4577:28174">
      <header className="checkout-page__top">
        <Link className="checkout-page__logo" to="/">
          PERRY
        </Link>
        <h1>Checkout</h1>
      </header>

      <form className="checkout-layout" onSubmit={(e) => void onSubmit(e)} noValidate>
        <div className="checkout-form">
          {formError && <div className="alert alert-error">{formError}</div>}

          <section className="checkout-section">
            <h2>Recipient information</h2>
            <div className="checkout-row">
              <Field label="First name" error={errors.firstName}>
                <input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Enter your first name"
                  autoComplete="given-name"
                />
              </Field>
              <Field label="Last name" error={errors.lastName}>
                <input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Enter your last name"
                  autoComplete="family-name"
                />
              </Field>
            </div>
            <Field label="Email" error={errors.email}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                autoComplete="email"
              />
            </Field>
          </section>

          <hr className="checkout-rule" />

          <section className="checkout-section">
            <h2>Delivery address</h2>
            <div className="checkout-row">
              <Field label="Country" error={errors.country}>
                <select
                  value={country}
                  onChange={(e) => {
                    setCountry(e.target.value);
                    setState("");
                    setCity("");
                  }}
                >
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="State" error={errors.state}>
                <select
                  value={state}
                  onChange={(e) => {
                    setState(e.target.value);
                    setCity("");
                  }}
                >
                  <option value="">Select state</option>
                  {stateOptions.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <div className="checkout-row">
              <Field label="City" error={errors.city}>
                <select value={city} onChange={(e) => setCity(e.target.value)}>
                  <option value="">Select city</option>
                  {cityOptions.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Postcode" error={errors.postcode}>
                <input
                  value={postcode}
                  onChange={(e) => setPostcode(e.target.value)}
                  placeholder="Enter postcode"
                  autoComplete="postal-code"
                />
              </Field>
            </div>
          </section>

          <hr className="checkout-rule" />

          <section className="checkout-section">
            <h2>Payment method</h2>
            <div className="checkout-pay">
              <button
                type="button"
                className={`checkout-pay__btn${payment === "Cash" ? " is-active" : ""}`}
                onClick={() => setPayment("Cash")}
              >
                Cash
              </button>
              <button
                type="button"
                className={`checkout-pay__btn${payment === "Card" ? " is-active is-primary" : ""}`}
                onClick={() => setPayment("Card")}
              >
                {payment === "Card" && <span className="checkout-pay__check">✓</span>}
                Card
              </button>
            </div>
          </section>

          {payment === "Card" && (
            <>
              <hr className="checkout-rule" />
              <section className="checkout-section">
                <h2>Card details</h2>
                <Field label="Card number" error={errors.cardNumber}>
                  <input
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="0000-0000-0000-0000"
                    inputMode="numeric"
                    autoComplete="cc-number"
                  />
                </Field>
                <div className="checkout-row">
                  <Field label="Date of expiration" error={errors.cardExp}>
                    <input
                      value={cardExp}
                      onChange={(e) => setCardExp(e.target.value)}
                      placeholder="01/01"
                      autoComplete="cc-exp"
                    />
                  </Field>
                  <Field label="CVV/CVC" error={errors.cardCvv}>
                    <input
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value)}
                      placeholder="***"
                      inputMode="numeric"
                      autoComplete="cc-csc"
                    />
                  </Field>
                </div>
              </section>
            </>
          )}
        </div>

        <aside className="checkout-summary">
          <h2>Summary</h2>
          <ul className="checkout-summary__list">
            {items.map((i) => (
              <li key={i.id}>
                <span className="checkout-summary__name">{i.productName}</span>
                <span className="checkout-summary__qty">
                  {i.quantity} x $ {i.productPrice.toFixed(2)}
                </span>
                <strong>$ {i.totalPrice.toFixed(2)}</strong>
              </li>
            ))}
          </ul>
          <div className="checkout-summary__total">
            <span>Total:</span>
            <strong>$ {total.toFixed(2)}</strong>
          </div>
          <button type="submit" className="checkout-summary__place" disabled={busy}>
            {busy ? "Placing…" : "Place order"}
          </button>
          <Link className="checkout-summary__cancel" to="/cart">
            Cancel
          </Link>
          <p className="checkout-summary__terms">
            By clicking &apos;Place order&apos;, you agree with{" "}
            <Link to="/terms">PERRY Terms and Conditions</Link>
          </p>
        </aside>
      </form>
    </div>
  );
}
