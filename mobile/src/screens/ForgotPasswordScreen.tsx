import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FloatingLabelInput } from "../components/FloatingLabelInput";
import { authApi } from "../api";
import { colors } from "../theme/colors";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "ForgotPassword">;

/** Forgot password → затем Send code `2446:4913` (SendCodeScreen) */
export function ForgotPasswordScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSend = async () => {
    const trimmed = email.trim();
    if (!trimmed) return;
    setBusy(true);
    setError(null);
    try {
      await authApi.forgot(trimmed);
      navigation.replace("SendCode", { email: trimmed, context: "forgot" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send code");
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

          <View style={styles.inner}>
            <Text style={styles.title}>Forgot password</Text>
            <Text style={styles.sub}>Enter your email and we will send a code</Text>
            <FloatingLabelInput
              label="Email"
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Pressable
              style={[styles.submit, (!email.trim() || busy) && styles.dim]}
              disabled={!email.trim() || busy}
              onPress={onSend}
            >
              <Text style={styles.submitText}>{busy ? "…" : "Send code"}</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.overlay, justifyContent: "center" },
  center: { paddingHorizontal: 16, justifyContent: "center" },
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
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
  inner: { paddingHorizontal: 20, paddingTop: 28, paddingBottom: 24 },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.darkText,
    textAlign: "center",
  },
  sub: {
    textAlign: "center",
    color: colors.muted,
    fontSize: 14,
    marginTop: 6,
    marginBottom: 20,
  },
  error: { color: colors.destructive, textAlign: "center", marginBottom: 10 },
  submit: {
    backgroundColor: colors.grayBtn,
    borderRadius: 4,
    paddingVertical: 12,
    alignItems: "center",
  },
  dim: { opacity: 0.55 },
  submitText: { color: colors.white, fontSize: 16, fontWeight: "700" },
});
