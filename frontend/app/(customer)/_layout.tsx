import React from "react";
import { Stack } from "expo-router";
import { useTheme } from "@/src/theme/ThemeContext";

export default function CustomerLayout() {
  const { colors } = useTheme();
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="restaurant/[id]" />
      <Stack.Screen name="cart" options={{ presentation: "card" }} />
      <Stack.Screen name="checkout" />
      <Stack.Screen name="order-success" />
      <Stack.Screen name="order-tracking/[id]" />
      <Stack.Screen name="addresses" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="edit-profile" />
      <Stack.Screen name="coming-soon" />
    </Stack>
  );
}
