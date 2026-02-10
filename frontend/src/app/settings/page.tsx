"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";

export default function SettingsPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [user, authLoading, router]);

  if (authLoading || !user) return null;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 lg:ml-64">
        <Header title="Settings" />
        <main className="p-4 lg:p-6 max-w-2xl">
          <div className="space-y-6">
            {/* Profile */}
            <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-100">
              <h2 className="text-sm font-medium text-gray-500 mb-4">Profile</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-400">Email</label>
                  <p className="text-sm font-medium text-gray-900">{user.email}</p>
                </div>
                <div>
                  <label className="block text-xs text-gray-400">Name</label>
                  <p className="text-sm font-medium text-gray-900">{user.full_name || "—"}</p>
                </div>
              </div>
            </div>

            {/* Connected Accounts */}
            <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-100">
              <h2 className="text-sm font-medium text-gray-500 mb-4">Connected Accounts</h2>
              <div className="rounded-lg bg-gray-50 p-4 text-center">
                <p className="text-sm text-gray-400">Bank connections coming in Phase 2</p>
                <p className="mt-1 text-xs text-gray-300">Plaid / Flinks integration planned</p>
              </div>
            </div>

            {/* Notifications */}
            <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-100">
              <h2 className="text-sm font-medium text-gray-500 mb-4">Notifications</h2>
              <div className="rounded-lg bg-gray-50 p-4 text-center">
                <p className="text-sm text-gray-400">Notification preferences coming soon</p>
              </div>
            </div>

            {/* Export Data */}
            <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-100">
              <h2 className="text-sm font-medium text-gray-500 mb-4">Export Data</h2>
              <div className="rounded-lg bg-gray-50 p-4 text-center">
                <p className="text-sm text-gray-400">CSV/PDF export coming soon</p>
              </div>
            </div>

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
