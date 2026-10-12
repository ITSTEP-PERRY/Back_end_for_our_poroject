import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cartApi } from "../api";
import { getCartSessionId } from "../api/token";
import type { CartResponse } from "../api/types";
import { useAuth } from "../auth/AuthContext";

type CartState = {
  cart: CartResponse | null;
  count: number;
  sessionId: string;
  ready: boolean;
  refresh: () => Promise<void>;
  add: (productId: string, qty?: number) => Promise<void>;
  setQty: (productId: string, qty: number) => Promise<void>;
  remove: (productId: string) => Promise<void>;
};

const CartContext = createContext<CartState | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [sessionId, setSessionId] = useState("");
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [ready, setReady] = useState(false);
  const mergedForUser = useRef<string | null>(null);

  useEffect(() => {
    getCartSessionId().then((id) => {
      setSessionId(id);
      setReady(true);
    });
  }, []);

  const refresh = useCallback(async () => {
    if (!sessionId) return;
    try {
      const data = await cartApi.get(userId, sessionId);
      setCart(data);
    } catch {
      setCart({ itemsCount: 0, totalAmount: 0, items: [] });
    }
  }, [userId, sessionId]);

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    (async () => {
      if (userId && mergedForUser.current !== userId) {
        try {
          await cartApi.merge(sessionId);
          mergedForUser.current = userId;
        } catch {
          /* best-effort */
        }
      }
      if (!userId) mergedForUser.current = null;
      if (!cancelled) await refresh();
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, sessionId, refresh]);

  const add = useCallback(
    async (productId: string, qty = 1) => {
      await cartApi.add(userId, sessionId, productId, qty);
      await refresh();
    },
    [userId, sessionId, refresh],
  );

  const setQty = useCallback(
    async (productId: string, qty: number) => {
      await cartApi.setQty(userId, sessionId, productId, qty);
      await refresh();
    },
    [userId, sessionId, refresh],
  );

  const remove = useCallback(
    async (productId: string) => {
      await cartApi.remove(userId, sessionId, productId);
      await refresh();
    },
    [userId, sessionId, refresh],
  );

  const value = useMemo(
    () => ({
      cart,
      count: cart?.itemsCount ?? 0,
      sessionId,
      ready,
      refresh,
      add,
      setQty,
      remove,
    }),
    [cart, sessionId, ready, refresh, add, setQty, remove],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart outside CartProvider");
  return ctx;
}
