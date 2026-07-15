import React from "react";
import { View, Text, Image, StyleSheet, ViewStyle, ImageStyle } from "react-native";
import { useTheme } from "@/src/theme/ThemeContext";
import { typography } from "@/src/theme/tokens";

// Official Shippzu brand asset (icon + wordmark).
// Natural aspect ratio ≈ 3.9 : 1 (icon on the left, wordmark on the right).
export const SHIPPZU_LOGO = require("../../../assets/images/shippzu-logo-full.webp");
const NATURAL_ASPECT = 3.9;

type Variant = "full" | "compact" | "stacked";

type Props = {
  /**
   * `full`: icon + wordmark inline (default, best for headers & auth screens)
   * `compact`: same as full but expects a tight height (~24-28) — no tagline
   * `stacked`: logo on top, optional tagline below (splash, about card)
   */
  variant?: Variant;
  /** Height in points. Width is derived from the natural aspect ratio. */
  size?: number;
  showTagline?: boolean;
  style?: ViewStyle;
  imageStyle?: ImageStyle;
  testID?: string;
};

export function Logo({ variant = "full", size = 32, showTagline = false, style, imageStyle, testID }: Props) {
  const { colors } = useTheme();
  const taglineColor = colors.primary;
  const width = size * NATURAL_ASPECT;

  if (variant === "stacked") {
    return (
      <View style={[{ alignItems: "center" }, style]} testID={testID}>
        <Image
          source={SHIPPZU_LOGO}
          style={[{ width, height: size }, imageStyle]}
          resizeMode="contain"
        />
        {showTagline ? (
          <Text style={[typography.caption, { color: taglineColor, letterSpacing: 2, textTransform: "uppercase", marginTop: 8 }]}>
            Everything You Need
          </Text>
        ) : null}
      </View>
    );
  }

  // full / compact — inline row
  return (
    <View style={[styles.row, style]} testID={testID}>
      <Image
        source={SHIPPZU_LOGO}
        style={[{ width, height: size }, imageStyle]}
        resizeMode="contain"
      />
      {showTagline && variant === "full" ? (
        <Text style={[typography.caption, { color: taglineColor, letterSpacing: 1.5, textTransform: "uppercase", marginTop: 4 }]}>
          Everything You Need
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { alignItems: "flex-start", justifyContent: "center" },
});
