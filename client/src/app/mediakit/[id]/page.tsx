'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';

import InfluencerDetailFullPage from '../InfluencerDetailFullPage';
import { useInfluencerReport } from '@/features/discovery/browse-influencer/useInfluencerReport';
import { useEmailStatus } from '@/features/discovery/browse-influencer/useEmailStatus';
import type { Platform } from '@/features/discovery/browse-influencer/types';
import { post } from '@/lib/api';

// Replace this path with the exact route where you mounted previewYouTubeProfile.
const YOUTUBE_PREVIEW_PROFILE_ENDPOINT = '/youtube/profile/preview';

type YouTubePreviewProfileResponse = {
  status?: string;
  data?: {
    engagementRateLast15?: number | string;
    avgViewsLast15?: number | string;
    subscriberCount?: number | string;
    totalViewCount?: number | string;
    totalVideoCount?: number | string;
    lastVideos?: Array<{
      viewCount?: number | string;
      likeCount?: number | string;
      commentCount?: number | string;
    }>;

    // keep these as fallback only
    engagementRate?: number | string;
    stats?: {
      engagementRate?: number | string;
    };
    profile?: {
      engagementRate?: number | string;
    };
    analytics?: {
      engagementRate?: number | string;
    };

    [key: string]: any;
  };
};

function toFiniteNumber(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;

  const cleaned =
    typeof value === 'string'
      ? value.replace('%', '').replace(/,/g, '').trim()
      : value;

  const num = Number(cleaned);
  return Number.isFinite(num) ? num : undefined;
}

// FullPage already formats engagement as decimal * 100.
// So 0.045 stays 0.045, but 4.5 becomes 0.045.
function normalizeEngagementRate(value: unknown): number | null {
  const num = toFiniteNumber(value);
  if (num === undefined) return null;
  return num > 1 ? num / 100 : num;
}

function calculateEngagementRateFromLastVideos(videos: unknown): number | null {
  if (!Array.isArray(videos) || videos.length === 0) return null;

  const validVideos = videos
    .map((video) => {
      const viewCount = toFiniteNumber(video?.viewCount) ?? 0;
      const likeCount = toFiniteNumber(video?.likeCount) ?? 0;
      const commentCount = toFiniteNumber(video?.commentCount) ?? 0;

      return {
        viewCount,
        engagements: likeCount + commentCount,
      };
    })
    .filter((video) => video.viewCount > 0);

  if (!validVideos.length) return null;

  const totalViews = validVideos.reduce((sum, video) => sum + video.viewCount, 0);
  const totalEngagements = validVideos.reduce(
    (sum, video) => sum + video.engagements,
    0
  );

  if (totalViews <= 0) return null;

  return totalEngagements / totalViews;
}

function extractPreviewEngagementRate(resp: YouTubePreviewProfileResponse): number | null {
  const directRate = normalizeEngagementRate(
    resp?.data?.engagementRateLast15 ??
    resp?.data?.engagementRate ??
    resp?.data?.stats?.engagementRate ??
    resp?.data?.profile?.engagementRate ??
    resp?.data?.analytics?.engagementRate
  );

  if (directRate !== null) return directRate;

  return calculateEngagementRateFromLastVideos(resp?.data?.lastVideos);
}

function cleanString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeYoutubeHandle(value: unknown): string | null {
  const cleaned = cleanString(value);
  if (!cleaned) return null;

  const withoutUrl = cleaned
    .replace(/^https?:\/\/(www\.)?youtube\.com\//i, '')
    .replace(/^@?channel\//i, '')
    .replace(/^@?c\//i, '')
    .replace(/^@?user\//i, '')
    .trim();

  if (!withoutUrl) return null;
  return withoutUrl.startsWith('@') ? withoutUrl : `@${withoutUrl}`;
}

function looksLikeYoutubeChannelId(value: unknown): boolean {
  const cleaned = cleanString(value);
  return /^UC[a-zA-Z0-9_-]{20,}$/.test(cleaned);
}

function pickFirstString(...values: unknown[]): string | null {
  for (const value of values) {
    const cleaned = cleanString(value);
    if (cleaned) return cleaned;
  }

  return null;
}

function resolveYouTubePreviewPayload(params: {
  handle: string | null;
  report: any;
  rawReport: any;
}): { handle?: string; channelId?: string } | null {
  const { handle, report, rawReport } = params;

  const handleCandidate = normalizeYoutubeHandle(
    pickFirstString(
      handle,
      rawReport?.handle,
      rawReport?.username,
      rawReport?.profile?.handle,
      rawReport?.profile?.username,
      rawReport?.profile?.profile?.handle,
      rawReport?.profile?.profile?.username,
      report?.profile?.handle,
      report?.profile?.username,
      report?.profile?.profile?.handle,
      report?.profile?.profile?.username
    )
  );

  if (handleCandidate) {
    return { handle: handleCandidate };
  }

  const channelIdCandidate = [
    rawReport?.channelId,
    rawReport?.youtubeChannelId,
    rawReport?.profile?.channelId,
    rawReport?.profile?.youtubeChannelId,
    rawReport?.profile?.profile?.channelId,
    rawReport?.profile?.profile?.youtubeChannelId,
    report?.profile?.channelId,
    report?.profile?.youtubeChannelId,
    report?.profile?.profile?.channelId,
    report?.profile?.profile?.youtubeChannelId,
  ].find(looksLikeYoutubeChannelId);

  if (channelIdCandidate) {
    return { channelId: cleanString(channelIdCandidate) };
  }

  return null;
}

export default function InfluencerDetailPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();

  // userId comes from /mediakit/[id]
  const userId = params?.id ? decodeURIComponent(String(params.id)) : '';

  const qpPlatform = (searchParams?.get('platform') || '').toLowerCase() as Platform;
  const platform: Platform =
    ['youtube', 'instagram', 'tiktok'].includes(qpPlatform) ? qpPlatform : 'youtube';

  const handleParam = searchParams?.get('handle') || '';
  const handle = handleParam ? String(handleParam) : null;

  const [brandId, setBrandId] = useState('');
  const [adminId, setAdminId] = useState('');
  const [authChecked, setAuthChecked] = useState(false);
  const [authRole, setAuthRole] = useState<'brand' | 'admin' | ''>('');
  const [youtubeEngagementRate, setYoutubeEngagementRate] = useState<number | null>(null);

  // Allow public mediakit view.
  // If brandId/adminId exists, use it.
  // If not, continue without auth and send np=1 while fetching report.
  useEffect(() => {
    const storedBrandId = (localStorage.getItem('brandId') || '').trim();
    const storedAdminId = (localStorage.getItem('adminId') || '').trim();

    if (storedBrandId) {
      setBrandId(storedBrandId);
      setAdminId('');
      setAuthRole('brand');
    } else if (storedAdminId) {
      setBrandId('');
      setAdminId(storedAdminId);
      setAuthRole('admin');
    } else {
      setBrandId('');
      setAdminId('');
      setAuthRole('');
    }

    setAuthChecked(true);
  }, []);

  const [calculationMethod, setCalculationMethod] = useState<'median' | 'average'>('average');

  const { report, rawReport, loading, error, lastFetchedAt, fetchReport } = useInfluencerReport();
  const { exists: emailExists, checkStatus } = useEmailStatus();

  const shouldSendNp = !brandId && !adminId;

  // load report
  useEffect(() => {
    if (!authChecked) return;
    if (!userId) return;

    fetchReport(userId, platform, calculationMethod, {
      brandId: brandId || undefined,
      adminId: adminId || undefined,
      role: authRole === 'admin' ? 'admin' : authRole === 'brand' ? 'brand' : undefined,
      np: shouldSendNp ? '1' : undefined,
    });

    if (handle) {
      const safeHandle = handle.startsWith('@') ? handle : `@${handle}`;
      checkStatus(safeHandle, platform);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    authChecked,
    userId,
    platform,
    calculationMethod,
    handle,
    brandId,
    adminId,
    authRole,
    shouldSendNp,
  ]);

  const youtubePreviewPayload = useMemo(() => {
    if (platform !== 'youtube') return null;

    return resolveYouTubePreviewPayload({
      handle,
      report,
      rawReport,
    });
  }, [platform, handle, report, rawReport]);

  // Fetch only YouTube engagement rate from previewYouTubeProfile.
  useEffect(() => {
    if (!authChecked) return;

    if (platform !== 'youtube') {
      setYoutubeEngagementRate(null);
      return;
    }

    if (!youtubePreviewPayload) {
      setYoutubeEngagementRate(null);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const resp = await post<YouTubePreviewProfileResponse>(
          YOUTUBE_PREVIEW_PROFILE_ENDPOINT,
          {
            ...youtubePreviewPayload,
            videosLimit: 15,
          }
        );

        if (cancelled) return;

        setYoutubeEngagementRate(extractPreviewEngagementRate(resp));
      } catch {
        if (!cancelled) {
          setYoutubeEngagementRate(null);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authChecked, platform, youtubePreviewPayload]);

  // refresh report
  const onRefreshReport = useCallback(async () => {
    if (!userId) return;

    await fetchReport(userId, platform, calculationMethod, {
      brandId: brandId || undefined,
      adminId: adminId || undefined,
      role: authRole === 'admin' ? 'admin' : authRole === 'brand' ? 'brand' : undefined,
      forceRefresh: true,
      np: shouldSendNp ? '1' : undefined,
    });
  }, [userId, platform, calculationMethod, fetchReport, brandId, adminId, authRole, shouldSendNp]);

  if (!authChecked) return null;
  if (!userId) return null;

  return (
    <InfluencerDetailFullPage
      loading={loading}
      error={error}
      data={report}
      raw={rawReport}
      platform={platform}
      onChangeCalc={(calc) => setCalculationMethod(calc)}
      emailExists={emailExists}
      handle={handle}
      lastFetchedAt={lastFetchedAt}
      onRefreshReport={onRefreshReport}
      viewerRole={authRole}
      youtubeEngagementRate={youtubeEngagementRate}
    />
  );
}