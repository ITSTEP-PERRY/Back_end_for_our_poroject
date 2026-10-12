import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { authApi } from "../api";
import { getToken, setToken } from "../api/client";
import type { AuthUser } from "../api/types";

type AuthState = {
  user: AuthUser | null;
  loading: boolean;
  login: (login: string, password: string) => Promise<void>;
  /** Step 1 only — no JWT until verify-email + complete-registration + login. */
  register: (data: {
    email: string;
    password: string;
    confirmPassword: string;
  }) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isAdmin: boolean;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    authApi
      .me()
      .then(setUser)
      .catch(() => {
        setToken(null);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const onExpired = () => {
      setUser((prev) => {
        if (prev?.avatar?.startsWith("blob:")) URL.revokeObjectURL(prev.avatar);
        return null;
      });
      setToken(null);
    };
    window.addEventListener("perry:auth-expired", onExpired);
    return () => window.removeEventListener("perry:auth-expired", onExpired);
  }, []);

  const login = useCallback(async (loginName: string, password: string) => {
    const res = await authApi.login(loginName, password);
    setToken(res.token);
    // Prefer /me so protected avatarUrl (/api/account/avatar) becomes a blob: URL.
    try {
      setUser(await authApi.me());
    } catch {
      setUser(res.user);
    }
  }, []);

  const register = useCallback(
    async (data: { email: string; password: string; confirmPassword: string }) => {
      await authApi.register(data);
    },
    [],
  );

  const logout = useCallback(() => {
    setUser((prev) => {
      if (prev?.avatar?.startsWith("blob:")) URL.revokeObjectURL(prev.avatar);
      return null;
    });
    setToken(null);
    localStorage.removeItem("perry_local_admin");
    authApi.clearAvatarCache();
  }, []);

  const refreshUser = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      return;
    }
    const me = await authApi.me();
    setUser((prev) => {
      if (prev?.avatar?.startsWith("blob:") && prev.avatar !== me.avatar) {
        URL.revokeObjectURL(prev.avatar);
      }
      return me;
    });
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      register,
      logout,
      refreshUser,
      isAdmin: user?.roleId === "Admin",
    }),
    [user, loading, login, register, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth outside AuthProvider");
  return ctx;
}
