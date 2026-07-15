import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, FlatList, Image, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/src/theme/ThemeContext";
import { api } from "@/src/api/client";
import { Card } from "@/src/components/ui/Card";
import { spacing, typography, radii } from "@/src/theme/tokens";

type FavData = { restaurants: any[]; foods: any[] };

export default function FavouritesScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [tab, setTab] = useState<"restaurants" | "foods">("restaurants");
  const [data, setData] = useState<FavData>({ restaurants: [], foods: [] });

  const load = useCallback(async () => {
    try {
      const res = await api<FavData>("/api/food/favourites");
      setData(res);
    } catch {
      setData({ restaurants: [], foods: [] });
    }
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const items = tab === "restaurants" ? data.restaurants : data.foods;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
      <View style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.md }}>
        <Text style={[typography.h2, { color: colors.text }]}>Favourites</Text>
      </View>
      <View style={{ flexDirection: "row", marginHorizontal: spacing.lg, backgroundColor: colors.surface, borderRadius: radii.full, padding: 4 }}>
        {(["restaurants", "foods"] as const).map((t) => (
          <Pressable
            key={t}
            onPress={() => setTab(t)}
            style={{ flex: 1, paddingVertical: 10, borderRadius: radii.full, backgroundColor: tab === t ? colors.primary : "transparent", alignItems: "center" }}
            testID={`fav-tab-${t}`}
          >
            <Text style={{ color: tab === t ? "#fff" : colors.text, fontWeight: "700", textTransform: "capitalize" }}>{t}</Text>
          </Pressable>
        ))}
      </View>

      {items.length === 0 ? (
        <View style={{ padding: spacing.xl, alignItems: "center", gap: spacing.md }}>
          <Ionicons name="heart-outline" size={64} color={colors.textTertiary} />
          <Text style={[typography.subtitle, { color: colors.text }]}>Nothing here yet</Text>
          <Text style={[typography.body, { color: colors.textSecondary, textAlign: "center" }]}>
            Tap the heart on restaurants and foods you love to save them here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(it) => it.id}
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: 40 }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() =>
                tab === "restaurants"
                  ? router.push({ pathname: "/(customer)/restaurant/[id]", params: { id: item.id } })
                  : router.push({ pathname: "/(customer)/food/[id]", params: { id: item.id } })
              }
              testID={`fav-item-${item.id}`}
            >
              <Card style={{ flexDirection: "row", padding: 8, gap: 12, alignItems: "center" }}>
                <Image source={{ uri: tab === "restaurants" ? item.cover_image : item.image }} style={{ width: 84, height: 84, borderRadius: radii.lg }} />
                <View style={{ flex: 1 }}>
                  <Text style={[typography.subtitle, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
                  <Text style={[typography.bodySmall, { color: colors.textSecondary }]} numberOfLines={2}>
                    {tab === "restaurants" ? item.cuisines?.join(" · ") : item.description}
                  </Text>
                  {tab === "foods" && <Text style={[typography.subtitle, { color: colors.text, marginTop: 4 }]}>₹{item.price?.toFixed(0)}</Text>}
                </View>
              </Card>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({});
