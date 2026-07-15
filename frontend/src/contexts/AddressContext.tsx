import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
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
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    (async () => {
      const raw = await storage.getItem<string>(SELECTED_KEY, "");
      if (raw) {
        try { setSelectedState(JSON.parse(raw) as Address); } catch { /* ignore */ }
      }
      setHydrated(true);
    })();
  }, []);

  useEffect(() => {
    if (hydrated && selected) {
      void storage.setItem(SELECTED_KEY, JSON.stringify(selected));
    }
    if (hydrated && !selected) {
      void storage.removeItem(SELECTED_KEY);
    }
  }, [selected, hydrated]);

  const setSelected = useCallback((addr: Address | null) => {
    setSelectedState(addr);
  }, []);

  const refresh = useCallback(async () => {
    if (!user) {
      setAddresses([]);
      return;
    }
    setLoading(true);
    try {
      const res = await api<Address[]>("/api/food/addresses");
      setAddresses(res);
      // if selected still exists in list, refresh its content; else fall back to default
      const stillThere = selected ? res.find((a) => a.id === selected.id) : null;
      if (stillThere) {
        setSelectedState(stillThere);
      } else if (!selected) {
        const def = res.find((a) => a.is_default) ?? res[0] ?? null;
        setSelectedState(def);
      } else {
        // previous selection was deleted
        const def = res.find((a) => a.is_default) ?? res[0] ?? null;
        setSelectedState(def);
      }
    } catch {
      setAddresses([]);
    } finally {
      setLoading(false);
    }
  }, [user, selected]);

  useEffect(() => {
    if (user) void refresh();
    else {
      setAddresses([]);
      setSelectedState(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const value = useMemo<Ctx>(() => ({ selected, addresses, loading, setSelected, refresh }), [selected, addresses, loading, setSelected, refresh]);

  return <AddressContext.Provider value={value}>{children}</AddressContext.Provider>;
}

export function useAddress(): Ctx {
  const ctx = useContext(AddressContext);
  if (!ctx) throw new Error("useAddress must be used inside AddressProvider");
  return ctx;
}
