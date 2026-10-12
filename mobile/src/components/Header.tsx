import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconCart, IconMenu, IconSearch } from "./FigmaIcons";
import { colors, radii } from "../theme/colors";

type Props = {
  search?: string;
  onSearchChange?: (v: string) => void;
  onSearchSubmit?: () => void;
  onMenu: () => void;
  onCart: () => void;
  cartCount?: number;
};

/**
 * Figma / web site-header — фон `--header` #4A7BD9, белый логотип и иконки,
 * поиск #F4FAFF + кнопка #B8EA48 (как storefront.css).
 */
export function Header({
  search = "",
  onSearchChange,
  onSearchSubmit,
  onMenu,
  onCart,
  cartCount = 0,
}: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.wrap, { paddingTop: Math.max(insets.top, 0) }]}>
      <View style={styles.row}>
        <Pressable onPress={onMenu} hitSlop={8} accessibilityLabel="Menu" style={styles.iconHit}>
          <IconMenu size={28} color={colors.white} />
        </Pressable>

        <Text style={styles.logo}>PERRY</Text>

        <View style={styles.search}>
          <TextInput
            value={search}
            onChangeText={onSearchChange}
            onSubmitEditing={onSearchSubmit}
            placeholder="Search..."
            placeholderTextColor="rgba(14, 32, 66, 0.5)"
            style={styles.searchInput}
            returnKeyType="search"
          />
          <Pressable onPress={onSearchSubmit} style={styles.searchBtn} accessibilityLabel="Search">
            <IconSearch size={18} color={colors.darkText} />
          </Pressable>
        </View>

        <Pressable onPress={onCart} hitSlop={8} accessibilityLabel="Cart" style={styles.iconHit}>
          <View>
            <IconCart size={24} color={colors.white} />
            {cartCount > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{cartCount > 99 ? "99+" : cartCount}</Text>
              </View>
            ) : null}
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.header,
  },
  row: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 8,
  },
  iconHit: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.white,
    letterSpacing: 1,
  },
  search: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.objects,
    borderRadius: 4,
    height: 36,
    paddingLeft: 12,
    overflow: "hidden",
    minWidth: 0,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.darkText,
    paddingVertical: 0,
    minWidth: 0,
  },
  searchBtn: {
    width: 44,
    height: 36,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    right: -6,
    top: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  badgeText: { fontSize: 10, fontWeight: "800", color: colors.darkText },
});
