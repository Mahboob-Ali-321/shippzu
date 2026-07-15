import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/src/theme/ThemeContext";
import { Card } from "@/src/components/ui/Card";
import { Logo } from "@/src/components/ui/Logo";
import { spacing, typography } from "@/src/theme/tokens";

export default function SettingsScreen() {
  const { colors, isDark, setMode, mode } = useTheme();
  const router = useRouter();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} testID="back-btn"><Ionicons name="arrow-back" size={24} color={colors.text} /></Pressable>
        <Text style={[typography.h4, { color: colors.text }]}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}>
        <Card>
          <Text style={[typography.subtitle, { color: colors.text, padding: spacing.md, borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth }]}>Appearance</Text>
          {(["light", "dark"] as const).map((m) => (
            <Pressable
              key={m}
              onPress={() => setMode(m)}
              style={{ flexDirection: "row", alignItems: "center", padding: spacing.md, gap: 10 }}
              testID={`theme-${m}`}
            >
              <Ionicons name={m === "light" ? "sunny" : "moon"} size={22} color={colors.primary} />
              <Text style={[typography.body, { color: colors.text, flex: 1, textTransform: "capitalize" }]}>{m} mode</Text>
              <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: mode === m ? colors.primary : colors.border, alignItems: "center", justifyContent: "center" }}>
                {mode === m && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary }} />}
              </View>
            </Pressable>
          ))}
        </Card>

        <Card>
          <Text style={[typography.subtitle, { color: colors.text, padding: spacing.md, borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth }]}>Notifications</Text>
          <View style={{ padding: spacing.md }}>
            <Text style={[typography.body, { color: colors.textSecondary }]}>Push notifications are configured via Emergent Push. They will activate after building an APK/AAB.</Text>
          </View>
        </Card>

        <Card style={{ padding: spacing.lg, gap: 8, alignItems: "center" }}>
          <Logo variant="stacked" size={64} showTagline />
          <Text style={[typography.body, { color: colors.textSecondary, marginTop: 8 }]}>Version 1.0.0 · Phase 1 (Food Delivery)</Text>
          <Text style={[typography.bodySmall, { color: colors.textTertiary, textAlign: "center" }]}>
            Grocery, Pharmacy, Parcel Delivery and 7 more modules launching soon.
          </Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
});
