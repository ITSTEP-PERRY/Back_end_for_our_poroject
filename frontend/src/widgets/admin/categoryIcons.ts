export const CATEGORY_ICON_PRESETS = [
  { id: "hanger", label: "Fashion", url: "/icons/admin/hanger.svg" },
  { id: "electronics", label: "Electronics", url: "/icons/admin/electronics.svg" },
  { id: "home", label: "Home", url: "/icons/admin/home.svg" },
  { id: "sport", label: "Sport", url: "/icons/admin/sport.svg" },
  { id: "beauty", label: "Beauty", url: "/icons/admin/beauty.svg" },
] as const;

export function categoryIconSrc(iconUrl?: string | null): string | null {
  if (!iconUrl) return null;
  return iconUrl;
}
