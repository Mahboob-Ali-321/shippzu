import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, Easing } from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "@/src/theme/ThemeContext";
import { useAuth } from "@/src/contexts/AuthContext";
import { Logo } from "@/src/components/ui/Logo";
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
    }, 1600);
    return () => clearTimeout(t);
  }, [loading, user, router]);

  return (
    <View style={styles.root} testID="splash-screen">
      <Animated.View style={{ transform: [{ scale }], opacity, alignItems: "center" }}>
        <Logo variant="stacked" size={100} showTagline />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF" },
});

