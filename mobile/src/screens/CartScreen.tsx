import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { resolveMediaUrl } from "../api/media";
import { SiteFooter } from "../components/SiteFooter";
import { useAuth } from "../auth/AuthContext";
import { useCart } from "../cart/CartContext";
import { colors, radii, space } from "../theme/colors";
import { navigateShop } from "../navigation/navigationRef";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "Cart">;

/**
 * Cart V2 → mobile (web `CartPage` / Figma `2550:12481` empty `2550:12482`).
 * Отдельного iPhone-кадра нет — узкий layout 1:1 по web.
 */
export function CartScreen({ navigation }: Props) {
  const { user } = useAuth();
  const { cart, ready, setQty, remove } = useCart();
  const [busy, setBusy] = useState(false);

  if (!ready || !cart) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.darkText} />
      </View>
    );
  }

  if (!cart.items.length) {
    return (
      <ScrollView style={styles.root} contentContainerStyle={styles.emptyGrow}>
        <Text style={styles.pageTitle}>Shopping cart</Text>
        <View style={styles.emptyBox}>
          <Text style={styles.emptyH2}>Your cart is empty</Text>
          <Text style={styles.emptyP}>Browse the catalog and add something you like.</Text>
          <Pressable style={styles.btnPrimary} onPress={() => navigateShop("Products")}>
            <Text style={styles.btnPrimaryText}>Go to catalog</Text>
          </Pressable>
          {!user ? (
            <Pressable style={styles.btnOutline} onPress={() => navigateShop("Login")}>
              <Text style={styles.btnOutlineText}>Sign in</Text>
            </Pressable>
          ) : null}
          {!user ? (
            <Text style={styles.guestHint}>
              Not logged in —{" "}
              <Text style={styles.link} onPress={() => navigateShop("Login")}>
                Sign in
              </Text>{" "}
              to keep cart across devices.
            </Text>
          ) : null}
        </View>
        <SiteFooter />
      </ScrollView>
    );
  }

  const itemCount = cart.items.reduce((s, i) => s + i.quantity, 0);

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.pageTitle}>Shopping cart</Text>

        {cart.items.map((item) => {
          const uri = resolveMediaUrl(item.imageUrl);
          return (
            <View key={item.id} style={styles.row}>
              <Pressable onPress={() => navigation.navigate("Product", { id: item.productId })}>
                {uri ? (
                  <Image source={{ uri }} style={styles.img} resizeMode="cover" />
                ) : (
                  <View style={[styles.img, styles.ph]} />
                )}
              </Pressable>
              <View style={styles.info}>
                <Pressable onPress={() => navigation.navigate("Product", { id: item.productId })}>
                  <Text style={styles.name} numberOfLines={2}>
                    {item.productName}
                  </Text>
                </Pressable>
                <Text style={styles.unit}>$ {Number(item.productPrice).toFixed(2)}</Text>
                <View style={styles.qtyRow}>
                  <Text style={styles.qtyLabel}>Qty</Text>
                  <Pressable
                    style={styles.qtyBtn}
                    disabled={busy}
                    onPress={async () => {
                      setBusy(true);
                      try {
                        if (item.quantity <= 1) await remove(item.productId);
                        else await setQty(item.productId, item.quantity - 1);
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    <Ionicons name="remove" size={16} color={colors.darkText} />
                  </Pressable>
                  <Text style={styles.qtyNum}>{item.quantity}</Text>
                  <Pressable
                    style={styles.qtyBtn}
                    disabled={busy}
                    onPress={async () => {
                      setBusy(true);
                      try {
                        await setQty(item.productId, item.quantity + 1);
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    <Ionicons name="add" size={16} color={colors.darkText} />
                  </Pressable>
                </View>
                <Pressable
                  disabled={busy}
                  onPress={async () => {
                    setBusy(true);
                    try {
                      await remove(item.productId);
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  <Text style={styles.remove}>Remove</Text>
                </Pressable>
              </View>
              <Text style={styles.lineSum}>$ {Number(item.totalPrice).toFixed(2)}</Text>
            </View>
          );
        })}

        <View style={styles.summary}>
          <Text style={styles.summaryTitle}>Order summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Items</Text>
            <Text style={styles.summaryValue}>{itemCount}</Text>
          </View>
          <View style={[styles.summaryRow, styles.summaryTotal]}>
            <Text style={styles.summaryLabelStrong}>Total</Text>
            <Text style={styles.summaryValueStrong}>
              $ {Number(cart.totalAmount).toFixed(2)}
            </Text>
          </View>

          {user ? (
            <Pressable
              style={styles.btnPrimary}
              onPress={() => navigation.navigate("Checkout")}
            >
              <Text style={styles.btnPrimaryText}>Proceed to checkout</Text>
            </Pressable>
          ) : (
            <View style={styles.guestBlock}>
              <Text style={styles.guestHint}>Sign in to place an order.</Text>
              <Pressable style={styles.btnPrimary} onPress={() => navigateShop("Login")}>
                <Text style={styles.btnPrimaryText}>Sign in</Text>
              </Pressable>
              <Pressable style={styles.btnOutline} onPress={() => navigateShop("Register")}>
                <Text style={styles.btnOutlineText}>Create account</Text>
              </Pressable>
            </View>
          )}
        </View>

        <SiteFooter />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyGrow: { flexGrow: 1, paddingBottom: 0 },
  scroll: { paddingHorizontal: space.lg, paddingTop: space.md, paddingBottom: 0 },
  pageTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.darkText,
    marginBottom: space.lg,
  },
  emptyBox: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 12,
    gap: 12,
  },
  emptyH2: { fontSize: 20, fontWeight: "800", color: colors.darkText },
  emptyP: { color: colors.muted, textAlign: "center", marginBottom: 8 },
  row: {
    flexDirection: "row",
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(14,32,66,0.12)",
  },
  img: { width: 88, height: 88, borderRadius: radii.sm },
  ph: { backgroundColor: "#D9D9D9" },
  info: { flex: 1, gap: 4 },
  name: { fontWeight: "700", fontSize: 15, color: colors.darkText },
  unit: { color: colors.muted, fontSize: 13 },
  qtyRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  qtyLabel: { fontSize: 13, color: colors.muted, marginRight: 4 },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyNum: { fontWeight: "700", minWidth: 18, textAlign: "center", color: colors.darkText },
  remove: { color: colors.secondary, fontWeight: "600", fontSize: 13, marginTop: 4 },
  lineSum: { fontWeight: "800", color: colors.darkText, fontSize: 15 },
  summary: {
    marginTop: 20,
    marginBottom: 16,
    backgroundColor: colors.objects,
    borderRadius: radii.md,
    padding: 16,
    gap: 10,
  },
  summaryTitle: { fontSize: 18, fontWeight: "800", color: colors.darkText, marginBottom: 4 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between" },
  summaryTotal: {
    paddingTop: 10,
    marginTop: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(14,32,66,0.15)",
  },
  summaryLabel: { color: colors.muted },
  summaryValue: { color: colors.darkText, fontWeight: "600" },
  summaryLabelStrong: { fontWeight: "800", color: colors.darkText, fontSize: 16 },
  summaryValueStrong: { fontWeight: "800", color: colors.darkText, fontSize: 16 },
  guestBlock: { gap: 10, marginTop: 4 },
  guestHint: { color: colors.muted, fontSize: 13, textAlign: "center" },
  link: { color: colors.secondary, fontWeight: "700" },
  btnPrimary: {
    backgroundColor: colors.primary,
    borderRadius: radii.sm,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
  btnPrimaryText: { fontWeight: "800", fontSize: 15, color: colors.darkText },
  btnOutline: {
    borderWidth: 1.5,
    borderColor: colors.darkText,
    borderRadius: radii.sm,
    paddingVertical: 14,
    alignItems: "center",
  },
  btnOutlineText: { fontWeight: "700", fontSize: 15, color: colors.darkText },
});
