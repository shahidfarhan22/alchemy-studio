"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import * as authApi from "./auth-api";
import { setAccessToken } from "./api-client";
import type { UserSummary } from "./auth-api";

type AuthContextValue = {
  user: UserSummary | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // On first load there's no access token in memory (never persisted) --
    // try the refresh cookie to silently restore the session, if any.
    authApi
      .refresh()
      .then((res) => {
        setAccessToken(res.accessToken);
        setUser(res.user);
      })
      .catch(() => {
        setAccessToken(null);
        setUser(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  async function login(email: string, password: string) {
    const res = await authApi.login(email, password);
    setAccessToken(res.accessToken);
    setUser(res.user);
  }

  async function register(email: string, password: string, displayName: string) {
    const res = await authApi.register(email, password, displayName);
    setAccessToken(res.accessToken);
    setUser(res.user);
  }

  async function logout() {
    await authApi.logout().catch(() => {
      // Log out client-side regardless -- an unreachable API shouldn't
      // trap the user in a "still looks logged in" state.
    });
    setAccessToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
