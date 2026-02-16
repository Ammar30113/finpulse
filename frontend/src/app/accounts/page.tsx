"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { api } from "@/lib/api";
import type { Account } from "@/lib/types";
import { clsx } from "clsx";

const accountTypeOptions = [
  { value: "chequing", label: "Chequing" },
  { value: "savings", label: "Savings" },
  { value: "credit", label: "Credit" },
];

const defaultForm = {
  name: "",
  account_type: "chequing",
  institution: "",
  balance: "",
  currency: "CAD",
};

function formatAccountType(accountType: string) {
  const option = accountTypeOptions.find((item) => item.value === accountType);
  return option?.label ?? accountType;
}

export default function AccountsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [deletingAccountId, setDeletingAccountId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [user, authLoading, router]);

  const fetchAccounts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.get<Account[]>("/accounts?limit=200");
      setAccounts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load accounts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) fetchAccounts();
  }, [user, fetchAccounts]);

  const totalTrackedBalance = useMemo(
    () => accounts.reduce((total, account) => total + account.balance, 0),
    [accounts]
  );

  const openCreateForm = () => {
    setEditingAccountId(null);
    setForm(defaultForm);
    setShowForm(true);
  };

  const openEditForm = (account: Account) => {
    setEditingAccountId(account.id);
    setForm({
      name: account.name,
      account_type: account.account_type,
      institution: account.institution ?? "",
      balance: account.balance.toString(),
      currency: account.currency || "CAD",
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingAccountId(null);
    setForm(defaultForm);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const name = form.name.trim();
    const institution = form.institution.trim();
    const currency = form.currency.trim().toUpperCase();
    const parsedBalance = form.balance === "" ? 0 : Number(form.balance);

    if (!name) {
      setError("Account name is required.");
      return;
    }
    if (!Number.isFinite(parsedBalance)) {
      setError("Balance must be a valid number.");
      return;
    }
    if (currency.length < 3) {
      setError("Currency should use a 3-letter code, e.g. CAD.");
      return;
    }

    const payload = {
      name,
      account_type: form.account_type,
      institution: institution || null,
      balance: parsedBalance,
      currency: currency.slice(0, 3),
    };

    try {
      setSubmitting(true);
      if (editingAccountId) {
        await api.patch(`/accounts/${editingAccountId}`, payload);
      } else {
        await api.post("/accounts", payload);
      }
      closeForm();
      await fetchAccounts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save account");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (account: Account) => {
    const confirmed = window.confirm(`Delete "${account.name}"? This cannot be undone.`);
    if (!confirmed) return;

    try {
      setDeletingAccountId(account.id);
      setError(null);
      await api.delete(`/accounts/${account.id}`);
      await fetchAccounts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete account");
    } finally {
      setDeletingAccountId(null);
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
        <Header title="Accounts" onRefresh={fetchAccounts} />
        <main className="p-4 pb-8 lg:p-6">
          <div className="mb-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-[var(--fp-border)] bg-[var(--fp-surface)] px-5 py-4 shadow-[var(--fp-shadow)]">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--fp-text-soft)]">Tracked Accounts</p>
              <p className="mt-1 text-2xl font-semibold text-[var(--fp-text)]">{accounts.length}</p>
            </div>
            <div className="rounded-2xl border border-[var(--fp-border)] bg-[var(--fp-surface)] px-5 py-4 shadow-[var(--fp-shadow)]">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--fp-text-soft)]">Combined Balance</p>
              <p className="mt-1 text-2xl font-semibold text-[var(--fp-text)]">
                ${totalTrackedBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          <div className="mb-4 flex items-center justify-end">
            <Button onClick={openCreateForm}>Add Account</Button>
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-[var(--fp-negative)]/35 bg-[var(--fp-negative)]/10 p-3 text-sm text-[var(--fp-negative)]">
              {error}
            </div>
          )}

          {loading ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-40 animate-pulse rounded-2xl bg-[var(--fp-surface)]" />
              ))}
            </div>
          ) : accounts.length === 0 ? (
            <div className="rounded-2xl border border-[var(--fp-border)] bg-[var(--fp-surface)] p-12 text-center shadow-[var(--fp-shadow)]">
              <p className="text-[var(--fp-text-soft)]">No accounts yet. Add one to start tracking balances.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {accounts.map((account) => (
                <div key={account.id} className="rounded-2xl border border-[var(--fp-border)] bg-[var(--fp-surface)] p-5 shadow-[var(--fp-shadow)]">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-[var(--fp-text)]">{account.name}</p>
                      <p className="text-sm text-[var(--fp-text-muted)]">{account.institution || "Independent account"}</p>
                    </div>
                    <span
                      className={clsx(
                        "rounded-full border px-2.5 py-0.5 text-xs font-medium",
                        account.account_type === "chequing" && "border-[var(--fp-border)] text-[var(--fp-text-muted)]",
                        account.account_type === "savings" && "border-[var(--fp-positive)]/35 text-[var(--fp-positive)]",
                        account.account_type === "credit" && "border-[var(--fp-warning)]/35 text-[var(--fp-warning)]"
                      )}
                    >
                      {formatAccountType(account.account_type)}
                    </span>
                  </div>

                  <p className="mb-3 text-2xl font-semibold text-[var(--fp-text)]">
                    {account.currency} {account.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className="mb-4 text-xs text-[var(--fp-text-soft)]">
                    Added {new Date(account.created_at).toLocaleDateString()}
                  </p>

                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => openEditForm(account)}>
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={deletingAccountId === account.id}
                      onClick={() => void handleDelete(account)}
                    >
                      {deletingAccountId === account.id ? "Deleting..." : "Delete"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Modal
            open={showForm}
            onClose={closeForm}
            title={editingAccountId ? "Edit Account" : "Add Account"}
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Account Name"
                required
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              />
              <Select
                label="Account Type"
                options={accountTypeOptions}
                value={form.account_type}
                onChange={(e) => setForm((prev) => ({ ...prev, account_type: e.target.value }))}
              />
              <Input
                label="Institution"
                value={form.institution}
                onChange={(e) => setForm((prev) => ({ ...prev, institution: e.target.value }))}
                placeholder="e.g. RBC"
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Balance"
                  type="number"
                  step="0.01"
                  required
                  value={form.balance}
                  onChange={(e) => setForm((prev) => ({ ...prev, balance: e.target.value }))}
                />
                <Input
                  label="Currency"
                  required
                  maxLength={3}
                  value={form.currency}
                  onChange={(e) => setForm((prev) => ({ ...prev, currency: e.target.value }))}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" onClick={closeForm}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Saving..." : "Save"}
                </Button>
              </div>
            </form>
          </Modal>
        </main>
      </div>
    </div>
  );
}
