'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { createPortal } from 'react-dom';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  ChevronDown,
  ExternalLink,
  Filter,
  Info,
  Mail,
  RefreshCw,
  Search,
  X,
} from 'lucide-react';
import swal from 'sweetalert';
import { get, post } from '@/lib/api';
import { Checkbox } from '@/components/animate-ui/components/radix/checkbox';

type FolderOption = {
  _id: string;
  title: string;
  slug?: string;
  description?: string;
  itemCount?: number;
};

type FolderListResponse = {
  success: boolean;
  data: FolderOption[];
};

type VideoItem = {
  _id?: string;
  videoId?: string;
  title?: string;
  description?: string;
  publishedAt?: string;
  viewCount?: number;
  likeCount?: number;
  commentCount?: number;
  duration?: string;
  videoUrl?: string | null;
  thumbnails?: {
    default?: { url?: string; width?: number; height?: number };
    medium?: { url?: string; width?: number; height?: number };
    high?: { url?: string; width?: number; height?: number };
  } | null;
};

type InfluencerProfileDoc = {
  _id?: string;
  handleId: string;
  platform?: string;
  handle?: string;
  channelId?: string;

  title?: string;
  country?: string | null;
  defaultLanguage?: string | null;

  subscriberCount?: number | null;
  totalViewCount?: number | null;
  totalVideoCount?: number | null;

  avgViewsLast15?: number | null;
  engagementRateLast15?: number | null;
  uploadFrequencyPerWeek?: number | null;
  avgDaysBetweenUploads?: number | null;

  instagramHandle?: string | null;

  email?: string | null;
  lastSponsor?: string | null;
  managedByAgency?: boolean | null;
  topAudienceCountry?: string | null;
  averageAudienceAge?: number | null;
  lastContactedAt?: string | null;
  followUpDates?: string[];
  workingHandle?: string | null;

  lastUploadAt?: string | null;
  lastVideoId?: string | null;
  lastVideoTitle?: string | null;

  topicLabels?: string[];
  topicCategories?: string[];
  keywords?: string;
  description?: string;

  bannerUrl?: string | null;
  thumbnails?: {
    default?: { url?: string; width?: number; height?: number };
    medium?: { url?: string; width?: number; height?: number };
    high?: { url?: string; width?: number; height?: number };
  } | null;

  rawChannel?: any;
  rawPlaylists?: any[];

  lastVideos?: VideoItem[];
  lastVideosLimit?: number;

  createdAt?: string;
  updatedAt?: string;
  syncedAt?: string;
};

type GetAllResponse = {
  status: string;
  page: number;
  limit: number;
  total: number;
  hasNext: boolean;
  sortBy?: string;
  data: InfluencerProfileDoc[];
};

type UpdateManualResponse = {
  status: string;
  handleId: string;
  data: InfluencerProfileDoc;
};

type PreviewResponse = {
  status: string;
  mode: 'preview';
  stored: false;
  data: InfluencerProfileDoc;
};

type SaveProfileResponse = {
  status: string;
  mode?: 'handle';
  stored?: true;
  handle?: string;
  handleId: string;
  data: InfluencerProfileDoc;
};

type GlobalSearchVideo = {
  videoId?: string;
  title?: string;
  description?: string;
  publishedAt?: string;
  channelId?: string;
  channelTitle?: string;
  thumbnails?: {
    default?: { url?: string; width?: number; height?: number };
    medium?: { url?: string; width?: number; height?: number };
    high?: { url?: string; width?: number; height?: number };
  } | null;
  viewCount?: number | null;
  likeCount?: number | null;
  commentCount?: number | null;
  videoUrl?: string | null;
};

type GlobalSearchRecommendation = {
  channelId?: string | null;
  title?: string;
  description?: string;
  handle?: string | null;
  customUrl?: string | null;
  country?: string | null;
  thumbnails?: {
    default?: { url?: string; width?: number; height?: number };
    medium?: { url?: string; width?: number; height?: number };
    high?: { url?: string; width?: number; height?: number };
  } | null;
  subscriberCount?: number | null;
  totalViewCount?: number | null;
  totalVideoCount?: number | null;
  topicLabels?: string[];
  bannerUrl?: string | null;
  channelUrl?: string | null;
  matchedByDirectChannelSearch?: boolean;
  matchedVideos?: GlobalSearchVideo[];
  score?: number;

  avgViewsLast15?: number | null;
  engagementRateLast15?: number | null;
  uploadFrequencyPerWeek?: number | null;
  avgDaysBetweenUploads?: number | null;
  lastUploadAt?: string | null;
  lastVideoId?: string | null;
  lastVideoTitle?: string | null;
  channelCreatedAt?: string | null;
  keywords?: string;
  defaultLanguage?: string | null;
  instagramHandle?: string | null;
};

type GlobalSearchData = {
  query: string;
  channelsFound: number;
  videoHits: number;
  nextPageToken?: string | null;
  hasMore?: boolean;
  recommendations: GlobalSearchRecommendation[];
};

type GlobalSearchResponse = {
  status: string;
  mode: 'global';
  stored: false;
  query: string;
  data: GlobalSearchData;
};

type FolderDetailItem = {
  handle?: string | null;
};

type FolderDetailResponse = {
  success: boolean;
  data?: {
    items?: FolderDetailItem[];
  };
};

type ImportYoutubeToFolderResponse = {
  success: boolean;
  message?: string;
  added?: number;
  skipped?: number;
  alreadyAdded?: string[];
  total?: number;
  data?: any;
};

type SavedSortValue =
  | 'relevance'
  | 'subscribers_desc'
  | 'subscribers_asc'
  | 'avg_views_desc'
  | 'avg_views_asc'
  | 'engagement_desc'
  | 'recent_upload'
  | 'uploads_per_week'
  | 'newest';

type InfluencerFilters = {
  subscriberRange: string;
  countries: string[];
  category: string;
  avgViewsMin: string;
  lastUploadDays: string;
  sortBy: SavedSortValue;
};

type SubscriberRangeOption = {
  value: string;
  label: string;
  min?: number | null;
  max?: number | null;
};

const SUBSCRIBER_RANGES: SubscriberRangeOption[] = [
  { value: '', label: 'All' },
  { value: '1k_10k', label: '1K – 10K', min: 1000, max: 10000 },
  { value: '10k_50k', label: '10K – 50K', min: 10000, max: 50000 },
  { value: '50k_100k', label: '50K – 100K', min: 50000, max: 100000 },
  { value: '100k_500k', label: '100K – 500K', min: 100000, max: 500000 },
  { value: '500k_1m', label: '500K – 1M', min: 500000, max: 1000000 },
  { value: '1m_5m', label: '1M – 5M', min: 1000000, max: 5000000 },
  { value: '5m_10m', label: '5M – 10M', min: 5000000, max: 10000000 },
  { value: '10m_plus', label: '10M+', min: 10000000, max: null },
];

function normalizeFolderHandle(input?: string | null) {
  return String(input || '')
    .replace(/^@/, '')
    .trim()
    .toLowerCase();
}

const COUNTRY_OPTIONS: Array<{ code: string; name: string }> = [
  { code: 'IN', name: 'India' },
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'ES', name: 'Spain' },
  { code: 'IT', name: 'Italy' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'BR', name: 'Brazil' },
  { code: 'MX', name: 'Mexico' },
  { code: 'ID', name: 'Indonesia' },
  { code: 'PH', name: 'Philippines' },
  { code: 'SG', name: 'Singapore' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'JP', name: 'Japan' },
  { code: 'KR', name: 'South Korea' },
];

const CATEGORY_OPTIONS = [
  'Entertainment',
  'Lifestyle',
  'Technology',
  'Gaming',
  'Education',
  'Finance',
  'Business',
  'Food',
  'Travel',
  'Fitness',
  'Health',
  'Beauty',
  'Fashion',
  'Parenting',
  'Comedy',
  'Music',
  'News',
  'Sports',
  'Automotive',
  'Pets',
  'DIY',
  'Vlogging',
  'Podcast',
  'Review',
  'Unboxing',
  'Tutorial',
];

const AVG_VIEWS_OPTIONS = [
  { value: '', label: 'All' },
  { value: '1000', label: '1K+' },
  { value: '5000', label: '5K+' },
  { value: '10000', label: '10K+' },
  { value: '25000', label: '25K+' },
  { value: '50000', label: '50K+' },
  { value: '100000', label: '100K+' },
  { value: '250000', label: '250K+' },
  { value: '500000', label: '500K+' },
  { value: '1000000', label: '1M+' },
];

const LAST_UPLOAD_OPTIONS = [
  { value: '', label: 'Any time' },
  { value: '7', label: 'Last 7 days' },
  { value: '14', label: 'Last 14 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '60', label: 'Last 60 days' },
  { value: '90', label: 'Last 90 days' },
];

const SORT_OPTIONS: Array<{ value: SavedSortValue; label: string }> = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'subscribers_desc', label: 'Subscribers (High to Low)' },
  { value: 'subscribers_asc', label: 'Subscribers (Low to High)' },
  { value: 'avg_views_desc', label: 'Average Views (High to Low)' },
  { value: 'avg_views_asc', label: 'Average Views (Low to High)' },
  { value: 'engagement_desc', label: 'Engagement Rate (High to Low)' },
  { value: 'recent_upload', label: 'Recent Upload' },
  { value: 'uploads_per_week', label: 'Uploads per Week' },
  { value: 'newest', label: 'Newest Channels' },
];

function showErr(message: string) {
  return swal({
    title: 'Error',
    text: message || 'Something went wrong.',
    icon: 'error',
  });
}

function normalizeHandle(input: string) {
  const s = (input || '').trim();
  if (!s) return '';
  const m = s.match(/@([A-Za-z0-9._-]+)/);
  if (m?.[1]) return `@${m[1]}`;
  if (/^[A-Za-z0-9._-]+$/.test(s)) return `@${s}`;
  return s.startsWith('@') ? s : `@${s}`;
}

function isValidHandle(h: string) {
  return /^@[A-Za-z0-9._-]+$/.test(h);
}

function getSearchIntent(input: string) {
  const raw = (input || '').trim();
  if (!raw) return { raw: '', isHandle: false, handle: '' };

  const explicitHandle = raw.startsWith('@') || /youtube\.com\/@/i.test(raw);
  if (!explicitHandle) {
    return { raw, isHandle: false, handle: '' };
  }

  const handle = normalizeHandle(raw);
  return {
    raw,
    isHandle: isValidHandle(handle),
    handle: isValidHandle(handle) ? handle : '',
  };
}

function buildSavedSearchText(raw: string) {
  const parsed = getSearchIntent(raw);
  return parsed.isHandle ? parsed.handle : parsed.raw;
}

function asList<T>(d: any): T[] {
  return Array.isArray(d) ? d : [];
}

function formatNumber(n?: number | null) {
  if (n == null || !Number.isFinite(n)) return '—';
  return new Intl.NumberFormat('en-IN').format(n);
}

function formatPercent(x?: number | null) {
  if (x == null || !Number.isFinite(x)) return '—';
  return `${(x * 100).toFixed(2)}%`;
}

function formatBool(b?: boolean | null) {
  if (b === true) return 'Yes';
  if (b === false) return 'No';
  return 'Unknown';
}

function formatDate(iso?: string | null, timeZone = 'Asia/Kolkata') {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';

  return new Intl.DateTimeFormat('en-IN', {
    timeZone,
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

function getCardId(p: InfluencerProfileDoc) {
  return (
    p.handleId ||
    p._id ||
    p.channelId ||
    p.handle ||
    [p.title, p.createdAt, p.updatedAt].filter(Boolean).join('-') ||
    'profile'
  );
}

function getSelectionKey(p: InfluencerProfileDoc) {
  return p.handleId || p.channelId || p.handle || '';
}

function getLiveSelectionKey(item: GlobalSearchRecommendation) {
  return item.channelId || item.handle || '';
}

function ytVideoUrl(videoId?: string) {
  if (!videoId) return '';
  return `https://www.youtube.com/watch?v=${videoId}`;
}

function ytChannelUrl(p: InfluencerProfileDoc) {
  if (p.handle) {
    const handle = p.handle.startsWith('@') ? p.handle : `@${p.handle}`;
    return `https://www.youtube.com/${handle}`;
  }
  if (p.channelId) return `https://www.youtube.com/channel/${p.channelId}`;
  return '';
}

function ytChannelUrlFromHandleOrId(handle?: string | null, channelId?: string | null) {
  if (handle) {
    const normalized = handle.startsWith('@') ? handle : `@${handle}`;
    return `https://www.youtube.com/${normalized}`;
  }
  if (channelId) return `https://www.youtube.com/channel/${channelId}`;
  return '';
}

function getThumbUrl(
  thumbnails?:
    | {
      default?: { url?: string };
      medium?: { url?: string };
      high?: { url?: string };
    }
    | null,
) {
  return thumbnails?.high?.url || thumbnails?.medium?.url || thumbnails?.default?.url || '';
}

function topicFromUrl(url: string) {
  try {
    const last = (url || '').split('/').pop() || '';
    return decodeURIComponent(last).replace(/_/g, ' ');
  } catch {
    return url;
  }
}

function cleanTopicLabel(s: string) {
  return String(s || '')
    .replace(/\s*\(.*?\)\s*$/, '')
    .trim();
}

function getTopicNames(p: InfluencerProfileDoc) {
  const labels = asList<string>(p.topicLabels).filter(Boolean).map(cleanTopicLabel);
  if (labels.length) return Array.from(new Set(labels));

  const cats = asList<string>(p.topicCategories)
    .filter(Boolean)
    .map(topicFromUrl)
    .map(cleanTopicLabel);

  return Array.from(new Set(cats));
}

function countryLabel(code: string) {
  const c = COUNTRY_OPTIONS.find((x) => x.code === code);
  return c ? `${c.name} (${c.code})` : code;
}

function chipText(filters: InfluencerFilters) {
  const chips: string[] = [];

  if (filters.subscriberRange) {
    const range = SUBSCRIBER_RANGES.find((x) => x.value === filters.subscriberRange);
    if (range) chips.push(`Subscribers: ${range.label}`);
  }

  if (filters.countries?.length) chips.push(`Country: ${filters.countries.join(', ')}`);
  if (filters.category) chips.push(`Category: ${filters.category}`);

  if (filters.avgViewsMin) {
    const v = AVG_VIEWS_OPTIONS.find((x) => x.value === filters.avgViewsMin);
    if (v) chips.push(`Avg Views: ${v.label}`);
  }

  if (filters.lastUploadDays) {
    const v = LAST_UPLOAD_OPTIONS.find((x) => x.value === filters.lastUploadDays);
    if (v) chips.push(`Last Upload: ${v.label}`);
  }

  const s = SORT_OPTIONS.find((x) => x.value === filters.sortBy);
  if (s) chips.push(`Sort: ${s.label}`);

  return chips;
}

function sortLabel(sortBy: SavedSortValue) {
  const found = SORT_OPTIONS.find((x) => x.value === sortBy);
  return found?.label || 'Relevance';
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-5 py-4">
      <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </div>
      <div className="mt-2 break-words text-3xl font-bold tracking-tight text-slate-900 xl:text-4xl">
        {value}
      </div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: any; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-slate-600">{label}:</span>
      <span className={`text-right font-medium text-slate-900 ${mono ? 'font-mono text-xs' : ''}`}>
        {String(value)}
      </span>
    </div>
  );
}

function MultiCountrySelect({
  value,
  onChange,
}: {
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const [pos, setPos] = useState<{ left: number; top: number; width: number } | null>(null);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return COUNTRY_OPTIONS;
    return COUNTRY_OPTIONS.filter(
      (c) => c.code.toLowerCase().includes(s) || c.name.toLowerCase().includes(s),
    );
  }, [q]);

  const summary = value?.length ? value.join(', ') : 'All';

  function updatePos() {
    const el = btnRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPos({
      left: r.left,
      top: r.bottom + 8,
      width: r.width,
    });
  }

  function toggle(code: string) {
    const next = new Set(value || []);
    if (next.has(code)) next.delete(code);
    else next.add(code);
    onChange(Array.from(next).sort());
  }

  useEffect(() => {
    if (!open) return;

    updatePos();

    const onReflow = () => updatePos();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };

    window.addEventListener('scroll', onReflow, true);
    window.addEventListener('resize', onReflow);
    window.addEventListener('keydown', onKey);

    return () => {
      window.removeEventListener('scroll', onReflow, true);
      window.removeEventListener('resize', onReflow);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const overlay =
    open && pos && typeof document !== 'undefined'
      ? createPortal(
        <div className="fixed inset-0 z-[9999]">
          <div className="absolute inset-0 bg-black/10" onClick={() => setOpen(false)} />

          <div
            className="fixed overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl"
            style={{
              left: pos.left,
              top: pos.top,
              width: pos.width,
              maxHeight: 'min(70vh, 520px)',
            }}
          >
            <div className="border-b border-slate-200 p-3">
              <input
                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-transparent focus:ring-2 focus:ring-teal-600"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search country"
                autoFocus
              />
              <div className="mt-2 flex items-center justify-between">
                <button
                  type="button"
                  className="text-xs font-semibold text-slate-700 hover:underline"
                  onClick={() => onChange([])}
                >
                  Clear
                </button>
                <span className="text-xs text-slate-500">{value.length} selected</span>
              </div>
            </div>

            <div className="max-h-[420px] overflow-auto p-2">
              {filtered.map((c) => {
                const checked = value.includes(c.code);
                return (
                  <label
                    key={c.code}
                    className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 hover:bg-slate-50"
                  >
                    <Checkbox checked={checked} onCheckedChange={() => toggle(c.code)} />
                    <span className="text-sm text-slate-800">{countryLabel(c.code)}</span>
                  </label>
                );
              })}

              {!filtered.length ? (
                <div className="px-2 py-6 text-center text-sm text-slate-500">No countries found</div>
              ) : null}
            </div>

            <div className="border-t border-slate-200 bg-slate-50 p-3">
              <button
                type="button"
                className="w-full rounded-lg bg-teal-600 px-3 py-2 text-sm font-semibold text-white hover:bg-teal-700"
                onClick={() => setOpen(false)}
              >
                Done
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )
      : null;

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className="flex w-full items-center justify-between gap-2 rounded-xl border border-slate-300 bg-white px-3 py-3 text-left hover:bg-slate-50"
        onClick={() => {
          setOpen((v) => {
            const next = !v;
            if (!v && next) updatePos();
            return next;
          });
        }}
      >
        <span className="truncate text-sm text-slate-800">{summary}</span>
        <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {overlay}
    </>
  );
}

function FolderSelect({
  folders,
  value,
  onChange,
}: {
  folders: FolderOption[];
  value: string;
  onChange: (next: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const [pos, setPos] = useState<{ left: number; top: number; width: number } | null>(null);

  const selectedFolder = folders.find((f) => f._id === value);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return folders;

    return folders.filter((f) =>
      [f.title, f.slug, f.description]
        .filter(Boolean)
        .some((x) => String(x).toLowerCase().includes(s))
    );
  }, [q, folders]);

  function updatePos() {
    const el = btnRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPos({
      left: r.left,
      top: r.bottom + 8,
      width: r.width,
    });
  }

  useEffect(() => {
    if (!open) return;

    updatePos();

    const onReflow = () => updatePos();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };

    window.addEventListener('scroll', onReflow, true);
    window.addEventListener('resize', onReflow);
    window.addEventListener('keydown', onKey);

    return () => {
      window.removeEventListener('scroll', onReflow, true);
      window.removeEventListener('resize', onReflow);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const overlay =
    open && pos && typeof document !== 'undefined'
      ? createPortal(
        <div className="fixed inset-0 z-[9999]">
          <div className="absolute inset-0 bg-black/10" onClick={() => setOpen(false)} />

          <div
            className="fixed overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl"
            style={{
              left: pos.left,
              top: pos.top,
              width: pos.width,
              maxHeight: 'min(70vh, 520px)',
            }}
          >
            <div className="border-b border-slate-200 p-3">
              <input
                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-transparent focus:ring-2 focus:ring-teal-600"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search folder"
                autoFocus
              />

              <div className="mt-2 flex items-center justify-between">
                <button
                  type="button"
                  className="text-xs font-semibold text-slate-700 hover:underline"
                  onClick={() => onChange('')}
                >
                  Clear
                </button>
                <span className="text-xs text-slate-500">
                  {value ? '1 selected' : 'No folder selected'}
                </span>
              </div>
            </div>

            <div className="max-h-[420px] overflow-auto p-2">
              {filtered.map((folder) => {
                const checked = value === folder._id;

                return (
                  <button
                    key={folder._id}
                    type="button"
                    onClick={() => {
                      onChange(folder._id);
                      setOpen(false);
                    }}
                    className={`flex w-full items-start justify-between gap-3 rounded-lg px-3 py-3 text-left hover:bg-slate-50 ${checked ? 'bg-teal-50' : ''
                      }`}
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-slate-900">
                        {folder.title}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {folder.itemCount || 0} influencers
                      </div>
                    </div>

                    {checked ? (
                      <span className="rounded-full bg-teal-600 px-2 py-0.5 text-[10px] text-white">
                        Selected
                      </span>
                    ) : null}
                  </button>
                );
              })}

              {!filtered.length ? (
                <div className="px-2 py-6 text-center text-sm text-slate-500">
                  No folders found
                </div>
              ) : null}
            </div>
          </div>
        </div>,
        document.body,
      )
      : null;

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className="flex min-w-[260px] items-center justify-between gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-left hover:bg-slate-50"
        onClick={() => {
          setOpen((v) => {
            const next = !v;
            if (!v && next) updatePos();
            return next;
          });
        }}
      >
        <span className="truncate text-sm text-slate-800">
          {selectedFolder ? selectedFolder.title : 'Select folder'}
        </span>
        <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {overlay}
    </>
  );
}

function GlobalSearchCard({
  item,
  savedProfile,
  onOpenSaved,
  onViewDetails,
  loading,
  selected,
  onToggleSelect,
}: {
  item: GlobalSearchRecommendation;
  savedProfile?: InfluencerProfileDoc;
  onOpenSaved: (id: string) => void;
  onViewDetails: (payload: { handle?: string; channelId?: string }) => void;
  loading?: boolean;
  selected?: boolean;
  onToggleSelect?: (checked: boolean) => void;
}) {
  const thumb = getThumbUrl(item.thumbnails);
  const channelUrl = item.channelUrl || ytChannelUrlFromHandleOrId(item.handle, item.channelId);
  const topics = asList<string>(item.topicLabels).filter(Boolean);
  const matchedVideos = asList<GlobalSearchVideo>(item.matchedVideos).slice(0, 4);

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start">
          <div className="flex min-w-0 flex-1 items-start gap-4">
            {onToggleSelect ? (
              <div className="pt-1">
                <Checkbox checked={!!selected} onCheckedChange={(v: any) => onToggleSelect(!!v)} />
              </div>
            ) : null}

            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full bg-slate-200 ring-4 ring-slate-100">
              {thumb ? <img src={thumb} alt="" className="h-full w-full object-cover" loading="lazy" /> : null}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate text-2xl font-bold leading-tight text-slate-900">
                  {item.title || item.handle || '—'}
                </h3>

                {item.country ? (
                  <span className="rounded-full border border-teal-200 bg-teal-50 px-2 py-0.5 text-[10px] text-teal-700">
                    {item.country}
                  </span>
                ) : null}

                {item.matchedByDirectChannelSearch ? (
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] text-emerald-700">
                    Channel Match
                  </span>
                ) : null}
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-3">
                <div className="text-lg font-semibold text-teal-600">{item.handle || 'No public handle'}</div>

                {savedProfile?.handleId ? (
                  <span className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs text-slate-700">
                    Already Saved
                  </span>
                ) : null}
              </div>

              {topics.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {topics.slice(0, 5).map((t) => (
                    <span
                      key={t}
                      className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[11px] text-slate-700"
                    >
                      {t}
                    </span>
                  ))}
                  {topics.length > 5 ? (
                    <span className="rounded-full bg-teal-600 px-2.5 py-1 text-[11px] text-white">
                      +{topics.length - 5} Categories
                    </span>
                  ) : null}
                </div>
              ) : null}

              {item.description ? (
                <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-600">{item.description}</p>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row xl:w-[230px] xl:flex-col">
            {item.channelId ? (
              <Link
                href={`/mediakit/${encodeURIComponent(item.channelId)}?platform=${encodeURIComponent(
                  'youtube',
                )}&handle=${encodeURIComponent(String(item.handle || ''))}`}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-100"
              >
                <Info className="h-4 w-4" />
                Load Advanced Insights
              </Link>
            ) : (
              <button
                type="button"
                disabled
                className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-400"
              >
                <Info className="h-4 w-4" />
                Load Advanced Insights
              </button>
            )}

            {savedProfile?.handleId ? (
              <button
                type="button"
                className="w-full rounded-xl bg-teal-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-teal-700"
                onClick={() => onOpenSaved(savedProfile.handleId)}
              >
                Open Saved Profile
              </button>
            ) : (
              <button
                type="button"
                className="w-full rounded-xl bg-teal-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-teal-700 disabled:opacity-50"
                onClick={() =>
                  onViewDetails({
                    handle: item.handle || undefined,
                    channelId: item.channelId || undefined,
                  })
                }
                disabled={loading}
              >
                View Details
              </button>
            )}

            {channelUrl ? (
              <a
                href={channelUrl}
                target="_blank"
                rel="noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-100"
              >
                <ExternalLink className="h-4 w-4" />
                View Channel
              </a>
            ) : null}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
          <MetricCard label="Subscribers" value={formatNumber(item.subscriberCount)} />
          <MetricCard label="Total Views" value={formatNumber(item.totalViewCount)} />
          <MetricCard label="Total Videos" value={formatNumber(item.totalVideoCount)} />
          <MetricCard label="Matched Videos" value={String(matchedVideos.length || 0)} />
        </div>
      </div>

      <div className="border-t border-slate-200 bg-slate-50/80 p-6">
        <div className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Matched Videos</div>

        {!matchedVideos.length ? (
          <div className="text-sm text-slate-500">No matched videos were returned for this creator.</div>
        ) : (
          <div className="space-y-3">
            {matchedVideos.map((video) => {
              const vThumb = getThumbUrl(video.thumbnails);
              const url = video.videoUrl || ytVideoUrl(video.videoId);

              return (
                <a
                  key={video.videoId || `${video.title}-${video.publishedAt}`}
                  href={url || '#'}
                  target={url ? '_blank' : undefined}
                  rel={url ? 'noreferrer' : undefined}
                  className={`block rounded-2xl border border-slate-200 bg-white p-4 transition-all ${url ? 'hover:border-teal-300 hover:bg-teal-50/30 hover:shadow-md' : ''
                    }`}
                >
                  <div className="flex gap-4">
                    <div className="h-20 w-36 shrink-0 overflow-hidden rounded-xl bg-slate-200">
                      {vThumb ? <img src={vThumb} alt="" className="h-full w-full object-cover" loading="lazy" /> : null}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="line-clamp-2 text-sm font-semibold text-slate-900">
                            {video.title || 'Untitled video'}
                          </div>
                          <div className="mt-1 text-xs text-slate-500">
                            {formatDate(video.publishedAt)} • {formatNumber(video.viewCount)} views
                          </div>
                        </div>

                        {url ? (
                          <div className="shrink-0 text-teal-600">
                            <ExternalLink className="h-4 w-4" />
                          </div>
                        ) : null}
                      </div>

                      {video.description ? (
                        <p className="mt-2 line-clamp-2 text-sm text-slate-600">{video.description}</p>
                      ) : null}
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function PreviewSidebar({
  open,
  loading,
  saving,
  data,
  savedProfile,
  onClose,
  onSave,
  onOpenSaved,
}: {
  open: boolean;
  loading: boolean;
  saving: boolean;
  data: InfluencerProfileDoc | null;
  savedProfile?: InfluencerProfileDoc;
  onClose: () => void;
  onSave: () => void;
  onOpenSaved: (handleId: string) => void;
}) {
  if (!open) return null;

  const thumb =
    data?.thumbnails?.high?.url ||
    data?.thumbnails?.medium?.url ||
    data?.thumbnails?.default?.url ||
    '';

  const banner = data?.bannerUrl || '';
  const topics = data ? getTopicNames(data) : [];
  const channelUrl = data ? ytChannelUrl(data) : '';

  return (
    <div className="fixed inset-0 z-[130]">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />

      <div className="absolute right-0 top-0 flex h-full w-full max-w-[820px] flex-col border-l border-slate-200 bg-white shadow-2xl">
        <div className="relative border-b border-slate-200">
          {banner ? (
            <div className="h-36 w-full overflow-hidden bg-slate-200">
              <img src={banner} alt="" className="h-full w-full object-cover" />
            </div>
          ) : (
            <div className="h-24 w-full bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100" />
          )}

          <button
            type="button"
            className="absolute right-4 top-4 rounded-xl bg-white/90 p-2 shadow-sm hover:bg-white"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="h-5 w-5 text-slate-700" />
          </button>

          <div className="px-6 pb-5">
            <div className="-mt-10 flex items-start gap-4">
              <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl border-4 border-white bg-slate-200 shadow-md">
                {thumb ? <img src={thumb} alt="" className="h-full w-full object-cover" loading="lazy" /> : null}
              </div>

              <div className="min-w-0 flex-1 pt-12">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate text-2xl font-bold text-slate-900">{data?.title || data?.handle || '—'}</h3>

                  {data?.country ? (
                    <span className="rounded-full border border-teal-200 bg-teal-50 px-2.5 py-1 text-[11px] text-teal-700">
                      {data.country}
                    </span>
                  ) : null}

                  {savedProfile?.handleId ? (
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] text-emerald-700">
                      Already Saved
                    </span>
                  ) : null}
                </div>

                <div className="mt-1 text-base font-semibold text-teal-600">{data?.handle || '—'}</div>

                {topics.length ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {topics.slice(0, 6).map((t) => (
                      <span
                        key={t}
                        className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[11px] text-slate-700"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-slate-50/70 p-5">
          {loading || !data ? (
            <div className="px-6 py-16 text-center text-slate-500">
              <RefreshCw className="mx-auto mb-3 h-8 w-8 animate-spin" />
              Loading creator details...
            </div>
          ) : (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
                <MetricCard label="Subscribers" value={formatNumber(data.subscriberCount)} />
                <MetricCard label="Avg Views" value={formatNumber(data.avgViewsLast15)} />
                <MetricCard label="Engagement" value={formatPercent(data.engagementRateLast15)} />
                <MetricCard
                  label="Uploads / Week"
                  value={data.uploadFrequencyPerWeek != null ? String(data.uploadFrequencyPerWeek) : '—'}
                />
              </div>

              <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Channel Overview
                  </div>

                  <div className="space-y-3">
                    <Row label="Handle" value={data.handle || '—'} />
                    <Row label="Channel ID" value={data.channelId || '—'} mono />
                    <Row label="Country" value={data.country || '—'} />
                    <Row label="Language" value={data.defaultLanguage || '—'} />
                    <Row label="Instagram" value={data.instagramHandle || '—'} />
                    <Row label="Total Views" value={formatNumber(data.totalViewCount)} />
                    <Row label="Total Videos" value={formatNumber(data.totalVideoCount)} />
                    <Row label="Last Upload" value={formatDate(data.lastUploadAt)} />
                    <Row label="Last Video" value={data.lastVideoTitle || '—'} />
                  </div>

                  {channelUrl ? (
                    <div className="mt-4 border-t border-slate-200 pt-4">
                      <a
                        href={channelUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-teal-600 hover:text-teal-700"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Open channel
                      </a>
                    </div>
                  ) : null}
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    About Creator
                  </div>

                  <p className="whitespace-pre-line text-sm leading-6 text-slate-600">{data.description || '—'}</p>
                </div>
              </div>

              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 bg-white px-5 py-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Latest Videos</div>
                </div>

                <div className="bg-slate-50/50 p-5">
                  {!data.lastVideos?.length ? (
                    <div className="text-sm text-slate-500">No recent videos found.</div>
                  ) : (
                    <div className="space-y-4">
                      {data.lastVideos.slice(0, 8).map((video) => {
                        const vThumb = getThumbUrl(video.thumbnails);
                        const videoUrl = video.videoUrl || (video.videoId ? ytVideoUrl(video.videoId) : '');

                        return (
                          <a
                            key={video.videoId || video.title}
                            href={videoUrl || '#'}
                            target={videoUrl ? '_blank' : undefined}
                            rel={videoUrl ? 'noreferrer' : undefined}
                            className={`block rounded-2xl border border-slate-200 bg-white p-4 transition-all ${videoUrl ? 'hover:border-teal-300 hover:bg-teal-50/30 hover:shadow-md' : ''
                              }`}
                          >
                            <div className="flex gap-4">
                              <div className="h-24 w-40 shrink-0 overflow-hidden rounded-xl bg-slate-200">
                                {vThumb ? (
                                  <img src={vThumb} alt="" className="h-full w-full object-cover" loading="lazy" />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center text-xs text-slate-500">
                                    No image
                                  </div>
                                )}
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <div className="line-clamp-2 text-sm font-semibold text-slate-900">
                                      {video.title || 'Untitled video'}
                                    </div>

                                    <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-500">
                                      <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-1">
                                        {formatDate(video.publishedAt)}
                                      </span>
                                      <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-1">
                                        {formatNumber(video.viewCount)} views
                                      </span>
                                      <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-1">
                                        {formatNumber(video.likeCount)} likes
                                      </span>
                                      <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-1">
                                        {formatNumber(video.commentCount)} comments
                                      </span>
                                      {video.duration ? (
                                        <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-1">
                                          {video.duration}
                                        </span>
                                      ) : null}
                                    </div>

                                    {video.description ? (
                                      <p className="mt-3 line-clamp-2 text-sm text-slate-600">{video.description}</p>
                                    ) : null}
                                  </div>

                                  {videoUrl ? (
                                    <div className="shrink-0 text-teal-600">
                                      <ExternalLink className="h-4 w-4" />
                                    </div>
                                  ) : null}
                                </div>
                              </div>
                            </div>
                          </a>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-slate-200 bg-white px-6 py-4">
          {savedProfile?.handleId ? (
            <button
              type="button"
              className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
              onClick={() => onOpenSaved(savedProfile.handleId)}
            >
              Open Saved Profile
            </button>
          ) : (
            <button
              type="button"
              className="rounded-xl bg-teal-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-teal-700 disabled:opacity-50"
              onClick={onSave}
              disabled={loading || saving || !data}
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          )}

          <button
            type="button"
            className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  const router = useRouter();
  const params = useParams();

  const [profiles, setProfiles] = useState<InfluencerProfileDoc[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [saveEmailModalOpen, setSaveEmailModalOpen] = useState(false);
  const [previewEmail, setPreviewEmail] = useState('');

  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [total, setTotal] = useState(0);
  const [hasNext, setHasNext] = useState(false);

  const [query, setQuery] = useState('');
  const [searchHint, setSearchHint] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);

  const [globalResult, setGlobalResult] = useState<GlobalSearchData | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewSaving, setPreviewSaving] = useState(false);
  const [previewData, setPreviewData] = useState<InfluencerProfileDoc | null>(null);
  const [globalVisibleCount, setGlobalVisibleCount] = useState(10);
  const [globalNextPageToken, setGlobalNextPageToken] = useState<string | null>(null);
  const [globalHasMore, setGlobalHasMore] = useState(false);
  const [globalLoadingMore, setGlobalLoadingMore] = useState(false);

  const [filtersDraft, setFiltersDraft] = useState<InfluencerFilters>({
    subscriberRange: '',
    countries: [],
    category: '',
    avgViewsMin: '',
    lastUploadDays: '',
    sortBy: 'relevance',
  });

  const [filtersActive, setFiltersActive] = useState<InfluencerFilters>({
    subscriberRange: '',
    countries: [],
    category: '',
    avgViewsMin: '',
    lastUploadDays: '',
    sortBy: 'relevance',
  });

  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [detailsHandleId, setDetailsHandleId] = useState('');
  const [detailsSaving, setDetailsSaving] = useState(false);
  const [detailsForm, setDetailsForm] = useState({ email: '' });

  const searchParams = useSearchParams();
  const campaignId = (searchParams.get('campaignId') || searchParams.get('id') || '').trim();
  const folderId = String(
    params?.folderId || searchParams.get('folderId') || ''
  ).trim();

  const hasFolderId = Boolean(folderId);

  const [folders, setFolders] = useState<FolderOption[]>([]);
  const [foldersLoading, setFoldersLoading] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState('');

  const activeTargetFolderId = folderId || selectedFolderId || '';
  const [activeFolderHandles, setActiveFolderHandles] = useState<string[]>([]);

  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});

  const profilesByHandle = useMemo(() => {
    const map = new Map<string, InfluencerProfileDoc>();
    for (const p of profiles) {
      const h = (p.handle || '').toLowerCase().trim();
      if (h) map.set(h, p);
    }
    return map;
  }, [profiles]);

  const searchIntent = useMemo(() => getSearchIntent(query), [query]);
  const activeChips = useMemo(() => chipText(filtersActive), [filtersActive]);
  const selectedCount = useMemo(() => Object.values(selectedIds).filter(Boolean).length, [selectedIds]);

  const existingProfile = useMemo(() => {
    if (!searchIntent.isHandle || !searchIntent.handle) return undefined;
    return profilesByHandle.get(searchIntent.handle.toLowerCase());
  }, [searchIntent, profilesByHandle]);

  const typeSearchRef = useRef<any>(null);
  const filtersActiveRef = useRef(filtersActive);

  const visibleLiveRecommendations = useMemo(
    () => globalResult?.recommendations.slice(0, globalVisibleCount) || [],
    [globalResult, globalVisibleCount],
  );

  function savedRowKey(p: InfluencerProfileDoc) {
    return `saved:${getSelectionKey(p)}`;
  }

  function liveRowKey(item: GlobalSearchRecommendation) {
    return `live:${getLiveSelectionKey(item)}`;
  }

  function toggleSelect(key: string, checked: boolean) {
    setSelectedIds((prev) => {
      const next = { ...prev };
      if (checked) next[key] = true;
      else delete next[key];
      return next;
    });
  }

  function clearSelection() {
    setSelectedIds({});
  }

  function selectAllSaved(list: InfluencerProfileDoc[]) {
    setSelectedIds((prev) => {
      const next = { ...prev };
      for (const item of list) {
        const key = savedRowKey(item);
        if (key !== 'saved:') next[key] = true;
      }
      return next;
    });
  }

  const selectedYoutubeUsers = useMemo(() => buildSelectedYoutubeUsers(), [profiles, visibleLiveRecommendations, selectedIds]);

  const activeFolderHandleSet = useMemo(() => {
    return new Set(activeFolderHandles);
  }, [activeFolderHandles]);

  const selectedAlreadyAddedCount = useMemo(() => {
    if (!activeTargetFolderId) return 0;

    return selectedYoutubeUsers.filter((user) => {
      const handle = normalizeFolderHandle(user.handle || user.username);
      return !!handle && activeFolderHandleSet.has(handle);
    }).length;
  }, [activeTargetFolderId, selectedYoutubeUsers, activeFolderHandleSet]);

  const selectedNewCount = useMemo(() => {
    return Math.max(0, selectedYoutubeUsers.length - selectedAlreadyAddedCount);
  }, [selectedYoutubeUsers.length, selectedAlreadyAddedCount]);

  const disableAddToFolder = useMemo(() => {
    return !!activeTargetFolderId && selectedYoutubeUsers.length > 0 && selectedNewCount === 0;
  }, [activeTargetFolderId, selectedYoutubeUsers.length, selectedNewCount]);

  async function loadActiveFolderHandles(targetFolderId: string) {
    if (!targetFolderId) {
      setActiveFolderHandles([]);
      return;
    }

    try {
      const resp = await get<FolderDetailResponse>(`/pitch-folders/${targetFolderId}`);

      const handles = Array.isArray(resp?.data?.items)
        ? resp.data.items
          .map((item) => normalizeFolderHandle(item?.handle))
          .filter(Boolean)
        : [];

      setActiveFolderHandles(Array.from(new Set(handles)));
    } catch {
      setActiveFolderHandles([]);
    }
  }

  useEffect(() => {
    void loadActiveFolderHandles(activeTargetFolderId);
  }, [activeTargetFolderId]);

  function clearAllSaved(list: InfluencerProfileDoc[]) {
    setSelectedIds((prev) => {
      const next = { ...prev };
      for (const item of list) delete next[savedRowKey(item)];
      return next;
    });
  }

  function selectAllLive(list: GlobalSearchRecommendation[]) {
    setSelectedIds((prev) => {
      const next = { ...prev };
      for (const item of list) {
        const key = liveRowKey(item);
        if (key !== 'live:') next[key] = true;
      }
      return next;
    });
  }

  function clearAllLive(list: GlobalSearchRecommendation[]) {
    setSelectedIds((prev) => {
      const next = { ...prev };
      for (const item of list) delete next[liveRowKey(item)];
      return next;
    });
  }

  useEffect(() => {
    if (folderId) {
      setSelectedFolderId(folderId);
    }
  }, [folderId]);

  useEffect(() => {
    loadFolders();
  }, []);

  async function loadFolders() {
    setFoldersLoading(true);
    try {
      const resp = await get<FolderListResponse>('/pitch-folders/list');
      setFolders(Array.isArray(resp?.data) ? resp.data : []);
    } catch (e: any) {
      await showErr(e?.message || 'Failed to load folders.');
    } finally {
      setFoldersLoading(false);
    }
  }

  useEffect(() => {
    filtersActiveRef.current = filtersActive;
  }, [filtersActive]);

  useEffect(() => {
    return () => {
      if (typeSearchRef.current) clearTimeout(typeSearchRef.current);
    };
  }, []);

  useEffect(() => {
    if (filterModalOpen || detailsModalOpen || previewOpen || saveEmailModalOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }

    document.body.style.overflow = '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [filterModalOpen, detailsModalOpen, previewOpen, saveEmailModalOpen]);

  function buildFilterPayload(f: InfluencerFilters) {
    const out: Record<string, any> = {
      sortBy: f.sortBy || 'relevance',
    };

    if (f.subscriberRange) {
      const range = SUBSCRIBER_RANGES.find((x) => x.value === f.subscriberRange);
      if (range?.min != null) out.followersMin = range.min;
      if (range?.max != null) out.followersMax = range.max;
      out.subscriberRange = f.subscriberRange;
    }

    if (Array.isArray(f.countries) && f.countries.length) out.countries = f.countries;
    if (f.category) out.category = f.category;
    if (f.avgViewsMin) out.avgViewsMin = Number(f.avgViewsMin);
    if (f.lastUploadDays) out.lastUploadDays = Number(f.lastUploadDays);

    return out;
  }

  function buildSelectedYoutubeUsers() {
    const selectedSaved = profiles.filter((p) => selectedIds[savedRowKey(p)]);
    const selectedLive = visibleLiveRecommendations.filter((item) => selectedIds[liveRowKey(item)]);

    const rawUsersFromSaved = selectedSaved.map((x) => ({
      sourceRefId: x.handleId || x.channelId || x.handle,
      platform: 'youtube',
      fullname: x.title,
      username: String(x.handle || '').replace(/^@/, ''),
      handle: x.handle,
      userId: x.channelId,
      channelId: x.channelId,
      followers: x.subscriberCount,
      url: ytChannelUrl(x),
      picture: getThumbUrl(x.thumbnails),
      categories: getTopicNames(x),
      bio: x.description,
      country: x.country,
      state: null,
      city: null,
      language: x.defaultLanguage,
      engagementRate: x.engagementRateLast15,
    }));

    const rawUsersFromLive = selectedLive.map((x) => ({
      sourceRefId: x.channelId || x.handle,
      platform: 'youtube',
      fullname: x.title,
      username: String(x.handle || '').replace(/^@/, ''),
      handle: x.handle,
      userId: x.channelId,
      channelId: x.channelId,
      followers: x.subscriberCount,
      url: x.channelUrl || ytChannelUrlFromHandleOrId(x.handle, x.channelId),
      picture: getThumbUrl(x.thumbnails),
      categories: asList<string>(x.topicLabels).filter(Boolean),
      bio: x.description,
      country: x.country,
      state: null,
      city: null,
      language: x.defaultLanguage,
      engagementRate: x.engagementRateLast15,
    }));

    return Array.from(
      new Map(
        [...rawUsersFromSaved, ...rawUsersFromLive]
          .filter((x) => x.sourceRefId)
          .map((x) => [String(x.sourceRefId), x]),
      ).values(),
    );
  }

  async function loadSaved(
    p = 1,
    active: InfluencerFilters = filtersActive,
    searchText = '',
  ) {
    setListLoading(true);
    try {
      const resp = await post<GetAllResponse>('/youtube/getall', {
        page: p,
        limit,
        search: searchText || '',
        includeRaw: false,
        includeVideos: false,
        ...buildFilterPayload(active),
      });

      if (resp?.status !== 'ok') throw new Error('Failed to load saved data');

      setProfiles(asList<InfluencerProfileDoc>(resp.data));
      setTotal(resp.total || 0);
      setHasNext(!!resp.hasNext);
      setPage(resp.page || p);

      const parsed = getSearchIntent(searchText || '');
      if (parsed.isHandle && Array.isArray(resp.data) && resp.data.length === 1) {
        const one = resp.data[0];
        if ((one.handle || '').toLowerCase() === parsed.handle.toLowerCase() && one.handleId) {
          openAndScrollTo(one.handleId);
        }
      }
    } catch (e: any) {
      await showErr(e?.message || 'Failed to load saved data.');
    } finally {
      setListLoading(false);
    }
  }

  async function runGlobalSearch(
    rawQuery: string,
    active: InfluencerFilters = filtersActiveRef.current,
  ) {
    setSearchLoading(true);
    try {
      const resp = await post<GlobalSearchResponse>('/youtube/search', {
        query: rawQuery,
        channelLimit: 50,
        videoLimit: 50,
        pageToken: '',
        ...buildFilterPayload(active),
      });

      if (resp?.status !== 'ok') throw new Error('Global search failed');

      setGlobalResult(resp.data);
      setGlobalVisibleCount(10);
      setGlobalNextPageToken(resp.data.nextPageToken || null);
      setGlobalHasMore(!!resp.data.hasMore);

      setSearchHint(
        resp.data.recommendations?.length
          ? `Found ${formatNumber(resp.data.channelsFound)} creators in this batch. Filters are applied to live search too.`
          : 'No live YouTube results found.',
      );
    } catch (e: any) {
      await showErr(e?.message || 'Failed to search YouTube.');
    } finally {
      setSearchLoading(false);
    }
  }

  async function loadMoreGlobalResults() {
    if (!globalResult) return;

    const currentlyShown = globalVisibleCount;
    const alreadyLoaded = globalResult.recommendations.length;

    if (currentlyShown < alreadyLoaded) {
      setGlobalVisibleCount((v) => Math.min(v + 10, alreadyLoaded));
      return;
    }

    if (!globalNextPageToken || !globalHasMore) return;

    setGlobalLoadingMore(true);
    try {
      const resp = await post<GlobalSearchResponse>('/youtube/search', {
        query: globalResult.query,
        channelLimit: 50,
        videoLimit: 50,
        pageToken: globalNextPageToken,
        ...buildFilterPayload(filtersActiveRef.current),
      });

      if (resp?.status !== 'ok') throw new Error('Failed to load more search results');

      const nextItems = asList<GlobalSearchRecommendation>(resp.data.recommendations);

      setGlobalResult((prev) => {
        if (!prev) return prev;

        const seen = new Set(prev.recommendations.map((x) => `${x.channelId || ''}::${x.handle || ''}`));
        const merged = [...prev.recommendations];

        for (const item of nextItems) {
          const key = `${item.channelId || ''}::${item.handle || ''}`;
          if (!seen.has(key)) {
            merged.push(item);
            seen.add(key);
          }
        }

        return {
          ...prev,
          channelsFound: merged.length,
          videoHits: resp.data.videoHits || prev.videoHits,
          nextPageToken: resp.data.nextPageToken || null,
          hasMore: !!resp.data.hasMore,
          recommendations: merged,
        };
      });

      setGlobalVisibleCount((v) => v + 10);
      setGlobalNextPageToken(resp.data.nextPageToken || null);
      setGlobalHasMore(!!resp.data.hasMore);
    } catch (e: any) {
      await showErr(e?.message || 'Failed to load more results.');
    } finally {
      setGlobalLoadingMore(false);
    }
  }

  async function openPreview(payload: { handle?: string; channelId?: string }) {
    setPreviewLoading(true);
    setPreviewOpen(true);
    setPreviewData(null);

    try {
      const resp = await post<PreviewResponse>('/youtube/profile/preview', {
        ...payload,
        videosLimit: 15,
      });

      if (resp?.status !== 'ok' || !resp?.data) throw new Error('Failed to load preview');
      setPreviewData(resp.data);
    } catch (e: any) {
      setPreviewOpen(false);
      setPreviewData(null);
      await showErr(e?.message || 'Failed to load creator details.');
    } finally {
      setPreviewLoading(false);
    }
  }

  async function savePreviewProfile(emailValue?: string) {
    if (!previewData) return;

    const email = String(emailValue || '').trim().toLowerCase();

    if (!email) {
      await showErr('Please enter email before saving profile.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      await showErr('Enter a valid email.');
      return;
    }

    setPreviewSaving(true);
    try {
      const resp = await post<SaveProfileResponse>('/youtube/profile/sync', {
        handle: previewData.handle || undefined,
        channelId: previewData.channelId || undefined,
        email,
      });

      if (resp?.status !== 'ok' || !resp?.data?.handleId) {
        throw new Error('Failed to save profile');
      }

      upsertProfile(resp.data);

      setSaveEmailModalOpen(false);
      setPreviewEmail('');
      setPreviewOpen(false);
      setPreviewData(null);

      await loadSaved(1, filtersActiveRef.current, buildSavedSearchText(query));
      openAndScrollTo(resp.data.handleId);
    } catch (e: any) {
      await showErr(e?.message || 'Failed to save profile.');
    } finally {
      setPreviewSaving(false);
    }
  }

  async function handlePrimaryAddAction() {
    try {
      const rawUsers = buildSelectedYoutubeUsers();

      if (!rawUsers.length) {
        await showErr('Select at least 1 creator.');
        return;
      }

      const payloadUsers = rawUsers.map((user) => ({
        ...user,
        channelId: user.channelId || user.userId || null,
      }));

      const targetFolderId = folderId || selectedFolderId || '';
      const targetFolder = folders.find((f) => f._id === targetFolderId);
      const targetFolderName = targetFolder?.title || activeFolderName || 'folder';

      if (targetFolderId && selectedNewCount === 0) {
        await swal({
          title: 'Already Added',
          text: `All selected creators are already added in ${targetFolderName}.`,
          icon: 'info',
        });
        return;
      }

      if (folderId) {
        const resp = await post<ImportYoutubeToFolderResponse>(`/pitch-folders/${folderId}/import-youtube`, {
          rawUsers: payloadUsers,
        });

        const added = Number(resp?.added || 0);
        const skipped = Number(resp?.skipped ?? Math.max(0, payloadUsers.length - added));

        await swal({
          title: added > 0 ? 'Done' : 'Already Added',
          text:
            added > 0 && skipped > 0
              ? `${added} creator${added === 1 ? '' : 's'} added to ${targetFolderName}. ${skipped} already added.`
              : added > 0
                ? `${added} creator${added === 1 ? '' : 's'} added to ${targetFolderName}.`
                : `${skipped} creator${skipped === 1 ? '' : 's'} already added in ${targetFolderName}.`,
          icon: added > 0 ? 'success' : 'info',
        });

        clearSelection();
        await loadActiveFolderHandles(folderId);
        return;
      }

      if (selectedFolderId) {
        const resp = await post<ImportYoutubeToFolderResponse>(`/pitch-folders/${selectedFolderId}/import-youtube`, {
          rawUsers: payloadUsers,
        });

        const added = Number(resp?.added || 0);
        const skipped = Number(resp?.skipped ?? Math.max(0, payloadUsers.length - added));

        await swal({
          title: added > 0 ? 'Done' : 'Already Added',
          text:
            added > 0 && skipped > 0
              ? `${added} creator${added === 1 ? '' : 's'} added to ${targetFolderName}. ${skipped} already added.`
              : added > 0
                ? `${added} creator${added === 1 ? '' : 's'} added to ${targetFolderName}.`
                : `${skipped} creator${skipped === 1 ? '' : 's'} already added in ${targetFolderName}.`,
          icon: added > 0 ? 'success' : 'info',
        });

        clearSelection();
        await loadActiveFolderHandles(selectedFolderId);
        return;
      }

      if (campaignId) {
        await post('/pipeline/bulk-add', {
          campaignId,
          modashIds: [],
          rawUsers: payloadUsers,
        });

        await swal({
          title: 'Done',
          text: 'Added to outreach pipeline.',
          icon: 'success',
        });

        clearSelection();
        return;
      }

      await showErr('No folder or campaign selected.');
    } catch (e: any) {
      await showErr(e?.message || 'Failed to add creators.');
    }
  }

  const activeFolderName = useMemo(() => {
    if (folderId) {
      return folders.find((f) => f._id === folderId)?.title || 'Folder';
    }

    if (selectedFolderId) {
      return folders.find((f) => f._id === selectedFolderId)?.title || 'Folder';
    }

    return '';
  }, [folderId, selectedFolderId, folders]);

  const primaryActionLabel = useMemo(() => {
    if (folderId) return `Add on ${activeFolderName || 'Folder'}`;
    if (selectedFolderId) return `Add on ${activeFolderName || 'Folder'}`;
    if (campaignId) return 'Add to Outreach';
    return 'Apply';
  }, [folderId, selectedFolderId, campaignId, activeFolderName, selectedCount, selectedNewCount]);

  useEffect(() => {
    loadSaved(1, filtersActive, '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const raw = query.trim();

    if (!raw) {
      setSearchHint('');
      return;
    }

    if (searchIntent.isHandle) {
      const existing = profilesByHandle.get(searchIntent.handle.toLowerCase());
      setSearchHint(
        existing
          ? 'Handle already saved. Search will open the saved profile.'
          : 'Explicit handle detected. Search will fetch full creator details first. You can save after preview.',
      );
      return;
    }

    setSearchHint('Keyword search runs live on YouTube. Use View Details to fetch full creator data, then save only if needed.');
  }, [query, searchIntent, profilesByHandle]);

  function upsertProfile(doc: InfluencerProfileDoc) {
    setProfiles((prev) => {
      const idx = prev.findIndex((x) => x.handleId === doc.handleId);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], ...doc };
        return copy;
      }
      setTotal((t) => t + 1);
      return [doc, ...prev];
    });
  }

  function toggleExpand(id: string) {
    setExpanded((p) => ({ ...p, [id]: !p[id] }));
  }

  function openAndScrollTo(id: string) {
    setExpanded((p) => ({ ...p, [id]: true }));
    setTimeout(() => {
      const el = document.getElementById(`card-${id}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
  }

  function openDetailsModal(p: InfluencerProfileDoc) {
    setDetailsHandleId(p.handleId);
    setDetailsForm({ email: p.email || '' });
    setDetailsModalOpen(true);
  }

  async function onSearch(e: React.FormEvent) {
    e.preventDefault();

    const raw = query.trim();
    if (!raw) {
      await showErr('Please enter a handle or keyword.');
      return;
    }

    clearSelection();

    if (searchIntent.isHandle) {
      if (existingProfile?.handleId) {
        setGlobalResult(null);
        openAndScrollTo(existingProfile.handleId);
        return;
      }

      await openPreview({ handle: searchIntent.handle });
      return;
    }

    await runGlobalSearch(raw);
  }

  async function saveDetails() {
    const payload: any = { handleId: detailsHandleId };
    const email = detailsForm.email.trim();

    if (email) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.toLowerCase())) {
        await showErr('Enter a valid email.');
        return;
      }
      payload.email = email.toLowerCase();
    } else {
      payload.email = null;
    }

    setDetailsSaving(true);
    try {
      const resp = await post<UpdateManualResponse>('/youtube/update-manual', payload);
      if (resp?.status !== 'ok') throw new Error('Failed to save details');
      upsertProfile(resp.data);
      setDetailsModalOpen(false);
    } catch (e: any) {
      await showErr(e?.message || 'Failed to save details.');
    } finally {
      setDetailsSaving(false);
    }
  }

  function applyFilters() {
    const next = { ...filtersDraft };
    setFiltersActive(next);
    filtersActiveRef.current = next;
    clearSelection();

    loadSaved(1, next, buildSavedSearchText(query));

    if (query.trim() && !searchIntent.isHandle) {
      runGlobalSearch(query.trim(), next);
    }

    setFilterModalOpen(false);
  }

  function clearFilters() {
    const empty: InfluencerFilters = {
      subscriberRange: '',
      countries: [],
      category: '',
      avgViewsMin: '',
      lastUploadDays: '',
      sortBy: 'relevance',
    };

    setFiltersDraft(empty);
    setFiltersActive(empty);
    filtersActiveRef.current = empty;
    clearSelection();

    loadSaved(1, empty, buildSavedSearchText(query));

    if (query.trim() && !searchIntent.isHandle) {
      runGlobalSearch(query.trim(), empty);
    }

    setFilterModalOpen(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-slate-900">YouTube Influencer Profiles</h1>
          <p className="text-slate-600">
            Search YouTube globally, preview full creator data, save the creators you want, and add selected creators to outreach when a campaign is active.
          </p>
        </div>

        <div className="mb-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-slate-50 px-6 py-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Discovery</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Use keywords for live YouTube search. Use <span className="font-semibold">@handle</span> when you want to save a creator.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {activeChips.length ? (
                  <>
                    {activeChips.slice(0, 5).map((c) => (
                      <span
                        key={c}
                        className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700 shadow-[0_1px_0_rgba(0,0,0,0.03)]"
                      >
                        {c}
                      </span>
                    ))}
                    {activeChips.length > 5 ? (
                      <span className="rounded-full bg-teal-600 px-3 py-1 text-xs text-white">
                        +{activeChips.length - 5}
                      </span>
                    ) : null}
                  </>
                ) : (
                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600">
                    No active filters
                  </span>
                )}

                {campaignId ? (
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs text-emerald-700">
                    Outreach mode active
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <form onSubmit={onSearch} className="p-6">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
              <div className="grid grid-cols-1 items-end gap-3 lg:grid-cols-12">
                <div className="lg:col-span-7">
                  <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                    Search keywords or explicit handles
                  </label>

                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <input
                      className="w-full rounded-xl border border-slate-300 bg-white py-3.5 pl-12 pr-4 outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-teal-600"
                      value={query}
                      onChange={(e) => {
                        const v = e.target.value;
                        setQuery(v);

                        if (typeSearchRef.current) clearTimeout(typeSearchRef.current);

                        typeSearchRef.current = setTimeout(() => {
                          const searchText = buildSavedSearchText(v);
                          loadSaved(1, filtersActiveRef.current, searchText);
                        }, 350);
                      }}
                      placeholder="e.g. powerstation reviews, tech creator, @MrBeast"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:col-span-5">
                  <button
                    className="flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 font-semibold text-white shadow-sm transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
                    type="submit"
                    disabled={searchLoading}
                  >
                    {searchLoading ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Searching…
                      </>
                    ) : searchIntent.isHandle ? (
                      existingProfile ? 'Open Profile' : 'Preview Creator'
                    ) : (
                      'Search'
                    )}
                  </button>

                  <button
                    type="button"
                    className="flex h-[52px] w-full items-center justify-center gap-2 rounded-xl border border-slate-300 px-5 font-semibold text-slate-800 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={() => {
                      clearSelection();
                      loadSaved(1, filtersActive, buildSavedSearchText(query));
                    }}
                    disabled={listLoading}
                  >
                    <RefreshCw className={`h-4 w-4 ${listLoading ? 'animate-spin' : ''}`} />
                    Refresh Saved
                  </button>

                  <button
                    type="button"
                    className="flex h-[52px] w-full items-center justify-center gap-2 rounded-xl border border-slate-300 px-5 font-semibold text-slate-800 transition-colors hover:bg-slate-50"
                    onClick={() => setFilterModalOpen(true)}
                  >
                    <Filter className="h-4 w-4" />
                    Filters
                  </button>
                </div>
              </div>

              {searchHint ? (
                <div className="mt-4 flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
                  <div className="mt-0.5">
                    <Info className="h-5 w-5 text-slate-500" />
                  </div>
                  <p className="text-sm text-slate-700">{searchHint}</p>
                </div>
              ) : null}
            </div>
          </form>
        </div>

        {globalResult ? (
          <div className="mb-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 bg-white px-6 py-5">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Live YouTube Results for “{globalResult.query}”</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {formatNumber(globalResult.channelsFound)} creators • {formatNumber(globalResult.videoHits)} matched videos
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <Checkbox
                    checked={
                      visibleLiveRecommendations.length
                        ? visibleLiveRecommendations.every((item) => !!selectedIds[liveRowKey(item)])
                          ? (true as any)
                          : visibleLiveRecommendations.some((item) => !!selectedIds[liveRowKey(item)])
                            ? ('indeterminate' as any)
                            : (false as any)
                        : (false as any)
                    }
                    onCheckedChange={(v: any) => {
                      const checked = !!v;
                      checked ? selectAllLive(visibleLiveRecommendations) : clearAllLive(visibleLiveRecommendations);
                    }}
                  />
                  Select visible
                </label>

                {selectedCount ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {!folderId ? (
                        <FolderSelect
                          folders={folders}
                          value={selectedFolderId}
                          onChange={setSelectedFolderId}
                        />
                      ) : null}

                      <button
                        type="button"
                        className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
                        onClick={handlePrimaryAddAction}
                        disabled={
                          foldersLoading ||
                          disableAddToFolder ||
                          (!folderId && !selectedFolderId && !campaignId)
                        }
                      >
                        {primaryActionLabel}
                      </button>
                    </div>

                    {(folderId || selectedFolderId) && selectedAlreadyAddedCount > 0 ? (
                      <div className="text-xs font-medium text-amber-700">
                        {selectedAlreadyAddedCount} selected creator{selectedAlreadyAddedCount === 1 ? '' : 's'} already in this folder.
                      </div>
                    ) : null}
                  </div>
                ) : null}

                <button
                  type="button"
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  onClick={() => {
                    clearAllLive(visibleLiveRecommendations);
                    setGlobalResult(null);
                  }}
                >
                  Clear Results
                </button>
              </div>
            </div>

            <div className="bg-slate-50/70 p-5">
              {!globalResult.recommendations?.length ? (
                <div className="px-6 py-10 text-center text-slate-500">No live results found.</div>
              ) : (
                <div className="space-y-5">
                  {visibleLiveRecommendations.map((item) => {
                    const saved = item.handle ? profilesByHandle.get(String(item.handle).toLowerCase()) : undefined;
                    return (
                      <GlobalSearchCard
                        key={item.channelId || item.handle || item.title}
                        item={item}
                        savedProfile={saved}
                        onOpenSaved={(id) => openAndScrollTo(id)}
                        onViewDetails={(payload) => openPreview(payload)}
                        loading={searchLoading}
                        selected={!!selectedIds[liveRowKey(item)]}
                        onToggleSelect={(checked) => toggleSelect(liveRowKey(item), checked)}
                      />
                    );
                  })}

                  {globalResult.recommendations.length > 10 || globalHasMore ? (
                    <div className="flex justify-center pt-4">
                      <button
                        type="button"
                        className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-50"
                        onClick={loadMoreGlobalResults}
                        disabled={globalLoadingMore}
                      >
                        {globalLoadingMore ? 'Loading...' : 'Load More'}
                      </button>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        ) : null}

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 bg-white px-6 py-5">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                {formatNumber(total)} Saved Creator Result{total === 1 ? '' : 's'}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                This section is your saved database. Typing in the search box filters these saved creators too.
              </p>
            </div>

            <span className="rounded-full bg-teal-600 px-3 py-1 text-xs text-white">Sort: {sortLabel(filtersActive.sortBy)}</span>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-slate-50 px-6 py-4">
            <div className="flex items-center gap-3">
              <Checkbox
                checked={
                  profiles.length
                    ? profiles.every((p) => !!selectedIds[savedRowKey(p)])
                      ? (true as any)
                      : profiles.some((p) => !!selectedIds[savedRowKey(p)])
                        ? ('indeterminate' as any)
                        : (false as any)
                    : (false as any)
                }
                onCheckedChange={(v: any) => {
                  const checked = !!v;
                  checked ? selectAllSaved(profiles) : clearAllSaved(profiles);
                }}
              />
              <span className="text-sm font-medium text-slate-700">Select saved creators</span>

              {selectedCount ? (
                <span className="text-sm text-slate-600">
                  Selected <b>{selectedCount}</b>
                </span>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2">

              {selectedCount ? (
                <div className="flex flex-wrap items-center gap-2">
                  {!folderId ? (
                    <FolderSelect
                      folders={folders}
                      value={selectedFolderId}
                      onChange={setSelectedFolderId}
                    />
                  ) : null}

                  <button
                    type="button"
                    className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
                    onClick={handlePrimaryAddAction}
                    disabled={foldersLoading || (!folderId && !selectedFolderId && !campaignId)}
                  >
                    {primaryActionLabel}
                  </button>
                </div>
              ) : null}
            </div>
          </div>

          <div className="bg-slate-50/70 p-5">
            {listLoading && profiles.length === 0 ? (
              <div className="px-6 py-12 text-center text-slate-500">
                <RefreshCw className="mx-auto mb-2 h-8 w-8 animate-spin" />
                Loading profiles...
              </div>
            ) : null}

            {!listLoading && profiles.length === 0 ? (
              <div className="px-6 py-12 text-center text-slate-500">
                No matching saved profiles. Use keywords for live search, or use an explicit @handle to save from YouTube.
              </div>
            ) : null}

            <div className="space-y-5">
              {profiles.map((p) => {
                const cardId = getCardId(p);
                const isOpen = !!expanded[cardId];
                const thumb = getThumbUrl(p.thumbnails);
                const channelUrl = ytChannelUrl(p);
                const topics = getTopicNames(p);
                const selectionKey = savedRowKey(p);
                const checked = !!selectedIds[selectionKey];

                return (
                  <div
                    key={cardId}
                    id={`card-${cardId}`}
                    className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
                  >
                    <div className="p-6">
                      <div className="flex flex-col gap-5 xl:flex-row xl:items-start">
                        <div className="flex min-w-0 flex-1 items-start gap-4">
                          <div className="pt-2">
                            <Checkbox checked={checked} onCheckedChange={(v: any) => toggleSelect(selectionKey, !!v)} />
                          </div>

                          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full bg-slate-200 ring-4 ring-slate-100">
                            {thumb ? <img src={thumb} alt="" className="h-full w-full object-cover" loading="lazy" /> : null}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="truncate text-3xl font-bold leading-tight text-slate-900">
                                {p.title || p.handle || '—'}
                              </h3>

                              {p.platform ? (
                                <span className="rounded-full border border-slate-300 px-2 py-0.5 text-[10px] text-slate-600">
                                  {p.platform}
                                </span>
                              ) : null}

                              {p.country ? (
                                <span className="rounded-full border border-teal-200 bg-teal-50 px-2 py-0.5 text-[10px] text-teal-700">
                                  {p.country}
                                </span>
                              ) : null}
                            </div>

                            <div className="mt-2 flex flex-wrap items-center gap-3">
                              <div className="text-lg font-semibold text-teal-600">{p.handle || '—'}</div>

                              {p.lastSponsor ? (
                                <span className="rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1 text-xs text-orange-700">
                                  Last Sponsor: {p.lastSponsor}
                                </span>
                              ) : null}

                              {p.managedByAgency != null ? (
                                <span className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs text-slate-700">
                                  Agency: {formatBool(p.managedByAgency)}
                                </span>
                              ) : null}
                            </div>

                            {topics.length ? (
                              <div className="mt-3 flex flex-wrap gap-2">
                                {topics.slice(0, 5).map((t) => (
                                  <span
                                    key={t}
                                    className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[11px] text-slate-700"
                                  >
                                    {t}
                                  </span>
                                ))}
                                {topics.length > 5 ? (
                                  <span className="rounded-full bg-teal-600 px-2.5 py-1 text-[11px] text-white">
                                    +{topics.length - 5} Categories
                                  </span>
                                ) : null}
                              </div>
                            ) : null}

                            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-500">
                              <span>Synced: {formatDate(p.syncedAt)}</span>
                              <span>Last Upload: {formatDate(p.lastUploadAt)}</span>
                              <span>Email: {p.email || '—'}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 sm:flex-row xl:w-[230px] xl:flex-col">
                          {p.channelId ? (
                            <Link
                              href={`/mediakit/${encodeURIComponent(p.channelId)}?platform=${encodeURIComponent(
                                String(p.platform || 'youtube').toLowerCase(),
                              )}&handle=${encodeURIComponent(String(p.handle || ''))}${campaignId ? `&campaignId=${encodeURIComponent(campaignId)}` : ''
                                }`}
                              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-100"
                            >
                              <Info className="h-4 w-4" />
                              Load Advanced Insights
                            </Link>
                          ) : (
                            <button
                              type="button"
                              disabled
                              className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-400"
                            >
                              <Info className="h-4 w-4" />
                              Load Advanced Insights
                            </button>
                          )}

                          {channelUrl ? (
                            <a
                              href={channelUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-100"
                            >
                              <ExternalLink className="h-4 w-4" />
                              View Channel
                            </a>
                          ) : null}

                          <button
                            type="button"
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-teal-700"
                            onClick={() => openDetailsModal(p)}
                          >
                            <Mail className="h-4 w-4" />
                            Update Email
                          </button>

                          <button
                            type="button"
                            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-100"
                            onClick={() => toggleExpand(cardId)}
                          >
                            {isOpen ? 'Hide Intelligence' : 'Show Intelligence'}
                            <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                          </button>
                        </div>
                      </div>

                      <div className="mt-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
                        <MetricCard label="Subscriber Base" value={formatNumber(p.subscriberCount)} />
                        <MetricCard label="Avg. View Velocity" value={formatNumber(p.avgViewsLast15)} />
                        <MetricCard label="Audience Engagement" value={formatPercent(p.engagementRateLast15)} />
                        <MetricCard
                          label="Content Frequency"
                          value={p.uploadFrequencyPerWeek != null ? `${p.uploadFrequencyPerWeek}/wk` : '—'}
                        />
                      </div>
                    </div>

                    {isOpen ? (
                      <div className="border-t border-slate-200 bg-slate-50/80 p-6">
                        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                          <div className="rounded-2xl border border-slate-200 bg-white p-5">
                            <div className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                              Channel Intelligence
                            </div>

                            <div className="space-y-3">
                              <Row label="Operating Language" value={p.defaultLanguage || '—'} />
                              <Row label="Verified Contact Email" value={p.email || '—'} />
                              <Row label="Content Ecosystem" value={topics.length ? topics.join(', ') : '—'} />
                              <Row label="Total Lifetime Views" value={formatNumber(p.totalViewCount)} />
                              <Row label="Total Videos" value={formatNumber(p.totalVideoCount)} />
                              <Row label="Instagram" value={p.instagramHandle || '—'} />
                              <Row label="Last Video" value={p.lastVideoTitle || '—'} />
                              <Row label="Latest Video Link" value={p.lastVideoId ? 'Available' : '—'} />
                            </div>

                            {p.lastVideoId ? (
                              <div className="mt-4 border-t border-slate-200 pt-4">
                                <a
                                  href={ytVideoUrl(p.lastVideoId)}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-2 text-sm font-semibold text-teal-600 hover:text-teal-700"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                  Watch latest video
                                </a>
                              </div>
                            ) : null}
                          </div>

                          <div className="rounded-2xl border border-slate-200 bg-white p-5">
                            <div className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                              Market Reliability
                            </div>

                            <div className="space-y-3">
                              <Row label="Account Creation" value={formatDate(p.createdAt)} />
                              <Row
                                label="Upload Consistency"
                                value={p.avgDaysBetweenUploads != null ? `${p.avgDaysBetweenUploads} days gap` : '—'}
                              />
                              <Row label="Market Category" value={p.country || '—'} />
                              <Row label="Top Audience Country" value={p.topAudienceCountry || '—'} />
                              <Row
                                label="Average Audience Age"
                                value={p.averageAudienceAge != null ? String(p.averageAudienceAge) : '—'}
                              />
                              <Row label="Managed by Agency" value={formatBool(p.managedByAgency)} />
                              <Row label="Last Contacted" value={formatDate(p.lastContactedAt)} />
                              <Row label="Working Handle" value={p.workingHandle || '—'} />
                            </div>

                            {p.description ? (
                              <div className="mt-4 border-t border-slate-200 pt-4">
                                <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                  Summary
                                </div>
                                <p className="whitespace-pre-line text-sm leading-6 text-slate-600">{p.description}</p>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 bg-white px-6 py-4">
            <div className="text-sm text-slate-600">
              Page <span className="font-semibold text-slate-900">{page}</span>
              {total ? (
                <>
                  {' '}
                  • <span className="font-semibold text-slate-900">{formatNumber(total)}</span> total
                </>
              ) : null}
            </div>

            <div className="flex gap-2">
              <button
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => loadSaved(Math.max(1, page - 1), filtersActive, buildSavedSearchText(query))}
                disabled={listLoading || page <= 1}
              >
                Previous
              </button>

              <button
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => loadSaved(page + 1, filtersActive, buildSavedSearchText(query))}
                disabled={listLoading || !hasNext}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {filterModalOpen ? (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-6xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-6 py-5">
              <div>
                <h3 className="text-xl font-semibold text-slate-900">Search Parameters</h3>
                <p className="mt-1 text-sm text-slate-600">
                  Refine your saved-database search with production-ready dropdown filters.
                </p>
              </div>

              <button
                type="button"
                className="rounded-lg p-2 transition-colors hover:bg-slate-100"
                onClick={() => setFilterModalOpen(false)}
                aria-label="Close filters"
              >
                <X className="h-5 w-5 text-slate-600" />
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                    Subscribers Range
                  </label>
                  <select
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 outline-none focus:border-transparent focus:ring-2 focus:ring-teal-600"
                    value={filtersDraft.subscriberRange}
                    onChange={(e) => setFiltersDraft((p) => ({ ...p, subscriberRange: e.target.value }))}
                  >
                    {SUBSCRIBER_RANGES.map((opt) => (
                      <option key={opt.value || 'all'} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                    Country
                  </label>
                  <MultiCountrySelect
                    value={filtersDraft.countries || []}
                    onChange={(next) => setFiltersDraft((p) => ({ ...p, countries: next }))}
                  />
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                    Category
                  </label>
                  <select
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 outline-none focus:border-transparent focus:ring-2 focus:ring-teal-600"
                    value={filtersDraft.category}
                    onChange={(e) => setFiltersDraft((p) => ({ ...p, category: e.target.value }))}
                  >
                    <option value="">All</option>
                    {CATEGORY_OPTIONS.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                    Average Views
                  </label>
                  <select
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 outline-none focus:border-transparent focus:ring-2 focus:ring-teal-600"
                    value={filtersDraft.avgViewsMin}
                    onChange={(e) => setFiltersDraft((p) => ({ ...p, avgViewsMin: e.target.value }))}
                  >
                    {AVG_VIEWS_OPTIONS.map((opt) => (
                      <option key={opt.value || 'all'} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                    Last Upload
                  </label>
                  <select
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 outline-none focus:border-transparent focus:ring-2 focus:ring-teal-600"
                    value={filtersDraft.lastUploadDays}
                    onChange={(e) => setFiltersDraft((p) => ({ ...p, lastUploadDays: e.target.value }))}
                  >
                    {LAST_UPLOAD_OPTIONS.map((opt) => (
                      <option key={opt.value || 'any'} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                    Sort By
                  </label>
                  <select
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 outline-none focus:border-transparent focus:ring-2 focus:ring-teal-600"
                    value={filtersDraft.sortBy}
                    onChange={(e) =>
                      setFiltersDraft((p) => ({
                        ...p,
                        sortBy: e.target.value as SavedSortValue,
                      }))
                    }
                  >
                    {SORT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
              <button
                type="button"
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                onClick={clearFilters}
                disabled={listLoading}
              >
                Clear All
              </button>

              <button
                type="button"
                className="rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-700"
                onClick={applyFilters}
                disabled={listLoading}
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {detailsModalOpen ? (
        <div className="fixed inset-0 z-[115] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 p-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Update Email</h3>
                <p className="mt-1 text-sm text-slate-500">Update the creator email address.</p>
              </div>

              <button
                onClick={() => setDetailsModalOpen(false)}
                className="rounded-lg p-2 transition-colors hover:bg-slate-100"
                aria-label="Close"
              >
                <X className="h-5 w-5 text-slate-600" />
              </button>
            </div>

            <div className="p-6">
              <label className="mb-2 block text-sm text-slate-600">Email Address</label>
              <input
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-teal-600"
                value={detailsForm.email}
                onChange={(e) => setDetailsForm({ email: e.target.value })}
                placeholder="brand@domain.com"
                type="email"
                autoFocus
              />
            </div>

            <div className="flex gap-3 border-t border-slate-200 p-6">
              <button
                className="flex-1 rounded-xl border border-slate-300 px-4 py-3 font-medium text-slate-700 transition-colors hover:bg-slate-50"
                onClick={() => setDetailsModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className="flex-1 rounded-xl bg-teal-600 px-4 py-3 font-medium text-white transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={saveDetails}
                disabled={detailsSaving}
              >
                {detailsSaving ? 'Saving...' : 'Update Email'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {saveEmailModalOpen ? (
        <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 p-5">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Save Profile</h3>
                <p className="mt-1 text-sm text-slate-500">Enter email before saving this creator to database.</p>
              </div>

              <button
                type="button"
                className="rounded-lg p-2 transition-colors hover:bg-slate-100"
                onClick={() => {
                  if (previewSaving) return;
                  setSaveEmailModalOpen(false);
                }}
                aria-label="Close"
              >
                <X className="h-5 w-5 text-slate-600" />
              </button>
            </div>

            <div className="p-5">
              <label className="mb-2 block text-sm text-slate-600">Email Address</label>
              <input
                type="email"
                value={previewEmail}
                onChange={(e) => setPreviewEmail(e.target.value)}
                placeholder="brand@domain.com"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-teal-600"
                autoFocus
              />

              {previewData?.handle ? (
                <div className="mt-3 text-xs text-slate-500">
                  Saving profile for <span className="font-semibold text-slate-700">{previewData.handle}</span>
                </div>
              ) : null}
            </div>

            <div className="flex gap-3 border-t border-slate-200 bg-slate-50 p-5">
              <button
                type="button"
                className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-50"
                onClick={() => setSaveEmailModalOpen(false)}
                disabled={previewSaving}
              >
                Cancel
              </button>

              <button
                type="button"
                className="flex-1 rounded-xl bg-teal-600 px-4 py-3 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
                onClick={() => savePreviewProfile(previewEmail)}
                disabled={previewSaving}
              >
                {previewSaving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <PreviewSidebar
        open={previewOpen}
        loading={previewLoading}
        saving={previewSaving}
        data={previewData}
        savedProfile={previewData?.handle ? profilesByHandle.get(previewData.handle.toLowerCase()) : undefined}
        onClose={() => {
          setPreviewOpen(false);
          setPreviewData(null);
          setSaveEmailModalOpen(false);
          setPreviewEmail('');
        }}
        onSave={() => {
          setPreviewEmail(previewData?.email || '');
          setSaveEmailModalOpen(true);
        }}
        onOpenSaved={(id) => {
          setPreviewOpen(false);
          setPreviewData(null);
          setSaveEmailModalOpen(false);
          setPreviewEmail('');
          openAndScrollTo(id);
        }}
      />
    </div>
  );
}
