import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/src/theme/ThemeContext";
import { useCart } from "@/src/contexts/CartContext";
import { typography } from "@/src/theme/tokens";

export default function TabsLayout() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { itemCount } = useCart();

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: {
          backgroundColor: colors.surfaceElevated,
          borderTopColor: colors.border,
          borderTopWidth: isDark ? 1 : 0.5,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom + 4,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
        tabBarIcon: ({ color, size, focused }) => {
          let icon: keyof typeof Ionicons.glyphMap = "home";
          if (route.name === "index") icon = focused ? "home" : "home-outline";
          else if (route.name === "search") icon = focused ? "search" : "search-outline";
          else if (route.name === "orders") icon = focused ? "receipt" : "receipt-outline";
          else if (route.name === "favourites") icon = focused ? "heart" : "heart-outline";
          else if (route.name === "profile") icon = focused ? "person" : "person-outline";
          return <Ionicons name={icon} size={size ?? 22} color={color} />;
        },
      })}
    >
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="search" options={{ title: "Search" }} />
      <Tabs.Screen
        name="orders"
        options={{
          title: "Orders",
          tabBarBadge: itemCount > 0 ? itemCount : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.primary, color: "#fff" },
        }}
      />
      <Tabs.Screen name="favourites" options={{ title: "Favourites" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}
