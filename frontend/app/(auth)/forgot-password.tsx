import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "@/src/theme/ThemeContext";
import { Input } from "@/src/components/ui/Input";
import { Button } from "@/src/components/ui/Button";
import { useToast } from "@/src/components/ui/Toast";
import { api } from "@/src/api/client";
import { spacing, typography } from "@/src/theme/tokens";

export default function ForgotPassword() {
  const { colors } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"email" | "reset">("email");
  const [token, setToken] = useState("");
  const [newPass, setNewPass] = useState("");
  const [loading, setLoading] = useState(false);

  const sendReset = async () => {
    if (!email) {
      toast.show("Please enter email", "error");
      return;
    }
    setLoading(true);
    try {
      const res = await api<{ dev_reset_token?: string; message: string }>("/api/auth/forgot-password", {
        method: "POST",
        auth: false,
        body: { email: email.trim().toLowerCase() },
      });
      // DEV MODE: token surfaces in response for demo. In production this arrives via email.
      if (res.dev_reset_token) {
        setToken(res.dev_reset_token);
        setStep("reset");
        toast.show("Reset code generated (dev mode)", "info");
      } else {
        toast.show(res.message || "Check your email", "success");
      }
    } catch (e: any) {
      toast.show(e?.message || "Failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const doReset = async () => {
    if (newPass.length < 6) {
      toast.show("Password must be 6+ characters", "error");
      return;
    }
    setLoading(true);
    try {
      await api("/api/auth/reset-password", { method: "POST", auth: false, body: { reset_token: token, new_password: newPass } });
      toast.show("Password reset — please log in", "success");
      router.replace("/(auth)/login");
    } catch (e: any) {
      toast.show(e?.message || "Reset failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }} keyboardShouldPersistTaps="handled">
        <Pressable onPress={() => router.back()} style={styles.backBtn} testID="back-btn">
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={[typography.h1, { color: colors.text, marginTop: spacing.md }]}>Forgot password</Text>
        <Text style={[typography.bodyLarge, { color: colors.textSecondary }]}>
          {step === "email" ? "Enter your email and we'll send a reset link." : "Enter your new password below."}
        </Text>

        {step === "email" ? (
          <>
            <Input
              label="Email"
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              left={<Ionicons name="mail-outline" size={20} color={colors.textSecondary} />}
              testID="forgot-email-input"
            />
            <Button title="Send Reset Link" onPress={sendReset} loading={loading} size="lg" fullWidth testID="forgot-submit-btn" />
          </>
        ) : (
          <>
            <Input
              label="New Password"
              placeholder="Min 6 characters"
              secureTextEntry
              value={newPass}
              onChangeText={setNewPass}
              left={<Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} />}
              testID="reset-newpass-input"
            />
            <Button title="Reset Password" onPress={doReset} loading={loading} size="lg" fullWidth testID="reset-submit-btn" />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.05)" },
});
