// Shippzu brand + design tokens. Light + dark mode.
export type ThemeMode = "light" | "dark";

export const colors = {
  light: {
    primary: "#FF5A1F",
    primaryLight: "#FFE8E0",
    primaryDark: "#CC4819",
    background: "#FFFFFF",
    surface: "#F8F9FA",
    surfaceElevated: "#FFFFFF",
    text: "#1A1A1A",
    textSecondary: "#6B7280",
    textTertiary: "#9CA3AF",
    border: "#E5E7EB",
    success: "#10B981",
    warning: "#F59E0B",
    error: "#EF4444",
    shimmerBase: "#E5E7EB",
    shimmerHighlight: "#F3F4F6",
    overlay: "rgba(0, 0, 0, 0.4)",
    veg: "#10B981",
    nonVeg: "#DC2626",
    star: "#F59E0B",
    onPrimary: "#FFFFFF",
    cardShadow: "#000000",
  },
  dark: {
    primary: "#FF5A1F",
    primaryLight: "#FF8A5C",
    primaryDark: "#CC4819",
    background: "#0F172A",
    surface: "#1E293B",
    surfaceElevated: "#334155",
    text: "#F8F9FA",
    textSecondary: "#9CA3AF",
    textTertiary: "#6B7280",
    border: "#334155",
    success: "#34D399",
    warning: "#FBBF24",
    error: "#F87171",
    shimmerBase: "#1E293B",
    shimmerHighlight: "#334155",
    overlay: "rgba(0, 0, 0, 0.6)",
    veg: "#34D399",
    nonVeg: "#F87171",
    star: "#FBBF24",
    onPrimary: "#FFFFFF",
    cardShadow: "#000000",
  },
} as const;

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };
export const radii = { none: 0, sm: 4, md: 8, lg: 16, xl: 24, xxl: 32, full: 9999 };

export const typography = {
  h1: { fontSize: 32, lineHeight: 40, fontWeight: "800" as const, letterSpacing: -1 },
  h2: { fontSize: 26, lineHeight: 34, fontWeight: "800" as const, letterSpacing: -0.5 },
  h3: { fontSize: 22, lineHeight: 30, fontWeight: "700" as const, letterSpacing: -0.3 },
  h4: { fontSize: 18, lineHeight: 26, fontWeight: "700" as const },
  subtitle: { fontSize: 16, lineHeight: 24, fontWeight: "600" as const },
  bodyLarge: { fontSize: 15, lineHeight: 22, fontWeight: "500" as const },
  body: { fontSize: 14, lineHeight: 20, fontWeight: "500" as const },
  bodySmall: { fontSize: 12, lineHeight: 16, fontWeight: "500" as const },
  caption: { fontSize: 10, lineHeight: 14, fontWeight: "700" as const, letterSpacing: 0.5 },
};

export type ThemeColors = typeof colors.light;
export const getColors = (mode: ThemeMode): ThemeColors => colors[mode];
