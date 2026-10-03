/** API sometimes returns imageUrl as string, sometimes as { url }. */
export function resolveMediaUrl(value: unknown): string | null {
  if (value == null || value === "") return null;
  if (typeof value === "string") return value;
  if (typeof value === "object" && "url" in (value as object)) {
    const url = (value as { url?: unknown }).url;
    return typeof url === "string" && url ? url : null;
  }
  return null;
}
