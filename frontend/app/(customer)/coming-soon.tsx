import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/src/theme/ThemeContext";
import { Button } from "@/src/components/ui/Button";
import { MODULES } from "@/src/modules/registry";
import { spacing, typography } from "@/src/theme/tokens";

export default function ComingSoon() {
  const { colors } = useTheme();
  const router = useRouter();
  const upcoming = MODULES.filter((m) => m.comingSoon).slice(0, 6);
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top", "bottom"]}>
      <View style={{ flexDirection: "row", padding: spacing.lg, alignItems: "center" }}>
        <Pressable onPress={() => router.back()} testID="back-btn"><Ionicons name="arrow-back" size={24} color={colors.text} /></Pressable>
      </View>
      <View style={{ flex: 1, padding: spacing.lg, alignItems: "center", justifyContent: "center", gap: spacing.lg }}>
        <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: colors.primary + "20", alignItems: "center", justifyContent: "center" }}>
          <Ionicons name="rocket" size={48} color={colors.primary} />
        </View>
        <Text style={[typography.h1, { color: colors.text, textAlign: "center" }]}>Coming soon</Text>
        <Text style={[typography.bodyLarge, { color: colors.textSecondary, textAlign: "center" }]}>
          {"This module isn't live yet. We're building 10+ verticals inside Shippzu — one app for everything you need."}
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center", marginTop: spacing.md }}>
          {upcoming.map((m) => (
            <View key={m.id} style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: m.color + "15", borderWidth: 1, borderColor: m.color + "30", flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Ionicons name={m.icon} size={14} color={m.color} />
              <Text style={{ color: m.color, fontWeight: "700", fontSize: 12 }}>{m.name}</Text>
            </View>
          ))}
        </View>
        <Button title="Order food instead" onPress={() => router.replace("/(customer)/(tabs)")} testID="back-to-food-btn" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({});
