import { useState } from "react";
import { StyleSheet, Text, TextInput, View, type TextInputProps } from "react-native";
import { colors } from "../theme/colors";

type Props = TextInputProps & {
  label: string;
};

/** Floating label on border — как в Figma iPhone Log in / Sign up */
export function FloatingLabelInput({ label, style, ...rest }: Props) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[styles.wrap, focused && styles.wrapFocus]}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        {...rest}
        style={[styles.input, style]}
        placeholderTextColor={colors.muted}
        onFocus={(e) => {
          setFocused(true);
          rest.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          rest.onBlur?.(e);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 8,
    marginBottom: 14,
    position: "relative",
  },
  wrapFocus: { borderColor: colors.darkText },
  label: {
    position: "absolute",
    top: -9,
    left: 12,
    paddingHorizontal: 4,
    backgroundColor: colors.white,
    fontSize: 12,
    fontWeight: "600",
    color: colors.darkText,
  },
  input: {
    fontSize: 15,
    color: colors.darkText,
    paddingVertical: 4,
    minHeight: 28,
  },
});
