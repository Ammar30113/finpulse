"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { AnalysisResponse } from "@/lib/types";
import clsx from "clsx";

export function InsightsPanel() {
  const [data, setData] = useState<AnalysisResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchInsights = useCallback(async () => {
    try {
      setLoading(true);
      const insights = await api.get<AnalysisResponse>("/analysis/insights");
      setData(insights);
    } catch {
      // Insights are non-critical, silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  if (loading) {
    return (
      <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
        <h3 className="text-sm font-medium text-gray-500">AI Insights</h3>
        <div className="mt-4 space-y-3">
          <div className="h-4 w-3/4 animate-pulse rounded bg-gray-100" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-gray-100" />
          <div className="h-4 w-2/3 animate-pulse rounded bg-gray-100" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
        <h3 className="text-sm font-medium text-gray-500">AI Insights</h3>
        <p className="mt-4 text-sm text-gray-400">
          Add your financial data to receive personalized insights.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
      <h3 className="text-sm font-medium text-gray-500">AI Insights</h3>

      {data.warnings.length > 0 && (
        <div className="mt-3 space-y-2">
          {data.warnings.slice(0, 2).map((w, i) => (
            <div
              key={i}
              className={clsx(
                "rounded-lg px-3 py-2 text-xs",
                w.severity === "high"
                  ? "bg-red-50 text-red-700"
                  : w.severity === "medium"
                  ? "bg-yellow-50 text-yellow-700"
                  : "bg-blue-50 text-blue-700"
              )}
            >
              <span className="font-semibold">{w.category}:</span> {w.message}
            </div>
          ))}
        </div>
      )}

      {data.recommendations.length > 0 && (
        <ul className="mt-3 space-y-2">
          {data.recommendations.slice(0, 3).map((r, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
              <svg className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-brand-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
              </svg>
              <div>
                <span className="font-medium text-gray-900">{r.action}</span>
                <span className="text-gray-400"> - {r.detail}</span>
              </div>
            </li>
          ))}
        </ul>
      )}

      {data.summary && (
        <p className="mt-3 text-xs text-gray-500 border-t border-gray-100 pt-3">{data.summary}</p>
      )}
    </div>
  );
}
