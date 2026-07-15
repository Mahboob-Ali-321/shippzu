import React, { useRef, useState } from "react";
import { View, Text, StyleSheet, FlatList, Dimensions, Pressable, Image } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/src/theme/ThemeContext";
import { Button } from "@/src/components/ui/Button";
import { spacing, typography, radii } from "@/src/theme/tokens";
import { storage } from "@/src/utils/storage";

const { width } = Dimensions.get("window");

const SLIDES = [
  {
    title: "Discover great food",
    body: "Browse thousands of restaurants — from your favourite biryani spot to that new sushi place around the corner.",
    image: "https://images.unsplash.com/photo-1600663791817-d74f5196ba29?crop=entropy&cs=srgb&fm=jpg&w=800&q=85",
  },
  {
    title: "Lightning-fast delivery",
    body: "Hot meals delivered in under 30 minutes. Track your order every step of the way — from kitchen to your doorstep.",
    image: "https://images.unsplash.com/photo-1621494268492-d01b98eba7e4?crop=entropy&cs=srgb&fm=jpg&w=800&q=85",
  },
  {
    title: "Everything you need",
    body: "Food today. Grocery, pharmacy, parcels & more coming soon. One app for everything — that's the Shippzu promise.",
    image: "https://images.pexels.com/photos/2474661/pexels-photo-2474661.jpeg?auto=compress&cs=tinysrgb&w=800",
  },
];

export default function Onboarding() {
  const { colors } = useTheme();
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList>(null);

  const finish = async () => {
    await storage.setItem("shippzu.onboarded", "1");
    router.replace("/(auth)/login");
  };

  const next = () => {
    if (index >= SLIDES.length - 1) return finish();
    const ni = index + 1;
    listRef.current?.scrollToIndex({ index: ni, animated: true });
    setIndex(ni);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top", "bottom"]}>
      <View style={styles.topRow}>
        <View />
        <Pressable onPress={finish} testID="skip-onboarding-btn">
          <Text style={{ ...typography.subtitle, color: colors.textSecondary }}>Skip</Text>
        </Pressable>
      </View>

      <FlatList
        ref={listRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.title}
        onMomentumScrollEnd={(e) => {
          const i = Math.round(e.nativeEvent.contentOffset.x / width);
          setIndex(i);
        }}
        renderItem={({ item }) => (
          <View style={{ width, paddingHorizontal: spacing.lg, alignItems: "center", justifyContent: "flex-start" }}>
            <View style={[styles.imgWrap, { backgroundColor: colors.surface }]}>
              <Image source={{ uri: item.image }} style={styles.img} resizeMode="cover" />
            </View>
            <Text style={[typography.h2, { color: colors.text, textAlign: "center", marginTop: spacing.xl }]}>{item.title}</Text>
            <Text style={[typography.bodyLarge, { color: colors.textSecondary, textAlign: "center", marginTop: spacing.md, paddingHorizontal: spacing.md }]}>
              {item.body}
            </Text>
          </View>
        )}
      />

      <View style={styles.footer}>
        <View style={styles.dotsRow}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                { backgroundColor: i === index ? colors.primary : colors.border, width: i === index ? 24 : 8 },
              ]}
            />
          ))}
        </View>
        <Button
          title={index === SLIDES.length - 1 ? "Get Started" : "Next"}
          onPress={next}
          fullWidth
          size="lg"
          testID="onboarding-next-btn"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  imgWrap: { width: width - spacing.lg * 2, aspectRatio: 1, borderRadius: radii.xxl, overflow: "hidden", marginTop: spacing.lg },
  img: { width: "100%", height: "100%" },
  footer: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md, gap: spacing.lg },
  dotsRow: { flexDirection: "row", justifyContent: "center", gap: 6, marginBottom: spacing.md },
  dot: { height: 8, borderRadius: 4 },
});
