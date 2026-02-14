"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { api } from "@/lib/api";
import type { Expense } from "@/lib/types";

const categories = [
  { value: "Housing", label: "Housing" },
  { value: "Food", label: "Food" },
  { value: "Transport", label: "Transport" },
  { value: "Utilities", label: "Utilities" },
  { value: "Insurance", label: "Insurance" },
  { value: "Entertainment", label: "Entertainment" },
  { value: "Health", label: "Health" },
  { value: "Education", label: "Education" },
  { value: "Other", label: "Other" },
];

const frequencies = [
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Biweekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

export default function ExpensesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    category: "Housing",
    description: "",
    amount: "",
    is_recurring: false,
    frequency: "monthly",
    next_due_date: "",
  });

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [user, authLoading, router]);

  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.get<Expense[]>("/expenses");
      setExpenses(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load expenses");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) fetchExpenses();
  }, [user, fetchExpenses]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post("/expenses", {
      category: form.category,
      description: form.description || null,
      amount: parseFloat(form.amount),
      is_recurring: form.is_recurring,
      frequency: form.is_recurring ? form.frequency : null,
      next_due_date: form.is_recurring && form.next_due_date ? form.next_due_date : null,
    });
    setShowForm(false);
    setForm({ category: "Housing", description: "", amount: "", is_recurring: false, frequency: "monthly", next_due_date: "" });
    fetchExpenses();
  };

  const handleDelete = async (id: string) => {
    await api.delete(`/expenses/${id}`);
    fetchExpenses();
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
        <Header title="Expenses" />
        <main className="p-4 pb-8 lg:p-6">
          <div className="mb-4 flex items-center justify-between rounded-2xl border border-[var(--fp-border)] bg-[var(--fp-surface)] px-5 py-4 shadow-[var(--fp-shadow)] backdrop-blur">
            <p className="text-sm text-[var(--fp-text-muted)]">{expenses.length} expense(s)</p>
            <Button onClick={() => setShowForm(true)}>Add Expense</Button>
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-[var(--fp-negative)]/35 bg-[var(--fp-negative)]/10 p-3 text-sm text-[var(--fp-negative)]">
              {error}
            </div>
          )}

          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-xl bg-[var(--fp-surface)]" />
              ))}
            </div>
          ) : expenses.length === 0 ? (
            <div className="rounded-2xl border border-[var(--fp-border)] bg-[var(--fp-surface)] p-12 text-center shadow-[var(--fp-shadow)]">
              <p className="text-[var(--fp-text-soft)]">No expenses yet. Add your first expense to start tracking.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-[var(--fp-border)] bg-[var(--fp-surface)] shadow-[var(--fp-shadow)]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--fp-border)] text-left text-xs font-semibold uppercase tracking-[0.2em] text-[var(--fp-text-muted)]">
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                    <th className="px-4 py-3">Recurring</th>
                    <th className="px-4 py-3">Next Due</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--fp-border)]/50">
                  {expenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-[var(--fp-surface-elev)]/60">
                      <td className="px-4 py-3">
                        <span className="rounded-full border border-[var(--fp-border)] bg-[var(--fp-surface-elev)] px-2.5 py-0.5 text-xs font-medium text-[var(--fp-text-muted)]">
                          {exp.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[var(--fp-text-muted)]">{exp.description || "—"}</td>
                      <td className="px-4 py-3 text-right font-semibold text-[var(--fp-text)]">${exp.amount.toLocaleString()}</td>
                      <td className="px-4 py-3 text-[var(--fp-text-muted)]">
                        {exp.is_recurring ? exp.frequency : "One-time"}
                      </td>
                      <td className="px-4 py-3 text-[var(--fp-text-muted)]">{exp.next_due_date || "—"}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleDelete(exp.id)}
                          className="text-xs font-medium text-[var(--fp-negative)] transition-colors hover:opacity-80"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <Modal open={showForm} onClose={() => setShowForm(false)} title="Add Expense">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Select label="Category" options={categories} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
              <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              <Input label="Amount" type="number" step="0.01" required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.is_recurring}
                  onChange={(e) => setForm({ ...form, is_recurring: e.target.checked })}
                  className="rounded border-[var(--fp-border)] bg-[var(--fp-surface-solid)] text-[var(--fp-text)] focus:ring-[var(--fp-text)]"
                />
                Recurring expense
              </label>
              {form.is_recurring && (
                <>
                  <Select label="Frequency" options={frequencies} value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })} />
                  <Input label="Next Due Date" type="date" value={form.next_due_date} onChange={(e) => setForm({ ...form, next_due_date: e.target.value })} />
                </>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="secondary" type="button" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button type="submit">Save</Button>
              </div>
            </form>
          </Modal>
        </main>
      </div>
    </div>
  );
}
