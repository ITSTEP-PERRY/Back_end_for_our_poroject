import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { productsApi, wishlistApi } from "../api";
import { resolveMediaUrl } from "../api/media";
import type { ProductDetail, ProductListItem, ProductReview } from "../api/types";
import { ProductCard } from "../components/ProductCard";
import { SiteFooter } from "../components/SiteFooter";
import { useAuth } from "../auth/AuthContext";
import { useCart } from "../cart/CartContext";
import { colors, radii, space } from "../theme/colors";
import { navigateShop } from "../navigation/navigationRef";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "Product">;
const PAD = 16;
const THUMB = 56;

const INFO_ROWS: { key: "payment" | "security" | "delivery" | "returns"; label: string; body: string }[] = [
  {
    key: "payment",
    label: "Payment methods",
    body: "Credit card, Google Pay, Apple Pay, PayPal, or pay on delivery — available methods appear at checkout.",
  },
  {
    key: "security",
    label: "Security",
    body: "Payments are processed over encrypted connections. Card data is not stored on Perry servers.",
  },
  {
    key: "delivery",
    label: "Delivery",
    body: "Standard 3–7 business days, Express 1–3 days when available. Tracking appears in My orders.",
  },
  {
    key: "returns",
    label: "Returns",
    body: "Unused items in original packaging can usually be returned within 14 days. See Terms for details.",
  },
];

/**
 * iPhone PDP `#MU07` `1376:1973` + See more `2006:7641` + цветной канон `2548:9286`.
 * Sticky buy bar (price / heart / To cart / Buy / Quantity) + длинный скролл.
 */
export function ProductScreen({ navigation, route }: Props) {
  const { id } = route.params;
  const { user } = useAuth();
  const { add } = useCart();
  const insets = useSafeAreaInsets();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [active, setActive] = useState(0);
  const [openAbout, setOpenAbout] = useState<Record<number, boolean>>({ 0: true, 1: true });
  const [infoKind, setInfoKind] = useState<(typeof INFO_ROWS)[number]["key"] | null>(null);
  const [seeMoreOpen, setSeeMoreOpen] = useState(false);
  const [reviewFilter, setReviewFilter] = useState<number | null>(null);
  const [reviewsVisible, setReviewsVisible] = useState(3);

  useEffect(() => {
    navigation.setOptions({ headerShown: true, title: "Product" });
    setProduct(null);
    setError(null);
    setActive(0);
    setQty(1);
    setMsg(null);
    setReviewsVisible(3);
    setReviewFilter(null);
    productsApi
      .byId(id)
      .then((p) => {
        setProduct(p);
        const open: Record<number, boolean> = {};
        (p.aboutItems ?? []).forEach((_, i) => {
          open[i] = i < 2;
        });
        if (!(p.aboutItems?.length) && p.description) open[0] = true;
        setOpenAbout(open);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"));
  }, [id, navigation]);

  const images = useMemo(() => {
    if (!product) return [];
    return product.images?.length
      ? product.images
      : [{ id: "x", url: "", isPrimary: true, isVideo: false }];
  }, [product]);

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }
  if (!product) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.darkText} />
      </View>
    );
  }

  const oos = String(product.status) === "OutOfStock" || String(product.status) === "2";
  const ratingRounded = Math.round(product.averageRating || 0);
  const ratingLabel = (product.averageRating || 0).toFixed(1).replace(".", ",");
  const { whole, cents } = splitPrice(Number(product.price));
  const showOld = product.oldPrice != null && product.oldPrice > product.price;
  const discount =
    product.discountPercent ??
    (showOld && product.oldPrice
      ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
      : null);
  const mainUri = resolveMediaUrl(images[active]?.url);
  const aboutBlocks =
    product.aboutItems?.length > 0
      ? product.aboutItems
      : product.description
        ? [{ title: "Description", description: product.description }]
        : [];

  const reviews = product.reviews ?? [];
  const filtered = reviewFilter
    ? reviews.filter((r) => r.rating === reviewFilter)
    : reviews;
  const visibleReviews = filtered.slice(0, reviewsVisible);
  const distribution = ratingDistribution(reviews, product.reviewCount);
  const frequentTags = topTags(reviews);

  const related = product.related ?? [];
  const saleRelated = product.saleRelated ?? [];
  const stickyPad = 118 + insets.bottom;

  const addToCart = async (goCart?: boolean) => {
    setBusy(true);
    setMsg(null);
    try {
      await add(product.id, qty);
      setMsg("Added to cart");
      if (goCart) navigateShop("Cart");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Cart error");
    } finally {
      setBusy(false);
    }
  };

  const addWishlist = async () => {
    if (!user) {
      navigateShop("Login");
      return;
    }
    try {
      await wishlistApi.add(product.id);
      setMsg("Added to wishlist");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Wishlist error");
    }
  };

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: stickyPad }]}>
        {/* Breadcrumbs */}
        <View style={styles.crumbs}>
          <Pressable onPress={() => navigateShop("Home")} hitSlop={8}>
            <Ionicons name="home-outline" size={16} color={colors.darkText} />
          </Pressable>
          <Text style={styles.crumbSep}> / </Text>
          <Pressable
            onPress={() =>
              navigateShop("Products", {
                categoryId: product.category.id,
                title: product.category.name,
              })
            }
          >
            <Text style={styles.crumbLink}>{product.category.name}</Text>
          </Pressable>
          <Text style={styles.crumbSep}> / </Text>
          <Text style={styles.crumbCurrent} numberOfLines={1}>
            {product.name}
          </Text>
        </View>

        {/* Title → Code → Rating (Figma 1376:1973) */}
        <Text style={styles.title}>{product.name}</Text>
        {product.sku ? <Text style={styles.code}>Code: {product.sku}</Text> : null}
        <View style={styles.metaRow}>
          <View style={styles.starsRow}>
            {Array.from({ length: 5 }, (_, i) => (
              <Ionicons
                key={i}
                name={i < ratingRounded ? "star" : "star-outline"}
                size={16}
                color={i < ratingRounded ? colors.star : colors.muted}
              />
            ))}
            <Text style={styles.ratingNum}>{ratingLabel}</Text>
            <Text style={styles.reviewsCount}>
              {(product.reviewCount ?? 0).toLocaleString("en-US")} reviews
            </Text>
          </View>
        </View>

        {/* Gallery: full width, square frame, contain — фото целиком, без crop */}
        <View style={styles.gallery}>
          <View style={styles.mainWrap}>
            {mainUri ? (
              <Image source={{ uri: mainUri }} style={styles.mainImg} resizeMode="contain" />
            ) : (
              <View style={[styles.mainImg, styles.ph]} />
            )}
            {discount != null && discount > 0 ? (
              <View style={styles.discBadge}>
                <Text style={styles.discBadgeText}>- {discount}%</Text>
              </View>
            ) : null}
            <Pressable style={styles.heartOnPhoto} onPress={() => void addWishlist()} hitSlop={8}>
              <Ionicons name="heart-outline" size={22} color={colors.darkText} />
            </Pressable>
            {images.length > 1 ? (
              <>
                <Pressable
                  style={[styles.galleryArrow, styles.galleryArrowL]}
                  onPress={() => setActive((i) => (i - 1 + images.length) % images.length)}
                >
                  <Ionicons name="chevron-back" size={20} color={colors.darkText} />
                </Pressable>
                <Pressable
                  style={[styles.galleryArrow, styles.galleryArrowR]}
                  onPress={() => setActive((i) => (i + 1) % images.length)}
                >
                  <Ionicons name="chevron-forward" size={20} color={colors.darkText} />
                </Pressable>
              </>
            ) : null}
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.thumbs}
          >
            {images.map((img, i) => {
              const uri = resolveMediaUrl(img.url);
              return (
                <Pressable
                  key={img.id}
                  onPress={() => setActive(i)}
                  style={[styles.thumb, i === active && styles.thumbOn]}
                >
                  {uri ? (
                    <Image source={{ uri }} style={styles.thumbImg} resizeMode="cover" />
                  ) : (
                    <View style={[styles.thumbImg, styles.ph]} />
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Info rows + See more (sheet) */}
        <View style={styles.infoBlock}>
          {INFO_ROWS.map((row) => (
            <Pressable key={row.key} style={styles.infoRow} onPress={() => setInfoKind(row.key)}>
              <Text style={styles.infoLabel}>{row.label}</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.darkText} />
            </Pressable>
          ))}
          <Pressable style={styles.seeMoreLink} onPress={() => setSeeMoreOpen(true)}>
            <Text style={styles.seeMoreLinkText}>See more</Text>
          </Pressable>
        </View>

        {msg ? <Text style={styles.msg}>{msg}</Text> : null}

        {/* About product */}
        {aboutBlocks.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionH}>About product</Text>
            {aboutBlocks.map((a, i) => {
              const open = !!openAbout[i];
              return (
                <Pressable
                  key={`${a.title}-${i}`}
                  style={styles.aboutCard}
                  onPress={() => setOpenAbout((prev) => ({ ...prev, [i]: !prev[i] }))}
                >
                  <View style={styles.aboutHead}>
                    <Text style={styles.aboutTitle}>{a.title}</Text>
                    <Ionicons
                      name={open ? "chevron-up" : "chevron-down"}
                      size={18}
                      color={colors.darkText}
                    />
                  </View>
                  {open ? <Text style={styles.aboutBody}>{a.description}</Text> : null}
                </Pressable>
              );
            })}
          </View>
        ) : null}

        {/* Product details */}
        {(product.attributes?.length > 0 || product.brand) && (
          <View style={styles.section}>
            <Text style={styles.sectionHCenter}>Product details</Text>
            <View style={styles.detailsCard}>
              {pairAttributes(product).map((row, i) => (
                <View key={i} style={[styles.detailsRow, i > 0 && styles.detailsRowBorder]}>
                  {row.map((cell) => (
                    <View key={cell.label} style={styles.detailsCell}>
                      <Text style={styles.detailsLabel}>{cell.label}</Text>
                      <Text style={styles.detailsValue}>{cell.value}</Text>
                    </View>
                  ))}
                  {row.length === 1 ? <View style={styles.detailsCell} /> : null}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Customer reviews */}
        <View style={styles.section}>
          <Text style={styles.sectionHCenter}>Customer reviews</Text>
          <View style={styles.reviewsSummary}>
            <Text style={styles.bigRating}>{ratingLabel} / 5</Text>
            <View style={styles.starsRowCenter}>
              {Array.from({ length: 5 }, (_, i) => (
                <Ionicons
                  key={i}
                  name={i < ratingRounded ? "star" : "star-outline"}
                  size={18}
                  color={colors.darkText}
                />
              ))}
            </View>
            <Text style={styles.reviewsMuted}>
              {(product.reviewCount ?? 0).toLocaleString("en-US")} reviews
            </Text>

            {[5, 4, 3, 2, 1].map((star) => (
              <View key={star} style={styles.barRow}>
                <Text style={styles.barLabel}>{star}</Text>
                <Ionicons name="star" size={12} color={colors.darkText} />
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: `${distribution[star] || 0}%` }]} />
                </View>
                <Text style={styles.barPct}>{distribution[star] || 0}%</Text>
              </View>
            ))}

            <View style={styles.confirmed}>
              <Ionicons name="checkmark-circle" size={16} color={colors.secondary} />
              <Text style={styles.confirmedText}>All opinions confirmed by purchase.</Text>
            </View>

            {frequentTags.length > 0 ? (
              <View style={styles.tagsWrap}>
                {frequentTags.map((t) => (
                  <View key={t} style={styles.tagPill}>
                    <Text style={styles.tagText}>{t}</Text>
                  </View>
                ))}
              </View>
            ) : null}

            <View style={styles.filterRow}>
              <Pressable
                style={[styles.filterChip, reviewFilter == null && styles.filterChipOn]}
                onPress={() => setReviewFilter(null)}
              >
                <Text style={styles.filterChipText}>All</Text>
              </Pressable>
              {[5, 4].map((s) => (
                <Pressable
                  key={s}
                  style={[styles.filterChip, reviewFilter === s && styles.filterChipOn]}
                  onPress={() => setReviewFilter(s)}
                >
                  <Text style={styles.filterChipText}>{s} ★</Text>
                </Pressable>
              ))}
            </View>

            <Pressable
              style={styles.createReview}
              onPress={() => {
                if (!user) navigateShop("Login");
                else setMsg("Create review — use web form for photos (mobile stub).");
              }}
            >
              <Ionicons name="add" size={18} color={colors.secondary} />
              <Text style={styles.createReviewText}>Create review</Text>
            </Pressable>
          </View>

          {visibleReviews.map((r, i) => (
            <ReviewCard key={`${r.authorName}-${r.createdAtUtc}-${i}`} review={r} />
          ))}

          {filtered.length > reviewsVisible ? (
            <Pressable
              style={styles.seeMoreBtn}
              onPress={() => setReviewsVisible((n) => n + 3)}
            >
              <Text style={styles.seeMoreBtnText}>See more reviews</Text>
            </Pressable>
          ) : null}
        </View>

        <RelatedBlock
          title={`More ${product.category.name}`}
          items={related}
          onSeeMore={() =>
            navigateShop("Products", {
              categoryId: product.category.id,
              title: product.category.name,
            })
          }
          onProduct={(pid) => navigation.navigate("Product", { id: pid })}
        />
        <RelatedBlock
          title={`${product.category.name}: sale`}
          items={
            saleRelated.length
              ? saleRelated
              : related.filter((p) => p.oldPrice && p.oldPrice > p.price)
          }
          onSeeMore={() =>
            navigateShop("Products", {
              categoryId: product.category.id,
              title: "Sale",
              sort: "rating",
            })
          }
          onProduct={(pid) => navigation.navigate("Product", { id: pid })}
        />

        <SiteFooter />
      </ScrollView>

      {/* Sticky buy bar — Figma 1376:1973 */}
      <View style={[styles.sticky, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        <View style={styles.stickyTop}>
          <View style={styles.priceNow}>
            <Text style={styles.priceDollar}>$ </Text>
            <Text style={styles.priceWhole}>{whole}</Text>
            <Text style={styles.priceCents}>{cents}</Text>
          </View>
          {showOld ? (
            <Text style={styles.old}>$ {Number(product.oldPrice).toFixed(2)}</Text>
          ) : null}
          <Pressable style={styles.stickyHeart} onPress={() => void addWishlist()} hitSlop={8}>
            <Ionicons name="heart-outline" size={22} color={colors.darkText} />
          </Pressable>
          <Pressable
            style={[styles.btnToCart, (busy || oos) && styles.btnDisabled]}
            disabled={busy || oos}
            onPress={() => void addToCart(false)}
          >
            <Text style={styles.btnToCartText}>{busy ? "…" : "To cart"}</Text>
          </Pressable>
          <Pressable
            style={[styles.btnBuy, (busy || oos) && styles.btnDisabled]}
            disabled={busy || oos}
            onPress={() => void addToCart(true)}
          >
            <Text style={styles.btnBuyText}>Buy</Text>
          </Pressable>
        </View>
        <View style={styles.stickyQty}>
          <Text style={styles.stickyQtyLabel}>Quantity</Text>
          <View style={styles.qtyRow}>
            <Pressable style={styles.qtyBtn} onPress={() => setQty((q) => Math.max(1, q - 1))}>
              <Text style={styles.qtyBtnText}>−</Text>
            </Pressable>
            <Text style={styles.qty}>{qty}</Text>
            <Pressable style={styles.qtyBtn} onPress={() => setQty((q) => q + 1)}>
              <Text style={styles.qtyBtnText}>+</Text>
            </Pressable>
          </View>
        </View>
      </View>

      <Modal visible={!!infoKind} transparent animationType="slide" onRequestClose={() => setInfoKind(null)}>
        <Pressable style={styles.sheetBg} onPress={() => setInfoKind(null)} />
        <View style={styles.sheet}>
          <Pressable style={styles.sheetClose} onPress={() => setInfoKind(null)}>
            <Ionicons name="close" size={22} color={colors.darkText} />
          </Pressable>
          {infoKind ? (
            <>
              <Text style={styles.sheetTitle}>
                {INFO_ROWS.find((r) => r.key === infoKind)?.label}
              </Text>
              <Text style={styles.aboutBody}>
                {INFO_ROWS.find((r) => r.key === infoKind)?.body}
              </Text>
            </>
          ) : null}
        </View>
      </Modal>

      {/* See more slide-up — Figma 2006:7641 */}
      <Modal visible={seeMoreOpen} transparent animationType="slide" onRequestClose={() => setSeeMoreOpen(false)}>
        <Pressable style={styles.sheetBg} onPress={() => setSeeMoreOpen(false)} />
        <View style={[styles.sheet, styles.seeMoreSheet]}>
          <Pressable style={styles.sheetClose} onPress={() => setSeeMoreOpen(false)}>
            <Ionicons name="close" size={22} color={colors.darkText} />
          </Pressable>
          <Text style={styles.sheetTitle}>Product details</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            {product.sku ? <Text style={styles.code}>Code: {product.sku}</Text> : null}
            {pairAttributes(product).flat().map((cell) => (
              <View key={cell.label} style={styles.seeMoreRow}>
                <Text style={styles.detailsLabel}>{cell.label}</Text>
                <Text style={styles.detailsValue}>{cell.value}</Text>
              </View>
            ))}
            {aboutBlocks.map((a, i) => (
              <View key={`sm-${a.title}-${i}`} style={{ marginTop: 12 }}>
                <Text style={styles.aboutTitle}>{a.title}</Text>
                <Text style={styles.aboutBody}>{a.description}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

function RelatedBlock({
  title,
  items,
  onSeeMore,
  onProduct,
}: {
  title: string;
  items: ProductListItem[];
  onSeeMore: () => void;
  onProduct: (id: string) => void;
}) {
  if (!items.length) return null;
  const shown = items.slice(0, 4);
  return (
    <View style={styles.relatedSection}>
      <Text style={styles.sectionHCenter}>{title}</Text>
      <View style={styles.relatedList}>
        {shown.map((p) => (
          <ProductCard key={p.id} product={p} variant="related" onPress={() => onProduct(p.id)} />
        ))}
      </View>
      <Pressable style={styles.seeMoreBtn} onPress={onSeeMore}>
        <Text style={styles.seeMoreBtnText}>See more</Text>
      </Pressable>
    </View>
  );
}

function ReviewCard({ review }: { review: ProductReview }) {
  const date = review.createdAtUtc
    ? new Date(review.createdAtUtc).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "";
  return (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHead}>
        <View style={styles.avatar}>
          <Text style={styles.avatarLetter}>
            {(review.authorName || "?").charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.reviewAuthor}>{review.authorName}</Text>
        </View>
        <Text style={styles.reviewDate}>{date}</Text>
      </View>
      <View style={styles.starsRow}>
        {Array.from({ length: 5 }, (_, i) => (
          <Ionicons
            key={i}
            name={i < review.rating ? "star" : "star-outline"}
            size={14}
            color={colors.darkText}
          />
        ))}
      </View>
      {review.title ? <Text style={styles.reviewTitle}>{review.title}</Text> : null}
      <Text style={styles.reviewBody}>{review.body}</Text>
      {review.tags?.length ? (
        <View style={styles.tagsWrap}>
          {review.tags.slice(0, 3).map((t) => (
            <View key={t} style={styles.tagPill}>
              <Text style={styles.tagText} numberOfLines={1}>
                {t}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
      <View style={styles.reviewActions}>
        <Pressable style={styles.helpfulBtn}>
          <Text style={styles.helpfulText}>Helpful</Text>
        </Pressable>
        <Pressable style={styles.translateBtn}>
          <Text style={styles.translateText}>Translate</Text>
        </Pressable>
      </View>
    </View>
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

function pairAttributes(product: ProductDetail) {
  const list = [...(product.attributes ?? [])];
  if (product.brand && !list.some((a) => /brand/i.test(a.name))) {
    list.unshift({ name: "Brand", value: product.brand });
  }
  const pairs: { label: string; value: string }[][] = [];
  for (let i = 0; i < list.length; i += 2) {
    pairs.push(
      list.slice(i, i + 2).map((a) => ({ label: a.name, value: a.value })),
    );
  }
  return pairs;
}

function ratingDistribution(reviews: ProductReview[], fallbackCount: number) {
  const total = Math.max(1, reviews.length || fallbackCount);
  if (!reviews.length && fallbackCount > 0) {
    return { 5: 65, 4: 16, 3: 10, 2: 4, 1: 5 } as Record<number, number>;
  }
  return Object.fromEntries(
    [5, 4, 3, 2, 1].map((star) => [
      star,
      Math.round((100 * reviews.filter((r) => r.rating === star).length) / total),
    ]),
  ) as Record<number, number>;
}

function topTags(reviews: ProductReview[]) {
  const map: Record<string, number> = {};
  reviews.forEach((r) => r.tags?.forEach((t) => {
    map[t] = (map[t] ?? 0) + 1;
  }));
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([t]) => t);
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F7F9FC" },
  scroll: { paddingBottom: 0 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  error: { color: colors.destructive },
  crumbs: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: PAD,
    paddingTop: 12,
    paddingBottom: 8,
    flexWrap: "wrap",
  },
  crumbSep: { color: colors.muted, fontSize: 12 },
  crumbLink: { color: colors.darkText, fontSize: 12, fontWeight: "600", maxWidth: 120 },
  crumbCurrent: { color: colors.muted, fontSize: 12, flexShrink: 1, maxWidth: 160 },
  title: {
    paddingHorizontal: PAD,
    fontSize: 20,
    fontWeight: "800",
    color: colors.darkText,
    lineHeight: 26,
    marginBottom: 8,
  },
  metaRow: { paddingHorizontal: PAD, marginBottom: 4 },
  starsRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  starsRowCenter: { flexDirection: "row", alignItems: "center", gap: 4, justifyContent: "center", marginVertical: 6 },
  ratingNum: { marginLeft: 6, fontWeight: "800", color: colors.darkText, fontSize: 14 },
  reviewsCount: { marginLeft: 6, color: colors.muted, fontSize: 13 },
  code: { paddingHorizontal: PAD, color: colors.muted, fontSize: 12, marginBottom: 12 },
  gallery: { paddingHorizontal: PAD, marginBottom: 16 },
  mainWrap: {
    position: "relative",
    width: "100%",
    aspectRatio: 1,
    borderRadius: radii.md,
    overflow: "hidden",
    backgroundColor: "#F4F7FB",
  },
  mainImg: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  discBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: colors.white,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  discBadgeText: { fontWeight: "800", fontSize: 12, color: colors.darkText },
  heartOnPhoto: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.92)",
    alignItems: "center",
    justifyContent: "center",
  },
  galleryArrow: {
    position: "absolute",
    top: "45%",
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.85)",
    alignItems: "center",
    justifyContent: "center",
  },
  galleryArrowL: { left: 8 },
  galleryArrowR: { right: 8 },
  ph: { backgroundColor: "#D9D9D9" },
  thumbs: { gap: 8, paddingTop: 10 },
  thumb: {
    width: THUMB,
    height: THUMB,
    borderRadius: 6,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  thumbOn: { borderColor: colors.secondary },
  thumbImg: { width: "100%", height: "100%" },
  infoBlock: {
    marginHorizontal: PAD,
    marginBottom: 12,
    backgroundColor: colors.white,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: "rgba(74,123,217,0.2)",
    paddingHorizontal: 14,
    paddingTop: 4,
    paddingBottom: 10,
  },
  seeMoreLink: { alignItems: "center", paddingVertical: 8 },
  seeMoreLinkText: { color: colors.secondary, fontWeight: "800", fontSize: 14 },
  seeMoreSheet: { maxHeight: "70%" },
  seeMoreRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(14,32,66,0.1)",
    gap: 12,
  },
  sticky: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.objects,
    borderTopWidth: 1,
    borderTopColor: "rgba(14,32,66,0.12)",
    paddingHorizontal: 12,
    paddingTop: 10,
    gap: 8,
  },
  stickyTop: { flexDirection: "row", alignItems: "center", gap: 8 },
  stickyHeart: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  stickyQty: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  stickyQtyLabel: { fontWeight: "700", color: colors.darkText, fontSize: 14 },
  btnToCart: {
    borderWidth: 1.5,
    borderColor: colors.darkText,
    borderRadius: radii.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.white,
  },
  btnToCartText: { fontWeight: "800", fontSize: 13, color: colors.darkText },
  btnBuy: {
    backgroundColor: colors.darkText,
    borderRadius: radii.sm,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  btnBuyText: { fontWeight: "800", fontSize: 13, color: colors.white },
  section: { paddingHorizontal: PAD, marginBottom: 20 },
  sectionH: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.darkText,
    marginBottom: 10,
  },
  sectionHCenter: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.darkText,
    textAlign: "center",
    marginBottom: 12,
  },
  aboutCard: {
    backgroundColor: colors.white,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: "rgba(74,123,217,0.25)",
    padding: 14,
    marginBottom: 8,
  },
  aboutHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  aboutTitle: { fontSize: 15, fontWeight: "800", color: colors.darkText, flex: 1, paddingRight: 8 },
  aboutBody: { marginTop: 8, fontSize: 14, lineHeight: 20, color: colors.darkText },
  buyCard: {
    marginHorizontal: PAD,
    marginBottom: 20,
    backgroundColor: colors.white,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: "rgba(74,123,217,0.2)",
    padding: 16,
    gap: 10,
  },
  qtyRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(74,123,217,0.45)",
    borderRadius: radii.sm,
    overflow: "hidden",
    minWidth: 140,
  },
  qtyBtn: { paddingHorizontal: 16, paddingVertical: 8 },
  qtyBtnText: { fontSize: 18, fontWeight: "600", color: colors.darkText },
  qty: { minWidth: 36, textAlign: "center", fontWeight: "800", fontSize: 15, color: colors.darkText },
  btnDisabled: { opacity: 0.5 },
  msg: { marginHorizontal: PAD, color: colors.secondary, fontSize: 13, marginBottom: 8 },
  priceNow: { flexDirection: "row", alignItems: "flex-start", flexShrink: 0 },
  priceDollar: { fontSize: 22, fontWeight: "700", color: colors.darkText, lineHeight: 28 },
  priceWhole: { fontSize: 22, fontWeight: "700", color: colors.darkText, lineHeight: 28 },
  priceCents: { fontSize: 12, fontWeight: "700", color: colors.darkText, marginTop: 2 },
  old: { fontSize: 12, color: colors.muted, textDecorationLine: "line-through", marginRight: "auto" },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(14,32,66,0.12)",
  },
  infoLabel: { fontSize: 15, color: colors.darkText, fontWeight: "600" },
  detailsCard: {
    backgroundColor: colors.white,
    borderRadius: radii.md,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(74,123,217,0.2)",
  },
  detailsRow: { flexDirection: "row", gap: 12, paddingVertical: 10 },
  detailsRowBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderStyle: "dashed",
    borderTopColor: "rgba(74,123,217,0.35)",
  },
  detailsCell: { flex: 1 },
  detailsLabel: { fontSize: 12, color: colors.muted, marginBottom: 2 },
  detailsValue: { fontSize: 14, fontWeight: "700", color: colors.darkText },
  reviewsSummary: {
    backgroundColor: colors.white,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: "rgba(74,123,217,0.25)",
    padding: 16,
    marginBottom: 12,
  },
  bigRating: { fontSize: 28, fontWeight: "800", color: colors.darkText, textAlign: "center" },
  reviewsMuted: { textAlign: "center", color: colors.muted, marginBottom: 12 },
  barRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 },
  barLabel: { width: 12, fontSize: 12, fontWeight: "700", color: colors.darkText },
  barTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E4EBF7",
    overflow: "hidden",
  },
  barFill: { height: "100%", backgroundColor: "#2F9E44" },
  barPct: { width: 36, textAlign: "right", fontSize: 12, color: colors.muted },
  confirmed: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 10, marginBottom: 8 },
  confirmedText: { fontSize: 12, color: colors.muted, flex: 1 },
  tagsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 10 },
  tagPill: {
    backgroundColor: "#E8F0FF",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  tagText: { fontSize: 12, color: colors.darkText, fontWeight: "600" },
  filterRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 10 },
  filterChip: {
    borderWidth: 1,
    borderColor: "rgba(74,123,217,0.4)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  filterChipOn: { backgroundColor: colors.objects, borderColor: colors.secondary },
  filterChipText: { fontSize: 13, fontWeight: "600", color: colors.darkText },
  createReview: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1.5,
    borderColor: colors.secondary,
    borderRadius: radii.sm,
    paddingVertical: 12,
  },
  createReviewText: { color: colors.secondary, fontWeight: "800" },
  reviewCard: {
    backgroundColor: colors.white,
    borderRadius: radii.md,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(14,32,66,0.08)",
  },
  reviewHead: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.objects,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetter: { fontWeight: "800", color: colors.darkText },
  reviewAuthor: { fontWeight: "700", color: colors.darkText },
  reviewDate: { fontSize: 12, color: colors.muted },
  reviewTitle: { fontWeight: "800", color: colors.darkText, marginTop: 6, marginBottom: 4 },
  reviewBody: { fontSize: 14, lineHeight: 20, color: colors.darkText, marginBottom: 8 },
  reviewActions: { flexDirection: "row", gap: 10, marginTop: 4 },
  helpfulBtn: {
    borderWidth: 1,
    borderColor: colors.secondary,
    borderRadius: radii.sm,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  helpfulText: { color: colors.darkText, fontWeight: "700", fontSize: 13 },
  translateBtn: {
    borderWidth: 1,
    borderColor: "rgba(74,123,217,0.4)",
    borderRadius: radii.sm,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  translateText: { color: colors.secondary, fontWeight: "700", fontSize: 13 },
  seeMoreBtn: {
    alignSelf: "center",
    borderWidth: 1.5,
    borderColor: colors.secondary,
    borderRadius: radii.sm,
    paddingHorizontal: 28,
    paddingVertical: 12,
    marginTop: 4,
    marginBottom: 8,
  },
  seeMoreBtnText: { color: colors.secondary, fontWeight: "800" },
  relatedSection: { paddingHorizontal: PAD, marginBottom: 24 },
  relatedList: { flexDirection: "column", gap: 12, marginBottom: 8 },
  sheetBg: { flex: 1, backgroundColor: colors.overlay },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    paddingBottom: 40,
  },
  sheetClose: { alignSelf: "flex-end", marginBottom: 8 },
  sheetTitle: { fontSize: 18, fontWeight: "800", color: colors.darkText, marginBottom: 10 },
});
