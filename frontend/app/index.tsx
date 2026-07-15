import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, Easing } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/src/theme/ThemeContext";
import { useAuth } from "@/src/contexts/AuthContext";
import { spacing, typography } from "@/src/theme/tokens";
import { storage } from "@/src/utils/storage";

const ONBOARDED_KEY = "shippzu.onboarded";

export default function Index() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user, loading } = useAuth();
  const scale = useRef(new Animated.Value(0.6)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 5, tension: 60 }),
      Animated.timing(opacity, { toValue: 1, duration: 400, easing: Easing.out(Easing.ease), useNativeDriver: true }),
    ]).start();
  }, [scale, opacity]);

  useEffect(() => {
    if (loading) return;
    const t = setTimeout(async () => {
      const onboarded = await storage.getItem<string>(ONBOARDED_KEY, "");
      if (!onboarded) {
        router.replace("/onboarding");
      } else if (!user) {
        router.replace("/(auth)/login");
      } else {
        router.replace("/(customer)/(tabs)");
      }
    }, 1500);
    return () => clearTimeout(t);
  }, [loading, user, router]);

  return (
    <View style={[styles.root, { backgroundColor: colors.primary }]} testID="splash-screen">
      <Animated.View style={{ transform: [{ scale }], opacity, alignItems: "center" }}>
        <View style={styles.logoBox}>
          <Ionicons name="fast-food" size={70} color={colors.primary} />
        </View>
        <Text style={styles.brand}>Shippzu</Text>
        <Text style={styles.tagline}>Everything You Need</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: "center", justifyContent: "center" },
  logoBox: {
    width: 120, height: 120, borderRadius: 32,
    backgroundColor: "#FFFFFF",
    alignItems: "center", justifyContent: "center",
    marginBottom: spacing.lg,
    shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 20, shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
  brand: { ...typography.h1, color: "#FFFFFF", fontSize: 44, letterSpacing: -1.5 },
  tagline: { ...typography.subtitle, color: "#FFFFFF", opacity: 0.9, marginTop: 4, letterSpacing: 2, textTransform: "uppercase", fontSize: 12 },
});
