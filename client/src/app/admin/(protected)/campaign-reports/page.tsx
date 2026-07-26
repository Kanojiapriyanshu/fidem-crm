'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { ExternalLink, Sparkles, Loader2, Link2 } from 'lucide-react';
import { get, post } from '@/lib/api';

type CampaignReportListItem = {
  reportId: string;
  campaignTitle: string;
  creatorName: string;
  videoUrl: string;
  link: string;
  totalViews: number | null;
  totalLikes: number | null;
  snapshotCount: number;
  refreshesRemaining: number;
  createdAt: string;
};

type InsightReportListItem = {
  reportId: string;
  influencerName: string;
  videoTitle: string;
  videoUrl: string;
  views: number;
  likes: number;
  engagementRate: number;
  finalAiScore: number;
  generatedAt: string;
};


function fmtNumber(n: number | null): string {
  if (n == null) return '--';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '--';
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).format(d);
}

export default function CampaignReportsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reports, setReports] = useState<CampaignReportListItem[]>([]);
  const [copiedId, setCopiedId] = useState('');

  const [videoUrl, setVideoUrl] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState('');
  const [insightReports, setInsightReports] = useState<InsightReportListItem[]>([]);
  const [insightLoading, setInsightLoading] = useState(true);
  const [generatingLinkId, setGeneratingLinkId] = useState('');
  const [linkByReportId, setLinkByReportId] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const resp = await get<{ success: boolean; data: CampaignReportListItem[] }>('/campaign-reports');
      setReports(resp?.data || []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load campaign reports');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadInsightReports = useCallback(async () => {
    try {
      setInsightLoading(true);
      const resp = await get<{ success: boolean; data: InsightReportListItem[] }>('/youtube-insights');
      setInsightReports(resp?.data || []);
    } catch (_) {
      // non-fatal — standalone list is a convenience, not required
    } finally {
      setInsightLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    loadInsightReports();
  }, [load, loadInsightReports]);

  async function handleAnalyze() {
    if (!videoUrl.trim()) return;
    try {
      setAnalyzing(true);
      setAnalyzeError('');
      await post('/youtube-insights/analyze', { videoUrl: videoUrl.trim(), sourceContext: 'admin_insight_os' });
      setVideoUrl('');
      await loadInsightReports();
    } catch (e: any) {
      setAnalyzeError(e?.response?.data?.message || e?.message || 'Failed to analyze this video');
    } finally {
      setAnalyzing(false);
    }
  }

  async function generatePublicLink(reportId: string) {
    try {
      setGeneratingLinkId(reportId);
      const resp = await post<{ success: boolean; data?: { url?: string; publicUrl?: string } }>(
        '/youtube-insights/share',
        { reportId }
      );
      const link = resp?.data?.url || resp?.data?.publicUrl || '';
      if (link) {
        setLinkByReportId((prev) => ({ ...prev, [reportId]: link }));
        await navigator.clipboard.writeText(link).catch(() => undefined);
      }
    } catch (_) {
      // ignore — surfaced implicitly by missing link
    } finally {
      setGeneratingLinkId('');
    }
  }

  async function copyLink(reportId: string, link: string) {
    try {
      await navigator.clipboard.writeText(link);
      setCopiedId(reportId);
      setTimeout(() => setCopiedId(''), 1500);
    } catch (_) {
      // ignore
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-teal-700">
          <Sparkles className="h-3.5 w-3.5 text-teal-600" /> Insight OS
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Insight OS (Live)</h1>
        <p className="mt-1 text-sm text-slate-500">
          Paste any YouTube video URL below to generate a full brand-facing insight report and public
          share link — no campaign required.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-3 text-base font-semibold text-slate-900">Analyze a YouTube Video</h2>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="url"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
          />
          <button
            type="button"
            onClick={handleAnalyze}
            disabled={!videoUrl.trim() || analyzing}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {analyzing ? 'Analyzing...' : 'Analyze'}
          </button>
        </div>
        {analyzeError ? <p className="mt-2 text-xs font-medium text-red-600">{analyzeError}</p> : null}
      </div>

      <div>
        <h2 className="mb-3 text-base font-semibold text-slate-900">Standalone Insight Reports</h2>
        {insightLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-teal-600" />
          </div>
        ) : insightReports.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
            No standalone reports yet — analyze a video above to create one.
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50">
                  <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-slate-500">Creator</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-slate-500">Video</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-slate-500">Views</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-slate-500">Engagement</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-slate-500">AI Score</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-slate-500">Link</th>
                </tr>
              </thead>
              <tbody>
                {insightReports.map((r) => (
                  <tr key={r.reportId} className="border-b border-slate-100 hover:bg-slate-50/80">
                    <td className="px-5 py-3 font-semibold text-slate-900">{r.influencerName || '--'}</td>
                    <td className="max-w-xs truncate px-4 py-3 text-slate-600">{r.videoTitle || '--'}</td>
                    <td className="px-4 py-3 tabular-nums text-slate-600">{r.views?.toLocaleString() ?? '--'}</td>
                    <td className="px-4 py-3 tabular-nums text-slate-600">{r.engagementRate ? `${r.engagementRate}%` : '--'}</td>
                    <td className="px-4 py-3 text-slate-600">{r.finalAiScore || '--'}</td>
                    <td className="px-4 py-3">
                      {linkByReportId[r.reportId] ? (
                        <div className="flex items-center gap-2">
                          <a
                            href={linkByReportId[r.reportId]}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            Open
                          </a>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => generatePublicLink(r.reportId)}
                          disabled={generatingLinkId === r.reportId}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {generatingLinkId === r.reportId ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Link2 className="h-3.5 w-3.5" />
                          )}
                          Get Link
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-3 text-base font-semibold text-slate-900">Live Campaign Reports</h2>
        <p className="-mt-2 mb-3 text-sm text-slate-500">
          Reports linked to a pitch-folder campaign item, with tracked snapshots and a rate-limited refresh.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-600">{error}</div>
      ) : reports.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-12 text-center">
          <p className="text-sm font-medium text-slate-600">No live campaign reports yet.</p>
          <p className="mt-1 text-xs text-slate-400">
            Open a pitch-folder item that&apos;s active on a campaign and use &quot;Set Live Video URL&quot;.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50">
                <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-slate-500">Campaign</th>
                <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-slate-500">Creator</th>
                <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-slate-500">Views</th>
                <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-slate-500">Likes</th>
                <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-slate-500">Snapshots</th>
                <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-slate-500">Refreshes Left</th>
                <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-slate-500">Created</th>
                <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-slate-500">Link</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => (
                <tr key={r.reportId} className="border-b border-slate-100 hover:bg-slate-50/80">
                  <td className="px-5 py-3 font-semibold text-slate-900">{r.campaignTitle || '--'}</td>
                  <td className="px-4 py-3 text-slate-700">{r.creatorName || '--'}</td>
                  <td className="px-4 py-3 tabular-nums text-slate-600">{fmtNumber(r.totalViews)}</td>
                  <td className="px-4 py-3 tabular-nums text-slate-600">{fmtNumber(r.totalLikes)}</td>
                  <td className="px-4 py-3 text-slate-600">{r.snapshotCount}</td>
                  <td className="px-4 py-3 text-slate-600">{r.refreshesRemaining}</td>
                  <td className="px-4 py-3 text-slate-500">{fmtDate(r.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <a
                        href={r.link}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Open
                      </a>
                      <button
                        type="button"
                        onClick={() => copyLink(r.reportId, r.link)}
                        className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-700"
                      >
                        {copiedId === r.reportId ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
