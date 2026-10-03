import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { ordersApi } from "../api";
import { SiteFooter } from "../components/SiteFooter";
import { useAuth } from "../auth/AuthContext";
import { useCart } from "../cart/CartContext";
import { colors, radii, space } from "../theme/colors";
import { navigateShop } from "../navigation/navigationRef";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "Checkout">;

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

type FieldKey =
  | "firstName"
  | "lastName"
  | "email"
  | "country"
  | "state"
  | "city"
  | "postcode"
  | "cardNumber"
  | "cardExp"
  | "cardCvv";

function splitName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first: "", last: "" };
  if (parts.length === 1) return { first: parts[0], last: "" };
  return { first: parts[0], last: parts.slice(1).join(" ") };
}

/**
 * Checkout по web `CheckoutPage` / Figma `4577:28174` — узкий mobile layout + тот же API.
 */
export function CheckoutScreen({}: Props) {
  const { user } = useAuth();
  const { sessionId, cart, refresh } = useCart();
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
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [picker, setPicker] = useState<"country" | "state" | "city" | null>(null);

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

  const pickerOptions = useMemo(() => {
    if (picker === "country") return COUNTRIES;
    if (picker === "state") return stateOptions;
    if (picker === "city") return cityOptions;
    return [];
  }, [picker, stateOptions, cityOptions]);

  if (!user) {
    return (
      <View style={styles.center}>
        <Text style={styles.pageTitle}>Please log in</Text>
        <Pressable style={styles.btnPrimary} onPress={() => navigateShop("Login")}>
          <Text style={styles.btnPrimaryText}>Log in</Text>
        </Pressable>
      </View>
    );
  }

  if (!items.length) {
    return (
      <View style={styles.center}>
        <Text style={styles.pageTitle}>Your cart is empty</Text>
        <Pressable style={styles.btnPrimary} onPress={() => navigateShop("Cart")}>
          <Text style={styles.btnPrimaryText}>Back to cart</Text>
        </Pressable>
      </View>
    );
  }

  const validate = () => {
    const next: Partial<Record<FieldKey, string>> = {};
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

  const onSubmit = async () => {
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
      Alert.alert("Order placed", `Order ${order.orderNumber || order.id}`, [
        { text: "My orders", onPress: () => navigateShop("Orders") },
      ]);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Checkout failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.logo}>PERRY</Text>
        <Text style={styles.pageTitle}>Checkout</Text>

        {formError ? <Text style={styles.formError}>{formError}</Text> : null}

        <Text style={styles.sectionH}>Recipient information</Text>
        <Field label="First name" error={errors.firstName}>
          <TextInput
            style={styles.input}
            value={firstName}
            onChangeText={setFirstName}
            placeholder="Enter your first name"
            placeholderTextColor={colors.muted}
          />
        </Field>
        <Field label="Last name" error={errors.lastName}>
          <TextInput
            style={styles.input}
            value={lastName}
            onChangeText={setLastName}
            placeholder="Enter your last name"
            placeholderTextColor={colors.muted}
          />
        </Field>
        <Field label="Email" error={errors.email}>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="Enter your email"
            placeholderTextColor={colors.muted}
          />
        </Field>

        <View style={styles.rule} />

        <Text style={styles.sectionH}>Delivery address</Text>
        <Field label="Country" error={errors.country}>
          <SelectValue
            value={country}
            placeholder="Select country"
            onPress={() => setPicker("country")}
          />
        </Field>
        <Field label="State" error={errors.state}>
          <SelectValue
            value={state}
            placeholder="Select state"
            onPress={() => setPicker("state")}
          />
        </Field>
        <Field label="City" error={errors.city}>
          <SelectValue
            value={city}
            placeholder="Select city"
            onPress={() => setPicker("city")}
          />
        </Field>
        <Field label="Postcode" error={errors.postcode}>
          <TextInput
            style={styles.input}
            value={postcode}
            onChangeText={setPostcode}
            placeholder="Enter postcode"
            placeholderTextColor={colors.muted}
          />
        </Field>

        <View style={styles.rule} />

        <Text style={styles.sectionH}>Payment</Text>
        <View style={styles.payRow}>
          <PayChip label="Card" active={payment === "Card"} onPress={() => setPayment("Card")} />
          <PayChip label="Cash" active={payment === "Cash"} onPress={() => setPayment("Cash")} />
        </View>
        {payment === "Card" ? (
          <>
            <Field label="Card number" error={errors.cardNumber}>
              <TextInput
                style={styles.input}
                value={cardNumber}
                onChangeText={setCardNumber}
                keyboardType="number-pad"
                placeholder="ACCT-000003"
                placeholderTextColor={colors.muted}
              />
            </Field>
            <View style={styles.row2}>
              <View style={{ flex: 1 }}>
                <Field label="MM/YY" error={errors.cardExp}>
                  <TextInput
                    style={styles.input}
                    value={cardExp}
                    onChangeText={setCardExp}
                    placeholder="MM/YY"
                    placeholderTextColor={colors.muted}
                  />
                </Field>
              </View>
              <View style={{ flex: 1 }}>
                <Field label="CVV" error={errors.cardCvv}>
                  <TextInput
                    style={styles.input}
                    value={cardCvv}
                    onChangeText={setCardCvv}
                    keyboardType="number-pad"
                    placeholder="CVV"
                    placeholderTextColor={colors.muted}
                    secureTextEntry
                  />
                </Field>
              </View>
            </View>
          </>
        ) : null}

        <View style={styles.summary}>
          <Text style={styles.summaryTitle}>Order summary</Text>
          {items.map((i) => (
            <View key={i.id} style={styles.summaryRow}>
              <Text style={styles.summaryItem} numberOfLines={1}>
                {i.productName} × {i.quantity}
              </Text>
              <Text style={styles.summaryPrice}>$ {Number(i.totalPrice).toFixed(2)}</Text>
            </View>
          ))}
          <View style={[styles.summaryRow, styles.summaryTotal]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>$ {Number(total).toFixed(2)}</Text>
          </View>
        </View>

        <Pressable
          style={[styles.btnPrimary, busy && styles.dim]}
          disabled={busy}
          onPress={() => void onSubmit()}
        >
          <Text style={styles.btnPrimaryText}>{busy ? "Placing…" : "Place order"}</Text>
        </Pressable>

        <SiteFooter />
      </ScrollView>

      {picker ? (
        <View style={styles.pickerOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setPicker(null)} />
          <View style={styles.pickerSheet}>
            <Text style={styles.pickerTitle}>
              {picker === "country" ? "Country" : picker === "state" ? "State" : "City"}
            </Text>
            <ScrollView style={{ maxHeight: 320 }}>
              {pickerOptions.map((opt) => (
                <Pressable
                  key={opt}
                  style={styles.pickerRow}
                  onPress={() => {
                    if (picker === "country") {
                      setCountry(opt);
                      setState("");
                      setCity("");
                    } else if (picker === "state") {
                      setState(opt);
                      setCity("");
                    } else {
                      setCity(opt);
                    }
                    setPicker(null);
                  }}
                >
                  <Text style={styles.pickerRowText}>{opt}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      ) : null}
    </View>
  );
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
    <View style={[styles.field, error ? styles.fieldError : null]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
      {error ? <Text style={styles.fieldErr}>{error}</Text> : null}
    </View>
  );
}

function SelectValue({
  value,
  placeholder,
  onPress,
}: {
  value: string;
  placeholder: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.select} onPress={onPress}>
      <Text style={[styles.selectText, !value && styles.selectPh]}>
        {value || placeholder}
      </Text>
      <Ionicons name="chevron-down" size={18} color={colors.darkText} />
    </Pressable>
  );
}

function PayChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={[styles.payChip, active && styles.payChipOn]} onPress={onPress}>
      <Text style={[styles.payChipText, active && styles.payChipTextOn]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 24,
  },
  scroll: { paddingHorizontal: space.lg, paddingTop: space.md, paddingBottom: 0 },
  logo: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 1.4,
    color: colors.darkText,
    marginBottom: 8,
  },
  pageTitle: { fontSize: 28, fontWeight: "800", color: colors.darkText, marginBottom: 16 },
  sectionH: { fontSize: 18, fontWeight: "800", color: colors.darkText, marginBottom: 10, marginTop: 4 },
  rule: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(14,32,66,0.15)",
    marginVertical: 16,
  },
  field: { marginBottom: 12 },
  fieldError: {},
  fieldLabel: { fontSize: 13, fontWeight: "700", color: colors.darkText, marginBottom: 6 },
  fieldErr: { color: colors.destructive, fontSize: 12, marginTop: 4, fontStyle: "italic" },
  input: {
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: radii.sm,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.darkText,
    backgroundColor: colors.white,
  },
  select: {
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: radii.sm,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectText: { fontSize: 15, color: colors.darkText, flex: 1 },
  selectPh: { color: colors.muted },
  row2: { flexDirection: "row", gap: 12 },
  payRow: { flexDirection: "row", gap: 10, marginBottom: 12 },
  payChip: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.darkText,
    borderRadius: radii.sm,
    paddingVertical: 12,
    alignItems: "center",
  },
  payChipOn: { backgroundColor: colors.darkText },
  payChipText: { fontWeight: "700", color: colors.darkText },
  payChipTextOn: { color: colors.white },
  summary: {
    marginTop: 16,
    marginBottom: 12,
    backgroundColor: colors.objects,
    borderRadius: radii.md,
    padding: 16,
    gap: 8,
  },
  summaryTitle: { fontSize: 16, fontWeight: "800", color: colors.darkText, marginBottom: 4 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  summaryItem: { flex: 1, color: colors.muted, fontSize: 13 },
  summaryPrice: { fontWeight: "600", color: colors.darkText, fontSize: 13 },
  summaryTotal: {
    marginTop: 6,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(14,32,66,0.15)",
  },
  totalLabel: { fontWeight: "800", color: colors.darkText },
  totalValue: { fontWeight: "800", color: colors.darkText },
  formError: {
    color: colors.destructive,
    backgroundColor: "#FEECEC",
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  btnPrimary: {
    backgroundColor: colors.primary,
    borderRadius: radii.sm,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 16,
  },
  btnPrimaryText: { fontWeight: "800", fontSize: 15, color: colors.darkText },
  dim: { opacity: 0.55 },
  pickerOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.overlay,
    justifyContent: "flex-end",
  },
  pickerSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    maxHeight: "55%",
  },
  pickerTitle: { fontSize: 18, fontWeight: "800", color: colors.darkText, marginBottom: 8 },
  pickerRow: {
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  pickerRowText: { fontSize: 15, color: colors.darkText },
});
