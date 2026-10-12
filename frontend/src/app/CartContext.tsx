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
import { getCartSessionId } from "../api/client";
import type { CartResponse } from "../api/types";
import { useAuth } from "./AuthContext";

type CartState = {
  cart: CartResponse | null;
  count: number;
  refresh: () => Promise<void>;
  add: (productId: string, qty?: number) => Promise<void>;
  setQty: (productId: string, qty: number) => Promise<void>;
  remove: (productId: string) => Promise<void>;
  sessionId: string;
};

const CartContext = createContext<CartState | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const sessionId = getCartSessionId();
  const userId = user?.id ?? null;
  const [cart, setCart] = useState<CartResponse | null>(null);
  const mergedForUser = useRef<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const data = await cartApi.get(userId, sessionId);
      setCart(data);
    } catch {
      setCart({ itemsCount: 0, totalAmount: 0, items: [] });
    }
  }, [userId, sessionId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (userId && mergedForUser.current !== userId) {
        try {
          await cartApi.merge(sessionId);
          mergedForUser.current = userId;
        } catch {
          // merge best-effort
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
      refresh,
      add,
      setQty,
      remove,
      sessionId,
    }),
    [cart, refresh, add, setQty, remove, sessionId],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart outside CartProvider");
  return ctx;
}
