"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";

type AuthMode = "login" | "register" | "forgot" | "reset";

interface MessageResponse {
  message: string;
}

export default function LoginPage() {
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { login, register } = useAuth();
  const router = useRouter();

  const isRegister = mode === "register";
  const isForgot = mode === "forgot";
  const isReset = mode === "reset";
  const isLogin = mode === "login";

  useEffect(() => {
    if (searchParams.get("mode") !== "reset") return;
    setMode("reset");
    const token = searchParams.get("token");
    if (token) {
      setResetToken(token);
    }
  }, [searchParams]);

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setError("");
    setInfo("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setSubmitting(true);

    try {
      if (isRegister) {
        await register(email, password, fullName);
        router.replace("/dashboard");
      } else if (isLogin) {
        await login(email, password);
        router.replace("/dashboard");
      } else if (isForgot) {
        const res = await api.post<MessageResponse>("/auth/forgot-password", { email });
        setInfo(res.message);
      } else if (isReset) {
        const res = await api.post<MessageResponse>("/auth/reset-password", {
          token: resetToken,
          new_password: password,
        });
        setInfo(res.message);
        setMode("login");
        setPassword("");
        setResetToken("");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-brand-700 via-brand-800 to-brand-950 items-center justify-center p-12">
        <div className="max-w-md text-white">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-10 w-10 rounded-lg bg-white/20 flex items-center justify-center">
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
              </svg>
            </div>
            <span className="text-2xl font-bold tracking-tight">FinPulse</span>
          </div>
          <h1 className="text-4xl font-bold leading-tight mb-4">
            Take control of your financial future
          </h1>
          <p className="text-lg text-brand-200 leading-relaxed">
            Track expenses, manage credit cards, monitor investments, and achieve your financial
            goals — all in one place.
          </p>
          <div className="mt-10 grid grid-cols-2 gap-6">
            <div className="rounded-lg bg-white/10 p-4">
              <div className="text-2xl font-bold">Smart</div>
              <div className="text-sm text-brand-200 mt-1">AI-powered financial insights</div>
            </div>
            <div className="rounded-lg bg-white/10 p-4">
              <div className="text-2xl font-bold">Secure</div>
              <div className="text-sm text-brand-200 mt-1">Bank-level encryption</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="h-9 w-9 rounded-lg bg-brand-600 flex items-center justify-center">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-gray-900">FinPulse</span>
          </div>

          <h2 className="text-2xl font-bold text-gray-900">
            {isRegister && "Create your account"}
            {isLogin && "Welcome back"}
            {isForgot && "Reset your password"}
            {isReset && "Set a new password"}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {isRegister && "Start your journey to financial clarity"}
            {isLogin && "Sign in to your FinPulse account"}
            {isForgot && "We'll send you a secure reset link"}
            {isReset && "Choose a strong password to finish reset"}
          </p>

          {error && (
            <div className="mt-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {info && (
            <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
              {info}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {isRegister && (
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                  Full name
                </label>
                <input
                  id="fullName"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm"
                  placeholder="John Doe"
                />
              </div>
            )}

            {(isLogin || isRegister || isForgot) && (
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm"
                  placeholder="you@example.com"
                />
              </div>
            )}

            {isReset && (
              <div>
                <label htmlFor="resetToken" className="block text-sm font-medium text-gray-700">
                  Reset token
                </label>
                <input
                  id="resetToken"
                  type="text"
                  required
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm"
                  placeholder="Paste your reset token"
                />
              </div>
            )}

            {(isLogin || isRegister || isReset) && (
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  {isReset ? "New password" : "Password"}
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm"
                  placeholder="••••••••"
                  minLength={8}
                  maxLength={72}
                  pattern={
                    isRegister || isReset
                      ? "(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*()_+\\-=\\[\\]{}|;:'\\\",.<>/?`~]).{8,}"
                      : undefined
                  }
                  title={
                    isRegister || isReset
                      ? "Use at least 8 characters with uppercase, lowercase, number, and special character."
                      : undefined
                  }
                />
                {(isRegister || isReset) && (
                  <p className="mt-1 text-xs text-gray-500">
                    Must be 8-72 chars and include uppercase, lowercase, number, and special character.
                  </p>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  {isRegister && "Creating account..."}
                  {isLogin && "Signing in..."}
                  {isForgot && "Sending reset link..."}
                  {isReset && "Updating password..."}
                </span>
              ) : (
                <>
                  {isRegister && "Create account"}
                  {isLogin && "Sign in"}
                  {isForgot && "Send reset link"}
                  {isReset && "Update password"}
                </>
              )}
            </button>
          </form>

          {isLogin && (
            <div className="mt-6 space-y-2 text-center text-sm text-gray-600">
              <button
                type="button"
                onClick={() => switchMode("forgot")}
                className="font-semibold text-brand-600 hover:text-brand-500 transition-colors"
              >
                Forgot password?
              </button>
              <p>
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  onClick={() => switchMode("register")}
                  className="font-semibold text-brand-600 hover:text-brand-500 transition-colors"
                >
                  Create one
                </button>
              </p>
            </div>
          )}

          {isRegister && (
            <p className="mt-6 text-center text-sm text-gray-600">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => switchMode("login")}
                className="font-semibold text-brand-600 hover:text-brand-500 transition-colors"
              >
                Sign in
              </button>
            </p>
          )}

          {(isForgot || isReset) && (
            <p className="mt-6 text-center text-sm text-gray-600">
              <button
                type="button"
                onClick={() => switchMode("login")}
                className="font-semibold text-brand-600 hover:text-brand-500 transition-colors"
              >
                Back to sign in
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
