import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, Easing } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/src/theme/ThemeContext";
import { Button } from "@/src/components/ui/Button";
import { spacing, typography } from "@/src/theme/tokens";

export default function OrderSuccessScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 4, tension: 40 }),
      Animated.timing(opacity, { toValue: 1, duration: 400, easing: Easing.out(Easing.ease), useNativeDriver: true }),
    ]).start();
  }, [scale, opacity]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top", "bottom"]}>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl, gap: spacing.lg }}>
        <Animated.View style={[styles.circle, { backgroundColor: colors.success, transform: [{ scale }] }]}>
          <Ionicons name="checkmark" size={72} color="#fff" />
        </Animated.View>
        <Animated.View style={{ opacity, alignItems: "center", gap: 8 }}>
          <Text style={[typography.h1, { color: colors.text, textAlign: "center" }]}>Order placed!</Text>
          <Text style={[typography.bodyLarge, { color: colors.textSecondary, textAlign: "center" }]}>
            {"Your order is on its way. Sit back and relax — we'll notify you at every step."}
          </Text>
        </Animated.View>
      </View>
      <View style={{ padding: spacing.lg, gap: spacing.sm }}>
        <Button title="Track your order" onPress={() => router.replace({ pathname: "/(customer)/order-tracking/[id]", params: { id: id! } })} fullWidth size="lg" testID="track-order-btn" />
        <Button title="Back to home" variant="secondary" onPress={() => router.replace("/(customer)/(tabs)")} fullWidth testID="home-btn" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  circle: { width: 140, height: 140, borderRadius: 70, alignItems: "center", justifyContent: "center", shadowColor: "#10B981", shadowOpacity: 0.4, shadowRadius: 20, shadowOffset: { width: 0, height: 10 } },
});
