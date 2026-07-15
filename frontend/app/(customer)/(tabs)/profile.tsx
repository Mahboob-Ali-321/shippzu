import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/src/theme/ThemeContext";
import { useAuth } from "@/src/contexts/AuthContext";
import { Card } from "@/src/components/ui/Card";
import { Logo } from "@/src/components/ui/Logo";
import { spacing, typography, radii } from "@/src/theme/tokens";

export default function ProfileScreen() {
  const { colors, isDark, toggle } = useTheme();
  const { user, signOut } = useAuth();
  const router = useRouter();

  const menu = [
    { icon: "person-outline", label: "Edit profile", route: "/(customer)/edit-profile", testID: "profile-edit" },
    { icon: "location-outline", label: "Saved addresses", route: "/(customer)/addresses", testID: "profile-addresses" },
    { icon: "receipt-outline", label: "Order history", route: "/(customer)/(tabs)/orders", testID: "profile-orders" },
    { icon: "heart-outline", label: "Favourites", route: "/(customer)/(tabs)/favourites", testID: "profile-favourites" },
    { icon: "notifications-outline", label: "Notifications", route: "/(customer)/notifications", testID: "profile-notifications" },
    { icon: "settings-outline", label: "Settings & preferences", route: "/(customer)/settings", testID: "profile-settings" },
  ] as const;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.lg, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Text style={[typography.h2, { color: colors.text }]}>Profile</Text>
          <Logo variant="icon" size={36} />
        </View>

        <Card style={{ marginHorizontal: spacing.lg, padding: spacing.md, flexDirection: "row", alignItems: "center", gap: spacing.md }}>
          <View style={[styles.avatar, { backgroundColor: colors.primary + "20" }]}>
            {user?.avatar_url ? (
              <Image source={{ uri: user.avatar_url }} style={{ width: 64, height: 64, borderRadius: 32 }} />
            ) : (
              <Text style={{ ...typography.h3, color: colors.primary }}>
                {user?.name?.[0]?.toUpperCase() || "?"}
              </Text>
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[typography.h4, { color: colors.text }]} numberOfLines={1}>{user?.name || "Guest"}</Text>
            <Text style={[typography.body, { color: colors.textSecondary }]} numberOfLines={1}>{user?.email}</Text>
            {user?.phone ? <Text style={[typography.bodySmall, { color: colors.textTertiary }]}>{user.phone}</Text> : null}
          </View>
          <Pressable onPress={() => router.push("/(customer)/edit-profile")} testID="edit-profile-btn">
            <Ionicons name="pencil" size={18} color={colors.primary} />
          </Pressable>
        </Card>

        <View style={{ marginTop: spacing.lg, paddingHorizontal: spacing.lg }}>
          <Card>
            {menu.map((m, idx) => (
              <Pressable
                key={m.label}
                onPress={() => router.push(m.route as any)}
                style={[styles.menuRow, { borderBottomColor: colors.border, borderBottomWidth: idx === menu.length - 1 ? 0 : StyleSheet.hairlineWidth }]}
                testID={m.testID}
              >
                <Ionicons name={m.icon as any} size={20} color={colors.textSecondary} />
                <Text style={[typography.bodyLarge, { color: colors.text, flex: 1 }]}>{m.label}</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
              </Pressable>
            ))}
          </Card>
        </View>

        <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.lg }}>
          <Card>
            <Pressable style={[styles.menuRow, { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth }]} onPress={toggle} testID="theme-toggle">
              <Ionicons name={isDark ? "moon" : "sunny"} size={20} color={colors.primary} />
              <Text style={[typography.bodyLarge, { color: colors.text, flex: 1 }]}>Dark mode</Text>
              <Text style={[typography.body, { color: colors.textSecondary }]}>{isDark ? "On" : "Off"}</Text>
            </Pressable>
            <Pressable style={styles.menuRow} onPress={async () => { await signOut(); router.replace("/(auth)/login"); }} testID="logout-btn">
              <Ionicons name="log-out-outline" size={20} color={colors.error} />
              <Text style={[typography.bodyLarge, { color: colors.error, flex: 1 }]}>Logout</Text>
            </Pressable>
          </Card>
        </View>

        <Text style={{ textAlign: "center", color: colors.textTertiary, marginTop: spacing.xl, ...typography.caption }}>
          Shippzu v1.0.0 · EVERYTHING YOU NEED
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  avatar: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  menuRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingHorizontal: spacing.md, paddingVertical: 16 },
});
