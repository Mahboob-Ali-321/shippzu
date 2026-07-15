import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from "react";
import { storage } from "@/src/utils/storage";
import { api } from "@/src/api/client";
import { useAuth } from "./AuthContext";

export type Address = {
  id: string;
  label: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  is_default: boolean;
};

type Ctx = {
  selected: Address | null;
  addresses: Address[];
  loading: boolean;
  setSelected: (addr: Address | null) => void;
  refresh: () => Promise<void>;
};

const AddressContext = createContext<Ctx | null>(null);
const SELECTED_KEY = "shippzu.address.selected.v1";

export function AddressProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [selected, setSelectedState] = useState<Address | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(false);
  const hydratedRef = useRef(false);

  // 1. HYDRATE from storage exactly once on mount, before anything else can touch selection.
  useEffect(() => {
    (async () => {
      const raw = await storage.getItem<string>(SELECTED_KEY, "");
      if (raw) {
        try { setSelectedState(JSON.parse(raw) as Address); } catch { /* ignore */ }
      }
      hydratedRef.current = true;
    })();
  }, []);

  // 2. PERSIST every change (only after hydration completes).
  useEffect(() => {
    if (!hydratedRef.current) return;
    if (selected) {
      void storage.setItem(SELECTED_KEY, JSON.stringify(selected));
    } else {
      void storage.removeItem(SELECTED_KEY);
    }
  }, [selected]);

  const setSelected = useCallback((addr: Address | null) => {
    setSelectedState(addr);
  }, []);

  // 3. REFRESH: only ever updates fields; NEVER wipes a persisted selection just because
  //    the API returned empty (transient failure / server hasn't propagated yet).
  //    Uses functional setState so it does not depend on `selected` — avoids infinite loops.
  const refresh = useCallback(async () => {
    if (!user) {
      setAddresses([]);
      return;
    }
    setLoading(true);
    try {
      const res = await api<Address[]>("/api/food/addresses");
      setAddresses(res);
      if (res.length === 0) return; // don't touch selection
      setSelectedState((prev) => {
        if (prev) {
          const found = res.find((a) => a.id === prev.id);
          // Keep the freshest version; if it was deleted server-side, fall back to default/first.
          return found ?? (res.find((a) => a.is_default) ?? res[0]);
        }
        return res.find((a) => a.is_default) ?? res[0];
      });
    } catch {
      // network / server error: don't wipe local selection
    } finally {
      setLoading(false);
    }
  }, [user]);

  // 4. On login change: fetch addresses. On logout: clear.
  useEffect(() => {
    if (!user) {
      setAddresses([]);
      setSelectedState(null);
      return;
    }
    // small delay to let hydration flush first (harmless if already done)
    const t = setTimeout(() => { void refresh(); }, 50);
    return () => clearTimeout(t);
  }, [user?.id, refresh]);

  const value = useMemo<Ctx>(() => ({ selected, addresses, loading, setSelected, refresh }), [selected, addresses, loading, setSelected, refresh]);

  return <AddressContext.Provider value={value}>{children}</AddressContext.Provider>;
}

export function useAddress(): Ctx {
  const ctx = useContext(AddressContext);
  if (!ctx) throw new Error("useAddress must be used inside AddressProvider");
  return ctx;
}
