import React, { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, Image, Pressable, ActivityIndicator, Modal } from "react-native";
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
  variants: Variant[];
  addons: Addon[];
};

type Restaurant = {
  id: string;
  name: string;
  tagline: string;
  cover_image: string;
  rating: number;
  total_ratings: number;
  delivery_time_min: number;
  delivery_time_max: number;
  delivery_fee: number;
  cost_for_two: number;
  cuisines: string[];
  address: string;
  offers: string[];
};

type Data = { restaurant: Restaurant; menu: { category: string; items: Food[] }[] };

export default function RestaurantDetails() {
  const { colors, isDark } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const { cart, itemCount, subtotal, addItem, replaceCart } = useCart();
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [conflictFood, setConflictFood] = useState<Food | null>(null);
  const [fav, setFav] = useState(false);

  useEffect(() => {
    if (!id) return;
    api<Data>(`/api/food/restaurants/${id}`).then(setData).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  const handleAdd = useCallback(
    (food: Food) => {
      // items with variants/addons open customizer bottom sheet
      if (food.variants.length > 0 || food.addons.length > 0) {
        setSelectedFood(food);
        return;
      }
      if (!data) return;
      const line = {
        food_id: food.id,
        name: food.name,
        image: food.image,
        unit_price: food.price,
        quantity: 1,
        addon_ids: [],
        addon_names: [],
      };
      const res = addItem(data.restaurant.id, data.restaurant.name, data.restaurant.cover_image, line);
      if (res.conflict) {
        setConflictFood(food);
      } else {
        toast.show(`${food.name} added to cart`, "success");
      }
    },
    [addItem, data, toast],
  );

  const toggleFav = useCallback(async () => {
    if (!id) return;
    try {
      const res = await api<{ favourited: boolean }>("/api/food/favourites/toggle", {
        method: "POST",
        body: { kind: "restaurant", target_id: id },
      });
      setFav(res.favourited);
      toast.show(res.favourited ? "Added to favourites" : "Removed from favourites", "success");
    } catch (e: any) {
      toast.show(e?.message || "Failed", "error");
    }
  }, [id, toast]);

  if (loading || !data) {
    return (
      <SafeAreaView style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </SafeAreaView>
    );
  }

  const r = data.restaurant;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: itemCount > 0 ? 120 : 40 }} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View>
          <Image source={{ uri: r.cover_image }} style={styles.hero} />
          <View style={styles.heroOverlay} />
          <SafeAreaView style={styles.heroTopBar} edges={["top"]}>
            <Pressable onPress={() => router.back()} style={styles.iconBtn} testID="back-btn">
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </Pressable>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <Pressable onPress={toggleFav} style={styles.iconBtn} testID="fav-btn">
                <Ionicons name={fav ? "heart" : "heart-outline"} size={22} color="#fff" />
              </Pressable>
              <Pressable style={styles.iconBtn} testID="share-btn">
                <Ionicons name="share-outline" size={22} color="#fff" />
              </Pressable>
            </View>
          </SafeAreaView>
        </View>

        {/* Info card overlapping hero */}
        <Card style={styles.infoCard}>
          <Text style={[typography.h2, { color: colors.text }]}>{r.name}</Text>
          <Text style={[typography.body, { color: colors.textSecondary, marginTop: 4 }]}>{r.tagline}</Text>
          <Text style={[typography.bodySmall, { color: colors.textTertiary, marginTop: 2 }]}>{r.cuisines.join(" · ")}</Text>

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Ionicons name="star" size={16} color={colors.warning} />
                <Text style={[typography.subtitle, { color: colors.text }]}>{r.rating.toFixed(1)}</Text>
              </View>
              <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>{r.total_ratings}+ ratings</Text>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.stat}>
              <Text style={[typography.subtitle, { color: colors.text }]}>{r.delivery_time_min}-{r.delivery_time_max}</Text>
              <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>minutes</Text>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.stat}>
              <Text style={[typography.subtitle, { color: colors.text }]}>₹{r.cost_for_two}</Text>
              <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>for two</Text>
            </View>
          </View>

          {r.offers[0] && (
            <View style={[styles.offerBanner, { borderColor: colors.primary, backgroundColor: colors.primary + "10" }]}>
              <Ionicons name="pricetag" size={16} color={colors.primary} />
              <Text style={[typography.body, { color: colors.primary, fontWeight: "700" }]}>{r.offers[0]}</Text>
            </View>
          )}
        </Card>

        {/* Menu */}
        {data.menu.map((section) => (
          <View key={section.category} style={{ marginTop: spacing.lg, paddingHorizontal: spacing.lg }}>
            <Text style={[typography.h4, { color: colors.text, marginBottom: spacing.md }]}>{section.category}</Text>
            <View style={{ gap: spacing.md }}>
              {section.items.map((food) => (
                <Card key={food.id} style={{ flexDirection: "row", padding: 12, gap: 12 }}>
                  <View style={{ flex: 1, gap: 4 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <VegBadge veg={food.veg} />
                      {food.is_bestseller && (
                        <View style={{ backgroundColor: colors.warning + "20", paddingHorizontal: 8, paddingVertical: 2, borderRadius: radii.sm, flexDirection: "row", gap: 3, alignItems: "center" }}>
                          <Ionicons name="star" size={10} color={colors.warning} />
                          <Text style={{ color: colors.warning, fontSize: 10, fontWeight: "700" }}>BESTSELLER</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[typography.subtitle, { color: colors.text }]} numberOfLines={2}>{food.name}</Text>
                    <Text style={[typography.h4, { color: colors.text }]}>₹{food.price.toFixed(0)}</Text>
                    <Text style={[typography.bodySmall, { color: colors.textSecondary }]} numberOfLines={2}>{food.description}</Text>
                  </View>
                  <View style={{ alignItems: "center", gap: 8 }}>
                    <Image source={{ uri: food.image }} style={{ width: 100, height: 100, borderRadius: radii.lg }} />
                    <Pressable
                      onPress={() => handleAdd(food)}
                      style={[styles.addBtn, { borderColor: colors.primary, backgroundColor: colors.background }]}
                      testID={`add-food-${food.id}`}
                    >
                      <Text style={[typography.subtitle, { color: colors.primary, fontWeight: "700" }]}>ADD</Text>
                      {(food.variants.length > 0 || food.addons.length > 0) && (
                        <Text style={{ position: "absolute", bottom: -14, color: colors.textTertiary, fontSize: 9 }}>customisable</Text>
                      )}
                    </Pressable>
                  </View>
                </Card>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Floating cart chip */}
      {itemCount > 0 && (
        <Pressable
          style={[styles.floatingCart, { backgroundColor: colors.primary }]}
          onPress={() => router.push("/(customer)/cart")}
          testID="restaurant-view-cart-btn"
        >
          <View>
            <Text style={{ color: "#fff", ...typography.bodySmall, opacity: 0.9 }}>{itemCount} item{itemCount > 1 ? "s" : ""}</Text>
            <Text style={{ color: "#fff", ...typography.subtitle }}>₹{subtotal.toFixed(0)}</Text>
          </View>
          <Text style={{ color: "#fff", ...typography.subtitle, fontWeight: "700" }}>View cart →</Text>
        </Pressable>
      )}

      {/* Food customiser modal */}
      <FoodCustomiser
        food={selectedFood}
        onClose={() => setSelectedFood(null)}
        onConfirm={(line) => {
          if (!selectedFood || !data) return;
          const res = addItem(data.restaurant.id, data.restaurant.name, data.restaurant.cover_image, line);
          if (res.conflict) {
            setConflictFood(selectedFood);
          } else {
            toast.show(`${selectedFood.name} added to cart`, "success");
          }
          setSelectedFood(null);
        }}
      />

      {/* Cart conflict modal */}
      <Modal visible={!!conflictFood} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <Card style={{ padding: spacing.lg, gap: spacing.md, margin: spacing.lg }}>
            <Text style={[typography.h4, { color: colors.text }]}>Replace items in cart?</Text>
            <Text style={[typography.body, { color: colors.textSecondary }]}>
              Your cart contains items from {cart.restaurant_name}. Adding items from {data.restaurant.name} will clear the current cart.
            </Text>
            <View style={{ flexDirection: "row", gap: spacing.sm }}>
              <Button title="Cancel" variant="secondary" onPress={() => setConflictFood(null)} style={{ flex: 1 }} testID="conflict-cancel" />
              <Button
                title="Yes, replace"
                onPress={() => {
                  if (!conflictFood || !data) return;
                  replaceCart(data.restaurant.id, data.restaurant.name, data.restaurant.cover_image, {
                    food_id: conflictFood.id,
                    name: conflictFood.name,
                    image: conflictFood.image,
                    unit_price: conflictFood.price,
                    quantity: 1,
                    addon_ids: [],
                    addon_names: [],
                  });
                  toast.show(`Cart replaced with ${conflictFood.name}`, "success");
                  setConflictFood(null);
                }}
                style={{ flex: 1 }}
                testID="conflict-confirm"
              />
            </View>
          </Card>
        </View>
      </Modal>
    </View>
  );
}

function FoodCustomiser({
  food,
  onClose,
  onConfirm,
}: {
  food: Food | null;
  onClose: () => void;
  onConfirm: (line: any) => void;
}) {
  const { colors } = useTheme();
  const [variantId, setVariantId] = useState<string | undefined>();
  const [addonIds, setAddonIds] = useState<string[]>([]);

  useEffect(() => {
    setVariantId(food?.variants[0]?.id);
    setAddonIds([]);
  }, [food]);

  if (!food) return null;
  const variant = food.variants.find((v) => v.id === variantId);
  const basePrice = variant?.price ?? food.price;
  const addonTotal = food.addons.filter((a) => addonIds.includes(a.id)).reduce((s, a) => s + a.price, 0);
  const unit = basePrice + addonTotal;

  return (
    <Modal visible={!!food} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={[styles.bottomSheet, { backgroundColor: colors.background }]}>
          <View style={{ alignItems: "center", paddingTop: 10 }}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border }} />
          </View>
          <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <VegBadge veg={food.veg} />
              <Text style={[typography.h3, { color: colors.text }]}>{food.name}</Text>
            </View>
            <Text style={[typography.body, { color: colors.textSecondary }]}>{food.description}</Text>

            {food.variants.length > 0 && (
              <View style={{ gap: 8 }}>
                <Text style={[typography.subtitle, { color: colors.text }]}>Choose a size</Text>
                {food.variants.map((v) => (
                  <Pressable
                    key={v.id}
                    onPress={() => setVariantId(v.id)}
                    style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8 }}
                    testID={`variant-${v.id}`}
                  >
                    <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: variantId === v.id ? colors.primary : colors.border, alignItems: "center", justifyContent: "center" }}>
                      {variantId === v.id ? <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary }} /> : null}
                    </View>
                    <Text style={{ flex: 1, ...typography.body, color: colors.text }}>{v.name}</Text>
                    <Text style={[typography.body, { color: colors.textSecondary }]}>₹{v.price.toFixed(0)}</Text>
                  </Pressable>
                ))}
              </View>
            )}

            {food.addons.length > 0 && (
              <View style={{ gap: 8, marginTop: spacing.md }}>
                <Text style={[typography.subtitle, { color: colors.text }]}>Add-ons</Text>
                {food.addons.map((a) => {
                  const selected = addonIds.includes(a.id);
                  return (
                    <Pressable
                      key={a.id}
                      onPress={() => setAddonIds((prev) => (selected ? prev.filter((id) => id !== a.id) : [...prev, a.id]))}
                      style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8 }}
                      testID={`addon-${a.id}`}
                    >
                      <View style={{ width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: selected ? colors.primary : colors.border, alignItems: "center", justifyContent: "center", backgroundColor: selected ? colors.primary : "transparent" }}>
                        {selected ? <Ionicons name="checkmark" size={14} color="#fff" /> : null}
                      </View>
                      <Text style={{ flex: 1, ...typography.body, color: colors.text }}>{a.name}</Text>
                      <Text style={[typography.body, { color: colors.textSecondary }]}>+₹{a.price.toFixed(0)}</Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </ScrollView>
          <View style={{ padding: spacing.lg, flexDirection: "row", gap: spacing.sm }}>
            <Button title="Cancel" variant="secondary" onPress={onClose} style={{ flex: 1 }} testID="customiser-cancel" />
            <Button
              title={`Add · ₹${unit.toFixed(0)}`}
              onPress={() => onConfirm({
                food_id: food.id,
                name: food.name,
                image: food.image,
                unit_price: unit,
                quantity: 1,
                variant_id: variantId,
                variant_name: variant?.name,
                addon_ids: addonIds,
                addon_names: food.addons.filter((a) => addonIds.includes(a.id)).map((a) => a.name),
              })}
              style={{ flex: 1 }}
              testID="customiser-add-btn"
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  hero: { width: "100%", height: 260 },
  heroOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.3)" },
  heroTopBar: { position: "absolute", top: 0, left: 0, right: 0, flexDirection: "row", justifyContent: "space-between", paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(0,0,0,0.35)", alignItems: "center", justifyContent: "center" },
  infoCard: { marginTop: -32, marginHorizontal: spacing.lg, padding: spacing.lg, gap: 4 },
  statsRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginTop: spacing.md, paddingVertical: spacing.md },
  stat: { flex: 1, alignItems: "center" },
  divider: { width: 1, height: 32 },
  offerBanner: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: spacing.md, paddingVertical: 10, borderRadius: radii.md, borderWidth: 1, borderStyle: "dashed" },
  addBtn: { paddingHorizontal: 24, paddingVertical: 8, borderRadius: radii.md, borderWidth: 1.5, alignItems: "center" },
  floatingCart: { position: "absolute", bottom: 20, left: spacing.lg, right: spacing.lg, borderRadius: radii.xl, padding: spacing.md, flexDirection: "row", alignItems: "center", justifyContent: "space-between", elevation: 10, shadowColor: "#FF5A1F", shadowOpacity: 0.4, shadowRadius: 16, shadowOffset: { width: 0, height: 8 } },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  bottomSheet: { borderTopLeftRadius: radii.xxl, borderTopRightRadius: radii.xxl, maxHeight: "80%" },
});
