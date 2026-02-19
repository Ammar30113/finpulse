"use client";

import clsx from "clsx";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { useTheme } from "@/components/layout/ThemeProvider";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

type AuthMode = "login" | "register" | "forgot" | "reset";

interface MessageResponse {
  message: string;
}

const PASSWORD_PATTERN =
  "(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*()_+\\-=\\[\\]{}|;:'\\\",.<>/?`~]).{8,}";

export default function LoginPage() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { login, register } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();

  const isRegister = mode === "register";
  const isForgot = mode === "forgot";
  const isReset = mode === "reset";
  const isLogin = mode === "login";

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const queryMode = params.get("mode");
    const queryType = params.get("type");
    const hashType = hashParams.get("type");

    const resetLikeMode =
      queryMode === "reset" || queryType === "recovery" || hashType === "recovery";

    if (!resetLikeMode) return;

    setMode("reset");
    const token =
      hashParams.get("access_token") ||
      params.get("access_token") ||
      params.get("token") ||
      "";
    if (token) {
      setResetToken(token);
    }
  }, []);

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
        const result = await register(email, password, fullName);
        if (result.requires_email_confirmation) {
          setInfo(result.message || "Check your email to confirm your account before signing in.");
          setMode("login");
          setPassword("");
          return;
        }
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
    <div
      className="relative min-h-screen overflow-hidden text-[var(--fp-text)]"
      style={{ fontFamily: '"Avenir Next", "Segoe UI", "Helvetica Neue", sans-serif' }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 10% 14%, rgba(255,255,255,0.1), transparent 28%), radial-gradient(circle at 82% 8%, rgba(255,255,255,0.06), transparent 26%), linear-gradient(156deg, var(--fp-bg) 0%, var(--fp-bg-soft) 100%)",
        }}
      />

      <div className="relative z-10 flex min-h-screen">
        <aside className="hidden w-[44%] border-r border-[var(--fp-border)] bg-[var(--fp-surface)]/65 px-10 py-10 backdrop-blur xl:flex xl:flex-col xl:justify-between">
          <div>
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--fp-border)] bg-[var(--fp-surface-solid)]">
                <span className="text-sm font-semibold tracking-[0.15em]">FP</span>
              </div>
              <div>
                <p
                  className="text-2xl leading-none tracking-tight"
                  style={{ fontFamily: '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", Palatino, serif' }}
                >
                  FinPulse
                </p>
                <p className="mt-1 text-xs uppercase tracking-[0.2em] text-[var(--fp-text-soft)]">
                  Weekly Financial Command Center
                </p>
              </div>
            </div>

            <h1
              className="max-w-md text-4xl leading-tight"
              style={{ fontFamily: '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", Palatino, serif' }}
            >
              Keep your financial operating rhythm every week.
            </h1>
            <p className="mt-4 max-w-md text-base leading-relaxed text-[var(--fp-text-muted)]">
              Track transactions, monitor utilization, and complete one high-impact weekly action.
            </p>
          </div>

          <div className="space-y-3">
            <div className="rounded-2xl border border-[var(--fp-border)] bg-[var(--fp-surface-solid)]/70 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--fp-text-soft)]">Weekly Promise</p>
              <p className="mt-2 text-sm text-[var(--fp-text-muted)]">
                Full financial picture, one prioritized action, measurable progress.
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--fp-border)] bg-[var(--fp-surface-solid)]/70 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--fp-text-soft)]">Built for Clarity</p>
              <p className="mt-2 text-sm text-[var(--fp-text-muted)]">
                No noisy dashboards. Focus on what moves net worth and resilience.
              </p>
            </div>
          </div>
        </aside>

        <main className="relative flex flex-1 items-center justify-center p-5 sm:p-8 lg:p-10">
          <div className="absolute right-5 top-5 sm:right-8 sm:top-8">
            <button
              onClick={toggleTheme}
              className="flex items-center gap-2 rounded-full border border-[var(--fp-border)] bg-[var(--fp-surface)]/90 px-3 py-2 text-xs font-medium text-[var(--fp-text-muted)] transition-colors hover:bg-[var(--fp-surface-elev)] hover:text-[var(--fp-text)]"
              title="Switch theme"
              type="button"
            >
              <span>{theme === "dark" ? "Dark" : "Light"}</span>
              <span
                className={clsx(
                  "relative h-4 w-8 rounded-full transition-colors",
                  theme === "dark" ? "bg-white/30" : "bg-black/20"
                )}
              >
                <span
                  className={clsx(
                    "absolute top-0.5 h-3 w-3 rounded-full transition-all",
                    theme === "dark" ? "left-4 bg-white" : "left-0.5 bg-black"
                  )}
                />
              </span>
            </button>
          </div>

          <div className="w-full max-w-lg">
            <Card className="rounded-3xl p-7 sm:p-8">
              <div className="xl:hidden">
                <p
                  className="text-2xl tracking-tight"
                  style={{ fontFamily: '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", Palatino, serif' }}
                >
                  FinPulse
                </p>
                <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[var(--fp-text-soft)]">
                  Weekly Financial Command Center
                </p>
              </div>

              <h2
                className="mt-6 text-3xl leading-tight"
                style={{ fontFamily: '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", Palatino, serif' }}
              >
                {isRegister && "Create your account"}
                {isLogin && "Welcome back"}
                {isForgot && "Reset your password"}
                {isReset && "Set a new password"}
              </h2>
              <p className="mt-2 text-sm text-[var(--fp-text-muted)]">
                {isRegister && "Start your journey to financial clarity"}
                {isLogin && "Sign in to continue your weekly review"}
                {isForgot && "Enter your email to receive a secure reset link (when email is configured)"}
                {isReset && "Create a strong password to finish reset"}
              </p>

              {error && (
                <div className="mt-5 rounded-xl border border-[var(--fp-negative)]/35 bg-[var(--fp-negative)]/10 p-3 text-sm text-[var(--fp-negative)]">
                  {error}
                </div>
              )}
              {info && (
                <div className="mt-5 rounded-xl border border-[var(--fp-positive)]/35 bg-[var(--fp-positive)]/10 p-3 text-sm text-[var(--fp-positive)]">
                  {info}
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                {isRegister && (
                  <Input
                    label="Full name"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="John Doe"
                    autoComplete="name"
                  />
                )}

                {(isLogin || isRegister || isForgot) && (
                  <Input
                    label="Email address"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                )}

                {isReset && (
                  <Input
                    label="Reset token"
                    type="text"
                    required
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                    placeholder="Paste your reset token"
                    autoComplete="off"
                  />
                )}

                {(isLogin || isRegister || isReset) && (
                  <div>
                    <Input
                      label={isReset ? "New password" : "Password"}
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      minLength={8}
                      maxLength={72}
                      pattern={isRegister || isReset ? PASSWORD_PATTERN : undefined}
                      title={
                        isRegister || isReset
                          ? "Use at least 8 characters with uppercase, lowercase, number, and special character."
                          : undefined
                      }
                      autoComplete={isReset ? "new-password" : isRegister ? "new-password" : "current-password"}
                    />
                    {(isRegister || isReset) && (
                      <p className="mt-1 text-xs text-[var(--fp-text-soft)]">
                        Use 8-72 characters with uppercase, lowercase, number, and special character.
                      </p>
                    )}
                  </div>
                )}

                <Button type="submit" disabled={submitting} size="lg" className="mt-1 w-full justify-center rounded-xl">
                  {submitting && (
                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  )}
                  {isRegister && (submitting ? "Creating account..." : "Create account")}
                  {isLogin && (submitting ? "Signing in..." : "Sign in")}
                  {isForgot && (submitting ? "Sending reset link..." : "Send reset link")}
                  {isReset && (submitting ? "Updating password..." : "Update password")}
                </Button>
              </form>

              {isLogin && (
                <div className="mt-6 space-y-2 text-center text-sm text-[var(--fp-text-muted)]">
                  <button
                    type="button"
                    onClick={() => switchMode("forgot")}
                    className="font-medium text-[var(--fp-text)] underline underline-offset-4 transition-colors hover:text-[var(--fp-text-muted)]"
                  >
                    Forgot password?
                  </button>
                  <p>
                    Don&apos;t have an account?{" "}
                    <button
                      type="button"
                      onClick={() => switchMode("register")}
                      className="font-medium text-[var(--fp-text)] underline underline-offset-4 transition-colors hover:text-[var(--fp-text-muted)]"
                    >
                      Create one
                    </button>
                  </p>
                </div>
              )}

              {isRegister && (
                <p className="mt-6 text-center text-sm text-[var(--fp-text-muted)]">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => switchMode("login")}
                    className="font-medium text-[var(--fp-text)] underline underline-offset-4 transition-colors hover:text-[var(--fp-text-muted)]"
                  >
                    Sign in
                  </button>
                </p>
              )}

              {(isForgot || isReset) && (
                <p className="mt-6 text-center text-sm text-[var(--fp-text-muted)]">
                  <button
                    type="button"
                    onClick={() => switchMode("login")}
                    className="font-medium text-[var(--fp-text)] underline underline-offset-4 transition-colors hover:text-[var(--fp-text-muted)]"
                  >
                    Back to sign in
                  </button>
                </p>
              )}
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
