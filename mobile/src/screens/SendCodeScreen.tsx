import { useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { authApi } from "../api";
import { colors } from "../theme/colors";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "SendCode">;

const CODE_LENGTH = 6;
const RESEND_COOLDOWN = 30;

/**
 * Figma: iPhone 13 & 14 - Send code · node `2446:4913`
 * https://www.figma.com/design/cF0bKFsmenH6rrshGV0yO7/?node-id=2446-4913
 * Модалка «Enter verification code» поверх dimmed backdrop — тот же card-паттерн, что в LoginScreen.
 *
 * Нет отдельного backend endpoint для верификации кода (стек использует
 * authApi.forgot как "отправить код на email", как в ForgotPasswordScreen),
 * поэтому Confirm просто подтверждает ввод 6 цифр локально и возвращает
 * пользователя к Login — реальный вызов API происходит на Resend/первичной
 * отправке, чтобы auth-логика оставалась рабочей и не ломала backend-контракт.
 */
export function SendCodeScreen({ navigation, route }: Props) {
  const email = route.params?.email ?? "";
  const insets = useSafeAreaInsets();
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [busy, setBusy] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const inputs = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const code = digits.join("");
  const canSubmit = !busy && code.length === CODE_LENGTH;

  const setDigit = (index: number, value: string) => {
    const v = value.replace(/[^0-9]/g, "").slice(-1);
    setDigits((prev) => {
      const next = [...prev];
      next[index] = v;
      return next;
    });
    if (v && index < CODE_LENGTH - 1) {
      inputs.current[index + 1]?.focus();
    }
  };

  const onKeyPress = (index: number, key: string) => {
    if (key === "Backspace" && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const onConfirm = async () => {
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    try {
      // Нет отдельного /auth/verify-code — подтверждаем локально и возвращаемся к Login.
      navigation.replace("Login");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Confirmation failed");
    } finally {
      setBusy(false);
    }
  };

  const onResend = async () => {
    if (cooldown > 0 || resending || !email) return;
    setResending(true);
    setError(null);
    try {
      await authApi.forgot(email);
      setCooldown(RESEND_COOLDOWN);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not resend code");
    } finally {
      setResending(false);
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

          <View style={styles.cardInner}>
            <Text style={styles.title}>Enter verification code</Text>
            <Text style={styles.sub}>
              We sent a code to{email ? ` ${email}` : " your email"}
            </Text>

            <View style={styles.codeRow}>
              {digits.map((d, i) => (
                <TextInput
                  key={i}
                  ref={(r) => {
                    inputs.current[i] = r;
                  }}
                  value={d}
                  onChangeText={(v) => setDigit(i, v)}
                  onKeyPress={({ nativeEvent }) => onKeyPress(i, nativeEvent.key)}
                  keyboardType="number-pad"
                  maxLength={1}
                  style={[styles.digitBox, d ? styles.digitBoxFilled : null]}
                  textAlign="center"
                />
              ))}
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Pressable
              style={[styles.submit, !canSubmit && styles.submitDim]}
              disabled={!canSubmit}
              onPress={onConfirm}
            >
              <Text style={styles.submitText}>{busy ? "…" : "Confirm"}</Text>
            </Pressable>

            <Pressable onPress={onResend} disabled={cooldown > 0 || resending} style={styles.resendWrap}>
              <Text style={[styles.resend, (cooldown > 0 || resending) && styles.resendDim]}>
                {resending
                  ? "Resending…"
                  : cooldown > 0
                    ? `Resend code in ${cooldown}s`
                    : "Resend code"}
              </Text>
            </Pressable>
          </View>
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
    marginBottom: 28,
  },
  codeRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 24,
  },
  digitBox: {
    width: 44,
    height: 52,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 8,
    fontSize: 20,
    fontWeight: "700",
    color: colors.darkText,
  },
  digitBoxFilled: { borderColor: colors.darkText },
  error: { color: colors.destructive, marginBottom: 12, textAlign: "center" },
  submit: {
    backgroundColor: colors.grayBtn,
    borderRadius: 4,
    paddingVertical: 12,
    alignItems: "center",
  },
  submitDim: { opacity: 0.55 },
  submitText: { color: colors.white, fontSize: 16, fontWeight: "700" },
  resendWrap: { alignItems: "center", marginTop: 18 },
  resend: { color: colors.darkText, fontWeight: "700", fontSize: 14 },
  resendDim: { color: colors.muted, fontWeight: "600" },
});
