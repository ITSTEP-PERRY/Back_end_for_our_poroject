import { type FormEvent, type ReactNode, useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { ordersApi } from "../api";
import { useAuth } from "../app/AuthContext";
import { useCart } from "../app/CartContext";
import { UKRAINE_CITIES_BY_STATE, UKRAINE_STATES } from "../data/ukraineCheckoutLocales";
import { loadShippingAddress, saveShippingAddress } from "../data/shippingAddress";
import { loadSavedCard, saveSavedCard } from "../data/savedCard";

const REQUIRED = "This field is necessary to continue!";

/** Demo card — accepted by checkout, no real charge. */
const DEMO_CARD = "4111111111111111";

const COUNTRIES = ["United States", "Canada", "United Kingdom", "Germany", "Poland", "Ukraine"] as const;

/** Region / state options per country. */
const STATES: Record<string, string[]> = {
  "United States": ["California", "New York", "Texas", "Florida", "Washington"],
  Canada: ["Ontario", "Quebec", "British Columbia"],
  "United Kingdom": ["England", "Scotland", "Wales"],
  Germany: ["Bavaria", "Berlin", "Hamburg"],
  Poland: ["Mazovia", "Lesser Poland", "Silesia"],
  Ukraine: [...UKRAINE_STATES],
};

/** Cities by country — shown as soon as a country is selected. */
const CITIES_BY_COUNTRY: Record<string, string[]> = {
  "United States": [
    "Los Angeles",
    "San Francisco",
    "San Diego",
    "San Jose",
    "Sacramento",
    "New York",
    "Buffalo",
    "Albany",
    "Rochester",
    "Austin",
    "Houston",
    "Dallas",
    "San Antonio",
    "Miami",
    "Orlando",
    "Tampa",
    "Jacksonville",
    "Seattle",
    "Spokane",
    "Tacoma",
    "Chicago",
    "Boston",
    "Philadelphia",
    "Phoenix",
    "Denver",
    "Atlanta",
    "Las Vegas",
    "Portland",
  ],
  Canada: [
    "Toronto",
    "Ottawa",
    "Mississauga",
    "Hamilton",
    "Montreal",
    "Quebec City",
    "Laval",
    "Vancouver",
    "Victoria",
    "Surrey",
    "Calgary",
    "Edmonton",
    "Winnipeg",
    "Halifax",
  ],
  "United Kingdom": [
    "London",
    "Manchester",
    "Birmingham",
    "Liverpool",
    "Leeds",
    "Bristol",
    "Edinburgh",
    "Glasgow",
    "Aberdeen",
    "Cardiff",
    "Swansea",
    "Belfast",
    "Nottingham",
    "Sheffield",
  ],
  Germany: [
    "Berlin",
    "Hamburg",
    "Munich",
    "Cologne",
    "Frankfurt",
    "Stuttgart",
    "Düsseldorf",
    "Dortmund",
    "Essen",
    "Leipzig",
    "Bremen",
    "Dresden",
    "Hanover",
    "Nuremberg",
  ],
  Poland: [
    "Warsaw",
    "Kraków",
    "Łódź",
    "Wrocław",
    "Poznań",
    "Gdańsk",
    "Szczecin",
    "Bydgoszcz",
    "Lublin",
    "Katowice",
    "Białystok",
    "Gdynia",
    "Częstochowa",
    "Radom",
  ],
  Ukraine: [
    "Kyiv",
    "Kharkiv",
    "Odesa",
    "Dnipro",
    "Donetsk",
    "Zaporizhzhia",
    "Lviv",
    "Kryvyi Rih",
    "Mykolaiv",
    "Mariupol",
    "Luhansk",
    "Vinnytsia",
    "Makiivka",
    "Simferopol",
    "Sevastopol",
    "Kherson",
    "Poltava",
    "Chernihiv",
    "Cherkasy",
    "Sumy",
    "Zhytomyr",
    "Horlivka",
    "Rivne",
    "Kropyvnytskyi",
    "Kamianske",
    "Ternopil",
    "Kremenchuk",
    "Lutsk",
    "Ivano-Frankivsk",
    "Bila Tserkva",
    "Kramatorsk",
    "Melitopol",
    "Kerch",
    "Nikopol",
    "Sloviansk",
    "Uzhhorod",
    "Berdiansk",
    "Alchevsk",
    "Pavlohrad",
    "Sievierodonetsk",
    "Yevpatoriia",
    "Kamianets-Podilskyi",
    "Brovary",
    "Mukachevo",
    "Konotop",
    "Uman",
    "Kolomyia",
    "Chervonohrad",
    "Drohobych",
    "Stryi",
  ],
};

/** Optional filter: cities belonging to a region (subset of country list). */
const CITIES_BY_STATE: Record<string, string[]> = {
  California: ["Los Angeles", "San Francisco", "San Diego", "San Jose", "Sacramento"],
  "New York": ["New York", "Buffalo", "Albany", "Rochester"],
  Texas: ["Austin", "Houston", "Dallas", "San Antonio"],
  Florida: ["Miami", "Orlando", "Tampa", "Jacksonville"],
  Washington: ["Seattle", "Spokane", "Tacoma"],
  Ontario: ["Toronto", "Ottawa", "Mississauga", "Hamilton"],
  Quebec: ["Montreal", "Quebec City", "Laval"],
  "British Columbia": ["Vancouver", "Victoria", "Surrey"],
  England: ["London", "Manchester", "Birmingham", "Liverpool", "Leeds", "Bristol"],
  Scotland: ["Edinburgh", "Glasgow", "Aberdeen"],
  Wales: ["Cardiff", "Swansea"],
  Bavaria: ["Munich", "Nuremberg"],
  Berlin: ["Berlin"],
  Hamburg: ["Hamburg"],
  Mazovia: ["Warsaw", "Radom"],
  "Lesser Poland": ["Kraków"],
  Silesia: ["Katowice", "Częstochowa"],
  ...UKRAINE_CITIES_BY_STATE,
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

function citiesFor(country: string, state: string): string[] {
  // Область выбрана → только города этой области.
  if (!state) {
    if ((STATES[country] ?? []).length > 0) return [];
    return CITIES_BY_COUNTRY[country] ?? [];
  }
  if (country === "Ukraine") return UKRAINE_CITIES_BY_STATE[state] ?? [];
  return CITIES_BY_STATE[state] ?? [];
}

function luhnOk(digits: string): boolean {
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = Number(digits[i]);
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

function formatCardNumber(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
}

function formatExp(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

function expNotPast(exp: string): boolean {
  const m = /^(\d{2})\/(\d{2})$/.exec(exp.trim());
  if (!m) return false;
  const month = Number(m[1]);
  const year = 2000 + Number(m[2]);
  if (month < 1 || month > 12) return false;
  const now = new Date();
  const end = new Date(year, month, 0, 23, 59, 59);
  return end >= now;
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
  const userKey = user?.id || user?.email || null;
  const saved = useMemo(() => loadShippingAddress(), []);

  const [firstName, setFirstName] = useState(saved?.firstName || nameParts.first);
  const [lastName, setLastName] = useState(saved?.lastName || nameParts.last);
  const [email, setEmail] = useState(user?.email || "");
  const [country, setCountry] = useState(saved?.country || "Ukraine");
  const [state, setState] = useState(saved?.state || "");
  const [city, setCity] = useState(saved?.city || "");
  const [postcode, setPostcode] = useState(saved?.postcode || "");
  const [payment, setPayment] = useState<"Cash" | "Card">("Card");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExp, setCardExp] = useState("");
  // CVV/CVC никогда не сохраняем — между сессиями всегда пусто.
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

  // Подтянуть номер/срок после логина / новой сессии; CVV всегда сбрасываем.
  useEffect(() => {
    if (!userKey) return;
    const card = loadSavedCard(userKey);
    if (card?.cardNumber) setCardNumber(card.cardNumber);
    if (card?.cardExp) setCardExp(card.cardExp);
    setCardCvv("");
  }, [userKey]);

  // Адрес запоминается — не сбрасывается при каждом заходе на checkout.
  useEffect(() => {
    saveShippingAddress({
      country,
      state,
      city,
      postcode,
      firstName,
      lastName,
    });
  }, [country, state, city, postcode, firstName, lastName]);

  // Номер и срок — в localStorage между сессиями; CVV не пишем.
  useEffect(() => {
    if (!userKey) return;
    if (!cardNumber && !cardExp) return;
    saveSavedCard({ cardNumber, cardExp }, userKey);
  }, [cardNumber, cardExp, userKey]);

  const stateOptions = STATES[country] ?? [];
  const cityOptions = useMemo(() => citiesFor(country, state), [country, state]);

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
      if (!luhnOk(digits)) next.cardNumber = "Incorrect card number";
      if (!/^\d{2}\/\d{2}$/.test(cardExp.trim()) || !expNotPast(cardExp))
        next.cardExp = "Incorrect date";
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
      saveShippingAddress({
        country,
        state,
        city,
        postcode: postcode.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });
      const order = await ordersApi.checkout(sessionId, {
        recipientName,
        shippingAddress,
        paymentType: payment,
      });
      saveSavedCard({ cardNumber, cardExp }, userKey);
      setCardCvv("");
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
                    setErrors((prev) => {
                      const { country: _c, state: _s, city: _ci, ...rest } = prev;
                      return rest;
                    });
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
                    const nextState = e.target.value;
                    setState(nextState);
                    setCity("");
                    setErrors((prev) => {
                      const { state: _s, city: _ci, ...rest } = prev;
                      return rest;
                    });
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
                <select
                  value={city}
                  disabled={!state || cityOptions.length === 0}
                  onChange={(e) => {
                    setCity(e.target.value);
                    setErrors((prev) => {
                      const { city: _ci, ...rest } = prev;
                      return rest;
                    });
                  }}
                >
                  <option value="">{!state ? "Select state first" : "Select city"}</option>
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
            <p className="checkout-pay__hint">
              Demo checkout — no real charge. Card: use{" "}
              <button
                type="button"
                className="checkout-pay__fill"
                onClick={() => {
                  setPayment("Card");
                  setCardNumber(formatCardNumber(DEMO_CARD));
                  setCardExp("12/30");
                  setCardCvv("123");
                }}
              >
                4111 1111 1111 1111
              </button>
              , any future expiry, any 3-digit CVV.
            </p>
          </section>

          {payment === "Card" && (
            <>
              <hr className="checkout-rule" />
              <section className="checkout-section">
                <h2>Card details</h2>
                <Field label="Card number" error={errors.cardNumber}>
                  <input
                    value={cardNumber}
                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                    placeholder="0000 0000 0000 0000"
                    inputMode="numeric"
                    autoComplete="cc-number"
                  />
                </Field>
                <div className="checkout-row">
                  <Field label="Date of expiration" error={errors.cardExp}>
                    <input
                      value={cardExp}
                      onChange={(e) => setCardExp(formatExp(e.target.value))}
                      placeholder="MM/YY"
                      autoComplete="cc-exp"
                    />
                  </Field>
                  <Field label="CVV/CVC" error={errors.cardCvv}>
                    <input
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                      placeholder="***"
                      inputMode="numeric"
                      autoComplete="off"
                      name="card-cvc-not-saved"
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
