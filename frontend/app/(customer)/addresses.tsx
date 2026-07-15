import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/src/theme/ThemeContext";
import { api } from "@/src/api/client";
import { useAddress } from "@/src/contexts/AddressContext";
import { Card } from "@/src/components/ui/Card";
import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";
import { useToast } from "@/src/components/ui/Toast";
import { spacing, typography, radii } from "@/src/theme/tokens";

type Address = { id: string; label: string; line1: string; line2?: string; city: string; state: string; pincode: string; is_default: boolean };
const LABELS = ["Home", "Work", "Other"];

export default function AddressesScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const { addresses, selected, setSelected, refresh } = useAddress();
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState({ label: "Home", line1: "", line2: "", city: "", state: "", pincode: "", is_default: false });
  const [saving, setSaving] = useState(false);

  useEffect(() => { void refresh(); }, [refresh]);

  const save = async () => {
    if (!form.line1 || !form.city || !form.state || !form.pincode) {
      toast.show("Fill all required fields", "error");
      return;
    }
    setSaving(true);
    try {
      const created = await api<Address>("/api/food/addresses", { method: "POST", body: form });
      toast.show("Address saved", "success");
      setModalVisible(false);
      setForm({ label: "Home", line1: "", line2: "", city: "", state: "", pincode: "", is_default: false });
      setSelected(created);
      await refresh();
    } catch (e: any) {
      toast.show(e?.message || "Failed to save", "error");
    } finally {
      setSaving(false);
    }
  };

  const removeAddress = async (id: string) => {
    try {
      await api(`/api/food/addresses/${id}`, { method: "DELETE" });
      toast.show("Address deleted", "info");
      if (selected?.id === id) setSelected(null);
      await refresh();
    } catch (e: any) { toast.show(e?.message || "Failed", "error"); }
  };

  const chooseAddress = (a: Address) => {
    setSelected(a);
    toast.show(`Deliver to ${a.label}`, "success");
    router.back();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} testID="back-btn"><Ionicons name="arrow-back" size={24} color={colors.text} /></Pressable>
        <Text style={[typography.h4, { color: colors.text }]}>Saved Addresses</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: 120 }}>
        {addresses.length === 0 ? (
          <View style={{ alignItems: "center", padding: spacing.xl, gap: spacing.md }}>
            <Ionicons name="location-outline" size={64} color={colors.textTertiary} />
            <Text style={[typography.subtitle, { color: colors.text }]}>No addresses saved</Text>
            <Text style={[typography.body, { color: colors.textSecondary, textAlign: "center" }]}>Add your delivery address to place orders faster</Text>
          </View>
        ) : (
          addresses.map((a) => {
            const isActive = selected?.id === a.id;
            return (
              <Pressable key={a.id} onPress={() => chooseAddress(a)} testID={`select-address-${a.id}`}>
                <Card style={{ padding: spacing.md, gap: 6, borderWidth: isActive ? 2 : 0, borderColor: isActive ? colors.primary : "transparent" }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    <Ionicons name={a.label === "Home" ? "home" : a.label === "Work" ? "briefcase" : "location"} size={16} color={colors.primary} />
                    <Text style={[typography.subtitle, { color: colors.text }]}>{a.label}</Text>
                    {a.is_default ? <Text style={{ backgroundColor: colors.success + "20", color: colors.success, paddingHorizontal: 6, paddingVertical: 2, fontSize: 10, borderRadius: radii.sm, fontWeight: "700" }}>DEFAULT</Text> : null}
                    {isActive ? <Text style={{ backgroundColor: colors.primary + "20", color: colors.primary, paddingHorizontal: 6, paddingVertical: 2, fontSize: 10, borderRadius: radii.sm, fontWeight: "700" }}>DELIVERING HERE</Text> : null}
                    <View style={{ flex: 1 }} />
                    <Pressable onPress={() => removeAddress(a.id)} testID={`delete-address-${a.id}`} hitSlop={10}>
                      <Ionicons name="trash-outline" size={18} color={colors.error} />
                    </Pressable>
                  </View>
                  <Text style={[typography.body, { color: colors.textSecondary }]}>{a.line1}{a.line2 ? `, ${a.line2}` : ""}, {a.city}, {a.state} - {a.pincode}</Text>
                </Card>
              </Pressable>
            );
          })
        )}
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <Button title="+ Add new address" onPress={() => setModalVisible(true)} fullWidth testID="add-address-btn" />
      </View>

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.sheet, { backgroundColor: colors.background }]}>
            <View style={{ alignItems: "center", paddingTop: 10 }}>
              <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border }} />
            </View>
            <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }} keyboardShouldPersistTaps="handled">
              <Text style={[typography.h4, { color: colors.text }]}>New address</Text>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {LABELS.map((l) => {
                  const active = form.label === l;
                  return (
                    <Pressable
                      key={l}
                      onPress={() => setForm({ ...form, label: l })}
                      style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: radii.full, borderWidth: 1, borderColor: active ? colors.primary : colors.border, backgroundColor: active ? colors.primary + "15" : "transparent" }}
                      testID={`label-${l}`}
                    >
                      <Text style={{ color: active ? colors.primary : colors.text, fontWeight: "600" }}>{l}</Text>
                    </Pressable>
                  );
                })}
              </View>
              <Input label="Address line 1 *" placeholder="House / Flat, Street" value={form.line1} onChangeText={(v) => setForm({ ...form, line1: v })} testID="addr-line1" />
              <Input label="Landmark (optional)" placeholder="Nearby landmark" value={form.line2} onChangeText={(v) => setForm({ ...form, line2: v })} testID="addr-line2" />
              <View style={{ flexDirection: "row", gap: 8 }}>
                <Input containerStyle={{ flex: 1 }} label="City *" placeholder="City" value={form.city} onChangeText={(v) => setForm({ ...form, city: v })} testID="addr-city" />
                <Input containerStyle={{ flex: 1 }} label="State *" placeholder="State" value={form.state} onChangeText={(v) => setForm({ ...form, state: v })} testID="addr-state" />
              </View>
              <Input label="Pincode *" placeholder="6-digit pincode" keyboardType="number-pad" value={form.pincode} onChangeText={(v) => setForm({ ...form, pincode: v })} testID="addr-pincode" />
              <Pressable
                onPress={() => setForm({ ...form, is_default: !form.is_default })}
                style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 6 }}
                testID="addr-default-toggle"
              >
                <View style={{ width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: form.is_default ? colors.primary : colors.border, backgroundColor: form.is_default ? colors.primary : "transparent", alignItems: "center", justifyContent: "center" }}>
                  {form.is_default ? <Ionicons name="checkmark" size={14} color="#fff" /> : null}
                </View>
                <Text style={{ color: colors.text }}>Make this my default address</Text>
              </Pressable>
              <Button title="Save Address" onPress={save} loading={saving} fullWidth size="lg" testID="save-address-btn" />
              <Button title="Cancel" variant="secondary" onPress={() => setModalVisible(false)} fullWidth testID="cancel-address-btn" />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  footer: { position: "absolute", bottom: 0, left: 0, right: 0, padding: spacing.md, borderTopWidth: 1 },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  sheet: { borderTopLeftRadius: radii.xxl, borderTopRightRadius: radii.xxl, maxHeight: "88%" },
});
