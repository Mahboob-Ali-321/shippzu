import React, { forwardRef } from "react";
import { View, TextInput, Text, StyleSheet, TextInputProps, ViewStyle } from "react-native";
import { useTheme } from "@/src/theme/ThemeContext";
import { radii, spacing, typography } from "@/src/theme/tokens";

type Props = TextInputProps & {
  label?: string;
  error?: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
  containerStyle?: ViewStyle;
};

export const Input = forwardRef<TextInput, Props>(function Input(
  { label, error, left, right, containerStyle, style, ...rest },
  ref,
) {
  const { colors } = useTheme();
  return (
    <View style={[{ gap: 6 }, containerStyle]}>
      {label ? <Text style={[typography.bodySmall, { color: colors.textSecondary, fontWeight: "600" }]}>{label}</Text> : null}
      <View
        style={[
          styles.wrap,
          {
            backgroundColor: colors.surface,
            borderColor: error ? colors.error : colors.border,
          },
        ]}
      >
        {left}
        <TextInput
          ref={ref}
          placeholderTextColor={colors.textTertiary}
          style={[styles.input, { color: colors.text }, style]}
          {...rest}
        />
        {right}
      </View>
      {error ? <Text style={[typography.bodySmall, { color: colors.error }]}>{error}</Text> : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radii.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    minHeight: 52,
  },
  input: { flex: 1, ...typography.bodyLarge, paddingVertical: spacing.md },
});
