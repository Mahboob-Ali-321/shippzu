import React from "react";
import { View, Text, Image, StyleSheet, ViewStyle, ImageStyle } from "react-native";
import { useTheme } from "@/src/theme/ThemeContext";
import { typography } from "@/src/theme/tokens";

// Official Shippzu brand asset. Used everywhere the logo appears.
export const SHIPPZU_LOGO = require("../../../assets/images/shippzu-logo-full.webp");

type Variant = "full" | "icon" | "stacked";

type Props = {
  variant?: Variant;
  size?: number; // icon square side OR full-mark height
  showTagline?: boolean;
  tone?: "light" | "dark"; // dark = light background (default), light = dark background
  style?: ViewStyle;
  imageStyle?: ImageStyle;
};

/**
 * Shippzu Logo component.
 * - `full`: wordmark + icon (uses the WEBP asset as-is)
 * - `icon`: just the icon square (crops the left part of the asset via aspect resize)
 * - `stacked`: icon on top, wordmark below (used on splash / auth)
 */
export function Logo({ variant = "full", size = 48, showTagline = false, tone, style, imageStyle }: Props) {
  const { colors } = useTheme();
  const useTone = tone ?? "dark";
  const textColor = useTone === "light" ? "#FFFFFF" : colors.text;
  const taglineColor = colors.primary;

  if (variant === "icon") {
    return (
      <View style={[styles.iconWrap, { width: size, height: size }, style]}>
        <Image source={SHIPPZU_LOGO} style={[styles.iconImg, { width: size, height: size }, imageStyle]} resizeMode="contain" />
      </View>
    );
  }

  if (variant === "stacked") {
    return (
      <View style={[{ alignItems: "center" }, style]}>
        <Image source={SHIPPZU_LOGO} style={[{ width: size * 4.2, height: size, marginBottom: 4 }, imageStyle]} resizeMode="contain" />
        {showTagline ? (
          <Text style={[typography.caption, { color: taglineColor, letterSpacing: 2, textTransform: "uppercase" }]}>
            Everything You Need
          </Text>
        ) : null}
      </View>
    );
  }

  // full
  return (
    <View style={[{ alignItems: "flex-start" }, style]}>
      <Image source={SHIPPZU_LOGO} style={[{ height: size, width: size * 4.2 }, imageStyle]} resizeMode="contain" />
      {showTagline ? (
        <Text style={[typography.caption, { color: taglineColor, letterSpacing: 1.5, textTransform: "uppercase", marginTop: 2 }]}>
          Everything You Need
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  iconWrap: { alignItems: "center", justifyContent: "center", overflow: "hidden" },
  iconImg: {},
});
