import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { productsApi } from "../api";
import type { ProductListItem } from "../api/types";
import { ProductCard } from "../components/ProductCard";
import { SiteFooter } from "../components/SiteFooter";
import { countFilters, EMPTY_FILTERS, FiltersSheet, type FiltersFacets, type FiltersValue } from "../components/FiltersSheet";
import { colors, radii, space } from "../theme/colors";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "Products">;

const SORTS: { id: string; label: string }[] = [
  { id: "newest", label: "Newest" },
  { id: "price_asc", label: "Cheap to expensive" },
  { id: "price_desc", label: "Expensive to cheap" },
  { id: "rating", label: "Top rated" },
];

/**
 * Figma Product List `839:1735` — breadcrumb/title, Filters + sort row, 2-col grid, pagination.
 */
export function ProductsScreen({ navigation, route }: Props) {
  const { categoryId, search, sort: sortParam, title } = route.params ?? {};
  const [items, setItems] = useState<ProductListItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [sort, setSort] = useState(sortParam || "newest");
  const [sortOpen, setSortOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<FiltersValue>(EMPTY_FILTERS);
  const [facets, setFacets] = useState<FiltersFacets | undefined>(undefined);

  const load = useCallback(
    async (p = 1, append = false) => {
      setError(null);
      try {
        const res = await productsApi.list({
          categoryId,
          search,
          sort,
          page: p,
          pageSize: 20,
          brands: filters.brands,
          fabrics: filters.fabrics,
          sizes: filters.sizes,
          colors: filters.colors,
          minRating: filters.minRating,
        });
        setItems((prev) => (append ? [...prev, ...res.items] : res.items));
        setPage(res.page);
        setTotalPages(res.totalPages || 1);
        if (res.facets) setFacets(res.facets);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    [categoryId, search, sort, filters],
  );

  useEffect(() => {
    setLoading(true);
    load(1, false);
  }, [load]);

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const sortLabel = SORTS.find((s) => s.id === sort)?.label || "Sort";

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.darkText} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.top}>
        <Text style={styles.crumb} numberOfLines={1}>
          {search ? `Search` : "/ Catalog"}
          {title ? ` / ${title}` : ""}
        </Text>
        <Text style={styles.h1}>{title || (search ? "Search results" : "Catalog")}</Text>
      </View>

      <View style={styles.toolbar}>
        <Pressable style={styles.filtersBtn} onPress={() => setFiltersOpen(true)}>
          <Ionicons name="options-outline" size={20} color={colors.darkText} />
          <Text style={styles.filtersText}>
            {countFilters(filters) > 0 ? `${countFilters(filters)} applied` : "Filters"}
          </Text>
        </Pressable>
        <Pressable style={styles.sortBtn} onPress={() => setSortOpen(true)}>
          <Text style={styles.sortText} numberOfLines={1}>
            {sortLabel}
          </Text>
          <Ionicons name="chevron-down" size={16} color={colors.darkText} />
        </Pressable>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        numColumns={2}
        contentContainerStyle={styles.list}
        columnWrapperStyle={styles.row}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load(1, false);
            }}
          />
        }
        ListEmptyComponent={<Text style={styles.empty}>No products found</Text>}
        ListFooterComponent={
          <View>
            {totalPages > 1 ? (
              <View style={styles.pager}>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const p = i + 1;
                  return (
                    <Pressable
                      key={p}
                      style={[styles.pageBtn, page === p && styles.pageBtnOn]}
                      onPress={() => {
                        setLoading(true);
                        load(p, false);
                      }}
                    >
                      <Text style={[styles.pageBtnText, page === p && styles.pageBtnTextOn]}>
                        {p}
                      </Text>
                    </Pressable>
                  );
                })}
                {page < totalPages ? (
                  <Pressable
                    style={styles.pageBtn}
                    onPress={() => {
                      setLoading(true);
                      load(page + 1, false);
                    }}
                  >
                    <Text style={styles.pageBtnText}>›</Text>
                  </Pressable>
                ) : null}
              </View>
            ) : null}
            <SiteFooter />
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.cell}>
            <ProductCard
              product={item}
              variant="grid"
              onPress={() => navigation.navigate("Product", { id: item.id })}
            />
          </View>
        )}
      />

      <Modal visible={sortOpen} animationType="slide" transparent onRequestClose={() => setSortOpen(false)}>
        <Pressable style={styles.sheetBackdrop} onPress={() => setSortOpen(false)} />
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>Sort by</Text>
          <ScrollView>
            {SORTS.map((s) => (
              <Pressable
                key={s.id}
                style={styles.sheetRow}
                onPress={() => {
                  setSort(s.id);
                  setSortOpen(false);
                }}
              >
                <Text style={styles.sheetRowText}>{s.label}</Text>
                {sort === s.id ? <Ionicons name="checkmark" size={20} color={colors.darkText} /> : null}
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </Modal>

      <FiltersSheet
        visible={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        facets={facets}
        value={filters}
        onApply={setFilters}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  top: { paddingHorizontal: space.lg, paddingTop: space.sm },
  crumb: { fontSize: 12, color: colors.muted, marginBottom: 4 },
  h1: { fontSize: 24, fontWeight: "800", color: colors.darkText, marginBottom: 8 },
  toolbar: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: space.lg,
    paddingVertical: 12,
    backgroundColor: colors.objects,
    marginBottom: 4,
  },
  filtersBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.white,
    borderRadius: radii.pill,
    paddingHorizontal: 14,
    height: 38,
    borderWidth: 1,
    borderColor: "rgba(14,32,66,0.12)",
  },
  filtersText: { fontWeight: "700", color: colors.darkText, fontSize: 13 },
  sortBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.white,
    borderRadius: radii.sm,
    paddingHorizontal: 12,
    height: 38,
    borderWidth: 1,
    borderColor: "rgba(14,32,66,0.12)",
    gap: 6,
  },
  sortText: { flex: 1, fontWeight: "600", color: colors.darkText, fontSize: 13 },
  list: { paddingHorizontal: 16, paddingBottom: 32, gap: 16 },
  row: { justifyContent: "space-between", gap: 16, marginBottom: 16 },
  cell: { width: 171 },
  error: { marginHorizontal: 16, color: colors.destructive },
  empty: { textAlign: "center", marginTop: 40, color: colors.muted },
  pager: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginVertical: 20,
  },
  pageBtn: {
    minWidth: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(14,32,66,0.2)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    backgroundColor: colors.white,
  },
  pageBtnOn: { backgroundColor: colors.darkText, borderColor: colors.darkText },
  pageBtnText: { fontWeight: "700", color: colors.darkText },
  pageBtnTextOn: { color: colors.white },
  sheetBackdrop: { flex: 1, backgroundColor: colors.overlay },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    maxHeight: "55%",
  },
  sheetTitle: { fontSize: 18, fontWeight: "800", color: colors.darkText, marginBottom: 12 },
  sheetRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  sheetRowText: { fontSize: 15, color: colors.darkText },
});
