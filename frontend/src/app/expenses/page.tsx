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
      const data = await api.get<Expense[]>("/expenses");
      setExpenses(data);
    } catch {
      // handled by api client
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
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 lg:ml-64">
        <Header title="Expenses" />
        <main className="p-4 lg:p-6">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-gray-500">{expenses.length} expense(s)</p>
            <Button onClick={() => setShowForm(true)}>Add Expense</Button>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-lg bg-white shadow-sm" />
              ))}
            </div>
          ) : expenses.length === 0 ? (
            <div className="rounded-xl bg-white p-12 text-center shadow-sm">
              <p className="text-gray-400">No expenses yet. Add your first expense to start tracking.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                    <th className="px-4 py-3">Recurring</th>
                    <th className="px-4 py-3">Next Due</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {expenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700">
                          {exp.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{exp.description || "—"}</td>
                      <td className="px-4 py-3 text-right font-medium">${exp.amount.toLocaleString()}</td>
                      <td className="px-4 py-3 text-gray-500">
                        {exp.is_recurring ? exp.frequency : "One-time"}
                      </td>
                      <td className="px-4 py-3 text-gray-500">{exp.next_due_date || "—"}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => handleDelete(exp.id)} className="text-red-500 hover:text-red-700 text-xs">
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
                <input type="checkbox" checked={form.is_recurring} onChange={(e) => setForm({ ...form, is_recurring: e.target.checked })} className="rounded border-gray-300 text-brand-600 focus:ring-brand-500" />
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
