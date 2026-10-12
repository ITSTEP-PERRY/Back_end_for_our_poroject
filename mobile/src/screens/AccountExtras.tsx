import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { reviewsApi, wishlistApi } from "../api";
import { resolveMediaUrl } from "../api/media";
import type { WishlistItemDto } from "../api/types";
import { PrimaryButton } from "../components/PrimaryButton";
import { SiteFooter } from "../components/SiteFooter";
import { useAuth } from "../auth/AuthContext";
import { colors } from "../theme/colors";
import { navigateShop } from "../navigation/navigationRef";
import type { RootStackParamList } from "../navigation/types";

type WProps = NativeStackScreenProps<RootStackParamList, "Wishlist">;
type RProps = NativeStackScreenProps<RootStackParamList, "Reviews">;
type SProps = NativeStackScreenProps<RootStackParamList, "Settings">;

export { LegalScreen } from "./LegalScreen";

export function WishlistScreen({}: WProps) {
  const { user } = useAuth();
  const [items, setItems] = useState<WishlistItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const list = await wishlistApi.mine();
      setItems(Array.isArray(list) ? list : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) load();
    else setLoading(false);
  }, [user, load]);

  const remove = async (productId: string) => {
    setRemoving(productId);
    try {
      await wishlistApi.remove(productId);
      setItems((prev) => prev.filter((i) => i.productId !== productId));
    } catch {
      /* keep item */
    } finally {
      setRemoving(null);
    }
  };

  if (!user) {
    return (
      <View style={styles.center}>
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
    <FlatList
      data={items}
      keyExtractor={(i) => i.id || i.productId}
      contentContainerStyle={{ padding: 16, flexGrow: 1 }}
      ListEmptyComponent={<Text style={styles.empty}>Wishlist is empty</Text>}
      ListFooterComponent={<SiteFooter />}
      renderItem={({ item }) => {
        const p = item.product;
        const imageUrl = resolveMediaUrl(p?.imageUrl);
        const price = Number(p?.price);
        const name = p?.name || "Product";
        const productId = item.productId || p?.id;
        return (
          <Pressable
            style={styles.row}
            onPress={() => productId && navigateShop("Product", { id: productId })}
          >
            {imageUrl ? (
              <Image source={{ uri: imageUrl }} style={styles.img} />
            ) : (
              <View style={[styles.img, { backgroundColor: "#ddd" }]} />
            )}
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={styles.name} numberOfLines={2}>
                {name}
              </Text>
              <Text style={styles.price}>
                {Number.isFinite(price) ? `$ ${price.toFixed(2)}` : "—"}
              </Text>
            </View>
            <Pressable
              onPress={() => productId && remove(productId)}
              hitSlop={8}
              disabled={removing === productId}
            >
              <Text style={styles.remove}>{removing === productId ? "…" : "Remove"}</Text>
            </Pressable>
          </Pressable>
        );
      }}
    />
  );
}

export function ReviewsScreen({}: RProps) {
  const { user } = useAuth();
  const [items, setItems] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    reviewsApi
      .mine()
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) {
    return (
      <View style={styles.center}>
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
    <FlatList
      data={items}
      keyExtractor={(i, idx) => String(i.id ?? idx)}
      contentContainerStyle={{ padding: 16 }}
      ListEmptyComponent={<Text style={styles.empty}>No reviews yet</Text>}
      ListFooterComponent={<SiteFooter />}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.name}>
            {String(item.title || "Review")} · {String(item.rating)}★
          </Text>
          <Text style={styles.meta}>{String(item.body || "")}</Text>
        </View>
      )}
    />
  );
}

export function SettingsScreen({}: SProps) {
  const { user } = useAuth();
  return (
    <ScrollView contentContainerStyle={styles.pad}>
      <Text style={styles.name}>{user?.name}</Text>
      <Text style={styles.meta}>{user?.email}</Text>
      <Text style={styles.meta}>Password / email change — via Auth endpoints (web parity).</Text>
      <SiteFooter />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  pad: { flex: 1, padding: 16, backgroundColor: colors.white, gap: 8 },
  empty: { textAlign: "center", marginTop: 40, color: colors.muted },
  row: { flexDirection: "row", gap: 12, marginBottom: 12, alignItems: "center" },
  img: { width: 64, height: 64, borderRadius: 8 },
  name: { fontWeight: "800", color: colors.darkText, fontSize: 16 },
  price: { color: colors.darkText, fontWeight: "700" },
  remove: { color: colors.secondary, fontWeight: "700", fontSize: 13 },
  meta: { color: colors.muted, marginTop: 4 },
  card: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: colors.objects,
    marginBottom: 10,
  },
});
