import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import type { ProductListItem } from "../api/types";
import { resolveMediaUrl } from "../api/media";
import { IconChat, IconStar } from "./FigmaIcons";
import { colors } from "../theme/colors";

type Props = {
  product: ProductListItem;
  onPress: () => void;
  /** `grid`/`rail` — list Frame 454; `related` — PDP related grid (Figma 2548:9286) */
  variant?: "grid" | "rail" | "related";
};

/**
 * Figma iPhone Product List card `839:1907` Frame 454
 * Related на PDP — те же поля, ширина родителя + тень (канон `2548:9286`).
 */
export function ProductCard({ product, onPress, variant = "grid" }: Props) {
  const imageUrl = resolveMediaUrl(product.imageUrl);
  const discount =
    product.discountPercent ??
    (product.oldPrice && product.oldPrice > product.price
      ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
      : null);
  const oos = String(product.status) === "OutOfStock" || String(product.status) === "2";
  const rating =
    variant === "related"
      ? String(Math.round(product.averageRating || 0))
      : (product.averageRating || 0).toFixed(1).replace(".", ",");
  const reviews = formatReviews(product.reviewCount ?? 0);
  const { whole, cents } = splitPrice(Number(product.price));
  const showOld = product.oldPrice != null && product.oldPrice > product.price;
  const related = variant === "related";

  return (
    <Pressable
      style={[
        styles.card,
        variant === "rail" && styles.cardRail,
        variant === "grid" && styles.cardGrid,
        related && styles.cardRelated,
        oos && styles.oos,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={product.name}
    >
      <View style={[styles.imageWrap, related && styles.imageWrapRelated]}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={[styles.image, styles.placeholder]} />
        )}
        {discount != null && discount > 0 ? (
          <View style={[styles.badge, related && styles.badgeRelated]}>
            <Text style={styles.badgeText}>- {discount}%</Text>
          </View>
        ) : null}
        {oos ? (
          <View style={styles.oosBadge}>
            <Text style={styles.oosBadgeText}>Out of stock</Text>
          </View>
        ) : null}
      </View>

      <View style={[styles.body, related && styles.bodyRelated]}>
        <View style={[styles.titleBlock, related && styles.titleBlockRelated]}>
          <Text style={[styles.name, related && styles.nameRelated]} numberOfLines={2}>
            {product.name}
          </Text>
          <View style={[styles.meta, related && styles.metaRelated]}>
            <View style={styles.metaItem}>
              <IconStar size={16} color={colors.darkText} />
              <Text style={styles.metaText}>{rating}</Text>
            </View>
            <View style={styles.metaItem}>
              <IconChat size={16} color={colors.darkText} />
              <Text style={styles.metaText}>{reviews}</Text>
            </View>
          </View>
        </View>

        <View style={[styles.priceRow, related && styles.priceRowRelated]}>
          <View style={styles.priceNow}>
            <Text style={styles.priceDollar}>$</Text>
            <Text style={styles.priceWhole}>{whole}</Text>
            <Text style={styles.priceCents}>{cents}</Text>
          </View>
          {showOld ? (
            <Text style={styles.old}>$ {Number(product.oldPrice).toFixed(2)}</Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

function splitPrice(price: number) {
  const safe = Number.isFinite(price) ? Math.max(0, price) : 0;
  const whole = Math.floor(safe);
  const cents = Math.round((safe - whole) * 100)
    .toString()
    .padStart(2, "0");
  return { whole: String(whole), cents };
}

/** Figma: «1 547» — пробел как разделитель тысяч */
function formatReviews(n: number) {
  return n.toLocaleString("ru-RU").replace(/\u00A0/g, " ");
}

const styles = StyleSheet.create({
  card: {
    width: 171,
    minHeight: 270,
    padding: 16,
    gap: 6,
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 4,
    overflow: "hidden",
  },
  cardGrid: {},
  cardRail: {},
  cardRelated: {
    width: "100%",
    minHeight: 0,
    padding: 12,
    alignItems: "stretch",
    borderRadius: 8,
    shadowColor: "#0E2042",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  oos: { opacity: 0.72 },
  imageWrap: {
    width: 139,
    height: 139,
    borderRadius: 4,
    overflow: "hidden",
    backgroundColor: "#FAFAFA",
    borderWidth: 1,
    borderColor: colors.darkText,
    alignSelf: "center",
  },
  imageWrapRelated: {
    width: "100%",
    aspectRatio: 1,
    height: undefined as unknown as number,
    borderWidth: 0,
    borderRadius: 6,
    alignSelf: "stretch",
  },
  image: { width: "100%", height: "100%" },
  placeholder: {
    backgroundColor: "#D9D9D9",
  },
  badge: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
  },
  badgeRelated: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: { color: colors.darkText, fontSize: 10, fontWeight: "700" },
  oosBadge: {
    position: "absolute",
    left: 6,
    bottom: 6,
    backgroundColor: "#565959",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
  },
  oosBadgeText: { color: colors.white, fontSize: 10, fontWeight: "700" },
  body: {
    width: 139,
    gap: 12,
    alignItems: "center",
  },
  bodyRelated: {
    width: "100%",
    alignItems: "flex-start",
    gap: 8,
    marginTop: 8,
  },
  titleBlock: {
    width: 139,
    gap: 4,
    alignItems: "center",
  },
  titleBlockRelated: {
    width: "100%",
    alignItems: "flex-start",
  },
  name: {
    width: 139,
    height: 36,
    fontSize: 14,
    fontWeight: "400",
    color: colors.darkText,
    textAlign: "center",
    lineHeight: 18,
  },
  nameRelated: {
    width: "100%",
    height: undefined,
    minHeight: 36,
    textAlign: "left",
    fontWeight: "600",
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  metaRelated: {
    justifyContent: "flex-start",
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  metaText: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.darkText,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    gap: 8,
  },
  priceRowRelated: {
    justifyContent: "flex-start",
  },
  priceNow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  priceDollar: {
    fontSize: 20,
    fontWeight: "500",
    color: colors.darkText,
    letterSpacing: 1.6,
    lineHeight: 25,
  },
  priceWhole: {
    fontSize: 20,
    fontWeight: "500",
    color: colors.darkText,
    letterSpacing: 0.8,
    lineHeight: 25,
  },
  /** Figma: cents 12.9px как надстрочные ($7⁴⁰) */
  priceCents: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.darkText,
    lineHeight: 16,
    marginTop: 1,
  },
  old: {
    fontSize: 12,
    fontWeight: "500",
    color: "#646464",
    textDecorationLine: "line-through",
    marginBottom: 3,
  },
});
