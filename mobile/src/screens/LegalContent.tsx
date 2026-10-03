import { type ReactNode } from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";

const SITE = "https://perrymarket.pp.ua/";

function Em({ children }: { children: ReactNode }) {
  return <Text style={styles.em}>{children}</Text>;
}

function EmLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Text style={styles.em} onPress={() => void Linking.openURL(href)}>
      {children}
    </Text>
  );
}

function P({ children }: { children: ReactNode }) {
  return <Text style={styles.p}>{children}</Text>;
}

function H2({ children }: { children: ReactNode }) {
  return <Text style={styles.h2}>{children}</Text>;
}

function Li({ children }: { children: ReactNode }) {
  return (
    <View style={styles.li}>
      <Text style={styles.bullet}>•</Text>
      <Text style={styles.liText}>{children}</Text>
    </View>
  );
}

function NestedLi({ children }: { children: ReactNode }) {
  return (
    <View style={[styles.li, styles.liNested]}>
      <Text style={styles.bullet}>–</Text>
      <Text style={styles.liText}>{children}</Text>
    </View>
  );
}

export function PrivacyBody() {
  return (
    <View>
      <P>
        <Em>Perry</Em> is committed to protecting your privacy. This privacy policy explains how{" "}
        <Em>Perry</Em> collects, uses, and discloses your personal information when you visit or make a
        purchase from <EmLink href={SITE}>{SITE}</EmLink> (the &quot;<Em>Site</Em>&quot;).
      </P>
      <P>
        By using the <Em>Site</Em>, you agree to the collection and use of information in accordance with
        this policy.
      </P>

      <H2>Information collection and use</H2>
      <P>We collect several types of information to provide and improve our services to you.</P>

      <H2>Types of data collected</H2>
      <Li>
        <Em>Personal information</Em>: while using our <Em>Site</Em>, we may ask you to provide us with
        certain personally identifiable information that can be used to contact or identify you.
        Personally identifiable information may include, but is not limited to:
      </Li>
      <NestedLi>Name</NestedLi>
      <NestedLi>Email address</NestedLi>
      <NestedLi>Phone number</NestedLi>
      <NestedLi>Address</NestedLi>
      <Li>
        <Em>Payment information</Em>: when you make a purchase, we collect payment details such as{" "}
        <Em>credit card numbers</Em> or other payment information.
      </Li>
      <Li>
        <Em>Log data</Em>: we collect information that your browser sends whenever you visit our{" "}
        <Em>Site</Em>. This Log Data may include information such as your computer&apos;s{" "}
        <Em>Internet Protocol (&quot;IP&quot;) address</Em>, browser type, browser version, the pages of
        our <Em>Site</Em> that you visit, the time and date of your visit, the time spent on those pages,
        and other statistics.
      </Li>

      <H2>Use of data</H2>
      <P>
        <Em>Perry</Em> <Em>uses</Em> the collected <Em>data</Em> for various purposes:
      </P>
      <Li>To provide and maintain the <Em>Site</Em></Li>
      <Li>To notify you about changes to our <Em>Site</Em></Li>
      <Li>
        To allow you to participate in interactive features of our <Em>Site</Em> when you choose to do so
      </Li>
      <Li>To provide customer support</Li>
      <Li>
        To gather analysis or valuable information so that we can improve our <Em>Site</Em>
      </Li>
      <Li>To monitor the usage of the <Em>Site</Em></Li>
      <Li>To detect, prevent, and address technical issues</Li>
      <Li>
        To provide you with news, special offers, and general information about other goods, services, and
        events which we offer unless you have opted not to receive such information
      </Li>

      <H2>Disclosure of data</H2>
      <P>
        <Em>Perry</Em> may <Em>disclose</Em> your <Em>personal information</Em> in the good faith belief that
        such action is necessary to:
      </P>
      <Li>Comply with a legal obligation</Li>
      <Li>Protect and defend the rights or property of <Em>Perry</Em></Li>
      <Li>Prevent or investigate possible wrongdoing in connection with the <Em>Site</Em></Li>
      <Li>Protect the personal safety of users of the <Em>Site</Em> or the public</Li>
      <Li>Protect against legal liability</Li>

      <H2>Security of data</H2>
      <P>
        The <Em>security of</Em> your <Em>data</Em> is important to us but remember that no method of
        transmission over the Internet or method of electronic storage is <Em>100% secure</Em>. While we
        strive to use commercially acceptable means to protect your <Em>personal information</Em>, we cannot
        guarantee its absolute <Em>security</Em>.
      </P>

      <H2>Your data protection rights</H2>
      <P>
        Depending on your location, you may have the following rights regarding your{" "}
        <Em>personal information</Em>:
      </P>
      <Li>
        <Em>The right to access</Em>: you have the right to request copies of your personal information.
      </Li>
      <Li>
        <Em>The right to rectification</Em>: you have the right to request that we correct any information
        you believe is inaccurate or complete information you believe is incomplete.
      </Li>
      <Li>
        <Em>The right to erasure</Em>: you have the right to request that we erase your personal
        information, under certain conditions.
      </Li>
      <Li>
        <Em>The right to restrict processing</Em>: you have the right to request that we restrict the
        processing of your personal information, under certain conditions.
      </Li>
      <Li>
        <Em>The right to object to processing</Em>: you have the right to object to our processing of your
        personal information, under certain conditions.
      </Li>
      <Li>
        <Em>The right to data portability</Em>: you have the right to request that we transfer the data
        that we have collected to another organization, or directly to you, under certain conditions.
      </Li>

      <H2>Changes to this privacy policy</H2>
      <P>
        This privacy policy is effective as of May 7, 2024, and will remain in effect except with respect to
        any changes in its provisions in the future, which will be in effect immediately after being posted
        on this page.
      </P>
      <P>
        We reserve the right to update or change our privacy policy at any time, and you should check this
        privacy policy periodically. Your continued use of the service after we post any modifications to
        the privacy policy on this page will constitute your acknowledgment of the modifications and your
        consent to abide and be bound by the modified privacy policy.
      </P>
      <P>
        If we make any material changes to this privacy policy, we will notify you either through the email
        address you have provided us or by placing a prominent notice on our website.
      </P>
    </View>
  );
}

export function TermsBody() {
  return (
    <View>
      <P>
        Welcome to <Em>Perry</Em>! These terms and conditions (&quot;<Em>Agreement</Em>&quot;) govern your use
        of the services and products provided on the website located at{" "}
        <EmLink href={SITE}>{SITE}</EmLink> (the &quot;<Em>Site</Em>&quot;). By accessing or using the{" "}
        <Em>Site</Em>, you agree to be bound by the terms and conditions of this <Em>Agreement</Em>. If you
        do not agree to these terms, please do not use the <Em>Site</Em>.
      </P>

      <H2>Use of the site</H2>
      <Li>
        <Em>Eligibility</Em>: by using the <Em>Site</Em>, you represent and warrant that you are at{" "}
        <Em>least 18 years old</Em> and have the legal capacity to enter into this <Em>Agreement</Em>.
      </Li>
      <Li>
        <Em>Account registration</Em>: to access certain features of the <Em>Site</Em>, you may be
        required to register for an account. You agree to provide accurate, current, and complete
        information during the registration process and to update such information to keep it accurate,
        current, and complete. You are responsible for maintaining the confidentiality of your account
        password and for all activities that occur under your account.
      </Li>
      <Li>
        <Em>Prohibited activities</Em>: you agree not to:
      </Li>
      <NestedLi>Violate any applicable laws or regulations.</NestedLi>
      <NestedLi>Engage in fraudulent or deceptive practices.</NestedLi>
      <NestedLi>Infringe on the intellectual property rights of others.</NestedLi>
      <NestedLi>Upload or transmit viruses or other harmful code.</NestedLi>
      <NestedLi>
        Engage in any activity that could damage, disable, or overburden the <Em>Site</Em>.
      </NestedLi>

      <H2>Marketplace transactions</H2>
      <Li>
        <Em>Seller obligations</Em>: sellers must comply with our seller terms and conditions, which
        include providing accurate descriptions of products, fulfilling orders promptly, and adhering to
        all applicable laws and regulations.
      </Li>
      <Li>
        <Em>Buyer obligations</Em>: buyers must ensure that their payment information is accurate and
        up-to-date and that they comply with all payment obligations for purchases made through the{" "}
        <Em>Site</Em>.
      </Li>
      <Li>
        <Em>Payment processing</Em>: all payments are processed through our secure payment gateway. By
        submitting your payment information, you authorize us to charge the applicable fees for your
        purchases.
      </Li>
      <Li>
        <Em>Order fulfillment</Em>: sellers are responsible for fulfilling orders in a timely manner.{" "}
        <Em>Perry</Em> is not liable for any issues related to order fulfillment, including delays or
        non-delivery.
      </Li>
      <Li>
        <Em>Returns and refunds</Em>: our returns and refunds policy outlines the conditions under which
        returns and refunds may be granted. Buyers should review this policy before making a purchase.
      </Li>

      <H2>Intellectual property</H2>
      <Li>
        <Em>Ownership</Em>: all content on the <Em>Site</Em>, including but not limited to text,
        graphics, logos, images, and software, is the property of <Em>Perry</Em> or its content suppliers
        and is protected by <Em>international copyright</Em> and <Em>trademark laws</Em>.
      </Li>
      <Li>
        <Em>License to use</Em>: <Em>Perry</Em> grants you a limited, non-exclusive, non-transferable, and
        revocable license to access and use the <Em>Site</Em> for your personal or internal business use,
        subject to the terms and conditions of this <Em>Agreement</Em>.
      </Li>
      <Li>
        <Em>User contributions</Em>: if you post, upload, or otherwise provide any content to the{" "}
        <Em>Site</Em> (&quot;<Em>User Contributions</Em>&quot;), you grant <Em>Perry</Em> a worldwide,
        non-exclusive, royalty-free, perpetual, and irrevocable right to use, reproduce, modify, adapt,
        publish, translate, distribute, perform, and display such content in any media.
      </Li>

      <H2>Prohibited conduct</H2>
      <Li>
        <Em>Misuse of the platform</Em>: you agree not to misuse <Em>Perry&apos;s platform</Em> by engaging in
        activities such as hacking, fraud, or distribution of illegal products.
      </Li>
      <Li>
        <Em>Respectful communication</Em>: you agree to communicate respectfully with other users and not
        engage in harassment, threats, or abuse.
      </Li>
      <Li>
        <Em>Accurate information</Em>: you agree to provide accurate and truthful information in your
        interactions on the platform.
      </Li>

      <H2>Content guidelines</H2>
      <Li>
        <Em>Product listings</Em>: sellers must ensure that all product listings are accurate and not
        misleading. False advertising is strictly prohibited.
      </Li>
      <Li>
        <Em>Reviews and feedback</Em>: users are encouraged to leave honest and constructive feedback.
        Manipulating reviews or feedback is prohibited.
      </Li>

      <H2>Service modifications</H2>
      <P>
        <Em>Perry</Em> reserves the right to modify, suspend, or discontinue any aspect of the <Em>Site</Em>{" "}
        at any time, including the availability of any feature, database, or content. We may also impose
        limits on certain features and services or restrict your access to parts or all of the <Em>Site</Em>{" "}
        without notice or liability.
      </P>

      <H2>Governing law</H2>
      <P>
        This <Em>Agreement</Em> shall be governed by and construed in accordance with the laws of the State
        of California, without regard to its conflict of law provisions. Any legal action or proceeding
        arising under this <Em>Agreement</Em> will be brought exclusively in the federal or state courts
        located in Los Angeles, California, and the parties hereby irrevocably consent to the personal
        jurisdiction and venue therein.
      </P>

      <H2>Severability</H2>
      <P>
        If any provision of this <Em>Agreement</Em> is found to be invalid or unenforceable by a court of
        competent jurisdiction, the remaining provisions will continue to be in full force and effect.
      </P>

      <H2>Waiver</H2>
      <P>
        The failure of <Em>Perry</Em> to enforce any right or provision of this <Em>Agreement</Em> will not
        be deemed a waiver of such right or provision.
      </P>
    </View>
  );
}

export function LicenseBody() {
  return (
    <View>
      <P>
        This license agreement (&quot;<Em>Agreement</Em>&quot;) governs your use of the services and products
        provided on the website located at <EmLink href={SITE}>{SITE}</EmLink> (the &quot;<Em>Site</Em>
        &quot;). By accessing or using the <Em>Site</Em>, you agree to adhere to the terms and conditions
        outlined in this <Em>Agreement</Em>, which are designed to ensure a safe, lawful, and beneficial use
        of our services. This includes, but is not limited to, compliance with intellectual property laws,
        user contribution guidelines, and any other policies or rules that may be applicable to the{" "}
        <Em>Site</Em>.
      </P>

      <H2>License grant</H2>
      <P>
        <Em>Perry</Em> grants you a limited, non-exclusive, non-transferable, and revocable license to
        access and use the <Em>Site</Em> and its services for your personal or internal business use,
        subject to the terms and conditions of this <Em>Agreement</Em>.
      </P>

      <H2>Marketplace services</H2>
      <Li>
        <Em>Buyer accounts</Em>: buyers must create an account to purchase products, ensuring all provided
        information is accurate and up-to-date.
      </Li>
      <Li>
        <Em>Transactions</Em>: all transactions between buyers and sellers are facilitated through the{" "}
        <Em>Site</Em>. <Em>Perry</Em> may charge transaction fees as outlined in our fee schedule.
      </Li>
      <Li>
        <Em>Product listings</Em>: sellers are responsible for the accuracy of product listings, including
        descriptions, pricing, and availability. Listings must not contain misleading or false
        information.
      </Li>

      <H2>Restrictions</H2>
      <P>You agree not to:</P>
      <Li>
        Modify, copy, distribute, or create derivative works based on the <Em>Site</Em> or its content.
      </Li>
      <Li>
        Use the <Em>Site</Em> for any unlawful purpose or in any manner that could damage, disable,
        overburden, or impair the <Em>Site</Em>.
      </Li>
      <Li>
        Access or attempt to access any systems or servers on which the <Em>Site</Em> is hosted or modify
        or alter the <Em>Site</Em> in any way.
      </Li>
      <Li>
        Use any automated means to access the <Em>Site</Em> for any purpose without our express written
        permission.
      </Li>
      <Li>
        Engage in any fraudulent activities, including creating multiple accounts to manipulate the
        marketplace.
      </Li>

      <H2>Intellectual property</H2>
      <P>
        All content on the <Em>Site</Em>, including but not limited to text, graphics, logos, images, and
        software, is the property of <Em>Perry</Em> or its content suppliers and is protected by{" "}
        <Em>international copyright</Em> and <Em>trademark laws</Em>. Unauthorized use of any content may
        violate <Em>copyright</Em>, <Em>trademark</Em>, and <Em>other laws</Em>.
      </P>

      <H2>User contributions</H2>
      <P>
        If you post, upload, or otherwise provide any content to the <Em>Site</Em> (&quot;
        <Em>User Contributions</Em>&quot;), you grant <Em>Perry</Em> a worldwide, non-exclusive,
        royalty-free, perpetual, and irrevocable right to use, reproduce, modify, adapt, publish, translate,
        distribute, perform, and display such content in any media. You represent and warrant that you own
        or have the necessary rights to make your <Em>User Contributions</Em> available and that your{" "}
        <Em>User Contributions</Em> do not infringe any third-party rights.
      </P>

      <H2>Dispute resolution</H2>
      <Li>
        <Em>Between buyers and sellers</Em>: any disputes arising between buyers and sellers must be
        resolved between the parties involved. <Em>Perry</Em> is not responsible for mediating such
        disputes but may offer assistance at our discretion.
      </Li>
      <Li>
        <Em>With Perry</Em>: any disputes arising out of or in connection with your use of the{" "}
        <Em>Site</Em> or this <Em>Agreement</Em> shall be resolved through binding arbitration in
        accordance with the rules of the American Arbitration Association.
      </Li>

      <H2>Termination</H2>
      <P>
        <Em>Perry</Em> may terminate or suspend your license to use the <Em>Site</Em> and its services at
        any time, without prior notice or liability, for any reason, including if you breach this{" "}
        <Em>Agreement</Em>. Upon termination, your right to use the <Em>Site</Em> will immediately cease.
      </P>

      <H2>Disclaimer of warranties</H2>
      <P>
        The <Em>Site</Em> and its <Em>services</Em> are provided on an &quot;as is&quot; and &quot;as
        available&quot; basis. <Em>Perry</Em> makes no warranties, express or implied, regarding the{" "}
        <Em>Site</Em> or its content, including but not limited to <Em>warranties</Em> of merchantability,
        fitness for a particular purpose, non-infringement, or availability.
      </P>

      <H2>Limitation of liability</H2>
      <P>
        In no event shall <Em>Perry</Em>, its directors, employees, or affiliates, be <Em>liable</Em> for
        any indirect, incidental, special, consequential, or punitive damages, including but{" "}
        <Em>not limited</Em> to loss of profits, data, use, or other intangible losses, resulting from:
      </P>
      <Li>Your use or inability to use the <Em>Site</Em>.</Li>
      <Li>Any unauthorized access to or alteration of your transmissions or data.</Li>
      <Li>Any content or conduct of any third party on the <Em>Site</Em>.</Li>
      <Li>Any other matter related to the <Em>Site</Em>.</Li>

      <H2>Indemnification</H2>
      <P>
        You agree to indemnify, defend, and hold harmless <Em>Perry</Em>, its officers, directors,
        employees, and affiliates from and against any claims, liabilities, damages, losses, and expenses,
        including reasonable attorneys&apos; fees, arising out of or in any way connected with your access to
        or use of the <Em>Site</Em>, your <Em>User Contributions</Em>, or your breach of this{" "}
        <Em>Agreement</Em>.
      </P>

      <H2>Changes to this agreement</H2>
      <P>
        <Em>Perry</Em> reserves the right to modify or replace this <Em>Agreement</Em> at any time. If a
        revision is material, we will provide at least <Em>30 days&apos; notice</Em> prior to any new terms
        taking effect. Your continued use of the <Em>Site</Em> after any such changes constitutes your
        acceptance of the new terms.
      </P>

      <H2>Governing law</H2>
      <P>
        This <Em>Agreement</Em> shall be governed by and construed in accordance with the laws of the State
        of California, without regard to its conflict of <Em>law provisions</Em>. Any legal action or
        proceeding arising under this <Em>Agreement</Em> will be brought exclusively in the federal or state
        courts located in Los Angeles, California, and the parties hereby irrevocably consent to the
        personal jurisdiction and venue therein.
      </P>
    </View>
  );
}

export function ContactBody({
  onNavigate,
}: {
  onNavigate?: (route: "FAQ" | "Orders" | "Terms") => void;
}) {
  return (
    <View>
      <P>
        Questions about orders, delivery, or your Perry account? Reach our support team — we usually
        reply within one business day.
      </P>
      <H2>Email</H2>
      <P>
        <EmLink href="mailto:support@perry.demo">support@perry.demo</EmLink>
      </P>
      <H2>Hours</H2>
      <P>Mon–Fri, 09:00–18:00 (UTC+3)</P>
      <H2>Useful links</H2>
      <Pressable onPress={() => onNavigate?.("FAQ")}>
        <Text style={styles.linkRow}>FAQ</Text>
      </Pressable>
      <Pressable onPress={() => onNavigate?.("Orders")}>
        <Text style={styles.linkRow}>My orders</Text>
      </Pressable>
      <Pressable onPress={() => onNavigate?.("Terms")}>
        <Text style={styles.linkRow}>Terms and conditions</Text>
      </Pressable>
    </View>
  );
}

export function FaqBody({
  onNavigate,
}: {
  onNavigate?: (route: "Orders" | "Terms" | "Contact" | "ForgotPassword") => void;
}) {
  return (
    <View>
      <P>Quick answers about shopping on Perry.</P>

      <H2>How do I track my order?</H2>
      <P>
        Open{" "}
        <Text style={styles.inlineLink} onPress={() => onNavigate?.("Orders")}>
          My orders
        </Text>{" "}
        — status and details update after checkout.
      </P>

      <H2>What payment methods are available?</H2>
      <P>Cash on delivery and card (demo). You choose the method on the Checkout page.</P>

      <H2>How do returns work?</H2>
      <P>
        Unused items in original packaging can usually be returned within 14 days. See{" "}
        <Text style={styles.inlineLink} onPress={() => onNavigate?.("Terms")}>
          Terms and conditions
        </Text>{" "}
        for full rules.
      </P>

      <H2>I forgot my password</H2>
      <P>
        Use{" "}
        <Text style={styles.inlineLink} onPress={() => onNavigate?.("ForgotPassword")}>
          Forgot password
        </Text>{" "}
        to request a reset link.
      </P>

      <P>
        Still need help?{" "}
        <Text style={styles.inlineLink} onPress={() => onNavigate?.("Contact")}>
          Contact us
        </Text>
      </P>
    </View>
  );
}

const styles = StyleSheet.create({
  p: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.darkText,
    marginBottom: 12,
  },
  h2: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.darkText,
    marginTop: 18,
    marginBottom: 8,
  },
  em: {
    fontWeight: "700",
    color: colors.darkText,
  },
  li: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
    paddingRight: 4,
  },
  liNested: {
    paddingLeft: 18,
  },
  bullet: {
    color: colors.darkText,
    fontSize: 14,
    lineHeight: 22,
    width: 12,
  },
  liText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 22,
    color: colors.darkText,
  },
  linkRow: {
    fontSize: 14,
    lineHeight: 24,
    color: colors.secondary,
    fontWeight: "700",
    marginBottom: 6,
  },
  inlineLink: {
    color: colors.secondary,
    fontWeight: "700",
  },
});
