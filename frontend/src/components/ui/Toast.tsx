import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/src/theme/ThemeContext";
import { radii, spacing, typography } from "@/src/theme/tokens";

type ToastKind = "success" | "error" | "info";
type ToastMsg = { id: number; text: string; kind: ToastKind };
type ToastCtx = { show: (text: string, kind?: ToastKind) => void };

const ToastContext = createContext<ToastCtx | null>(null);

let counter = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const show = useCallback((text: string, kind: ToastKind = "info") => {
    const id = ++counter;
    setToasts((prev) => [...prev, { id, text, kind }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 2600);
  }, []);

  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <View pointerEvents="none" style={[styles.container, { top: insets.top + 12 }]}>
        {toasts.map((t) => {
          const bg =
            t.kind === "success" ? colors.success :
            t.kind === "error" ? colors.error : colors.text;
          return (
            <Animated.View key={t.id} style={[styles.toast, { backgroundColor: bg }]} testID={`toast-${t.kind}`}>
              <Text style={styles.text}>{t.text}</Text>
            </Animated.View>
          );
        })}
      </View>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastCtx {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}

const styles = StyleSheet.create({
  container: { position: "absolute", left: 0, right: 0, alignItems: "center", zIndex: 9999 },
  toast: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radii.full,
    marginBottom: spacing.sm,
    maxWidth: "90%",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  text: { ...typography.body, color: "#fff", textAlign: "center" },
});
