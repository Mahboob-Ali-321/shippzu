import React from "react";
import { View, StyleSheet, Animated, ViewStyle } from "react-native";
import { useTheme } from "@/src/theme/ThemeContext";
import { radii } from "@/src/theme/tokens";

export function Skeleton({ style, radius = radii.md }: { style?: ViewStyle; radius?: number }) {
  const { colors } = useTheme();
  const opacity = React.useRef(new Animated.Value(0.4)).current;

  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 900, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.base,
        { backgroundColor: colors.shimmerBase, borderRadius: radius, opacity },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  base: { width: "100%", height: 16 },
});
