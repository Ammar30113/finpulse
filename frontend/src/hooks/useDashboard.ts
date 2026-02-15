"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { AnalysisResponse, DashboardSummary } from "@/lib/types";

export function useDashboard() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [insights, setInsights] = useState<AnalysisResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch dashboard data and insights in parallel (#13)
      const [summary, analysisData] = await Promise.all([
        api.get<DashboardSummary>("/dashboard/summary"),
        api.get<AnalysisResponse>("/analysis/insights").catch(() => null),
      ]);
      setData(summary);
      setInsights(analysisData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, insights, loading, error, refresh };
}
