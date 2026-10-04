import { apiFetch, ApiError, authApiUrl, getToken } from "./client";
import { resolveMediaUrl } from "./media";
import type {
  AuthResponse,
  AuthUser,
  CartResponse,
  CategoryDto,
  OrderDto,
  AdminOrdersResponse,
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
    related: (p.related ?? []).map(normalizeListItem),
    saleRelated: (p.saleRelated ?? []).map(normalizeListItem),
  };
}

export const categoriesApi = {
  tree: async (opts?: { includeInactive?: boolean }) => {
    const qs = opts?.includeInactive ? "?includeInactive=true" : "";
    try {
      return await apiFetch<CategoryDto[]>(`/categories${qs}`);
    } catch (e) {
      // includeInactive требует Admin JWT; без него отдаём публичное дерево
      if (
        opts?.includeInactive &&
        e instanceof ApiError &&
        (e.status === 401 || e.status === 403)
      ) {
        return apiFetch<CategoryDto[]>("/categories");
      }
      throw e;
    }
  },
  bySlug: (slug: string) => apiFetch<CategoryDto>(`/categories/${encodeURIComponent(slug)}`),
  create: (body: Record<string, unknown>) =>
    apiFetch<CategoryDto>("/categories", { method: "POST", body: JSON.stringify(body) }),
  update: (id: string, body: Record<string, unknown>) =>
    apiFetch<CategoryDto>(`/categories/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  remove: (id: string) => apiFetch<void>(`/categories/${id}`, { method: "DELETE" }),
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

export const reviewsApi = {
  create: (
    productId: string,
    body: { rating: number; title: string; body: string; tags?: string[]; imageUrls?: string[] },
  ) =>
    apiFetch<{
      id: string;
      productId: string;
      userId: string;
      authorName: string;
      authorAvatarUrl?: string | null;
      rating: number;
      title: string;
      body: string;
      createdAtUtc: string;
      isApproved: boolean;
      tags: string[];
      images: string[];
    }>(`/reviews`, {
      method: "POST",
      body: JSON.stringify({
        productId,
        rating: body.rating,
        title: body.title,
        body: body.body,
        tags: body.tags ?? [],
        images: body.imageUrls ?? [],
      }),
    }),
  /** Copy Auth display name + photo onto all of the current user's Product reviews. */
  syncMyAvatar: () =>
    apiFetch<{ updated: number; authorName?: string | null; authorAvatarUrl?: string | null }>(
      "/reviews/me/avatar",
      { method: "PUT" },
    ),
  /** #102 — отзывы текущего пользователя */
  mine: async () => {
    const p = new URLSearchParams();
    p.set("CurrentPage", "1");
    p.set("PageSize", "100");
    p.set("OrderPropertyName", "CreatedAtUtc");
    p.set("DescendingOrder", "true");
    const raw = await apiFetch<{
      pagedList?: {
        items?: {
          id: string;
          productId: string;
          authorName?: string;
          rating: number;
          title?: string;
          body?: string;
          isApproved: boolean;
          createdAtUtc: string;
          tags?: { name?: string }[];
        }[];
      };
    }>(`/reviews/me?${p}`);
    return (raw.pagedList?.items ?? []).map((r) => ({
      id: r.id,
      productId: r.productId,
      authorName: r.authorName || "—",
      rating: r.rating,
      title: r.title || "",
      body: r.body || "",
      isApproved: r.isApproved,
      createdAtUtc: r.createdAtUtc,
      tags: (r.tags ?? []).map((t) => t.name || "").filter(Boolean),
    }));
  },
  /** #A04 — модерация через ReviewController (`/api/reviews`), не AdminReviewsController. */
  adminList: async (opts?: { status?: string; q?: string }) => {
    const p = new URLSearchParams();
    p.set("CurrentPage", "1");
    p.set("PageSize", "200");
    p.set("OrderPropertyName", "CreatedAtUtc");
    p.set("DescendingOrder", "true");
    const status = (opts?.status || "all").toLowerCase();
    if (status === "pending" || status === "hidden") {
      p.set("FilterObjects[0].PropertyName", "IsApproved");
      p.set("FilterObjects[0].Value", "false");
    } else if (status === "approved" || status === "visible") {
      p.set("FilterObjects[0].PropertyName", "IsApproved");
      p.set("FilterObjects[0].Value", "true");
    }
    if (opts?.q) {
      p.set("SearchPropertyName", "Title");
      p.set("SearchTerm", opts.q);
    }
    const raw = await apiFetch<{
      pagedList?: {
        items?: {
          id: string;
          productId: string;
          authorName?: string;
          rating: number;
          title?: string;
          body?: string;
          isApproved: boolean;
          createdAtUtc: string;
          tags?: { name?: string }[];
        }[];
      };
    }>(`/reviews?${p}`);
    const items = raw.pagedList?.items ?? [];
    return items.map((r) => ({
      id: r.id,
      productId: r.productId,
      productName: r.productId,
      authorName: r.authorName || "—",
      rating: r.rating,
      title: r.title || "",
      body: r.body || "",
      isApproved: r.isApproved,
      createdAtUtc: r.createdAtUtc,
      tags: (r.tags ?? []).map((t) => t.name || "").filter(Boolean),
    }));
  },
  approve: (id: string) =>
    apiFetch<void>(`/reviews/disable-many`, {
      method: "PATCH",
      body: JSON.stringify({ reviewIds: [id], approved: true }),
    }),
  reject: (id: string) =>
    apiFetch<void>(`/reviews/disable-many`, {
      method: "PATCH",
      body: JSON.stringify({ reviewIds: [id], approved: false }),
    }),
  remove: (id: string) => apiFetch<void>(`/reviews/${id}`, { method: "DELETE" }),
};

export const productsApi = {
  list: async (q: ProductQuery = {}) => {
    const params = new URLSearchParams();
    Object.entries(q).forEach(([k, v]) => {
      if (v === undefined || v === null || v === "") return;
      if (Array.isArray(v)) {
        v.forEach((item) => params.append(k, item));
        return;
      }
      params.set(k, String(v));
    });
    const qs = params.toString();
    const raw = await apiFetch<ProductListResponse>(`/products${qs ? `?${qs}` : ""}`);
    return { ...raw, items: (raw.items ?? []).map(normalizeListItem) };
  },
  byId: async (id: string) => normalizeProductDetail(await apiFetch<ProductDetail>(`/products/${id}`)),
  create: (body: Record<string, unknown>) =>
    apiFetch<{ id: string; slug: string }>("/products", { method: "POST", body: JSON.stringify(body) }),
  update: (id: string, body: Record<string, unknown>) =>
    apiFetch<{ id: string }>(`/products/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  remove: (id: string) => apiFetch<void>(`/products/${id}`, { method: "DELETE" }),
  notifyWhenAvailable: (id: string, email?: string) =>
    apiFetch<{ status: string; email: string; alreadySubscribed?: boolean }>(
      `/products/${id}/notify`,
      {
        method: "POST",
        body: JSON.stringify(email ? { email } : {}),
      },
    ),
};

function cartQs(sessionId?: string) {
  const p = new URLSearchParams();
  if (sessionId) p.set("sessionId", sessionId);
  const qs = p.toString();
  return qs ? `?${qs}` : "";
}

export const cartApi = {
  get: (_userId: string | null, sessionId: string) =>
    apiFetch<CartResponse>(`/cart${cartQs(sessionId)}`),
  count: (_userId: string | null, sessionId: string) =>
    apiFetch<{ count: number }>(`/cart/count${cartQs(sessionId)}`),
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
    apiFetch(`/cart/item/${productId}${cartQs(sessionId)}`, {
      method: "DELETE",
    }),
  merge: (sessionId: string) =>
    apiFetch<{ status: string }>("/cart/merge", {
      method: "POST",
      body: JSON.stringify({ sessionId }),
    }),
};

const LOCAL_ADMIN_LOGIN = "Admin";
const LOCAL_ADMIN_PASSWORD = "Admin";
const LOCAL_ADMIN_FLAG = "perry_local_admin";

export const authApi = {
  /** Auth Service: POST /api/auth/login → accessToken + user */
  login: async (login: string, password: string) => {
    // DEV: Admin/Admin → локальный Product API (React :3000), без Azure Auth.
    if (
      import.meta.env.DEV &&
      login.trim() === LOCAL_ADMIN_LOGIN &&
      password === LOCAL_ADMIN_PASSWORD
    ) {
      const raw = await apiFetch<Record<string, unknown>>("/dev/admin-login", {
        method: "POST",
        body: JSON.stringify({ login, password }),
      });
      localStorage.setItem(LOCAL_ADMIN_FLAG, "1");
      return normalizeAuthResponse(raw);
    }

    localStorage.removeItem(LOCAL_ADMIN_FLAG);
    const raw = await apiFetch<Record<string, unknown>>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: login, login, password }),
      base: "auth",
    });
    return normalizeAuthResponse(raw);
  },
  /**
   * Auth multi-step step 1: POST /api/auth/register
   * Body: { email, password, confirmPassword } → no JWT; email verification required.
   */
  register: async (body: { email: string; password: string; confirmPassword: string }) => {
    localStorage.removeItem(LOCAL_ADMIN_FLAG);
    return apiFetch<{
      userId: string;
      email: string;
      requiresEmailVerification: boolean;
      codeExpiresInSeconds: number;
    }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email: body.email,
        password: body.password,
        confirmPassword: body.confirmPassword,
      }),
      base: "auth",
    });
  },
  /** Step 2: verify email code → registrationToken for complete-registration. */
  verifyEmail: (email: string, code: string) =>
    apiFetch<{ emailVerified: boolean; email: string; registrationToken: string }>(
      "/auth/verify-email",
      {
        method: "POST",
        body: JSON.stringify({ email, code }),
        base: "auth",
      },
    ),
  resendVerificationCode: (email: string) =>
    apiFetch<{ status?: string }>("/auth/resend-verification-code", {
      method: "POST",
      body: JSON.stringify({ email }),
      base: "auth",
    }),
  /** Step 3: first/last name → account ready; then login for JWT. */
  completeRegistration: (body: {
    registrationToken: string;
    firstName: string;
    lastName: string;
  }) =>
    apiFetch<{ registrationCompleted: boolean; user: Record<string, unknown> }>(
      "/auth/complete-registration",
      {
        method: "POST",
        body: JSON.stringify(body),
        base: "auth",
      },
    ),
  me: async () => {
    if (import.meta.env.DEV && localStorage.getItem(LOCAL_ADMIN_FLAG) === "1") {
      const raw = await apiFetch<Record<string, unknown>>("/dev/me");
      return normalizeAuthUser(raw);
    }
    const raw = await apiFetch<Record<string, unknown>>("/auth/me", { base: "auth" });
    const user = normalizeAuthUser(raw);
    // Prefer session cache / public URL; Auth often returns "/api/account/avatar" which <img> cannot load.
    const cached = readAvatarCache();
    if (cached) return { ...user, avatar: cached };
    if (isPublicAvatarUrl(user.avatar)) return user;
    const hydrated = await authApi.loadAvatarBlobUrl().catch(() => null);
    return { ...user, avatar: hydrated || undefined };
  },
  /**
   * Authorized avatar for <img src>.
   * Returns data:/https:/blob: URL, never a bare Auth API path.
   */
  loadAvatarBlobUrl: async (): Promise<string | null> => {
    const cached = readAvatarCache();
    if (cached) return cached;
    const token = getToken();
    if (!token) return null;
    const url = authApiUrl("/account/avatar");
    let res: Response;
    try {
      res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    } catch {
      return null;
    }
    if (!res.ok) return null;
    const ct = (res.headers.get("content-type") || "").toLowerCase();
    if (ct.includes("application/json")) {
      const data = (await res.json()) as Record<string, unknown>;
      const href = String(data.avatarUrl ?? data.url ?? data.avatar ?? "");
      if (isPublicAvatarUrl(href)) {
        writeAvatarCache(href);
        return href;
      }
      return null;
    }
    // Some Auth builds omit content-type; still try as image bytes.
    const blob = await res.blob();
    if (!blob.size) return null;
    if (ct && !ct.startsWith("image/") && ct !== "application/octet-stream" && !ct.includes("octet")) {
      return null;
    }
    const dataUrl = await blobToDataUrl(blob);
    writeAvatarCache(dataUrl);
    return dataUrl;
  },
  /** Auth Account API: multipart field name is `File` (Swagger `/api/account/avatar`). */
  uploadAvatar: async (file: File) => {
    const form = new FormData();
    form.append("File", file, file.name);
    await apiFetch("/account/avatar", {
      method: "PUT",
      body: form,
      base: "auth",
    });
    // Immediate displayable avatar for account + reviews (don't wait on Auth CDN path).
    const dataUrl = await blobToDataUrl(file);
    writeAvatarCache(dataUrl);
    const me = await authApi.me();
    return { ...me, avatar: dataUrl };
  },
  clearAvatarCache: () => clearAvatarCache(),
  updateName: async (body: { firstName: string; lastName: string }) => {
    const raw = await apiFetch<Record<string, unknown>>("/account/name", {
      method: "PATCH",
      body: JSON.stringify(body),
      base: "auth",
    });
    return normalizeAuthUser(raw);
  },
  updateMe: (body: { name?: string; email?: string; avatar?: string }) =>
    apiFetch<AuthUser>("/auth/me", {
      method: "PUT",
      body: JSON.stringify(body),
      base: "auth",
    }).catch(async () => {
      // Legacy fallback — real Auth uses /account/name and /account/avatar.
      const me = await authApi.me();
      return { ...me, ...body } as AuthUser;
    }),
  changePassword: (currentPassword: string, newPassword: string) =>
    apiFetch<{ status: string }>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ currentPassword, newPassword }),
      base: "auth",
    }),
  sendEmailChangeCode: (newEmail: string, password: string) =>
    apiFetch<{ status: string; code?: string }>("/auth/resend-verification-code", {
      method: "POST",
      body: JSON.stringify({ newEmail, password, email: newEmail }),
      base: "auth",
    }),
  changeEmail: (newEmail: string, password: string, code: string) =>
    apiFetch<AuthUser>("/auth/verify-email", {
      method: "POST",
      body: JSON.stringify({ newEmail, password, code, email: newEmail }),
      base: "auth",
    }).then(() => authApi.me()),
  deleteMe: () =>
    apiFetch<void>("/auth/logout", { method: "POST", base: "auth" }),
  forgot: (email: string) =>
    apiFetch<{ status: string }>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
      base: "auth",
    }),
};

const AVATAR_CACHE_KEY = "perry_avatar_data";

/** Public URLs safe for <img src>. Relative Auth paths need Bearer fetch. */
function isPublicAvatarUrl(url?: string | null): boolean {
  return !!url && /^(https?:|data:|blob:)/i.test(url);
}

function readAvatarCache(): string | null {
  try {
    const v = sessionStorage.getItem(AVATAR_CACHE_KEY);
    return v && /^(data:image|https?:|blob:)/i.test(v) ? v : null;
  } catch {
    return null;
  }
}

function writeAvatarCache(url: string) {
  try {
    sessionStorage.setItem(AVATAR_CACHE_KEY, url);
  } catch {
    /* quota / private mode */
  }
}

function clearAvatarCache() {
  try {
    sessionStorage.removeItem(AVATAR_CACHE_KEY);
  } catch {
    /* ignore */
  }
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Failed to read image"));
    reader.readAsDataURL(blob);
  });
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
  const avatarRaw = ((raw.avatarUrl as string | null | undefined) ??
    (raw.avatar as string | null | undefined) ??
    undefined) as string | undefined;
  return {
    id: String(raw.id ?? raw.userId ?? ""),
    name: String(raw.name ?? raw.fullName ?? (fullFromParts || raw.email) ?? "User"),
    email: String(raw.email ?? ""),
    login: String(raw.login ?? raw.email ?? ""),
    roleId: role === "Admin" || role === "admin" ? "Admin" : "User",
    // Keep relative paths only as a signal for me() to hydrate; do not use as img src.
    avatar: avatarRaw || undefined,
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
  return {
    token,
    user: normalizeAuthUser(userRaw),
  };
}

type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  roleId: string;
  login: string;
  registeredAtUtc: string;
  deletedAtUtc?: string | null;
  isDeleted?: boolean;
};

function mapAdminUser(raw: Record<string, unknown>): AdminUserRow {
  const first = String(raw.firstName ?? "").trim();
  const last = String(raw.lastName ?? "").trim();
  const nameFromParts = [first, last].filter(Boolean).join(" ");
  const status = String(raw.status ?? "").toLowerCase();
  const isDeleted =
    Boolean(raw.isDeleted) ||
    raw.deletedAtUtc != null ||
    status === "deleted";
  const roleRaw = String(raw.role ?? raw.roleId ?? "User");
  return {
    id: String(raw.id ?? ""),
    name: String(raw.name ?? (nameFromParts || raw.email || "User")),
    email: String(raw.email ?? ""),
    roleId: roleRaw === "Admin" || roleRaw === "admin" ? "Admin" : "User",
    login: String(raw.login ?? raw.email ?? ""),
    registeredAtUtc: String(raw.registeredAtUtc ?? raw.createdAt ?? raw.createdAtUtc ?? ""),
    deletedAtUtc: (raw.deletedAtUtc as string | null | undefined) ??
      (isDeleted ? String(raw.updatedAt ?? raw.updatedAtUtc ?? "") || null : null),
    isDeleted,
  };
}

/** Admin users — perry-admin-service (`/api/admin/users`), не Auth. */
export const usersApi = {
  list: (opts?: { status?: string; role?: string }) => {
    const p = new URLSearchParams();
    p.set("Page", "1");
    p.set("PageSize", "100");
    // Service: Status=Active|Deleted|Blocked; omit for All
    if (opts?.status && opts.status !== "all") {
      const s = opts.status.toLowerCase();
      p.set(
        "Status",
        s === "deleted" ? "Deleted" : s === "blocked" ? "Blocked" : "Active",
      );
    }
    if (opts?.role) p.set("Role", opts.role);
    const qs = p.toString();
    return apiFetch<{ items?: Record<string, unknown>[] } | Record<string, unknown>[]>(
      `/admin/users?${qs}`,
      { base: "users" },
    ).then((raw) => {
      const list = Array.isArray(raw)
        ? raw
        : Array.isArray(raw.items)
          ? raw.items
          : [];
      return list.map((u) => mapAdminUser(u as Record<string, unknown>));
    });
  },
  softDelete: (id: string) =>
    apiFetch(`/admin/users/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status: "Deleted" }),
      base: "users",
    }),
  restore: (id: string) =>
    apiFetch(`/admin/users/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status: "Active" }),
      base: "users",
    }),
  setRole: (id: string, roleId: string) =>
    apiFetch(`/admin/users/${id}/role`, {
      method: "PATCH",
      body: JSON.stringify({ role: roleId }),
      base: "users",
    }),
};

export const wishlistApi = {
  mine: (search?: string) => {
    const qs = search ? `?search=${encodeURIComponent(search)}` : "";
    return apiFetch<WishlistItemDto[]>(`/wishlist${qs}`);
  },
  ids: () => apiFetch<string[]>("/wishlist/ids"),
  add: (productId: string) =>
    apiFetch<{ status: string }>("/wishlist", {
      method: "POST",
      body: JSON.stringify({ productId }),
    }),
  remove: (productId: string) => apiFetch<void>(`/wishlist/${productId}`, { method: "DELETE" }),
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
  admin: (opts?: { status?: string; fromUtc?: string; toUtc?: string; orderId?: string }) => {
    const p = new URLSearchParams();
    if (opts?.status) p.set("status", opts.status);
    if (opts?.fromUtc) p.set("fromUtc", opts.fromUtc);
    if (opts?.toUtc) p.set("toUtc", opts.toUtc);
    if (opts?.orderId) p.set("orderId", opts.orderId);
    const qs = p.toString();
    return apiFetch<AdminOrdersResponse>(`/orders/admin${qs ? `?${qs}` : ""}`);
  },
  /** Back-compat: flat list without filters. */
  all: () =>
    apiFetch<AdminOrdersResponse>("/orders/admin").then((r) => r.items),
  setStatus: (id: string, status: string) =>
    apiFetch(`/orders/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    }),
};
