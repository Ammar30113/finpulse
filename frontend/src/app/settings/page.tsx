"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { Card, CardTitle } from "@/components/ui/Card";
import { api } from "@/lib/api";
import type { NotificationPreferences, NotificationTestResponse } from "@/lib/types";

const weekdayOptions = [
  { value: "0", label: "Monday" },
  { value: "1", label: "Tuesday" },
  { value: "2", label: "Wednesday" },
  { value: "3", label: "Thursday" },
  { value: "4", label: "Friday" },
  { value: "5", label: "Saturday" },
  { value: "6", label: "Sunday" },
];

const hourOptions = Array.from({ length: 24 }, (_, hour) => ({
  value: String(hour),
  label: `${String(hour).padStart(2, "0")}:00`,
}));

export default function SettingsPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const [prefsLoading, setPrefsLoading] = useState(true);
  const [prefsSaving, setPrefsSaving] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [user, authLoading, router]);

  const fetchNotificationPreferences = useCallback(async () => {
    try {
      setPrefsLoading(true);
      const data = await api.get<NotificationPreferences>("/notifications/preferences");
      setPrefs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load notification preferences");
    } finally {
      setPrefsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchNotificationPreferences();
  }, [user, fetchNotificationPreferences]);

  const saveNotificationPreferences = async () => {
    if (!prefs) return;

    setError(null);
    setNotice(null);
    try {
      setPrefsSaving(true);
      const updated = await api.patch<NotificationPreferences>(
        "/notifications/preferences",
        prefs
      );
      setPrefs(updated);
      setNotice("Notification preferences saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save notification preferences");
    } finally {
      setPrefsSaving(false);
    }
  };

  const sendTestNotification = async () => {
    setError(null);
    setNotice(null);
    try {
      setSendingTest(true);
      const result = await api.post<NotificationTestResponse>("/notifications/test");
      setNotice(result.detail);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send test notification");
    } finally {
      setSendingTest(false);
    }
  };

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
            {error && (
              <div className="rounded-xl border border-[var(--fp-negative)]/35 bg-[var(--fp-negative)]/10 p-3 text-sm text-[var(--fp-negative)]">
                {error}
              </div>
            )}
            {notice && (
              <div className="rounded-xl border border-[var(--fp-positive)]/35 bg-[var(--fp-positive)]/10 p-3 text-sm text-[var(--fp-positive)]">
                {notice}
              </div>
            )}

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
              {prefsLoading || !prefs ? (
                <div className="space-y-2">
                  <div className="h-4 w-2/3 animate-pulse rounded bg-[var(--fp-surface-elev)]" />
                  <div className="h-4 w-1/2 animate-pulse rounded bg-[var(--fp-surface-elev)]" />
                </div>
              ) : (
                <div className="space-y-4">
                  <label className="flex items-center justify-between rounded-xl border border-[var(--fp-border)] bg-[var(--fp-surface-elev)] px-4 py-3 text-sm">
                    <span className="font-medium text-[var(--fp-text)]">Enable email notifications</span>
                    <input
                      type="checkbox"
                      checked={prefs.email_notifications_enabled}
                      onChange={(e) =>
                        setPrefs((prev) =>
                          prev
                            ? {
                                ...prev,
                                email_notifications_enabled: e.target.checked,
                                weekly_summary_enabled: e.target.checked
                                  ? prev.weekly_summary_enabled
                                  : false,
                              }
                            : prev
                        )
                      }
                    />
                  </label>

                  <label className="flex items-center justify-between rounded-xl border border-[var(--fp-border)] bg-[var(--fp-surface-elev)] px-4 py-3 text-sm">
                    <span className="font-medium text-[var(--fp-text)]">Weekly summary email</span>
                    <input
                      type="checkbox"
                      checked={prefs.weekly_summary_enabled}
                      disabled={!prefs.email_notifications_enabled}
                      onChange={(e) =>
                        setPrefs((prev) =>
                          prev ? { ...prev, weekly_summary_enabled: e.target.checked } : prev
                        )
                      }
                    />
                  </label>

                  <div className="grid gap-3 md:grid-cols-3">
                    <Select
                      label="Day"
                      options={weekdayOptions}
                      value={String(prefs.weekly_summary_day)}
                      disabled={!prefs.email_notifications_enabled || !prefs.weekly_summary_enabled}
                      onChange={(e) =>
                        setPrefs((prev) =>
                          prev ? { ...prev, weekly_summary_day: Number(e.target.value) } : prev
                        )
                      }
                    />
                    <Select
                      label="Hour"
                      options={hourOptions}
                      value={String(prefs.weekly_summary_hour)}
                      disabled={!prefs.email_notifications_enabled || !prefs.weekly_summary_enabled}
                      onChange={(e) =>
                        setPrefs((prev) =>
                          prev ? { ...prev, weekly_summary_hour: Number(e.target.value) } : prev
                        )
                      }
                    />
                    <Input
                      label="Timezone"
                      value={prefs.notification_timezone}
                      disabled={!prefs.email_notifications_enabled || !prefs.weekly_summary_enabled}
                      onChange={(e) =>
                        setPrefs((prev) =>
                          prev
                            ? { ...prev, notification_timezone: e.target.value || "America/Toronto" }
                            : prev
                        )
                      }
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button onClick={saveNotificationPreferences} disabled={prefsSaving}>
                      {prefsSaving ? "Saving..." : "Save Preferences"}
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={sendTestNotification}
                      disabled={sendingTest || !prefs.email_notifications_enabled}
                    >
                      {sendingTest ? "Sending..." : "Send Test Email"}
                    </Button>
                  </div>
                </div>
              )}
            </Card>

            {/* Export Data */}
            <Card>
              <CardTitle>Export Data</CardTitle>
              <div className="rounded-xl border border-[var(--fp-border)] bg-[var(--fp-surface-elev)] p-4">
                <p className="text-sm text-[var(--fp-text-muted)]">
                  Export filtered transactions as CSV from the Transactions page.
                </p>
                <div className="mt-3">
                  <Button variant="secondary" onClick={() => router.push("/transactions")}>
                    Go to Transactions Export
                  </Button>
                </div>
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
