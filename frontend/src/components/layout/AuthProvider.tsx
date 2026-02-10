"use client";

import { useCallback, useEffect, useState } from "react";
import { AuthContext, type AuthUser } from "@/lib/auth";
import { api } from "@/lib/api";

interface TokenPayload {
  sub: string;
  exp: number;
}

function decodeToken(token: string): TokenPayload | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = api.getToken();
    if (token) {
      const payload = decodeToken(token);
      if (payload && payload.exp * 1000 > Date.now()) {
        const stored = localStorage.getItem("user");
        if (stored) {
          setUser(JSON.parse(stored));
        }
      } else {
        api.setToken(null);
        localStorage.removeItem("user");
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post<{ access_token: string }>("/auth/login", { email, password });
    api.setToken(res.access_token);
    const userInfo: AuthUser = { id: decodeToken(res.access_token)?.sub || "", email, full_name: "" };
    localStorage.setItem("user", JSON.stringify(userInfo));
    setUser(userInfo);
  }, []);

  const register = useCallback(async (email: string, password: string, fullName: string) => {
    const res = await api.post<{ access_token: string }>("/auth/register", {
      email,
      password,
      full_name: fullName,
    });
    api.setToken(res.access_token);
    const userInfo: AuthUser = { id: decodeToken(res.access_token)?.sub || "", email, full_name: fullName };
    localStorage.setItem("user", JSON.stringify(userInfo));
    setUser(userInfo);
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
