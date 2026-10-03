import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ordersApi } from "../api";
import type { OrderDto } from "../api/types";
import { PrimaryButton } from "../components/PrimaryButton";
import { SiteFooter } from "../components/SiteFooter";
import { useAuth } from "../auth/AuthContext";
import { colors } from "../theme/colors";
import { navigateShop } from "../navigation/navigationRef";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "Orders">;

export function OrdersScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const list = await ordersApi.mine();
      setOrders(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (user) load();
    else setLoading(false);
  }, [user, load]);

  if (!user) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Log in to see orders</Text>
        <PrimaryButton title="Log in" onPress={() => navigateShop("Login")} />
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.darkText} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <FlatList
        data={orders}
        keyExtractor={(o) => o.id}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
          />
        }
        ListEmptyComponent={<Text style={styles.empty}>No orders yet</Text>}
        ListFooterComponent={<SiteFooter />}
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() => navigation.navigate("OrderDetails", { id: item.id })}
          >
            <Text style={styles.num}>{item.orderNumber || item.id.slice(0, 8)}</Text>
            <Text style={styles.meta}>
              {new Date(item.orderDateUtc).toLocaleDateString()} · {item.status}
            </Text>
            <Text style={styles.total}>
              $ {Number(item.totalAmount).toFixed(2)} · {item.itemsCount} items
            </Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 24 },
  title: { fontSize: 18, fontWeight: "800", color: colors.darkText },
  error: { margin: 12, color: colors.destructive },
  empty: { textAlign: "center", marginTop: 40, color: colors.muted },
  card: {
    padding: 14,
    borderRadius: 10,
    backgroundColor: colors.objects,
    marginBottom: 10,
    gap: 4,
  },
  num: { fontWeight: "800", color: colors.darkText, fontSize: 16 },
  meta: { color: colors.muted, fontSize: 13 },
  total: { fontWeight: "700", color: colors.darkText },
});
