import React, { useState } from "react";
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "@/src/theme/ThemeContext";
import { Input } from "@/src/components/ui/Input";
import { Button } from "@/src/components/ui/Button";
import { Logo } from "@/src/components/ui/Logo";
import { useAuth } from "@/src/contexts/AuthContext";
import { useToast } from "@/src/components/ui/Toast";
import { spacing, typography, radii } from "@/src/theme/tokens";

export default function Login() {
  const { colors } = useTheme();
  const router = useRouter();
  const { signIn } = useAuth();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const submit = async () => {
    if (!email || !password) {
      toast.show("Please enter email and password", "error");
      return;
    }
    setLoading(true);
    try {
      await signIn(email.trim().toLowerCase(), password);
      toast.show("Welcome back!", "success");
      router.replace("/(customer)/(tabs)");
    } catch (e: any) {
      toast.show(e?.message || "Login failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = () => {
    // Native Google Sign-In activates on APK/AAB build with @react-native-google-signin
    toast.show("Google Sign-In activates on the device build", "info");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top", "bottom"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }} keyboardShouldPersistTaps="handled">
          <View style={styles.logoRow}>
            <Logo variant="stacked" size={80} showTagline />
          </View>
          <Text style={[typography.h1, { color: colors.text, textAlign: "center", marginTop: spacing.md }]}>Welcome back</Text>
          <Text style={[typography.bodyLarge, { color: colors.textSecondary, textAlign: "center", marginBottom: spacing.lg }]}>
            Sign in to continue ordering
          </Text>

          <Input
            label="Email"
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={email}
            onChangeText={setEmail}
            left={<Ionicons name="mail-outline" size={20} color={colors.textSecondary} />}
            testID="login-email-input"
          />
          <Input
            label="Password"
            placeholder="Enter password"
            secureTextEntry={!showPass}
            value={password}
            onChangeText={setPassword}
            left={<Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} />}
            right={
              <Pressable onPress={() => setShowPass((v) => !v)}>
                <Ionicons name={showPass ? "eye-off-outline" : "eye-outline"} size={20} color={colors.textSecondary} />
              </Pressable>
            }
            testID="login-password-input"
          />
          <Pressable onPress={() => router.push("/(auth)/forgot-password")} style={{ alignSelf: "flex-end" }} testID="forgot-password-link">
            <Text style={[typography.body, { color: colors.primary, fontWeight: "700" }]}>Forgot password?</Text>
          </Pressable>

          <Button title="Sign In" onPress={submit} loading={loading} size="lg" fullWidth testID="login-submit-btn" />

          <View style={styles.dividerRow}>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <Text style={{ color: colors.textTertiary, ...typography.bodySmall }}>OR</Text>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
          </View>

          <Pressable
            onPress={googleLogin}
            style={[styles.socialBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}
            testID="google-signin-btn"
          >
            <Ionicons name="logo-google" size={20} color="#DB4437" />
            <Text style={[typography.subtitle, { color: colors.text }]}>Continue with Google</Text>
          </Pressable>

          <View style={{ flexDirection: "row", justifyContent: "center", marginTop: spacing.lg, gap: 4 }}>
            <Text style={{ ...typography.body, color: colors.textSecondary }}>New to Shippzu?</Text>
            <Pressable onPress={() => router.push("/(auth)/signup")} testID="go-to-signup-btn">
              <Text style={{ ...typography.body, color: colors.primary, fontWeight: "700" }}>Create account</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  logoRow: { alignItems: "center", marginTop: spacing.lg },
  dividerRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginVertical: spacing.md },
  divider: { flex: 1, height: 1 },
  socialBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm,
    paddingVertical: 14, borderRadius: radii.lg, borderWidth: 1,
  },
});
