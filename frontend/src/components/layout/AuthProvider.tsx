"use client";

import { useCallback, useEffect, useState } from "react";
import { AuthContext, type AuthUser, type RegisterResult } from "@/lib/auth";
import { api } from "@/lib/api";

interface LoginResponse {
  access_token: string;
  user: AuthUser;
}

interface RegisterResponse {
  access_token: string | null;
  user: AuthUser | null;
  requires_email_confirmation: boolean;
  message?: string;
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

  const register = useCallback(async (email: string, password: string, fullName: string): Promise<RegisterResult> => {
    const res = await api.post<RegisterResponse>("/auth/register", {
      email,
      password,
      full_name: fullName,
    });

    if (res.access_token && res.user) {
      api.setToken(res.access_token);
      localStorage.setItem("user", JSON.stringify(res.user));
      setUser(res.user);
      return { requires_email_confirmation: false };
    }

    return {
      requires_email_confirmation: !!res.requires_email_confirmation,
      message: res.message,
    };
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
