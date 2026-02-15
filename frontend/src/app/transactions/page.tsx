"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import { useAuth } from "@/hooks/useAuth";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { api } from "@/lib/api";
import type { Account, Transaction } from "@/lib/types";

interface CsvUploadResponse {
  imported: number;
  account_id: string;
}

interface TransactionForm {
  account_id: string;
  amount: string;
  transaction_type: "debit" | "credit";
  category: string;
  description: string;
  date: string;
}

interface FilterState {
  account_id: string;
  category: string;
  date_from: string;
  date_to: string;
}

const DEFAULT_FILTERS: FilterState = {
  account_id: "all",
  category: "",
  date_from: "",
  date_to: "",
};

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

const DEFAULT_FORM: TransactionForm = {
  account_id: "",
  amount: "",
  transaction_type: "debit",
  category: "",
  description: "",
  date: todayIso(),
};

const typeOptions = [
  { value: "debit", label: "Debit (expense)" },
  { value: "credit", label: "Credit (income)" },
];

const fmtMoney = (n: number) =>
  n.toLocaleString("en-CA", { style: "currency", currency: "CAD" });

function formatDate(isoDate: string): string {
  const parsed = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return isoDate;
  }
  return parsed.toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" });
}

export default function TransactionsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<TransactionForm>(DEFAULT_FORM);

  const [showImport, setShowImport] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importAccountId, setImportAccountId] = useState("");
  const [importFile, setImportFile] = useState<File | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [user, authLoading, router]);

  const fetchAccounts = useCallback(async () => {
    const data = await api.get<Account[]>("/accounts");
    setAccounts(data);

    const firstAccountId = data[0]?.id ?? "";
    if (firstAccountId) {
      setForm((prev) => (prev.account_id ? prev : { ...prev, account_id: firstAccountId }));
      setImportAccountId((prev) => prev || firstAccountId);
    }
  }, []);

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.set("limit", "200");

      if (filters.account_id !== "all") params.set("account_id", filters.account_id);
      if (filters.category.trim()) params.set("category", filters.category.trim());
      if (filters.date_from) params.set("date_from", filters.date_from);
      if (filters.date_to) params.set("date_to", filters.date_to);

      const path = `/transactions?${params.toString()}`;
      const data = await api.get<Transaction[]>(path);
      setTransactions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load transactions");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    if (!user) return;
    fetchAccounts().catch((err) =>
      setError(err instanceof Error ? err.message : "Failed to load accounts")
    );
  }, [user, fetchAccounts]);

  useEffect(() => {
    if (!user) return;
    fetchTransactions();
  }, [user, fetchTransactions]);

  const accountNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const account of accounts) {
      map.set(account.id, account.name);
    }
    return map;
  }, [accounts]);

  const summary = useMemo(() => {
    let totalDebit = 0;
    let totalCredit = 0;
    for (const txn of transactions) {
      if (txn.transaction_type === "credit") totalCredit += txn.amount;
      else totalDebit += txn.amount;
    }
    return {
      count: transactions.length,
      credits: totalCredit,
      debits: totalDebit,
      net: totalCredit - totalDebit,
    };
  }, [transactions]);

  const accountOptions = useMemo(
    () => accounts.map((a) => ({ value: a.id, label: `${a.name} (${a.account_type})` })),
    [accounts]
  );

  const handleOpenCreate = () => {
    setEditing(null);
    setForm((prev) => ({
      ...DEFAULT_FORM,
      account_id: prev.account_id || accounts[0]?.id || "",
      date: todayIso(),
    }));
    setShowForm(true);
  };

  const handleOpenEdit = (txn: Transaction) => {
    setEditing(txn);
    setForm({
      account_id: txn.account_id,
      amount: txn.amount.toString(),
      transaction_type: txn.transaction_type as "debit" | "credit",
      category: txn.category || "",
      description: txn.description || "",
      date: txn.date,
    });
    setShowForm(true);
  };

  const handleSubmitTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!form.account_id) {
      setError("Please choose an account before saving.");
      return;
    }

    const parsedAmount = Number.parseFloat(form.amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError("Amount must be a positive number.");
      return;
    }

    const payload = {
      account_id: form.account_id,
      amount: parsedAmount,
      transaction_type: form.transaction_type,
      category: form.category.trim() || null,
      description: form.description.trim() || null,
      date: form.date,
    };

    try {
      setSubmitting(true);
      if (editing) {
        await api.patch<Transaction>(`/transactions/${editing.id}`, payload);
        setSuccess("Transaction updated.");
      } else {
        await api.post<Transaction>("/transactions", payload);
        setSuccess("Transaction added.");
      }
      setShowForm(false);
      setEditing(null);
      setForm((prev) => ({ ...DEFAULT_FORM, account_id: prev.account_id || accounts[0]?.id || "" }));
      await fetchTransactions();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save transaction");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (txn: Transaction) => {
    setError(null);
    setSuccess(null);
    const ok = window.confirm(`Delete transaction "${txn.description || txn.category || txn.id}"?`);
    if (!ok) return;

    try {
      await api.delete(`/transactions/${txn.id}`);
      setSuccess("Transaction deleted.");
      await fetchTransactions();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete transaction");
    }
  };

  const handleUploadCsv = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!importAccountId) {
      setError("Choose an account for imported rows.");
      return;
    }
    if (!importFile) {
      setError("Please choose a CSV file first.");
      return;
    }

    try {
      setImporting(true);
      const result = await api.uploadCsv<CsvUploadResponse>(
        `/transactions/upload-csv?account_id=${encodeURIComponent(importAccountId)}`,
        importFile
      );
      setSuccess(`Imported ${result.imported} transaction(s).`);
      setShowImport(false);
      setImportFile(null);
      await fetchTransactions();
    } catch (err) {
      setError(err instanceof Error ? err.message : "CSV import failed");
    } finally {
      setImporting(false);
    }
  };

  const resetFilters = () => setFilters(DEFAULT_FILTERS);

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
        <Header title="Transactions" onRefresh={fetchTransactions} />
        <main className="space-y-4 p-4 pb-8 lg:p-6">
          <section className="rounded-2xl border border-[var(--fp-border)] bg-[var(--fp-surface)] px-5 py-4 shadow-[var(--fp-shadow)] backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="grid gap-1 text-sm">
                <p className="text-[var(--fp-text-muted)]">
                  {summary.count} transaction(s) in current view
                </p>
                <div className="flex flex-wrap gap-4">
                  <span className="text-[var(--fp-positive)]">Credits: {fmtMoney(summary.credits)}</span>
                  <span className="text-[var(--fp-negative)]">Debits: {fmtMoney(summary.debits)}</span>
                  <span className={clsx(summary.net >= 0 ? "text-[var(--fp-positive)]" : "text-[var(--fp-negative)]")}>
                    Net: {fmtMoney(summary.net)}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="secondary" onClick={() => setShowImport(true)} disabled={accounts.length === 0}>
                  Import CSV
                </Button>
                <Button onClick={handleOpenCreate} disabled={accounts.length === 0}>
                  Add Transaction
                </Button>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-[var(--fp-border)] bg-[var(--fp-surface)] p-5 shadow-[var(--fp-shadow)]">
            <div className="grid gap-3 md:grid-cols-4">
              <Select
                label="Account"
                options={[{ value: "all", label: "All accounts" }, ...accountOptions]}
                value={filters.account_id}
                onChange={(e) => setFilters((prev) => ({ ...prev, account_id: e.target.value }))}
              />
              <Input
                label="Category"
                placeholder="e.g. Groceries"
                value={filters.category}
                onChange={(e) => setFilters((prev) => ({ ...prev, category: e.target.value }))}
              />
              <Input
                label="From"
                type="date"
                value={filters.date_from}
                onChange={(e) => setFilters((prev) => ({ ...prev, date_from: e.target.value }))}
              />
              <Input
                label="To"
                type="date"
                value={filters.date_to}
                onChange={(e) => setFilters((prev) => ({ ...prev, date_to: e.target.value }))}
              />
            </div>
            <div className="mt-3">
              <Button variant="ghost" size="sm" onClick={resetFilters}>
                Reset Filters
              </Button>
            </div>
          </section>

          {error && (
            <div className="rounded-xl border border-[var(--fp-negative)]/35 bg-[var(--fp-negative)]/10 p-3 text-sm text-[var(--fp-negative)]">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-xl border border-[var(--fp-positive)]/35 bg-[var(--fp-positive)]/10 p-3 text-sm text-[var(--fp-positive)]">
              {success}
            </div>
          )}

          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, idx) => (
                <div key={idx} className="h-14 animate-pulse rounded-xl bg-[var(--fp-surface)]" />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="rounded-2xl border border-[var(--fp-border)] bg-[var(--fp-surface)] p-12 text-center shadow-[var(--fp-shadow)]">
              <p className="text-[var(--fp-text-soft)]">
                No transactions found. Add one manually or import a CSV to get started.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-[var(--fp-border)] bg-[var(--fp-surface)] shadow-[var(--fp-shadow)]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--fp-border)] text-left text-xs font-semibold uppercase tracking-[0.2em] text-[var(--fp-text-muted)]">
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Account</th>
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--fp-border)]/50">
                  {transactions.map((txn) => {
                    const isCredit = txn.transaction_type === "credit";
                    return (
                      <tr key={txn.id} className="hover:bg-[var(--fp-surface-elev)]/60">
                        <td className="px-4 py-3 text-[var(--fp-text-muted)]">{formatDate(txn.date)}</td>
                        <td className="px-4 py-3 text-[var(--fp-text-muted)]">
                          {accountNameById.get(txn.account_id) || "Unknown account"}
                        </td>
                        <td className="px-4 py-3 font-medium text-[var(--fp-text)]">
                          {txn.description || "—"}
                        </td>
                        <td className="px-4 py-3 text-[var(--fp-text-muted)]">{txn.category || "—"}</td>
                        <td className="px-4 py-3">
                          <span
                            className={clsx(
                              "rounded-full px-2.5 py-0.5 text-xs font-medium",
                              isCredit
                                ? "bg-[var(--fp-positive)]/15 text-[var(--fp-positive)]"
                                : "bg-[var(--fp-negative)]/15 text-[var(--fp-negative)]"
                            )}
                          >
                            {isCredit ? "Credit" : "Debit"}
                          </span>
                        </td>
                        <td className={clsx("px-4 py-3 text-right font-semibold", isCredit ? "text-[var(--fp-positive)]" : "text-[var(--fp-negative)]")}>
                          {fmtMoney(txn.amount)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="secondary" onClick={() => handleOpenEdit(txn)}>
                              Edit
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleDelete(txn)}>
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>

      <Modal
        open={showForm}
        onClose={() => {
          setShowForm(false);
          setEditing(null);
        }}
        title={editing ? "Edit Transaction" : "Add Transaction"}
      >
        <form onSubmit={handleSubmitTransaction} className="space-y-4">
          <Select
            label="Account"
            options={accountOptions}
            value={form.account_id}
            onChange={(e) => setForm((prev) => ({ ...prev, account_id: e.target.value }))}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Date"
              type="date"
              required
              value={form.date}
              onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
            />
            <Select
              label="Type"
              options={typeOptions}
              value={form.transaction_type}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  transaction_type: e.target.value as "debit" | "credit",
                }))
              }
            />
          </div>
          <Input
            label="Amount"
            type="number"
            step="0.01"
            min="0"
            required
            value={form.amount}
            onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
          />
          <Input
            label="Category"
            placeholder="Groceries, Rent, Salary..."
            value={form.category}
            onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
          />
          <Input
            label="Description"
            placeholder="Optional detail"
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="secondary"
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditing(null);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving..." : editing ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={showImport} onClose={() => setShowImport(false)} title="Import Transactions CSV">
        <form onSubmit={handleUploadCsv} className="space-y-4">
          <Select
            label="Target account"
            options={accountOptions}
            value={importAccountId}
            onChange={(e) => setImportAccountId(e.target.value)}
          />
          <div className="space-y-1">
            <label className="block text-sm font-medium text-[var(--fp-text-muted)]">CSV file</label>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
              className="block w-full rounded-xl border border-[var(--fp-border)] bg-[var(--fp-surface-solid)] px-3 py-2.5 text-sm text-[var(--fp-text)] file:mr-4 file:rounded-full file:border-0 file:bg-[var(--fp-text)] file:px-4 file:py-1.5 file:text-[var(--fp-bg)]"
            />
            <p className="text-xs text-[var(--fp-text-soft)]">
              Required columns: <code>date</code>, <code>description</code>, <code>amount</code>. Optional: <code>category</code>.
            </p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setShowImport(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={importing}>
              {importing ? "Importing..." : "Import CSV"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

