// Super-app module registry — allows future modules (Grocery, Pharmacy, etc.)
// to be added without rebuilding the app. Only enabled modules appear on the
// Home Modules row.

import { Ionicons } from "@expo/vector-icons";

export type SuperAppModule = {
  id: string;
  name: string;
  tagline: string;
  route: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  enabled: boolean;
  comingSoon?: boolean;
};

export const MODULES: SuperAppModule[] = [
  { id: "food", name: "Food", tagline: "Hot meals in 30 min", route: "/(customer)/(tabs)", icon: "restaurant", color: "#FF5A1F", enabled: true },
  { id: "grocery", name: "Grocery", tagline: "Daily essentials", route: "/coming-soon", icon: "basket", color: "#10B981", enabled: false, comingSoon: true },
  { id: "pharmacy", name: "Pharmacy", tagline: "Medicines fast", route: "/coming-soon", icon: "medkit", color: "#EF4444", enabled: false, comingSoon: true },
  { id: "parcel", name: "Parcel", tagline: "Send anywhere", route: "/coming-soon", icon: "cube", color: "#3B82F6", enabled: false, comingSoon: true },
  { id: "flowers", name: "Flowers", tagline: "Fresh bouquets", route: "/coming-soon", icon: "flower", color: "#EC4899", enabled: false, comingSoon: true },
  { id: "water", name: "Water", tagline: "Cans & bottles", route: "/coming-soon", icon: "water", color: "#06B6D4", enabled: false, comingSoon: true },
  { id: "meat", name: "Meat", tagline: "Fresh & frozen", route: "/coming-soon", icon: "flame", color: "#DC2626", enabled: false, comingSoon: true },
  { id: "laundry", name: "Laundry", tagline: "Wash & dry", route: "/coming-soon", icon: "shirt", color: "#8B5CF6", enabled: false, comingSoon: true },
  { id: "pets", name: "Pet Supplies", tagline: "For your buddy", route: "/coming-soon", icon: "paw", color: "#F59E0B", enabled: false, comingSoon: true },
  { id: "pickup", name: "Pickup & Drop", tagline: "Any errand", route: "/coming-soon", icon: "car", color: "#0EA5E9", enabled: false, comingSoon: true },
];
