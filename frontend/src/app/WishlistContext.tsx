import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { wishlistApi } from "../api";
import type { WishlistItemDto } from "../api/types";
import { useAuth } from "./AuthContext";

type WishlistState = {
  items: WishlistItemDto[];
  ids: Set<string>;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  add: (productId: string) => Promise<void>;
  remove: (productId: string) => Promise<void>;
  toggle: (productId: string) => Promise<void>;
  has: (productId: string) => boolean;
};

const WishlistContext = createContext<WishlistState | null>(null);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<WishlistItemDto[]>([]);
  const [ids, setIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) {
      setItems([]);
      setIds(new Set());
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const list = await wishlistApi.mine();
      setItems(list);
      setIds(new Set(list.map((i) => i.productId)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load wishlist");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const add = useCallback(
    async (productId: string) => {
      if (!user) throw new Error("Sign in to use wishlist");
      await wishlistApi.add(productId);
      setIds((prev) => new Set(prev).add(productId));
      await refresh();
    },
    [user, refresh],
  );

  const remove = useCallback(
    async (productId: string) => {
      if (!user) return;
      await wishlistApi.remove(productId);
      setIds((prev) => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
      setItems((prev) => prev.filter((i) => i.productId !== productId));
    },
    [user],
  );

  const toggle = useCallback(
    async (productId: string) => {
      if (ids.has(productId)) await remove(productId);
      else await add(productId);
    },
    [ids, add, remove],
  );

  const has = useCallback((productId: string) => ids.has(productId), [ids]);

  const value = useMemo(
    () => ({ items, ids, loading, error, refresh, add, remove, toggle, has }),
    [items, ids, loading, error, refresh, add, remove, toggle, has],
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist outside WishlistProvider");
  return ctx;
}
