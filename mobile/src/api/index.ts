import { apiFetch } from "./client";
import { resolveMediaUrl } from "./media";
import type {
  AuthResponse,
  AuthUser,
  CartResponse,
  CategoryDto,
  OrderDto,
  ProductDetail,
  ProductListItem,
  ProductListResponse,
  WishlistItemDto,
} from "./types";

function normalizeListItem(item: ProductListItem): ProductListItem {
  return {
    ...item,
    imageUrl: resolveMediaUrl(item.imageUrl),
    status: item.status == null ? item.status : String(item.status),
  };
}

function normalizeProductDetail(p: ProductDetail): ProductDetail {
  return {
    ...p,
    status: p.status == null ? p.status : String(p.status),
    images: (p.images ?? []).map((img) => ({
      ...img,
      url: resolveMediaUrl(img.url) || img.url,
    })),
    related: (p.related ?? []).map(normalizeListItem),
    saleRelated: (p.saleRelated ?? []).map(normalizeListItem),
  };
}

function normalizeAuthUser(raw: Record<string, unknown>): AuthUser {
  const role =
    (raw.role as string) ||
    (raw.roleId as string) ||
    (Array.isArray(raw.roles) ? String(raw.roles[0]) : undefined) ||
    "User";
  const first = String(raw.firstName ?? "").trim();
  const last = String(raw.lastName ?? "").trim();
  const fullFromParts = [first, last].filter(Boolean).join(" ");
  return {
    id: String(raw.id ?? raw.userId ?? ""),
    name: String(raw.name ?? raw.fullName ?? (fullFromParts || raw.email) ?? "User"),
    email: String(raw.email ?? ""),
    login: String(raw.login ?? raw.email ?? ""),
    roleId: role === "Admin" || role === "admin" ? "Admin" : "User",
    avatar: ((raw.avatarUrl as string | null | undefined) ??
      (raw.avatar as string | null | undefined) ??
      undefined) as string | undefined,
  };
}

function normalizeAuthResponse(raw: Record<string, unknown>): AuthResponse {
  const token = String(
    raw.token ??
      raw.accessToken ??
      raw.access_token ??
      (raw.data && typeof raw.data === "object"
        ? (raw.data as Record<string, unknown>).accessToken
        : "") ??
      "",
  );
  const userRaw =
    (raw.user as Record<string, unknown> | undefined) ||
    (raw.data && typeof raw.data === "object"
      ? ((raw.data as Record<string, unknown>).user as Record<string, unknown> | undefined)
      : undefined) ||
    raw;
  return { token, user: normalizeAuthUser(userRaw) };
}

export const categoriesApi = {
  tree: () => apiFetch<CategoryDto[]>("/categories"),
};

export type ProductQuery = {
  categoryId?: string;
  brand?: string;
  brands?: string[];
  fabrics?: string[];
  sizes?: string[];
  colors?: string[];
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  search?: string;
  sort?: string;
  page?: number;
  pageSize?: number;
};

export const productsApi = {
  list: async (q: ProductQuery = {}) => {
    const params = new URLSearchParams();
    Object.entries(q).forEach(([k, v]) => {
      if (v === undefined || v === null || v === "") return;
      if (Array.isArray(v)) {
        v.forEach((item) => params.append(k, String(item)));
        return;
      }
      params.set(k, String(v));
    });
    const qs = params.toString();
    const raw = await apiFetch<ProductListResponse>(`/products${qs ? `?${qs}` : ""}`);
    return { ...raw, items: (raw.items ?? []).map(normalizeListItem) };
  },
  byId: async (id: string) =>
    normalizeProductDetail(await apiFetch<ProductDetail>(`/products/${id}`)),
};

function cartQs(sessionId?: string) {
  const p = new URLSearchParams();
  if (sessionId) p.set("sessionId", sessionId);
  const qs = p.toString();
  return qs ? `?${qs}` : "";
}

export const cartApi = {
  get: (_userId: string | null, sessionId: string) =>
    apiFetch<CartResponse>(`/cart${cartQs(sessionId)}`).then((c) => ({
      ...c,
      items: (c.items ?? []).map((i) => ({
        ...i,
        imageUrl: resolveMediaUrl(i.imageUrl),
      })),
    })),
  add: (_userId: string | null, sessionId: string, productId: string, quantity = 1) =>
    apiFetch(`/cart/add${cartQs(sessionId)}`, {
      method: "POST",
      body: JSON.stringify({ productId, quantity }),
    }),
  setQty: (_userId: string | null, sessionId: string, productId: string, quantity: number) =>
    apiFetch(`/cart/quantity${cartQs(sessionId)}`, {
      method: "PUT",
      body: JSON.stringify({ productId, quantity }),
    }),
  remove: (_userId: string | null, sessionId: string, productId: string) =>
    apiFetch(`/cart/item/${productId}${cartQs(sessionId)}`, { method: "DELETE" }),
  merge: (sessionId: string) =>
    apiFetch<{ status: string }>("/cart/merge", {
      method: "POST",
      body: JSON.stringify({ sessionId }),
    }),
};

export const authApi = {
  login: async (login: string, password: string) => {
    const raw = await apiFetch<Record<string, unknown>>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: login, login, password }),
      base: "auth",
    });
    return normalizeAuthResponse(raw);
  },
  register: async (body: { name: string; email: string; login: string; password: string }) => {
    const raw = await apiFetch<Record<string, unknown>>("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email: body.email,
        password: body.password,
        name: body.name,
        login: body.login,
      }),
      base: "auth",
    });
    return normalizeAuthResponse(raw);
  },
  me: async () => {
    const raw = await apiFetch<Record<string, unknown>>("/auth/me", { base: "auth" });
    return normalizeAuthUser(raw);
  },
  forgot: (email: string) =>
    apiFetch<{ status: string }>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
      base: "auth",
    }),
};

export const ordersApi = {
  mine: () => apiFetch<OrderDto[]>("/orders"),
  byId: (id: string) => apiFetch<OrderDto>(`/orders/${id}`),
  checkout: (
    sessionId: string,
    opts?: { shippingAddress?: string; paymentType?: string; recipientName?: string },
  ) =>
    apiFetch<OrderDto>("/orders/checkout", {
      method: "POST",
      body: JSON.stringify({
        sessionId,
        shippingAddress: opts?.shippingAddress,
        paymentType: opts?.paymentType ?? "Cash",
        recipientName: opts?.recipientName,
      }),
    }),
};

export const wishlistApi = {
  mine: () => apiFetch<WishlistItemDto[]>("/wishlist"),
  add: (productId: string) =>
    apiFetch<{ status: string }>("/wishlist", {
      method: "POST",
      body: JSON.stringify({ productId }),
    }),
  remove: (productId: string) => apiFetch<void>(`/wishlist/${productId}`, { method: "DELETE" }),
};

export const reviewsApi = {
  create: (
    productId: string,
    body: { rating: number; title: string; body: string; tags?: string[] },
  ) =>
    apiFetch(`/reviews`, {
      method: "POST",
      body: JSON.stringify({
        productId,
        rating: body.rating,
        title: body.title,
        body: body.body,
        tags: body.tags ?? [],
        images: [],
      }),
    }),
  mine: async () => {
    const p = new URLSearchParams();
    p.set("CurrentPage", "1");
    p.set("PageSize", "50");
    p.set("OrderPropertyName", "CreatedAtUtc");
    p.set("DescendingOrder", "true");
    const raw = await apiFetch<{
      pagedList?: { items?: Record<string, unknown>[] };
    }>(`/reviews/me?${p}`);
    return raw.pagedList?.items ?? [];
  },
};

export const healthApi = {
  check: () => apiFetch<{ status?: string }>("/health"),
};
