import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { PrimaryButton } from "../components/PrimaryButton";
import { SiteFooter } from "../components/SiteFooter";
import { useAuth } from "../auth/AuthContext";
import { colors, radii, space } from "../theme/colors";
import { navigateShop } from "../navigation/navigationRef";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "Account">;

/**
 * Account hub — Figma Menu customer `2004:5947` / guest `2006:9189`
 */
export function AccountScreen({}: Props) {
  const { user, logout } = useAuth();

  if (!user) {
    return (
      <ScrollView style={styles.scroll} contentContainerStyle={styles.root}>
        <Text style={styles.logo}>PERRY</Text>
        <Text style={styles.hello}>Welcome</Text>
        <Pressable style={styles.signUp} onPress={() => navigateShop("Register")}>
          <Text style={styles.signUpText}>Sign up</Text>
        </Pressable>
        <Pressable style={styles.logIn} onPress={() => navigateShop("Login")}>
          <Text style={styles.logInText}>Log in</Text>
        </Pressable>
        <View style={styles.gap} />
        <Row label="Catalog" onPress={() => navigateShop("Products")} />
        <Row label="Terms of Use" onPress={() => navigateShop("Terms")} />
        <Row label="License agreement" onPress={() => navigateShop("License")} />
        <Row label="Privacy Policy" onPress={() => navigateShop("Privacy")} />
        <Row label="Contact us" onPress={() => navigateShop("Contact")} />
        <Row label="FAQ" onPress={() => navigateShop("FAQ")} />
        <SiteFooter />
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.root}>
      <Text style={styles.logo}>PERRY</Text>
      <Text style={styles.hello}>Hi, {user.name}</Text>
      <Text style={styles.email}>{user.email}</Text>
      <Row label="My orders" onPress={() => navigateShop("Orders")} />
      <Row label="Wishlist" onPress={() => navigateShop("Wishlist")} />
      <Row label="My reviews" onPress={() => navigateShop("Reviews")} />
      <Row label="Settings" onPress={() => navigateShop("Settings")} />
      <Row label="Catalog" onPress={() => navigateShop("Products")} />
      <View style={styles.gap} />
      <Row label="Terms of Use" onPress={() => navigateShop("Terms")} />
      <Row label="License agreement" onPress={() => navigateShop("License")} />
      <Row label="Privacy Policy" onPress={() => navigateShop("Privacy")} />
      <Row label="Contact us" onPress={() => navigateShop("Contact")} />
      <Row label="FAQ" onPress={() => navigateShop("FAQ")} />
      <View style={styles.gap} />
      <PrimaryButton title="Log out" variant="ghost" onPress={() => void logout()} />
      <SiteFooter />
    </ScrollView>
  );
}

function Row({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <Text style={styles.rowText}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.white },
  root: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 0 },
  logo: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.darkText,
    letterSpacing: 1.2,
    marginBottom: 20,
  },
  hello: { fontSize: 22, fontWeight: "800", color: colors.darkText, marginBottom: 4 },
  email: { color: colors.muted, marginBottom: 20 },
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
  gap: { height: space.lg },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(14,32,66,0.12)",
  },
  rowText: { fontSize: 16, fontWeight: "600", color: colors.darkText },
});
