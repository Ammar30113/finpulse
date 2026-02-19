"use client";

import { createContext } from "react";

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
}

export interface RegisterResult {
  requires_email_confirmation: boolean;
  message?: string;
}

export interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<RegisterResult>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  register: async () => ({ requires_email_confirmation: false }),
  logout: () => {},
});
