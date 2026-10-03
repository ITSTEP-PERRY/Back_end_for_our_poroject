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

type Props = NativeStackScreenProps<RootStackParamList, "Register">;

/**
 * Figma: iPhone 13 & 14 - Sign up · node `2446:4342`
 * https://www.figma.com/design/cF0bKFsmenH6rrshGV0yO7/?node-id=2446-4342
 * Модалка «Create your account» поверх dimmed backdrop — тот же card-паттерн, что в LoginScreen.
 */
export function RegisterScreen({ navigation }: Props) {
  const { register } = useAuth();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit =
    !busy &&
    name.trim() &&
    surname.trim() &&
    email.trim() &&
    password &&
    confirmPassword &&
    agreed;

  const onSubmit = async () => {
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (!agreed) {
      setError("Please agree to the Terms of Use and Privacy Policy");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const login = email.trim();
      const fullName = `${name.trim()} ${surname.trim()}`.trim();
      await register({ name: fullName, email: login, login, password });
      navigation.goBack();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Register failed");
    } finally {
      setBusy(false);
    }
  };

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
            <Text style={styles.title}>Create your account</Text>
            <Text style={styles.sub}>Sign up to get started</Text>

            <FloatingLabelInput
              label="Name"
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              autoComplete="given-name"
            />

            <FloatingLabelInput
              label="Surname"
              value={surname}
              onChangeText={setSurname}
              placeholder="Your surname"
              autoComplete="family-name"
            />

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
                secureTextEntry={!showPassword}
                autoComplete="password-new"
                value={password}
                onChangeText={setPassword}
                placeholder="Create your password"
                style={{ paddingRight: 36 }}
              />
              <Pressable onPress={() => setShowPassword((v) => !v)} style={styles.eye} hitSlop={8}>
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={22}
                  color={colors.muted}
                />
              </Pressable>
            </View>

            <View style={styles.passWrap}>
              <FloatingLabelInput
                label="Confirm password"
                secureTextEntry={!showConfirm}
                autoComplete="password-new"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Repeat your password"
                style={{ paddingRight: 36 }}
              />
              <Pressable onPress={() => setShowConfirm((v) => !v)} style={styles.eye} hitSlop={8}>
                <Ionicons
                  name={showConfirm ? "eye-off-outline" : "eye-outline"}
                  size={22}
                  color={colors.muted}
                />
              </Pressable>
            </View>

            <Pressable style={styles.agreeRow} onPress={() => setAgreed((v) => !v)}>
              <View style={[styles.check, agreed && styles.checkOn]}>
                {agreed ? <Ionicons name="checkmark" size={14} color={colors.white} /> : null}
              </View>
              <Text style={styles.agreeText}>
                I agree to the{" "}
                <Text style={styles.agreeLink} onPress={() => navigateShop("Terms")}>
                  Terms of Use
                </Text>{" "}
                and{" "}
                <Text style={styles.agreeLink} onPress={() => navigateShop("Privacy")}>
                  Privacy Policy
                </Text>
              </Text>
            </Pressable>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Pressable
              style={[styles.submit, !canSubmit && styles.submitDim]}
              disabled={!canSubmit}
              onPress={onSubmit}
            >
              <Text style={styles.submitText}>{busy ? "…" : "Sign up"}</Text>
            </Pressable>

            <Text style={styles.footer}>
              Already have an account?{" "}
              <Text style={styles.footerLink} onPress={() => navigateShop("Login")}>
                Log in
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
    maxHeight: "92%",
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
  agreeRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginTop: 4,
    marginBottom: 18,
  },
  check: {
    width: 18,
    height: 18,
    borderRadius: 3,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  checkOn: { backgroundColor: colors.darkText, borderColor: colors.darkText },
  agreeText: { flex: 1, fontSize: 13, color: colors.darkText, lineHeight: 18 },
  agreeLink: { fontWeight: "700", textDecorationLine: "underline" },
  error: { color: colors.destructive, marginBottom: 12, textAlign: "center" },
  submit: {
    backgroundColor: colors.grayBtn,
    borderRadius: 4,
    paddingVertical: 12,
    alignItems: "center",
  },
  submitDim: { opacity: 0.55 },
  submitText: { color: colors.white, fontSize: 16, fontWeight: "700" },
  footer: { textAlign: "center", marginTop: 18, color: colors.muted, fontSize: 14 },
  footerLink: { color: colors.darkText, fontWeight: "800" },
});
