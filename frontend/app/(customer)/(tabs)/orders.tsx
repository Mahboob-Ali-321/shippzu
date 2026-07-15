import React, { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, Image, Pressable, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/src/theme/ThemeContext";
import { api } from "@/src/api/client";
import { Card } from "@/src/components/ui/Card";
import { Button } from "@/src/components/ui/Button";
import { spacing, typography, radii } from "@/src/theme/tokens";

type Order = {
  id: string;
  order_number: string;
  restaurant_name: string;
  restaurant_image: string;
  items: { name: string; quantity: number }[];
  grand_total: number;
  status: string;
  created_at: string;
  restaurant_id: string;
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  placed: { label: "Order Placed", color: "#F59E0B" },
  accepted: { label: "Accepted", color: "#F59E0B" },
  preparing: { label: "Preparing", color: "#3B82F6" },
  picked_up: { label: "Picked Up", color: "#3B82F6" },
  on_the_way: { label: "On the way", color: "#3B82F6" },
  delivered: { label: "Delivered", color: "#10B981" },
  cancelled: { label: "Cancelled", color: "#EF4444" },
};

export default function OrdersScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api<Order[]>("/api/food/orders");
      setOrders(res);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
      <View style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.md }}>
        <Text style={[typography.h2, { color: colors.text }]}>Your orders</Text>
        <Text style={[typography.body, { color: colors.textSecondary, marginTop: 4 }]}>Track and reorder your favourites</Text>
      </View>

      {loading ? null : orders.length === 0 ? (
        <View style={{ padding: spacing.xl, alignItems: "center", gap: spacing.md }}>
          <Ionicons name="receipt-outline" size={64} color={colors.textTertiary} />
          <Text style={[typography.subtitle, { color: colors.text }]}>No orders yet</Text>
          <Text style={[typography.body, { color: colors.textSecondary, textAlign: "center" }]}>
            Your food journey starts here. Order something delicious!
          </Text>
          <Button title="Browse restaurants" onPress={() => router.push("/(customer)/(tabs)")} testID="orders-empty-cta" />
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(o) => o.id}
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} tintColor={colors.primary} />}
          renderItem={({ item: o }) => {
            const s = STATUS_LABELS[o.status] ?? { label: o.status, color: colors.textSecondary };
            return (
              <Pressable
                onPress={() => router.push({ pathname: "/(customer)/order-tracking/[id]", params: { id: o.id } })}
                testID={`order-card-${o.id}`}
              >
                <Card style={{ padding: spacing.md, gap: spacing.md }}>
                  <View style={{ flexDirection: "row", gap: spacing.md, alignItems: "center" }}>
                    <Image source={{ uri: o.restaurant_image }} style={{ width: 60, height: 60, borderRadius: radii.md }} />
                    <View style={{ flex: 1 }}>
                      <Text style={[typography.subtitle, { color: colors.text }]} numberOfLines={1}>{o.restaurant_name}</Text>
                      <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>#{o.order_number}</Text>
                    </View>
                    <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: radii.sm, backgroundColor: s.color + "20" }}>
                      <Text style={{ color: s.color, fontSize: 11, fontWeight: "700" }}>{s.label}</Text>
                    </View>
                  </View>
                  <Text style={[typography.body, { color: colors.textSecondary }]} numberOfLines={1}>
                    {o.items.map((i) => `${i.quantity} × ${i.name}`).join(" · ")}
                  </Text>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.sm }}>
                    <Text style={[typography.subtitle, { color: colors.text }]}>₹{o.grand_total.toFixed(2)}</Text>
                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation();
                        router.push({ pathname: "/(customer)/restaurant/[id]", params: { id: o.restaurant_id } });
                      }}
                      style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: radii.full, backgroundColor: colors.primary + "15" }}
                      testID={`reorder-btn-${o.id}`}
                    >
                      <Text style={{ color: colors.primary, fontWeight: "700" }}>Reorder</Text>
                    </Pressable>
                  </View>
                </Card>
              </Pressable>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({});
