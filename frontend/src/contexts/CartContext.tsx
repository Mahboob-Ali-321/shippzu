import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from "react";
import { storage } from "@/src/utils/storage";

export type CartLine = {
  food_id: string;
  name: string;
  image: string;
  unit_price: number;
  quantity: number;
  variant_id?: string;
  variant_name?: string;
  addon_ids: string[];
  addon_names: string[];
  special_instructions?: string;
};

type CartState = {
  restaurant_id: string | null;
  restaurant_name: string | null;
  restaurant_image: string | null;
  items: CartLine[];
};

const EMPTY: CartState = { restaurant_id: null, restaurant_name: null, restaurant_image: null, items: [] };
const KEY = "shippzu.cart.v1";

type CartCtx = {
  cart: CartState;
  itemCount: number;
  subtotal: number;
  addItem: (restaurantId: string, restaurantName: string, restaurantImage: string, line: CartLine) => { conflict?: boolean };
  removeItem: (foodId: string, variantId?: string) => void;
  updateQuantity: (foodId: string, variantId: string | undefined, quantity: number) => void;
  clear: () => void;
  replaceCart: (restaurantId: string, restaurantName: string, restaurantImage: string, line: CartLine) => void;
};

const CartContext = createContext<CartCtx | null>(null);

const lineKey = (foodId: string, variantId?: string) => `${foodId}::${variantId || ""}`;

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartState>(EMPTY);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    (async () => {
      const raw = await storage.getItem<string>(KEY, "");
      if (raw) {
        try { setCart(JSON.parse(raw) as CartState); } catch { /* ignore */ }
      }
      setHydrated(true);
    })();
  }, []);

  useEffect(() => {
    if (hydrated) void storage.setItem(KEY, JSON.stringify(cart));
  }, [cart, hydrated]);

  const addItem: CartCtx["addItem"] = useCallback((restaurantId, restaurantName, restaurantImage, line) => {
    if (cart.restaurant_id && cart.restaurant_id !== restaurantId && cart.items.length > 0) {
      return { conflict: true };
    }
    setCart((prev) => {
      const items = [...prev.items];
      const idx = items.findIndex((i) => lineKey(i.food_id, i.variant_id) === lineKey(line.food_id, line.variant_id));
      if (idx >= 0) {
        items[idx] = { ...items[idx], quantity: items[idx].quantity + line.quantity };
      } else {
        items.push(line);
      }
      return {
        restaurant_id: restaurantId,
        restaurant_name: restaurantName,
        restaurant_image: restaurantImage,
        items,
      };
    });
    return {};
  }, [cart.restaurant_id, cart.items.length]);

  const replaceCart: CartCtx["replaceCart"] = useCallback((restaurantId, restaurantName, restaurantImage, line) => {
    setCart({ restaurant_id: restaurantId, restaurant_name: restaurantName, restaurant_image: restaurantImage, items: [line] });
  }, []);

  const removeItem = useCallback((foodId: string, variantId?: string) => {
    setCart((prev) => {
      const items = prev.items.filter((i) => lineKey(i.food_id, i.variant_id) !== lineKey(foodId, variantId));
      if (items.length === 0) return EMPTY;
      return { ...prev, items };
    });
  }, []);

  const updateQuantity = useCallback((foodId: string, variantId: string | undefined, quantity: number) => {
    setCart((prev) => {
      if (quantity <= 0) {
        const items = prev.items.filter((i) => lineKey(i.food_id, i.variant_id) !== lineKey(foodId, variantId));
        if (items.length === 0) return EMPTY;
        return { ...prev, items };
      }
      return {
        ...prev,
        items: prev.items.map((i) =>
          lineKey(i.food_id, i.variant_id) === lineKey(foodId, variantId) ? { ...i, quantity } : i,
        ),
      };
    });
  }, []);

  const clear = useCallback(() => setCart(EMPTY), []);

  const itemCount = cart.items.reduce((s, i) => s + i.quantity, 0);
  const subtotal = cart.items.reduce((s, i) => s + i.unit_price * i.quantity, 0);

  const value = useMemo<CartCtx>(
    () => ({ cart, itemCount, subtotal, addItem, removeItem, updateQuantity, clear, replaceCart }),
    [cart, itemCount, subtotal, addItem, removeItem, updateQuantity, clear, replaceCart],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartCtx {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
