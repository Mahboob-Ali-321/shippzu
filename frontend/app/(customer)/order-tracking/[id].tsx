import React, { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Image, Pressable, ActivityIndicator, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "@/src/theme/ThemeContext";
import { api } from "@/src/api/client";
import { Card } from "@/src/components/ui/Card";
import { Button } from "@/src/components/ui/Button";
import { useToast } from "@/src/components/ui/Toast";
import { spacing, typography, radii } from "@/src/theme/tokens";

type Order = {
  id: string;
  order_number: string;
  restaurant_name: string;
  restaurant_image: string;
  items: { name: string; quantity: number; unit_price: number; variant_name?: string }[];
  address: { line1: string; city: string; state: string; pincode: string; label: string };
  grand_total: number;
  subtotal: number;
  delivery_fee: number;
  platform_fee: number;
  packaging_fee: number;
  taxes: number;
  discount: number;
  payment_method: string;
  payment_status: string;
  status: string;
  status_history: { status: string; at: string }[];
  eta_minutes: number;
  created_at: string;
};

const FLOW = [
  { key: "placed", label: "Order placed", icon: "checkmark-circle" },
  { key: "accepted", label: "Restaurant accepted", icon: "restaurant" },
  { key: "preparing", label: "Preparing your food", icon: "flame" },
  { key: "picked_up", label: "Picked up", icon: "bag-handle" },
  { key: "on_the_way", label: "On the way", icon: "bicycle" },
  { key: "delivered", label: "Delivered", icon: "home" },
];

export default function OrderTrackingScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const [order, setOrder] = useState<Order | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const res = await api<Order>(`/api/food/orders/${id}`);
      setOrder(res);
    } catch (e: any) {
      toast.show(e?.message || "Failed to load order", "error");
    } finally {
      setRefreshing(false);
    }
  }, [id, toast]);

  useEffect(() => {
    void load();
    // auto-poll every 10s
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, [load]);

  const advance = async () => {
    if (!id) return;
    try {
      const res = await api<Order>(`/api/food/orders/${id}/advance`, { method: "POST" });
      setOrder(res);
      toast.show("Order status updated", "success");
    } catch (e: any) {
      toast.show(e?.message || "Failed", "error");
    }
  };

  if (!order) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </SafeAreaView>
    );
  }

  const currentIdx = FLOW.findIndex((f) => f.key === order.status);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} testID="back-btn">
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1, marginLeft: spacing.md }}>
          <Text style={[typography.h4, { color: colors.text }]}>#{order.order_number}</Text>
          <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>{order.restaurant_name}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} tintColor={colors.primary} />}
      >
        {/* ETA banner */}
        <Card style={{ padding: spacing.lg, backgroundColor: colors.primary, gap: 4 }}>
          <Text style={{ ...typography.body, color: "rgba(255,255,255,0.85)" }}>Estimated arrival</Text>
          <Text style={{ ...typography.h1, color: "#fff" }}>{order.eta_minutes} min</Text>
          <Text style={{ ...typography.body, color: "rgba(255,255,255,0.85)" }}>
            {order.status === "delivered" ? "Delivered — Enjoy your meal!" : order.status === "cancelled" ? "Order cancelled" : "Your order is being prepared with love"}
          </Text>
        </Card>

        {/* Timeline */}
        <Card style={{ padding: spacing.lg }}>
          <Text style={[typography.subtitle, { color: colors.text, marginBottom: spacing.md }]}>Order status</Text>
          {FLOW.map((step, idx) => {
            const done = idx <= currentIdx && order.status !== "cancelled";
            const active = idx === currentIdx && order.status !== "cancelled";
            const isLast = idx === FLOW.length - 1;
            return (
              <View key={step.key} style={{ flexDirection: "row", gap: 12 }}>
                <View style={{ alignItems: "center", width: 32 }}>
                  <View style={{
                    width: 32, height: 32, borderRadius: 16,
                    backgroundColor: done ? colors.success : colors.surface,
                    borderWidth: active ? 3 : 0, borderColor: colors.primary,
                    alignItems: "center", justifyContent: "center",
                  }}>
                    <Ionicons name={step.icon as any} size={16} color={done ? "#fff" : colors.textTertiary} />
                  </View>
                  {!isLast && <View style={{ width: 2, flex: 1, backgroundColor: done ? colors.success : colors.border, marginVertical: 4 }} />}
                </View>
                <View style={{ flex: 1, paddingBottom: isLast ? 0 : spacing.md }}>
                  <Text style={{ ...typography.body, color: done ? colors.text : colors.textSecondary, fontWeight: done ? "700" : "500" }}>{step.label}</Text>
                  {active && <Text style={{ ...typography.bodySmall, color: colors.primary, marginTop: 2 }}>In progress...</Text>}
                </View>
              </View>
            );
          })}
        </Card>

        {order.status !== "delivered" && order.status !== "cancelled" && (
          <Button title="Simulate: Advance status (dev)" variant="secondary" onPress={advance} testID="advance-status-btn" />
        )}

        {/* Delivery address */}
        <Card style={{ padding: spacing.md, gap: 4 }}>
          <Text style={[typography.subtitle, { color: colors.text }]}>Delivery to</Text>
          <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}>
            <Ionicons name="location" size={20} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[typography.body, { color: colors.text, fontWeight: "600" }]}>{order.address.label}</Text>
              <Text style={[typography.body, { color: colors.textSecondary }]}>{order.address.line1}, {order.address.city}, {order.address.state} - {order.address.pincode}</Text>
            </View>
          </View>
        </Card>

        {/* Items */}
        <Card style={{ padding: spacing.md, gap: spacing.sm }}>
          <Text style={[typography.subtitle, { color: colors.text }]}>Your order</Text>
          {order.items.map((it, idx) => (
            <View key={idx} style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={[typography.body, { color: colors.text, flex: 1 }]} numberOfLines={2}>{it.quantity} × {it.name}{it.variant_name ? ` (${it.variant_name})` : ""}</Text>
              <Text style={[typography.body, { color: colors.text }]}>₹{(it.quantity * it.unit_price).toFixed(0)}</Text>
            </View>
          ))}
          <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 6 }} />
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={{ color: colors.textSecondary }}>Subtotal</Text><Text style={{ color: colors.text }}>₹{order.subtotal.toFixed(2)}</Text>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={{ color: colors.textSecondary }}>Delivery + Platform + Packaging + Taxes</Text>
            <Text style={{ color: colors.text }}>₹{(order.delivery_fee + order.platform_fee + order.packaging_fee + order.taxes).toFixed(2)}</Text>
          </View>
          {order.discount > 0 && (
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ color: colors.success }}>Discount</Text><Text style={{ color: colors.success }}>- ₹{order.discount.toFixed(2)}</Text>
            </View>
          )}
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 6 }}>
            <Text style={[typography.subtitle, { color: colors.text }]}>Grand Total</Text>
            <Text style={[typography.subtitle, { color: colors.text }]}>₹{order.grand_total.toFixed(2)}</Text>
          </View>
          <Text style={[typography.bodySmall, { color: colors.textSecondary, marginTop: 4 }]}>
            Paid via {order.payment_method.toUpperCase()} · {order.payment_status.toUpperCase()}
          </Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
});
