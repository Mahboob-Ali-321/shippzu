import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { api, authStore } from "@/src/api/client";

export type User = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: "customer" | "owner" | "partner" | "admin";
  avatar_url?: string | null;
};

type AuthCtx = {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string, phone?: string) => Promise<void>;
  signOut: () => Promise<void>;
  googleSignIn: (payload: { email: string; name: string; google_id: string; avatar_url?: string }) => Promise<void>;
  updateProfile: (data: Partial<Pick<User, "name" | "phone" | "avatar_url">>) => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const token = await authStore.getAccess();
      const cached = await authStore.getUser<User>();
      if (token && cached) {
        setUser(cached);
        try {
          const fresh = await api<User>("/api/auth/me");
          setUser(fresh);
          await authStore.setUser(fresh);
        } catch {
          // token might be expired — clear
          await authStore.clear();
          setUser(null);
        }
      }
      setLoading(false);
    })();
  }, []);

  const applyAuth = useCallback(async (data: any) => {
    await authStore.setTokens(data.access_token, data.refresh_token);
    await authStore.setUser(data.user);
    setUser(data.user);
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const data = await api("/api/auth/login", { method: "POST", auth: false, body: { email, password } });
    await applyAuth(data);
  }, [applyAuth]);

  const signUp = useCallback(async (name: string, email: string, password: string, phone?: string) => {
    const data = await api("/api/auth/register", { method: "POST", auth: false, body: { name, email, password, phone, role: "customer" } });
    await applyAuth(data);
  }, [applyAuth]);

  const googleSignIn = useCallback(async (payload: { email: string; name: string; google_id: string; avatar_url?: string }) => {
    const data = await api("/api/auth/google", { method: "POST", auth: false, body: payload });
    await applyAuth(data);
  }, [applyAuth]);

  const signOut = useCallback(async () => {
    try { await api("/api/auth/logout", { method: "POST" }); } catch { /* ignore */ }
    await authStore.clear();
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (data: Partial<Pick<User, "name" | "phone" | "avatar_url">>) => {
    const fresh = await api<User>("/api/auth/me", { method: "PUT", body: data });
    setUser(fresh);
    await authStore.setUser(fresh);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const fresh = await api<User>("/api/auth/me");
      setUser(fresh);
      await authStore.setUser(fresh);
    } catch { /* ignore */ }
  }, []);

  const value = useMemo<AuthCtx>(() => ({ user, loading, signIn, signUp, signOut, googleSignIn, updateProfile, refresh }), [user, loading, signIn, signUp, signOut, googleSignIn, updateProfile, refresh]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthCtx {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
