import React, { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Image, Pressable, ActivityIndicator, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "@/src/theme/ThemeContext";
import { useCart } from "@/src/contexts/CartContext";
import { api } from "@/src/api/client";
import { Card } from "@/src/components/ui/Card";
import { Button } from "@/src/components/ui/Button";
import { useToast } from "@/src/components/ui/Toast";
import { spacing, typography, radii } from "@/src/theme/tokens";

type Quote = {
  subtotal: number;
  delivery_fee: number;
  platform_fee: number;
  packaging_fee: number;
  taxes: number;
  discount: number;
  grand_total: number;
  coupon: any;
};

export default function CartScreen() {
  const { colors } = useTheme();
  const { cart, updateQuantity, removeItem, itemCount, clear } = useCart();
  const router = useRouter();
  const toast = useToast();

  const [coupon, setCoupon] = useState("");
  const [applied, setApplied] = useState<string | null>(null);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchQuote = useCallback(async () => {
    if (!cart.restaurant_id || cart.items.length === 0) {
      setQuote(null);
      return;
    }
    setLoading(true);
    try {
      const res = await api<Quote>("/api/food/orders/quote", {
        method: "POST",
        body: {
          restaurant_id: cart.restaurant_id,
          items: cart.items.map((i) => ({
            food_id: i.food_id,
            quantity: i.quantity,
            variant_id: i.variant_id,
            addon_ids: i.addon_ids,
          })),
          coupon_code: applied,
        },
      });
      setQuote(res);
    } catch (e: any) {
      toast.show(e?.message || "Failed to load price", "error");
    } finally {
      setLoading(false);
    }
  }, [cart, applied, toast]);

  useEffect(() => {
    void fetchQuote();
  }, [fetchQuote]);

  const applyCoupon = async () => {
    if (!coupon) return;
    setApplied(coupon.toUpperCase());
    toast.show(`Coupon ${coupon.toUpperCase()} applied`, "success");
    setCoupon("");
  };
  const removeCoupon = () => {
    setApplied(null);
  };

  if (itemCount === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} testID="back-btn">
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={[typography.h4, { color: colors.text }]}>Cart</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl, gap: spacing.md }}>
          <Ionicons name="cart-outline" size={80} color={colors.textTertiary} />
          <Text style={[typography.h4, { color: colors.text }]}>Your cart is empty</Text>
          <Text style={[typography.body, { color: colors.textSecondary, textAlign: "center" }]}>Browse restaurants and add some delicious food</Text>
          <Button title="Explore restaurants" onPress={() => router.replace("/(customer)/(tabs)")} testID="cart-empty-cta" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} testID="back-btn">
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[typography.h4, { color: colors.text }]}>Cart</Text>
        <Pressable onPress={() => { clear(); toast.show("Cart cleared", "info"); }} testID="clear-cart-btn">
          <Text style={{ ...typography.body, color: colors.error, fontWeight: "700" }}>Clear</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: 200 }}>
        <Card style={{ padding: spacing.md, flexDirection: "row", gap: spacing.md, alignItems: "center" }}>
          {cart.restaurant_image ? <Image source={{ uri: cart.restaurant_image }} style={{ width: 48, height: 48, borderRadius: radii.md }} /> : null}
          <Text style={[typography.subtitle, { color: colors.text, flex: 1 }]} numberOfLines={1}>{cart.restaurant_name}</Text>
        </Card>

        {/* Items */}
        <Card style={{ padding: spacing.md, gap: spacing.md }}>
          {cart.items.map((it) => (
            <View key={`${it.food_id}-${it.variant_id ?? ""}`} style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={[typography.body, { color: colors.text, fontWeight: "600" }]} numberOfLines={2}>{it.name}</Text>
                {it.variant_name ? <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>{it.variant_name}</Text> : null}
                {it.addon_names.length > 0 ? <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>+ {it.addon_names.join(", ")}</Text> : null}
                <Text style={[typography.subtitle, { color: colors.text, marginTop: 2 }]}>₹{(it.unit_price * it.quantity).toFixed(0)}</Text>
              </View>
              <View style={[styles.qtyBox, { borderColor: colors.primary }]}>
                <Pressable onPress={() => updateQuantity(it.food_id, it.variant_id, it.quantity - 1)} style={styles.qtyBtn} testID={`decrease-${it.food_id}`}>
                  <Ionicons name="remove" size={16} color={colors.primary} />
                </Pressable>
                <Text style={[typography.subtitle, { color: colors.primary, minWidth: 24, textAlign: "center" }]}>{it.quantity}</Text>
                <Pressable onPress={() => updateQuantity(it.food_id, it.variant_id, it.quantity + 1)} style={styles.qtyBtn} testID={`increase-${it.food_id}`}>
                  <Ionicons name="add" size={16} color={colors.primary} />
                </Pressable>
              </View>
            </View>
          ))}
        </Card>

        {/* Coupon */}
        <Card style={{ padding: spacing.md, gap: spacing.md }}>
          <Text style={[typography.subtitle, { color: colors.text }]}>Apply Coupon</Text>
          {applied ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: colors.success + "15", padding: 12, borderRadius: radii.md }}>
              <Ionicons name="pricetag" size={16} color={colors.success} />
              <Text style={{ flex: 1, ...typography.body, color: colors.success, fontWeight: "700" }}>{applied} applied</Text>
              <Pressable onPress={removeCoupon} testID="remove-coupon-btn"><Text style={{ color: colors.error, fontWeight: "700" }}>Remove</Text></Pressable>
            </View>
          ) : (
            <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
              <TextInput
                value={coupon}
                onChangeText={setCoupon}
                placeholder="Try WELCOME50 or SAVE20"
                autoCapitalize="characters"
                placeholderTextColor={colors.textTertiary}
                style={[styles.couponInput, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
                testID="coupon-input"
              />
              <Button title="Apply" onPress={applyCoupon} size="sm" testID="apply-coupon-btn" />
            </View>
          )}
        </Card>

        {/* Bill */}
        {quote && (
          <Card style={{ padding: spacing.md, gap: 8 }}>
            <Text style={[typography.subtitle, { color: colors.text, marginBottom: 4 }]}>Bill details</Text>
            <BillRow label="Item total" value={quote.subtotal} />
            <BillRow label="Delivery fee" value={quote.delivery_fee} />
            <BillRow label="Platform fee" value={quote.platform_fee} />
            <BillRow label="Packaging fee" value={quote.packaging_fee} />
            <BillRow label="Taxes (5% GST)" value={quote.taxes} />
            {quote.discount > 0 && <BillRow label={`Discount (${applied})`} value={-quote.discount} highlight />}
            <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 6 }} />
            <BillRow label="Grand Total" value={quote.grand_total} bold />
          </Card>
        )}
        {loading && <ActivityIndicator color={colors.primary} />}
      </ScrollView>

      {/* Checkout CTA */}
      {quote && (
        <View style={[styles.footer, { backgroundColor: colors.surfaceElevated, borderTopColor: colors.border }]}>
          <View style={{ flex: 1 }}>
            <Text style={[typography.h4, { color: colors.text }]}>₹{quote.grand_total.toFixed(0)}</Text>
            <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>{itemCount} item{itemCount > 1 ? "s" : ""}</Text>
          </View>
          <Button title="Proceed to Checkout" onPress={() => router.push({ pathname: "/(customer)/checkout", params: { coupon: applied ?? "" } })} testID="checkout-btn" style={{ flex: 1.2 }} />
        </View>
      )}
    </SafeAreaView>
  );
}

function BillRow({ label, value, bold, highlight }: { label: string; value: number; bold?: boolean; highlight?: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
      <Text style={[bold ? typography.subtitle : typography.body, { color: highlight ? colors.success : colors.text }]}>{label}</Text>
      <Text style={[bold ? typography.subtitle : typography.body, { color: highlight ? colors.success : colors.text, fontWeight: bold ? "700" : "500" }]}>
        {value < 0 ? `- ₹${Math.abs(value).toFixed(2)}` : `₹${value.toFixed(2)}`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  qtyBox: { flexDirection: "row", alignItems: "center", borderWidth: 1.5, borderRadius: radii.md },
  qtyBtn: { paddingHorizontal: 10, paddingVertical: 6 },
  couponInput: { flex: 1, height: 44, borderRadius: radii.md, borderWidth: 1, paddingHorizontal: spacing.md, ...typography.body },
  footer: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.md, borderTopWidth: 1, position: "absolute", bottom: 0, left: 0, right: 0 },
});
