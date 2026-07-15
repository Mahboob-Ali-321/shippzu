import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Image, Pressable, ActivityIndicator, Dimensions, TextInput, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "@/src/theme/ThemeContext";
import { useCart } from "@/src/contexts/CartContext";
import { api } from "@/src/api/client";
import { Card } from "@/src/components/ui/Card";
import { Button } from "@/src/components/ui/Button";
import { VegBadge } from "@/src/components/ui/VegBadge";
import { useToast } from "@/src/components/ui/Toast";
import { spacing, typography, radii } from "@/src/theme/tokens";

const { width } = Dimensions.get("window");

type Variant = { id: string; name: string; price: number };
type Addon = { id: string; name: string; price: number };
type Food = {
  id: string;
  restaurant_id: string;
  name: string;
  description: string;
  image: string;
  price: number;
  veg: boolean;
  is_bestseller: boolean;
  is_recommended: boolean;
  rating?: number;
  menu_category: string;
  variants: Variant[];
  addons: Addon[];
};

type Restaurant = {
  id: string;
  name: string;
  cover_image: string;
  rating: number;
  delivery_time_min: number;
  delivery_time_max: number;
  cuisines: string[];
};

export default function FoodDetail() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const { cart, addItem, replaceCart } = useCart();

  const [food, setFood] = useState<Food | null>(null);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);

  const [variantId, setVariantId] = useState<string | undefined>();
  const [addonIds, setAddonIds] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [instructions, setInstructions] = useState("");
  const [fav, setFav] = useState(false);
  const [conflictOpen, setConflictOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const f = await api<Food>(`/api/food/foods/${id}`);
        setFood(f);
        setVariantId(f.variants[0]?.id);
        try {
          const r = await api<{ restaurant: Restaurant }>(`/api/food/restaurants/${f.restaurant_id}`);
          setRestaurant(r.restaurant);
        } catch { /* ignore */ }
      } catch (e: any) {
        toast.show(e?.message || "Failed to load", "error");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, toast]);

  const variant = useMemo(() => food?.variants.find((v) => v.id === variantId), [food, variantId]);
  const basePrice = variant?.price ?? food?.price ?? 0;
  const addonTotal = useMemo(
    () => (food?.addons.filter((a) => addonIds.includes(a.id)).reduce((s, a) => s + a.price, 0) ?? 0),
    [food, addonIds],
  );
  const unitPrice = basePrice + addonTotal;
  const total = unitPrice * quantity;

  const toggleFav = useCallback(async () => {
    if (!food) return;
    try {
      const res = await api<{ favourited: boolean }>("/api/food/favourites/toggle", {
        method: "POST",
        body: { kind: "food", target_id: food.id },
      });
      setFav(res.favourited);
      toast.show(res.favourited ? "Added to food favourites" : "Removed from food favourites", "success");
    } catch (e: any) {
      toast.show(e?.message || "Failed", "error");
    }
  }, [food, toast]);

  const doAdd = useCallback(() => {
    if (!food || !restaurant) return;
    const line = {
      food_id: food.id,
      name: food.name,
      image: food.image,
      unit_price: unitPrice,
      quantity,
      variant_id: variantId,
      variant_name: variant?.name,
      addon_ids: addonIds,
      addon_names: food.addons.filter((a) => addonIds.includes(a.id)).map((a) => a.name),
      special_instructions: instructions || undefined,
    };
    const res = addItem(restaurant.id, restaurant.name, restaurant.cover_image, line);
    if (res.conflict) {
      setConflictOpen(true);
    } else {
      toast.show(`${quantity} × ${food.name} added to cart`, "success");
      router.back();
    }
  }, [food, restaurant, unitPrice, quantity, variantId, variant, addonIds, instructions, addItem, toast, router]);

  const doReplace = useCallback(() => {
    if (!food || !restaurant) return;
    replaceCart(restaurant.id, restaurant.name, restaurant.cover_image, {
      food_id: food.id,
      name: food.name,
      image: food.image,
      unit_price: unitPrice,
      quantity,
      variant_id: variantId,
      variant_name: variant?.name,
      addon_ids: addonIds,
      addon_names: food.addons.filter((a) => addonIds.includes(a.id)).map((a) => a.name),
      special_instructions: instructions || undefined,
    });
    toast.show(`Cart replaced with ${food.name}`, "success");
    setConflictOpen(false);
    router.back();
  }, [food, restaurant, unitPrice, quantity, variantId, variant, addonIds, instructions, replaceCart, toast, router]);

  if (loading || !food) {
    return (
      <SafeAreaView style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </SafeAreaView>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
        {/* Hero image */}
        <View>
          <Image source={{ uri: food.image }} style={styles.hero} />
          <View style={styles.heroOverlay} />
          <SafeAreaView style={styles.heroTopBar} edges={["top"]}>
            <Pressable onPress={() => router.back()} style={styles.iconBtn} testID="food-back-btn">
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </Pressable>
            <Pressable onPress={toggleFav} style={styles.iconBtn} testID="food-fav-btn">
              <Ionicons name={fav ? "heart" : "heart-outline"} size={22} color={fav ? "#FF5A1F" : "#fff"} />
            </Pressable>
          </SafeAreaView>
        </View>

        {/* Info */}
        <View style={{ padding: spacing.lg, gap: spacing.sm }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <VegBadge veg={food.veg} size={16} />
            {food.is_bestseller ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radii.sm, backgroundColor: colors.warning + "20" }}>
                <Ionicons name="star" size={11} color={colors.warning} />
                <Text style={{ color: colors.warning, fontSize: 11, fontWeight: "700" }}>BESTSELLER</Text>
              </View>
            ) : null}
            {food.is_recommended ? (
              <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: radii.sm, backgroundColor: colors.primary + "15" }}>
                <Text style={{ color: colors.primary, fontSize: 11, fontWeight: "700" }}>RECOMMENDED</Text>
              </View>
            ) : null}
          </View>
          <Text style={[typography.h2, { color: colors.text }]}>{food.name}</Text>
          {restaurant ? (
            <Pressable
              onPress={() => router.push({ pathname: "/(customer)/restaurant/[id]", params: { id: restaurant.id } })}
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
              testID="food-restaurant-link"
            >
              <Ionicons name="storefront-outline" size={14} color={colors.textSecondary} />
              <Text style={[typography.body, { color: colors.primary, fontWeight: "700" }]}>{restaurant.name}</Text>
              <Ionicons name="chevron-forward" size={14} color={colors.primary} />
            </Pressable>
          ) : null}
          {food.rating ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Ionicons name="star" size={14} color={colors.warning} />
              <Text style={[typography.body, { color: colors.text, fontWeight: "600" }]}>{food.rating.toFixed(1)}</Text>
            </View>
          ) : null}
          <Text style={[typography.bodyLarge, { color: colors.textSecondary, lineHeight: 22, marginTop: 4 }]}>{food.description}</Text>
          <Text style={[typography.h3, { color: colors.text, marginTop: spacing.sm }]}>₹{food.price.toFixed(0)}</Text>
        </View>

        {/* Variants */}
        {food.variants.length > 0 ? (
          <View style={{ paddingHorizontal: spacing.lg, gap: spacing.sm }}>
            <Text style={[typography.h4, { color: colors.text }]}>Choose a size</Text>
            <Card style={{ padding: spacing.md }}>
              {food.variants.map((v, idx) => {
                const selected = variantId === v.id;
                return (
                  <Pressable
                    key={v.id}
                    onPress={() => setVariantId(v.id)}
                    style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10, borderBottomColor: colors.border, borderBottomWidth: idx === food.variants.length - 1 ? 0 : StyleSheet.hairlineWidth }}
                    testID={`fooddetail-variant-${v.id}`}
                  >
                    <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: selected ? colors.primary : colors.border, alignItems: "center", justifyContent: "center" }}>
                      {selected ? <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary }} /> : null}
                    </View>
                    <Text style={{ flex: 1, ...typography.body, color: colors.text }}>{v.name}</Text>
                    <Text style={[typography.body, { color: colors.textSecondary }]}>₹{v.price.toFixed(0)}</Text>
                  </Pressable>
                );
              })}
            </Card>
          </View>
        ) : null}

        {/* Addons */}
        {food.addons.length > 0 ? (
          <View style={{ paddingHorizontal: spacing.lg, gap: spacing.sm, marginTop: spacing.md }}>
            <Text style={[typography.h4, { color: colors.text }]}>Add-ons</Text>
            <Card style={{ padding: spacing.md }}>
              {food.addons.map((a, idx) => {
                const selected = addonIds.includes(a.id);
                return (
                  <Pressable
                    key={a.id}
                    onPress={() => setAddonIds((prev) => (selected ? prev.filter((x) => x !== a.id) : [...prev, a.id]))}
                    style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10, borderBottomColor: colors.border, borderBottomWidth: idx === food.addons.length - 1 ? 0 : StyleSheet.hairlineWidth }}
                    testID={`fooddetail-addon-${a.id}`}
                  >
                    <View style={{ width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: selected ? colors.primary : colors.border, alignItems: "center", justifyContent: "center", backgroundColor: selected ? colors.primary : "transparent" }}>
                      {selected ? <Ionicons name="checkmark" size={14} color="#fff" /> : null}
                    </View>
                    <Text style={{ flex: 1, ...typography.body, color: colors.text }}>{a.name}</Text>
                    <Text style={[typography.body, { color: colors.textSecondary }]}>+₹{a.price.toFixed(0)}</Text>
                  </Pressable>
                );
              })}
            </Card>
          </View>
        ) : null}

        {/* Special instructions */}
        <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.md, gap: spacing.sm }}>
          <Text style={[typography.h4, { color: colors.text }]}>Special instructions</Text>
          <View style={[styles.textArea, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TextInput
              value={instructions}
              onChangeText={setInstructions}
              placeholder="Add a note for the restaurant (allergies, extra spice, no onion, etc.)"
              placeholderTextColor={colors.textTertiary}
              multiline
              numberOfLines={3}
              style={{ ...typography.body, color: colors.text, minHeight: 60 }}
              testID="fooddetail-instructions"
            />
          </View>
        </View>

        {/* Quantity */}
        <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.md, gap: spacing.sm }}>
          <Text style={[typography.h4, { color: colors.text }]}>Quantity</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View style={[styles.qtyBox, { borderColor: colors.primary }]}>
              <Pressable onPress={() => setQuantity(Math.max(1, quantity - 1))} style={styles.qtyBtn} testID="fooddetail-qty-dec">
                <Ionicons name="remove" size={18} color={colors.primary} />
              </Pressable>
              <Text style={[typography.h4, { color: colors.primary, minWidth: 30, textAlign: "center" }]}>{quantity}</Text>
              <Pressable onPress={() => setQuantity(Math.min(20, quantity + 1))} style={styles.qtyBtn} testID="fooddetail-qty-inc">
                <Ionicons name="add" size={18} color={colors.primary} />
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Sticky footer */}
      <View style={[styles.footer, { backgroundColor: colors.surfaceElevated, borderTopColor: colors.border }]}>
        <View style={{ flex: 1 }}>
          <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>{quantity} × ₹{unitPrice.toFixed(0)}</Text>
          <Text style={[typography.h4, { color: colors.text }]}>Total ₹{total.toFixed(0)}</Text>
        </View>
        <Button title="Add to cart" onPress={doAdd} style={{ flex: 1.2 }} testID="fooddetail-add-btn" />
      </View>

      {/* Cart conflict modal */}
      <Modal visible={conflictOpen} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <Card style={{ padding: spacing.lg, gap: spacing.md, margin: spacing.lg }}>
            <Text style={[typography.h4, { color: colors.text }]}>Replace items in cart?</Text>
            <Text style={[typography.body, { color: colors.textSecondary }]}>
              Your cart contains items from {cart.restaurant_name}. Adding this item will clear the current cart.
            </Text>
            <View style={{ flexDirection: "row", gap: spacing.sm }}>
              <Button title="Cancel" variant="secondary" onPress={() => setConflictOpen(false)} style={{ flex: 1 }} testID="fooddetail-conflict-cancel" />
              <Button title="Yes, replace" onPress={doReplace} style={{ flex: 1 }} testID="fooddetail-conflict-confirm" />
            </View>
          </Card>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { width: "100%", height: 320 },
  heroOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.2)" },
  heroTopBar: { position: "absolute", top: 0, left: 0, right: 0, flexDirection: "row", justifyContent: "space-between", paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(0,0,0,0.35)", alignItems: "center", justifyContent: "center" },
  qtyBox: { flexDirection: "row", alignItems: "center", borderWidth: 2, borderRadius: radii.md },
  qtyBtn: { paddingHorizontal: 14, paddingVertical: 8 },
  textArea: { borderRadius: radii.md, borderWidth: 1, padding: spacing.md },
  footer: { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.md, borderTopWidth: 1 },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center" },
});
