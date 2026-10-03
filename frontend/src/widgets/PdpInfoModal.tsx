import { useEffect, type ReactNode } from "react";

export type PdpInfoKind = "delivery" | "payment" | "security" | "returns" | "seller";

export const PDP_INFO_ORDER: PdpInfoKind[] = [
  "delivery",
  "payment",
  "security",
  "returns",
  "seller",
];

type Props = {
  kind: PdpInfoKind;
  onClose: () => void;
  onChange: (kind: PdpInfoKind) => void;
};

type PaymentCard = { title: string; body: string; learnMore?: boolean };

const PAYMENT_CARDS: PaymentCard[] = [
  {
    title: "Credit card",
    body: "Save your card in your Perry account to pay faster and more conveniently. After saving your card, you don't have to login to the bank, enter codes or enter data for subsequent purchases.",
    learnMore: true,
  },
  {
    title: "Google Pay",
    body: "Do you have a device with an Android operating system? In this case, use Google Pay without providing payment data. This is simple and convenient, and importantly — your card data is not stored on the device and not transferred during the transaction.",
  },
  {
    title: "Apple Pay",
    body: "If you are a user of an iOS device, Apple Pay is built-in. This does not require downloading any separate application. In addition, payment with Apple Pay is also possible in the Safari browser.",
  },
  {
    title: "PayPal",
    body: "PayPal is a global payment method that allows you to pay anywhere in the world without revealing your financial data. Simply top up your PayPal or use your credit or debit card. You can also pay by card once without having to log in.",
  },
  {
    title: "Pay on delivery",
    body: "If you choose the shipping method, you can choose the payment on receipt. This means that you will pay the goods by cash or payment card to the courier who will deliver the parcel to you or at the point of receipt.",
  },
];

export const PDP_INFO: Record<
  PdpInfoKind,
  { title: string; intro?: string; body: ReactNode }
> = {
  delivery: {
    title: "Delivery",
    intro: "We deliver to most addresses. Choose a method at checkout — estimated times below.",
    body: (
      <div className="pdp-drawer__cards">
        <article className="pdp-drawer__card">
          <h3>Standard</h3>
          <p>3–7 business days. Tracking appears in My orders after the parcel is handed to the carrier.</p>
        </article>
        <article className="pdp-drawer__card">
          <h3>Express</h3>
          <p>1–3 business days. Extra fee is calculated at checkout when available for your address.</p>
        </article>
        <article className="pdp-drawer__card">
          <h3>Pickup</h3>
          <p>Ready at partner points when marked on the order. You will get a pickup code by email.</p>
        </article>
      </div>
    ),
  },
  payment: {
    title: "Payment methods",
    intro:
      "On Perry you can pay for your purchases in various ways. At checkout you will see a list of methods available for your purchase.",
    body: (
      <div className="pdp-drawer__cards">
        {PAYMENT_CARDS.map((card) => (
          <article key={card.title} className="pdp-drawer__card">
            <h3>{card.title}</h3>
            <p>{card.body}</p>
            {card.learnMore && (
              <button type="button" className="pdp-drawer__learn">
                Learn more <span aria-hidden="true">›</span>
              </button>
            )}
          </article>
        ))}
      </div>
    ),
  },
  security: {
    title: "Security",
    intro: "You buy safely in Perry. Here you will learn about your rights after purchase.",
    body: (
      <div className="pdp-drawer__cards">
        <article className="pdp-drawer__card">
          <h3>Complaint</h3>
          <p>Seller is responsible for defective goods within 1 year from the moment of delivery.</p>
          <div className="pdp-drawer__meta">
            <span>Complaint deadline</span>
            <strong>1 year</strong>
          </div>
          <p className="muted">
            Applies to complaints about the guarantee or non-conformity of the goods to the contract.
          </p>
        </article>
        <article className="pdp-drawer__card">
          <h3>Guarantee</h3>
          <p>Will apply to the seller&apos;s goods for 1 month from the date of purchase.</p>
          <div className="pdp-drawer__meta">
            <span>Guarantee deadline</span>
            <strong>1 month</strong>
          </div>
        </article>
      </div>
    ),
  },
  returns: {
    title: "Returns",
    intro: "You may return unused items in original packaging within 14 days of delivery.",
    body: (
      <div className="pdp-drawer__cards">
        <article className="pdp-drawer__card">
          <h3>How to return</h3>
          <p>
            Open the order in My orders → Details for cancellation tips on early statuses. Refunds go
            back to the original payment method after inspection.
          </p>
        </article>
        <article className="pdp-drawer__card">
          <h3>Exceptions</h3>
          <p>Personalized or sealed hygiene goods may be non-returnable. Full rules: Terms and conditions.</p>
        </article>
      </div>
    ),
  },
  seller: {
    title: "About seller",
    intro: "Perry Marketplace — verified storefront for this catalogue.",
    body: (
      <div className="pdp-drawer__cards">
        <article className="pdp-drawer__card">
          <h3>Perry Marketplace</h3>
          <p>
            Ships from partner warehouses. Customer support via the Support links in the footer.
            Ratings on product pages reflect buyer reviews after purchase.
          </p>
        </article>
      </div>
    ),
  },
};

/** Right-side info drawer on PDP — Figma Product Page overlays. */
export function PdpInfoModal({ kind, onClose, onChange }: Props) {
  const info = PDP_INFO[kind];
  const index = PDP_INFO_ORDER.indexOf(kind);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") {
        const prev = PDP_INFO_ORDER[(index - 1 + PDP_INFO_ORDER.length) % PDP_INFO_ORDER.length];
        onChange(prev);
      }
      if (e.key === "ArrowRight") {
        const next = PDP_INFO_ORDER[(index + 1) % PDP_INFO_ORDER.length];
        onChange(next);
      }
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [index, onChange, onClose]);

  const go = (dir: -1 | 1) => {
    const next = PDP_INFO_ORDER[(index + dir + PDP_INFO_ORDER.length) % PDP_INFO_ORDER.length];
    onChange(next);
  };

  return (
    <div className="pdp-drawer-backdrop" role="presentation" onClick={onClose}>
      <aside
        className="pdp-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pdp-drawer-title"
        data-figma="4561:26780"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="pdp-drawer__head">
          <h2 id="pdp-drawer-title">{info.title}</h2>
          <div className="pdp-drawer__controls">
            <button type="button" className="pdp-drawer__nav" aria-label="Previous" onClick={() => go(-1)}>
              ‹
            </button>
            <button type="button" className="pdp-drawer__nav" aria-label="Next" onClick={() => go(1)}>
              ›
            </button>
            <button type="button" className="pdp-drawer__close" aria-label="Close" onClick={onClose}>
              ×
            </button>
          </div>
        </header>
        <div className="pdp-drawer__body">
          {info.intro && <p className="pdp-drawer__intro">{info.intro}</p>}
          {info.body}
        </div>
      </aside>
    </div>
  );
}
