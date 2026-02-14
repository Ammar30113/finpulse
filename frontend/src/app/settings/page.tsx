"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";

export default function SettingsPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [user, authLoading, router]);

  if (authLoading || !user) return null;

  return (
    <div className="flex min-h-screen text-[var(--fp-text)]">
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            "radial-gradient(circle at 10% 14%, rgba(255,255,255,0.12), transparent 28%), radial-gradient(circle at 82% 8%, rgba(255,255,255,0.08), transparent 26%), linear-gradient(156deg, var(--fp-bg) 0%, var(--fp-bg-soft) 100%)",
        }}
      />
      <Sidebar />
      <div className="relative z-10 flex-1 lg:ml-64">
        <Header title="Settings" />
        <main className="max-w-2xl p-4 pb-8 lg:p-6">
          <div className="space-y-6">
            {/* Profile */}
            <Card>
              <CardTitle>Profile</CardTitle>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-[var(--fp-text-soft)]">Email</label>
                  <p className="text-sm font-medium text-[var(--fp-text)]">{user.email}</p>
                </div>
                <div>
                  <label className="block text-xs text-[var(--fp-text-soft)]">Name</label>
                  <p className="text-sm font-medium text-[var(--fp-text)]">{user.full_name || "—"}</p>
                </div>
              </div>
            </Card>

            {/* Connected Accounts */}
            <Card>
              <CardTitle>Connected Accounts</CardTitle>
              <div className="rounded-xl border border-[var(--fp-border)] bg-[var(--fp-surface-elev)] p-4 text-center">
                <p className="text-sm text-[var(--fp-text-muted)]">Bank connections coming in Phase 2</p>
                <p className="mt-1 text-xs text-[var(--fp-text-soft)]">Plaid / Flinks integration planned</p>
              </div>
            </Card>

            {/* Notifications */}
            <Card>
              <CardTitle>Notifications</CardTitle>
              <div className="rounded-xl border border-[var(--fp-border)] bg-[var(--fp-surface-elev)] p-4 text-center">
                <p className="text-sm text-[var(--fp-text-muted)]">Notification preferences coming soon</p>
              </div>
            </Card>

            {/* Export Data */}
            <Card>
              <CardTitle>Export Data</CardTitle>
              <div className="rounded-xl border border-[var(--fp-border)] bg-[var(--fp-surface-elev)] p-4 text-center">
                <p className="text-sm text-[var(--fp-text-muted)]">CSV/PDF export coming soon</p>
              </div>
            </Card>

            {/* Logout */}
            <div className="pt-4">
              <Button variant="danger" onClick={logout}>Log Out</Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
