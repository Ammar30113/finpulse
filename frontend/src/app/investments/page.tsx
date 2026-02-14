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
import type { Investment } from "@/lib/types";
import { clsx } from "clsx";

const investmentTypes = [
  { value: "tfsa", label: "TFSA" },
  { value: "rrsp", label: "RRSP" },
  { value: "crypto", label: "Crypto" },
  { value: "brokerage", label: "Brokerage" },
  { value: "other", label: "Other" },
];

const typeBadgeColors: Record<string, string> = {
  tfsa: "bg-[var(--fp-positive)]/15 text-[var(--fp-positive)]",
  rrsp: "bg-[var(--fp-text)]/10 text-[var(--fp-text)]",
  crypto: "bg-[var(--fp-warning)]/15 text-[var(--fp-warning)]",
  brokerage: "bg-[var(--fp-text-muted)]/15 text-[var(--fp-text-muted)]",
  other: "bg-[var(--fp-surface-elev)] text-[var(--fp-text-muted)]",
};

export default function InvestmentsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    investment_type: "tfsa",
    institution: "",
    current_value: "",
    book_value: "",
    monthly_contribution: "",
  });

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [user, authLoading, router]);

  const fetchInvestments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.get<Investment[]>("/investments");
      setInvestments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load investments");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) fetchInvestments();
  }, [user, fetchInvestments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post("/investments", {
      investment_type: form.investment_type,
      institution: form.institution || null,
      current_value: parseFloat(form.current_value || "0"),
      book_value: parseFloat(form.book_value || "0"),
      monthly_contribution: parseFloat(form.monthly_contribution || "0"),
    });
    setShowForm(false);
    setForm({ investment_type: "tfsa", institution: "", current_value: "", book_value: "", monthly_contribution: "" });
    fetchInvestments();
  };

  const handleDelete = async (id: string) => {
    await api.delete(`/investments/${id}`);
    fetchInvestments();
  };

  const totalValue = investments.reduce((sum, i) => sum + i.current_value, 0);
  const totalGainLoss = investments.reduce((sum, i) => sum + i.gain_loss, 0);

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
        <Header title="Investments" />
        <main className="p-4 pb-8 lg:p-6">
          <div className="mb-4 flex items-center justify-between rounded-2xl border border-[var(--fp-border)] bg-[var(--fp-surface)] px-5 py-4 shadow-[var(--fp-shadow)] backdrop-blur">
            <div className="text-sm text-[var(--fp-text-muted)]">
              Total: <span className="font-semibold text-[var(--fp-text)]">${totalValue.toLocaleString()}</span>
              {" "}
              <span className={clsx("font-medium", totalGainLoss >= 0 ? "text-[var(--fp-positive)]" : "text-[var(--fp-negative)]")}>
                ({totalGainLoss >= 0 ? "+" : ""}{totalGainLoss.toLocaleString()})
              </span>
            </div>
            <Button onClick={() => setShowForm(true)}>Add Investment</Button>
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-[var(--fp-negative)]/35 bg-[var(--fp-negative)]/10 p-3 text-sm text-[var(--fp-negative)]">
              {error}
            </div>
          )}

          {loading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-40 animate-pulse rounded-2xl bg-[var(--fp-surface)]" />
              ))}
            </div>
          ) : investments.length === 0 ? (
            <div className="rounded-2xl border border-[var(--fp-border)] bg-[var(--fp-surface)] p-12 text-center shadow-[var(--fp-shadow)]">
              <p className="text-[var(--fp-text-soft)]">No investments tracked yet.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {investments.map((inv) => (
                <div key={inv.id} className="rounded-2xl border border-[var(--fp-border)] bg-[var(--fp-surface)] p-5 shadow-[var(--fp-shadow)]">
                  <div className="flex items-start justify-between mb-3">
                    <span className={clsx("rounded-full px-2.5 py-0.5 text-xs font-medium", typeBadgeColors[inv.investment_type] || typeBadgeColors.other)}>
                      {inv.investment_type.toUpperCase()}
                    </span>
                    <button
                      onClick={() => handleDelete(inv.id)}
                      className="text-xs font-medium text-[var(--fp-negative)] transition-colors hover:opacity-80"
                    >
                      Delete
                    </button>
                  </div>
                  {inv.institution && <p className="mb-2 text-sm text-[var(--fp-text-muted)]">{inv.institution}</p>}
                  <p className="text-2xl font-semibold text-[var(--fp-text)]">${inv.current_value.toLocaleString()}</p>
                  <div className="mt-2 flex items-center gap-4 text-sm">
                    <span className="text-[var(--fp-text-muted)]">Book: ${inv.book_value.toLocaleString()}</span>
                    <span className={clsx("font-medium", inv.gain_loss >= 0 ? "text-[var(--fp-positive)]" : "text-[var(--fp-negative)]")}>
                      {inv.gain_loss >= 0 ? "+" : ""}{inv.gain_loss.toLocaleString()}
                    </span>
                  </div>
                  {inv.monthly_contribution > 0 && (
                    <p className="mt-2 text-xs text-[var(--fp-text-soft)]">${inv.monthly_contribution}/mo contribution</p>
                  )}
                </div>
              ))}
            </div>
          )}

          <Modal open={showForm} onClose={() => setShowForm(false)} title="Add Investment">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Select label="Type" options={investmentTypes} value={form.investment_type} onChange={(e) => setForm({ ...form, investment_type: e.target.value })} />
              <Input label="Institution" value={form.institution} onChange={(e) => setForm({ ...form, institution: e.target.value })} />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Current Value" type="number" step="0.01" value={form.current_value} onChange={(e) => setForm({ ...form, current_value: e.target.value })} />
                <Input label="Book Value" type="number" step="0.01" value={form.book_value} onChange={(e) => setForm({ ...form, book_value: e.target.value })} />
              </div>
              <Input label="Monthly Contribution" type="number" step="0.01" value={form.monthly_contribution} onChange={(e) => setForm({ ...form, monthly_contribution: e.target.value })} />
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
