import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, space } from "../theme/colors";
import { navigateShop, type ShopRoute } from "../navigation/navigationRef";

type FooterRoute = "Terms" | "Privacy" | "Contact" | "FAQ" | "License" | "Products";

type Props = {
  onNavigate?: (route: FooterRoute) => void;
};

/**
 * Mobile footer — web `.site-footer`:
 * верх `--footer-top` #4A7BD9, низ `--header-2` #1F50AA.
 * Ссылки по умолчанию идут через navigateShop → тот же backend/экраны, что desktop.
 */
export function SiteFooter({ onNavigate }: Props) {
  const go = (route: FooterRoute) => {
    if (onNavigate) {
      onNavigate(route);
      return;
    }
    navigateShop(route as ShopRoute);
  };

  return (
    <View style={styles.root}>
      <View style={styles.top}>
        <Text style={styles.h}>Support</Text>
        <Pressable onPress={() => go("Contact")}>
          <Text style={styles.link}>Contact us</Text>
        </Pressable>
        <Pressable onPress={() => go("FAQ")}>
          <Text style={styles.link}>FAQ</Text>
        </Pressable>

        <Text style={[styles.h, styles.hSp]}>Legal notice</Text>
        <Pressable onPress={() => go("Terms")}>
          <Text style={styles.link}>Terms and Conditions</Text>
        </Pressable>
        <Pressable onPress={() => go("License")}>
          <Text style={styles.link}>License agreement</Text>
        </Pressable>
        <Pressable onPress={() => go("Privacy")}>
          <Text style={styles.link}>Privacy Policy</Text>
        </Pressable>

        <Text style={[styles.h, styles.hSp]}>Social media</Text>
        <View style={styles.social}>
          {(
            [
              ["logo-facebook", "https://facebook.com"],
              ["logo-twitter", "https://x.com"],
              ["logo-instagram", "https://instagram.com"],
              ["mail-outline", "mailto:support@perry.demo"],
              ["paper-plane-outline", "https://t.me"],
            ] as const
          ).map(([icon, href]) => (
            <Pressable
              key={icon}
              style={styles.socialBtn}
              onPress={() => void Linking.openURL(href)}
              hitSlop={6}
            >
              <Ionicons name={icon} size={20} color={colors.white} />
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.bottom}>
        <Text style={styles.logo}>PERRY</Text>
        <Text style={styles.copy}>© 2024 Du Soleil. All rights reserved.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { marginTop: 24 },
  top: {
    backgroundColor: colors.header,
    paddingHorizontal: space.lg,
    paddingTop: 28,
    paddingBottom: 24,
  },
  h: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 10,
  },
  hSp: { marginTop: 22 },
  link: {
    color: "#EEF3FF",
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  social: { flexDirection: "row", gap: 12, marginTop: 4 },
  socialBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  bottom: {
    backgroundColor: colors.headerDeep,
    paddingHorizontal: space.lg,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  logo: {
    color: colors.white,
    fontWeight: "800",
    fontSize: 16,
    letterSpacing: 1,
  },
  copy: {
    color: colors.white,
    fontSize: 11,
    opacity: 0.95,
    flexShrink: 1,
    textAlign: "right",
  },
});
