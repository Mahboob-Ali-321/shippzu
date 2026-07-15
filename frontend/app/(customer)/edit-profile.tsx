import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/src/theme/ThemeContext";
import { useAuth } from "@/src/contexts/AuthContext";
import { Input } from "@/src/components/ui/Input";
import { Button } from "@/src/components/ui/Button";
import { useToast } from "@/src/components/ui/Toast";
import { api } from "@/src/api/client";
import { spacing, typography } from "@/src/theme/tokens";

export default function EditProfileScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { user, updateProfile } = useAuth();
  const toast = useToast();
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [loading, setLoading] = useState(false);

  // change password
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [changingPass, setChangingPass] = useState(false);

  const save = async () => {
    setLoading(true);
    try {
      await updateProfile({ name, phone });
      toast.show("Profile updated", "success");
      router.back();
    } catch (e: any) {
      toast.show(e?.message || "Failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async () => {
    if (!oldPass || newPass.length < 6) {
      toast.show("Fill both fields (new must be 6+)", "error");
      return;
    }
    setChangingPass(true);
    try {
      await api("/api/auth/change-password", { method: "POST", body: { old_password: oldPass, new_password: newPass } });
      toast.show("Password changed", "success");
      setOldPass(""); setNewPass("");
    } catch (e: any) {
      toast.show(e?.message || "Failed", "error");
    } finally {
      setChangingPass(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} testID="back-btn"><Ionicons name="arrow-back" size={24} color={colors.text} /></Pressable>
        <Text style={[typography.h4, { color: colors.text }]}>Edit Profile</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }} keyboardShouldPersistTaps="handled">
        <Input label="Full name" value={name} onChangeText={setName} testID="edit-name-input" />
        <Input label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" testID="edit-phone-input" />
        <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>Email: {user?.email} (cannot be changed)</Text>
        <Button title="Save changes" onPress={save} loading={loading} fullWidth size="lg" testID="save-profile-btn" />

        <View style={{ height: 1, backgroundColor: colors.border, marginVertical: spacing.md }} />
        <Text style={[typography.h4, { color: colors.text }]}>Change password</Text>
        <Input label="Current password" secureTextEntry value={oldPass} onChangeText={setOldPass} testID="old-pass-input" />
        <Input label="New password" secureTextEntry value={newPass} onChangeText={setNewPass} testID="new-pass-input" />
        <Button title="Update password" variant="secondary" onPress={changePassword} loading={changingPass} fullWidth testID="change-pass-btn" />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
});
