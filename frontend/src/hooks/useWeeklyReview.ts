"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { WeeklyReview, WeeklyReviewHistory } from "@/lib/types";

export function useWeeklyReview() {
  const [review, setReview] = useState<WeeklyReview | null>(null);
  const [history, setHistory] = useState<WeeklyReviewHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.get<WeeklyReview>("/weekly-review/current");
      setReview(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load weekly review");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadHistory = useCallback(async () => {
    try {
      const data = await api.get<WeeklyReviewHistory>("/weekly-review/history");
      setHistory(data);
    } catch {
      // History is non-critical
    }
  }, []);

  const completeAction = useCallback(async () => {
    if (!review) return;
    try {
      setCompleting(true);
      const updated = await api.patch<WeeklyReview>(
        `/weekly-review/${review.id}/complete-action`,
        { status: "completed" }
      );
      setReview(updated);
      await loadHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to complete action");
    } finally {
      setCompleting(false);
    }
  }, [review, loadHistory]);

  const skipAction = useCallback(async () => {
    if (!review) return;
    try {
      setCompleting(true);
      const updated = await api.patch<WeeklyReview>(
        `/weekly-review/${review.id}/complete-action`,
        { status: "skipped" }
      );
      setReview(updated);
      await loadHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to skip action");
    } finally {
      setCompleting(false);
    }
  }, [review, loadHistory]);

  useEffect(() => {
    refresh();
    loadHistory();
  }, [refresh, loadHistory]);

  return { review, history, loading, error, completing, refresh, completeAction, skipAction, loadHistory };
}
