/** Сохранённый адрес доставки покупателя (localStorage). */

const KEY = "perry_shipping_address";

export type SavedShippingAddress = {
  country: string;
  state: string;
  city: string;
  postcode: string;
  firstName?: string;
  lastName?: string;
};

export function loadShippingAddress(): SavedShippingAddress | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedShippingAddress;
    if (!parsed || typeof parsed !== "object") return null;
    return {
      country: String(parsed.country || ""),
      state: String(parsed.state || ""),
      city: String(parsed.city || ""),
      postcode: String(parsed.postcode || ""),
      firstName: parsed.firstName ? String(parsed.firstName) : undefined,
      lastName: parsed.lastName ? String(parsed.lastName) : undefined,
    };
  } catch {
    return null;
  }
}

export function saveShippingAddress(data: SavedShippingAddress) {
  localStorage.setItem(
    KEY,
    JSON.stringify({
      country: data.country,
      state: data.state,
      city: data.city,
      postcode: data.postcode,
      firstName: data.firstName ?? "",
      lastName: data.lastName ?? "",
    }),
  );
}
