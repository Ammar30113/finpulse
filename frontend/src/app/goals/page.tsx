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
import type { Goal } from "@/lib/types";
import { clsx } from "clsx";

const goalTypes = [
  { value: "save", label: "Save" },
  { value: "invest", label: "Invest" },
  { value: "reduce_utilization", label: "Reduce Utilization" },
  { value: "pay_off_debt", label: "Pay Off Debt" },
  { value: "custom", label: "Custom" },
];

const typeBadgeColors: Record<string, string> = {
  save: "bg-[var(--fp-positive)]/15 text-[var(--fp-positive)]",
  invest: "bg-[var(--fp-text)]/10 text-[var(--fp-text)]",
  reduce_utilization: "bg-[var(--fp-warning)]/15 text-[var(--fp-warning)]",
  pay_off_debt: "bg-[var(--fp-negative)]/15 text-[var(--fp-negative)]",
  custom: "bg-[var(--fp-surface-elev)] text-[var(--fp-text-muted)]",
};

export default function GoalsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [form, setForm] = useState({
    title: "",
    goal_type: "save",
    target_amount: "",
    current_amount: "",
    target_date: "",
  });

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [user, authLoading, router]);

  const fetchGoals = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.get<Goal[]>("/goals");
      setGoals(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load goals");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) fetchGoals();
  }, [user, fetchGoals]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post("/goals", {
      title: form.title,
      goal_type: form.goal_type,
      target_amount: parseFloat(form.target_amount),
      current_amount: parseFloat(form.current_amount || "0"),
      target_date: form.target_date || null,
    });
    setShowForm(false);
    setForm({ title: "", goal_type: "save", target_amount: "", current_amount: "", target_date: "" });
    fetchGoals();
  };

  const handleUpdateProgress = async (id: string) => {
    await api.patch(`/goals/${id}`, { current_amount: parseFloat(editAmount) });
    setEditingId(null);
    setEditAmount("");
    fetchGoals();
  };

  const handleDelete = async (id: string) => {
    await api.delete(`/goals/${id}`);
    fetchGoals();
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
        <Header title="Goals" />
        <main className="p-4 pb-8 lg:p-6">
          <div className="mb-4 flex items-center justify-between rounded-2xl border border-[var(--fp-border)] bg-[var(--fp-surface)] px-5 py-4 shadow-[var(--fp-shadow)] backdrop-blur">
            <p className="text-sm text-[var(--fp-text-muted)]">{goals.length} goal(s)</p>
            <Button onClick={() => setShowForm(true)}>Add Goal</Button>
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-[var(--fp-negative)]/35 bg-[var(--fp-negative)]/10 p-3 text-sm text-[var(--fp-negative)]">
              {error}
            </div>
          )}

          {loading ? (
            <div className="grid gap-4 md:grid-cols-2">
              {[1, 2].map((i) => (
                <div key={i} className="h-48 animate-pulse rounded-2xl bg-[var(--fp-surface)]" />
              ))}
            </div>
          ) : goals.length === 0 ? (
            <div className="rounded-2xl border border-[var(--fp-border)] bg-[var(--fp-surface)] p-12 text-center shadow-[var(--fp-shadow)]">
              <p className="text-[var(--fp-text-soft)]">No goals set yet. Define your first financial goal.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {goals.map((goal) => {
                const progress = goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0;
                const barColor =
                  progress >= 75
                    ? "bg-[var(--fp-positive)]"
                    : progress >= 40
                    ? "bg-[var(--fp-text)]"
                    : "bg-[var(--fp-warning)]";

                return (
                  <div key={goal.id} className="rounded-2xl border border-[var(--fp-border)] bg-[var(--fp-surface)] p-5 shadow-[var(--fp-shadow)]">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-[var(--fp-text)]">{goal.title}</h3>
                        <span className={clsx("mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium", typeBadgeColors[goal.goal_type] || typeBadgeColors.custom)}>
                          {goal.goal_type.replace(/_/g, " ")}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDelete(goal.id)}
                        className="text-xs font-medium text-[var(--fp-negative)] transition-colors hover:opacity-80"
                      >
                        Delete
                      </button>
                    </div>

                    <div className="mb-2">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-[var(--fp-text)]">{progress.toFixed(0)}%</span>
                        <span className="text-[var(--fp-text-muted)]">${goal.current_amount.toLocaleString()} / ${goal.target_amount.toLocaleString()}</span>
                      </div>
                      <div className="h-3 rounded-full bg-[var(--fp-surface-elev)]">
                        <div className={clsx("h-3 rounded-full transition-all", barColor)} style={{ width: `${Math.min(progress, 100)}%` }} />
                      </div>
                    </div>

                    <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--fp-text-soft)]">
                      {goal.target_date && <span>Target: {goal.target_date}</span>}
                      {goal.on_track !== null && (
                        <span className={goal.on_track ? "text-[var(--fp-positive)]" : "text-[var(--fp-warning)]"}>
                          {goal.on_track ? "On track" : "Behind pace"}
                        </span>
                      )}
                      {goal.monthly_needed !== null && (
                        <span>${goal.monthly_needed.toLocaleString()}/mo needed</span>
                      )}
                      {goal.days_remaining !== null && (
                        <span>{goal.days_remaining}d left</span>
                      )}
                    </div>

                    {editingId === goal.id ? (
                      <div className="flex gap-2">
                        <input
                          type="number"
                          step="0.01"
                          value={editAmount}
                          onChange={(e) => setEditAmount(e.target.value)}
                          className="flex-1 rounded-xl border border-[var(--fp-border)] bg-[var(--fp-surface-solid)] px-3 py-2 text-sm text-[var(--fp-text)] focus:border-[var(--fp-text)] focus:ring-[var(--fp-text)]"
                          placeholder="Current amount"
                        />
                        <Button size="sm" onClick={() => handleUpdateProgress(goal.id)}>Save</Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                      </div>
                    ) : (
                      <Button size="sm" variant="secondary" onClick={() => { setEditingId(goal.id); setEditAmount(goal.current_amount.toString()); }}>
                        Update Progress
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <Modal open={showForm} onClose={() => setShowForm(false)} title="Add Goal">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input label="Title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              <Select label="Type" options={goalTypes} value={form.goal_type} onChange={(e) => setForm({ ...form, goal_type: e.target.value })} />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Target Amount" type="number" step="0.01" required value={form.target_amount} onChange={(e) => setForm({ ...form, target_amount: e.target.value })} />
                <Input label="Current Amount" type="number" step="0.01" value={form.current_amount} onChange={(e) => setForm({ ...form, current_amount: e.target.value })} />
              </div>
              <Input label="Target Date" type="date" value={form.target_date} onChange={(e) => setForm({ ...form, target_date: e.target.value })} />
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
