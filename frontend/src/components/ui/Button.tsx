import React from "react";
import { Pressable, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle, GestureResponderEvent } from "react-native";
import { useTheme } from "@/src/theme/ThemeContext";
import { radii, spacing, typography } from "@/src/theme/tokens";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

type Props = {
  title: string;
  onPress?: (e: GestureResponderEvent) => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  left?: React.ReactNode;
  right?: React.ReactNode;
  testID?: string;
};

export function Button({ title, onPress, variant = "primary", size = "md", loading, disabled, fullWidth, style, textStyle, left, right, testID }: Props) {
  const { colors } = useTheme();
  const isDisabled = disabled || loading;

  const bg =
    variant === "primary" ? colors.primary :
    variant === "secondary" ? "transparent" :
    "rgba(255, 90, 31, 0.1)";
  const borderColor = variant === "secondary" ? colors.primary : "transparent";
  const borderWidth = variant === "secondary" ? 2 : 0;
  const color = variant === "primary" ? "#fff" : colors.primary;

  const padY = size === "sm" ? 10 : size === "md" ? 14 : 18;
  const padX = size === "sm" ? spacing.md : spacing.lg;

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: bg, borderColor, borderWidth, paddingVertical: padY, paddingHorizontal: padX, opacity: isDisabled ? 0.6 : pressed ? 0.85 : 1 },
        fullWidth && { alignSelf: "stretch" },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={color} />
      ) : (
        <>
          {left}
          <Text style={[styles.text, { color }, textStyle]}>{title}</Text>
          {right}
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.lg,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  text: { ...typography.subtitle, fontWeight: "700" },
});
