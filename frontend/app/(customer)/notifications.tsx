import React, { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/src/theme/ThemeContext";
import { api } from "@/src/api/client";
import { Card } from "@/src/components/ui/Card";
import { spacing, typography, radii } from "@/src/theme/tokens";

type Notif = { id: string; title: string; body: string; icon: string; read: boolean; created_at: string; order_id?: string };

export default function NotificationsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [notifs, setNotifs] = useState<Notif[]>([]);

  const load = useCallback(async () => {
    try { const res = await api<Notif[]>("/api/food/notifications"); setNotifs(res); } catch { /* ignore */ }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const markAllRead = async () => {
    await api("/api/food/notifications/mark-all-read", { method: "POST" });
    void load();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} testID="back-btn"><Ionicons name="arrow-back" size={24} color={colors.text} /></Pressable>
        <Text style={[typography.h4, { color: colors.text }]}>Notifications</Text>
        <Pressable onPress={markAllRead} testID="mark-all-read"><Text style={{ ...typography.body, color: colors.primary, fontWeight: "700" }}>Mark all</Text></Pressable>
      </View>

      {notifs.length === 0 ? (
        <View style={{ padding: spacing.xl, alignItems: "center", gap: spacing.md }}>
          <Ionicons name="notifications-outline" size={64} color={colors.textTertiary} />
          <Text style={[typography.subtitle, { color: colors.text }]}>No notifications yet</Text>
          <Text style={[typography.body, { color: colors.textSecondary, textAlign: "center" }]}>Order updates & offers will show up here.</Text>
        </View>
      ) : (
        <FlatList
          data={notifs}
          keyExtractor={(n) => n.id}
          contentContainerStyle={{ padding: spacing.lg, gap: 10 }}
          renderItem={({ item: n }) => (
            <Pressable
              onPress={async () => {
                await api(`/api/food/notifications/${n.id}/read`, { method: "POST" });
                if (n.order_id) router.push({ pathname: "/(customer)/order-tracking/[id]", params: { id: n.order_id } });
                else void load();
              }}
              testID={`notif-${n.id}`}
            >
              <Card style={{ padding: spacing.md, flexDirection: "row", gap: spacing.md, alignItems: "center", opacity: n.read ? 0.7 : 1 }}>
                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary + "15", alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name={(n.icon as any) === "check-circle" ? "checkmark-circle" : "notifications"} size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[typography.subtitle, { color: colors.text }]} numberOfLines={1}>{n.title}</Text>
                  <Text style={[typography.body, { color: colors.textSecondary }]} numberOfLines={2}>{n.body}</Text>
                </View>
                {!n.read && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary }} />}
              </Card>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
});
