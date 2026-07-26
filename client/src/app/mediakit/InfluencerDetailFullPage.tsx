'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  AlertCircle,
  BarChart3,
  Check,
  ChevronDown,
  Copy,
  Handshake,
  Send,
  Users,
} from 'lucide-react';
import Swal from 'sweetalert2';
import { LockKeyOpenIcon } from '@phosphor-icons/react';
import {
  GoogleReCaptchaProvider,
  useGoogleReCaptcha,
} from 'react-google-recaptcha-v3';
import type { Platform, ReportResponse } from '@/features/discovery/browse-influencer/types';
import { post } from '@/lib/api';
import { Loader } from '@/components/ui/loader';


import { AuditTrailTable } from '@/components/common/AuditTrailTable';
import { AudienceIntelligenceCard } from '@/components/common/AudienceIntelligenceCard';
import { CampaignHighlightsCard } from '@/components/common/CampaignHighlightsCard';
import { ContactManagementCard } from '@/components/common/ContactManagementCard';
import { CreatorHeader } from '@/components/common/CreatorHeader';
import { MetricsGrid } from '@/components/common/MetricsGrid';
import { PerformanceTrendCard } from '@/components/common/PerformanceTrendCard';
import { PopularContentPanel } from '@/components/common/PopularContentPanel';
import { RecentPostsTable } from '@/components/common/RecentPostsTable';
import { RiskComplianceCard } from '@/components/common/RiskComplienceCard';
import { SectionCard } from '@/components/common/SectionCard';

type Props = {
  loading: boolean;
  error: string | null;
  data: ReportResponse | null;
  raw: any;
  platform: Platform;
  emailExists?: boolean | null;
  handle: string | null;
  lastFetchedAt?: string | null;
  onRefreshReport?: () => Promise<void> | void;
  onChangeCalc: (calc: 'median' | 'average') => void;
  viewerRole?: 'brand' | 'admin' | '';
  youtubeEngagementRate?: number | null;
};

type StoreInvitationResponse =
  | {
    status: 'success';
    message?: string;
    requested?: number;
    stored?: number;
    missingCampaigns?: string[];
    invitations?: any[];
  }
  | { status: 'error'; message?: string };

type SupportedPlatform = 'instagram' | 'tiktok' | 'youtube';

type SubscriptionPlan = 'free' | 'starter' | 'pro' | 'enterprise';

type SocialPost = {
  likes?: number | string;
  views?: number | string;
  text?: string;
  type?: string;
  url?: string;
  image?: string;
  thumbnail?: string;
  sponsors?: Array<{ name?: string }>;
  createdAt?: string;
  publishedAt?: string;
  postedAt?: string;
  date?: string;
  created?: string;
  plays?: number;
  comments?: number;
};

type AudienceAge = {
  code: string;
  weight: number;
};

type AudienceGender = {
  code: string;
  weight: number;
};

type AudienceCountry = {
  name: string;
  weight: number;
};

type ModashStatHistory = {
  month: string;
  followers: number;
  avgLikes: number;
  following: number;
  avgComments: number;
  avgViews: number;
};

type InfluencerReportShape = {
  modashId?: string;
  _id?: string;
  provider?: string;
  url?: string;
  name?: string;
  fullname?: string;
  picture?: string;
  bio?: string;
  username?: string;
  handle?: string;
  followers?: number | string;
  subscribers?: number | string;
  engagementRate?: number | string;
  country?: string;
  location?: string;
  city?: string;
  state?: string;
  language?: { name?: string };
  hashtags?: Array<{ tag: string }>;
  popularPosts?: SocialPost[];
  recentPosts?: SocialPost[];
  sponsoredPosts?: SocialPost[];
  stats?: {
    avgLikes?: { value?: number | string; compared?: number | string };
    avgViews?: { value?: number | string; compared?: number | string };
    avgComments?: { value?: number | string; compared?: number | string };
    followers?: { value?: number | string; compared?: number | string };
    paidPostPerformance?: number | string;
  };
  avgLikes?: number | string;
  avgComments?: number | string;
  avgViews?: number | string;
  avgReelsPlays?: number | string;
  audience?: {
    geoCountries?: AudienceCountry[];
    ages?: AudienceAge[];
    genders?: AudienceGender[];
    languages?: Array<{ code: string; weight: number }>;
    interests?: Array<{ name: string; weight: number }>;
    credibility?: number;
    notable?: number;
    brandAffinity?: Array<{ name?: string; weight?: number }>;
  };
  isPrivate?: boolean;
  isVerified?: boolean;
  accountType?: string;
  postsCount?: number;
  statHistory?: ModashStatHistory[];
  followersRange?: { leftNumber?: number; rightNumber?: number };
};

type MediaKitShape = {
  _id?: string;
  mediaKitId?: string;
  influencerId?: string;
  primaryPlatform?: string | null;
  primaryInfluencerReport?: InfluencerReportShape;
  influencerReports?: InfluencerReportShape[];
  socialProfiles?: InfluencerReportShape[];
  name?: string;
  country?: string;
  location?: string;
  city?: string;
  state?: string;
  contact?: any[];
  contacts?: any[];
  languages?: Array<{ name?: string }>;

  // New demographics
  countryDemographics?: AudienceCountry[];
  audienceDemographics?: {
    ages?: AudienceAge[];
    genders?: AudienceGender[];
    languages?: Array<{ code: string; weight: number }>;
    interests?: Array<{ name: string; weight: number }>;
    credibility?: number;
  };
  audience?: InfluencerReportShape['audience'];

  email?: string;
  phone?: string;
  additionalNotes?: string;
  updatedAt?: string;
};

type DashboardMetric = {
  key: string;
  label: string;
  value: string;
  delta?: string;
};

type CampaignHighlight = {
  label: string;
  value: string;
  meta: string;
  tone?: 'default' | 'accent';
};

type AuditItem = {
  id: string;
  date: string;
  action: string;
  actor: string;
  status: string;
};

type PastCollaboration = {
  name: string;
  post: SocialPost;
};

const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function toNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function pickNumber(...values: unknown[]): number | undefined {
  for (const value of values) {
    if (value === undefined || value === null || value === '') continue;

    const num = Number(value);
    if (Number.isFinite(num)) return num;
  }

  return undefined;
}

function average(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((sum, item) => sum + item, 0) / values.length;
}

function formatCompactNumber(value: number | string | null | undefined): string {
  if (value === undefined || value === null || value === '') return '—';
  if (typeof value === 'string' && value.trim() !== '' && Number.isNaN(Number(value))) return value;
  const num = Number(value);
  if (!Number.isFinite(num)) return '—';
  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}B`;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return `${Math.round(num)}`;
}

function formatPercent(value: number | string | null | undefined, multiplyBy100 = false): string {
  if (value === undefined || value === null || value === '') return '—';
  const num = Number(value);
  if (!Number.isFinite(num)) return typeof value === 'string' ? value : '—';
  const finalValue = multiplyBy100 ? num * 100 : num;
  return `${finalValue.toFixed(1)}%`;
}

function normaliseTrend(source: Array<number | string>, points = 12): number[] {
  const numeric = source.map((item) => toNumber(item)).filter((item) => item >= 0);
  if (!numeric.length) return Array.from({ length: points }, () => 0);
  if (numeric.length >= points) return numeric.slice(-points);
  const fallback = Math.max(average(numeric), numeric[numeric.length - 1] || 0);
  const pad = Array.from({ length: points - numeric.length }, () => fallback);
  return [...pad, ...numeric];
}

function stripHandlePrefix(value?: string | null): string | undefined {
  if (!value) return undefined;
  const cleaned = value.replace(/^@/, '').trim();
  return cleaned || undefined;
}

function cleanText(value: unknown): string {
  if (value === undefined || value === null) return '';

  const text = String(value).trim();

  if (
    !text ||
    text === '—' ||
    text === '--' ||
    text.toLowerCase() === 'null' ||
    text.toLowerCase() === 'undefined'
  ) {
    return '';
  }

  return text;
}

function pickFirstText(...values: unknown[]): string | undefined {
  const found = values.map(cleanText).find(Boolean);
  return found || undefined;
}

function normalisePlatform(raw?: string | null): SupportedPlatform {
  const value = String(raw ?? '').toLowerCase();
  if (value.includes('tiktok')) return 'tiktok';
  if (value.includes('youtube')) return 'youtube';
  return 'instagram';
}

function normalizePost(post: any): SocialPost {
  return {
    text: post?.text ?? post?.caption ?? post?.title,
    type: post?.type,
    url: post?.url,
    image: post?.image ?? post?.thumbnail ?? post?.cover,
    thumbnail: post?.thumbnail ?? post?.image ?? post?.cover,
    likes: post?.likes,
    views: post?.views ?? post?.plays,
    plays: post?.plays,
    comments: post?.comments,
    sponsors: Array.isArray(post?.sponsors)
      ? post.sponsors.map((s: any) => ({ name: s?.name ?? s?.username }))
      : [],
    createdAt:
      post?.createdAt ??
      post?.created ??
      post?.publishedAt ??
      post?.postedAt ??
      post?.date,
    publishedAt:
      post?.publishedAt ??
      post?.createdAt ??
      post?.created ??
      post?.postedAt ??
      post?.date,
    postedAt:
      post?.postedAt ??
      post?.publishedAt ??
      post?.createdAt ??
      post?.created ??
      post?.date,
    date:
      post?.date ??
      post?.publishedAt ??
      post?.createdAt ??
      post?.created ??
      post?.postedAt,
    created:
      post?.created ??
      post?.createdAt ??
      post?.publishedAt ??
      post?.postedAt ??
      post?.date,
  };
}

function isSponsoredContentPost(post: SocialPost): boolean {
  const text = String(post?.text ?? '').toLowerCase();
  const sponsorNames = (post?.sponsors ?? [])
    .map((s) => String(s?.name ?? '').toLowerCase())
    .join(' ');
  const haystack = `${text} ${sponsorNames}`;

  return [
    '#ad',
    '#ads',
    '#sponsored',
    '#invited',
    '#gifted',
    '#partner',
    'paid partnership',
    'sponsored by',
    'partner',
    'invited',
    'gifted',
  ].some((marker) => haystack.includes(marker));
}

function toNormalizedPosts(input: unknown): SocialPost[] {
  if (!Array.isArray(input)) return [];

  return input
    .map((post) => normalizePost(post))
    .filter(
      (post) =>
        Boolean(
          post?.url ||
          post?.text ||
          post?.image ||
          post?.thumbnail ||
          post?.createdAt ||
          post?.publishedAt ||
          post?.postedAt ||
          post?.date ||
          post?.created
        )
    );
}

function getPostTimestamp(post: SocialPost): number {
  const rawDate =
    post.createdAt ??
    post.publishedAt ??
    post.postedAt ??
    post.date ??
    post.created;

  const ts = rawDate ? new Date(rawDate).getTime() : 0;
  return Number.isFinite(ts) ? ts : 0;
}

function formatPostDate(post: SocialPost): string | undefined {
  const ts = getPostTimestamp(post);
  if (!ts) return undefined;
  return new Date(ts).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function dedupeAndSortPosts(posts: SocialPost[]): SocialPost[] {
  const map = new Map<string, SocialPost>();

  for (const post of posts) {
    const key =
      post.url ||
      [
        post.createdAt ?? post.publishedAt ?? post.postedAt ?? post.date ?? post.created ?? "no-date",
        post.text ?? "",
        post.image ?? post.thumbnail ?? "",
      ].join("__");

    if (!map.has(key)) {
      map.set(key, post);
    }
  }

  return Array.from(map.values()).sort(
    (a, b) => getPostTimestamp(b) - getPostTimestamp(a)
  );
}
function dedupePostsPreserveOrder(posts: SocialPost[]): SocialPost[] {
  const map = new Map<string, SocialPost>();

  for (const post of posts) {
    const key =
      post.url ||
      [
        post.createdAt ?? post.publishedAt ?? post.postedAt ?? post.date ?? post.created ?? "no-date",
        post.text ?? "",
        post.image ?? post.thumbnail ?? "",
      ].join("__");

    if (!map.has(key)) {
      map.set(key, post);
    }
  }

  return Array.from(map.values());
}
function resolveRecentPostsForTable(params: {
  displayedReport: InfluencerReportShape | null;
  primaryReport: InfluencerReportShape | null;
  data: ReportResponse | null;
  raw: any;
  connectedProfiles: InfluencerReportShape[];
}): SocialPost[] {
  const { displayedReport, primaryReport, data, raw, connectedProfiles } = params;

  const reportProfile = ((data?.profile as any) ?? {}) as Record<string, any>;
  const nestedReportProfile = ((reportProfile?.profile as any) ?? {}) as Record<string, any>;

  const directRecent = dedupeAndSortPosts([
    ...(displayedReport?.recentPosts ?? []),
    ...(primaryReport?.recentPosts ?? []),

    ...toNormalizedPosts(reportProfile?.recentPosts),
    ...toNormalizedPosts(nestedReportProfile?.recentPosts),
    ...toNormalizedPosts(reportProfile?.posts),
    ...toNormalizedPosts(nestedReportProfile?.posts),

    ...toNormalizedPosts(raw?.recentPosts),
    ...toNormalizedPosts(raw?.posts),

    ...toNormalizedPosts(raw?.profile?.recentPosts),
    ...toNormalizedPosts(raw?.profile?.profile?.recentPosts),
    ...toNormalizedPosts(raw?.profile?.posts),
    ...toNormalizedPosts(raw?.profile?.profile?.posts),

    ...toNormalizedPosts(raw?.providerRaw?.recentPosts),
    ...toNormalizedPosts(raw?.providerRaw?.profile?.recentPosts),
    ...toNormalizedPosts(raw?.providerRaw?.posts),
    ...toNormalizedPosts(raw?.providerRaw?.profile?.posts),

    ...toNormalizedPosts(raw?.mediaKit?.recentPosts),
    ...toNormalizedPosts(raw?.mediaKit?.posts),

    ...(raw?.socialProfiles ?? []).flatMap((profile: any) =>
      toNormalizedPosts(profile?.recentPosts ?? profile?.posts)
    ),
    ...(raw?.mediaKit?.socialProfiles ?? []).flatMap((profile: any) =>
      toNormalizedPosts(profile?.recentPosts ?? profile?.posts)
    ),

    ...connectedProfiles.flatMap((profile) => profile?.recentPosts ?? []),
  ]);

  if (directRecent.length > 0) {
    return directRecent;
  }

  return dedupeAndSortPosts([
    ...(displayedReport?.popularPosts ?? []),
    ...(primaryReport?.popularPosts ?? []),
    ...(displayedReport?.sponsoredPosts ?? []),
    ...(primaryReport?.sponsoredPosts ?? []),

    ...toNormalizedPosts(reportProfile?.popularPosts),
    ...toNormalizedPosts(reportProfile?.sponsoredPosts),
    ...toNormalizedPosts(reportProfile?.posts),

    ...toNormalizedPosts(nestedReportProfile?.popularPosts),
    ...toNormalizedPosts(nestedReportProfile?.sponsoredPosts),
    ...toNormalizedPosts(nestedReportProfile?.posts),

    ...toNormalizedPosts(raw?.popularPosts),
    ...toNormalizedPosts(raw?.sponsoredPosts),
    ...toNormalizedPosts(raw?.posts),

    ...toNormalizedPosts(raw?.profile?.popularPosts),
    ...toNormalizedPosts(raw?.profile?.sponsoredPosts),
    ...toNormalizedPosts(raw?.profile?.posts),

    ...toNormalizedPosts(raw?.providerRaw?.popularPosts),
    ...toNormalizedPosts(raw?.providerRaw?.sponsoredPosts),
    ...toNormalizedPosts(raw?.providerRaw?.posts),
    ...toNormalizedPosts(raw?.providerRaw?.profile?.popularPosts),
    ...toNormalizedPosts(raw?.providerRaw?.profile?.sponsoredPosts),
    ...toNormalizedPosts(raw?.providerRaw?.profile?.posts),

    ...toNormalizedPosts(raw?.mediaKit?.popularPosts),
    ...toNormalizedPosts(raw?.mediaKit?.sponsoredPosts),
    ...toNormalizedPosts(raw?.mediaKit?.posts),

    ...(raw?.socialProfiles ?? []).flatMap((profile: any) =>
      toNormalizedPosts(
        profile?.popularPosts ?? profile?.sponsoredPosts ?? profile?.posts
      )
    ),
    ...(raw?.mediaKit?.socialProfiles ?? []).flatMap((profile: any) =>
      toNormalizedPosts(
        profile?.popularPosts ?? profile?.sponsoredPosts ?? profile?.posts
      )
    ),

    ...connectedProfiles.flatMap((profile) => profile?.popularPosts ?? []),
    ...connectedProfiles.flatMap((profile) => profile?.sponsoredPosts ?? []),
  ]);
}

function resolvePopularPostsForPanel(params: {
  displayedReport: InfluencerReportShape | null;
  primaryReport: InfluencerReportShape | null;
  data: ReportResponse | null;
  raw: any;
  connectedProfiles: InfluencerReportShape[];
}): SocialPost[] {
  const { displayedReport, primaryReport, data, raw, connectedProfiles } = params;

  const reportProfile = ((data?.profile as any) ?? {}) as Record<string, any>;
  const nestedReportProfile = ((reportProfile?.profile as any) ?? {}) as Record<string, any>;

  const popular = dedupePostsPreserveOrder([
    ...(displayedReport?.popularPosts ?? []),
    ...(primaryReport?.popularPosts ?? []),

    ...toNormalizedPosts(reportProfile?.popularPosts),
    ...toNormalizedPosts(nestedReportProfile?.popularPosts),

    ...toNormalizedPosts(raw?.popularPosts),
    ...toNormalizedPosts(raw?.profile?.popularPosts),
    ...toNormalizedPosts(raw?.profile?.profile?.popularPosts),

    ...toNormalizedPosts(raw?.providerRaw?.popularPosts),
    ...toNormalizedPosts(raw?.providerRaw?.profile?.popularPosts),

    ...toNormalizedPosts(raw?.mediaKit?.popularPosts),

    ...(raw?.socialProfiles ?? []).flatMap((profile: any) =>
      toNormalizedPosts(profile?.popularPosts)
    ),
    ...(raw?.mediaKit?.socialProfiles ?? []).flatMap((profile: any) =>
      toNormalizedPosts(profile?.popularPosts)
    ),

    ...connectedProfiles.flatMap((profile) => profile?.popularPosts ?? []),
  ]);

  if (popular.length > 0) return popular;

  return dedupeAndSortPosts([
    ...(displayedReport?.recentPosts ?? []),
    ...(primaryReport?.recentPosts ?? []),

    ...toNormalizedPosts(reportProfile?.recentPosts),
    ...toNormalizedPosts(nestedReportProfile?.recentPosts),
    ...toNormalizedPosts(reportProfile?.posts),
    ...toNormalizedPosts(nestedReportProfile?.posts),

    ...toNormalizedPosts(raw?.recentPosts),
    ...toNormalizedPosts(raw?.posts),
    ...toNormalizedPosts(raw?.profile?.recentPosts),
    ...toNormalizedPosts(raw?.profile?.posts),
    ...toNormalizedPosts(raw?.profile?.profile?.recentPosts),
    ...toNormalizedPosts(raw?.profile?.profile?.posts),

    ...toNormalizedPosts(raw?.providerRaw?.recentPosts),
    ...toNormalizedPosts(raw?.providerRaw?.posts),
    ...toNormalizedPosts(raw?.providerRaw?.profile?.recentPosts),
    ...toNormalizedPosts(raw?.providerRaw?.profile?.posts),

    ...toNormalizedPosts(raw?.mediaKit?.recentPosts),
    ...toNormalizedPosts(raw?.mediaKit?.posts),

    ...connectedProfiles.flatMap((profile) => profile?.recentPosts ?? []),
  ]);
}

function normalizeHistoryPoint(point: any, fallbackFollowers = 0): ModashStatHistory {
  return {
    month: String(point?.month ?? ''),
    followers: toNumber(point?.followers ?? fallbackFollowers),
    avgLikes: toNumber(point?.avgLikes ?? point?.avg_likes),
    following: toNumber(point?.following),
    avgComments: toNumber(point?.avgComments ?? point?.avg_comments),
    avgViews: toNumber(point?.avgViews ?? point?.avg_views),
  };
}

function hasAudienceInsights(report?: InfluencerReportShape | null): boolean {
  if (!report?.audience) return false;

  return Boolean(
    report.audience.ages?.length ||
    report.audience.genders?.length ||
    report.audience.geoCountries?.length ||
    report.audience.languages?.length ||
    report.audience.credibility !== undefined
  );
}

function toInfluencerReportShape(
  source: any,
  fallbackPlatform: SupportedPlatform
): InfluencerReportShape {
  const root = source?.profile?.profile ?? source?.profile ?? source ?? {};

  const stats =
    source?.stats ??
    source?.profile?.stats ??
    root?.stats ??
    {};

  const audience =
    source?.audience ??
    source?.profile?.audience ??
    root?.audience ??
    {};

  const rawHistory =
    source?.statsByContentType?.all?.statHistory ??
    source?.statHistory ??
    source?.profile?.statHistory ??
    root?.statHistory ??
    [];

  const username =
    stripHandlePrefix(root?.username) ??
    stripHandlePrefix(source?.username) ??
    stripHandlePrefix(root?.handle) ??
    stripHandlePrefix(source?.handle);



  const handle =
    root?.handle ??
    source?.handle ??
    (username ? `@${username}` : undefined);

  const avgLikes =
    stats?.avgLikes?.value ??
    source?.avgLikes ??
    source?.profile?.avgLikes ??
    source?.profile?.stats?.avgLikes?.value ??
    source?.profile?.profile?.avgLikes ??
    root?.avgLikes ??
    root?.engagements;

  const avgComments =
    stats?.avgComments?.value ??
    source?.avgComments ??
    source?.profile?.avgComments ??
    source?.profile?.stats?.avgComments?.value ??
    source?.profile?.profile?.avgComments ??
    root?.avgComments;

  const avgViews =
    stats?.avgViews?.value ??
    source?.avgViews ??
    source?.avgReelsPlays ??
    source?.profile?.avgViews ??
    source?.profile?.avgReelsPlays ??
    source?.profile?.stats?.avgViews?.value ??
    source?.profile?.profile?.averageViews ??
    source?.profile?.profile?.avgViews ??
    root?.averageViews ??
    root?.avgViews;

  const followers =
    root?.followers ??
    source?.followers ??
    stats?.followers?.value ??
    source?.subscribers;

  const resolvedPopularPosts =
    Array.isArray(source?.popularPosts)
      ? source.popularPosts
      : Array.isArray(root?.popularPosts)
        ? root.popularPosts
        : [];

  const resolvedRecentPosts =
    Array.isArray(source?.recentPosts)
      ? source.recentPosts
      : Array.isArray(root?.recentPosts)
        ? root.recentPosts
        : Array.isArray(source?.posts)
          ? source.posts
          : Array.isArray(root?.posts)
            ? root.posts
            : [];

  const resolvedSponsoredPosts =
    Array.isArray(source?.sponsoredPosts)
      ? source.sponsoredPosts
      : Array.isArray(root?.sponsoredPosts)
        ? root.sponsoredPosts
        : [];

  const resolvedFollowersRange =
    source?.audienceExtra?.followersRange ??
    root?.audienceExtra?.followersRange;

  const audienceCredibility = pickNumber(
    audience?.credibility,
    audience?.notable,
    source?.audience?.credibility,
    source?.audience?.notable,
    source?.profile?.audience?.credibility,
    source?.profile?.audience?.notable,
    source?.profile?.profile?.audience?.credibility,
    source?.profile?.profile?.audience?.notable,
    root?.audience?.credibility,
    root?.audience?.notable
  );

  return {
    modashId: String(
      source?.userId ??
      source?.modashId ??
      source?._id ??
      root?.userId ??
      ''
    ),
    _id: source?._id ?? root?._id,
    provider: source?.provider ?? source?.platform ?? root?.provider ?? fallbackPlatform,
    url: root?.url ?? source?.url,
    name: root?.fullname ?? source?.name ?? root?.username,
    fullname: root?.fullname ?? source?.fullname ?? root?.username,
    picture: root?.picture ?? source?.picture,
    bio: source?.bio ?? root?.bio,
    username,
    handle,
    followers,
    subscribers: source?.subscribers ?? root?.subscribers,
    engagementRate: root?.engagementRate ?? source?.engagementRate,
    country: pickFirstText(
      source?.country,
      root?.country,
      source?.profile?.country,
      source?.profile?.profile?.country,
      source?.mediaKit?.country,
      source?.location?.country,
      root?.location?.country
    ),
    location: pickFirstText(
      source?.location,
      root?.location,
      source?.profile?.location,
      source?.profile?.profile?.location,
      source?.mediaKit?.location
    ),
    city: pickFirstText(
      source?.city,
      root?.city,
      source?.profile?.city,
      source?.profile?.profile?.city,
      source?.location?.city,
      root?.location?.city
    ),
    state: pickFirstText(
      source?.state,
      root?.state,
      source?.profile?.state,
      source?.profile?.profile?.state,
      source?.location?.state,
      root?.location?.state
    ),
    language:
      typeof source?.language === 'string'
        ? { name: source.language }
        : source?.language?.name
          ? { name: source.language.name }
          : typeof root?.language === 'string'
            ? { name: root.language }
            : root?.language?.name
              ? { name: root.language.name }
              : undefined,
    hashtags: Array.isArray(source?.hashtags)
      ? source.hashtags.map((item: any) => ({ tag: item?.tag }))
      : Array.isArray(root?.hashtags)
        ? root.hashtags.map((item: any) => ({ tag: item?.tag }))
        : [],
    popularPosts: resolvedPopularPosts.map(normalizePost),
    recentPosts: resolvedRecentPosts.map(normalizePost),
    sponsoredPosts: resolvedSponsoredPosts.map(normalizePost),
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
    avgReelsPlays:
      source?.avgReelsPlays ??
      source?.profile?.avgReelsPlays ??
      root?.avgReelsPlays ??
      avgViews,
    audience: audience
      ? {
        geoCountries: Array.isArray(audience?.geoCountries)
          ? audience.geoCountries.map((c: any) => ({
            name: c?.name,
            weight: toNumber(c?.weight),
          }))
          : [],
        ages: Array.isArray(audience?.ages)
          ? audience.ages.map((a: any) => ({
            code: a?.code,
            weight: toNumber(a?.weight),
          }))
          : [],
        genders: Array.isArray(audience?.genders)
          ? audience.genders.map((g: any) => ({
            code: g?.code,
            weight: toNumber(g?.weight),
          }))
          : [],
        languages: Array.isArray(audience?.languages)
          ? audience.languages.map((l: any) => ({
            code: l?.name ?? l?.code ?? '',
            weight: toNumber(l?.weight),
          }))
          : [],
        interests: Array.isArray(audience?.interests)
          ? audience.interests.map((i: any) => ({
            name: i?.name ?? '',
            weight: toNumber(i?.weight),
          }))
          : [],
        credibility: audienceCredibility,
        notable: audience?.notable,
        brandAffinity: Array.isArray(audience?.brandAffinity)
          ? audience.brandAffinity
          : [],
      }
      : undefined,
    isPrivate: root?.isPrivate ?? source?.isPrivate,
    isVerified: root?.isVerified ?? source?.isVerified,
    accountType: root?.accountType ?? source?.accountType,
    postsCount: root?.postsCount ?? source?.postsCount,
    statHistory: Array.isArray(rawHistory)
      ? rawHistory.map((item: any) =>
        normalizeHistoryPoint(item, toNumber(followers))
      )
      : [],
    followersRange: resolvedFollowersRange,
  };
}


function SectionGroupHeader({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-3 flex items-center gap-3">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-teal-50 text-teal-600">
        <Icon className="h-[18px] w-[18px]" />
      </div>
      <div>
        <h2 className="text-base font-semibold text-[#1f1f1f]">{title}</h2>
        {subtitle ? (
          <p className="text-xs text-[#8a8175]">{subtitle}</p>
        ) : null}
      </div>
    </div>
  );
}

function PastCollaborationsCard({
  collaborations,
}: {
  collaborations: PastCollaboration[];
}) {
  const hasItems = collaborations.length > 0;

  return (
    <SectionCard
      title={
        hasItems
          ? `${collaborations.length} brand${collaborations.length === 1 ? '' : 's'} detected`
          : 'No sponsored collaborations detected'
      }
      eyebrow="Past brand collaborations"
    >
      {!hasItems ? (
        <div className="rounded-2xl border border-dashed border-[#efe8dd] bg-[#fffdfa] px-6 py-10 text-center">
          <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-teal-50 text-teal-600">
            <Handshake className="h-5 w-5" />
          </div>

          <div className="text-sm font-semibold text-[#1f1f1f]">
            No sponsored collaborations detected
          </div>

          <div className="mt-1 text-xs text-[#8a8175]">
            No sponsored collaborations detected in recent public content.
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {collaborations.map(({ name, post }) => {
            const thumb = post.image || post.thumbnail;
            const dateLabel = formatPostDate(post);

            return (
              <div
                key={name}
                className="flex items-center gap-3 rounded-2xl border border-[#efe8dd] bg-[#fffdfa] p-3"
              >
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-[#ece4d8]">
                  {thumb ? (
                    <img
                      src={thumb}
                      alt={name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-teal-700">
                      <Handshake className="h-5 w-5" />
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-[#1f1f1f]">
                    {name}
                  </div>
                  <div className="text-xs text-[#8a8175]">
                    {dateLabel || 'Sponsored content'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
}

function AccessBlurSection({
  unlocked,
  showPrompt = false,
  title = 'Unlock the complete profile',
  subtitle = 'Log in to explore the full creator profile, premium analytics, and private collaboration details.',
  onUnlock,
  children,
}: {
  unlocked: boolean;
  showPrompt?: boolean;
  title?: string;
  subtitle?: string;
  onUnlock?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <div
        className={
          unlocked
            ? ''
            : 'pointer-events-none select-none overflow-hidden rounded-[28px]'
        }
      >
        <div className={unlocked ? '' : 'blur-[10px] opacity-75 saturate-[0.9]'}>
          {children}
        </div>
      </div>

      {!unlocked ? (
        <div className="absolute inset-0 z-10 rounded-[28px] bg-[#fff8e8]/38 backdrop-blur-[2px]">
          {showPrompt ? (
            <div className="flex h-full items-center justify-center">
              <div
                className="mx-6 max-w-sm rounded-[28px] border border-[#ead28a] px-7 py-6 text-center shadow-[0_24px_70px_rgba(183,145,35,0.14)]"
                style={{
                  background:
                    'linear-gradient(156.55deg, #FFFBF04D 0%, #FBFAF9FF 50%, #FDF2FC33 100%)',
                }}
              >
                <div className="mb-4 flex justify-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[#e6c968] bg-gradient-to-b from-[#fff4c7] to-[#f1d05d] shadow-[0_8px_24px_rgba(212,173,58,0.18)]">
                    <LockKeyOpenIcon
                      size={26}
                      weight="duotone"
                      className="text-[#a97c00]"
                    />
                  </div>
                </div>

                <div className="mb-2 text-[28px] font-semibold leading-tight text-[#b88300]">
                  {title}
                </div>

                <div className="mx-auto max-w-[300px] text-sm leading-6 text-[#7d6b45]">
                  {subtitle}
                </div>

                <button
                  type="button"
                  onClick={onUnlock}
                  className="mt-5 inline-flex items-center justify-center rounded-full border border-[#e3c14e] bg-gradient-to-r from-[#f2d15b] to-[#e7bf43] px-5 py-2.5 text-sm font-medium text-[#5e470f] shadow-[0_10px_28px_rgba(212,173,58,0.22)]"
                >
                  Log in to unlock
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="absolute inset-0 rounded-[28px] bg-gradient-to-b from-white/10 via-transparent to-white/18" />
              <div className="absolute right-5 top-5 inline-flex items-center gap-2 rounded-full border border-[#ead28a] bg-white/78 px-3 py-1.5 text-xs font-medium text-[#8c6a10] shadow-sm backdrop-blur-md">
                <LockKeyOpenIcon size={14} weight="duotone" />
                Premium preview
              </div>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}


function SecurityCheckOverlay({
  checking,
  onRetry,
}: {
  checking: boolean;
  onRetry: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[200] bg-[#fbf8f3]/90 backdrop-blur-sm">
      <div className="flex min-h-screen items-center justify-center p-6">
        <div
          className="w-full max-w-md rounded-[28px] border border-[#ead28a] px-7 py-8 text-center shadow-[0_24px_70px_rgba(183,145,35,0.14)]"
          style={{
            background:
              'linear-gradient(156.55deg, #FFFBF04D 0%, #FBFAF9FF 50%, #FDF2FC33 100%)',
          }}
        >
          <div className="mb-4 flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[#e6c968] bg-gradient-to-b from-[#fff4c7] to-[#f1d05d] shadow-[0_8px_24px_rgba(212,173,58,0.18)]">
              <LockKeyOpenIcon
                size={26}
                weight="duotone"
                className="text-[#a97c00]"
              />
            </div>
          </div>

          <div className="mb-2 text-[28px] font-semibold leading-tight text-[#b88300]">
            Security check required
          </div>

          <div className="mx-auto max-w-[320px] text-sm leading-6 text-[#7d6b45]">
            You refreshed this page 3 times. We’re running an invisible security
            verification before continuing.
          </div>

          <div className="mt-6 space-y-4">
            <div className="text-sm leading-6 text-[#7d6b45]">
              {checking
                ? 'Running invisible security verification...'
                : 'Verification did not complete. Please try again.'}
            </div>

            {!checking ? (
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center justify-center rounded-full border border-[#e3c14e] bg-gradient-to-r from-[#f2d15b] to-[#e7bf43] px-5 py-2.5 text-sm font-medium text-[#5e470f] shadow-[0_10px_28px_rgba(212,173,58,0.22)]"
              >
                Try again
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfluencerDetailFullPageInner({
  loading,
  error,
  data,
  raw,
  platform,
  emailExists,
  handle,
  lastFetchedAt,
  onRefreshReport,
  onChangeCalc,
  viewerRole,
  youtubeEngagementRate,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const campaignId = searchParams?.get('campaignId') || '';
  const accessParam = (searchParams?.get('access') || '').trim().toLowerCase();
  const hasAdminAccess = accessParam === 'admin';

  const [brandId, setBrandId] = useState('');
  const [adminId, setAdminId] = useState('');
  const [influencerId, setInfluencerId] = useState('');
  const [sendingInvite, setSendingInvite] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [campaigns, setCampaigns] = useState<{ campaignsId: string; campaignTitle?: string }[]>([]);
  const [campaignsLoading, setCampaignsLoading] = useState(false);
  const [selectedCampaignIds, setSelectedCampaignIds] = useState<string[]>(campaignId ? [campaignId] : []);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(lastFetchedAt || null);
  const [calculationMethod, setCalculationMethod] = useState<'median' | 'average'>('average');
  const [activePlatform, setActivePlatform] = useState<SupportedPlatform>(normalisePlatform(platform));
  const [activeReport, setActiveReport] = useState<InfluencerReportShape | null>(null);
  const effectiveViewerRole: 'brand' | 'admin' | '' = hasAdminAccess ? 'admin' : (viewerRole ?? '');
  const [refreshCount, setRefreshCount] = useState(0);
  const [captchaRequired, setCaptchaRequired] = useState(false);
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [captchaChecking, setCaptchaChecking] = useState(false);
  const [captchaAttempt, setCaptchaAttempt] = useState(0);
  const { executeRecaptcha } = useGoogleReCaptcha();
  const hasBrandAccess = Boolean((brandId || '').trim());
  const hasAdminStoredAccess = Boolean((adminId || '').trim());
  const hasInfluencerAccess = Boolean((influencerId || '').trim());


  useEffect(() => {
    if (typeof window === 'undefined') return;

    const countKey = `cg-refresh-count:${pathname}`;
    const verifiedKey = `cg-refresh-verified:${pathname}`;

    const navEntry = performance.getEntriesByType('navigation')[0] as
      | PerformanceNavigationTiming
      | undefined;

    const isReload =
      navEntry?.type === 'reload' ||
      (typeof performance !== 'undefined' &&
        typeof (performance as any).navigation !== 'undefined' &&
        (performance as any).navigation.type === 1);

    const previousCount = Number(sessionStorage.getItem(countKey) || '0');
    const nextCount = isReload ? previousCount + 1 : 0;

    sessionStorage.setItem(countKey, String(nextCount));
    setRefreshCount(nextCount);

    const alreadyVerified = sessionStorage.getItem(verifiedKey) === '1';
    setCaptchaVerified(alreadyVerified);
    setCaptchaRequired(nextCount >= 3 && !alreadyVerified);
  }, [pathname]);


  const markCaptchaPassed = () => {
    const countKey = `cg-refresh-count:${pathname}`;
    const verifiedKey = `cg-refresh-verified:${pathname}`;

    sessionStorage.setItem(countKey, '0');
    sessionStorage.setItem(verifiedKey, '1');

    setRefreshCount(0);
    setCaptchaVerified(true);
    setCaptchaRequired(false);
  };

  const markCaptchaFailed = () => {
    const verifiedKey = `cg-refresh-verified:${pathname}`;
    sessionStorage.removeItem(verifiedKey);
    setCaptchaVerified(false);
    setCaptchaRequired(true);
  };

  useEffect(() => {
    if (!captchaRequired || captchaVerified) return;
    if (!executeRecaptcha) return;

    let cancelled = false;

    (async () => {
      try {
        setCaptchaChecking(true);
        const token = await executeRecaptcha('media_kit_refresh_gate');

        if (cancelled) return;

        if (token) {
          markCaptchaPassed();
        } else {
          markCaptchaFailed();
        }
      } catch {
        if (!cancelled) {
          markCaptchaFailed();
        }
      } finally {
        if (!cancelled) setCaptchaChecking(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [captchaRequired, captchaVerified, executeRecaptcha, captchaAttempt, pathname]);

  const canViewRestrictedSections =
    hasAdminAccess ||
    hasAdminStoredAccess ||
    hasBrandAccess ||
    hasInfluencerAccess ||
    effectiveViewerRole === 'admin' ||
    effectiveViewerRole === 'brand';
  const showContactManagementCard = useMemo(() => {
    const hasBrandId = Boolean((brandId || '').trim());
    const hasAdminId = Boolean((adminId || '').trim());

    const hasInfluencerId =
      typeof window !== 'undefined' &&
      Boolean((localStorage.getItem('influencerId') || '').trim());

    return hasAdminAccess || hasAdminId || (!hasBrandId && hasInfluencerId);
  }, [brandId, adminId, hasAdminAccess]);

  useEffect(() => {
    const b = (localStorage.getItem('brandId') || '').trim();
    const a = (localStorage.getItem('adminId') || '').trim();
    const i = (localStorage.getItem('influencerId') || '').trim();

    setBrandId(b);
    setAdminId(a);
    setInfluencerId(i);
  }, []);

  useEffect(() => {
    setLastUpdatedAt(lastFetchedAt || null);
  }, [lastFetchedAt]);

  const primaryReport = useMemo<InfluencerReportShape | null>(() => {
    const source = raw ?? data?.profile;
    if (!source) return null;
    return toInfluencerReportShape(source, normalisePlatform(platform));
  }, [raw, data, platform]);

  const connectedProfiles = useMemo<InfluencerReportShape[]>(() => {
    const rawProfiles =
      raw?.socialProfiles ??
      raw?.influencerReports ??
      raw?.mediaKit?.socialProfiles ??
      raw?.mediaKit?.influencerReports ??
      [];

    if (Array.isArray(rawProfiles) && rawProfiles.length) {
      const mapped = rawProfiles.map((item: any) =>
        toInfluencerReportShape(item, normalisePlatform(item?.provider ?? platform))
      );
      return Array.from(
        new Map(
          mapped
            .filter((item) => item?.provider)
            .map((item) => [String(item.provider).toLowerCase(), item])
        ).values()
      );
    }

    return primaryReport ? [primaryReport] : [];
  }, [raw, primaryReport, platform]);

  useEffect(() => {
    const initial =
      connectedProfiles.find(
        (item) => normalisePlatform(item.provider) === normalisePlatform(platform)
      ) ??
      primaryReport ??
      connectedProfiles[0] ??
      null;

    setActiveReport(initial);
    setActivePlatform(normalisePlatform(initial?.provider ?? platform));
  }, [connectedProfiles, primaryReport, platform]);

  const baseDisplayedReport = activeReport ?? primaryReport ?? null;

  const displayedReport = useMemo<InfluencerReportShape | null>(() => {
    if (!baseDisplayedReport) return null;

    if (activePlatform !== 'youtube') {
      return baseDisplayedReport;
    }

    return {
      ...baseDisplayedReport,
      engagementRate: youtubeEngagementRate ?? undefined,
    };
  }, [baseDisplayedReport, activePlatform, youtubeEngagementRate]);
  const audienceReport = useMemo<InfluencerReportShape | null>(() => {
    if (hasAudienceInsights(activeReport)) return activeReport;
    if (hasAudienceInsights(primaryReport)) return primaryReport;

    const firstProfileWithAudience = connectedProfiles.find((item) => hasAudienceInsights(item));
    return firstProfileWithAudience ?? displayedReport;
  }, [activeReport, primaryReport, connectedProfiles, displayedReport]);

  const mediaKit = useMemo<MediaKitShape>(() => {
    const audienceSource = audienceReport?.audience ?? {};

    return {
      _id: raw?._id ?? raw?.mediaKit?._id,
      mediaKitId: raw?.mediaKitId ?? raw?.mediaKit?.mediaKitId,
      influencerId: raw?.influencerId ?? data?.profile?.userId,
      primaryPlatform: displayedReport?.provider ?? platform,
      primaryInfluencerReport: displayedReport ?? undefined,
      influencerReports: connectedProfiles,
      socialProfiles: connectedProfiles,

      name: displayedReport?.fullname ?? displayedReport?.name,
      country: displayedReport?.country,
      location: displayedReport?.location,
      city: displayedReport?.city,
      state: displayedReport?.state,

      languages: displayedReport?.language?.name
        ? [{ name: displayedReport.language.name }]
        : [],

      // New demographics for media kit
      countryDemographics: Array.isArray(audienceSource?.geoCountries)
        ? audienceSource.geoCountries
        : [],
      audienceDemographics: {
        ages: Array.isArray(audienceSource?.ages) ? audienceSource.ages : [],
        genders: Array.isArray(audienceSource?.genders) ? audienceSource.genders : [],
        languages: Array.isArray(audienceSource?.languages)
          ? audienceSource.languages
          : [],
        interests: Array.isArray(audienceSource?.interests)
          ? audienceSource.interests
          : [],
        credibility: audienceSource?.credibility,
      },
      audience: audienceSource,

      email: raw?.email ?? raw?.mediaKit?.email,
      phone: raw?.phone ?? raw?.mediaKit?.phone,
      additionalNotes: raw?.additionalNotes ?? raw?.mediaKit?.additionalNotes,
      updatedAt: lastFetchedAt ?? raw?.updatedAt ?? raw?.mediaKit?.updatedAt,
    };
  }, [
    raw,
    data,
    connectedProfiles,
    displayedReport,
    audienceReport,
    platform,
    lastFetchedAt,
  ]);

  const canAct = Boolean(displayedReport?.modashId) && !loading && !sendingInvite && !refreshing;
  const formattedLastUpdated = lastUpdatedAt ? new Date(lastUpdatedAt).toLocaleString() : 'Not fetched yet';

  const recentPosts = displayedReport?.recentPosts ?? [];
  const sponsoredPosts = displayedReport?.sponsoredPosts ?? [];
  const popularPosts = displayedReport?.popularPosts ?? [];

  const recentPostsForTable = useMemo(() => {
    const rawProfileRecent = Array.isArray(raw?.profile?.recentPosts)
      ? raw.profile.recentPosts.map((post: any) => normalizePost(post))
      : [];

    if (rawProfileRecent.length > 0) {
      return dedupeAndSortPosts(rawProfileRecent);
    }

    const rawProfilePosts = Array.isArray(raw?.profile?.posts)
      ? raw.profile.posts.map((post: any) => normalizePost(post))
      : [];

    if (rawProfilePosts.length > 0) {
      return dedupeAndSortPosts(rawProfilePosts);
    }

    const rawProfilePopular = Array.isArray(raw?.profile?.popularPosts)
      ? raw.profile.popularPosts.map((post: any) => normalizePost(post))
      : [];

    if (rawProfilePopular.length > 0) {
      return dedupeAndSortPosts(rawProfilePopular);
    }

    return resolveRecentPostsForTable({
      displayedReport,
      primaryReport,
      data,
      raw,
      connectedProfiles,
    });
  }, [displayedReport, primaryReport, data, raw, connectedProfiles]);

  const popularPostsForPanel = useMemo(() => {
    return resolvePopularPostsForPanel({
      displayedReport,
      primaryReport,
      data,
      raw,
      connectedProfiles,
    });
  }, [displayedReport, primaryReport, data, raw, connectedProfiles]);

  const credibilityScore = useMemo(() => {
    const rawCredibility = pickNumber(
      audienceReport?.audience?.credibility,
      audienceReport?.audience?.notable,
      raw?.audience?.credibility,
      raw?.audience?.notable,
      raw?.profile?.audience?.credibility,
      raw?.profile?.audience?.notable,
      raw?.profile?.profile?.audience?.credibility,
      raw?.profile?.profile?.audience?.notable,
      (data as any)?.profile?.audience?.credibility,
      (data as any)?.profile?.audience?.notable,
      (data as any)?.profile?.profile?.audience?.credibility,
      (data as any)?.profile?.profile?.audience?.notable
    );

    if (rawCredibility !== undefined) {
      return rawCredibility <= 1
        ? Math.round(rawCredibility * 100)
        : Math.round(rawCredibility);
    }

    return 0;
  }, [audienceReport, raw, data]);

  const totalReach = useMemo(() => {
    if (!connectedProfiles.length) return toNumber(displayedReport?.followers ?? displayedReport?.subscribers);
    return connectedProfiles.reduce(
      (sum, item) => sum + toNumber(item.followers ?? item.subscribers),
      0
    );
  }, [connectedProfiles, displayedReport]);

  const { organicTrend, sponsoredTrend, trendLabels } = useMemo(() => {
    const history = displayedReport?.statHistory ?? [];

    if (history.length > 0) {
      const sorted = [...history].sort((a, b) => a.month.localeCompare(b.month));
      const labels = sorted.map((h) => {
        const [year, month] = String(h.month).split('-');
        const monthLabel = monthLabels[Math.max(0, Number(month) - 1)] ?? month;
        return year ? `${monthLabel} ${String(year).slice(2)}` : monthLabel;
      });

      return {
        organicTrend: normaliseTrend(sorted.map((h) => h.avgLikes), sorted.length),
        sponsoredTrend: normaliseTrend(sorted.map((h) => h.avgViews || h.followers), sorted.length),
        trendLabels: labels,
      };
    }

    return {
      organicTrend: normaliseTrend(recentPosts.map((p) => p.views ?? p.likes ?? 0)),
      sponsoredTrend: normaliseTrend(sponsoredPosts.map((p) => p.views ?? p.likes ?? 0)),
      trendLabels: undefined as string[] | undefined,
    };
  }, [displayedReport, recentPosts, sponsoredPosts]);

  const avgLikes = toNumber(displayedReport?.stats?.avgLikes?.value ?? displayedReport?.avgLikes);
  const avgViews = toNumber(
    displayedReport?.stats?.avgViews?.value ??
    displayedReport?.avgViews ??
    displayedReport?.avgReelsPlays ??
    average(recentPosts.map((p) => toNumber(p.views ?? p.likes)))
  );
  const engagementRate = toNumber(displayedReport?.engagementRate);

  const metricCards = useMemo<DashboardMetric[]>(() => {
    const followerCompared = toNumber(displayedReport?.stats?.followers?.compared);
    const likesCompared = toNumber(displayedReport?.stats?.avgLikes?.compared);
    const commentsCompared = toNumber(displayedReport?.stats?.avgComments?.compared);

    return [
      {
        key: 'followers',
        label: 'Followers',
        value: formatCompactNumber(displayedReport?.followers ?? displayedReport?.subscribers),
        delta: followerCompared ? `${(followerCompared * 100).toFixed(1)}%` : undefined,
      },
      {
        key: 'engagement',
        label: 'Avg. engagement rate',
        value: formatPercent(displayedReport?.engagementRate, true),
      },
      {
        key: 'likes',
        label: 'Average likes',
        value: formatCompactNumber(avgLikes),
        delta: likesCompared ? `${(likesCompared * 100).toFixed(1)}%` : undefined,
      },
      {
        key: 'views',
        label: 'Average views',
        value: formatCompactNumber(avgViews),
      },
      {
        key: 'comments',
        label: 'Average comments',
        value: formatCompactNumber(displayedReport?.stats?.avgComments?.value ?? displayedReport?.avgComments),
        delta: commentsCompared ? `${(commentsCompared * 100).toFixed(1)}%` : undefined,
      },
      {
        key: 'reach',
        label: 'Total reach',
        value: formatCompactNumber(totalReach),
      },
    ];
  }, [displayedReport, avgLikes, avgViews, totalReach]);

  const followerRangeLabel = useMemo(() => {
    const range = displayedReport?.followersRange;
    const left = Number(range?.leftNumber ?? 0);
    const right = Number(range?.rightNumber ?? 0);
    const followers = displayedReport?.followers ?? displayedReport?.subscribers;

    if (left > 0 && right > left) {
      return `${left.toLocaleString()} - ${right.toLocaleString()}`;
    }

    if (left > 0) {
      return `${left.toLocaleString()}+`;
    }

    return formatCompactNumber(followers);
  }, [displayedReport]);

  const campaignHighlights = useMemo<CampaignHighlight[]>(() => {
    const highlightPosts = recentPostsForTable.length
      ? recentPostsForTable
      : dedupeAndSortPosts([
        ...recentPosts,
        ...popularPosts,
        ...sponsoredPosts,
      ]);

    const detectedSponsoredPosts = dedupeAndSortPosts([
      ...sponsoredPosts,
      ...highlightPosts.filter((post) => isSponsoredContentPost(post)),
    ]);

    const organicPosts = highlightPosts.filter(
      (post) => !isSponsoredContentPost(post)
    );

    const fallbackAvgLikes =
      displayedReport?.stats?.avgLikes?.value ??
      displayedReport?.avgLikes ??
      raw?.stats?.avgLikes?.value ??
      raw?.avgLikes ??
      raw?.profile?.stats?.avgLikes?.value ??
      raw?.profile?.avgLikes ??
      raw?.profile?.profile?.avgLikes ??
      (data as any)?.profile?.stats?.avgLikes?.value ??
      (data as any)?.profile?.avgLikes ??
      (data as any)?.profile?.profile?.avgLikes;

    const sponsoredAvgLikes = detectedSponsoredPosts.length
      ? average(detectedSponsoredPosts.map((p) => toNumber(p.likes)))
      : toNumber(fallbackAvgLikes);

    const organicAvgLikes = organicPosts.length
      ? average(organicPosts.map((p) => toNumber(p.likes)))
      : highlightPosts.length
        ? average(highlightPosts.map((p) => toNumber(p.likes)))
        : toNumber(fallbackAvgLikes);

    const avgVideoReachValue =
      displayedReport?.avgReelsPlays ??
      displayedReport?.avgViews ??
      displayedReport?.stats?.avgViews?.value ??
      raw?.avgReelsPlays ??
      raw?.avgViews ??
      raw?.stats?.avgViews?.value ??
      raw?.profile?.avgReelsPlays ??
      raw?.profile?.avgViews ??
      raw?.profile?.stats?.avgViews?.value ??
      raw?.profile?.profile?.averageViews ??
      (data as any)?.profile?.avgReelsPlays ??
      (data as any)?.profile?.avgViews ??
      (data as any)?.profile?.stats?.avgViews?.value ??
      (data as any)?.profile?.profile?.averageViews;

    return [
      {
        label: 'Sponsored avg likes',
        value: formatCompactNumber(sponsoredAvgLikes),
        meta: detectedSponsoredPosts.length
          ? `Across ${detectedSponsoredPosts.length} sponsored posts`
          : 'Fallback to creator average likes',
        tone: 'accent',
      },
      {
        label: 'Organic avg likes',
        value: formatCompactNumber(organicAvgLikes),
        meta: organicPosts.length
          ? `Across ${organicPosts.length} recent posts`
          : highlightPosts.length
            ? `Across ${highlightPosts.length} recent posts`
            : 'Fallback to creator average likes',
      },
      {
        label: 'Audience size',
        value: followerRangeLabel,
        meta: 'Estimated creator bucket',
      },
      {
        label: activePlatform === 'tiktok' ? 'Avg video views' : 'Avg reel plays',
        value: formatCompactNumber(avgVideoReachValue),
        meta:
          activePlatform === 'tiktok'
            ? 'Average TikTok video reach'
            : 'Average reel/video reach',
      },
    ];
  }, [
    sponsoredPosts,
    recentPosts,
    recentPostsForTable,
    popularPosts,
    followerRangeLabel,
    displayedReport,
    raw,
    data,
    activePlatform,
  ]);

  const audienceAge =
    audienceReport?.audience?.ages?.map((item) => ({
      label: item.code,
      value: Number((item.weight || 0) * 100),
    })) ?? [];

  const audienceGender =
    audienceReport?.audience?.genders?.map((item) => ({
      label:
        item.code === 'MALE'
          ? 'Male'
          : item.code === 'FEMALE'
            ? 'Female'
            : item.code,
      value: Number((item.weight || 0) * 100),
    })) ?? [];

  const topCountries =
    audienceReport?.audience?.geoCountries?.slice(0, 4).map((item) => ({
      name: item.name,
      value: Number((item.weight || 0) * 100),
    })) ?? [];

  const topLanguages =
    audienceReport?.audience?.languages?.slice(0, 4).map((item) => ({
      label: item.code,
      value: Number((item.weight || 0) * 100),
    })) ?? [];

  const hasAudienceDemographics =
    audienceAge.length > 0 ||
    audienceGender.length > 0 ||
    topCountries.length > 0 ||
    topLanguages.length > 0 ||
    credibilityScore > 0;

  const pastCollaborations = useMemo<PastCollaboration[]>(() => {
    const candidatePosts = dedupeAndSortPosts([
      ...sponsoredPosts,
      ...recentPostsForTable,
      ...popularPostsForPanel,
    ]);

    const byBrand = new Map<string, PastCollaboration>();

    for (const post of candidatePosts) {
      const names = (post.sponsors ?? [])
        .map((s) => cleanText(s?.name))
        .filter(Boolean);

      for (const name of names) {
        const key = name.toLowerCase();
        if (!byBrand.has(key)) {
          byBrand.set(key, { name, post });
        }
      }
    }

    return Array.from(byBrand.values());
  }, [sponsoredPosts, recentPostsForTable, popularPostsForPanel]);

  const auditItems = useMemo<AuditItem[]>(() => {
    const lastSync = lastFetchedAt?.slice(0, 16).replace('T', ' ') || '—';
    return [
      {
        id: '1',
        date: lastSync,
        action: 'Influencer report sync',
        actor: 'System',
        status: 'Success',
      },
      {
        id: '2',
        date: lastSync,
        action: 'Media kit viewed',
        actor: effectiveViewerRole === 'admin' ? 'Admin' : 'Brand',
        status: 'Success',
      },
      {
        id: '3',
        date: lastSync,
        action: 'Audience analysis loaded',
        actor: 'Dashboard',
        status: 'Success',
      },
    ];
  }, [lastFetchedAt, effectiveViewerRole]);

  useEffect(() => {
    const bId = (brandId || '').trim();
    const aId = (adminId || '').trim();
    if (!hasAdminAccess && !aId && !bId) return;

    let cancelled = false;

    (async () => {
      try {
        setCampaignsLoading(true);

        const payload: any = hasAdminAccess
          ? { access: 'admin', ...(aId ? { adminId: aId } : {}), ...(bId ? { brandId: bId } : {}) }
          : aId
            ? { adminId: aId }
            : { brandId: bId };
        const resp: any = await post('/admins/campaign/lite', payload);

        if (cancelled) return;

        const items = resp?.campaigns || resp?.data?.campaigns || [];
        setCampaigns(
          items.map((c: any) => ({
            campaignsId: c.campaignId || c.campaignsId || String(c._id || ''),
            campaignTitle: c.campaignTitle,
          }))
        );
      } catch {
        setCampaigns([]);
      } finally {
        if (!cancelled) setCampaignsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [brandId, adminId, hasAdminAccess]);

  const toggleCampaign = (id: string, checked: boolean) => {
    setSelectedCampaignIds((prev) =>
      checked ? Array.from(new Set([...prev, id])) : prev.filter((p) => p !== id)
    );
  };

  const handlePlatformSelect = (profile: InfluencerReportShape) => {
    setActivePlatform(normalisePlatform(profile.provider));
    setActiveReport(profile);
  };

  const handleRefreshData = async () => {
    if (!onRefreshReport || refreshing) return;

    try {
      setRefreshing(true);
      await onRefreshReport();
    } catch (err: any) {
      await Swal.fire('Refresh failed', err?.message || 'Failed to refresh data', 'error');
    } finally {
      setRefreshing(false);
    }
  };
  const handleDashboardBack = () => {
    const localInfluencerId =
      typeof window !== 'undefined'
        ? (localStorage.getItem('influencerId') || '').trim()
        : '';

    const localBrandId =
      typeof window !== 'undefined'
        ? (localStorage.getItem('brandId') || '').trim()
        : '';

    if (localInfluencerId || influencerId) {
      router.push('/influencer/dashboard');
      return;
    }

    if (localBrandId || brandId) {
      router.push('/brand/dashboard');
      return;
    }

    router.back();
  };
  const handleMediaKit = async () => {
    const url = window.location.href;

    try {
      await navigator.clipboard.writeText(url);
      await Swal.fire({
        icon: 'success',
        title: 'Link copied!',
        text: 'Media kit link copied to clipboard.',
        timer: 1500,
        showConfirmButton: false,
      });
    } catch {
      try {
        const ta = document.createElement('textarea');
        ta.value = url;
        ta.style.position = 'fixed';
        ta.style.top = '0';
        ta.style.left = '0';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);

        await Swal.fire({
          icon: 'success',
          title: 'Link copied!',
          text: 'Media kit link copied to clipboard.',
          timer: 1500,
          showConfirmButton: false,
        });
      } catch {
        await Swal.fire({
          icon: 'error',
          title: 'Copy failed',
          text: 'Could not copy the link. Please copy it manually from the address bar.',
        });
      }
    }
  };

  const sendInvitationsForCampaigns = async (campaignIds: string[]) => {
    if (!canAct || sendingInvite) return;

    const normalizedPlatform = normalisePlatform(displayedReport?.provider ?? platform);
    const modashUserId = String(displayedReport?.modashId || data?.profile?.userId || '').trim();

    if (!modashUserId) {
      await Swal.fire('Missing userId', 'Modash userId not found in report.', 'warning');
      return;
    }

    const ids = (campaignIds || []).map((x) => String(x || '').trim()).filter(Boolean);
    if (!ids.length) {
      await Swal.fire('Select campaign', 'Please select at least one campaign.', 'info');
      return;
    }

    const bId = (brandId || '').trim();
    const aId = (adminId || '').trim();

    if (!hasAdminAccess && !bId && !aId) {
      await Swal.fire('Login required', 'brandId or adminId missing. Please login again.', 'warning');
      return;
    }

    try {
      setSendingInvite(true);

      const payload: any = {
        userId: modashUserId,
        platform: normalizedPlatform,
        campaignsIds: ids,
      };

      if (hasAdminAccess) payload.access = 'admin';
      if (aId) payload.adminId = aId;
      else if (bId) payload.brandId = bId;

      const resp = await post<StoreInvitationResponse>('/admin-invitations/send', payload);

      if (!resp) {
        await Swal.fire('Error', 'No response from server.', 'error');
        return;
      }

      if (resp.status === 'error') {
        await Swal.fire('Error', resp.message || 'Failed to store invitations.', 'error');
        return;
      }

      const stored = Number(resp.stored ?? 0);
      const missing = Array.isArray(resp.missingCampaigns) ? resp.missingCampaigns : [];

      if (stored > 0) {
        let msg = `Stored ${stored} invitation(s).`;
        if (missing.length) msg += ` Missing campaigns: ${missing.join(', ')}`;
        await Swal.fire('Invite stored', msg, 'success');
      } else {
        const msg = missing.length
          ? `No invites stored. Missing campaigns: ${missing.join(', ')}`
          : 'No invites stored.';
        await Swal.fire('Nothing stored', msg, 'info');
      }

      router.push('/brand/invited');
    } catch (err: any) {
      await Swal.fire('Error', err?.message || 'Failed to store invitations', 'error');
    } finally {
      setSendingInvite(false);
    }
  };

  const handleSendFromDropdown = async () => {
    setDropdownOpen(false);
    await sendInvitationsForCampaigns(selectedCampaignIds);
  };

  const handleCalcChange = (value: 'median' | 'average') => {
    setCalculationMethod(value);
    onChangeCalc(value);
  };

  const currentReturnUrl = useMemo(() => {
    const qs = searchParams?.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }, [pathname, searchParams]);

  const handleUnlockLogin = () => {
    router.push(`/brand/login?returnUrl=${encodeURIComponent(currentReturnUrl)}`);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fbf8f3]">
        <Loader logoSrc="/logo.png" />
      </div>
    );
  }

  if (error) {
    const isLimitError = error.toLowerCase().includes('limit') || error.toLowerCase().includes('quota');

    return (
      <div className="min-h-screen bg-[#fbf8f3] p-6">
        <div className="mx-auto max-w-3xl rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5" />
            <div>
              <div className="font-semibold">{isLimitError ? 'Limit Reached' : 'Error'}</div>
              <div className="mt-1 text-sm">{error}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!displayedReport) {
    return (
      <div className="min-h-screen bg-[#fbf8f3] p-6">
        <div className="mx-auto max-w-3xl rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center text-gray-600">
          No report data yet. Try refreshing data or selecting another creator.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen  text-[#1f1f1f]">
      {captchaRequired && !captchaVerified ? (
        <SecurityCheckOverlay
          checking={captchaChecking}
          onRetry={() => setCaptchaAttempt((x) => x + 1)}
        />
      ) : null}
      {/* <div className="sticky top-0 z-20 border-b border-[#ebe4d8] bg-[#fbf8f3]/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[1600px] flex-wrap items-center gap-3 px-4 py-3 lg:px-6 xl:px-8">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 rounded-xl border border-[#e7ddd0] bg-white px-3 py-2 text-sm font-medium text-[#2b2b2b] transition hover:bg-[#f7f2ea]"
          >
            <ArrowLeft className="h-4 w-4" />
            Close
          </button>

          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-[#1f1f1f]">
              {displayedReport.fullname || displayedReport.name || displayedReport.username || 'Creator profile'}
            </div>
            <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-[#6a6258]">
              {(displayedReport.handle || handle) && (
                <span>{displayedReport.handle || (handle?.startsWith('@') ? handle : `@${handle}`)}</span>
              )}
              <span className="rounded-full border border-[#e7ddd0] bg-white px-2 py-0.5 uppercase tracking-wide">
                {activePlatform}
              </span>
              {emailExists ? (
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-emerald-700">
                  Email available
                </span>
              ) : null}
            </div>
          </div>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <div className="hidden rounded-xl border border-[#e7ddd0] bg-white px-3 py-2 text-right md:block">
              <div className="text-[10px] uppercase tracking-wide text-[#8a8177]">Latest data</div>
              <div className="text-xs text-[#2b2b2b]">{formattedLastUpdated}</div>
            </div>

            <select
              value={calculationMethod}
              onChange={(e) => handleCalcChange(e.target.value as 'median' | 'average')}
              className="rounded-xl border border-[#e7ddd0] bg-white px-3 py-2 text-sm text-[#2b2b2b] outline-none"
            >
              <option value="average">Average</option>
              <option value="median">Median</option>
            </select>

            {onRefreshReport ? (
              <button
                type="button"
                onClick={handleRefreshData}
                disabled={refreshing}
                className="inline-flex items-center gap-2 rounded-xl border border-[#e7ddd0] bg-white px-3 py-2 text-sm font-medium text-[#2b2b2b] transition hover:bg-[#f7f2ea] disabled:opacity-60"
              >
                <BarChart3 className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing…' : 'Refresh'}
              </button>
            ) : null}

            <button
              onClick={handleMediaKit}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#FFA135] to-[#FF7236] px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:opacity-90"
            >
              <Copy className="h-4 w-4" />
              Share media kit
            </button>

            <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-xl border border-[#e7ddd0] bg-white px-3 py-2 text-sm font-medium text-[#2b2b2b] transition hover:bg-[#f7f2ea]"
                >
                  <Send className="h-4 w-4" />
                  Campaigns
                  <ChevronDown className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-80 bg-white ring-1 ring-gray-200 shadow-lg">
                <DropdownMenuLabel>Campaigns</DropdownMenuLabel>

                <div className="max-h-64 space-y-1 overflow-auto py-1">
                  {campaigns.length === 0 && !campaignsLoading && (
                    <div className="px-2 text-xs text-gray-500">No campaigns</div>
                  )}

                  {campaignsLoading && (
                    <div className="px-2 text-xs text-gray-500">Loading campaigns…</div>
                  )}

                  {campaigns.map((c) => {
                    const checked = selectedCampaignIds.includes(c.campaignsId);

                    return (
                      <div
                        key={c.campaignsId}
                        role="menuitem"
                        className="relative flex cursor-pointer items-center gap-2 py-2 pl-10 pr-2 text-sm select-none"
                        onClick={() => toggleCampaign(c.campaignsId, !checked)}
                      >
                        <span
                          className={`absolute left-2 top-1/2 flex h-4 w-4 -translate-y-1/2 items-center justify-center rounded ${checked
                            ? 'border border-orange-400 bg-orange-50 text-orange-500'
                            : 'border border-gray-200 bg-white text-transparent'
                            }`}
                        >
                          {checked ? <Check className="h-3 w-3" /> : null}
                        </span>

                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => toggleCampaign(c.campaignsId, e.target.checked)}
                          className="sr-only"
                        />

                        <span>{c.campaignTitle || c.campaignsId}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-3 flex justify-end gap-2 px-1 pb-1">
                  <button
                    type="button"
                    onClick={() => setDropdownOpen(false)}
                    className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleSendFromDropdown}
                    disabled={!canAct}
                    className={`inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-medium text-white shadow-sm ${canAct
                      ? 'bg-gradient-to-r from-[#FFA135] to-[#FF7236] hover:opacity-90'
                      : 'cursor-not-allowed bg-gray-300 opacity-70'
                      }`}
                  >
                    {sendingInvite ? 'Sending…' : 'Send Invite'}
                  </button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div> */}

      <div className="w-full px-4 py-5 lg:px-6 xl:px-8">
        <div className="mb-4 flex items-center justify-start">
          <button
            type="button"
            onClick={handleDashboardBack}
            className="inline-flex items-center gap-2 rounded-xl border border-[#e7ddd0] bg-white px-4 py-2 text-sm font-medium text-[#2b2b2b] shadow-sm transition hover:bg-[#f7f2ea]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        </div>

        <CreatorHeader
          primaryReport={displayedReport as any}
          mediaKit={mediaKit as any}
          activePlan={'pro' as SubscriptionPlan}
          isVerified={displayedReport.isVerified}
          accountType={displayedReport.accountType}
          postsCount={displayedReport.postsCount}
        />
        <div className="mt-6 space-y-8">
          <MetricsGrid metrics={metricCards} />

          <AccessBlurSection
            unlocked={canViewRestrictedSections}
            showPrompt={!canViewRestrictedSections}
            title="Unlock the complete profile"
            subtitle="Log in to access creator contact details, outreach information, and private profile access."
            onUnlock={handleUnlockLogin}
          >
            <ContactManagementCard
              primaryReport={displayedReport as any}
              mediaKit={mediaKit as any}
              onCopy={handleMediaKit}
              connectedProfiles={connectedProfiles as any}
              activePlatform={activePlatform}
              onPlatformSelect={handlePlatformSelect as any}
            />
          </AccessBlurSection>

          <section>
            <SectionGroupHeader
              icon={Users}
              title="Audience Intelligence"
              subtitle="Demographics, geography, and credibility"
            />
            <AccessBlurSection
              unlocked={canViewRestrictedSections}
              showPrompt={false}
              title="Unlock the complete profile"
              subtitle="Log in to explore audience demographics, geography, and credibility insights."
            >
              {hasAudienceDemographics ? (
                <AudienceIntelligenceCard
                  ageData={audienceAge}
                  genderData={audienceGender}
                  topCountries={topCountries}
                  credibilityScore={credibilityScore}
                  topLanguages={topLanguages}
                />
              ) : null}
            </AccessBlurSection>
          </section>

          <section>
            <SectionGroupHeader
              icon={BarChart3}
              title="Content Performance"
              subtitle="Growth trend, recent posts, and top content"
            />
            <div className="space-y-6">
              <AccessBlurSection
                unlocked={canViewRestrictedSections}
                showPrompt={false}
                title="Unlock the complete profile"
                subtitle="Log in to view trend analysis, premium performance history, and deeper creator insights."
              >
                <PerformanceTrendCard
                  organicTrend={organicTrend}
                  sponsoredTrend={sponsoredTrend}
                  trendLabels={trendLabels}
                />
              </AccessBlurSection>

              <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_420px]">
                <AccessBlurSection
                  unlocked={canViewRestrictedSections}
                  showPrompt={false}
                  title="Unlock the complete profile"
                  subtitle="Log in to explore recent post performance, post-level metrics, and content history."
                >
                  <RecentPostsTable posts={recentPostsForTable.slice(0, 5) as any} />
                </AccessBlurSection>

                <PopularContentPanel posts={popularPostsForPanel.slice(0, 2) as any} />
              </div>
            </div>
          </section>

          <section>
            <SectionGroupHeader
              icon={Handshake}
              title="Past Brand Collaborations"
              subtitle="Sponsored content history and deal snapshot"
            />
            <div className="space-y-6">
              <CampaignHighlightsCard items={campaignHighlights} />
              <PastCollaborationsCard collaborations={pastCollaborations} />
            </div>
          </section>

          {/* <AccessBlurSection
            unlocked={canViewRestrictedSections}
            showPrompt={false}
            title="Unlock the complete profile"
            subtitle="Log in to review activity history, profile actions, and detailed audit information."
          >
            <AuditTrailTable items={auditItems} />
          </AccessBlurSection> */}
        </div>
      </div>
    </div>
  );
}

export default function InfluencerDetailFullPage(props: Props) {
  return (
    <GoogleReCaptchaProvider
      reCaptchaKey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || ''}
      scriptProps={{
        async: true,
        defer: true,
        appendTo: 'head',
      }}
    >
      <InfluencerDetailFullPageInner {...props} />
    </GoogleReCaptchaProvider>
  );
}
