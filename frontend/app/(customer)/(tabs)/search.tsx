import React, { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, FlatList, Image, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/src/theme/ThemeContext";
import { api } from "@/src/api/client";
import { Card } from "@/src/components/ui/Card";
import { spacing, typography, radii } from "@/src/theme/tokens";

type Restaurant = {
  id: string;
  name: string;
  tagline: string;
  cover_image: string;
  rating: number;
  delivery_time_min: number;
  delivery_time_max: number;
  cuisines: string[];
  is_veg: boolean;
  distance_km: number;
};

type Category = { id: string; name: string; icon_url: string };
type SortKey = "" | "rating" | "delivery_time" | "cost";

export default function SearchScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ category_id?: string }>();
  const [query, setQuery] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCat, setSelectedCat] = useState<string>(params.category_id || "");
  const [isVeg, setIsVeg] = useState(false);
  const [sort, setSort] = useState<SortKey>("");
  const [results, setResults] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void api<Category[]>("/api/food/categories").then(setCategories).catch(() => {});
  }, []);

  const fetchResults = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api<Restaurant[]>("/api/food/restaurants", {
        query: {
          q: query || undefined,
          category_id: selectedCat || undefined,
          is_veg: isVeg || undefined,
          sort: sort || undefined,
        },
      });
      setResults(res);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [query, selectedCat, isVeg, sort]);

  useEffect(() => {
    const t = setTimeout(fetchResults, 300);
    return () => clearTimeout(t);
  }, [fetchResults]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
      <View style={{ padding: spacing.lg, gap: spacing.md }}>
        <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search food, restaurants..."
            placeholderTextColor={colors.textTertiary}
            style={[styles.input, { color: colors.text }]}
            testID="search-input"
            autoFocus={false}
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery("")} testID="clear-search-btn">
              <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Filter chips row */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: 8, height: 56, alignItems: "center" }}
        style={{ height: 56 }}
      >
        <FilterChip label="All" active={!selectedCat} onPress={() => setSelectedCat("")} />
        <FilterChip label="Veg only" active={isVeg} onPress={() => setIsVeg((v) => !v)} icon="leaf" />
        <FilterChip label="Rating 4.0+" active={sort === "rating"} onPress={() => setSort(sort === "rating" ? "" : "rating")} icon="star" />
        <FilterChip label="Fastest" active={sort === "delivery_time"} onPress={() => setSort(sort === "delivery_time" ? "" : "delivery_time")} icon="time" />
        <FilterChip label="Cost: Low" active={sort === "cost"} onPress={() => setSort(sort === "cost" ? "" : "cost")} icon="pricetag" />
        {categories.map((c) => (
          <FilterChip
            key={c.id}
            label={c.name}
            active={selectedCat === c.id}
            onPress={() => setSelectedCat(selectedCat === c.id ? "" : c.id)}
          />
        ))}
      </ScrollView>

      {loading ? (
        <View style={{ padding: spacing.xl, alignItems: "center" }}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : results.length === 0 ? (
        <View style={{ padding: spacing.xl, alignItems: "center", gap: 8 }}>
          <Ionicons name="restaurant-outline" size={48} color={colors.textTertiary} />
          <Text style={[typography.subtitle, { color: colors.text }]}>No restaurants found</Text>
          <Text style={[typography.body, { color: colors.textSecondary, textAlign: "center" }]}>Try adjusting filters or search term</Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(r) => r.id}
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: 100 }}
          renderItem={({ item: r }) => (
            <Pressable
              onPress={() => router.push({ pathname: "/(customer)/restaurant/[id]", params: { id: r.id } })}
              testID={`search-result-${r.id}`}
            >
              <Card style={{ flexDirection: "row", padding: 8, gap: 12, alignItems: "center" }}>
                <Image source={{ uri: r.cover_image }} style={{ width: 84, height: 84, borderRadius: radii.lg }} />
                <View style={{ flex: 1, gap: 3 }}>
                  <Text style={[typography.subtitle, { color: colors.text }]} numberOfLines={1}>{r.name}</Text>
                  <Text style={[typography.bodySmall, { color: colors.textSecondary }]} numberOfLines={1}>{r.cuisines.join(" · ")}</Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 6, paddingVertical: 2, borderRadius: radii.sm, backgroundColor: colors.success }}>
                      <Ionicons name="star" size={10} color="#fff" />
                      <Text style={{ color: "#fff", fontSize: 11, fontWeight: "700" }}>{r.rating.toFixed(1)}</Text>
                    </View>
                    <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>{r.delivery_time_min}-{r.delivery_time_max} min</Text>
                  </View>
                </View>
              </Card>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

function FilterChip({ label, active, onPress, icon }: { label: string; active: boolean; onPress: () => void; icon?: keyof typeof Ionicons.glyphMap }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 14,
        height: 36,
        borderRadius: radii.full,
        borderWidth: 1,
        borderColor: active ? colors.primary : colors.border,
        backgroundColor: active ? colors.primary : colors.surface,
        flexShrink: 0,
      }}
      testID={`chip-${label}`}
    >
      {icon ? <Ionicons name={icon} size={14} color={active ? "#fff" : colors.text} /> : null}
      <Text style={{ color: active ? "#fff" : colors.text, fontWeight: "600", fontSize: 13 }}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  searchBar: { flexDirection: "row", alignItems: "center", gap: spacing.sm, borderRadius: radii.full, paddingHorizontal: spacing.md, height: 52, borderWidth: 1 },
  input: { flex: 1, ...typography.bodyLarge },
});
