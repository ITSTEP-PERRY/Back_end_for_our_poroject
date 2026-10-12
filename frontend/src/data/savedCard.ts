/** Карта для demo-checkout: номер и срок живут между сессиями (localStorage).
 *  CVV/CVC не сохраняется никогда.
 */

const KEY_PREFIX = "perry_saved_card";
const LEGACY_KEY = "perry_saved_card";

export type SavedCard = {
  cardNumber: string;
  cardExp: string;
};

function storageKey(userKey?: string | null): string {
  const id = (userKey || "").trim();
  return id ? `${KEY_PREFIX}:${id}` : LEGACY_KEY;
}

export function loadSavedCard(userKey?: string | null): SavedCard | null {
  const keys = [storageKey(userKey), LEGACY_KEY];
  const seen = new Set<string>();
  for (const key of keys) {
    if (seen.has(key)) continue;
    seen.add(key);
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw) as SavedCard & { cardCvv?: string };
      if (!parsed || typeof parsed !== "object") continue;
      const cardNumber = String(parsed.cardNumber || "");
      const cardExp = String(parsed.cardExp || "");
      if (!cardNumber && !cardExp) continue;
      return { cardNumber, cardExp };
    } catch {
      /* try next key */
    }
  }
  return null;
}

export function saveSavedCard(data: SavedCard, userKey?: string | null) {
  const payload = JSON.stringify({
    cardNumber: data.cardNumber,
    cardExp: data.cardExp,
  });
  localStorage.setItem(storageKey(userKey), payload);
  // Дублируем в legacy-ключ — переживает смену логики ключей между сессиями.
  localStorage.setItem(LEGACY_KEY, payload);
}
