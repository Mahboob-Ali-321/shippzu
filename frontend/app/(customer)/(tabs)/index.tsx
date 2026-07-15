import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  RefreshControl,
  TextInput,
  Dimensions,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "@/src/theme/ThemeContext";
import { useAuth } from "@/src/contexts/AuthContext";
import { useCart } from "@/src/contexts/CartContext";
import { api } from "@/src/api/client";
import { Card } from "@/src/components/ui/Card";
import { Skeleton } from "@/src/components/ui/Skeleton";
import { MODULES } from "@/src/modules/registry";
import { useToast } from "@/src/components/ui/Toast";
import { spacing, typography, radii } from "@/src/theme/tokens";

const { width } = Dimensions.get("window");

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
  is_veg: boolean;
  distance_km: number;
  offers: string[];
};

type Category = { id: string; name: string; icon_url: string };
type Coupon = { id: string; code: string; title: string; description: string };

type Home = {
  categories: Category[];
  featured: Restaurant[];
  trending: Restaurant[];
  popular: Restaurant[];
  nearby: Restaurant[];
  coupons: Coupon[];
};

export default function HomeScreen() {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const { itemCount, cart } = useCart();
  const router = useRouter();
  const toast = useToast();
  const [data, setData] = useState<Home | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api<Home>("/api/food/home");
      setData(res);
    } catch (e: any) {
      toast.show(e?.message || "Failed to load home feed", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    void load();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
      {/* Sticky Header */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <View style={{ flex: 1 }}>
          <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>Deliver to</Text>
          <Pressable style={{ flexDirection: "row", alignItems: "center", gap: 4 }} onPress={() => router.push("/(customer)/addresses")} testID="home-location-btn">
            <Ionicons name="location" size={16} color={colors.primary} />
            <Text style={[typography.subtitle, { color: colors.text }]} numberOfLines={1}>Current Location</Text>
            <Ionicons name="chevron-down" size={16} color={colors.text} />
          </Pressable>
        </View>
        <Pressable style={[styles.headerIcon, { backgroundColor: colors.surface }]} onPress={() => router.push("/(customer)/notifications")} testID="home-notifications-btn">
          <Ionicons name="notifications-outline" size={22} color={colors.text} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Search bar */}
        <Pressable
          onPress={() => router.push("/(customer)/(tabs)/search")}
          style={[styles.searchBar, { backgroundColor: colors.surface }]}
          testID="home-search-bar"
        >
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <Text style={[typography.body, { color: colors.textSecondary, flex: 1 }]}>Search food, restaurants...</Text>
          <Ionicons name="mic" size={20} color={colors.primary} />
        </Pressable>

        {/* Super-app Modules row */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>What are you looking for?</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.modulesRow}>
          {MODULES.map((m) => (
            <Pressable
              key={m.id}
              onPress={() => {
                if (m.enabled) router.push(m.route as any);
                else router.push("/(customer)/coming-soon");
              }}
              style={styles.moduleCard}
              testID={`module-${m.id}`}
            >
              <View style={[styles.moduleIcon, { backgroundColor: m.color + "20" }]}>
                <Ionicons name={m.icon} size={26} color={m.color} />
                {m.comingSoon && (
                  <View style={[styles.soonBadge, { backgroundColor: colors.primary }]}>
                    <Text style={styles.soonText}>SOON</Text>
                  </View>
                )}
              </View>
              <Text style={[typography.bodySmall, { color: colors.text, fontWeight: "700", marginTop: 6 }]} numberOfLines={1}>{m.name}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Categories */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Order by category</Text>
        {loading ? (
          <View style={{ flexDirection: "row", gap: 12, paddingHorizontal: spacing.lg }}>
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} style={{ width: 70, height: 90 }} radius={radii.lg} />)}
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizList}>
            {data?.categories.map((c) => (
              <Pressable
                key={c.id}
                onPress={() => router.push({ pathname: "/(customer)/(tabs)/search", params: { category_id: c.id } })}
                style={styles.categoryItem}
                testID={`category-${c.name}`}
              >
                <View style={[styles.categoryImgWrap, { backgroundColor: colors.surface }]}>
                  <Image source={{ uri: c.icon_url }} style={styles.categoryImg} />
                </View>
                <Text style={[typography.bodySmall, { color: colors.text, marginTop: 6, fontWeight: "600" }]} numberOfLines={1}>{c.name}</Text>
              </Pressable>
            ))}
          </ScrollView>
        )}

        {/* Coupons carousel */}
        {data?.coupons && data.coupons.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Available offers</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizList}>
              {data.coupons.map((cp) => (
                <View key={cp.id} style={[styles.couponCard, { backgroundColor: colors.primary }]} testID={`coupon-${cp.code}`}>
                  <Ionicons name="pricetag" size={22} color="#fff" />
                  <Text style={[typography.h4, { color: "#fff", marginTop: 6 }]}>{cp.title}</Text>
                  <Text style={[typography.bodySmall, { color: "rgba(255,255,255,0.9)", marginTop: 2 }]} numberOfLines={2}>{cp.description}</Text>
                  <View style={styles.couponCode}>
                    <Text style={[typography.caption, { color: "#fff" }]}>CODE: {cp.code}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </>
        )}

        {/* Featured — big cards */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Featured near you</Text>
        {loading ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizList}>
            {[1, 2].map((i) => <Skeleton key={i} style={{ width: width * 0.75, height: 220 }} radius={radii.xl} />)}
          </ScrollView>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizList}>
            {data?.featured.map((r) => (
              <Pressable
                key={r.id}
                onPress={() => router.push({ pathname: "/(customer)/restaurant/[id]", params: { id: r.id } })}
                style={{ width: width * 0.75 }}
                testID={`featured-${r.id}`}
              >
                <Card style={{ marginRight: 0 }}>
                  <Image source={{ uri: r.cover_image }} style={styles.featuredImg} />
                  {r.offers[0] && (
                    <View style={styles.offerTag}>
                      <Text style={styles.offerText}>{r.offers[0]}</Text>
                    </View>
                  )}
                  <View style={{ padding: spacing.md, gap: 4 }}>
                    <Text style={[typography.h4, { color: colors.text }]} numberOfLines={1}>{r.name}</Text>
                    <Text style={[typography.bodySmall, { color: colors.textSecondary }]} numberOfLines={1}>{r.cuisines.join(" · ")}</Text>
                    <View style={styles.metaRow}>
                      <View style={[styles.ratingChip, { backgroundColor: colors.success }]}>
                        <Ionicons name="star" size={12} color="#fff" />
                        <Text style={styles.ratingText}>{r.rating.toFixed(1)}</Text>
                      </View>
                      <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>{r.delivery_time_min}-{r.delivery_time_max} min</Text>
                      <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>· ₹{r.cost_for_two} for two</Text>
                    </View>
                  </View>
                </Card>
              </Pressable>
            ))}
          </ScrollView>
        )}

        {/* Trending */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Trending now</Text>
        {loading ? (
          <View style={{ gap: 12, paddingHorizontal: spacing.lg }}>
            {[1, 2, 3].map((i) => <Skeleton key={i} style={{ width: "100%", height: 100 }} radius={radii.xl} />)}
          </View>
        ) : (
          <View style={{ gap: spacing.md, paddingHorizontal: spacing.lg }}>
            {data?.trending.map((r) => (
              <RestaurantRow key={r.id} r={r} onPress={() => router.push({ pathname: "/(customer)/restaurant/[id]", params: { id: r.id } })} />
            ))}
          </View>
        )}

        {/* Popular */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Popular restaurants</Text>
        {!loading && (
          <View style={{ gap: spacing.md, paddingHorizontal: spacing.lg }}>
            {data?.popular.map((r) => (
              <RestaurantRow key={r.id} r={r} onPress={() => router.push({ pathname: "/(customer)/restaurant/[id]", params: { id: r.id } })} />
            ))}
          </View>
        )}

        {/* Nearby */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Nearby restaurants</Text>
        {!loading && (
          <View style={{ gap: spacing.md, paddingHorizontal: spacing.lg }}>
            {data?.nearby.map((r) => (
              <RestaurantRow key={r.id} r={r} onPress={() => router.push({ pathname: "/(customer)/restaurant/[id]", params: { id: r.id } })} />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Floating cart chip */}
      {itemCount > 0 && (
        <Pressable
          style={[styles.floatingCart, { backgroundColor: colors.primary }]}
          onPress={() => router.push("/(customer)/cart")}
          testID="floating-cart-btn"
        >
          <Ionicons name="cart" size={22} color="#fff" />
          <View style={{ flex: 1 }}>
            <Text style={[typography.bodySmall, { color: "#fff", opacity: 0.9 }]}>{cart.restaurant_name || "Cart"}</Text>
            <Text style={[typography.subtitle, { color: "#fff" }]}>{itemCount} item{itemCount > 1 ? "s" : ""}</Text>
          </View>
          <Text style={[typography.subtitle, { color: "#fff", fontWeight: "700" }]}>View →</Text>
        </Pressable>
      )}
    </SafeAreaView>
  );
}

function RestaurantRow({ r, onPress }: { r: Restaurant; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable onPress={onPress} testID={`restaurant-row-${r.id}`}>
      <Card style={{ flexDirection: "row", padding: 8, gap: 12, alignItems: "center" }}>
        <Image source={{ uri: r.cover_image }} style={styles.rowImg} />
        <View style={{ flex: 1, gap: 3 }}>
          <Text style={[typography.subtitle, { color: colors.text }]} numberOfLines={1}>{r.name}</Text>
          <Text style={[typography.bodySmall, { color: colors.textSecondary }]} numberOfLines={1}>{r.cuisines.join(" · ")}</Text>
          <View style={styles.metaRow}>
            <View style={[styles.ratingChip, { backgroundColor: colors.success }]}>
              <Ionicons name="star" size={10} color="#fff" />
              <Text style={styles.ratingText}>{r.rating.toFixed(1)}</Text>
            </View>
            <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>{r.delivery_time_min}-{r.delivery_time_max} min · {r.distance_km} km</Text>
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerIcon: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
  searchBar: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    borderRadius: radii.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  sectionTitle: { ...typography.h4, marginTop: spacing.xl, marginBottom: spacing.md, paddingHorizontal: spacing.lg },
  modulesRow: { paddingHorizontal: spacing.lg, gap: spacing.md, paddingRight: spacing.lg + 8 },
  moduleCard: { alignItems: "center", width: 70 },
  moduleIcon: { width: 60, height: 60, borderRadius: 20, alignItems: "center", justifyContent: "center", position: "relative" },
  soonBadge: { position: "absolute", top: -4, right: -8, paddingHorizontal: 6, paddingVertical: 2, borderRadius: radii.sm },
  soonText: { color: "#fff", fontSize: 8, fontWeight: "800", letterSpacing: 0.5 },
  horizList: { paddingHorizontal: spacing.lg, gap: spacing.md, paddingRight: spacing.lg + 8 },
  categoryItem: { alignItems: "center", width: 70 },
  categoryImgWrap: { width: 64, height: 64, borderRadius: radii.lg, overflow: "hidden" },
  categoryImg: { width: "100%", height: "100%" },
  couponCard: { width: 240, padding: spacing.md, borderRadius: radii.xl, gap: 4, overflow: "hidden" },
  couponCode: { marginTop: spacing.sm, alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, borderRadius: radii.full, backgroundColor: "rgba(255,255,255,0.2)", borderWidth: 1, borderColor: "rgba(255,255,255,0.5)" },
  featuredImg: { width: "100%", height: 140 },
  offerTag: { position: "absolute", top: 12, left: 12, backgroundColor: "#000", paddingHorizontal: 10, paddingVertical: 4, borderRadius: radii.sm },
  offerText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4, flexWrap: "wrap" },
  ratingChip: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 6, paddingVertical: 2, borderRadius: radii.sm },
  ratingText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  rowImg: { width: 84, height: 84, borderRadius: radii.lg },
  floatingCart: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
    bottom: 20,
    borderRadius: radii.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    shadowColor: "#FF5A1F", shadowOpacity: 0.4, shadowRadius: 16, shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
});
