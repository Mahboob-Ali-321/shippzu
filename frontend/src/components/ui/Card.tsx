import React from "react";
import { View, StyleSheet, ViewStyle, Platform } from "react-native";
import { useTheme } from "@/src/theme/ThemeContext";
import { radii } from "@/src/theme/tokens";

type Props = { children: React.ReactNode; style?: ViewStyle; elevated?: boolean };

export function Card({ children, style, elevated = true }: Props) {
  const { colors, isDark } = useTheme();
  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: colors.surfaceElevated,
          borderColor: colors.border,
          borderWidth: isDark ? 1 : 0,
          ...(elevated && !isDark
            ? Platform.select({
                ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 14 },
                android: { elevation: 3 },
              })
            : {}),
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: radii.xl, overflow: "hidden" },
});
