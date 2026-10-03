import { Platform } from "react-native";

const PRODUCT = (process.env.EXPO_PUBLIC_PRODUCT_URL || "").replace(/\/$/, "");

/** CDN из seed Product API часто режут hotlink с localhost → серые Image. */
const HOTLINK_HOSTS = /(?:^|\.)picsum\.photos$|(?:^|\.)unsplash\.com$|(?:^|\.)images\.unsplash\.com$/i;

/**
 * Absolute URL for RN Image.
 * Web: same-origin `/uploads/...` → Metro proxy → Product :5272.
 * Native: prefix EXPO_PUBLIC_PRODUCT_URL.
 * Web + picsum/unsplash: прокси wsrv.nl (иначе плейсхолдеры).
 */
export function resolveMediaUrl(value: unknown): string | null {
  let url: string | null = null;
  if (typeof value === "string") url = value;
  else if (value && typeof value === "object" && "url" in value) {
    const u = (value as { url?: unknown }).url;
    url = typeof u === "string" && u ? u : null;
  }
  if (!url) return null;
  if (url.startsWith("//")) url = `https:${url}`;

  if (url.startsWith("http://") || url.startsWith("https://")) {
    if (Platform.OS === "web" && needsHotlinkProxy(url)) {
      return `https://wsrv.nl/?url=${encodeURIComponent(url)}&w=640&h=640&fit=cover&output=jpg`;
    }
    return url;
  }

  const path = url.startsWith("/") ? url : `/${url}`;
  if (Platform.OS === "web") return path;

  const origin = PRODUCT || "http://localhost:5272";
  return `${origin}${path}`;
}

function needsHotlinkProxy(url: string): boolean {
  try {
    return HOTLINK_HOSTS.test(new URL(url).hostname);
  } catch {
    return false;
  }
}
