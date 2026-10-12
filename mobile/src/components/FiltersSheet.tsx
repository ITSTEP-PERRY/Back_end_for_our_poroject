import { useEffect, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radii, space } from "../theme/colors";

export type FiltersValue = {
  brands: string[];
  fabrics: string[];
  sizes: string[];
  colors: string[];
  minRating?: number;
};

export type FiltersFacets = {
  brands: string[];
  fabrics: string[];
  sizes: string[];
  colors: string[];
};

type ChipKey = "brands" | "fabrics" | "sizes" | "colors";

type Props = {
  visible: boolean;
  onClose: () => void;
  facets?: FiltersFacets;
  value: FiltersValue;
  onApply: (next: FiltersValue) => void;
};

export const EMPTY_FILTERS: FiltersValue = { brands: [], fabrics: [], sizes: [], colors: [] };

export function countFilters(v: FiltersValue): number {
  return v.brands.length + v.fabrics.length + v.sizes.length + v.colors.length + (v.minRating ? 1 : 0);
}

/**
 * Figma Product List `839:1735` — Filters pill opens this bottom sheet.
 * Facets come from `productsApi.list().facets`; still works if API returns none (stub chips hidden).
 */
export function FiltersSheet({ visible, onClose, facets, value, onApply }: Props) {
  const [draft, setDraft] = useState<FiltersValue>(value);

  useEffect(() => {
    if (visible) setDraft(value);
  }, [visible, value]);

  const toggle = (key: ChipKey, option: string) => {
    setDraft((d) => {
      const list = d[key];
      return {
        ...d,
        [key]: list.includes(option) ? list.filter((x) => x !== option) : [...list, option],
      };
    });
  };

  const renderGroup = (title: string, key: ChipKey, options?: string[]) => {
    if (!options?.length) return null;
    return (
      <View style={styles.group}>
        <Text style={styles.groupTitle}>{title}</Text>
        <View style={styles.chipsWrap}>
          {options.map((opt) => {
            const on = draft[key].includes(opt);
            return (
              <Pressable key={opt} style={[styles.chip, on && styles.chipOn]} onPress={() => toggle(key, opt)}>
                <Text style={[styles.chipText, on && styles.chipTextOn]}>{opt}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  };

  const draftCount = countFilters(draft);
  const hasFacets = !!(facets?.brands.length || facets?.fabrics.length || facets?.sizes.length || facets?.colors.length);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <View style={styles.header}>
          <Text style={styles.title}>Filters</Text>
          <Pressable onPress={onClose} hitSlop={10} accessibilityLabel="Close">
            <Ionicons name="close" size={22} color={colors.darkText} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
          {renderGroup("Brand", "brands", facets?.brands)}
          {renderGroup("Fabric", "fabrics", facets?.fabrics)}
          {renderGroup("Size", "sizes", facets?.sizes)}
          {renderGroup("Color", "colors", facets?.colors)}

          <View style={styles.group}>
            <Text style={styles.groupTitle}>Minimum rating</Text>
            <View style={styles.chipsWrap}>
              {[5, 4, 3, 2, 1].map((r) => {
                const on = draft.minRating === r;
                return (
                  <Pressable
                    key={r}
                    style={[styles.chip, styles.ratingChip, on && styles.chipOn]}
                    onPress={() => setDraft((d) => ({ ...d, minRating: on ? undefined : r }))}
                  >
                    <Ionicons name="star" size={13} color={on ? colors.white : colors.star} />
                    <Text style={[styles.chipText, on && styles.chipTextOn]}>{r}+</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {!hasFacets ? (
            <Text style={styles.hint}>More filters appear once the catalog returns facets for this list.</Text>
          ) : null}
        </ScrollView>

        <View style={styles.actions}>
          <Pressable
            style={styles.resetBtn}
            onPress={() => {
              setDraft(EMPTY_FILTERS);
              onApply(EMPTY_FILTERS);
            }}
          >
            <Text style={styles.resetText}>Reset</Text>
          </Pressable>
          <Pressable
            style={styles.applyBtn}
            onPress={() => {
              onApply(draft);
              onClose();
            }}
          >
            <Text style={styles.applyText}>
              {draftCount > 0 ? `Show results (${draftCount})` : "Show results"}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.overlay },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: "82%",
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  title: { fontSize: 18, fontWeight: "800", color: colors.darkText },
  body: { paddingBottom: 12, gap: 4 },
  group: { marginTop: 16 },
  groupTitle: { fontSize: 14, fontWeight: "700", color: colors.darkText, marginBottom: 10 },
  chipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 12,
    height: 34,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  ratingChip: { flexDirection: "row", gap: 4, paddingHorizontal: 14 },
  chipOn: { backgroundColor: colors.darkText, borderColor: colors.darkText },
  chipText: { fontSize: 13, fontWeight: "600", color: colors.darkText },
  chipTextOn: { color: colors.white },
  hint: { marginTop: 16, fontSize: 12, color: colors.muted, textAlign: "center" },
  actions: {
    flexDirection: "row",
    gap: 10,
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  resetBtn: {
    paddingHorizontal: 18,
    height: 48,
    borderRadius: radii.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  resetText: { fontWeight: "700", color: colors.darkText },
  applyBtn: {
    flex: 1,
    height: 48,
    borderRadius: radii.sm,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  applyText: { fontWeight: "800", color: colors.darkText },
});
