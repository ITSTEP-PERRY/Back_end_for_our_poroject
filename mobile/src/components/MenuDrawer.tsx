import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../auth/AuthContext";
import { colors, radii } from "../theme/colors";
import { navigateShop, type ShopRoute } from "../navigation/navigationRef";

type Props = {
  open: boolean;
  onClose: () => void;
};

/**
 * Figma Menu customer `2004:5947` / guest `2006:9189` — полноэкранная белая панель.
 */
export function MenuDrawer({ open, onClose }: Props) {
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();

  const go = (route: ShopRoute) => {
    onClose();
    // небольшая задержка, чтобы Modal успел закрыться на web
    setTimeout(() => navigateShop(route), 50);
  };

  return (
    <Modal visible={open} animationType="fade" transparent onRequestClose={onClose}>
      <View style={[styles.panel, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.head}>
          <Text style={styles.logo}>PERRY</Text>
          <Pressable onPress={onClose} hitSlop={10} accessibilityLabel="Close">
            <Ionicons name="close" size={28} color={colors.darkText} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
          {user ? (
            <>
              <MenuItem label="My orders" onPress={() => go("Orders")} />
              <MenuItem label="Wishlist" onPress={() => go("Wishlist")} />
              <MenuItem label="My reviews" onPress={() => go("Reviews")} />
              <MenuItem label="Settings" onPress={() => go("Settings")} />
              <MenuItem label="Catalog" onPress={() => go("Products")} />
              <MenuItem
                label="Log out"
                onPress={async () => {
                  await logout();
                  onClose();
                }}
              />
            </>
          ) : (
            <>
              <Pressable style={styles.signUp} onPress={() => go("Register")}>
                <Text style={styles.signUpText}>Sign up</Text>
              </Pressable>
              <Pressable style={styles.logIn} onPress={() => go("Login")}>
                <Text style={styles.logInText}>Log in</Text>
              </Pressable>
              <View style={{ height: 16 }} />
              <MenuItem label="Catalog" onPress={() => go("Products")} />
            </>
          )}

          <View style={{ height: 12 }} />
          <MenuItem label="Terms of Use" onPress={() => go("Terms")} />
          <MenuItem label="License agreement" onPress={() => go("License")} />
          <MenuItem label="Privacy Policy" onPress={() => go("Privacy")} />
          <MenuItem label="Contact us" onPress={() => go("Contact")} />
          <MenuItem label="FAQ" onPress={() => go("FAQ")} />
        </ScrollView>
      </View>
    </Modal>
  );
}

function MenuItem({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable style={styles.item} onPress={onPress}>
      <Text style={styles.itemText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  panel: {
    flex: 1,
    backgroundColor: colors.white,
    paddingHorizontal: 20,
  },
  head: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 16,
    marginBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(14,32,66,0.1)",
    shadowColor: "#0E2042",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  logo: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.darkText,
    letterSpacing: 1.4,
  },
  body: { paddingTop: 12, paddingBottom: 40 },
  signUp: {
    backgroundColor: colors.primary,
    borderRadius: radii.sm,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 12,
  },
  signUpText: { fontWeight: "800", fontSize: 16, color: colors.darkText },
  logIn: {
    borderWidth: 1.5,
    borderColor: colors.darkText,
    borderRadius: radii.sm,
    paddingVertical: 14,
    alignItems: "center",
  },
  logInText: { fontWeight: "700", fontSize: 16, color: colors.darkText },
  item: {
    paddingVertical: 18,
  },
  itemText: { fontSize: 18, color: colors.darkText, fontWeight: "500" },
});
