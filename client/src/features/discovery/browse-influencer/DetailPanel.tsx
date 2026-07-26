'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  AlertCircle,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Globe,
  Heart,
  Mail,
  PlayCircle,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  X,
  Zap,
  MessageSquare,
} from 'lucide-react';
import Swal from 'sweetalert2';
import { createPortal } from 'react-dom';
import type { ReportResponse, Platform } from './types';
import { normalizeReport } from './utils';
import {
  createReportApiError,
  isReportLimitExceededError,
  isReportLimitExceededPayload,
} from './reportLimit';
import { post, post2 } from '@/lib/api';

import EmailEditor, { type EmailEditorPayload } from '@/components/ui/EmailEditor';
import { AudienceIntelligenceCard } from '@/components/common/AudienceIntelligenceCard';
import { CampaignHighlightsCard } from '@/components/common/CampaignHighlightsCard';
import { ContactManagementCard } from '@/components/common/ContactManagementCard';
import { CreatorHeader } from '@/components/common/CreatorHeader';
import { FeatureLockedCard } from '@/components/common/FeatureLockedCard';
import {
  LookalikeCreatorsPanel,
  type LookalikePanelItem,
} from '@/components/common/LookalikeCreatorsPanel';
import { MetricsGrid } from '@/components/common/MetricsGrid';
import { PastCollaborationsTable } from '@/components/common/PastCollaborations';
import { PerformanceTrendCard } from '@/components/common/PerformanceTrendCard';
import { PopularContentPanel } from '@/components/common/PopularContentPanel';
import { RecentPostsTable } from '@/components/common/RecentPostsTable';
import { SectionCard } from '@/components/common/SectionCard';

import {
  type CampaignHighlight,
  type DashboardMetric,
  type InfluencerReport,
  type MediaKit,
  type ModashLookalike,
  SectionKey,
  type SocialPost,
  type SubscriptionPlan,
  type UserRole,
  average,
  canAccessSection,
  enrichPostImages,
  formatCompactNumber,
  formatPercent,
  getSubscriptionPlan,
  getUserRole,
  normaliseTrend,
  pickPostImage,
  toNumber,
} from '@/components/common/ViewModashClient';
import { CaretDown, CaretDownIcon, CaretUp, CaretUpIcon } from '@phosphor-icons/react';
import { Checkbox } from '@/components/ui/checkbox';

interface DetailPanelProps {
  open: boolean;
  onClose: () => void;
  loading: boolean;
  error: string | null;
  data: ReportResponse | null;
  raw: any;
  platform: Platform | null;
  emailExists?: boolean | null;
  onChangeCalc: (calc: 'median' | 'average') => void;
  brandId: string;
  campaignId?: string | null;
  campaignName?: string | null;
  handle: string | null;
  youtubeChannelId?: string | null;
  lastFetchedAt?: string | null;
  onRefreshReport?: () => Promise<void> | void;
  connectedProfiles?: InfluencerReport[];
  onPlatformChange?: (profile: InfluencerReport) => void;
  onReportLimitExceeded?: () => void;
}


type EmailStatusResponse =
  | {
    status: 0 | 1;
    email?: string;
    handle?: string;
    platform?: Platform;
  }
  | { status: 'error'; message?: string };

type InvitationResponse =
  | {
    status: 'success';
    message: string;
    isExistingInfluencer: true;
    influencerId: string;
    influencerName: string;
    brandName: string;
    emailSent: boolean;
    emailMeta?: {
      recipientEmail: string;
      threadId: string;
      messageId: string;
      subject: string;
      campaignId: string | null;
    };
  }
  | {
    status: 'success';
    message: string;
    isExistingInfluencer: false;
    brandName: string;
    invitationId: string;
    emailSent: boolean;
    emailMeta?: {
      recipientEmail: string;
      threadId: string;
      messageId: string;
      subject: string;
      campaignId: string | null;
    };
    isNewInvitation?: boolean;
  }
  | {
    status: 'error';
    message: string;
  };

type AdminCheckStatusResponse = {
  status: 0 | 1;
  handle?: string;
  email?: string | null;
  platform?: Platform | string;
  message?: string;
};

type InvitationCreateItem = {
  _id?: string;
  invitationId?: string | null;
  handle: string;
  platform: 'youtube' | 'instagram' | 'tiktok';
  userId?: string | null;
  modashUserId?: string | null;
  brandId: string;
  campaignId?: string | null;
  status: 'invited' | 'available';
  createdAt: string;
  updatedAt: string;
};

type InvitationCreateResp = {
  status: 'saved' | 'exists' | 'error';
  data?: InvitationCreateItem | InvitationCreateItem[] | null;
  results?: Array<{
    status?: 'saved' | 'exists';
    message?: string;
    emailSent?: boolean;
    emailSkippedReason?: string | null;
    emailMeta?: {
      recipientEmail?: string;
      emailSource?: string;
      messageId?: string | null;
      subject?: string;
      campaignId?: string | null;
    } | null;
    data?: InvitationCreateItem;
  }>;
  message?: string;
  createdCount?: number;
  existingCount?: number;
  updatedCount?: number;
  emailSentCount?: number;
  emailSent?: boolean;
  emailSkippedReason?: string | null;
  emailMeta?: {
    recipientEmail?: string;
    emailSource?: string;
    messageId?: string | null;
    subject?: string;
    campaignId?: string | null;
  } | null;
};

type InvitationListItem = {
  _id: string;
  handle?: string;
  platform?: 'youtube' | 'instagram' | 'tiktok';
  brandId?: string;
  campaignId?: string | null;
  campaign?: {
    _id?: string;
  } | null;
  status?: 'invited' | 'available';
};

type InvitationListResp = {
  status: 'success' | 'error';
  message?: string;
  page?: number;
  limit?: number;
  total?: number;
  hasNext?: boolean;
  data?: InvitationListItem[];
};

type BrandCampaignImage = {
  name?: string;
  type?: string;
  size?: number;
  dataUrl?: string;
};

type BrandCampaignItem = {
  campaignId: string;
  campaignTitle: string;
  status?: string;
  productImages?: BrandCampaignImage[];
};

type GetByBrandCampaignResp = {
  success: boolean;
  data?: {
    items?: BrandCampaignItem[];
    page?: number;
    limit?: number;
    total?: number;
  };
  message?: string;
};

type CampaignInvitationTemplatePreviewResp = {
  status: 'success' | 'error';
  message?: string;
  mode?: string;
  campaignCount?: number;
  fromEmail?: string | null;
  toEmail?: string | null;
  missingEmailId?: string | null;
  campaigns?: Array<{
    _id: string;
    campaignTitle: string;
  }>;
  missingCampaignIds?: string[];
  placeholders?: Record<string, string>;
  template?: {
    subject?: string;
    htmlBody?: string;
    textBody?: string;
  };
};

type EmailDraftState = {
  campaignIds: string[];
  fromEmail: string;
  fromName: string;

  // Show only creator handle in editor.
  toLabel: string;

  // Keep empty for invitation flow. Do not expose real email in frontend.
  toEmail?: string;

  channelId?: string | null;
  missingEmailId?: string | null;

  subject: string;
  initialBody: string;
  initialHtmlBody: string;
};

type CampaignInvitePickerProps = {
  open: boolean;
  onClose: () => void;
  allItems: BrandCampaignItem[];
  items: BrandCampaignItem[];
  selectedIds: string[];
  onSelectedIdsChange: (ids: string[]) => void;
  invitedCampaignIds: Set<string>;
  search: string;
  onSearchChange: (value: string) => void;
  loading: boolean;
  sending: boolean;
  onSend: (ids: string[]) => Promise<void> | void;
};

type ResolvedTemplateDraft = {
  subject: string;
  textBody: string;
  htmlBody: string;
};

const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
const DETAIL_PANEL_API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || '';
const API_REPORT_ENDPOINT = `${BACKEND_BASE_URL}modash/report`;

function getDetailPanelApiUrl(path: string) {
  const base = String(DETAIL_PANEL_API_BASE_URL || '').replace(/\/$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${cleanPath}`;
}

function normalizePlatform(platform: Platform | null): 'instagram' | 'tiktok' | 'youtube' {
  const value = String(platform ?? '').toLowerCase();
  if (value.includes('tiktok')) return 'tiktok';
  if (value.includes('youtube')) return 'youtube';
  return 'instagram';
}

function getInvitationCampaignId(item: InvitationListItem | any): string {
  return String(item?.campaignId || item?.campaign?._id || '').trim();
}

function getInfluencerUserIdForInvitation(params: {
  selectedReport?: any;
  raw?: any;
  data?: any;
}): string {
  const { selectedReport, raw, data } = params;

  const profileRoot = data?.profile ?? raw?.profile ?? raw ?? {};

  return String(
    selectedReport?.modashId ||
    selectedReport?._id ||
    selectedReport?.userId ||
    profileRoot?.userId ||
    profileRoot?.modashId ||
    profileRoot?.channelId ||
    profileRoot?.id ||
    raw?._modashProfileId ||
    data?._modashProfileId ||
    raw?._id ||
    data?._id ||
    ''
  ).trim();
}

function getLookalikeReportUserId(item: LookalikePanelItem): string {
  return String(
    (item.raw as any)?.userId ??
    (item.raw as any)?.modashId ??
    item.userId ??
    item.modashId ??
    item.id ??
    ''
  ).trim();
}

function getLocalStorageValue(key: string): string {
  if (typeof window === 'undefined') return '';

  try {
    return String(window.localStorage.getItem(key) || '').trim();
  } catch {
    return '';
  }
}
function mapReportPost(post: Record<string, any>): SocialPost {
  const resolvedImage = pickPostImage(post);

  return {
    text: post?.text ?? post?.caption ?? post?.title,
    type: post?.type ?? post?.contentType,
    url: post?.url,
    image: resolvedImage,
    thumbnail: resolvedImage,
    likes: post?.likes,
    views: post?.views ?? post?.plays ?? post?.videoViews ?? post?.likes,
    plays: post?.plays ?? post?.videoViews,
    comments: post?.comments,
    sponsors: Array.isArray(post?.sponsors)
      ? post.sponsors.map((s: Record<string, any>) => ({
        name: s?.name ?? s?.username,
      }))
      : [],
    createdAt: post?.created ?? post?.createdAt ?? post?.publishedAt,
    publishedAt: post?.publishedAt ?? post?.created ?? post?.createdAt,
    postedAt: post?.postedAt ?? post?.created ?? post?.createdAt,
    date: post?.date ?? post?.created ?? post?.createdAt,
    created: post?.created ?? post?.createdAt,
  };
}

function parseMonthLabel(value: string, index: number): string {
  if (!value) return monthLabels[index % 12];
  const parts = value.split('-');
  if (parts.length >= 2) {
    const year = parts[0];
    const month = Number(parts[1]);
    if (month >= 1 && month <= 12) {
      return `${monthLabels[month - 1]} ${year.slice(2)}`;
    }
  }
  return value;
}

function readNumber(...values: any[]) {
  for (const value of values) {
    if (value === undefined || value === null || value === '') continue;

    const cleaned =
      typeof value === 'string'
        ? value.replace(/,/g, '').replace('%', '')
        : value;

    const num = Number(cleaned);
    if (Number.isFinite(num)) return num;
  }

  return 0;
}


function formatMetricDelta(value?: number | string | null) {
  const num = toNumber(value);
  if (!Number.isFinite(num) || num === 0) return undefined;

  const sign = num > 0 ? "+" : "";
  return `${sign}${(num * 100).toFixed(1)}%`;
}

function isSameMetricValue(a: number, b: number) {
  if (!a || !b) return false;

  const diff = Math.abs(a - b);
  const max = Math.max(Math.abs(a), Math.abs(b));

  return diff <= 1 || diff / max < 0.005;
}

function getPlatformViewsLabel(platform?: string | null) {
  const normalized = String(platform ?? '').toLowerCase();

  if (normalized.includes('youtube')) return 'Avg. views';
  if (normalized.includes('tiktok')) return 'Avg. video views';

  return 'Avg. reel plays';
}

function buildUniqueMetricCards(params: {
  report?: InfluencerReport | null;
  platform?: string | null;
  avgLikes?: number;
  avgViews?: number;
  avgComments?: number;
  postsCount?: number;
  reach?: number;
  followerCompared?: number | string | null;
  likesCompared?: number | string | null;
}) {
  const {
    report,
    platform,
    avgLikes = 0,
    avgViews = 0,
    avgComments = 0,
    postsCount = 0,
    reach = 0,
    followerCompared,
    likesCompared,
  } = params;

  const cards: DashboardMetric[] = [];
  const usedNumericValues: number[] = [];

  const pushMetric = (metric: {
    key: string;
    label: string;
    rawValue: number | string | null | undefined;
    value?: string;
    delta?: string;
    dedupe?: boolean;
  }) => {
    const numericValue = toNumber(metric.rawValue);

    if (!numericValue || numericValue <= 0) return;

    if (
      metric.dedupe !== false &&
      usedNumericValues.some((used) => isSameMetricValue(used, numericValue))
    ) {
      return;
    }

    if (metric.dedupe !== false) {
      usedNumericValues.push(numericValue);
    }

    cards.push({
      key: metric.key,
      label: metric.label,
      value: metric.value ?? formatCompactNumber(numericValue),
      delta: metric.delta,
    });
  };

  pushMetric({
    key: 'followers',
    label: 'Followers',
    rawValue: report?.followers,
    delta: formatMetricDelta(followerCompared),
  });

  pushMetric({
    key: 'engagement',
    label: 'Avg. engagement rate',
    rawValue: report?.engagementRate,
    value: formatPercent(report?.engagementRate, true),
    dedupe: false,
  });

  pushMetric({
    key: 'likes',
    label: 'Average likes',
    rawValue: avgLikes,
    delta: formatMetricDelta(likesCompared),
  });

  pushMetric({
    key: 'views',
    label: getPlatformViewsLabel(platform),
    rawValue: avgViews,
  });

  pushMetric({
    key: 'comments',
    label: 'Average comments',
    rawValue: avgComments,
  });

  pushMetric({
    key: 'posts',
    label: 'Total posts',
    rawValue: postsCount,
  });

  pushMetric({
    key: 'reach',
    label: 'Total reach',
    rawValue: reach,
  });

  return cards.slice(0, 6);
}

function normalizeTrendPoint(item: Record<string, any>) {
  return {
    month: item?.month ?? item?.date ?? item?.period ?? '',
    avgLikes: readNumber(
      item?.avgLikes,
      item?.avg_likes,
      item?.avgEngagements,
      item?.avg_engagements,
      item?.likes,
      item?.engagements
    ),
    followers: readNumber(
      item?.followers,
      item?.followerCount,
      item?.followersCount
    ),
    avgViews: readNumber(
      item?.avgViews,
      item?.avg_views,
      item?.views,
      item?.avgReelsPlays,
      item?.avg_reels_plays,
      item?.plays
    ),
  };
}

function scoreTrendHistory(items: any[]) {
  const points = items.map(normalizeTrendPoint);
  const followerValues = new Set(
    points.map((item) => item.followers).filter((value) => value > 0)
  );

  const baseScore = points.reduce((score, item) => {
    return score + (item.avgLikes > 0 ? 2 : 0) + (item.avgViews > 0 ? 1 : 0);
  }, 0);

  // Prefer platform-level statHistory with real month-by-month followers over
  // content-type history that only has avg_likes and repeated fallback values.
  const followerScore =
    followerValues.size > 1 ? points.length * 4 : followerValues.size === 1 ? 1 : 0;

  return baseScore + followerScore;
}

function pickBestTrendHistory(...candidates: any[]) {
  const validArrays = candidates.filter(
    (item): item is any[] => Array.isArray(item) && item.length >= 2
  );

  return (
    validArrays
      .slice()
      .sort((a, b) => scoreTrendHistory(b) - scoreTrendHistory(a))[0] ?? []
  );
}

function transformPanelLookalikes(
  lookalikes: ModashLookalike[] = [],
  engagementRate: number
): LookalikePanelItem[] {
  return lookalikes.slice(0, 4).map((item: any) => {
    const computedEngagementRate =
      item.followers > 0 && item.engagements > 0
        ? item.engagements / item.followers
        : engagementRate;

    return {
      id: item.userId,
      userId: item.userId,
      modashId: item.userId,
      username: item.username,
      fullname: item.fullname,
      name: item.fullname ?? item.username,
      handle: item.username ? `@${item.username}` : '',
      followers: formatCompactNumber(item.followers),
      followersRaw: item.followers,
      engagementsRaw: item.engagements,
      engagementRateRaw: computedEngagementRate,
      engagement:
        item.followers > 0
          ? formatPercent((item.engagements / item.followers) * 100)
          : formatPercent(engagementRate, true),
      avatar: item.picture,
      picture: item.picture,
      url: item.url,
      platform: item.platform,
      provider: item.provider,
      raw: item,
    };
  });
}

function buildLookalikeReportFromPanelItem(
  item: LookalikePanelItem,
  fallbackPlatform: Platform | string | null,
  parentReport?: InfluencerReport | null
): InfluencerReport & { _id?: string } {
  const rawItem = item.raw ?? {};

  const username = String(
    rawItem?.username ?? item.username ?? item.handle ?? ''
  )
    .replace(/^@/, '')
    .trim();

  const followers = toNumber(rawItem?.followers ?? item.followersRaw);
  const engagements = toNumber(rawItem?.engagements ?? item.engagementsRaw);

  const engagementRate =
    toNumber(rawItem?.engagementRate ?? item.engagementRateRaw) ||
    (followers > 0 && engagements > 0 ? engagements / followers : 0) ||
    toNumber(parentReport?.engagementRate);

  const avgLikes = toNumber(rawItem?.avgLikes ?? rawItem?.averageLikes);
  const avgViews = toNumber(
    rawItem?.avgViews ?? rawItem?.averageViews ?? rawItem?.avgReelsPlays
  );
  const avgComments = toNumber(
    rawItem?.avgComments ?? rawItem?.averageComments
  );

  const resolvedPlatform = normalizePlatform(
    ((rawItem?.platform ??
      item.platform ??
      item.provider ??
      fallbackPlatform) ||
      null) as Platform | null
  );

  const rawAudience = rawItem?.audience ?? {};

  return {
    _id:
      rawItem?._id ??
      rawItem?.userId ??
      item.userId ??
      item.modashId ??
      item.id,
    modashId: rawItem?.userId ?? item.userId ?? item.modashId ?? item.id,
    provider: resolvedPlatform,
    url: rawItem?.url ?? item.url,
    name: rawItem?.fullname ?? item.fullname ?? item.name ?? username,
    fullname: rawItem?.fullname ?? item.fullname,
    picture: rawItem?.picture ?? item.picture ?? item.avatar,
    bio: rawItem?.bio ?? rawItem?.description,
    username,
    handle: username ? `@${username}` : item.handle,
    followers,
    engagementRate,
    country: rawItem?.country,
    language:
      typeof rawItem?.language === 'string'
        ? { name: rawItem.language }
        : rawItem?.language?.name
          ? { name: rawItem.language.name }
          : undefined,
    hashtags: Array.isArray(rawItem?.hashtags)
      ? rawItem.hashtags.map((tagItem: any) => ({
        tag: tagItem?.tag ?? tagItem?.name ?? tagItem,
      }))
      : [],
    popularPosts: [],
    recentPosts: [],
    sponsoredPosts: [],
    stats: {
      avgLikes: {
        value: avgLikes,
      },
      avgViews: {
        value: avgViews,
      },
      avgComments: {
        value: avgComments,
      },
      followers: {
        value: followers,
      },
    },
    avgLikes,
    avgComments,
    avgViews,
    avgReelsPlays: avgViews,
    audience: {
      geoCountries: Array.isArray(rawAudience?.geoCountries)
        ? rawAudience.geoCountries
        : [],
      ages: Array.isArray(rawAudience?.ages) ? rawAudience.ages : [],
      genders: Array.isArray(rawAudience?.genders) ? rawAudience.genders : [],
      languages: Array.isArray(rawAudience?.languages)
        ? rawAudience.languages
        : [],
      interests: Array.isArray(rawAudience?.interests)
        ? rawAudience.interests
        : [],
      credibility: rawAudience?.credibility,
    },
    isPrivate: rawItem?.isPrivate,
    isVerified: rawItem?.isVerified,
    accountType: rawItem?.accountType,
    postsCount: rawItem?.postsCount ?? rawItem?.postsCounts,
    statHistory: Array.isArray(rawItem?.statHistory) ? rawItem.statHistory : [],
    lookalikes: Array.isArray(rawItem?.lookalikes) ? rawItem.lookalikes : [],
  } as InfluencerReport & { _id?: string };
}


function isYouTubeChannelId(value?: string | null) {
  return /^UC[A-Za-z0-9_-]{20,}$/i.test(String(value || '').trim());
}

function cleanHandleCandidate(value?: any) {
  const raw = String(value || '').trim();
  if (!raw) return '';

  const withoutUrl = raw
    .replace(/^https?:\/\/(www\.)?youtube\.com\//i, '')
    .replace(/^@+/, '')
    .trim();

  if (!withoutUrl) return '';
  if (isYouTubeChannelId(withoutUrl)) return '';

  // Do not treat channel URLs, channel IDs, or random path values as handles.
  if (/^channel\//i.test(withoutUrl)) return '';
  if (/^c\//i.test(withoutUrl)) return '';
  if (/^user\//i.test(withoutUrl)) return '';

  const simple = withoutUrl.split(/[/?#]/)[0].replace(/^@+/, '').trim();

  if (!simple || isYouTubeChannelId(simple)) return '';

  if (!/^[A-Za-z0-9._-]+$/.test(simple)) return '';

  return `@${simple.toLowerCase()}`;
}

function getSafeCreatorHandle(params: {
  selectedReport?: any;
  raw?: any;
  data?: any;
  handle?: string | null;
}) {
  const { selectedReport, raw, data, handle } = params;

  const candidates = [
    handle,

    selectedReport?.handle,
    selectedReport?.username,

    raw?.handle,
    raw?.username,
    raw?.profile?.handle,
    raw?.profile?.username,
    raw?.youtube?.handle,
    raw?.creator?.handle,
    raw?.influencer?.handle,

    data?.handle,
    data?.username,
    data?.profile?.handle,
    data?.profile?.username,
    data?.youtube?.handle,
    data?.creator?.handle,
    data?.influencer?.handle,
  ];

  for (const candidate of candidates) {
    const cleaned = cleanHandleCandidate(candidate);
    if (cleaned) return cleaned;
  }

  return '';
}

function makeValidInvitationHandle(value?: any, prefix = '') {
  const raw = String(value || '').trim();

  if (!raw) return '';

  const withoutAt = raw
    .replace(/^@+/, '')
    .replace(/^https?:\/\/(www\.)?youtube\.com\//i, '')
    .replace(/^channel\//i, '')
    .replace(/^c\//i, '')
    .replace(/^user\//i, '')
    .split(/[/?#]/)[0]
    .trim();

  if (!withoutAt) return '';

  const safe = withoutAt
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[._-]+|[._-]+$/g, '');

  if (!safe) return '';

  return `@${prefix}${safe}`;
}

function getBackendInvitationHandle(params: {
  selectedReport?: any;
  raw?: any;
  data?: any;
  handle?: string | null;
  displayName?: string;
  editorToLabel?: string;
  channelId?: string | null;
}) {
  const realHandle = getSafeCreatorHandle({
    selectedReport: params.selectedReport,
    raw: params.raw,
    data: params.data,
    handle: params.handle,
  });

  if (realHandle) return realHandle;

  const fallbackFromLabel = makeValidInvitationHandle(params.editorToLabel);
  if (fallbackFromLabel && fallbackFromLabel !== '@creator') {
    return fallbackFromLabel;
  }

  const fallbackFromName = makeValidInvitationHandle(params.displayName);
  if (
    fallbackFromName &&
    fallbackFromName !== '@creator' &&
    fallbackFromName !== '@creator-profile'
  ) {
    return fallbackFromName;
  }

  const channelId = String(params.channelId || '').trim();

  if (channelId) {
    return makeValidInvitationHandle(channelId, 'youtube-');
  }

  return '';
}

function getCreatorToLabel(params: {
  selectedReport?: any;
  raw?: any;
  data?: any;
  handle?: string | null;
  displayName?: string;
}) {
  const safeHandle = getSafeCreatorHandle(params);

  if (safeHandle) return safeHandle;

  const name = String(
    params.displayName ||
      params.selectedReport?.name ||
      params.selectedReport?.fullname ||
      params.selectedReport?.channelName ||
      params.raw?.title ||
      params.raw?.profile?.title ||
      params.raw?.profile?.channelName ||
      params.data?.title ||
      params.data?.profile?.title ||
      params.data?.profile?.channelName ||
      ''
  ).trim();

  if (name && !isYouTubeChannelId(name)) return name;

  return 'Creator';
}

function pickFirstArray(...candidates: any[]): any[] {
  for (const candidate of candidates) {
    if (Array.isArray(candidate) && candidate.length) return candidate;
  }
  return [];
}

function pickReportRoot(raw: any, data: ReportResponse | null): any {
  const candidates = [raw, raw?.profile, data, (data as any)?.profile];

  const isRichRoot = (value: any) =>
    value &&
    typeof value === 'object' &&
    (
      Array.isArray(value?.recentPosts) ||
      Array.isArray(value?.popularPosts) ||
      Array.isArray(value?.sponsoredPosts) ||
      value?.audience ||
      value?.statsByContentType ||
      value?.stats ||
      value?.avgReelsPlays !== undefined ||
      value?.avgViews !== undefined ||
      value?.lookalikes ||
      value?.audienceExtra
    );

  for (const candidate of candidates) {
    if (isRichRoot(candidate)) return candidate;
  }

  return raw?.profile ?? raw ?? (data as any)?.profile ?? data;
}

function buildPrimaryReport(
  data: ReportResponse | null,
  raw: any,
  platform: Platform | null,
  handle: string | null
): InfluencerReport | null {
  const root = pickReportRoot(raw, data);
  if (!root) return null;

  const profileRoot = root?.profile && typeof root.profile === 'object' ? root.profile : root;
  const audience = root?.audience ?? profileRoot?.audience ?? {};
  const stats = root?.stats ?? profileRoot?.stats ?? {};
  const statsByContentType = root?.statsByContentType ?? profileRoot?.statsByContentType ?? {};
  const normalizedPlatform = normalizePlatform(platform);

  const username =
    profileRoot?.username ??
    profileRoot?.handle ??
    root?.username ??
    root?.handle ??
    (handle ? handle.replace(/^@/, '') : undefined);

  const mapPosts = (items: any) =>
    Array.isArray(items) ? items.map(mapReportPost) : [];

  const recentPosts = mapPosts(
    pickFirstArray(
      root?.recentPosts,
      profileRoot?.recentPosts,
      root?.posts,
      profileRoot?.posts,
    )
  );

  const popularPosts = mapPosts(
    pickFirstArray(root?.popularPosts, profileRoot?.popularPosts)
  );

  const sponsoredPosts = mapPosts(
    pickFirstArray(root?.sponsoredPosts, profileRoot?.sponsoredPosts)
  );

  const followers =
    profileRoot?.followers ??
    root?.followers ??
    stats?.followers?.value ??
    root?.subscribers ??
    profileRoot?.subscribers;

  const avgLikes =
    root?.avgLikes ??
    profileRoot?.avgLikes ??
    stats?.avgLikes?.value ??
    statsByContentType?.all?.avgLikes ??
    statsByContentType?.reels?.avgLikes;

  const avgComments =
    root?.avgComments ??
    profileRoot?.avgComments ??
    stats?.avgComments?.value ??
    statsByContentType?.all?.avgComments ??
    statsByContentType?.reels?.avgComments;

  const avgViews =
    profileRoot?.averageViews ??
    root?.avgViews ??
    root?.avgReelsPlays ??
    stats?.avgViews?.value ??
    statsByContentType?.all?.avgViews ??
    statsByContentType?.reels?.avgViews ??
    statsByContentType?.reels?.avgReelsPlays;

  const avgReelsPlays =
    root?.avgReelsPlays ??
    profileRoot?.avgReelsPlays ??
    statsByContentType?.reels?.avgReelsPlays ??
    profileRoot?.averageViews ??
    root?.avgViews;

  const statHistory = Array.isArray(root?.statHistory)
    ? root.statHistory
    : Array.isArray(profileRoot?.statHistory)
      ? profileRoot.statHistory
      : Array.isArray(statsByContentType?.all?.statHistory)
        ? statsByContentType.all.statHistory
        : Array.isArray(statsByContentType?.reels?.statHistory)
          ? statsByContentType.reels.statHistory
          : [];

  const lookalikes = Array.isArray(root?.lookalikes)
    ? root.lookalikes
    : Array.isArray(profileRoot?.lookalikes)
      ? profileRoot.lookalikes
      : Array.isArray(audience?.audienceLookalikes)
        ? audience.audienceLookalikes
        : [];

  return {
    _id:
      (raw as any)?._modashProfileId ??
      (raw as any)?._id ??
      (data as any)?._modashProfileId ??
      (data as any)?._id,
    modashId:
      root?.userId ??
      root?.modashId ??
      profileRoot?.userId ??
      profileRoot?.modashId,
    provider: normalizedPlatform,
    url: profileRoot?.url ?? root?.url,
    name: profileRoot?.fullname ?? root?.fullname ?? root?.name ?? profileRoot?.username ?? username,
    fullname: profileRoot?.fullname ?? root?.fullname,
    picture: profileRoot?.picture ?? root?.picture,
    bio: root?.bio ?? profileRoot?.bio ?? root?.description ?? profileRoot?.description,
    username,
    handle: username ? `@${String(username).replace(/^@/, '')}` : undefined,
    followers,
    engagementRate: profileRoot?.engagementRate ?? root?.engagementRate,
    country: root?.country ?? profileRoot?.country,
    language:
      typeof root?.language === 'string'
        ? { name: root.language }
        : root?.language?.name
          ? { name: root.language.name }
          : typeof profileRoot?.language === 'string'
            ? { name: profileRoot.language }
            : profileRoot?.language?.name
              ? { name: profileRoot.language.name }
              : Array.isArray(audience?.languages) && audience.languages.length
                ? { name: audience.languages[0]?.name ?? audience.languages[0]?.code }
                : undefined,
    hashtags: Array.isArray(root?.hashtags)
      ? root.hashtags.map((item: Record<string, any>) => ({ tag: item?.tag }))
      : Array.isArray(profileRoot?.hashtags)
        ? profileRoot.hashtags.map((item: Record<string, any>) => ({ tag: item?.tag }))
        : [],
    popularPosts,
    recentPosts,
    sponsoredPosts,
    stats: {
      avgLikes: {
        value: avgLikes,
        compared: stats?.avgLikes?.compared,
      },
      avgViews: {
        value: avgViews,
        compared: stats?.avgViews?.compared,
      },
      avgComments: {
        value: avgComments,
        compared: stats?.avgComments?.compared,
      },
      followers: {
        value: followers,
        compared: stats?.followers?.compared,
      },
      paidPostPerformance: stats?.paidPostPerformance,
    },
    avgLikes,
    avgComments,
    avgViews,
    avgReelsPlays,
    audience: {
      geoCountries: Array.isArray(audience?.geoCountries)
        ? audience.geoCountries.map((item: Record<string, any>) => ({
          name: item?.name ?? '',
          weight: item?.weight ?? 0,
        }))
        : [],
      ages: Array.isArray(audience?.ages)
        ? audience.ages.map((item: Record<string, any>) => ({
          code: item?.code ?? '',
          weight: item?.weight ?? 0,
        }))
        : [],
      genders: Array.isArray(audience?.genders)
        ? audience.genders.map((item: Record<string, any>) => ({
          code: item?.code ?? '',
          weight: item?.weight ?? 0,
        }))
        : [],
      languages: Array.isArray(audience?.languages)
        ? audience.languages.map((item: Record<string, any>) => ({
          code: item?.name ?? item?.code ?? '',
          weight: item?.weight ?? 0,
        }))
        : [],
      interests: Array.isArray(audience?.interests)
        ? audience.interests.map((item: Record<string, any>) => ({
          name: item?.name ?? '',
          weight: item?.weight ?? 0,
        }))
        : [],
      credibility: audience?.credibility,
    },
    isPrivate: root?.isPrivate ?? profileRoot?.isPrivate,
    isVerified: root?.isVerified ?? profileRoot?.isVerified,
    accountType: root?.accountType ?? profileRoot?.accountType,
    postsCount:
      root?.postsCount ??
      root?.postsCounts ??
      profileRoot?.postsCount ??
      profileRoot?.postsCounts,
    statHistory,
    lookalikes,
  } as InfluencerReport & { _id?: string };
}

async function copyWithFallback(text: string) {
  const isLocalhost =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1';

  const canUseClipboardApi =
    typeof navigator !== 'undefined' &&
    !!navigator.clipboard &&
    (window.isSecureContext || isLocalhost);

  if (canUseClipboardApi) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const ta = document.createElement('textarea');
  ta.value = text;
  ta.setAttribute('readonly', '');
  ta.style.position = 'fixed';
  ta.style.top = '0';
  ta.style.left = '0';
  ta.style.opacity = '0';
  ta.style.pointerEvents = 'none';

  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  ta.setSelectionRange(0, ta.value.length);

  const copied = document.execCommand('copy');
  document.body.removeChild(ta);

  if (!copied) {
    throw new Error('Fallback copy failed');
  }
}

function getCampaignPrimaryImage(item: BrandCampaignItem): string {
  const first = Array.isArray(item?.productImages) ? item.productImages[0] : null;
  return String(first?.dataUrl ?? '').trim();
}

function getCampaignInitials(title: string): string {
  const safe = String(title || '').trim();
  if (!safe) return 'C';

  const parts = safe.split(/\s+/).filter(Boolean).slice(0, 2);
  return parts.map((part) => part.charAt(0).toUpperCase()).join('');
}

function getFromNameFromEmail(email?: string | null): string {
  const local = String(email || '').split('@')[0] || '';
  const spaced = local.replace(/[._-]+/g, ' ').trim();
  if (!spaced) return 'Fidem';

  return spaced
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function escapeHtmlValue(value: string) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function extractSubjectLine(text: string) {
  const match = String(text || '').match(/^\s*Subject:\s*(.+)$/m);
  return match?.[1]?.trim() || '';
}

function stripSubjectLine(text: string) {
  return String(text || '')
    .replace(/^\s*Subject:\s*.+(?:\r?\n)+/i, '')
    .trim();
}

function extractGreetingName(text: string) {
  const match = String(text || '').match(/^\s*Dear\s+(.+?),\s*$/m);
  return match?.[1]?.trim() || '';
}

function extractLineValue(text: string, label: string) {
  const lines = String(text || '')
    .replace(/\r/g, '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const prefix = `${label.toLowerCase()}:`;
  const found = lines.find((line) => line.toLowerCase().startsWith(prefix));
  if (!found) return '';

  return found.slice(found.indexOf(':') + 1).trim();
}

function extractBrandFromSubject(text: string) {
  const subject = extractSubjectLine(text);
  const match = subject.match(/-\s*(.+)$/);
  return match?.[1]?.trim() || '';
}

function hasUnresolvedTemplateTokens(value: string) {
  return /\{\{[^}]+\}\}|\$\s*\{[^}]+\}|escapeHtml\(/i.test(String(value || ''));
}

function plainTextToHtml(text: string) {
  return escapeHtmlValue(text).replace(/\n/g, '<br />');
}

function replaceTemplateTokens(
  input: string,
  values: Record<string, string>,
  placeholders?: Record<string, string>
) {
  let output = String(input || '');
  if (!output) return '';

  output = output.replace(/\$\s*\n\s*\{/g, '${');

  if (placeholders) {
    Object.entries(placeholders).forEach(([key, token]) => {
      const replacement = values[key] ?? '';
      if (token) {
        output = output.replace(new RegExp(escapeRegExp(token), 'gi'), replacement);
      }
    });
  }

  const aliasPatterns: Array<[string, string]> = [
    ['campaign\\s*name', values.campaignTitle || values.campaignName || ''],
    ['brand\\s*name', values.brandName || ''],
    ['influencer\\s*name', values.influencerName || ''],
    ['campaign\\s*objective', values.campaignObjective || ''],
    ['deliverables', values.deliverables || ''],
    ['compensation', values.compensation || ''],
    ['timeline', values.timeline || ''],
    ['campaign\\s*link', values.campaignLink || ''],
    ['additional\\s*notes', values.additionalNotes || ''],
  ];

  aliasPatterns.forEach(([pattern, replacement]) => {
    output = output.replace(
      new RegExp(`\\{\\{\\s*${pattern}\\s*\\}\\}`, 'gi'),
      replacement
    );
  });

  output = output.replace(
    /\$\{\s*escapeHtml\(\s*([a-zA-Z0-9_]+)\s*\)\s*\}/g,
    (_, key: string) => values[key] ?? ''
  );

  output = output.replace(
    /\$\{\s*([a-zA-Z0-9_]+)\s*\}/g,
    (_, key: string) => values[key] ?? ''
  );

  return output;
}

function cleanupTemplateHtml(input: string) {
  return String(input || '')
    .replace(/borderradius/gi, 'border-radius')
    .replace(/fontweight/gi, 'font-weight')
    .replace(/textalign/gi, 'text-align')
    .replace(/font-size:\s*23\s*16px/gi, 'font-size:16px')
    .replace(/\$\s*\n\s*\{/g, '${')
    .trim();
}

function buildResolvedTemplateDraft(
  previewResp: CampaignInvitationTemplatePreviewResp,
  fallbackDisplayName: string,
  fallbackDisplayHandle: string,
  fallbackFromName: string
): ResolvedTemplateDraft {
  const rawSubject = String(previewResp.template?.subject || '');
  const rawTextBody = String(previewResp.template?.textBody || '');
  const rawHtmlBody = String(previewResp.template?.htmlBody || '');

  const campaignTitle = String(
    previewResp.campaigns?.[0]?.campaignTitle ||
    extractLineValue(rawTextBody, 'Campaign Name') ||
    ''
  ).trim();

  const brandName = String(
    extractLineValue(rawTextBody, 'Brand') ||
    extractBrandFromSubject(rawTextBody) ||
    fallbackFromName ||
    'Fidem'
  ).trim();

  const influencerName = String(
    extractGreetingName(rawTextBody) ||
    fallbackDisplayName ||
    fallbackDisplayHandle.replace(/^@/, '') ||
    'Creator'
  ).trim();

  const plainValues: Record<string, string> = {
    campaignTitle,
    campaignName: campaignTitle,
    brandName,
    influencerName,
    campaignObjective: extractLineValue(rawTextBody, 'Objective'),
    deliverables: extractLineValue(rawTextBody, 'Deliverables Required'),
    compensation: extractLineValue(rawTextBody, 'Compensation'),
    timeline: extractLineValue(rawTextBody, 'Campaign Timeline'),
    campaignLink: extractLineValue(rawTextBody, 'View Campaign') || '#',
    additionalNotes: extractLineValue(rawTextBody, 'Additional Notes'),
  };

  const htmlValues = Object.fromEntries(
    Object.entries(plainValues).map(([key, value]) => [key, escapeHtmlValue(value)])
  ) as Record<string, string>;

  let resolvedSubject = replaceTemplateTokens(
    rawSubject,
    plainValues,
    previewResp.placeholders || {}
  );

  if (!resolvedSubject || hasUnresolvedTemplateTokens(resolvedSubject)) {
    resolvedSubject = extractSubjectLine(rawTextBody) || resolvedSubject;
  }

  resolvedSubject = resolvedSubject
    .replace(/\s*\n\s*/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();

  let resolvedTextBody = replaceTemplateTokens(
    rawTextBody,
    plainValues,
    previewResp.placeholders || {}
  );

  resolvedTextBody = stripSubjectLine(resolvedTextBody)
    .replace(/\r/g, '')
    .trim();

  let resolvedHtmlBody = cleanupTemplateHtml(
    replaceTemplateTokens(
      rawHtmlBody,
      htmlValues,
      previewResp.placeholders || {}
    )
  );

  if (!resolvedHtmlBody || hasUnresolvedTemplateTokens(resolvedHtmlBody)) {
    resolvedHtmlBody = plainTextToHtml(resolvedTextBody);
  }

  return {
    subject: resolvedSubject,
    textBody: resolvedTextBody,
    htmlBody: resolvedHtmlBody,
  };
}

function CampaignInvitePicker({
  open,
  onClose,
  allItems,
  items,
  selectedIds,
  onSelectedIdsChange,
  invitedCampaignIds,
  search,
  onSearchChange,
  loading,
  sending,
  onSend,
}: CampaignInvitePickerProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  const itemMap = useMemo(() => {
    return new Map(allItems.map((item) => [item.campaignId, item]));
  }, [allItems]);

  const selectedItems = useMemo(() => {
    return selectedIds
      .map((id) => itemMap.get(id))
      .filter(Boolean) as BrandCampaignItem[];
  }, [selectedIds, itemMap]);

  useEffect(() => {
    if (!open) return;

    const handleOutside = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (rootRef.current && target && !rootRef.current.contains(target)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open, onClose]);

  if (!open) return null;

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      ref={rootRef}
      className="fixed right-4 top-[76px] z-[2147483647] w-[min(460px,calc(100vw-32px))] overflow-hidden rounded-lg border border-gray-200 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.22)] sm:right-6 lg:right-8"
    >
      <div className="max-h-[320px] overflow-y-auto px-3 py-3">
        {loading ? (
          <div className="py-6 text-center text-[13px] text-gray-400">
            Loading active campaigns…
          </div>
        ) : items.length ? (
          <div className="space-y-1">
            {items.map((item) => {
              const isAlreadyInvited = invitedCampaignIds.has(String(item.campaignId));
              const checked = selectedIds.includes(item.campaignId);
              const imageSrc = getCampaignPrimaryImage(item);

              return (
                <div
                  key={item.campaignId}
                  role="button"
                  tabIndex={isAlreadyInvited ? -1 : 0}
                  aria-disabled={isAlreadyInvited}
                  onClick={() => {
                    if (isAlreadyInvited) return;
                    onSelectedIdsChange(checked ? [] : [item.campaignId]);
                  }}
                  onKeyDown={(event) => {
                    if (isAlreadyInvited) return;
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      onSelectedIdsChange(checked ? [] : [item.campaignId]);
                    }
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${isAlreadyInvited
                    ? 'cursor-not-allowed border border-gray-100 bg-gray-50 opacity-70'
                    : checked
                      ? 'cursor-pointer border border-gray-300 bg-gray-50'
                      : 'cursor-pointer border border-transparent hover:bg-gray-50'
                    }`}
                >
                  <Checkbox
                    checked={checked}
                    disabled={isAlreadyInvited}
                    onCheckedChange={() => {
                      if (isAlreadyInvited) return;
                      onSelectedIdsChange(checked ? [] : [item.campaignId]);
                    }}
                    onClick={(event) => event.stopPropagation()}
                  />

                  <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-gray-100">
                    {imageSrc ? (
                      <img
                        src={imageSrc}
                        alt={item.campaignTitle}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-[13px] font-semibold text-gray-600">
                        {getCampaignInitials(item.campaignTitle)}
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-medium text-gray-900">
                      {item.campaignTitle}
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-[11px] capitalize text-gray-400">
                      <span>{item.status || 'active'}</span>

                      {isAlreadyInvited ? (
                        <span className="rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-semibold text-green-700">
                          Invited
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-gray-200 p-4 text-[13px] text-gray-400">
            {allItems.length
              ? 'No campaigns matched your search.'
              : 'No active campaigns found for this brand.'}
          </div>
        )}
      </div>

      {/* <div className="border-t border-gray-100 bg-white px-4 py-4">
        <div className="mb-2 text-xs text-gray-500">
          {selectedIds.length
            ? `${selectedIds.length} campaign${selectedIds.length > 1 ? 's' : ''} selected`
            : 'Select at least one campaign to continue.'}
        </div>

        <button
          type="button"
          disabled={!selectedIds.length || sending || loading}
          onClick={() => void onSend(selectedIds)}
          className={`w-full rounded-xl px-4 py-3 text-sm font-medium text-white ${!selectedIds.length || sending || loading
            ? 'cursor-not-allowed bg-gray-300'
            : 'bg-black hover:opacity-90'
            }`}
        >
          {sending
            ? 'Sending…'
            : `Send Invitation${selectedIds.length > 1 ? 's' : ''}`}
        </button>
      </div> */}
    </div>,
    document.body
  );
}

type SuggestedRateCardResponse = {
  status: "success" | "error";
  message?: string;
  data?: {
    currency: string;
    campaign: {
      _id: string;
      title: string;
      budget: number | null;
      budgetFit: string;
      budgetNote: string;
    };
    influencer: {
      _id: string | null;
      modashUserId: string | null;
      username: string | null;
      handle: string | null;
      name: string;
      platform: string;
      followers: number;
      engagementRate: number;
      estimatedReach: number;
      credibility: number | null;
    };
    suggested: {
      low: number;
      high: number;
      recommended: number;
      confidenceScore: number;
    };
    lineItems: Array<{
      key: string;
      label: string;
      quantity: number;
      unitEstimate: number;
      low: number;
      high: number;
      totalEstimate: number;
      totalLow: number;
      totalHigh: number;
    }>;
    multipliers: Record<string, number>;
    selectionReason?: string[];
    reasoning: string[];
    disclaimer: string;
  };
};

function formatMoney(value?: number | null, currency = "USD") {
  const amount = Number(value || 0);

  if (!Number.isFinite(amount) || amount <= 0) return "—";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatMultiplierLabel(key: string) {
  return String(key || "")
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();
}

function getBudgetFitBadgeClass(value?: string | null) {
  const safe = String(value || "").toLowerCase();

  if (safe === "within_range") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (safe === "below_range") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (safe === "above_range") {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  return "border-[#efe8dd] bg-[#fffdfa] text-[#7d7569]";
}

function SuggestedRateCardBox({
  loading,
  data,
  error,
  onGenerate,
}: {
  loading: boolean;
  data: SuggestedRateCardResponse["data"] | null;
  error: string | null;
  onGenerate: () => void;
}) {
  const currency = data?.currency || "USD";
  const budgetFitLabel = data?.campaign.budgetFit
    ? data.campaign.budgetFit.replaceAll("_", " ")
    : "not calculated";

  return (
    <SectionCard
      title="Suggested AI Rate Card"
      eyebrow="AI pricing assistant"
      className="overflow-hidden"
    >
      <div className="space-y-5">
        <div className="relative overflow-hidden rounded-[22px] border border-[#efe8dd] bg-[#111111] p-5 text-white">
          <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-[#ffbf00]/25 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 left-10 h-44 w-44 rounded-full bg-[#f3584e]/20 blur-3xl" />

          <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#f7d985]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#ffbf00]" />
                Campaign-aware estimate
              </div>

              <p className="mt-3 text-sm leading-6 text-white/70">
                Estimate pricing using the selected campaign, creator performance,
                audience quality, geography, deliverables, usage signals, and credibility.
              </p>
            </div>

            <button
              type="button"
              onClick={onGenerate}
              disabled={loading}
              className="inline-flex h-11 shrink-0 items-center justify-center rounded-full bg-white px-5 text-sm font-semibold text-[#111111] shadow-sm transition hover:bg-[#f7f1e7] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "Generating..."
                : data
                  ? "Regenerate rate card"
                  : "Show Suggested AI Rate Card"}
            </button>
          </div>
        </div>

        {error ? (
          <div className="rounded-[18px] border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {!data ? (
          <div className="rounded-[22px] border border-dashed border-[#efe8dd] bg-[#fffdfa] p-5">
            <div className="grid gap-4 md:grid-cols-3">
              {[
                ["1", "Campaign", "Reads selected campaign budget and deliverables."],
                ["2", "Creator", "Uses followers, engagement, views, and credibility."],
                ["3", "Estimate", "Creates a suggested USD negotiation range."],
              ].map(([step, title, copy]) => (
                <div key={step} className="rounded-[18px] bg-white p-4 shadow-[0_10px_28px_rgba(15,23,42,0.04)]">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#fff4df] text-xs font-bold text-[#b77900]">
                    {step}
                  </div>
                  <div className="mt-3 text-sm font-semibold text-[#1f1f1f]">
                    {title}
                  </div>
                  <p className="mt-1 text-xs leading-5 text-[#7d7569]">
                    {copy}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr_0.8fr]">
              <div className="rounded-[22px] border border-[#efe8dd] bg-gradient-to-br from-[#fff7e8] via-white to-white p-5">
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#ab7b2a]">
                  Recommended fee
                </div>
                <div className="mt-3 text-[34px] font-bold leading-none tracking-tight text-[#1f1f1f]">
                  {formatMoney(data.suggested.recommended, currency)}
                </div>
                <p className="mt-3 text-sm leading-6 text-[#7d7569]">
                  Suggested creator payout for the detected deliverable package.
                </p>
              </div>

              <div className="rounded-[22px] border border-[#efe8dd] bg-white p-5">
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#ab9f8e]">
                  Negotiation range
                </div>
                <div className="mt-3 text-xl font-bold text-[#1f1f1f]">
                  {formatMoney(data.suggested.low, currency)} -{" "}
                  {formatMoney(data.suggested.high, currency)}
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#f1eadf]">
                  <div className="h-full w-[68%] rounded-full bg-[#d99707]" />
                </div>
                <p className="mt-3 text-xs leading-5 text-[#8b857b]">
                  Use this range for initial negotiation and final approvals.
                </p>
              </div>

              <div className="rounded-[22px] border border-[#efe8dd] bg-white p-5">
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#ab9f8e]">
                  Confidence
                </div>
                <div className="mt-3 flex items-end gap-2">
                  <span className="text-[34px] font-bold leading-none text-[#1f1f1f]">
                    {data.suggested.confidenceScore}
                  </span>
                  <span className="pb-1 text-lg font-semibold text-[#7d7569]">%</span>
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#f1eadf]">
                  <div
                    className="h-full rounded-full bg-[#1f1f1f]"
                    style={{
                      width: `${Math.max(5, Math.min(100, data.suggested.confidenceScore))}%`,
                    }}
                  />
                </div>
                <p className="mt-3 text-xs leading-5 text-[#8b857b]">
                  Based on available performance and audience signals.
                </p>
              </div>
            </div>

            <div className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
              <div className="overflow-hidden rounded-[22px] border border-[#efe8dd] bg-white">
                <div className="flex items-center justify-between border-b border-[#efe8dd] bg-[#fbf8f3] px-4 py-3">
                  <div>
                    <div className="text-sm font-semibold text-[#1f1f1f]">
                      Deliverable breakdown
                    </div>
                    <div className="text-xs text-[#8b857b]">
                      Unit rate, quantity, and total estimate
                    </div>
                  </div>
                </div>

                <div className="divide-y divide-[#f3eadf]">
                  {data.lineItems.map((item) => (
                    <div
                      key={item.key}
                      className="grid gap-3 px-4 py-4 md:grid-cols-[1fr_72px_128px] md:items-center"
                    >
                      <div>
                        <div className="text-sm font-semibold text-[#1f1f1f]">
                          {item.label}
                        </div>
                        <div className="mt-1 text-xs leading-5 text-[#8b857b]">
                          {formatMoney(item.low, currency)} -{" "}
                          {formatMoney(item.high, currency)} per unit ·{" "}
                          {formatMoney(item.unitEstimate, currency)} suggested
                        </div>
                      </div>

                      <div className="inline-flex h-9 w-fit items-center justify-center rounded-full border border-[#efe8dd] bg-[#fffdfa] px-4 text-sm font-semibold text-[#5f5a52] md:mx-auto">
                        x{item.quantity}
                      </div>

                      <div className="text-left md:text-right">
                        <div className="text-sm font-bold text-[#1f1f1f]">
                          {formatMoney(item.totalEstimate, currency)}
                        </div>
                        <div className="text-xs text-[#8b857b]">estimated total</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-5">
                <div className="rounded-[22px] border border-[#efe8dd] bg-[#fffdfa] p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-[#1f1f1f]">
                        Campaign budget fit
                      </div>
                      <div className="mt-1 text-xs text-[#8b857b]">
                        Compared with selected campaign budget
                      </div>
                    </div>

                    <span
                      className={`shrink-0 rounded-full border px-3 py-1 text-[11px] font-semibold capitalize ${getBudgetFitBadgeClass(data.campaign.budgetFit)}`}
                    >
                      {budgetFitLabel}
                    </span>
                  </div>

                  <div className="mt-4 text-xl font-bold text-[#1f1f1f]">
                    {data.campaign.budget
                      ? formatMoney(data.campaign.budget, currency)
                      : "No budget"}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[#7d7569]">
                    {data.campaign.budgetNote}
                  </p>
                </div>

                <div className="rounded-[22px] border border-[#efe8dd] bg-white p-5">
                  <div className="text-sm font-semibold text-[#1f1f1f]">
                    Pricing signals
                  </div>

                  <div className="mt-4 space-y-3">
                    {Object.entries(data.multipliers).map(([key, value]) => {
                      const safeValue = Number(value || 0);
                      const barWidth = Math.max(
                        8,
                        Math.min(100, (safeValue / 1.6) * 100)
                      );

                      return (
                        <div key={key}>
                          <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
                            <span className="font-medium text-[#5f5a52]">
                              {formatMultiplierLabel(key)}
                            </span>
                            <span className="font-semibold text-[#1f1f1f]">
                              {safeValue.toFixed(2)}x
                            </span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-[#f1eadf]">
                            <div
                              className="h-full rounded-full bg-[#d99707]"
                              style={{ width: `${barWidth}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[22px] border border-[#efe8dd] bg-white p-5">
              <div className="text-sm font-semibold text-[#1f1f1f]">
                Why this estimate?
              </div>

              <div className="mt-3 grid gap-2 md:grid-cols-2">
                {data.reasoning.map((item, index) => (
                  <div
                    key={index}
                    className="rounded-[16px] border border-[#f0e7da] bg-[#fffdfa] px-4 py-3 text-sm leading-6 text-[#6f675c]"
                  >
                    {item}
                  </div>
                ))}
              </div>

              <p className="mt-4 rounded-[16px] bg-[#f8f4ed] px-4 py-3 text-xs leading-5 text-[#8b857b]">
                {data.disclaimer}
              </p>
            </div>

          </div>
        )}
      </div>
    </SectionCard>
  );
}

function toSelectionNumber(value: any) {
  if (value === undefined || value === null || value === '') return 0;

  const cleaned =
    typeof value === 'string'
      ? value.replace(/,/g, '').replace('%', '').trim()
      : value;

  const num = Number(cleaned);
  return Number.isFinite(num) ? num : 0;
}

function formatSelectionCompact(value: any) {
  const num = toSelectionNumber(value);

  if (!num || num <= 0) return '0';

  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(num);
}

function formatSelectionPercentValue(value: any) {
  const num = toSelectionNumber(value);

  if (!num || num <= 0) return '0%';

  const pct = num > 1 ? num : num * 100;
  return `${pct.toFixed(pct >= 10 ? 0 : 1)}%`;
}

function stringifySelectionValue(value: any): string {
  if (value === undefined || value === null) return '';
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value).trim();
  }
  if (Array.isArray(value)) {
    return value.map(stringifySelectionValue).filter(Boolean).join(' ');
  }
  if (typeof value === 'object') {
    return Object.values(value).map(stringifySelectionValue).filter(Boolean).join(' ');
  }
  return '';
}

function uniqueSelectionLabels(values: any[]) {
  const out: string[] = [];
  const seen = new Set<string>();

  values.forEach((value) => {
    const label = stringifySelectionValue(value)
      .replace(/\s+/g, ' ')
      .trim();

    if (!label) return;

    const key = label.toLowerCase();
    if (seen.has(key)) return;

    seen.add(key);
    out.push(label);
  });

  return out;
}

function getWeightedTopNames(items: any, limit = 3) {
  return (Array.isArray(items) ? items : [])
    .slice()
    .sort((a, b) => Number(b?.weight || b?.value || 0) - Number(a?.weight || a?.value || 0))
    .map((item) => String(item?.name || item?.code || item?.label || '').trim())
    .filter(Boolean)
    .slice(0, limit);
}

function getCampaignSelectionLabels(campaign: any) {
  if (!campaign) return [];

  const categoryPairs = (Array.isArray(campaign?.categories) ? campaign.categories : [])
    .flatMap((item: any) => [item?.categoryName, item?.subcategoryName])
    .filter(Boolean);

  return uniqueSelectionLabels([
    campaign?.campaignTitle,
    campaign?.campaignCategory,
    campaign?.campaignSubcategory,
    campaign?.campaignType,
    campaign?.influencerTier,
    campaign?.targetCountry,
    campaign?.creatorContentLanguage,
    campaign?.audienceContentLanguage,
    campaign?.platformSelection,
    campaign?.hashtags,
    categoryPairs,
  ]).slice(0, 8);
}

function getCreatorSelectionLabels(report: any) {
  if (!report) return [];

  const categoryLabels = (Array.isArray(report?.categories) ? report.categories : [])
    .flatMap((item: any) => {
      if (typeof item === 'string') return [item];
      return [item?.categoryName, item?.subcategoryName, item?.name, item?.label];
    })
    .filter(Boolean);

  const interestLabels = (Array.isArray(report?.audience?.interests)
    ? report.audience.interests
    : [])
    .map((item: any) => item?.name || item?.code || item?.label)
    .filter(Boolean);

  const hashtagLabels = (Array.isArray(report?.hashtags) ? report.hashtags : [])
    .map((item: any) => item?.tag || item?.name || item)
    .filter(Boolean);

  return uniqueSelectionLabels([
    report?.bio,
    report?.country,
    report?.language?.name,
    categoryLabels,
    interestLabels,
    hashtagLabels,
  ]).slice(0, 10);
}

function getMatchingSelectionLabels(campaignLabels: string[], creatorLabels: string[]) {
  const campaignLower = campaignLabels.map((item) => item.toLowerCase());

  return creatorLabels.filter((creatorLabel) => {
    const normalized = creatorLabel.toLowerCase();
    if (!normalized) return false;

    return campaignLower.some((campaignLabel) => {
      return campaignLabel.includes(normalized) || normalized.includes(campaignLabel);
    });
  });
}

function getCampaignDeliverableSummary(campaign: any) {
  const text = [
    campaign?.campaignTitle,
    campaign?.description,
    campaign?.campaignType,
    campaign?.additionalNotes,
    campaign?.contentFormats,
    campaign?.platformSelection,
  ]
    .map(stringifySelectionValue)
    .join(' ')
    .toLowerCase();

  const deliverables: string[] = [];

  if (/reel|short|video/.test(text)) deliverables.push('short-form video');
  if (/story|stories/.test(text)) deliverables.push('stories');
  if (/post|carousel|feed/.test(text)) deliverables.push('feed posts');
  if (/youtube|long form|integration/.test(text)) deliverables.push('video integrations');
  if (/live|stream/.test(text)) deliverables.push('live content');

  return uniqueSelectionLabels(deliverables).slice(0, 3).join(', ');
}

function buildProfileSelectionReasons({
  campaign,
  report,
  platform,
}: {
  campaign: BrandCampaignItem | null;
  report: (InfluencerReport & { _id?: string }) | null;
  platform: Platform | null | string;
}) {
  if (!report) return [];

  const campaignTitle =
    String((campaign as any)?.campaignTitle || '').trim() || 'this campaign';

  const creatorName =
    String(report?.name || report?.fullname || report?.username || report?.handle || 'This creator').trim();

  const normalizedPlatform = normalizePlatform((report?.provider as Platform | null) ?? (platform as Platform | null));
  const campaignLabels = getCampaignSelectionLabels(campaign);
  const creatorLabels = getCreatorSelectionLabels(report);
  const matchingLabels = getMatchingSelectionLabels(campaignLabels, creatorLabels).slice(0, 3);

  const followers = toSelectionNumber(report?.followers);
  const engagementRate = toSelectionNumber(report?.engagementRate);
  const avgViews = toSelectionNumber(report?.avgViews || report?.avgReelsPlays || report?.stats?.avgViews?.value);
  const estimatedReach = Math.max(
    avgViews,
    Math.round(followers * Math.min(0.28, Math.max(0.035, (engagementRate > 1 ? engagementRate / 100 : engagementRate) + 0.045)))
  );

  const credibilityRaw = toSelectionNumber(report?.audience?.credibility);
  const credibilityPct = credibilityRaw > 1 ? credibilityRaw : credibilityRaw * 100;
  const topCountries = getWeightedTopNames(report?.audience?.geoCountries, 3);
  const topLanguages = getWeightedTopNames(report?.audience?.languages, 2);
  const deliverableSummary = getCampaignDeliverableSummary(campaign);

  const reasons: string[] = [];

  if (matchingLabels.length) {
    reasons.push(
      `${creatorName} is a strong fit for ${campaignTitle} because their profile signals match ${matchingLabels.join(', ')}, which aligns with the campaign focus.`
    );
  } else {
    reasons.push(
      `${creatorName} is selected for ${campaignTitle} because their ${normalizedPlatform} profile, content style, and available audience data are relevant for this campaign.`
    );
  }

  reasons.push(
    `Performance fit: ${formatSelectionCompact(followers)} followers, ${formatSelectionPercentValue(engagementRate)} engagement, and about ${formatSelectionCompact(estimatedReach)} estimated reach support the creator's selection${deliverableSummary ? ` for ${deliverableSummary}` : ''}.`
  );

  if (credibilityPct > 0 || topCountries.length || topLanguages.length) {
    const audienceParts = [
      credibilityPct > 0 ? `${Math.round(credibilityPct)}% audience credibility` : '',
      topCountries.length ? `top geography in ${topCountries.join(', ')}` : '',
      topLanguages.length ? `language signals around ${topLanguages.join(', ')}` : '',
    ].filter(Boolean);

    reasons.push(
      `Audience quality also supports the match with ${audienceParts.join(', ')}, helping validate the campaign targeting.`
    );
  } else {
    reasons.push(
      `The selection is supported by measurable creator performance and profile relevance, even before the pricing estimate is generated.`
    );
  }

  return reasons.slice(0, 4);
}

function SelectionReasonCard({
  loading,
  reasons,
  campaignTitle,
}: {
  loading: boolean;
  reasons: string[];
  campaignTitle?: string | null;
}) {
  if (!loading && !reasons.length) return null;

  return (
    <SectionCard
      title="Selection Reason"
      eyebrow="Campaign fit"
      className="overflow-hidden"
    >
      <div className="rounded-[22px] border border-[#efe8dd] bg-gradient-to-br from-[#fffdfa] via-white to-[#fff7e8] p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm leading-6 text-[#7d7569]">
              Why this creator is recommended{campaignTitle ? ` for ${campaignTitle}` : ''}.
            </p>
          </div>

          <span className="w-fit rounded-full border border-[#efe8dd] bg-white px-3 py-1 text-[11px] font-semibold text-[#7d7569]">
            AI Match Summary
          </span>
        </div>

        {loading ? (
          <div className="mt-4 space-y-3">
            {[0, 1, 2].map((item) => (
              <div
                key={item}
                className="h-[58px] animate-pulse rounded-[18px] border border-[#f0e7da] bg-white/80"
              />
            ))}
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {reasons.map((reason, index) => (
              <div
                key={`${reason}-${index}`}
                className="flex gap-3 rounded-[18px] border border-[#f0e7da] bg-white/85 px-4 py-3 shadow-[0_10px_24px_rgba(15,23,42,0.035)]"
              >
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#111111] text-[11px] font-bold text-white">
                  {index + 1}
                </div>

                <p className="text-sm leading-6 text-[#5f5a52]">
                  {reason}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </SectionCard>
  );
}

type YouTubeMediaKitVideo = {
  videoId?: string;
  title?: string;
  description?: string;
  thumbnail?: string;
  publishedAt?: string;
  views?: number;
  likes?: number;
  comments?: number;
  url?: string;
};

type YouTubeMediaKitData = {
  creatorOverview?: {
    creatorName?: string;
    channelName?: string;
    profilePhoto?: string;
    bannerImage?: string;
    category?: string;
    creatorTier?: string;
    primaryLanguage?: string;
    country?: string;
    estimatedAudienceCountry?: string;
    countryConfidence?: number;
    yearsOnYouTube?: number;
    activeSinceLabel?: string;
  };
  coreMetrics?: {
    subscribers?: number;
    totalViews?: number;
    totalVideos?: number;
    avgViews?: number;
    medianViews?: number;
    avgLikes?: number;
    avgComments?: number;
    engagementRate?: number;
    viewToSubscriberRatio?: number;
    recentUploadDate?: string;
    uploadsLast30Days?: number;
    uploadsLast90Days?: number;
    uploadsLast2Years?: number;
  };
  performanceScores?: {
    engagementScore?: number;
    consistencyScore?: number;
    authenticityScore?: number;
    brandSafetyScore?: number;
    sponsorshipScore?: number;
    relevancyScore?: number;
    campaignFitScore?: number;
    nicheFitScore?: number;
  };
  audienceInsights?: {
    estimatedAudienceCountries?: { country: string; percentage: number }[];
    interestCategories?: string[];
    contentLanguage?: string;
  };
  brandFit?: {
    matchedCampaignKeyword?: string;
    matchedTopics?: string[];
    campaignFit?: string;
    whyThisCreatorFits?: string[];
  };
  contentAnalysis?: {
    contentType?: string;
    uploadFrequency?: string;
    shortsPercentage?: number;
    longFormPercentage?: number;
    averageVideoLengthMinutes?: number | null;
    recentVideoThemes?: string[];
  };
  sponsorshipAnalysis?: {
    sponsoredVideosDetected?: number;
    sponsorshipFrequency?: number;
    recentSponsors?: string[];
    promoCodeMentions?: number;
    affiliateLinksDetected?: boolean;
    collaborationReadiness?: string;
  };
  brandSafety?: {
    score?: number;
    riskLevel?: string;
    flags?: string[];
    safeCategories?: string[];
  };
  topPerformingVideos?: YouTubeMediaKitVideo[];
  recentVideos?: YouTubeMediaKitVideo[];
  campaignPrediction?: {
    expectedViewsLow?: number;
    expectedViewsHigh?: number;
    expectedEngagementLow?: number;
    expectedEngagementHigh?: number;
    recommendedDeliverables?: string[];
    budgetFit?: string;
  };
  contact?: {
    hasContactInfo?: boolean;
    maskedEmail?: string;
    email?: string;
    rawEmail?: string;
    youtubeAboutEmail?: string;
    emails?: string[];
    totalEmails?: string[];
    website?: string;
    socialLinks?: { platform: string; url: string }[];
  };
  collabGlamRecommendation?: {
    recommendation?: string;
    summary?: string;
  };
};

async function fetchDetailPanelYouTubeMediaKit(
  channelId: string,
  queryValues: Record<string, string>
) {
  const params = new URLSearchParams();

  ['keyword', 'category', 'country'].forEach((key) => {
    const value = String(queryValues[key] || '').trim();
    if (value) params.set(key, value);
  });

  const query = params.toString() ? `?${params.toString()}` : '';
  const res = await fetch(
    getDetailPanelApiUrl(`/youtube-data/media-kit/${encodeURIComponent(channelId)}${query}`),
    {
      method: 'GET',
      credentials: 'include',
    }
  );

  const json = await res.json().catch(() => ({}));

  if (!res.ok || json?.success === false) {
    throw new Error(json?.error || json?.message || 'Failed to load YouTube media kit');
  }

  return (json?.data || null) as YouTubeMediaKitData | null;
}

async function fetchDetailPanelYouTubeAdvancedAnalytics({
  channelId,
  brandId,
  calculationMethod = 'average',
}: {
  channelId: string;
  brandId?: string;
  calculationMethod?: 'median' | 'average';
}) {
  const safeChannelId = String(channelId || '').trim();

  if (!safeChannelId) {
    throw new Error('Missing YouTube channel ID');
  }

  const params = new URLSearchParams({
    platform: 'youtube',
    userId: safeChannelId,
    calculationMethod,
  });

  const safeBrandId = String(brandId || '').trim();
  const safeAdminId = getLocalStorageValue('adminId');

  if (safeBrandId) {
    params.set('brandId', safeBrandId);
  } else if (safeAdminId) {
    params.set('adminId', safeAdminId);
  }

  const response = await fetch(`${API_REPORT_ENDPOINT}?${params.toString()}`, {
    method: 'GET',
    credentials: 'include',
  });

  const apiRaw = await response.json().catch(() => ({}));

  if (isReportLimitExceededPayload(apiRaw, response.status)) {
    throw createReportApiError(apiRaw, response.status, 'Report limit exceeded');
  }

  if (!response.ok || apiRaw?.error) {
    const message =
      apiRaw?.message ||
      apiRaw?.msg ||
      (typeof apiRaw?.error === 'string'
        ? apiRaw.error
        : `Failed to load advanced analytics (${response.status})`);

    throw createReportApiError(apiRaw, response.status, message);
  }

  const normalized = normalizeReport(apiRaw, 'youtube');
  const report = buildPrimaryReport(normalized, apiRaw, 'youtube', safeChannelId);

  if (!report) {
    throw new Error('Advanced analytics loaded, but report data could not be read.');
  }

  return {
    raw: apiRaw,
    report,
    fetchedAt:
      typeof apiRaw?._lastFetchedAt === 'string'
        ? apiRaw._lastFetchedAt
        : new Date().toISOString(),
  };
}

function formatYouTubeMediaKitNumber(value?: number | string | null) {
  const n = Number(value || 0);
  if (!Number.isFinite(n) || n <= 0) return '—';

  return new Intl.NumberFormat('en', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(n);
}

function formatYouTubeMediaKitFullNumber(value?: number | string | null) {
  const n = Number(value || 0);
  if (!Number.isFinite(n) || n <= 0) return '—';
  return new Intl.NumberFormat('en').format(n);
}

function formatYouTubeMediaKitPercent(value?: number | string | null) {
  const n = Number(value || 0);
  if (!Number.isFinite(n)) return '0%';
  return `${Math.round(n * 100) / 100}%`;
}

function formatYouTubeMediaKitDate(value?: string | null) {
  if (!value) return '—';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  return date.toLocaleDateString('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function scoreYouTubeMediaKitValue(value?: number | string | null) {
  const n = Number(value || 0);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function getYouTubeMediaKitScoreTextClass(value?: number | string | null) {
  const score = scoreYouTubeMediaKitValue(value);
if (score >= 75) return 'text-[#16a34a]';
  if (score >= 35) return 'text-[#b7791f]';
  return 'text-[#dc2626]';
}

function getYouTubeMediaKitScoreBarClass(value?: number | string | null) {
  const score = scoreYouTubeMediaKitValue(value);
  if (score >= 75) return 'bg-[#c9ffde]';
  if (score >= 35) return 'bg-[#f59e0b]';
  return 'bg-[#dc2626]';
}

function getCleanYouTubeMediaKitSummary(value?: string | null) {
  return String(value || '')
    .replace(/\bYouTube creator\b/gi, 'creator')
    .replace(/\bYoutube creator\b/gi, 'creator')
    .replace(/\bcampaign fit score\b/gi, 'match score')
    .replace(/\bcampaign-fit score\b/gi, 'match score')
    .replace(/\s+/g, ' ')
    .trim();
}

function proxyYouTubeMediaKitImageUrl(url?: string | null) {
  const raw = String(url || '').trim();
  if (!raw) return '';
  if (!/^https?:\/\//i.test(raw)) return raw;
  return getDetailPanelApiUrl(`/youtube-data/image-proxy?url=${encodeURIComponent(raw)}`);
}

function maskEmailFromFrontend(email?: string | null) {
  const raw = String(email || '').trim();
  if (!raw || !raw.includes('@')) return '';

  const [, domain] = raw.split('@');
  if (!domain) return '';

  const cleanDomain = domain.trim();
  if (!cleanDomain) return '';

  return `xxxxxxxx@${cleanDomain}`;
}

function getFrontendMaskedMediaKitEmail(contact?: YouTubeMediaKitData['contact'] | null) {
  const candidate =
    contact?.rawEmail ||
    contact?.email ||
    contact?.youtubeAboutEmail ||
    contact?.maskedEmail ||
    contact?.totalEmails?.[0] ||
    contact?.emails?.[0] ||
    '';

  return maskEmailFromFrontend(candidate);
}

function getYouTubeMediaKitHeroBackgroundImage(data?: YouTubeMediaKitData | null) {
  const banner = data?.creatorOverview?.bannerImage;
  if (banner) return banner;

  const videoImage =
    data?.topPerformingVideos?.find((video) => video.thumbnail)?.thumbnail ||
    data?.recentVideos?.find((video) => video.thumbnail)?.thumbnail ||
    '';

  return videoImage || data?.creatorOverview?.profilePhoto || '';
}

function YouTubeMediaKitPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex rounded-full border border-[#efdba5] bg-[#fffaf0] px-3 py-1 text-[12px] font-medium leading-none text-[#8a641c]">
      {children}
    </span>
  );
}

function YouTubeMediaKitMetricCard({
  label,
  value,
  sub,
  icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="h-full rounded-[24px] border border-[#eadfcb] bg-white px-5 py-5 shadow-[0_12px_30px_rgba(120,83,20,0.05)]">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-[#fff2c7] text-[#9a6500]">
        {icon || <Sparkles className="h-5 w-5" />}
      </div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9a8a73]">{label}</p>
      <p className="mt-2 text-[26px] font-extrabold leading-none tracking-tight text-[#111111]">{value}</p>
      {sub ? <p className="mt-3 text-[12px] leading-5 text-[#7d725f]">{sub}</p> : null}
    </div>
  );
}

function YouTubeMediaKitScoreCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value?: number;
  hint?: string;
}) {
  const finalValue = scoreYouTubeMediaKitValue(value);

  return (
    <div className="h-full rounded-[24px] border border-[#eadfcb] bg-white px-5 py-5 shadow-[0_12px_30px_rgba(120,83,20,0.05)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#fff2c7] text-[#9a6500]">
          {icon}
        </div>
        <div className="text-right">
          <p className={`text-[30px] font-extrabold leading-none tracking-tight ${getYouTubeMediaKitScoreTextClass(finalValue)}`}>
            {finalValue}
          </p>
          <p className="mt-1 text-[11px] font-semibold text-[#8a7d68]">/100</p>
        </div>
      </div>
      <p className="mt-5 text-[14px] font-semibold text-[#111111]">{label}</p>
      {hint ? <p className="mt-1 text-[12px] leading-5 text-[#7d725f]">{hint}</p> : null}
      <div className="mt-5 h-2 overflow-hidden rounded-full bg-[#eadfcb]">
        <div
          className={`h-full rounded-full ${getYouTubeMediaKitScoreBarClass(finalValue)}`}
          style={{ width: `${finalValue}%` }}
        />
      </div>
    </div>
  );
}

function YouTubeMediaKitSection({
  title,
  icon,
  children,
  className = '',
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-[24px] border border-[#eadfcb] bg-white p-5 shadow-[0_12px_30px_rgba(120,83,20,0.05)] ${className}`}>
      <div className="mb-5 flex items-center gap-2">
        {icon ? <span className="text-[#b7791f]">{icon}</span> : null}
        <h2 className="text-[16px] font-semibold text-[#222222]">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function YouTubeMediaKitProgress({ value }: { value?: number }) {
  const finalValue = Math.max(0, Math.min(100, Number(value || 0)));

  return (
    <div className="h-2 overflow-hidden rounded-full bg-[#eadfcb]">
      <div className="h-full rounded-full bg-[#d99707]" style={{ width: `${finalValue}%` }} />
    </div>
  );
}

function YouTubeMediaKitPanelContent({
  loading,
  error,
  data,
  fallbackReport,
}: {
  loading: boolean;
  error: string | null;
  data: YouTubeMediaKitData | null;
  fallbackReport: InfluencerReport | null;
}) {
  if (loading) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <div className="max-w-[560px] rounded-[24px] border border-[#eadfcb] bg-white p-8 text-center shadow-[0_12px_30px_rgba(120,83,20,0.05)]">
          <div className="mx-auto flex h-14 w-14 animate-pulse items-center justify-center rounded-full bg-[#fff2c7] text-[#9a6500]">
            <Sparkles className="h-7 w-7" />
          </div>
          <h1 className="mt-5 text-[22px] font-semibold text-[#111111]">Media kit Loading</h1>
          <p className="mt-2 text-[13px] leading-6 text-[#7d725f]">
            Preparing audience, authenticity, performance, safety, sponsorship, and campaign prediction insights.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <div className="max-w-[560px] rounded-[24px] border border-red-100 bg-white p-8 text-center shadow-[0_12px_30px_rgba(120,83,20,0.05)]">
          <h1 className="text-[22px] font-semibold text-[#111111]">Media kit unavailable</h1>
          <p className="mt-2 text-[13px] leading-6 text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mb-4 rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4 text-xs text-gray-600">
        No YouTube media kit data yet. Try opening the creator again.
      </div>
    );
  }

  const overview = data.creatorOverview;
  const metrics = data.coreMetrics;
  const scores = data.performanceScores;
  const brandFit = data.brandFit;
  const content = data.contentAnalysis;
  const sponsorship = data.sponsorshipAnalysis;
  const prediction = data.campaignPrediction;
  const contact = data.contact;
  const frontendMaskedEmail = getFrontendMaskedMediaKitEmail(contact);
  const recommendation = data.collabGlamRecommendation;
  const topVideos = data.topPerformingVideos || [];
  const recentVideos = data.recentVideos || [];
  const heroBackgroundImage = getYouTubeMediaKitHeroBackgroundImage(data);
  const displayName =
    overview?.creatorName ||
    overview?.channelName ||
    fallbackReport?.name ||
    fallbackReport?.fullname ||
    fallbackReport?.username ||
    'Creator';
  const fitScore = scoreYouTubeMediaKitValue(scores?.campaignFitScore || scores?.relevancyScore);

  return (
    <div className="relative min-h-full bg-white">
      <div className="relative z-10 mx-auto w-full max-w-full px-0 py-0">
        <section className="relative overflow-hidden rounded-[24px] border border-[#eadfcb] bg-white shadow-[0_12px_30px_rgba(120,83,20,0.05)]">
          {heroBackgroundImage ? (
            <div
              className="absolute inset-0 bg-cover bg-center opacity-[0.12]"
              style={{ backgroundImage: `url(${proxyYouTubeMediaKitImageUrl(heroBackgroundImage)})` }}
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-br from-white via-white/95 to-[#fffaf0]/85" />

          <div className="relative grid gap-0 lg:grid-cols-[1.18fr_0.82fr]">
            <div className="p-7 sm:p-9">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                <div className="h-28 w-28 shrink-0 overflow-hidden rounded-full border-4 border-white bg-[#f7efe0] shadow-[0_8px_22px_rgba(0,0,0,0.10)] ring-1 ring-[#eadfcb]">
                  {overview?.profilePhoto || fallbackReport?.picture ? (
                    <img
                      src={proxyYouTubeMediaKitImageUrl(overview?.profilePhoto || fallbackReport?.picture)}
                      alt={displayName}
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-4xl font-black text-[#8a6a2a]">
                      {displayName.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <div className="mb-3 flex flex-wrap gap-2">
                    {overview?.creatorTier ? <YouTubeMediaKitPill>{overview.creatorTier}</YouTubeMediaKitPill> : null}
                    {overview?.category ? <YouTubeMediaKitPill>{overview.category}</YouTubeMediaKitPill> : null}
                    {overview?.primaryLanguage ? <YouTubeMediaKitPill>{overview.primaryLanguage}</YouTubeMediaKitPill> : null}
                  </div>
                  <h1 className="text-[34px] font-extrabold leading-tight tracking-tight text-[#050505] sm:text-[42px]">
                    {displayName}
                  </h1>
                  <p className="mt-3 max-w-[760px] line-clamp-3 text-sm leading-6 text-[#6f6658]">
                    {getCleanYouTubeMediaKitSummary(recommendation?.summary) ||
                      'Brand-ready creator profile with performance, audience, safety, and match-score signals.'}
                  </p>
                  {frontendMaskedEmail ? (
                    <div className="mt-4 inline-flex max-w-full items-center gap-2 rounded-full border border-[#eadfcb] bg-white/85 px-3.5 py-2 text-xs font-bold text-[#5f4b24] shadow-sm backdrop-blur">
                      <Mail className="h-3.5 w-3.5 shrink-0 text-[#9a6500]" />
                      <span className="truncate">{frontendMaskedEmail}</span>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="border-t border-[#eadfcb] bg-[#fffaf0]/80 p-7 text-[#111111] backdrop-blur-sm sm:p-9 lg:border-l lg:border-t-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#7a6440]">Match score</p>
              <p className="mt-2 text-[46px] font-extrabold leading-none tracking-tight text-[#050505]">{fitScore}</p>
              <p className="mt-2 text-[18px] font-semibold text-[#050505]">
                {brandFit?.campaignFit || recommendation?.recommendation || 'Brand Match'}
              </p>
              <div className="mt-7">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7a6440]">Authenticity</p>
                <p className={`mt-1 text-[30px] font-extrabold ${getYouTubeMediaKitScoreTextClass(scores?.authenticityScore)}`}>
                  {scoreYouTubeMediaKitValue(scores?.authenticityScore)}%
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <YouTubeMediaKitMetricCard label="Subscribers" value={formatYouTubeMediaKitNumber(metrics?.subscribers)} sub={formatYouTubeMediaKitFullNumber(metrics?.subscribers)} icon={<Users className="h-5 w-5" />} />
          <YouTubeMediaKitMetricCard label="Average views" value={formatYouTubeMediaKitNumber(metrics?.avgViews)} sub="Recent video average" icon={<PlayCircle className="h-5 w-5" />} />
          <YouTubeMediaKitMetricCard label="Engagement" value={formatYouTubeMediaKitPercent(metrics?.engagementRate)} sub="Likes + comments / views" icon={<Heart className="h-5 w-5" />} />
          <YouTubeMediaKitMetricCard label="Recent upload" value={formatYouTubeMediaKitDate(metrics?.recentUploadDate)} sub={`${metrics?.uploadsLast2Years || 0} uploads in 2 years`} icon={<CalendarDays className="h-5 w-5" />} />
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <YouTubeMediaKitScoreCard icon={<Target className="h-5 w-5" />} label="Relevancy" value={scores?.relevancyScore} hint="Campaign topic and content match" />
          <YouTubeMediaKitScoreCard icon={<Users className="h-5 w-5" />} label="Authenticity" value={scores?.authenticityScore} hint="Audience quality" />
          <YouTubeMediaKitScoreCard icon={<TrendingUp className="h-5 w-5" />} label="Consistency" value={scores?.consistencyScore} hint="Upload activity and stability" />
        </div>

        <YouTubeMediaKitSection title="Brand Fit" icon={<CheckCircle2 className="h-5 w-5" />} className="mt-6">
          {(brandFit?.whyThisCreatorFits || []).length ? (
            <ul className="space-y-3">
              {brandFit?.whyThisCreatorFits?.slice(0, 5).map((item) => (
                <li key={item} className="flex gap-3 text-[13px] leading-6 text-[#655b4d]">
                  <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#fff2c7] text-[#9a6500]">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[13px] leading-6 text-[#655b4d]">
              This creator has been matched using campaign topic, performance, and creator profile signals.
            </p>
          )}
        </YouTubeMediaKitSection>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <YouTubeMediaKitSection title="Reach & Performance" icon={<BarChart3 className="h-5 w-5" />} className="lg:col-span-2">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <YouTubeMediaKitMetricCard label="Total views" value={formatYouTubeMediaKitNumber(metrics?.totalViews)} sub={formatYouTubeMediaKitFullNumber(metrics?.totalViews)} />
              <YouTubeMediaKitMetricCard label="Total videos" value={formatYouTubeMediaKitFullNumber(metrics?.totalVideos)} />
              <YouTubeMediaKitMetricCard label="Median views" value={formatYouTubeMediaKitNumber(metrics?.medianViews)} />
              <YouTubeMediaKitMetricCard label="Avg likes" value={formatYouTubeMediaKitNumber(metrics?.avgLikes)} />
              <YouTubeMediaKitMetricCard label="Avg comments" value={formatYouTubeMediaKitNumber(metrics?.avgComments)} />
              <YouTubeMediaKitMetricCard label="View/sub ratio" value={formatYouTubeMediaKitPercent(metrics?.viewToSubscriberRatio)} />
            </div>
          </YouTubeMediaKitSection>

          <YouTubeMediaKitSection title="Content Breakdown" icon={<Zap className="h-5 w-5" />}>
            <div className="space-y-4">
              <div>
                <div className="mb-2 flex justify-between text-[13px] font-semibold text-[#111111]">
                  <span>Long-form</span>
                  <span>{content?.longFormPercentage || 0}%</span>
                </div>
                <YouTubeMediaKitProgress value={content?.longFormPercentage || 0} />
              </div>
              <div>
                <div className="mb-2 flex justify-between text-[13px] font-semibold text-[#111111]">
                  <span>Shorts</span>
                  <span>{content?.shortsPercentage || 0}%</span>
                </div>
                <YouTubeMediaKitProgress value={content?.shortsPercentage || 0} />
              </div>
              <div className="rounded-[18px] border border-[#eadfcb] bg-[#fffaf0] p-4 text-[13px] font-medium text-[#6f5a2c]">
                {content?.contentType || 'Original creator content'}
              </div>
              {(content?.recentVideoThemes || []).length ? (
                <div className="flex flex-wrap gap-2">
                  {content?.recentVideoThemes?.slice(0, 6).map((item) => <YouTubeMediaKitPill key={item}>{item}</YouTubeMediaKitPill>)}
                </div>
              ) : null}
            </div>
          </YouTubeMediaKitSection>
        </div>

        <YouTubeMediaKitSection title="Sponsorship Readiness" icon={<Sparkles className="h-5 w-5" />} className="mt-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <YouTubeMediaKitMetricCard label="Sponsored videos" value={sponsorship?.sponsoredVideosDetected || 0} />
            <YouTubeMediaKitMetricCard label="Sponsorship frequency" value={formatYouTubeMediaKitPercent(sponsorship?.sponsorshipFrequency)} />
            <YouTubeMediaKitMetricCard label="Promo mentions" value={sponsorship?.promoCodeMentions || 0} />
            <YouTubeMediaKitMetricCard label="Collab readiness" value={sponsorship?.collaborationReadiness || 'Review'} />
          </div>
          {(sponsorship?.recentSponsors || []).length ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {sponsorship?.recentSponsors?.slice(0, 8).map((item) => <YouTubeMediaKitPill key={item}>{item}</YouTubeMediaKitPill>)}
            </div>
          ) : null}
        </YouTubeMediaKitSection>

        {/* <YouTubeMediaKitSection title="Proof of Performance" icon={<BarChart3 className="h-5 w-5" />} className="mt-6">
          <div className="grid gap-4 lg:grid-cols-2">
            {(topVideos.length ? topVideos : recentVideos).slice(0, 6).map((video) => (
              <div
                key={video.videoId || video.url || video.title}
                className="grid gap-3 rounded-[20px] border border-[#f1e2c2] bg-[#fffdf9] p-3 sm:grid-cols-[130px_1fr]"
              >
                <div className="aspect-video overflow-hidden rounded-[16px] bg-[#f7efe0]">
                  {video.thumbnail ? (
                    <img
                      src={proxyYouTubeMediaKitImageUrl(video.thumbnail)}
                      alt={video.title || 'Video'}
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-[#9a6500]">
                      <PlayCircle className="h-7 w-7" />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="line-clamp-2 text-sm font-bold leading-5 text-black">{video.title || 'Untitled video'}</p>
                  <p className="mt-2 text-xs font-semibold text-[#7d725f]">
                    {formatYouTubeMediaKitNumber(video.views)} views · {formatYouTubeMediaKitNumber(video.likes)} likes · {formatYouTubeMediaKitDate(video.publishedAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </YouTubeMediaKitSection> */}

        <section className="mt-6 rounded-[24px] border border-[#eadfcb] bg-white p-5 text-[#111111] shadow-[0_12px_30px_rgba(120,83,20,0.05)]">
          <div className="grid gap-6 md:grid-cols-[1fr_1fr]">
            <div>
              <div className="flex items-center gap-2 text-[#b7791f]"><TrendingUp className="h-5 w-5" /><h4 className="text-[16px] font-semibold text-[#222222]">Predicted Campaign Impact</h4></div>
              <p className="mt-5 text-[28px] font-extrabold leading-none tracking-tight text-[#050505]">
                {formatYouTubeMediaKitNumber(prediction?.expectedViewsLow)} - {formatYouTubeMediaKitNumber(prediction?.expectedViewsHigh)}
              </p>
              <p className="mt-2 text-[13px] text-[#7d725f]">Predicted views based on recent performance</p>
              <p className="mt-5 text-[26px] font-extrabold leading-none tracking-tight text-[#050505]">
                {formatYouTubeMediaKitNumber(prediction?.expectedEngagementLow)} - {formatYouTubeMediaKitNumber(prediction?.expectedEngagementHigh)}
              </p>
              <p className="mt-2 text-[13px] text-[#7d725f]">Predicted engagements</p>
            </div>
            <div>
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9a8a73]">Recommended deliverables</p>
              <div className="space-y-2">
                {(prediction?.recommendedDeliverables || []).length ? (
                  prediction?.recommendedDeliverables?.map((item) => (
                    <div key={item} className="flex items-center gap-2 text-[13px] text-[#655b4d]"><CheckCircle2 className="h-4 w-4 text-[#9a6500]" /> {item}</div>
                  ))
                ) : (
                  <div className="flex items-center gap-2 text-[13px] text-[#655b4d]"><CheckCircle2 className="h-4 w-4 text-[#9a6500]" /> Creator content integration</div>
                )}
              </div>
              <div className="mt-6 rounded-[16px] border border-[#eadfcb] bg-[#fffaf0] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9a8a73]">Budget fit for this creator</p>
                <p className="mt-1 text-xl font-semibold text-[#111111]">{prediction?.budgetFit || 'Medium'}</p>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}



function getAdvancedAudiencePercent(value: any) {
  const n = toNumber(value);

  if (!Number.isFinite(n) || n <= 0) return 0;

  const percent = n <= 1 ? n * 100 : n;
  return Math.max(0, Math.min(100, Math.round(percent * 10) / 10));
}

function YouTubeAdvancedAnalyticsPanel({
  loading,
  error,
  report,
  fetchedAt,
}: {
  loading: boolean;
  error: string | null;
  report: InfluencerReport | null;
  fetchedAt?: string | null;
}) {
  if (loading) {
    return (
      <YouTubeMediaKitSection
        title="Graphs & Insights"
        icon={<BarChart3 className="h-5 w-5" />}
        className="mt-6"
      >
        <div className="flex items-center gap-3 rounded-[18px] bg-[#fff8e6] p-4 text-sm font-semibold text-[#7a5a16]">
          <RefreshCw className="h-4 w-4 animate-spin" />
          Loading Modash graphs and insights...
        </div>
      </YouTubeMediaKitSection>
    );
  }

  if (error) {
    return (
      <YouTubeMediaKitSection
        title="Graphs & Insights"
        icon={<BarChart3 className="h-5 w-5" />}
        className="mt-6"
      >
        <div className="rounded-[18px] border border-red-100 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      </YouTubeMediaKitSection>
    );
  }

  if (!report) return null;

  const followers = toNumber(report.followers || report.stats?.followers?.value);
  const avgViews = toNumber(
    report.avgViews ||
      report.avgReelsPlays ||
      report.stats?.avgViews?.value
  );
  const avgLikes = toNumber(report.avgLikes || report.stats?.avgLikes?.value);
  const credibilityScore = getAdvancedAudiencePercent(report.audience?.credibility);

  const recentPosts = Array.isArray(report.recentPosts) ? report.recentPosts : [];
  const popularPosts = Array.isArray(report.popularPosts) ? report.popularPosts : [];
  const statHistorySource = pickBestTrendHistory(
    report.statHistory,
    (report as any)?.statsByContentType?.all?.statHistory,
    (report as any)?.statsByContentType?.reels?.statHistory,
    (report as any)?.profile?.statHistory
  );

  const trendData = (() => {
    if (statHistorySource.length) {
      const normalizedHistory = statHistorySource.map(normalizeTrendPoint);
      const labels = normalizedHistory.map((item, index) =>
        parseMonthLabel(String(item.month || ''), index)
      );

      const hasFollowersHistory = normalizedHistory.some((item) => item.followers > 0);
      const hasViewsHistory = normalizedHistory.some((item) => item.avgViews > 0);

      return {
        organicTrend: normalizedHistory.map((item) => item.avgLikes),
        sponsoredTrend: hasFollowersHistory
          ? normalizedHistory.map((item) => item.followers)
          : hasViewsHistory
            ? normalizedHistory.map((item) => item.avgViews)
            : [],
        trendLabels: labels,
        secondaryTrendLabel: hasFollowersHistory || followers > 0 ? 'Followers' : 'Avg Views',
      };
    }

    const fallbackPosts = recentPosts.slice(0, 12);
    const labels = fallbackPosts.map((post, index) =>
      parseMonthLabel(
        String(post?.createdAt ?? post?.publishedAt ?? post?.date ?? ''),
        index
      )
    );

    return {
      organicTrend: fallbackPosts.map((post) => toNumber(post?.likes)),
      sponsoredTrend: fallbackPosts.map((post) =>
        toNumber(post?.views ?? post?.plays ?? post?.likes)
      ),
      trendLabels: labels.length ? labels : undefined,
      secondaryTrendLabel: 'Views',
    };
  })();

  const audienceAge = (report.audience?.ages ?? []).map((item: any) => ({
    label: item.code,
    value: getAdvancedAudiencePercent(item.weight ?? item.value),
  }));

  const audienceGender = (report.audience?.genders ?? []).map((item: any) => ({
    label:
      item.code === 'MALE'
        ? 'Male'
        : item.code === 'FEMALE'
          ? 'Female'
          : item.code,
    value: getAdvancedAudiencePercent(item.weight ?? item.value),
  }));

  const topCountries = (report.audience?.geoCountries ?? [])
    .slice(0, 4)
    .map((item: any) => ({
      name: item.name || item.code || 'Unknown',
      value: getAdvancedAudiencePercent(item.weight ?? item.value),
    }));

  const topLanguages = (report.audience?.languages ?? [])
    .slice(0, 4)
    .map((item: any) => ({
      label: item.name || item.code || 'Unknown',
      value: getAdvancedAudiencePercent(item.weight ?? item.value),
    }));

  return (
    <div className="mt-6 space-y-6">
      <PerformanceTrendCard
        key="youtube-media-kit-performance-trend"
        organicTrend={trendData.organicTrend}
        sponsoredTrend={trendData.sponsoredTrend}
        trendLabels={trendData.trendLabels}
        statHistory={statHistorySource.map(normalizeTrendPoint)}
        secondaryLabel={trendData.secondaryTrendLabel}
        primaryValue={avgLikes}
        secondaryValue={trendData.secondaryTrendLabel === 'Followers' ? followers : avgViews}
      />

      <AudienceIntelligenceCard
        ageData={audienceAge}
        genderData={audienceGender}
        topCountries={topCountries}
        credibilityScore={credibilityScore}
        topLanguages={topLanguages}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_420px]">
        <RecentPostsTable
          posts={recentPosts.slice(0, 5).map((post) => ({ ...post, url: undefined }))}
        />
        <PopularContentPanel
          posts={(popularPosts.length ? popularPosts : recentPosts)
            .slice(0, 2)
            .map((post) => ({ ...post, url: undefined }))}
        />
      </div>
    </div>
  );
}

export const DetailPanel = React.memo<DetailPanelProps>(
  ({
    open,
    onClose,
    loading,
    error,
    data,
    raw,
    platform,
    emailExists,
    onChangeCalc: _onChangeCalc,
    brandId,
    campaignId: campaignIdProp,
    campaignName: campaignNameProp,
    handle,
    youtubeChannelId: youtubeChannelIdProp,
    lastFetchedAt,
    onRefreshReport,
    connectedProfiles = [],
    onPlatformChange,
    onReportLimitExceeded,
  }) => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const queryCampaignId = searchParams?.get('campaignId') || '';
    const queryCampaignName = searchParams?.get('campaignName') || '';
    const queryChannelId =
      searchParams?.get('channelId') || searchParams?.get('youtubeChannelId') || '';

    const campaignId = String(campaignIdProp || queryCampaignId || '').trim();

    const campaignName = String(
      campaignNameProp || queryCampaignName || ''
    ).trim();

    const hasLockedCampaign = Boolean(campaignId);
    const [hasAnyEmail, setHasAnyEmail] = useState<boolean | null>(null);
    const [checkingEmail, setCheckingEmail] = useState(false);
    const [sendingInvite, setSendingInvite] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(
      lastFetchedAt || null
    );
    const [plan, setPlan] = useState<SubscriptionPlan>('pro');
    const [role, setRole] = useState<UserRole>('viewer');

    const [campaignPickerOpen, setCampaignPickerOpen] = useState(false);
    const [campaignsLoading, setCampaignsLoading] = useState(false);
    const [brandCampaigns, setBrandCampaigns] = useState<BrandCampaignItem[]>([]);
    const [selectedCampaignIds, setSelectedCampaignIds] = useState<string[]>(
      campaignId ? [campaignId] : []
    );
    const [campaignSearch, setCampaignSearch] = useState('');

    const [checkingInvitation, setCheckingInvitation] = useState(false);
    const [invitedCampaignIds, setInvitedCampaignIds] = useState<Set<string>>(
      () => new Set()
    );

    const [rateCardLoading, setRateCardLoading] = useState(false);
    const [rateCardError, setRateCardError] = useState<string | null>(null);
    const [rateCardData, setRateCardData] =
      useState<SuggestedRateCardResponse["data"] | null>(null);

    const [youtubeMediaKit, setYoutubeMediaKit] = useState<YouTubeMediaKitData | null>(null);
    const [youtubeMediaKitLoading, setYoutubeMediaKitLoading] = useState(false);
    const [youtubeMediaKitError, setYoutubeMediaKitError] = useState<string | null>(null);
    const [youtubeAdvancedReport, setYoutubeAdvancedReport] =
      useState<InfluencerReport | null>(null);
    const [youtubeAdvancedLoading, setYoutubeAdvancedLoading] = useState(false);
    const [youtubeAdvancedError, setYoutubeAdvancedError] = useState<string | null>(null);
    const [youtubeAdvancedFetchedAt, setYoutubeAdvancedFetchedAt] = useState<string | null>(null);
    const [youtubeAdvancedRequested, setYoutubeAdvancedRequested] = useState(false);
    const youtubeAdvancedRequestRef = useRef(0);

    const rateCardRequestKeyRef = useRef("");

    const [emailEditorOpen, setEmailEditorOpen] = useState(false);
    const [emailDraft, setEmailDraft] = useState<EmailDraftState | null>(null);

    const [selectedLookalikeReport, setSelectedLookalikeReport] =
      useState<(InfluencerReport & { _id?: string }) | null>(null);
    const [lookalikeReportLoading, setLookalikeReportLoading] = useState(false);
    const [lookalikeReportError, setLookalikeReportError] = useState<string | null>(null);
    const lookalikeReportRequestRef = useRef(0);

    const shouldLockFields = false;

    const hasSectionAccess = (_section: SectionKey) => {
      if (!shouldLockFields) return true;
      return canAccessSection(role, plan, _section);
    };

    useEffect(() => {
      setPlan(getSubscriptionPlan());
      setRole(getUserRole());
    }, []);

    useEffect(() => {
      if (!open) {
        setSelectedLookalikeReport(null);
        setLookalikeReportError(null);
        setLookalikeReportLoading(false);
        lookalikeReportRequestRef.current += 1;
      }
    }, [open]);

    useEffect(() => {
      setSelectedLookalikeReport(null);
      setLookalikeReportError(null);
      setLookalikeReportLoading(false);
      lookalikeReportRequestRef.current += 1;
    }, [handle, platform]);

    useEffect(() => {
      if (!open || !brandId || brandCampaigns.length) return;

      let cancelled = false;

      (async () => {
        try {
          setCampaignsLoading(true);

          const resp = await post<GetByBrandCampaignResp>('/campaign/get-by-brand', {
            brandId,
            page: 1,
            limit: 20,
            status: 'active',
          });

          if (cancelled) return;

          const items = Array.isArray(resp?.data?.items) ? resp.data.items : [];
          setBrandCampaigns(items);
          setSelectedCampaignIds((prev) => {
            if (campaignId) return [campaignId];

            const stillValid = prev.filter((id) =>
              items.some((item) => item.campaignId === id)
            );

            return stillValid;
          });
        } catch {
          if (!cancelled) {
            setBrandCampaigns((prev) => prev);
          }
        } finally {
          if (!cancelled) {
            setCampaignsLoading(false);
          }
        }
      })();

      return () => {
        cancelled = true;
      };
    }, [open, brandId, brandCampaigns.length, campaignId]);

    useEffect(() => {
      setLastUpdatedAt(lastFetchedAt || null);
    }, [lastFetchedAt]);

    useEffect(() => {
      if (campaignId) {
        setSelectedCampaignIds([campaignId]);
        setCampaignPickerOpen(false);
        return;
      }

      setSelectedCampaignIds([]);
    }, [campaignId]);

    useEffect(() => {
      if (!campaignPickerOpen) {
        setCampaignSearch('');
      }
    }, [campaignPickerOpen]);


    useEffect(() => {
      if (!open) {
        setHasAnyEmail(null);
        setCheckingEmail(false);
        return;
      }

      // New invitation flow:
      // Do not fetch or expose influencer email on frontend.
      // Email is resolved privately in backend by channelId when invitation is submitted.
      setHasAnyEmail(null);
      setCheckingEmail(false);
    }, [open]);

    const formattedLastUpdated = lastUpdatedAt
      ? new Date(lastUpdatedAt).toLocaleString()
      : 'Not fetched yet';

    const primaryReport = useMemo(
      () => buildPrimaryReport(data, raw, platform, handle),
      [data, raw, platform, handle]
    );

    const availableProfiles = useMemo<InfluencerReport[]>(() => {
      if (connectedProfiles.length) return connectedProfiles;
      return primaryReport ? [primaryReport] : [];
    }, [connectedProfiles, primaryReport]);

    const currentPlatformProfile = useMemo<InfluencerReport | null>(() => {
      if (!availableProfiles.length) return primaryReport;

      const normalized = String(platform ?? '').toLowerCase();

      return (
        availableProfiles.find(
          (item) => String(item?.provider ?? '').toLowerCase() === normalized
        ) ??
        primaryReport ??
        availableProfiles[0] ??
        null
      );
    }, [availableProfiles, platform, primaryReport]);

    const selectedReport =
      selectedLookalikeReport ?? currentPlatformProfile ?? primaryReport ?? null;

    const activePlatformKey = normalizePlatform(
      ((selectedReport?.provider as Platform | null) ?? platform) as Platform | null
    );

    const youtubeChannelIdForPanel = useMemo(() => {
      if (activePlatformKey !== 'youtube') return '';

      return String(
        youtubeChannelIdProp ||
        queryChannelId ||
        (selectedReport as any)?.youtubeChannelId ||
        (selectedReport as any)?.channelId ||
        selectedReport?.modashId ||
        (raw as any)?.channelId ||
        (raw as any)?.userId ||
        (raw as any)?.profile?.channelId ||
        (raw as any)?.profile?.userId ||
        (data as any)?.channelId ||
        (data as any)?.profile?.channelId ||
        (data as any)?.profile?.userId ||
        ''
      ).trim();
    }, [
      activePlatformKey,
      youtubeChannelIdProp,
      queryChannelId,
      selectedReport,
      raw,
      data,
    ]);

    const isYouTubeMediaKitMode = activePlatformKey === 'youtube' && Boolean(youtubeChannelIdForPanel);

    const youtubeMediaKitQueryValues = useMemo(
      () => ({
        keyword: String(searchParams?.get('keyword') || '').trim(),
        category: String(searchParams?.get('category') || '').trim(),
        country: String(searchParams?.get('country') || '').trim(),
      }),
      [searchParams]
    );

    useEffect(() => {
      let cancelled = false;

      async function loadYouTubeMediaKit() {
        if (!open || !isYouTubeMediaKitMode || !youtubeChannelIdForPanel) {
          setYoutubeMediaKit(null);
          setYoutubeMediaKitError(null);
          setYoutubeMediaKitLoading(false);
          return;
        }

        try {
          setYoutubeMediaKitLoading(true);
          setYoutubeMediaKitError(null);

          const mediaKit = await fetchDetailPanelYouTubeMediaKit(
            youtubeChannelIdForPanel,
            youtubeMediaKitQueryValues
          );

          if (!cancelled) {
            setYoutubeMediaKit(mediaKit);
          }
        } catch (err: any) {
          if (!cancelled) {
            setYoutubeMediaKit(null);
            setYoutubeMediaKitError(err?.message || 'Failed to load YouTube media kit');
          }
        } finally {
          if (!cancelled) {
            setYoutubeMediaKitLoading(false);
          }
        }
      }

      loadYouTubeMediaKit();

      return () => {
        cancelled = true;
      };
    }, [
      open,
      isYouTubeMediaKitMode,
      youtubeChannelIdForPanel,
      youtubeMediaKitQueryValues.keyword,
      youtubeMediaKitQueryValues.category,
      youtubeMediaKitQueryValues.country,
    ]);

    useEffect(() => {
      youtubeAdvancedRequestRef.current += 1;
      setYoutubeAdvancedRequested(false);
      setYoutubeAdvancedReport(null);
      setYoutubeAdvancedError(null);
      setYoutubeAdvancedFetchedAt(null);
      setYoutubeAdvancedLoading(false);
    }, [open, isYouTubeMediaKitMode, youtubeChannelIdForPanel, brandId]);

    const handleShowYouTubeAdvancedAnalytics = async () => {
      if (!youtubeChannelIdForPanel) {
        await Swal.fire(
          'Missing YouTube channel',
          'Could not load advanced analytics because the YouTube channel ID was not found.',
          'warning'
        );
        return;
      }

      const requestId = youtubeAdvancedRequestRef.current + 1;
      youtubeAdvancedRequestRef.current = requestId;

      try {
        setYoutubeAdvancedRequested(true);
        setYoutubeAdvancedLoading(true);
        setYoutubeAdvancedError(null);
        setYoutubeAdvancedReport(null);
        setYoutubeAdvancedFetchedAt(null);

        const result = await fetchDetailPanelYouTubeAdvancedAnalytics({
          channelId: youtubeChannelIdForPanel,
          brandId,
          calculationMethod: 'average',
        });

        if (youtubeAdvancedRequestRef.current !== requestId) return;

        setYoutubeAdvancedReport(result.report);
        setYoutubeAdvancedFetchedAt(result.fetchedAt);
        setLastUpdatedAt(result.fetchedAt);
      } catch (err: any) {
        if (youtubeAdvancedRequestRef.current !== requestId) return;

        setYoutubeAdvancedReport(null);
        setYoutubeAdvancedFetchedAt(null);

        if (isReportLimitExceededError(err)) {
          onReportLimitExceeded?.();
        }

        setYoutubeAdvancedError(
          err?.message || 'Failed to load YouTube advanced analytics'
        );
      } finally {
        if (youtubeAdvancedRequestRef.current === requestId) {
          setYoutubeAdvancedLoading(false);
        }
      }
    };

    const getActiveYoutubeChannelId = (preferDraft = false) => {
      return String(
        (preferDraft ? emailDraft?.channelId : '') ||
          youtubeChannelIdForPanel ||
          youtubeChannelIdProp ||
          queryChannelId ||
          (selectedReport as any)?.channelId ||
          (selectedReport as any)?.youtubeChannelId ||
          selectedReport?.modashId ||
          (raw as any)?.channelId ||
          (raw as any)?.userId ||
          (raw as any)?.profile?.channelId ||
          (raw as any)?.profile?.userId ||
          (data as any)?.channelId ||
          (data as any)?.profile?.channelId ||
          (data as any)?.profile?.userId ||
          ''
      ).trim();
    };

    const displayName = String(
      youtubeMediaKit?.creatorOverview?.creatorName ||
        youtubeMediaKit?.creatorOverview?.channelName ||
        selectedReport?.name ||
        selectedReport?.fullname ||
        selectedReport?.username ||
        handle ||
        'Creator profile'
    ).trim();

    const displayHandle = getSafeCreatorHandle({
      selectedReport,
      raw,
      data,
      handle,
    });

    const editorToLabel = getCreatorToLabel({
      selectedReport,
      raw,
      data,
      handle,
      displayName,
    });

    const getActiveSafeHandle = () => {
      return getBackendInvitationHandle({
        selectedReport,
        raw,
        data,
        handle,
        displayName,
        editorToLabel,
        channelId: getActiveYoutubeChannelId(true),
      });
    };

    const getActivePlatform = () => activePlatformKey as Platform;

    useEffect(() => {
      if (!open || !brandId) {
        setInvitedCampaignIds(new Set());
        return;
      }

      const normalizedPlatform = getActivePlatform();

      if (normalizedPlatform !== 'youtube') {
        setInvitedCampaignIds(new Set());
        return;
      }

      const activeYoutubeChannelId = getActiveYoutubeChannelId(false);

      const safeHandle = getBackendInvitationHandle({
        selectedReport,
        raw,
        data,
        handle,
        displayName,
        editorToLabel,
        channelId: activeYoutubeChannelId,
      });

      if (
        !safeHandle ||
        !/^[A-Za-z0-9._-]+$/.test(safeHandle.replace(/^@/, ''))
      ) {
        setInvitedCampaignIds(new Set());
        return;
      }

      let cancelled = false;

      (async () => {
        try {
          setCheckingInvitation(true);

          const resp = await post<InvitationListResp>('/newinvitations/list', {
            brandId,
            handle: safeHandle,
            platform: 'youtube',
            status: 'invited',
            page: 1,
            limit: 200,
          });

          if (cancelled) return;

          const invitedIds = new Set(
            (Array.isArray(resp?.data) ? resp.data : [])
              .filter((item) => String(item?.status || '').toLowerCase() === 'invited')
              .map(getInvitationCampaignId)
              .filter(Boolean)
          );

          setInvitedCampaignIds(invitedIds);

          setSelectedCampaignIds((prev) => {
            if (campaignId) return [campaignId];
            return prev.filter((id) => !invitedIds.has(id));
          });
        } catch (err) {
          console.error('Failed to fetch invitation list', err);

          if (!cancelled) {
            setInvitedCampaignIds(new Set());
          }
        } finally {
          if (!cancelled) {
            setCheckingInvitation(false);
          }
        }
      })();

      return () => {
        cancelled = true;
      };
    }, [
      open,
      brandId,
      handle,
      campaignId,
      selectedReport,
      raw,
      data,
      displayName,
      editorToLabel,
      youtubeChannelIdForPanel,
      youtubeChannelIdProp,
      queryChannelId,
    ]);

    const activeAvailableProfiles = useMemo<InfluencerReport[]>(() => {
      if (selectedLookalikeReport) return [selectedLookalikeReport];
      return availableProfiles;
    }, [selectedLookalikeReport, availableProfiles]);

    const handleLookalikeSelect = async (item: LookalikePanelItem) => {
      const userId = getLookalikeReportUserId(item);
      const resolvedPlatform = normalizePlatform(
        ((item.raw as any)?.platform ??
          item.platform ??
          item.provider ??
          activePlatformKey) as Platform | null
      );

      if (!userId) {
        await Swal.fire(
          'Missing creator ID',
          'Could not generate a full report because this lookalike does not include a userId.',
          'warning'
        );
        return;
      }

      const requestId = lookalikeReportRequestRef.current + 1;
      lookalikeReportRequestRef.current = requestId;

      setCampaignPickerOpen(false);
      setEmailEditorOpen(false);
      setEmailDraft(null);
      setHasAnyEmail(null);
      setCheckingEmail(false);
      setRateCardData(null);
      setRateCardError(null);
      setSelectedLookalikeReport(null);
      setLookalikeReportError(null);
      setLookalikeReportLoading(true);

      try {
        const params: Record<string, string> = {
          platform: resolvedPlatform,
          userId,
          calculationMethod: 'median',
          force: '1',
        };

        const safeBrandId = String(brandId || '').trim();
        const safeAdminId = getLocalStorageValue('adminId');

        if (safeBrandId) {
          params.brandId = safeBrandId;
        } else if (safeAdminId) {
          params.adminId = safeAdminId;
        }

        const query = new URLSearchParams(params);
        const response = await fetch(`${API_REPORT_ENDPOINT}?${query.toString()}`);
        const apiRaw = await response.json();

        if (isReportLimitExceededPayload(apiRaw, response.status)) {
          throw createReportApiError(
            apiRaw,
            response.status,
            'Report limit exceeded'
          );
        }

        if (!response.ok || apiRaw?.error) {
          const message =
            apiRaw?.message ||
            apiRaw?.msg ||
            (typeof apiRaw?.error === 'string'
              ? apiRaw.error
              : `Failed to generate report (${response.status})`);
          throw createReportApiError(apiRaw, response.status, message);
        }

        const normalized = normalizeReport(apiRaw, resolvedPlatform);
        const fallbackHandle =
          (apiRaw as any)?.profile?.username ??
          (apiRaw as any)?.profile?.handle ??
          (item.raw as any)?.username ??
          item.username ??
          item.handle ??
          null;

        const nextReport = buildPrimaryReport(
          normalized,
          apiRaw,
          resolvedPlatform,
          fallbackHandle
        );

        if (!nextReport) {
          throw new Error('Report generated, but profile data could not be read.');
        }

        if (lookalikeReportRequestRef.current !== requestId) return;

        setSelectedLookalikeReport(nextReport);
        setLastUpdatedAt(
          typeof (apiRaw as any)?._lastFetchedAt === 'string'
            ? (apiRaw as any)._lastFetchedAt
            : new Date().toISOString()
        );

        const nextHandle = String(
          nextReport.handle ?? nextReport.username ?? fallbackHandle ?? ''
        )
          .replace(/^@/, '')
          .trim()
          .toLowerCase();

        if (nextHandle) {
          setCheckingEmail(true);
          try {
            const { email } = await resolveCreatorEmail(`@${nextHandle}`, resolvedPlatform);
            if (lookalikeReportRequestRef.current === requestId) {
              setHasAnyEmail(Boolean(email));
            }
          } catch (emailError) {
            console.error('Failed to check lookalike email status', emailError);
            if (lookalikeReportRequestRef.current === requestId) {
              setHasAnyEmail(null);
            }
          } finally {
            if (lookalikeReportRequestRef.current === requestId) {
              setCheckingEmail(false);
            }
          }
        }
      } catch (err: any) {
        const message =
          err?.response?.data?.message ||
          err?.response?.data?.msg ||
          err?.response?.data?.error ||
          err?.message ||
          'Failed to generate the full lookalike report.';

        const isLimitError =
          isReportLimitExceededError(err) ||
          isReportLimitExceededPayload(
            {
              message,
              response: err?.response?.data,
              payload: err?.payload,
            },
            err?.status || err?.response?.status
          );

        if (isLimitError) {
          if (lookalikeReportRequestRef.current === requestId) {
            setLookalikeReportError(null);
          }

          onReportLimitExceeded?.();
          return;
        }

        if (lookalikeReportRequestRef.current === requestId) {
          setLookalikeReportError(message);
        }

        await Swal.fire('Report unavailable', message, 'error');
      } finally {
        if (lookalikeReportRequestRef.current === requestId) {
          setLookalikeReportLoading(false);
        }
      }
    };

    const activeCampaignIdForPanel = selectedCampaignIds[0] || campaignId || '';

    const activeCampaignForPanel = useMemo<BrandCampaignItem | null>(() => {
      if (!activeCampaignIdForPanel) return null;

      const found = brandCampaigns.find(
        (item) => item.campaignId === activeCampaignIdForPanel
      );

      if (found) return found;

      return {
        campaignId: activeCampaignIdForPanel,
        campaignTitle: campaignName || 'selected campaign',
      };
    }, [activeCampaignIdForPanel, brandCampaigns, campaignName]);

    const selectionReasonItems = useMemo(() => {
      return buildProfileSelectionReasons({
        campaign: activeCampaignForPanel,
        report: selectedReport as (InfluencerReport & { _id?: string }) | null,
        platform: activePlatformKey,
      });
    }, [activeCampaignForPanel, selectedReport, activePlatformKey]);

    const rateCardProfileKey = useMemo(() => {
      if (!open) return "";

      return [
        (selectedReport as any)?._id,
        selectedReport?.modashId,
        selectedReport?.handle,
        selectedReport?.username,
        activePlatformKey,
        selectedCampaignIds[0] || campaignId || "",
      ]
        .filter(Boolean)
        .join(":");
    }, [
      open,
      (selectedReport as any)?._id,
      selectedReport?.modashId,
      selectedReport?.handle,
      selectedReport?.username,
      activePlatformKey,
      selectedCampaignIds,
      campaignId,
    ]);

    useEffect(() => {
      setRateCardData(null);
      setRateCardError(null);
      setRateCardLoading(false);
      rateCardRequestKeyRef.current = "";
    }, [rateCardProfileKey]);

    const panelMediaKit = useMemo<MediaKit | null>(() => {
      if (!selectedReport) return null;

      const profileRoot =
        (raw?.profile as any) ??
        (data?.profile as any) ??
        raw ??
        {};

      const contactList =
        (selectedReport as any)?.contact ??
        (selectedReport as any)?.contacts ??
        profileRoot?.contact ??
        profileRoot?.contacts ??
        [];

      const audienceSource =
        (selectedReport as any)?.audience ??
        profileRoot?.audience ??
        {};

      const countryDemographics = Array.isArray(audienceSource?.geoCountries)
        ? audienceSource.geoCountries
        : [];

      const audienceDemographics = {
        ages: Array.isArray(audienceSource?.ages) ? audienceSource.ages : [],
        genders: Array.isArray(audienceSource?.genders) ? audienceSource.genders : [],
        languages: Array.isArray(audienceSource?.languages) ? audienceSource.languages : [],
        interests: Array.isArray(audienceSource?.interests) ? audienceSource.interests : [],
        credibility: audienceSource?.credibility,
      };

      return {
        name: selectedReport.name,
        country: selectedReport.country,

        // New demographics for media kit
        countryDemographics,
        audienceDemographics,
        audience: audienceSource,

        influencerReports: activeAvailableProfiles,
        socialProfiles: activeAvailableProfiles,
        primaryInfluencerReport: selectedReport,

        // Admin-only fields consumed by ContactManagementCard
        contact: contactList,
        contacts: contactList,
        email:
          (selectedReport as any)?.email ??
          (selectedReport as any)?.contactEmail ??
          profileRoot?.email ??
          profileRoot?.contactEmail,
        phone:
          (selectedReport as any)?.phone ??
          (selectedReport as any)?.contactPhone ??
          profileRoot?.phone ??
          profileRoot?.contactPhone,
      } as MediaKit & {
        contact?: any[];
        contacts?: any[];
        email?: string;
        phone?: string;
        countryDemographics?: any[];
        audienceDemographics?: {
          ages?: any[];
          genders?: any[];
          languages?: any[];
          interests?: any[];
          credibility?: number;
        };
        audience?: any;
      };
    }, [activeAvailableProfiles, selectedReport, raw, data]);

    const handlePlatformSelect = (profile: InfluencerReport) => {
      onPlatformChange?.(profile);
    };

    const popularPosts = useMemo(() => {
      if (selectedLookalikeReport) {
        return selectedLookalikeReport.popularPosts ?? [];
      }

      const base =
        Array.isArray(raw?.profile?.popularPosts) && raw.profile.popularPosts.length
          ? raw.profile.popularPosts.map(mapReportPost)
          : primaryReport?.popularPosts ?? [];

      return enrichPostImages(base, [
        ...(primaryReport?.recentPosts ?? []),
        ...(primaryReport?.sponsoredPosts ?? []),
      ]);
    }, [raw, primaryReport, selectedLookalikeReport]);

    const sponsoredPosts = useMemo(() => {
      if (selectedLookalikeReport) {
        return selectedLookalikeReport.sponsoredPosts ?? [];
      }

      const base =
        Array.isArray(raw?.profile?.sponsoredPosts) && raw.profile.sponsoredPosts.length
          ? raw.profile.sponsoredPosts.map(mapReportPost)
          : primaryReport?.sponsoredPosts ?? [];

      return enrichPostImages(base, [
        ...(primaryReport?.recentPosts ?? []),
        ...(primaryReport?.popularPosts ?? []),
      ]);
    }, [raw, primaryReport, selectedLookalikeReport]);

    const recentPosts = useMemo(() => {
      if (selectedLookalikeReport) {
        return selectedLookalikeReport.recentPosts ?? [];
      }

      const base =
        Array.isArray(raw?.profile?.recentPosts) && raw.profile.recentPosts.length
          ? raw.profile.recentPosts.map(mapReportPost)
          : Array.isArray(raw?.profile?.posts) && raw.profile.posts.length
            ? raw.profile.posts.map(mapReportPost)
            : primaryReport?.recentPosts ?? [];

      return enrichPostImages(base, [
        ...(Array.isArray(raw?.profile?.popularPosts)
          ? raw.profile.popularPosts.map(mapReportPost)
          : []),
        ...(Array.isArray(raw?.profile?.sponsoredPosts)
          ? raw.profile.sponsoredPosts.map(mapReportPost)
          : []),
        ...(primaryReport?.popularPosts ?? []),
        ...(primaryReport?.sponsoredPosts ?? []),
      ]);
    }, [raw, primaryReport, selectedLookalikeReport]);

    const statHistorySource = useMemo(() => {
      if (selectedLookalikeReport) {
        return selectedLookalikeReport.statHistory ?? [];
      }

      const dataProfile = data?.profile as any;
      const rawAny = raw as any;

      return pickBestTrendHistory(
        rawAny?.profile?.statHistory,
        rawAny?.statHistory,
        dataProfile?.statHistory,
        primaryReport?.statHistory,

        rawAny?.providerRaw?.profile?.statHistory,
        dataProfile?.providerRaw?.profile?.statHistory,

        rawAny?.profile?.statsByContentType?.all?.statHistory,
        rawAny?.statsByContentType?.all?.statHistory,
        dataProfile?.statsByContentType?.all?.statHistory,

        rawAny?.profile?.statsByContentType?.reels?.statHistory,
        rawAny?.statsByContentType?.reels?.statHistory,
        dataProfile?.statsByContentType?.reels?.statHistory
      );
    }, [data, raw, primaryReport, selectedLookalikeReport]);

    const {
      organicTrend,
      sponsoredTrend,
      trendLabels,
      secondaryTrendLabel,
    } = useMemo(() => {
      if (statHistorySource.length) {
        const normalizedHistory = statHistorySource.map(normalizeTrendPoint);

        const labels = normalizedHistory.map((item, index) =>
          parseMonthLabel(String(item.month || ''), index)
        );

        const hasFollowersHistory = normalizedHistory.some(
          (item) => item.followers > 0
        );

        const hasViewsHistory = normalizedHistory.some(
          (item) => item.avgViews > 0
        );

        return {
          organicTrend: normalizedHistory.map((item) => item.avgLikes),
          sponsoredTrend: hasFollowersHistory
            ? normalizedHistory.map((item) => item.followers)
            : hasViewsHistory
              ? normalizedHistory.map((item) => item.avgViews)
              : [],
          trendLabels: labels,
          secondaryTrendLabel:
            hasFollowersHistory || toNumber(selectedReport?.followers) > 0
              ? 'Followers'
              : 'Avg Views',
        };
      }

      const fallbackPosts = recentPosts.slice(0, 12);
      const fallbackLabels = fallbackPosts.map((post, index) =>
        parseMonthLabel(
          String(post?.createdAt ?? post?.publishedAt ?? post?.date ?? ''),
          index
        )
      );

      return {
        organicTrend: fallbackPosts.map((post) => toNumber(post?.likes)),
        sponsoredTrend: fallbackPosts.map((post) =>
          toNumber(post?.views ?? post?.plays ?? post?.likes)
        ),
        trendLabels: fallbackLabels.length ? fallbackLabels : undefined,
        secondaryTrendLabel: 'Views',
      };
    }, [statHistorySource, recentPosts, selectedReport]);

    const avgLikes = toNumber(
      selectedReport?.stats?.avgLikes?.value ??
      selectedReport?.avgLikes ??
      (data?.profile as any)?.avgLikes
    );

    const avgViews = toNumber(
      selectedReport?.stats?.avgViews?.value ??
      selectedReport?.avgReelsPlays ??
      selectedReport?.avgViews ??
      (data?.profile as any)?.profile?.averageViews ??
      (data?.profile as any)?.avgReelsPlays ??
      average(recentPosts.map((p) => toNumber(p.views ?? p.plays ?? p.likes)))
    );

    const avgComments = toNumber(
      selectedReport?.stats?.avgComments?.value ??
      selectedReport?.avgComments ??
      (data?.profile as any)?.avgComments ??
      (data?.profile as any)?.profile?.avgComments
    );

    const engagementRate = toNumber(
      selectedReport?.engagementRate ?? (data?.profile as any)?.profile?.engagementRate
    );

    const credibilityScore = useMemo(() => {
      const rawCredibility =
        selectedReport?.audience?.credibility ??
        (data?.profile as any)?.audience?.credibility;

      if (rawCredibility !== undefined && rawCredibility !== null) {
        return Math.round(Number(rawCredibility) * 100);
      }

      return Math.max(0, Math.min(97, Math.round(engagementRate * 100 || 67)));
    }, [data, selectedReport, engagementRate]);

    const metricCards = useMemo<DashboardMetric[]>(() => {
      return buildUniqueMetricCards({
        report: selectedReport,
        platform: activePlatformKey,
        avgLikes,
        avgViews,
        avgComments,
        postsCount: toNumber(selectedReport?.postsCount ?? recentPosts.length),
        followerCompared: selectedReport?.stats?.followers?.compared,
        likesCompared: selectedReport?.stats?.avgLikes?.compared,
      });
    }, [
      selectedReport,
      activePlatformKey,
      avgLikes,
      avgViews,
      avgComments,
      recentPosts.length,
    ]);

    const campaignHighlights = useMemo<CampaignHighlight[]>(() => {
      const sponsoredAvgLikes = average(sponsoredPosts.map((p) => toNumber(p.likes)));
      const organicAvgLikes = average(recentPosts.map((p) => toNumber(p.likes)));
      const topPostLikes = Math.max(...popularPosts.map((p) => toNumber(p.likes)), 0);

      return [
        {
          label: sponsoredPosts.length ? 'Sponsored median likes' : 'Top post likes',
          value: formatCompactNumber(sponsoredPosts.length ? sponsoredAvgLikes : topPostLikes),
          meta: sponsoredPosts.length
            ? `Across ${sponsoredPosts.length} sponsored posts`
            : `Best result from ${popularPosts.length} popular posts`,
          tone: 'accent',
        },
        {
          label: 'Organic median likes',
          value: formatCompactNumber(organicAvgLikes),
          meta: `Across ${recentPosts.length} recent posts`,
        },
        {
          label: 'Total posts',
          value: formatCompactNumber(selectedReport?.postsCount ?? recentPosts.length),
          meta: 'Current creator activity volume',
        },
        {
          label: 'Audience credibility',
          value: `${credibilityScore}%`,
          meta: 'Estimated quality score',
        },
      ];
    }, [sponsoredPosts, recentPosts, popularPosts, selectedReport, credibilityScore]);

    const audienceAge = (selectedReport?.audience?.ages ?? []).map((item) => ({
      label: item.code,
      value: Number((item.weight || 0) * 100),
    }));

    const audienceGender = (selectedReport?.audience?.genders ?? []).map((item) => ({
      label:
        item.code === 'MALE'
          ? 'Male'
          : item.code === 'FEMALE'
            ? 'Female'
            : item.code,
      value: Number((item.weight || 0) * 100),
    }));

    const topCountries = (selectedReport?.audience?.geoCountries ?? [])
      .slice(0, 4)
      .map((item) => ({
        name: item.name,
        value: Number((item.weight || 0) * 100),
      }));

    const topLanguages = (selectedReport?.audience?.languages ?? [])
      .slice(0, 4)
      .map((item) => ({
        label: item.code,
        value: Number((item.weight || 0) * 100),
      }));

    const lookalikeCreators = useMemo<LookalikePanelItem[]>(() => {
      if (selectedReport?.lookalikes?.length) {
        return transformPanelLookalikes(selectedReport.lookalikes, engagementRate);
      }
      return [];
    }, [selectedReport, engagementRate]);

    const contractedCampaigns = useMemo(() => {
      const source = Array.isArray((data?.profile as any)?.pastCollaborations)
        ? (data?.profile as any).pastCollaborations
        : [];
      return source.map((item: Record<string, any>) => ({
        _id: item?._id,
        company: item?.company ?? item?.brandName ?? '—',
        brief: item?.brief ?? item?.campaignTitle ?? '—',
        rate: item?.rate ?? item?.budget ?? '—',
        status: item?.status ?? '—',
        payout: item?.payout ?? item?.paymentType ?? '—',
        category: item?.category ?? 'Lifestyle',
        raw: item,
      }));
    }, [data]);

    const filteredCampaigns = useMemo(() => {
      const query = campaignSearch.trim().toLowerCase();
      if (!query) return brandCampaigns;

      return brandCampaigns.filter((item) =>
        String(item?.campaignTitle || '').toLowerCase().includes(query)
      );
    }, [brandCampaigns, campaignSearch]);
    const isEmailStatusSuccess = (
      resp: EmailStatusResponse
    ): resp is {
      status: 0 | 1;
      email?: string;
      handle?: string;
      platform?: Platform;
    } => {
      return typeof (resp as any)?.status === 'number';
    };

    const resolveCreatorEmail = async (
      safeHandle: string,
      normalizedPlatform: Platform
    ): Promise<{ email: string | null; source: 'status' | 'admin' | 'both' | 'none' }> => {
      const [statusResult, adminResult] = await Promise.allSettled([
        post2<EmailStatusResponse>('/email/status', {
          handle: safeHandle,
          platform: normalizedPlatform,
        }),
        post<AdminCheckStatusResponse>('/admin/checkstatus', {
          handle: safeHandle,
          platform: normalizedPlatform,
        }),
      ]);

      let emailFromStatus: string | null = null;
      let emailFromAdmin: string | null = null;

      if (statusResult.status === 'fulfilled') {
        const statusResp = statusResult.value;
        if (isEmailStatusSuccess(statusResp) && statusResp.status === 1 && statusResp.email) {
          emailFromStatus = statusResp.email;
        }
      } else {
        console.error('Error calling /email/status:', statusResult.reason);
      }

      if (adminResult.status === 'fulfilled') {
        const adminResp = adminResult.value;
        if (typeof adminResp.status === 'number' && adminResp.status === 1 && adminResp.email) {
          emailFromAdmin = adminResp.email;
        }
      } else {
        console.error('Error calling /admin/checkstatus:', adminResult.reason);
      }

      if (emailFromStatus && emailFromAdmin && emailFromStatus === emailFromAdmin) {
        return { email: emailFromStatus, source: 'both' };
      }

      if (emailFromStatus) {
        return { email: emailFromStatus, source: 'status' };
      }

      if (emailFromAdmin) {
        return { email: emailFromAdmin, source: 'admin' };
      }

      return { email: null, source: 'none' };
    };
    if (!open) return null;

    const panelLoading = loading || lookalikeReportLoading;
    const panelError = lookalikeReportError || error;

    const influencerUserId = getInfluencerUserIdForInvitation({
      selectedReport,
      raw,
      data,
    });

    const hasUserId = Boolean(influencerUserId);
    const activeInviteCampaignIds = campaignId ? [campaignId] : selectedCampaignIds;

    const invitedSelectedCampaignIds = activeInviteCampaignIds.filter((id) =>
      invitedCampaignIds.has(String(id))
    );

    const isCurrentInviteAlreadySent =
      activeInviteCampaignIds.length > 0 &&
      invitedSelectedCampaignIds.length === activeInviteCampaignIds.length;

    const canAct =
      hasUserId &&
      !loading &&
      !sendingInvite &&
      !refreshing &&
      !checkingEmail &&
      !checkingInvitation &&
      !isCurrentInviteAlreadySent;

    const effectiveHasEmail = false;

    const ctaTitle = hasUserId
      ? isCurrentInviteAlreadySent
        ? 'Already invited for this campaign'
        : 'Send invitation'
      : 'Profile not ready';

    const handleRefreshData = async (e: React.MouseEvent) => {
      e.preventDefault();
      if (!onRefreshReport || refreshing) return;

      try {
        setRefreshing(true);
        await onRefreshReport();
      } catch (err: any) {
        console.error(err);
        await Swal.fire(
          'Refresh failed',
          err?.message || 'Failed to refresh data',
          'error'
        );
      } finally {
        setRefreshing(false);
      }
    };

    const handleGenerateSuggestedRateCard = async () => {
      if (!brandId) {
        await Swal.fire("Missing brand", "Missing brand _id.", "warning");
        return;
      }

      const activeCampaignId =
        selectedCampaignIds[0] || campaignId || searchParams?.get("campaignId") || "";

      if (!activeCampaignId) {
        await Swal.fire(
          "Select campaign",
          "Please select or open a campaign before generating a rate card.",
          "warning"
        );
        return;
      }

      const normalizedPlatform = activePlatformKey;

      const rawInfluencerId = String(
        (selectedReport as any)?._id ||
        (raw as any)?._modashProfileId ||
        (data as any)?._modashProfileId ||
        (raw as any)?._id ||
        (data as any)?._id ||
        ""
      ).trim();

      // Modash/Instagram/TikTok reports have a local Mongo _id.
      // YouTube preview reports usually only have a YouTube channel id, so do not
      // block rate-card generation just because a Mongo profile id is missing.
      const influencerId = /^[a-f\d]{24}$/i.test(rawInfluencerId)
        ? rawInfluencerId
        : "";

      const rateCardReport = selectedLookalikeReport || raw || data || null;

      const youtubeChannelId = String(
        (selectedReport as any)?.youtubeChannelId ||
        (selectedReport as any)?.channelId ||
        selectedReport?.modashId ||
        (data?.profile as any)?.userId ||
        (raw as any)?.userId ||
        (raw as any)?.channelId ||
        (raw as any)?.profile?.userId ||
        (raw as any)?.profile?.channelId ||
        ""
      ).trim();

      const canUseYouTubeReportOnly =
        normalizedPlatform === "youtube" && !!rateCardReport && !!youtubeChannelId;

      if (!influencerId && !canUseYouTubeReportOnly) {
        await Swal.fire(
          "Missing influencer data",
          "Please open or refresh the full creator report once, so the local influencer _id or YouTube channel data is available.",
          "warning"
        );
        return;
      }

      try {
        const currentRateCardKey = rateCardProfileKey;
        rateCardRequestKeyRef.current = currentRateCardKey;

        setRateCardLoading(true);
        setRateCardError(null);

        const response = await post<SuggestedRateCardResponse>(
          "/modash/rate-card/suggested",
          {
            brandId,
            campaignId: activeCampaignId,
            ...(influencerId ? { influencerId } : {}),
            ...(youtubeChannelId
              ? {
                youtubeChannelId,
                modashUserId: youtubeChannelId,
              }
              : {}),
            handle: getActiveSafeHandle() || displayHandle,
            platform: normalizedPlatform,
            currency: "USD",

            // This avoids another Modash credit call.
            report: rateCardReport,
          }
        );

        if (response.status !== "success" || !response.data) {
          throw new Error(response.message || "Failed to generate rate card");
        }

        if (rateCardRequestKeyRef.current === currentRateCardKey) {
          setRateCardData(response.data);
        }
      } catch (err: any) {
        const message =
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          "Failed to generate suggested rate card";

        if (rateCardRequestKeyRef.current === rateCardProfileKey) {
          setRateCardError(message);
        }
      } finally {
        if (rateCardRequestKeyRef.current === rateCardProfileKey) {
          setRateCardLoading(false);
        }
      }
    };

    const finalizeCampaignInvitations = async (
      chosenCampaignIds?: string[],
      editorPayload?: EmailEditorPayload
    ) => {
      if (!brandId) {
        await Swal.fire(
          'Missing brand',
          'Missing brandId. Please provide brandId to DetailPanel.',
          'warning'
        );
        return;
      }

      const normalizedPlatform = getActivePlatform();

      if (normalizedPlatform !== 'youtube') {
        await Swal.fire(
          'Unsupported platform',
          'Only YouTube invitation flow is supported here.',
          'warning'
        );
        return;
      }

      const campaignIds = Array.isArray(chosenCampaignIds)
        ? [...new Set(chosenCampaignIds.filter(Boolean))]
        : [];

      if (!campaignIds.length) {
        await Swal.fire(
          'Select campaign',
          'Please select at least one active campaign.',
          'warning'
        );
        return;
      }

      const activeYoutubeChannelId = getActiveYoutubeChannelId(true);

      if (!activeYoutubeChannelId) {
        await Swal.fire(
          'Missing channel ID',
          'Could not send invitation because YouTube channelId was not found.',
          'warning'
        );
        return;
      }

      const safeHandle = getBackendInvitationHandle({
        selectedReport,
        raw,
        data,
        handle,
        displayName,
        editorToLabel: emailDraft?.toLabel || editorToLabel,
        channelId: activeYoutubeChannelId,
      });

      if (
        !safeHandle ||
        !/^[A-Za-z0-9._-]+$/.test(safeHandle.replace(/^@/, ''))
      ) {
        await Swal.fire(
          'Invalid handle',
          'Could not create a valid creator handle. Please refresh this creator profile and try again.',
          'warning'
        );
        return;
      }

      const creatorUserId = getInfluencerUserIdForInvitation({
        selectedReport,
        raw,
        data,
      });

      try {
        setSendingInvite(true);

        const fromEmail = String(
          editorPayload?.fromEmail ||
            emailDraft?.fromEmail ||
            ''
        ).trim();

        const fromName = String(
          editorPayload?.fromName ||
            emailDraft?.fromName ||
            'Fidem'
        ).trim();

        const resp = await post<InvitationCreateResp>('/newinvitations/create', {
          handle: safeHandle,
          platform: 'youtube',
          brandId,
          status: 'invited',

          campaignIds,
          campaignName,

          ...(creatorUserId ? { userId: creatorUserId } : {}),

          // Backend privately fetches the real email from InfoMediaKit using this.
          channelId: activeYoutubeChannelId,
          youtubeChannelId: activeYoutubeChannelId,

          ...(emailDraft?.missingEmailId
            ? {
                missingEmailId: emailDraft.missingEmailId,
              }
            : {}),

          // Do not send recipientEmail/influencerEmail/creatorEmail from frontend.
          emailTemplate: editorPayload
            ? {
                subject: editorPayload.subject,
                body: editorPayload.body,
                htmlBody: editorPayload.htmlBody,
                attachments: editorPayload.attachments,
                fromEmail,
                fromName,
              }
            : undefined,
        });

        if (!resp || resp.status === 'error') {
          await Swal.fire(
            'Something went wrong',
            resp?.message ||
              'We couldn’t send the invitation. Please try again in a moment.',
            'error'
          );
          return;
        }

        const savedCount =
          Number(resp.createdCount ?? 0) ||
          (resp.status === 'saved' ? campaignIds.length : 0);

        const existsCount =
          Number(resp.existingCount ?? 0) ||
          (resp.status === 'exists' ? campaignIds.length : 0);

        const emailSentCount =
          Number(resp.emailSentCount ?? 0) ||
          (resp.emailSent ? 1 : 0);

        const emailSkipReasons = [
          resp.emailSkippedReason,
          ...(Array.isArray(resp.results)
            ? resp.results.map((item) => item.emailSkippedReason)
            : []),
        ].filter(Boolean) as string[];

        setCampaignPickerOpen(false);
        setEmailEditorOpen(false);

        setInvitedCampaignIds((prev) => {
          const next = new Set(prev);
          campaignIds.forEach((id) => next.add(id));
          return next;
        });

        setSelectedCampaignIds((prev) =>
          prev.filter((id) => !campaignIds.includes(id))
        );

        const uniqueSkipReason = [...new Set(emailSkipReasons)].filter(Boolean)[0];

        const emailSummary =
          emailSentCount > 0
            ? `${emailSentCount} email${emailSentCount > 1 ? 's' : ''} sent.`
            : uniqueSkipReason ||
              'Invitation saved. Email was not found, so creator was added to missing email.';

        if (savedCount > 0 && existsCount === 0) {
          await Swal.fire(
            emailSentCount > 0 ? 'Invitation email sent' : 'Invitation saved',
            `Processed ${savedCount} campaign${
              savedCount > 1 ? 's' : ''
            }. ${emailSummary}`.trim(),
            emailSentCount > 0 ? 'success' : 'warning'
          );
        } else if (savedCount === 0 && existsCount > 0) {
          await Swal.fire(
            emailSentCount > 0 ? 'Invitation email sent' : 'Already invited',
            `This creator was already invited for ${existsCount} campaign${
              existsCount > 1 ? 's' : ''
            }. ${emailSummary}`.trim(),
            emailSentCount > 0 ? 'success' : 'info'
          );
        } else {
          await Swal.fire(
            'Invitations processed',
            `${savedCount} new invitation${
              savedCount > 1 ? 's' : ''
            } processed, ${existsCount} already existed. ${emailSummary}`.trim(),
            emailSentCount > 0 ? 'success' : 'warning'
          );
        }

        router.push('/brand/creator-hub?tab=invited');
      } catch (err: any) {
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          'Failed to send invitation';

        console.error(err);
        await Swal.fire('Error', msg, 'error');
      } finally {
        setSendingInvite(false);
      }
    };

    const handleTemplatePreview = async (chosenCampaignIds?: string[]) => {
      const normalizedPlatform = getActivePlatform();

      if (!brandId) {
        await Swal.fire(
          'Missing brand',
          'Missing brandId. Please provide brandId to DetailPanel.',
          'warning'
        );
        return;
      }

      if (normalizedPlatform !== 'youtube') {
        await Swal.fire(
          'Unsupported platform',
          'Only YouTube invitation flow is supported here.',
          'warning'
        );
        return;
      }

      const campaignIds = Array.isArray(chosenCampaignIds)
        ? [...new Set(chosenCampaignIds.filter(Boolean))]
        : [];

      if (!campaignIds.length) {
        await Swal.fire(
          'Select campaign',
          'Please select at least one active campaign.',
          'warning'
        );
        return;
      }

      const activeYoutubeChannelId = getActiveYoutubeChannelId(false);

      if (!activeYoutubeChannelId) {
        await Swal.fire(
          'Missing channel ID',
          'Could not prepare invitation because YouTube channelId was not found.',
          'warning'
        );
        return;
      }

      const safeHandle = getBackendInvitationHandle({
        selectedReport,
        raw,
        data,
        handle,
        displayName,
        editorToLabel,
        channelId: activeYoutubeChannelId,
      });

      if (
        !safeHandle ||
        !/^[A-Za-z0-9._-]+$/.test(safeHandle.replace(/^@/, ''))
      ) {
        await Swal.fire(
          'Invalid handle',
          'Could not create a valid creator handle. Please refresh this creator profile and try again.',
          'warning'
        );
        return;
      }

      const selectedCampaignTitles = campaignIds
        .map((id) => {
          const matchedCampaign = brandCampaigns.find(
            (item) => String(item.campaignId) === String(id)
          );

          return String(
            matchedCampaign?.campaignTitle ||
              (String(id) === String(campaignId) ? campaignName : '') ||
              ''
          ).trim();
        })
        .filter(Boolean);

      const firstCampaignTitle =
        selectedCampaignTitles[0] ||
        campaignName ||
        'your campaign';

      const campaignTitleText =
        selectedCampaignTitles.length > 1
          ? selectedCampaignTitles.join(', ')
          : firstCampaignTitle;

      const creatorName =
        displayName && !isYouTubeChannelId(displayName)
          ? displayName
          : editorToLabel.replace(/^@/, '') || 'Creator';

      const fromName = 'Fidem';
      const fromEmail = '';

      const subject = `Invitation to Collaborate - ${firstCampaignTitle}`;

      const initialBody = `Dear ${creatorName},

I hope you are doing well.

We would like to invite you to collaborate with us for ${campaignTitleText}.

Campaign Details

Campaign Name: ${campaignTitleText}
Platform: YouTube

Please review this invitation and let us know if you are interested. More campaign details will be shared by the brand team.

Warm regards,
Team Fidem`;

      const nextDraft: EmailDraftState = {
        campaignIds,
        fromEmail,
        fromName,

        // Show creator handle/name only. Never show real email or UC channel ID here.
        toLabel: editorToLabel,
        toEmail: '',

        // Keep channelId privately for backend email lookup.
        channelId: activeYoutubeChannelId,
        missingEmailId: null,

        subject,
        initialBody,
        initialHtmlBody: plainTextToHtml(initialBody),
      };

      setEmailDraft(nextDraft);
      setCampaignPickerOpen(false);
      setEmailEditorOpen(true);
    };

    const handleCampaignPickerToggle = async (e: React.MouseEvent) => {
      e.preventDefault();

      if (loading || campaignsLoading) return;

      if (campaignPickerOpen) {
        setCampaignPickerOpen(false);
        return;
      }

      if (!brandId) {
        await Swal.fire(
          'Missing brand',
          'Missing brandId. Please provide brandId to DetailPanel.',
          'warning'
        );
        return;
      }

      try {
        setCampaignsLoading(true);

        const resp = await post<GetByBrandCampaignResp>('/campaign/get-by-brand', {
          brandId,
          page: 1,
          limit: 20,
          status: 'active',
        });

        const items = Array.isArray(resp?.data?.items) ? resp.data.items : [];

        setBrandCampaigns(items);
        setSelectedCampaignIds((prev) => {
          if (campaignId) return [campaignId];

          const stillValid = prev.filter((id) =>
            items.some((item) => item.campaignId === id)
          );

          return stillValid;
        });

        setCampaignPickerOpen(true);
      } catch (err: any) {
        console.error('Failed to fetch brand campaigns', err);
        await Swal.fire(
          'Campaigns unavailable',
          err?.response?.data?.message ||
          err?.message ||
          'Could not load active campaigns for this brand.',
          'error'
        );
      } finally {
        setCampaignsLoading(false);
      }
    };
    const handleMessageNow = async (e: React.MouseEvent) => {
      e.preventDefault();
      if (!canAct) return;

      if (!brandId) {
        await Swal.fire(
          'Missing brand',
          'Missing brandId. Please provide brandId to DetailPanel.',
          'warning'
        );
        return;
      }

      const safeHandle = getActiveSafeHandle();
      const normalizedPlatform = getActivePlatform();

      if (
        !normalizedPlatform ||
        !['youtube', 'instagram', 'tiktok'].includes(normalizedPlatform)
      ) {
        await Swal.fire(
          'Unsupported platform',
          'Unsupported or missing platform.',
          'warning'
        );
        return;
      }

      if (!safeHandle || !/^[A-Za-z0-9._-]+$/.test(safeHandle.replace(/^@/, ''))) {
        await Swal.fire(
          'Invalid handle',
          'Invalid or missing handle to lookup contact email.',
          'warning'
        );
        return;
      }

      try {
        setSendingInvite(true);

        const { email: creatorEmail } = await resolveCreatorEmail(
          safeHandle,
          normalizedPlatform
        );

        if (!creatorEmail) {
          await Swal.fire(
            'No email found',
            'We could not find a contact email for this creator. Try sending an invitation or adding the email manually.',
            'warning'
          );
          return;
        }

        const resp = await post<InvitationResponse>('/emails/invitation', {
          email: creatorEmail,
          brandId,
          campaignId: campaignId || undefined,
          campaignName: campaignName || undefined,
          handle: safeHandle,
          platform: normalizedPlatform,
        });

        if (!resp) {
          await Swal.fire(
            'Error',
            'No response from server while sending invitation.',
            'error'
          );
          return;
        }

        if (resp.status === 'error') {
          await Swal.fire('Error', resp.message || 'Failed to send email.', 'error');
          return;
        }

        const successTitle = resp.isExistingInfluencer
          ? 'Message sent'
          : 'Invitation sent';

        const successText = resp.isExistingInfluencer
          ? 'We’ve emailed this creator. They can reply directly and continue the conversation with your brand.'
          : 'We’ve sent your invitation to this creator. They’ll see it and can reply soon if they’re interested.';

        await Swal.fire(successTitle, successText, 'success');
      } catch (err: any) {
        console.error(err);
        await Swal.fire(
          'Error',
          err?.response?.data?.message ||
          err?.message ||
          'Failed to send invitation email. Please try again.',
          'error'
        );
      } finally {
        setSendingInvite(false);
      }
    };
    const handleSendInvitation = async (e: React.MouseEvent) => {
      e.preventDefault();

      if (!canAct || sendingInvite) return;

      if (!brandId) {
        await Swal.fire(
          'Missing brand',
          'Missing brandId. Please provide brandId to DetailPanel.',
          'warning'
        );
        return;
      }

      const normalizedPlatform = getActivePlatform();

      if (normalizedPlatform !== 'youtube') {
        await Swal.fire(
          'Unsupported platform',
          'Only YouTube invitation flow is supported here.',
          'warning'
        );
        return;
      }

      const campaignIds = activeInviteCampaignIds.filter(Boolean);

      if (!campaignIds.length) {
        await Swal.fire(
          'Select campaign',
          'Please select at least one active campaign.',
          'warning'
        );
        return;
      }

      await handleTemplatePreview(campaignIds);
    };

    const handleCopy = async () => {
      try {
        const reportAny = (selectedReport as any) ?? {};
        const profileRoot = selectedLookalikeReport
          ? selectedLookalikeReport
          : (data?.profile as any) ?? raw?.profile ?? raw ?? {};

        const userId = String(
          reportAny?.modashId ||
          reportAny?._id ||
          profileRoot?.userId ||
          profileRoot?.modashId ||
          ''
        ).trim();

        const selectedPlatform = activePlatformKey;

        const rawHandle = String(
          reportAny?.handle ||
          reportAny?.username ||
          handle ||
          profileRoot?.handle ||
          profileRoot?.username ||
          ''
        ).trim();

        const normalizedHandle = rawHandle
          ? rawHandle.startsWith('@')
            ? rawHandle
            : `@${rawHandle}`
          : '';

        if (!userId) {
          await Swal.fire({
            icon: 'warning',
            title: 'Missing user ID',
            text: 'Could not generate media kit link because userId was not found.',
          });
          return;
        }

        const mediaKitUrl =
          `${window.location.origin}/mediakit/${encodeURIComponent(userId)}` +
          `?platform=${encodeURIComponent(selectedPlatform)}`;

        await copyWithFallback(mediaKitUrl);

        await Swal.fire({
          icon: 'success',
          title: 'Copied',
          text: 'Media kit link copied to clipboard.',
          timer: 1600,
          showConfirmButton: false,
        });

        try {
          await post('/modash/creator', {
            userId,
            username:
              reportAny?.username ||
              String(normalizedHandle || '').replace(/^@/, '') ||
              '',
            handle:
              normalizedHandle ||
              reportAny?.handle ||
              reportAny?.username ||
              '',
            fullname:
              reportAny?.fullname ||
              reportAny?.name ||
              profileRoot?.fullname ||
              profileRoot?.fullName ||
              profileRoot?.name ||
              '',
            followers: Number(
              reportAny?.followers ??
              reportAny?.stats?.followers?.value ??
              profileRoot?.followers ??
              profileRoot?.followerCount ??
              0
            ),
            engagementRate: Number(
              reportAny?.engagementRate ??
              profileRoot?.engagementRate ??
              0
            ),
            engagements: Number(
              reportAny?.engagements ??
              profileRoot?.engagements ??
              profileRoot?.stats?.engagements ??
              0
            ),
            averageViews: Number(
              reportAny?.avgViews ??
              reportAny?.averageViews ??
              reportAny?.stats?.avgViews?.value ??
              profileRoot?.averageViews ??
              profileRoot?.avgViews ??
              profileRoot?.stats?.avgViews?.value ??
              0
            ),
            picture:
              reportAny?.picture ||
              profileRoot?.picture ||
              profileRoot?.avatar ||
              profileRoot?.profilePicUrl ||
              '',
            url: reportAny?.url || profileRoot?.url || '',
            isVerified: Boolean(reportAny?.isVerified || profileRoot?.isVerified),
            isPrivate: Boolean(reportAny?.isPrivate || profileRoot?.isPrivate),
            platform: selectedPlatform,
            bio:
              reportAny?.bio ||
              profileRoot?.bio ||
              profileRoot?.description ||
              '',
            country:
              reportAny?.country ||
              profileRoot?.country ||
              profileRoot?.location?.country ||
              (typeof profileRoot?.location === 'string' ? profileRoot.location : '') ||
              '',
            location:
              (typeof profileRoot?.location === 'string' ? profileRoot.location : '') ||
              profileRoot?.location?.country ||
              reportAny?.country ||
              profileRoot?.country ||
              '',
            categories: Array.isArray(profileRoot?.categories)
              ? profileRoot.categories
                .map((item: any) =>
                  typeof item === 'string'
                    ? item
                    : item?.categoryName ||
                    item?.subcategoryName ||
                    item?.name ||
                    item?.subcategory ||
                    ''
                )
                .filter(Boolean)
              : [],
            searchType: profileRoot?.searchType || 'standard',
            source: profileRoot?.source || 'standard',
          });
        } catch (apiError) {
          console.error('Failed to post /modash/creator:', apiError);
        }
      } catch (copyError) {
        console.error('Failed to copy media kit link:', copyError);
        await Swal.fire({
          icon: 'error',
          title: 'Copy failed',
          text: 'Unable to copy the media kit link.',
        });
      }
    };

    const handleEditorSend = async (payload: EmailEditorPayload) => {
      await finalizeCampaignInvitations(emailDraft?.campaignIds || [], payload);
    };

    const showRefreshButton = Boolean(onRefreshReport);

    return (
      <>
        <div className="fixed inset-0 z-[90]">
          <div className="absolute inset-0 bg-black/30" />
          <div className="absolute right-0 top-0 isolate h-full w-full max-w-full overflow-y-auto overflow-x-hidden border-l bg-white shadow-2xl md:w-full xl:w-full rounded-none md:rounded-l-3xl">
            <div className="sticky top-0 z-[200] overflow-visible border-b bg-white/95 px-4 py-3 shadow-[0_6px_22px_rgba(15,23,42,0.08)] backdrop-blur supports-[backdrop-filter]:bg-white/85">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <button
                    onClick={onClose}
                    className="inline-flex h-10 shrink-0 items-center gap-1 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-sm transition-colors hover:bg-gray-50"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Close
                  </button>

                  {/* <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      <span className="truncate text-sm font-semibold text-gray-900">
                        {displayName}
                      </span>

                      {displayHandle ? (
                        <span className="truncate text-xs text-gray-500">
                          {displayHandle}
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      {platform ? (
                        <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide text-gray-700">
                          {platform}
                        </span>
                      ) : null}
                    </div>
                  </div> */}
                </div>

                <div className="flex w-full flex-wrap items-center justify-between gap-2 lg:w-auto lg:min-w-[360px] lg:flex-nowrap lg:items-center lg:justify-end lg:pr-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center lg:justify-end">
                    <div className="flex flex-col lg:items-end">
                      <span className="text-[10px] uppercase tracking-wide text-gray-500">
                        Latest data
                      </span>
                      <span className="text-xs text-gray-700">{formattedLastUpdated}</span>
                    </div>

                    {showRefreshButton ? (
                      <button
                        type="button"
                        onClick={handleRefreshData}
                        disabled={refreshing || panelLoading}
                        className="inline-flex h-10 items-center justify-center gap-1 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                      >
                        <RefreshCw className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
                        {refreshing ? 'Refreshing…' : 'Refresh data'}
                      </button>
                    ) : null}
                  </div>

                  {/* CTA row */}
                  <div className="relative z-[210] flex shrink-0 items-center overflow-visible">
                    <div className="inline-flex max-w-[calc(100vw-32px)] shrink-0 overflow-hidden rounded-xl bg-black text-white shadow-[0_10px_26px_rgba(0,0,0,0.18)]">
                      <button
                        onClick={(e) => {
                          e.preventDefault();

                          if (isCurrentInviteAlreadySent) return;

                          if (activeInviteCampaignIds.length) {
                            void handleTemplatePreview(activeInviteCampaignIds);
                            return;
                          }

                          setCampaignPickerOpen((prev) => !prev);
                        }}
                        disabled={!canAct}
                        title={ctaTitle}
                        className={`inline-flex items-center gap-2 whitespace-nowrap px-4 py-2 text-sm font-medium transition-opacity ${canAct ? 'hover:opacity-90' : 'cursor-not-allowed opacity-70'
                          }`}
                      >
                        {checkingInvitation ? (
                          <>
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            Checking…
                          </>
                        ) : sendingInvite && brandId ? (
                          <>
                            {effectiveHasEmail ? (
                              <MessageSquare className="h-4 w-4 animate-pulse" />
                            ) : (
                              <Send className="h-4 w-4 animate-pulse" />
                            )}
                            Sending…
                          </>
                        ) : isCurrentInviteAlreadySent ? (
                          <>
                            <Send className="h-4 w-4" />
                            Invited
                          </>
                        ) : (
                          <>
                            {effectiveHasEmail ? (
                              <MessageSquare className="h-4 w-4" />
                            ) : (
                              <Send className="h-4 w-4" />
                            )}
                            {campaignName ? `Send Invitation For ${campaignName}` : 'Send Invitation'}
                          </>
                        )}
                      </button>

                      {!hasLockedCampaign ? (
                        <button
                          type="button"
                          onClick={handleCampaignPickerToggle}
                          disabled={campaignsLoading || checkingInvitation || loading}
                          className="inline-flex h-10 w-10 shrink-0 items-center justify-center border-l border-white/20 hover:bg-white/10"
                        >
                          {campaignsLoading || checkingInvitation ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : campaignPickerOpen ? (
                            <CaretUpIcon className="h-4 w-4" />
                          ) : (
                            <CaretDownIcon className="h-4 w-4" />
                          )}
                        </button>
                      ) : null}
                    </div>

                    {!hasLockedCampaign && campaignPickerOpen ? (
                      <CampaignInvitePicker
                        open={campaignPickerOpen}
                        onClose={() => setCampaignPickerOpen(false)}
                        allItems={brandCampaigns}
                        items={filteredCampaigns}
                        selectedIds={selectedCampaignIds}
                        onSelectedIdsChange={(ids) => {
                          setSelectedCampaignIds(
                            ids.filter((id) => !invitedCampaignIds.has(id))
                          );
                        }}
                        invitedCampaignIds={invitedCampaignIds}
                        search={campaignSearch}
                        onSearchChange={setCampaignSearch}
                        loading={campaignsLoading || checkingInvitation}
                        sending={sendingInvite}
                        onSend={handleTemplatePreview}
                      />
                    ) : null}
                  </div>
                </div>
              </div>
            </div>


            <div className="p-5">
              {isYouTubeMediaKitMode ? (
                <>
                  <YouTubeMediaKitPanelContent
                    loading={youtubeMediaKitLoading}
                    error={youtubeMediaKitError}
                    data={youtubeMediaKit}
                    fallbackReport={selectedReport}
                  />

                  {!youtubeAdvancedRequested ? (
                    <section className="mt-6 rounded-[24px] border border-[#eadfcb] bg-white p-5 shadow-[0_12px_30px_rgba(120,83,20,0.05)]">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9a8a73]">
                            Modash analytics
                          </p>
                          <h2 className="mt-1 text-[20px] font-semibold text-[#111111]">Advanced Analytics</h2>
                          <p className="mt-1 text-[13px] leading-6 text-[#655b4d]">
                            Click below to call the YouTube Modash report API and show graphs and insights.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={handleShowYouTubeAdvancedAnalytics}
                          disabled={youtubeAdvancedLoading || !youtubeChannelIdForPanel}
                          className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-black px-5 text-[13px] font-semibold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <BarChart3 className="h-4 w-4" />
                          Show Advanced Analytics
                        </button>
                      </div>
                    </section>
                  ) : (
                    <YouTubeAdvancedAnalyticsPanel
                      loading={youtubeAdvancedLoading}
                      error={youtubeAdvancedError}
                      report={youtubeAdvancedReport}
                      fetchedAt={youtubeAdvancedFetchedAt}
                    />
                  )}
                </>
              ) : (
                <>
                  {panelLoading ? <LoadingState /> : null}
                  {panelError ? <ErrorState error={panelError} /> : null}

                  {!panelLoading && !panelError && !selectedReport ? (
                    <div className="mb-4 rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4 text-xs text-gray-600">
                      No report data yet. Try refreshing data or selecting another creator.
                    </div>
                  ) : null}

                  {!panelLoading && !panelError && selectedReport ? (
                    <div className="space-y-6">
                      <CreatorHeader
                        primaryReport={selectedReport}
                        mediaKit={panelMediaKit}
                        activePlan={plan}
                        isVerified={selectedReport.isVerified}
                        accountType={selectedReport.accountType}
                        postsCount={selectedReport.postsCount}
                      />

                      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
                        <div className="space-y-6">
                          {hasSectionAccess('contactManagement') ? (
                            <ContactManagementCard
                              primaryReport={selectedReport}
                              mediaKit={panelMediaKit}
                              onCopy={handleCopy}
                              connectedProfiles={activeAvailableProfiles}
                              activePlatform={activePlatformKey}
                              onPlatformSelect={handlePlatformSelect}
                            />
                          ) : null}
                        </div>

                        <div className="space-y-6">
                          {hasSectionAccess('metricGrid') ? (
                            <MetricsGrid metrics={metricCards} />
                          ) : null}

                          {hasSectionAccess('performanceTrend') ? (
                            <PerformanceTrendCard
                              key={`performance-${activePlatformKey}`}
                              organicTrend={organicTrend}
                              sponsoredTrend={sponsoredTrend}
                              trendLabels={trendLabels}
                              statHistory={statHistorySource.map(normalizeTrendPoint)}
                              secondaryLabel={secondaryTrendLabel}
                              primaryValue={avgLikes}
                              secondaryValue={
                                secondaryTrendLabel === 'Followers'
                                  ? toNumber(selectedReport?.followers)
                                  : avgViews
                              }
                            />
                          ) : (
                            <FeatureLockedCard title="Performance Trend" plan="starter" />
                          )}
                        </div>
                      </div>

                      <div className="space-y-6">
                        {hasSectionAccess('campaignHighlights') ? (
                          <CampaignHighlightsCard items={campaignHighlights} />
                        ) : (
                          <FeatureLockedCard
                            title="Campaign Performance Highlights"
                            plan="pro"
                          />
                        )}

                        {hasSectionAccess('audienceIntelligence') ? (
                          <AudienceIntelligenceCard
                            ageData={audienceAge}
                            genderData={audienceGender}
                            topCountries={topCountries}
                            credibilityScore={credibilityScore}
                            topLanguages={topLanguages}
                          />
                        ) : (
                          <FeatureLockedCard title="Audience Intelligence" plan="pro" />
                        )}

                        <SelectionReasonCard
                          loading={panelLoading && !selectedReport}
                          reasons={selectionReasonItems}
                          campaignTitle={activeCampaignForPanel?.campaignTitle}
                        />

                        <SuggestedRateCardBox
                          loading={rateCardLoading}
                          data={rateCardData}
                          error={rateCardError}
                          onGenerate={handleGenerateSuggestedRateCard}
                        />

                        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_420px]">
                          {hasSectionAccess('recentPosts') ? (
                            <RecentPostsTable posts={recentPosts.slice(0, 5)} />
                          ) : (
                            <FeatureLockedCard
                              title="Recent Posts Performance"
                              plan="free"
                            />
                          )}

                          {hasSectionAccess('popularContent') ? (
                            <PopularContentPanel posts={popularPosts.slice(0, 2)} />
                          ) : (
                            <FeatureLockedCard title="Popular Content" plan="starter" />
                          )}
                        </div>

                        {contractedCampaigns.length ? (
                          <PastCollaborationsTable items={contractedCampaigns} />
                        ) : null}

                        {hasSectionAccess('lookalikeCreators') ? (
                          <LookalikeCreatorsPanel
                            items={lookalikeCreators}
                            platform={activePlatformKey}
                            onSelectLookalike={handleLookalikeSelect}
                          />
                        ) : (
                          <FeatureLockedCard title="Lookalike Creators" plan="pro" />
                        )}
                      </div>
                    </div>
                  ) : null}
                </>
              )}
            </div>
          </div>
        </div>

        <EmailEditor
          open={emailEditorOpen}
          onClose={() => setEmailEditorOpen(false)}
          toLabel={emailDraft?.toLabel || editorToLabel}
          toEmail=""
          fromName={emailDraft?.fromName || 'Fidem'}
          fromEmail={emailDraft?.fromEmail || ''}
          toAvatar={selectedReport?.picture || primaryReport?.picture || ''}
          subject={emailDraft?.subject || ''}
          initialBody={emailDraft?.initialBody || ''}
          initialHtmlBody={emailDraft?.initialHtmlBody || ''}
          startExpanded
          sending={sendingInvite}
          onSend={handleEditorSend}
        />
      </>
    );
  }
);

DetailPanel.displayName = 'DetailPanel';

const LoadingState: React.FC = () => (
  <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center text-gray-600">
    <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100">
      <BarChart3 className="h-8 w-8 animate-pulse text-orange-600" />
    </div>
    <div className="text-lg font-semibold">Fetching report…</div>
  </div>
);

const ErrorState: React.FC<{ error: string }> = ({ error }) => (
  <div className="mb-6 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
    <AlertCircle className="mt-0.5 h-5 w-5" />
    <div>
      <div className="font-semibold">Something went wrong</div>
      <div>{error}</div>
    </div>
  </div>
);