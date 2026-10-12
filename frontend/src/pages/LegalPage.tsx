import { type ReactNode } from "react";
import { NavLink } from "react-router-dom";

const Em = ({ children }: { children: ReactNode }) => (
  <span className="legal-em">{children}</span>
);

const EmLink = ({ href, children }: { href: string; children: ReactNode }) => (
  <a className="legal-em" href={href} target="_blank" rel="noopener noreferrer">
    {children}
  </a>
);

function LegalNav({ active }: { active: "terms" | "license" | "privacy" }) {
  return (
    <aside className="legal-nav">
      <h2 className="legal-nav__title">Legal notice</h2>
      <nav className="legal-nav__list" aria-label="Legal notice">
        <NavLink
          to="/terms"
          className={() => `legal-nav__link${active === "terms" ? " is-active" : ""}`}
        >
          Terms and conditions
        </NavLink>
        <NavLink
          to="/license"
          className={() => `legal-nav__link${active === "license" ? " is-active" : ""}`}
        >
          License agreement
        </NavLink>
        <NavLink
          to="/privacy"
          className={() => `legal-nav__link${active === "privacy" ? " is-active" : ""}`}
        >
          Privacy policy
        </NavLink>
      </nav>
    </aside>
  );
}

function PrivacyBody() {
  return (
    <>
      <p>
        <Em>Perry</Em> is committed to protecting your privacy. This privacy policy explains how{" "}
        <Em>Perry</Em> collects, uses, and discloses your personal information when you visit or make a
        purchase from <EmLink href="https://perrymarket.pp.ua/">https://perrymarket.pp.ua</EmLink> (the
        &quot;<Em>Site</Em>&quot;).
      </p>
      <p>
        By using the <Em>Site</Em>, you agree to the collection and use of information in accordance with
        this policy.
      </p>

      <section className="legal-section">
        <h2>Information collection and use</h2>
        <p>We collect several types of information to provide and improve our services to you.</p>
      </section>

      <section className="legal-section">
        <h2>Types of data collected</h2>
        <ul className="legal-list">
          <li>
            <Em>Personal information</Em>: while using our <Em>Site</Em>, we may ask you to provide us with
            certain personally identifiable information that can be used to contact or identify you.
            Personally identifiable information may include, but is not limited to:
            <ul>
              <li>Name</li>
              <li>Email address</li>
              <li>Phone number</li>
              <li>Address</li>
            </ul>
          </li>
          <li>
            <Em>Payment information</Em>: when you make a purchase, we collect payment details such as{" "}
            <Em>credit card numbers</Em> or other payment information.
          </li>
          <li>
            <Em>Log data</Em>: we collect information that your browser sends whenever you visit our{" "}
            <Em>Site</Em>. This Log Data may include information such as your computer&apos;s{" "}
            <Em>Internet Protocol (&quot;IP&quot;) address</Em>, browser type, browser version, the pages of
            our <Em>Site</Em> that you visit, the time and date of your visit, the time spent on those pages,
            and other statistics.
          </li>
        </ul>
      </section>

      <section className="legal-section">
        <h2>Use of data</h2>
        <p>
          <Em>Perry</Em> <Em>uses</Em> the collected <Em>data</Em> for various purposes:
        </p>
        <ul className="legal-list">
          <li>
            To provide and maintain the <Em>Site</Em>
          </li>
          <li>
            To notify you about changes to our <Em>Site</Em>
          </li>
          <li>
            To allow you to participate in interactive features of our <Em>Site</Em> when you choose to do so
          </li>
          <li>To provide customer support</li>
          <li>
            To gather analysis or valuable information so that we can improve our <Em>Site</Em>
          </li>
          <li>
            To monitor the usage of the <Em>Site</Em>
          </li>
          <li>To detect, prevent, and address technical issues</li>
          <li>
            To provide you with news, special offers, and general information about other goods, services, and
            events which we offer unless you have opted not to receive such information
          </li>
        </ul>
      </section>

      <section className="legal-section">
        <h2>Disclosure of data</h2>
        <p>
          <Em>Perry</Em> may <Em>disclose</Em> your <Em>personal information</Em> in the good faith belief that
          such action is necessary to:
        </p>
        <ul className="legal-list">
          <li>Comply with a legal obligation</li>
          <li>
            Protect and defend the rights or property of <Em>Perry</Em>
          </li>
          <li>
            Prevent or investigate possible wrongdoing in connection with the <Em>Site</Em>
          </li>
          <li>
            Protect the personal safety of users of the <Em>Site</Em> or the public
          </li>
          <li>Protect against legal liability</li>
        </ul>
      </section>

      <section className="legal-section">
        <h2>Security of data</h2>
        <p>
          The <Em>security of</Em> your <Em>data</Em> is important to us but remember that no method of
          transmission over the Internet or method of electronic storage is <Em>100% secure</Em>. While we
          strive to use commercially acceptable means to protect your <Em>personal information</Em>, we cannot
          guarantee its absolute <Em>security</Em>.
        </p>
      </section>

      <section className="legal-section">
        <h2>Your data protection rights</h2>
        <p>
          Depending on your location, you may have the following rights regarding your{" "}
          <Em>personal information</Em>:
        </p>
        <ul className="legal-list">
          <li>
            <Em>The right to access</Em>: you have the right to request copies of your personal information.
          </li>
          <li>
            <Em>The right to rectification</Em>: you have the right to request that we correct any information
            you believe is inaccurate or complete information you believe is incomplete.
          </li>
          <li>
            <Em>The right to erasure</Em>: you have the right to request that we erase your personal
            information, under certain conditions.
          </li>
          <li>
            <Em>The right to restrict processing</Em>: you have the right to request that we restrict the
            processing of your personal information, under certain conditions.
          </li>
          <li>
            <Em>The right to object to processing</Em>: you have the right to object to our processing of your
            personal information, under certain conditions.
          </li>
          <li>
            <Em>The right to data portability</Em>: you have the right to request that we transfer the data
            that we have collected to another organization, or directly to you, under certain conditions.
          </li>
        </ul>
      </section>

      <section className="legal-section">
        <h2>Changes to this privacy policy</h2>
        <p>
          This privacy policy is effective as of May 7, 2024, and will remain in effect except with respect to
          any changes in its provisions in the future, which will be in effect immediately after being posted
          on this page.
        </p>
        <p>
          We reserve the right to update or change our privacy policy at any time, and you should check this
          privacy policy periodically. Your continued use of the service after we post any modifications to
          the privacy policy on this page will constitute your acknowledgment of the modifications and your
          consent to abide and be bound by the modified privacy policy.
        </p>
        <p>
          If we make any material changes to this privacy policy, we will notify you either through the email
          address you have provided us or by placing a prominent notice on our website.
        </p>
      </section>
    </>
  );
}

function TermsBody() {
  return (
    <>
      <p>
        Welcome to <Em>Perry</Em>! These terms and conditions (&quot;<Em>Agreement</Em>&quot;) govern your use
        of the services and products provided on the website located at{" "}
        <EmLink href="https://perrymarket.pp.ua/">https://perrymarket.pp.ua</EmLink> (the &quot;<Em>Site</Em>
        &quot;). By accessing or using the <Em>Site</Em>, you agree to be bound by the terms and conditions of
        this <Em>Agreement</Em>. If you do not agree to these terms, please do not use the <Em>Site</Em>.
      </p>

      <section className="legal-section">
        <h2>Use of the site</h2>
        <ul className="legal-list">
          <li>
            <Em>Eligibility</Em>: by using the <Em>Site</Em>, you represent and warrant that you are at{" "}
            <Em>least 18 years old</Em> and have the legal capacity to enter into this <Em>Agreement</Em>.
          </li>
          <li>
            <Em>Account registration</Em>: to access certain features of the <Em>Site</Em>, you may be
            required to register for an account. You agree to provide accurate, current, and complete
            information during the registration process and to update such information to keep it accurate,
            current, and complete. You are responsible for maintaining the confidentiality of your account
            password and for all activities that occur under your account.
          </li>
          <li>
            <Em>Prohibited activities</Em>: you agree not to:
            <ul>
              <li>Violate any applicable laws or regulations.</li>
              <li>Engage in fraudulent or deceptive practices.</li>
              <li>Infringe on the intellectual property rights of others.</li>
              <li>Upload or transmit viruses or other harmful code.</li>
              <li>
                Engage in any activity that could damage, disable, or overburden the <Em>Site</Em>.
              </li>
            </ul>
          </li>
        </ul>
      </section>

      <section className="legal-section">
        <h2>Marketplace transactions</h2>
        <ul className="legal-list">
          <li>
            <Em>Seller obligations</Em>: sellers must comply with our seller terms and conditions, which
            include providing accurate descriptions of products, fulfilling orders promptly, and adhering to
            all applicable laws and regulations.
          </li>
          <li>
            <Em>Buyer obligations</Em>: buyers must ensure that their payment information is accurate and
            up-to-date and that they comply with all payment obligations for purchases made through the{" "}
            <Em>Site</Em>.
          </li>
          <li>
            <Em>Payment processing</Em>: all payments are processed through our secure payment gateway. By
            submitting your payment information, you authorize us to charge the applicable fees for your
            purchases.
          </li>
          <li>
            <Em>Order fulfillment</Em>: sellers are responsible for fulfilling orders in a timely manner.{" "}
            <Em>Perry</Em> is not liable for any issues related to order fulfillment, including delays or
            non-delivery.
          </li>
          <li>
            <Em>Returns and refunds</Em>: our returns and refunds policy outlines the conditions under which
            returns and refunds may be granted. Buyers should review this policy before making a purchase.
          </li>
        </ul>
      </section>

      <section className="legal-section">
        <h2>Intellectual property</h2>
        <ul className="legal-list">
          <li>
            <Em>Ownership</Em>: all content on the <Em>Site</Em>, including but not limited to text,
            graphics, logos, images, and software, is the property of <Em>Perry</Em> or its content suppliers
            and is protected by <Em>international copyright</Em> and <Em>trademark laws</Em>.
          </li>
          <li>
            <Em>License to use</Em>: <Em>Perry</Em> grants you a limited, non-exclusive, non-transferable, and
            revocable license to access and use the <Em>Site</Em> for your personal or internal business use,
            subject to the terms and conditions of this <Em>Agreement</Em>.
          </li>
          <li>
            <Em>User contributions</Em>: if you post, upload, or otherwise provide any content to the{" "}
            <Em>Site</Em> (&quot;<Em>User Contributions</Em>&quot;), you grant <Em>Perry</Em> a worldwide,
            non-exclusive, royalty-free, perpetual, and irrevocable right to use, reproduce, modify, adapt,
            publish, translate, distribute, perform, and display such content in any media.
          </li>
        </ul>
      </section>

      <section className="legal-section">
        <h2>Prohibited conduct</h2>
        <ul className="legal-list">
          <li>
            <Em>Misuse of the platform</Em>: you agree not to misuse <Em>Perry’s platform</Em> by engaging in
            activities such as hacking, fraud, or distribution of illegal products.
          </li>
          <li>
            <Em>Respectful communication</Em>: you agree to communicate respectfully with other users and not
            engage in harassment, threats, or abuse.
          </li>
          <li>
            <Em>Accurate information</Em>: you agree to provide accurate and truthful information in your
            interactions on the platform.
          </li>
        </ul>
      </section>

      <section className="legal-section">
        <h2>Content guidelines</h2>
        <ul className="legal-list">
          <li>
            <Em>Product listings</Em>: sellers must ensure that all product listings are accurate and not
            misleading. False advertising is strictly prohibited.
          </li>
          <li>
            <Em>Reviews and feedback</Em>: users are encouraged to leave honest and constructive feedback.
            Manipulating reviews or feedback is prohibited.
          </li>
        </ul>
      </section>

      <section className="legal-section">
        <h2>Service modifications</h2>
        <p>
          <Em>Perry</Em> reserves the right to modify, suspend, or discontinue any aspect of the <Em>Site</Em>{" "}
          at any time, including the availability of any feature, database, or content. We may also impose
          limits on certain features and services or restrict your access to parts or all of the <Em>Site</Em>{" "}
          without notice or liability.
        </p>
      </section>

      <section className="legal-section">
        <h2>Governing law</h2>
        <p>
          This <Em>Agreement</Em> shall be governed by and construed in accordance with the laws of the State
          of California, without regard to its conflict of law provisions. Any legal action or proceeding
          arising under this <Em>Agreement</Em> will be brought exclusively in the federal or state courts
          located in Los Angeles, California, and the parties hereby irrevocably consent to the personal
          jurisdiction and venue therein.
        </p>
      </section>

      <section className="legal-section">
        <h2>Severability</h2>
        <p>
          If any provision of this <Em>Agreement</Em> is found to be invalid or unenforceable by a court of
          competent jurisdiction, the remaining provisions will continue to be in full force and effect.
        </p>
      </section>

      <section className="legal-section">
        <h2>Waiver</h2>
        <p>
          The failure of <Em>Perry</Em> to enforce any right or provision of this <Em>Agreement</Em> will not
          be deemed a waiver of such right or provision.
        </p>
      </section>
    </>
  );
}

function LicenseBody() {
  return (
    <>
      <p>
        This license agreement (&quot;<Em>Agreement</Em>&quot;) governs your use of the services and products
        provided on the website located at{" "}
        <EmLink href="https://perrymarket.pp.ua/">https://perrymarket.pp.ua</EmLink> (the &quot;<Em>Site</Em>
        &quot;). By accessing or using the <Em>Site</Em>, you agree to adhere to the terms and conditions
        outlined in this <Em>Agreement</Em>, which are designed to ensure a safe, lawful, and beneficial use
        of our services. This includes, but is not limited to, compliance with intellectual property laws,
        user contribution guidelines, and any other policies or rules that may be applicable to the{" "}
        <Em>Site</Em>.
      </p>

      <section className="legal-section">
        <h2>License grant</h2>
        <p>
          <Em>Perry</Em> grants you a limited, non-exclusive, non-transferable, and revocable license to
          access and use the <Em>Site</Em> and its services for your personal or internal business use,
          subject to the terms and conditions of this <Em>Agreement</Em>.
        </p>
      </section>

      <section className="legal-section">
        <h2>Marketplace services</h2>
        <ul className="legal-list">
          <li>
            <Em>Buyer accounts</Em>: buyers must create an account to purchase products, ensuring all provided
            information is accurate and up-to-date.
          </li>
          <li>
            <Em>Transactions</Em>: all transactions between buyers and sellers are facilitated through the{" "}
            <Em>Site</Em>. <Em>Perry</Em> may charge transaction fees as outlined in our fee schedule.
          </li>
          <li>
            <Em>Product listings</Em>: sellers are responsible for the accuracy of product listings, including
            descriptions, pricing, and availability. Listings must not contain misleading or false
            information.
          </li>
        </ul>
      </section>

      <section className="legal-section">
        <h2>Restrictions</h2>
        <p>You agree not to:</p>
        <ul className="legal-list">
          <li>
            Modify, copy, distribute, or create derivative works based on the <Em>Site</Em> or its content.
          </li>
          <li>
            Use the <Em>Site</Em> for any unlawful purpose or in any manner that could damage, disable,
            overburden, or impair the <Em>Site</Em>.
          </li>
          <li>
            Access or attempt to access any systems or servers on which the <Em>Site</Em> is hosted or modify
            or alter the <Em>Site</Em> in any way.
          </li>
          <li>
            Use any automated means to access the <Em>Site</Em> for any purpose without our express written
            permission.
          </li>
          <li>
            Engage in any fraudulent activities, including creating multiple accounts to manipulate the
            marketplace.
          </li>
        </ul>
      </section>

      <section className="legal-section">
        <h2>Intellectual property</h2>
        <p>
          All content on the <Em>Site</Em>, including but not limited to text, graphics, logos, images, and
          software, is the property of <Em>Perry</Em> or its content suppliers and is protected by{" "}
          <Em>international copyright</Em> and <Em>trademark laws</Em>. Unauthorized use of any content may
          violate <Em>copyright</Em>, <Em>trademark</Em>, and <Em>other laws</Em>.
        </p>
      </section>

      <section className="legal-section">
        <h2>User contributions</h2>
        <p>
          If you post, upload, or otherwise provide any content to the <Em>Site</Em> (&quot;
          <Em>User Contributions</Em>&quot;), you grant <Em>Perry</Em> a worldwide, non-exclusive,
          royalty-free, perpetual, and irrevocable right to use, reproduce, modify, adapt, publish, translate,
          distribute, perform, and display such content in any media. You represent and warrant that you own
          or have the necessary rights to make your <Em>User Contributions</Em> available and that your{" "}
          <Em>User Contributions</Em> do not infringe any third-party rights.
        </p>
      </section>

      <section className="legal-section">
        <h2>Dispute resolution</h2>
        <ul className="legal-list">
          <li>
            <Em>Between buyers and sellers</Em>: any disputes arising between buyers and sellers must be
            resolved between the parties involved. <Em>Perry</Em> is not responsible for mediating such
            disputes but may offer assistance at our discretion.
          </li>
          <li>
            <Em>With Perry</Em>: any disputes arising out of or in connection with your use of the{" "}
            <Em>Site</Em> or this <Em>Agreement</Em> shall be resolved through binding arbitration in
            accordance with the rules of the American Arbitration Association.
          </li>
        </ul>
      </section>

      <section className="legal-section">
        <h2>Termination</h2>
        <p>
          <Em>Perry</Em> may terminate or suspend your license to use the <Em>Site</Em> and its services at
          any time, without prior notice or liability, for any reason, including if you breach this{" "}
          <Em>Agreement</Em>. Upon termination, your right to use the <Em>Site</Em> will immediately cease.
        </p>
      </section>

      <section className="legal-section">
        <h2>Disclaimer of warranties</h2>
        <p>
          The <Em>Site</Em> and its <Em>services</Em> are provided on an &quot;as is&quot; and &quot;as
          available&quot; basis. <Em>Perry</Em> makes no warranties, express or implied, regarding the{" "}
          <Em>Site</Em> or its content, including but not limited to <Em>warranties</Em> of merchantability,
          fitness for a particular purpose, non-infringement, or availability.
        </p>
      </section>

      <section className="legal-section">
        <h2>Limitation of liability</h2>
        <p>
          In no event shall <Em>Perry</Em>, its directors, employees, or affiliates, be <Em>liable</Em> for
          any indirect, incidental, special, consequential, or punitive damages, including but{" "}
          <Em>not limited</Em> to loss of profits, data, use, or other intangible losses, resulting from:
        </p>
        <ul className="legal-list">
          <li>
            Your use or inability to use the <Em>Site</Em>.
          </li>
          <li>Any unauthorized access to or alteration of your transmissions or data.</li>
          <li>
            Any content or conduct of any third party on the <Em>Site</Em>.
          </li>
          <li>
            Any other matter related to the <Em>Site</Em>.
          </li>
        </ul>
      </section>

      <section className="legal-section">
        <h2>Indemnification</h2>
        <p>
          You agree to indemnify, defend, and hold harmless <Em>Perry</Em>, its officers, directors,
          employees, and affiliates from and against any claims, liabilities, damages, losses, and expenses,
          including reasonable attorneys&apos; fees, arising out of or in any way connected with your access to
          or use of the <Em>Site</Em>, your <Em>User Contributions</Em>, or your breach of this{" "}
          <Em>Agreement</Em>.
        </p>
      </section>

      <section className="legal-section">
        <h2>Changes to this agreement</h2>
        <p>
          <Em>Perry</Em> reserves the right to modify or replace this <Em>Agreement</Em> at any time. If a
          revision is material, we will provide at least <Em>30 days&apos; notice</Em> prior to any new terms
          taking effect. Your continued use of the <Em>Site</Em> after any such changes constitutes your
          acceptance of the new terms.
        </p>
      </section>

      <section className="legal-section">
        <h2>Governing law</h2>
        <p>
          This <Em>Agreement</Em> shall be governed by and construed in accordance with the laws of the State
          of California, without regard to its conflict of <Em>law provisions</Em>. Any legal action or
          proceeding arising under this <Em>Agreement</Em> will be brought exclusively in the federal or state
          courts located in Los Angeles, California, and the parties hereby irrevocably consent to the
          personal jurisdiction and venue therein.
        </p>
      </section>
    </>
  );
}

const meta = {
  privacy: { title: "Privacy policy", body: PrivacyBody },
  terms: { title: "Terms and conditions", body: TermsBody },
  license: { title: "License agreement", body: LicenseBody },
} as const;

export function LegalPage({ kind }: { kind: keyof typeof meta }) {
  const page = meta[kind];
  const Body = page.body;

  return (
    <div
      className="legal-page"
      data-figma={
        kind === "terms" ? "3565:2906" : kind === "privacy" ? "3540:2754" : "3558:2294"
      }
    >
      <LegalNav active={kind} />
      <article className="legal-content">
        <h1 className="legal-content__title">{page.title}</h1>
        <p className="legal-content__updated">Last updated: May 7, 2024</p>
        <hr className="legal-content__rule" />
        <div className="legal-content__body">
          <Body />
        </div>
      </article>
    </div>
  );
}
