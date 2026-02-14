"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { api } from "@/lib/api";
import type { CreditCard } from "@/lib/types";
import { clsx } from "clsx";

export default function CreditCardsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBalance, setEditBalance] = useState("");
  const [form, setForm] = useState({
    name: "",
    issuer: "",
    credit_limit: "",
    current_balance: "",
    statement_day: "15",
    due_day: "1",
    apr: "",
    min_payment_pct: "2.0",
  });

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [user, authLoading, router]);

  const fetchCards = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.get<CreditCard[]>("/credit-cards");
      setCards(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load credit cards");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) fetchCards();
  }, [user, fetchCards]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post("/credit-cards", {
      name: form.name,
      issuer: form.issuer || null,
      credit_limit: parseFloat(form.credit_limit),
      current_balance: parseFloat(form.current_balance || "0"),
      statement_day: parseInt(form.statement_day),
      due_day: parseInt(form.due_day),
      apr: form.apr ? parseFloat(form.apr) : null,
      min_payment_pct: parseFloat(form.min_payment_pct),
    });
    setShowForm(false);
    setForm({ name: "", issuer: "", credit_limit: "", current_balance: "", statement_day: "15", due_day: "1", apr: "", min_payment_pct: "2.0" });
    fetchCards();
  };

  const handleUpdateBalance = async (id: string) => {
    await api.patch(`/credit-cards/${id}`, { current_balance: parseFloat(editBalance) });
    setEditingId(null);
    setEditBalance("");
    fetchCards();
  };

  const handleDelete = async (id: string) => {
    await api.delete(`/credit-cards/${id}`);
    fetchCards();
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
        <Header title="Credit Cards" />
        <main className="p-4 pb-8 lg:p-6">
          <div className="mb-4 flex items-center justify-between rounded-2xl border border-[var(--fp-border)] bg-[var(--fp-surface)] px-5 py-4 shadow-[var(--fp-shadow)] backdrop-blur">
            <p className="text-sm text-[var(--fp-text-muted)]">{cards.length} card(s)</p>
            <Button onClick={() => setShowForm(true)}>Add Credit Card</Button>
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
          ) : cards.length === 0 ? (
            <div className="rounded-2xl border border-[var(--fp-border)] bg-[var(--fp-surface)] p-12 text-center shadow-[var(--fp-shadow)]">
              <p className="text-[var(--fp-text-soft)]">No credit cards added yet.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {cards.map((card) => {
                const util = card.credit_limit > 0 ? (card.current_balance / card.credit_limit) * 100 : 0;
                const barColor =
                  util > 75 ? "bg-[var(--fp-negative)]" : util > 30 ? "bg-[var(--fp-warning)]" : "bg-[var(--fp-positive)]";
                const textColor =
                  util > 75 ? "text-[var(--fp-negative)]" : util > 30 ? "text-[var(--fp-warning)]" : "text-[var(--fp-positive)]";

                return (
                  <div key={card.id} className="rounded-2xl border border-[var(--fp-border)] bg-[var(--fp-surface)] p-5 shadow-[var(--fp-shadow)]">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-[var(--fp-text)]">{card.name}</h3>
                        {card.issuer && <p className="text-sm text-[var(--fp-text-muted)]">{card.issuer}</p>}
                      </div>
                      <button
                        onClick={() => handleDelete(card.id)}
                        className="text-xs font-medium text-[var(--fp-negative)] transition-colors hover:opacity-80"
                      >
                        Delete
                      </button>
                    </div>

                    <div className="flex items-baseline justify-between mb-2">
                      <span className="text-2xl font-semibold text-[var(--fp-text)]">
                        ${card.current_balance.toLocaleString()}
                      </span>
                      <span className="text-sm text-[var(--fp-text-muted)]">/ ${card.credit_limit.toLocaleString()}</span>
                    </div>

                    <div className="mb-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span className={clsx("font-medium", textColor)}>{util.toFixed(0)}% utilized</span>
                      </div>
                      <div className="h-2 rounded-full bg-[var(--fp-surface-elev)]">
                        <div className={clsx("h-2 rounded-full transition-all", barColor)} style={{ width: `${Math.min(util, 100)}%` }} />
                      </div>
                    </div>

                    <div className="mb-3 flex gap-4 text-xs text-[var(--fp-text-muted)]">
                      <span>Statement: Day {card.statement_day}</span>
                      <span>Due: Day {card.due_day}</span>
                      {card.apr && <span>APR: {card.apr}%</span>}
                    </div>

                    {editingId === card.id ? (
                      <div className="flex gap-2">
                        <input
                          type="number"
                          step="0.01"
                          value={editBalance}
                          onChange={(e) => setEditBalance(e.target.value)}
                          className="flex-1 rounded-xl border border-[var(--fp-border)] bg-[var(--fp-surface-solid)] px-3 py-2 text-sm text-[var(--fp-text)] focus:border-[var(--fp-text)] focus:ring-[var(--fp-text)]"
                          placeholder="New balance"
                        />
                        <Button size="sm" onClick={() => handleUpdateBalance(card.id)}>Save</Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                      </div>
                    ) : (
                      <Button size="sm" variant="secondary" onClick={() => { setEditingId(card.id); setEditBalance(card.current_balance.toString()); }}>
                        Update Balance
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <Modal open={showForm} onClose={() => setShowForm(false)} title="Add Credit Card">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input label="Card Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <Input label="Issuer" value={form.issuer} onChange={(e) => setForm({ ...form, issuer: e.target.value })} />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Credit Limit" type="number" step="0.01" required value={form.credit_limit} onChange={(e) => setForm({ ...form, credit_limit: e.target.value })} />
                <Input label="Current Balance" type="number" step="0.01" value={form.current_balance} onChange={(e) => setForm({ ...form, current_balance: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Statement Day" type="number" min="1" max="31" required value={form.statement_day} onChange={(e) => setForm({ ...form, statement_day: e.target.value })} />
                <Input label="Due Day" type="number" min="1" max="31" required value={form.due_day} onChange={(e) => setForm({ ...form, due_day: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="APR (%)" type="number" step="0.01" value={form.apr} onChange={(e) => setForm({ ...form, apr: e.target.value })} />
                <Input label="Min Payment (%)" type="number" step="0.1" value={form.min_payment_pct} onChange={(e) => setForm({ ...form, min_payment_pct: e.target.value })} />
              </div>
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
