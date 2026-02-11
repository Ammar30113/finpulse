"use client";

import { useCallback, useEffect, useState } from "react";
import { AuthContext, type AuthUser } from "@/lib/auth";
import { api } from "@/lib/api";

interface LoginResponse {
  access_token: string;
  user: AuthUser;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = api.getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get<AuthUser>("/auth/me")
      .then((u) => {
        setUser(u);
        localStorage.setItem("user", JSON.stringify(u));
      })
      .catch((err) => {
        // On network errors, fall back to cached user so the app stays usable offline
        if (err instanceof TypeError || err.message === "Failed to fetch") {
          const cached = localStorage.getItem("user");
          if (cached) {
            try {
              setUser(JSON.parse(cached));
              return;
            } catch {
              // corrupted cache, fall through to clear
            }
          }
        }
        // Auth failure or no cache — clear session
        api.setToken(null);
        localStorage.removeItem("user");
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post<LoginResponse>("/auth/login", { email, password });
    api.setToken(res.access_token);
    localStorage.setItem("user", JSON.stringify(res.user));
    setUser(res.user);
  }, []);

  const register = useCallback(async (email: string, password: string, fullName: string) => {
    const res = await api.post<LoginResponse>("/auth/register", {
      email,
      password,
      full_name: fullName,
    });
    api.setToken(res.access_token);
    localStorage.setItem("user", JSON.stringify(res.user));
    setUser(res.user);
  }, []);

  const logout = useCallback(() => {
    api.setToken(null);
    localStorage.removeItem("user");
    setUser(null);
    window.location.href = "/login";
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
