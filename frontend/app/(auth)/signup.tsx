import React, { useState } from "react";
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "@/src/theme/ThemeContext";
import { Input } from "@/src/components/ui/Input";
import { Button } from "@/src/components/ui/Button";
import { useAuth } from "@/src/contexts/AuthContext";
import { useToast } from "@/src/components/ui/Toast";
import { spacing, typography } from "@/src/theme/tokens";

export default function Signup() {
  const { colors } = useTheme();
  const router = useRouter();
  const { signUp } = useAuth();
  const toast = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!name || !email || !password) {
      toast.show("Please fill all required fields", "error");
      return;
    }
    if (password.length < 6) {
      toast.show("Password must be at least 6 characters", "error");
      return;
    }
    setLoading(true);
    try {
      await signUp(name.trim(), email.trim().toLowerCase(), password, phone.trim() || undefined);
      toast.show("Account created — welcome!", "success");
      router.replace("/(customer)/(tabs)");
    } catch (e: any) {
      toast.show(e?.message || "Signup failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top", "bottom"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }} keyboardShouldPersistTaps="handled">
          <Pressable onPress={() => router.back()} style={styles.backBtn} testID="back-btn">
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </Pressable>
          <Text style={[typography.h1, { color: colors.text, marginTop: spacing.md }]}>Create account</Text>
          <Text style={[typography.bodyLarge, { color: colors.textSecondary, marginBottom: spacing.md }]}>
            Join Shippzu and get 50% off on your first order
          </Text>

          <Input label="Full name" placeholder="John Doe" value={name} onChangeText={setName} left={<Ionicons name="person-outline" size={20} color={colors.textSecondary} />} testID="signup-name-input" />
          <Input
            label="Email"
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={email}
            onChangeText={setEmail}
            left={<Ionicons name="mail-outline" size={20} color={colors.textSecondary} />}
            testID="signup-email-input"
          />
          <Input
            label="Phone (optional)"
            placeholder="98765 43210"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
            left={<Ionicons name="call-outline" size={20} color={colors.textSecondary} />}
            testID="signup-phone-input"
          />
          <Input
            label="Password"
            placeholder="Min 6 characters"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            left={<Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} />}
            testID="signup-password-input"
          />

          <Button title="Create account" onPress={submit} loading={loading} size="lg" fullWidth style={{ marginTop: spacing.md }} testID="signup-submit-btn" />

          <View style={{ flexDirection: "row", justifyContent: "center", marginTop: spacing.md, gap: 4 }}>
            <Text style={{ ...typography.body, color: colors.textSecondary }}>Already a member?</Text>
            <Pressable onPress={() => router.replace("/(auth)/login")} testID="go-to-login-btn">
              <Text style={{ ...typography.body, color: colors.primary, fontWeight: "700" }}>Sign in</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.05)" },
});
