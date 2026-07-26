"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { get, post } from "@/lib/api";
import {
  Eye,
  Heart,
  MessageCircle,
  Clock,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

type Snapshot = {
  capturedAt: string;
  views: number;
  likes: number;
  comments: number;
  estimatedWatchTimeMinutes: number;
};

type AiSummary = {
  source?: string;
  summary?: string;
  recommendation?: string;
} | null;

type CampaignReportResponse = {
  success: boolean;
  data: {
    campaignTitle: string;
    creatorName: string;
    videoUrl: string;
    snapshots: Snapshot[];
    hasTrend: boolean;
    summary: {
      totalViews: number;
      totalLikes: number;
      totalComments: number;
      estimatedWatchTimeMinutes: number;
    } | null;
    aiSummary: AiSummary;
    refreshesRemaining: number;
    nextRefreshAvailableAt: string | null;
  };
};

const DASH = "--";

function fmtNumber(n: number | null | undefined): string {
  if (n == null) return DASH;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function fmtMinutes(n: number | null | undefined): string {
  if (n == null) return DASH;
  if (n >= 60) return `${(n / 60).toFixed(1)} hrs`;
  return `${Math.round(n)} min`;
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return DASH;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "2-digit" }).format(d);
}

function StatCard({
  icon: Icon,
  label,
  value,
  sublabel,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sublabel?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-widest text-slate-500">{label}</p>
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{value}</p>
      {sublabel ? <p className="mt-1 text-xs text-slate-400">{sublabel}</p> : null}
    </div>
  );
}

export default function CampaignReportPage() {
  const params = useParams();
  const token = String(params?.token || "");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [refreshError, setRefreshError] = useState("");
  const [data, setData] = useState<CampaignReportResponse["data"] | null>(null);

  const loadReport = useCallback(async () => {
    const resp = await get<CampaignReportResponse>(`/campaign-reports/public/${token}`);
    setData(resp.data);
  }, [token]);

  useEffect(() => {
    async function load() {
      if (!token) return;
      try {
        setLoading(true);
        setError("");
        await loadReport();
      } catch (e: any) {
        setError(e?.response?.data?.error || e?.message || "Failed to load campaign report");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [token, loadReport]);

  async function handleRefresh() {
    try {
      setRefreshing(true);
      setRefreshError("");
      const resp = await post<CampaignReportResponse>(`/campaign-reports/public/${token}/refresh`, {});
      setData(resp.data);
    } catch (e: any) {
      setRefreshError(e?.response?.data?.error || e?.message || "Failed to refresh");
    } finally {
      setRefreshing(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50/50 p-6 md:p-10">
        <div className="mx-auto max-w-5xl space-y-6">
          <Skeleton className="h-10 w-64 rounded-xl bg-slate-200/60" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-2xl bg-white shadow-sm" />
            ))}
          </div>
          <Skeleton className="h-[360px] w-full rounded-2xl bg-white shadow-sm" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50/50 px-4">
        <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-lg font-semibold text-slate-900">Campaign report unavailable</p>
          <p className="mt-2 text-sm text-slate-500">{error || "This link may have expired."}</p>
        </div>
      </div>
    );
  }

  const chartData = data.snapshots.map((s) => ({
    date: fmtDate(s.capturedAt),
    Views: s.views,
    Likes: s.likes,
  }));

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50/40 via-white to-lime-50/30 px-4 py-8 md:px-8">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-teal-100/40 blur-[100px]" />
        <div className="absolute -right-32 top-40 h-96 w-96 rounded-full bg-lime-100/40 blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl">
        <div className="mb-8 flex items-start gap-4">
          <img src="/logo.png" alt="Fidem logo" className="hidden h-14 w-14 shrink-0 rounded-2xl object-contain shadow-sm sm:block" />
          <div>
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-teal-700">
              <Sparkles className="h-3.5 w-3.5 text-teal-600" /> Campaign Report
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
              {data.campaignTitle || "Live Campaign"}
            </h1>
            <p className="mt-1.5 text-sm text-slate-500">
              {data.creatorName ? `Creator: ${data.creatorName}` : "Performance report"}
            </p>
          </div>
        </div>

        {data.summary ? (
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard icon={Eye} label="Total Views" value={fmtNumber(data.summary.totalViews)} />
            <StatCard icon={Heart} label="Total Likes" value={fmtNumber(data.summary.totalLikes)} />
            <StatCard icon={MessageCircle} label="Total Comments" value={fmtNumber(data.summary.totalComments)} />
            <StatCard
              icon={Clock}
              label="Avg Watch Time"
              value={fmtMinutes(data.summary.estimatedWatchTimeMinutes)}
              sublabel="Estimated — not real Analytics data"
            />
          </div>
        ) : null}

        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-900">Performance Trend</h3>
          </div>
          {data.hasTrend ? (
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip />
                  <Line type="monotone" dataKey="Views" stroke="#009688" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="Likes" stroke="#cddc39" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-sm font-medium text-slate-600">
                We're tracking this campaign — check back after the next refresh for a performance trend.
              </p>
              <p className="mt-1 text-xs text-slate-400">
                A trend chart needs at least two snapshots over time.
              </p>
            </div>
          )}
        </div>

        {data.aiSummary ? (
          <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-3 text-base font-semibold text-slate-900">AI Analysis</h3>
            <p className="text-sm leading-6 text-slate-700">{data.aiSummary.summary}</p>
            {data.aiSummary.recommendation ? (
              <p className="mt-3 text-sm font-medium text-teal-700">{data.aiSummary.recommendation}</p>
            ) : null}
          </div>
        ) : null}

        <div className="flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing || data.refreshesRemaining <= 0}
            className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
          <p className="text-xs text-slate-400">
            {data.refreshesRemaining > 0
              ? `${data.refreshesRemaining} refresh${data.refreshesRemaining === 1 ? "" : "es"} left today`
              : `Refresh limit reached. Try again ${data.nextRefreshAvailableAt ? `after ${new Date(data.nextRefreshAvailableAt).toLocaleString()}` : "later"}.`}
          </p>
          {refreshError ? <p className="text-xs font-medium text-red-600">{refreshError}</p> : null}
        </div>
      </div>
    </div>
  );
}
