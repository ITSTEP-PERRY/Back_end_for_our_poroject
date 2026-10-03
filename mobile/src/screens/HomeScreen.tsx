import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { categoriesApi, productsApi } from "../api";
import { resolveMediaUrl } from "../api/media";
import type { CategoryDto, ProductListItem } from "../api/types";
import { ProductCard } from "../components/ProductCard";
import { SiteFooter } from "../components/SiteFooter";
import { useAuth } from "../auth/AuthContext";
import { BREAKPOINT_COMPACT, colors, radii, space } from "../theme/colors";
import { navigateShop } from "../navigation/navigationRef";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

const HERO_COMPACT = [
  {
    source: require("../../assets/home/hero-kitchen-mobile.png"),
    fallback: require("../../assets/home/hero-slide-1.png"),
    alt: "Upgrade kitchenware today. Sale -50%",
  },
  {
    source: require("../../assets/home/hero-beach-mobile.png"),
    fallback: require("../../assets/home/hero-slide-2.png"),
    alt: "Beach ready. Sale on swimsuits",
  },
] as const;

const HERO_WIDE = [
  {
    source: require("../../assets/home/hero-slide-1.png"),
    alt: "Upgrade kitchenware today. Sale -50%",
  },
  {
    source: require("../../assets/home/hero-slide-2.png"),
    alt: "Beach ready. Sale on swimsuits",
  },
] as const;

export function HomeScreen({ navigation }: Props) {
  const { width: winW } = useWindowDimensions();
  const compact = winW < BREAKPOINT_COMPACT;
  const sidePad = compact ? 0 : space.lg;
  const heroW = winW - sidePad * 2;
  /** Figma Main hero Group 247: 390×220 */
  const heroH = compact ? 220 : Math.round(heroW / (1600 / 352));
  const catCardW = 171;

  const heroSlides = useMemo(
    () =>
      compact
        ? HERO_COMPACT.map((s) => ({ source: s.source, alt: s.alt }))
        : HERO_WIDE.map((s) => ({ source: s.source, alt: s.alt })),
    [compact],
  );

  const { user } = useAuth();
  const [cats, setCats] = useState<CategoryDto[]>([]);
  const [trending, setTrending] = useState<ProductListItem[]>([]);
  const [sale, setSale] = useState<ProductListItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [heroIndex, setHeroIndex] = useState(0);
  const heroRef = useRef<ScrollView>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [c, t, b] = await Promise.all([
        categoriesApi.tree(),
        productsApi.list({ pageSize: 12, sort: "newest" }),
        productsApi.list({ pageSize: 12, sort: "rating" }),
      ]);
      setCats(c);
      setTrending(t.items);
      setSale(b.items.length ? b.items : t.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (heroSlides.length < 2) return;
    const id = setInterval(() => {
      setHeroIndex((h) => {
        const next = (h + 1) % heroSlides.length;
        heroRef.current?.scrollTo({ x: next * heroW, animated: true });
        return next;
      });
    }, 6000);
    return () => clearInterval(id);
  }, [heroSlides.length, heroW]);

  const onHeroScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const i = Math.round(x / heroW);
    if (i !== heroIndex && i >= 0 && i < heroSlides.length) setHeroIndex(i);
  };

  const topCats = cats.slice(0, Math.ceil(cats.length / 2) || cats.length);
  const bottomCats = cats.slice(Math.ceil(cats.length / 2));

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.darkText} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            load();
          }}
        />
      }
    >
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={[styles.heroWrap, { paddingHorizontal: sidePad, marginTop: compact ? 0 : space.md }]}>
        <View style={[styles.heroFrame, !compact && styles.heroFrameWide, { height: heroH }]}>
          <ScrollView
            ref={heroRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={onHeroScroll}
            decelerationRate="fast"
            style={{ width: heroW }}
          >
            {heroSlides.map((slide, i) => (
              <Pressable
                key={`${compact ? "m" : "d"}-${i}`}
                style={{ width: heroW, height: heroH }}
                onPress={() => navigation.navigate("Products", {})}
              >
                <Image
                  source={slide.source}
                  style={{ width: heroW, height: heroH }}
                  resizeMode="cover"
                  accessibilityLabel={slide.alt}
                />
              </Pressable>
            ))}
          </ScrollView>
          <View style={styles.dots}>
            {heroSlides.map((_, i) => (
              <View key={i} style={[styles.dot, i === heroIndex && styles.dotActive]} />
            ))}
          </View>
        </View>
      </View>

      <CategoryRail
        items={topCats.length ? topCats : cats}
        cardW={catCardW}
        onPress={(c) => navigation.navigate("Products", { categoryId: c.id, title: c.name })}
      />

      <ProductRail
        title="Trending deals"
        items={trending}
        onSeeAll={() => navigation.navigate("Products", { sort: "newest", title: "Trending deals" })}
        onProduct={(id) => navigation.navigate("Product", { id })}
      />

      <Pressable style={styles.shopCta} onPress={() => navigation.navigate("Products", {})}>
        <View style={styles.shopCtaInner}>
          <View style={styles.shopCtaCopy}>
            <Text style={[styles.shopCtaTitle, compact && { fontSize: 24 }]}>Shop now</Text>
            <Text style={styles.shopCtaSub}>Deals and favourites await</Text>
          </View>
          <Image
            source={require("../../assets/home/cta-chest.png")}
            style={[styles.shopChest, compact && { width: 84, height: 84 }]}
            resizeMode="contain"
          />
        </View>
      </Pressable>

      {bottomCats.length > 0 ? (
        <CategoryRail
          items={bottomCats}
          cardW={catCardW}
          onPress={(c) => navigation.navigate("Products", { categoryId: c.id, title: c.name })}
        />
      ) : null}

      <ProductRail
        title="Sale"
        items={sale}
        onSeeAll={() => navigation.navigate("Products", { sort: "rating", title: "Sale" })}
        onProduct={(id) => navigation.navigate("Product", { id })}
      />

      {/* Нижний баннер Figma Group 887 + футер */}
      <View style={styles.bottomBanner}>
        <Image
          source={require("../../assets/home/cta-banner.png")}
          style={styles.bottomBannerImg}
          resizeMode="cover"
        />
        <View style={styles.bottomBannerCopy}>
          <Text style={styles.authTitle}>Be aware of the variety</Text>
          <Text style={styles.authSub}>Join, choose and buy with confidence!</Text>
          <View style={styles.authActions}>
            {user ? (
              <Pressable style={styles.authPrimary} onPress={() => navigation.navigate("Products", {})}>
                <Text style={styles.authPrimaryText}>Go to catalog</Text>
              </Pressable>
            ) : (
              <>
                <Pressable
                  style={styles.authPrimary}
                  onPress={() => navigateShop("Register")}
                >
                  <Text style={styles.authPrimaryText}>Sign in</Text>
                </Pressable>
                <Pressable
                  style={styles.authGhost}
                  onPress={() => navigateShop("Login")}
                >
                  <Text style={styles.authGhostText}>Log in</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </View>

      <SiteFooter />
    </ScrollView>
  );
}

function CategoryRail({
  items,
  cardW,
  onPress,
}: {
  items: CategoryDto[];
  cardW: number;
  onPress: (c: CategoryDto) => void;
}) {
  const ref = useRef<ScrollView>(null);
  const offset = useRef(0);
  if (!items.length) return null;

  const scroll = (dir: 1 | -1) => {
    const next = Math.max(0, offset.current + dir * (cardW + 12));
    offset.current = next;
    ref.current?.scrollTo({ x: next, animated: true });
  };

  return (
    <View style={styles.railBlock}>
      <View style={styles.railHead}>
        <View style={{ flex: 1 }} />
        <View style={styles.arrows}>
          <ArrowBtn onPress={() => scroll(-1)} icon="chevron-back" />
          <ArrowBtn onPress={() => scroll(1)} icon="chevron-forward" />
        </View>
      </View>
      <ScrollView
        ref={ref}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.catTrack}
        onScroll={(e) => {
          offset.current = e.nativeEvent.contentOffset.x;
        }}
        scrollEventThrottle={16}
      >
        {items.map((cat) => {
          const img = resolveMediaUrl(cat.imageUrl) || resolveMediaUrl(cat.iconUrl);
          return (
            <Pressable key={cat.id} style={[styles.catCard, { width: cardW }]} onPress={() => onPress(cat)}>
              <View style={styles.catImgWrap}>
                {img ? (
                  <Image source={{ uri: img }} style={styles.catImg} resizeMode="cover" />
                ) : (
                  <View style={[styles.catImg, styles.catPlaceholder]}>
                    <Text style={styles.catPlaceholderLetter}>{cat.name.slice(0, 1)}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.catTitle} numberOfLines={2}>
                {cat.name}
              </Text>
              <Text style={styles.catLink}>See all ›</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

function ProductRail({
  title,
  items,
  onSeeAll,
  onProduct,
}: {
  title: string;
  items: ProductListItem[];
  onSeeAll: () => void;
  onProduct: (id: string) => void;
}) {
  const ref = useRef<ScrollView>(null);
  const offset = useRef(0);

  if (!items.length) return null;

  const scroll = (dir: 1 | -1) => {
    const next = Math.max(0, offset.current + dir * 168 * 2);
    offset.current = next;
    ref.current?.scrollTo({ x: next, animated: true });
  };

  return (
    <View style={styles.railBlock}>
      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <View style={styles.sectionRight}>
          <Pressable onPress={onSeeAll}>
            <Text style={styles.seeAll}>See all &gt;</Text>
          </Pressable>
          <View style={styles.arrows}>
            <ArrowBtn onPress={() => scroll(-1)} icon="chevron-back" />
            <ArrowBtn onPress={() => scroll(1)} icon="chevron-forward" />
          </View>
        </View>
      </View>
      <ScrollView
        ref={ref}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.productTrack}
        onScroll={(e) => {
          offset.current = e.nativeEvent.contentOffset.x;
        }}
        scrollEventThrottle={16}
      >
        {items.map((p) => (
          <ProductCard key={p.id} product={p} variant="rail" onPress={() => onProduct(p.id)} />
        ))}
      </ScrollView>
    </View>
  );
}

function ArrowBtn({
  onPress,
  icon,
}: {
  onPress: () => void;
  icon: "chevron-back" | "chevron-forward";
}) {
  return (
    <Pressable style={styles.arrowBtn} onPress={onPress} hitSlop={8}>
      <Ionicons name={icon} size={18} color={colors.darkText} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  content: { paddingBottom: 40 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  error: {
    margin: space.lg,
    padding: space.md,
    backgroundColor: "#FFCCCC",
    color: colors.destructive,
    borderRadius: radii.sm,
  },

  heroWrap: { marginBottom: space.sm },
  heroFrame: {
    overflow: "hidden",
    backgroundColor: colors.darkText,
    position: "relative",
  },
  heroFrameWide: { borderRadius: radii.md },
  dots: {
    position: "absolute",
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.55)",
  },
  dotActive: { backgroundColor: colors.white, width: 18 },

  railBlock: { marginTop: space.md, marginBottom: space.xs },
  railHead: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: space.lg,
    marginBottom: space.sm,
  },
  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: space.lg,
    marginBottom: space.sm,
    gap: space.sm,
  },
  sectionTitle: { fontSize: 20, fontWeight: "800", color: colors.darkText, flexShrink: 1 },
  sectionRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  seeAll: { color: colors.secondary, fontWeight: "700", fontSize: 13 },
  arrows: { flexDirection: "row", gap: 6 },
  arrowBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.objects,
    alignItems: "center",
    justifyContent: "center",
  },

  catTrack: { paddingHorizontal: space.md, gap: space.md },
  catCard: {
    height: 189,
    backgroundColor: "#F0F0F0",
    borderRadius: 4,
    paddingTop: 16,
    alignItems: "center",
  },
  catImgWrap: {
    width: 139,
    height: 87,
    borderRadius: 4,
    overflow: "hidden",
    backgroundColor: "#E8E8E8",
    alignSelf: "center",
  },
  catImg: { width: "100%", height: "100%" },
  catPlaceholder: {
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  catPlaceholderLetter: { fontSize: 28, fontWeight: "800", color: colors.darkText },
  catTitle: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: "600",
    color: colors.darkText,
    textAlign: "center",
    minHeight: 36,
    paddingHorizontal: 8,
  },
  catLink: { marginTop: 8, fontSize: 12, color: colors.darkText, fontWeight: "500", textAlign: "center" },

  productTrack: { paddingHorizontal: 10, paddingBottom: 4 },

  shopCta: {
    marginHorizontal: space.lg,
    marginTop: space.lg,
    marginBottom: space.sm,
    borderRadius: radii.md,
    overflow: "hidden",
    backgroundColor: colors.primary,
  },
  shopCtaInner: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: space.lg,
    paddingHorizontal: 18,
    minHeight: 112,
  },
  shopCtaCopy: { flex: 1, gap: 4 },
  shopCtaTitle: { fontSize: 28, fontWeight: "800", color: colors.darkText },
  shopCtaSub: { fontSize: 13, color: colors.darkText, opacity: 0.75 },
  shopChest: { width: 96, height: 96 },

  bottomBanner: {
    marginHorizontal: space.lg,
    marginTop: 20,
    marginBottom: space.md,
    borderRadius: radii.sm,
    overflow: "hidden",
    backgroundColor: colors.objects,
  },
  bottomBannerImg: {
    width: "100%",
    height: 139,
  },
  bottomBannerCopy: {
    paddingHorizontal: space.lg,
    paddingVertical: space.lg,
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.objects,
  },
  authTitle: { fontSize: 22, fontWeight: "700", color: colors.darkText, textAlign: "center" },
  authSub: { fontSize: 16, color: colors.darkText, textAlign: "center", marginBottom: 4 },
  authActions: { flexDirection: "row", gap: 16, flexWrap: "wrap", justifyContent: "center" },
  authPrimary: {
    backgroundColor: colors.primary,
    paddingHorizontal: 28,
    paddingVertical: 10,
    borderRadius: 4,
  },
  authPrimaryText: { fontWeight: "700", fontSize: 16, color: colors.darkText },
  authGhost: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.darkText,
    paddingHorizontal: 28,
    paddingVertical: 10,
    borderRadius: 4,
  },
  authGhostText: { fontWeight: "700", fontSize: 16, color: colors.darkText },
});
