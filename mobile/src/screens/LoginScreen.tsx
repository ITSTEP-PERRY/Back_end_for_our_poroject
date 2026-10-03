import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FloatingLabelInput } from "../components/FloatingLabelInput";
import { useAuth } from "../auth/AuthContext";
import { colors } from "../theme/colors";
import { navigateShop } from "../navigation/navigationRef";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "Login">;

/**
 * Figma: iPhone 13 & 14 - Log in · node `2446:3513`
 * https://www.figma.com/design/cF0bKFsmenH6rrshGV0yO7/?node-id=2446-3513
 * Модалка «Welcome back» поверх dimmed backdrop.
 */
export function LoginScreen({ navigation }: Props) {
  const { login } = useAuth();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [stay, setStay] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <View style={styles.backdrop}>
      <Pressable style={StyleSheet.absoluteFill} onPress={() => navigation.goBack()} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={[styles.center, { paddingBottom: insets.bottom + 16 }]}
      >
        <View style={styles.card}>
          <Pressable
            style={styles.close}
            onPress={() => navigation.goBack()}
            hitSlop={10}
            accessibilityLabel="Close"
          >
            <Ionicons name="close" size={22} color={colors.darkText} />
          </Pressable>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.cardInner}
          >
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.sub}>Login into your account</Text>

            <FloatingLabelInput
              label="Email"
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
            />

            <View style={styles.passWrap}>
              <FloatingLabelInput
                label="Password"
                secureTextEntry={!show}
                autoComplete="password"
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                style={{ paddingRight: 36 }}
              />
              <Pressable onPress={() => setShow((v) => !v)} style={styles.eye} hitSlop={8}>
                <Ionicons
                  name={show ? "eye-off-outline" : "eye-outline"}
                  size={22}
                  color={colors.muted}
                />
              </Pressable>
            </View>

            <View style={styles.row}>
              <Pressable style={styles.stay} onPress={() => setStay((v) => !v)}>
                <View style={[styles.check, stay && styles.checkOn]}>
                  {stay ? <Ionicons name="checkmark" size={14} color={colors.white} /> : null}
                </View>
                <Text style={styles.stayText}>Stay signed in</Text>
              </Pressable>
              <Pressable onPress={() => navigateShop("ForgotPassword")}>
                <Text style={styles.forgot}>Forgot password?</Text>
              </Pressable>
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Pressable
              style={[styles.submit, (busy || !email.trim() || !password) && styles.submitDim]}
              disabled={busy || !email.trim() || !password}
              onPress={async () => {
                setBusy(true);
                setError(null);
                try {
                  await login(email.trim(), password);
                  navigation.goBack();
                } catch (e) {
                  setError(e instanceof Error ? e.message : "Login failed");
                } finally {
                  setBusy(false);
                }
              }}
            >
              <Text style={styles.submitText}>{busy ? "…" : "Log in"}</Text>
            </Pressable>

            <Text style={styles.footer}>
              Don't have an account?{" "}
              <Text style={styles.footerLink} onPress={() => navigateShop("Register")}>
                Sign up
              </Text>
            </Text>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: "center",
  },
  center: {
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    maxHeight: "90%",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  cardInner: {
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 24,
  },
  close: {
    position: "absolute",
    right: 12,
    top: 12,
    zIndex: 2,
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.darkText,
    textAlign: "center",
  },
  sub: {
    textAlign: "center",
    color: colors.muted,
    fontSize: 14,
    marginTop: 6,
    marginBottom: 22,
  },
  passWrap: { position: "relative" },
  eye: { position: "absolute", right: 14, top: 18 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
    marginTop: 2,
  },
  stay: { flexDirection: "row", alignItems: "center", gap: 8 },
  check: {
    width: 18,
    height: 18,
    borderRadius: 3,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  checkOn: { backgroundColor: colors.darkText, borderColor: colors.darkText },
  stayText: { fontSize: 13, color: colors.darkText },
  forgot: { fontSize: 13, color: colors.darkText, fontWeight: "600" },
  error: { color: colors.destructive, marginBottom: 12, textAlign: "center" },
  submit: {
    backgroundColor: "#A1A1A1",
    borderRadius: 4,
    paddingVertical: 12,
    alignItems: "center",
  },
  submitDim: { opacity: 0.55 },
  submitText: { color: colors.white, fontSize: 16, fontWeight: "700" },
  footer: { textAlign: "center", marginTop: 18, color: colors.muted, fontSize: 14 },
  footerLink: { color: colors.darkText, fontWeight: "800" },
});
