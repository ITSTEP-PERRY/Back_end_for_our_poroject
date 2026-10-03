import { Platform } from "react-native";
import { getToken } from "./token";

const PRODUCT_CONFIGURED = (process.env.EXPO_PUBLIC_PRODUCT_URL || "").replace(/\/$/, "");
const AUTH_CONFIGURED = (process.env.EXPO_PUBLIC_AUTH_URL || "").replace(/\/$/, "");

/**
 * Product API — тот же Perry.Api :5272, что и desktop.
 * Web: same-origin `/api` → Metro proxy → :5272 (как Vite, без CORS).
 * Native: EXPO_PUBLIC_PRODUCT_URL (localhost / 10.0.2.2 / LAN IP).
 */
function productBase(): string {
  if (Platform.OS === "web") return "";
  return PRODUCT_CONFIGURED || "http://localhost:5272";
}

/**
 * Web: `/auth-api` → Metro → Azure Auth.
 * Native: абсолютный EXPO_PUBLIC_AUTH_URL.
 */
function authBase(): string {
  if (Platform.OS === "web") return "/auth-api";
  return (
    AUTH_CONFIGURED ||
    "https://perry-auth-service.orangeplant-910928aa.swedencentral.azurecontainerapps.io"
  );
}

export function productUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  const rest = p.startsWith("/api/") ? p.slice(4) : p.startsWith("/api") ? p.slice(4) : p;
  const apiPath = rest.startsWith("/") ? `/api${rest}` : `/api/${rest}`;
  const origin = productBase();
  return origin ? `${origin}${apiPath}` : apiPath;
}

export function authUrl(path: string): string {
  const base = authBase();
  const p = path.startsWith("/") ? path : `/${path}`;
  if (p.startsWith("/api/")) return `${base}${p}`;
  return `${base}/api${p}`;
}

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

type Base = "product" | "auth";

export async function apiFetch<T = unknown>(
  path: string,
  init: RequestInit & { base?: Base } = {},
): Promise<T> {
  const { base = "product", ...rest } = init;
  const headers = new Headers(rest.headers);
  const method = (rest.method || "GET").toUpperCase();
  let body = rest.body;
  if (!body && (method === "POST" || method === "PUT" || method === "PATCH")) {
    body = "{}";
  }
  if (body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const token = await getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const url = path.startsWith("http")
    ? path
    : base === "auth"
      ? authUrl(path)
      : productUrl(path);

  let res: Response;
  try {
    res = await fetch(url, { ...rest, method, headers, body });
  } catch {
    throw new ApiError(
      0,
      base === "auth"
        ? Platform.OS === "web"
          ? "Network — Auth proxy/unreachable (restart Expo; /auth-api → Azure)"
          : "Network — Auth unreachable (EXPO_PUBLIC_AUTH_URL)"
        : Platform.OS === "web"
          ? "Network — Product proxy/unreachable (restart Expo; /api → :5272)"
          : "Network — Product unreachable (EXPO_PUBLIC_PRODUCT_URL / :5272)",
    );
  }

  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    if (data && typeof data === "object") {
      const o = data as { error?: string; message?: string; title?: string };
      const fromBody = o.error || o.message || o.title;
      if (fromBody) msg = String(fromBody);
    }
    throw new ApiError(res.status, msg, data);
  }
  return data as T;
}

export function getProductOrigin(): string {
  if (Platform.OS === "web") {
    if (typeof window !== "undefined" && window.location?.origin) {
      return window.location.origin;
    }
    return "";
  }
  return PRODUCT_CONFIGURED || "http://localhost:5272";
}
