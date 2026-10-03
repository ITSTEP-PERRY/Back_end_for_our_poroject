import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ordersApi } from "../api";
import type { OrderDto } from "../api/types";
import { colors } from "../theme/colors";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "OrderDetails">;

export function OrderDetailsScreen({ route }: Props) {
  const [order, setOrder] = useState<OrderDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    ordersApi
      .byId(route.params.id)
      .then(setOrder)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"));
  }, [route.params.id]);

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }
  if (!order) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.darkText} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <Text style={styles.title}>{order.orderNumber || order.id}</Text>
      <Text style={styles.meta}>Status: {order.status}</Text>
      <Text style={styles.meta}>Date: {new Date(order.orderDateUtc).toLocaleString()}</Text>
      <Text style={styles.meta}>Total: $ {Number(order.totalAmount).toFixed(2)}</Text>
      {order.shippingAddress ? (
        <Text style={styles.meta}>Ship to: {order.shippingAddress}</Text>
      ) : null}
      <Text style={styles.section}>Items</Text>
      {(order.items ?? []).map((it, i) => (
        <Text key={i} style={styles.item}>
          {it.productName} × {it.quantity} — ${" "}
          {Number(it.lineTotal ?? (it.unitPrice ?? 0) * it.quantity).toFixed(2)}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white, padding: 16, gap: 6 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  error: { color: colors.destructive },
  title: { fontSize: 22, fontWeight: "800", color: colors.darkText, marginBottom: 8 },
  meta: { color: colors.darkText, fontSize: 14 },
  section: { marginTop: 16, fontWeight: "800", fontSize: 16, color: colors.darkText },
  item: { color: colors.muted, marginTop: 4 },
});
