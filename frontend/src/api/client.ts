// Central API client for Shippzu. Handles auth headers + refresh flow.
import { storage } from "@/src/utils/storage";

const BASE = process.env.EXPO_PUBLIC_BACKEND_URL || "";

const ACCESS_KEY = "shippzu.auth.access";
const REFRESH_KEY = "shippzu.auth.refresh";
const USER_KEY = "shippzu.auth.user";

export const authStore = {
  async getAccess() {
    return storage.secureGet<string>(ACCESS_KEY, "");
  },
  async getRefresh() {
    return storage.secureGet<string>(REFRESH_KEY, "");
  },
  async setTokens(access: string, refresh: string) {
    await storage.secureSet(ACCESS_KEY, access);
    await storage.secureSet(REFRESH_KEY, refresh);
  },
  async setUser(user: unknown) {
    await storage.setItem(USER_KEY, JSON.stringify(user));
  },
  async getUser<T = unknown>(): Promise<T | null> {
    const raw = await storage.getItem<string>(USER_KEY, "");
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },
  async clear() {
    await storage.secureRemove(ACCESS_KEY);
    await storage.secureRemove(REFRESH_KEY);
    await storage.removeItem(USER_KEY);
  },
};

async function refreshTokens(): Promise<boolean> {
  const refresh = await authStore.getRefresh();
  if (!refresh) return false;
  try {
    const res = await fetch(`${BASE}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refresh }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    await authStore.setTokens(data.access_token, data.refresh_token);
    if (data.user) await authStore.setUser(data.user);
    return true;
  } catch {
    return false;
  }
}

export type ApiOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  body?: unknown;
  auth?: boolean;
  query?: Record<string, string | number | boolean | undefined | null>;
};

export class ApiError extends Error {
  status: number;
  data: any;
  constructor(message: string, status: number, data: any) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

function buildUrl(path: string, query?: ApiOptions["query"]) {
  let url = `${BASE}${path.startsWith("/") ? path : `/${path}`}`;
  if (query) {
    const params = Object.entries(query)
      .filter(([, v]) => v !== undefined && v !== null && v !== "")
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
    if (params.length) url += `?${params.join("&")}`;
  }
  return url;
}

export async function api<T = any>(path: string, opts: ApiOptions = {}): Promise<T> {
  const { method = "GET", body, auth = true, query } = opts;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (auth) {
    const access = await authStore.getAccess();
    if (access) headers["Authorization"] = `Bearer ${access}`;
  }
  const url = buildUrl(path, query);
  let res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && auth) {
    // try refresh
    const ok = await refreshTokens();
    if (ok) {
      const access = await authStore.getAccess();
      if (access) headers["Authorization"] = `Bearer ${access}`;
      res = await fetch(url, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
    }
  }

  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) {
    const msg = (data && (data.detail || data.message)) || `Request failed (${res.status})`;
    throw new ApiError(msg, res.status, data);
  }
  return data as T;
}
