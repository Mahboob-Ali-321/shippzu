import React, { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "@/src/theme/ThemeContext";
import { useCart } from "@/src/contexts/CartContext";
import { api } from "@/src/api/client";
import { Card } from "@/src/components/ui/Card";
import { Button } from "@/src/components/ui/Button";
import { useToast } from "@/src/components/ui/Toast";
import { spacing, typography, radii } from "@/src/theme/tokens";

type Address = { id: string; label: string; line1: string; city: string; state: string; pincode: string; is_default: boolean };

const PAYMENT_METHODS = [
  { id: "cod", label: "Cash on Delivery", icon: "cash-outline", desc: "Pay when your order arrives" },
  { id: "razorpay", label: "UPI / Cards / Netbanking", icon: "card-outline", desc: "Powered by Razorpay" },
] as const;

export default function CheckoutScreen() {
  const { colors } = useTheme();
  const { cart, clear } = useCart();
  const router = useRouter();
  const toast = useToast();
  const { coupon } = useLocalSearchParams<{ coupon?: string }>();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressId, setAddressId] = useState<string | null>(null);
  const [payment, setPayment] = useState<"cod" | "razorpay">("cod");
  const [placing, setPlacing] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await api<Address[]>("/api/food/addresses");
      setAddresses(res);
      const def = res.find((a) => a.is_default) ?? res[0];
      if (def) setAddressId(def.id);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const placeOrder = async () => {
    if (!cart.restaurant_id) return;
    if (!addressId) {
      toast.show("Please select a delivery address", "error");
      return;
    }
    setPlacing(true);
    try {
      const res = await api<{ order: any; razorpay_order?: any }>("/api/food/orders", {
        method: "POST",
        body: {
          restaurant_id: cart.restaurant_id,
          items: cart.items.map((i) => ({
            food_id: i.food_id,
            quantity: i.quantity,
            variant_id: i.variant_id,
            addon_ids: i.addon_ids,
            special_instructions: i.special_instructions,
          })),
          address_id: addressId,
          coupon_code: coupon || null,
          payment_method: payment,
        },
      });
      // For razorpay stub mode, auto-verify to mark as paid
      if (payment === "razorpay" && res.razorpay_order) {
        try {
          await api("/api/food/orders/verify-payment", {
            method: "POST",
            body: {
              order_id: res.order.id,
              razorpay_payment_id: `pay_stub_${Date.now()}`,
              razorpay_signature: "stub-signature",
            },
          });
        } catch { /* ignore */ }
      }
      clear();
      router.replace({ pathname: "/(customer)/order-success", params: { id: res.order.id } });
    } catch (e: any) {
      toast.show(e?.message || "Failed to place order", "error");
    } finally {
      setPlacing(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} testID="back-btn">
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[typography.h4, { color: colors.text }]}>Checkout</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: 200 }}>
        {/* Address section */}
        <Card style={{ padding: spacing.md, gap: spacing.sm }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text style={[typography.subtitle, { color: colors.text }]}>Delivery Address</Text>
            <Pressable onPress={() => router.push("/(customer)/addresses")} testID="add-address-btn">
              <Text style={{ ...typography.body, color: colors.primary, fontWeight: "700" }}>{addresses.length > 0 ? "Manage" : "+ Add"}</Text>
            </Pressable>
          </View>
          {addresses.length === 0 ? (
            <View style={{ alignItems: "center", padding: spacing.md, gap: 8 }}>
              <Ionicons name="location-outline" size={32} color={colors.textTertiary} />
              <Text style={{ color: colors.textSecondary, textAlign: "center" }}>Add a delivery address to continue</Text>
              <Button title="Add address" onPress={() => router.push("/(customer)/addresses")} size="sm" testID="checkout-add-address-btn" />
            </View>
          ) : (
            addresses.map((a) => {
              const selected = addressId === a.id;
              return (
                <Pressable
                  key={a.id}
                  onPress={() => setAddressId(a.id)}
                  style={{ flexDirection: "row", alignItems: "flex-start", gap: 12, paddingVertical: 8 }}
                  testID={`address-${a.id}`}
                >
                  <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: selected ? colors.primary : colors.border, alignItems: "center", justifyContent: "center", marginTop: 2 }}>
                    {selected && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary }} />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Text style={[typography.subtitle, { color: colors.text }]}>{a.label}</Text>
                      {a.is_default && <Text style={{ backgroundColor: colors.success + "20", color: colors.success, paddingHorizontal: 6, paddingVertical: 2, fontSize: 10, borderRadius: radii.sm, fontWeight: "700" }}>DEFAULT</Text>}
                    </View>
                    <Text style={[typography.body, { color: colors.textSecondary }]} numberOfLines={2}>{a.line1}, {a.city}, {a.state} - {a.pincode}</Text>
                  </View>
                </Pressable>
              );
            })
          )}
        </Card>

        {/* Payment */}
        <Card style={{ padding: spacing.md, gap: spacing.md }}>
          <Text style={[typography.subtitle, { color: colors.text }]}>Payment method</Text>
          {PAYMENT_METHODS.map((p) => {
            const selected = payment === p.id;
            return (
              <Pressable
                key={p.id}
                onPress={() => setPayment(p.id as any)}
                style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8 }}
                testID={`payment-${p.id}`}
              >
                <View style={{ width: 44, height: 44, borderRadius: radii.md, backgroundColor: colors.primary + "10", alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name={p.icon as any} size={22} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[typography.subtitle, { color: colors.text }]}>{p.label}</Text>
                  <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>{p.desc}</Text>
                </View>
                <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: selected ? colors.primary : colors.border, alignItems: "center", justifyContent: "center" }}>
                  {selected && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary }} />}
                </View>
              </Pressable>
            );
          })}
        </Card>

        {/* Note */}
        <View style={{ padding: 12, backgroundColor: colors.warning + "10", borderRadius: radii.md, borderLeftWidth: 4, borderLeftColor: colors.warning }}>
          <Text style={[typography.bodySmall, { color: colors.warning, fontWeight: "700" }]}>⚡ Razorpay is in DEMO mode</Text>
          <Text style={[typography.bodySmall, { color: colors.textSecondary, marginTop: 2 }]}>Add real RAZORPAY_KEY_ID/SECRET in backend .env to enable production payments.</Text>
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.surfaceElevated, borderTopColor: colors.border }]}>
        <Button title={`Place Order · ${payment === "cod" ? "Pay on delivery" : "Pay Online"}`} onPress={placeOrder} loading={placing} testID="place-order-btn" fullWidth />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  footer: { padding: spacing.md, borderTopWidth: 1, position: "absolute", bottom: 0, left: 0, right: 0 },
});
