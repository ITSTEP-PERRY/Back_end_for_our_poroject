import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SiteFooter } from "../components/SiteFooter";
import { colors, space } from "../theme/colors";
import { navigateShop } from "../navigation/navigationRef";
import type { RootStackParamList } from "../navigation/types";
import {
  ContactBody,
  FaqBody,
  LicenseBody,
  PrivacyBody,
  TermsBody,
} from "./LegalContent";

type LegalRoute = "Terms" | "Privacy" | "Contact" | "FAQ" | "License";
type Props = NativeStackScreenProps<RootStackParamList, LegalRoute>;

const META: Record<
  LegalRoute,
  { title: string; updated?: boolean; kind: "legal" | "support" }
> = {
  Terms: { title: "Terms and conditions", updated: true, kind: "legal" },
  Privacy: { title: "Privacy policy", updated: true, kind: "legal" },
  License: { title: "License agreement", updated: true, kind: "legal" },
  Contact: { title: "Contact us", kind: "support" },
  FAQ: { title: "FAQ", kind: "support" },
};

const LEGAL_LINKS: { route: LegalRoute; label: string }[] = [
  { route: "Terms", label: "Terms and conditions" },
  { route: "License", label: "License agreement" },
  { route: "Privacy", label: "Privacy policy" },
];

export function LegalScreen({ route, navigation }: Props) {
  const name = route.name as LegalRoute;
  const meta = META[name] || { title: name, kind: "support" as const };

  const go = (r: LegalRoute) => {
    if (r === name) return;
    navigation.navigate(r);
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      {meta.kind === "legal" ? (
        <View style={styles.nav}>
          <Text style={styles.navTitle}>Legal notice</Text>
          {LEGAL_LINKS.map((l) => (
            <Pressable key={l.route} onPress={() => go(l.route)} hitSlop={6}>
              <Text style={[styles.navLink, l.route === name && styles.navLinkOn]}>{l.label}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      <Text style={styles.h1}>{meta.title}</Text>
      {meta.updated ? <Text style={styles.updated}>Last updated: May 7, 2024</Text> : null}
      <View style={styles.rule} />

      {name === "Privacy" ? <PrivacyBody /> : null}
      {name === "Terms" ? <TermsBody /> : null}
      {name === "License" ? <LicenseBody /> : null}
      {name === "Contact" ? (
        <ContactBody
          onNavigate={(r) => {
            if (r === "Orders") navigateShop("Orders");
            else navigation.navigate(r);
          }}
        />
      ) : null}
      {name === "FAQ" ? (
        <FaqBody
          onNavigate={(r) => {
            if (r === "Orders") navigateShop("Orders");
            else if (r === "ForgotPassword") navigateShop("ForgotPassword");
            else navigation.navigate(r);
          }}
        />
      ) : null}

      <SiteFooter />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  content: { paddingHorizontal: space.lg, paddingTop: space.md, paddingBottom: 0 },
  nav: {
    backgroundColor: colors.objects,
    borderRadius: 8,
    padding: 14,
    marginBottom: 20,
    gap: 10,
  },
  navTitle: { fontSize: 15, fontWeight: "800", color: colors.darkText, marginBottom: 4 },
  navLink: { fontSize: 14, color: colors.darkText, lineHeight: 22 },
  navLinkOn: { fontWeight: "800", color: colors.secondary },
  h1: { fontSize: 24, fontWeight: "800", color: colors.darkText, marginBottom: 6 },
  updated: { fontSize: 13, color: colors.muted, marginBottom: 12 },
  rule: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(14,32,66,0.2)",
    marginBottom: 16,
  },
});
