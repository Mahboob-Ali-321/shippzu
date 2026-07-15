import React from "react";
import { View, StyleSheet, Text } from "react-native";
import { useTheme } from "@/src/theme/ThemeContext";
import { radii, typography } from "@/src/theme/tokens";

type Props = { veg: boolean; size?: number };

export function VegBadge({ veg, size = 14 }: Props) {
  const { colors } = useTheme();
  const c = veg ? colors.veg : colors.nonVeg;
  return (
    <View
      style={[
        styles.outer,
        { borderColor: c, width: size, height: size },
      ]}
      testID={veg ? "veg-badge" : "non-veg-badge"}
    >
      <View style={[styles.dot, { backgroundColor: c, width: size / 2.2, height: size / 2.2, borderRadius: (size / 2.2) / 2 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    borderWidth: 1.5,
    borderRadius: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {},
});
