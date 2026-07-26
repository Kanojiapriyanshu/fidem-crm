'use client';

import React, {
  ChangeEvent,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRightLeft,
  CheckCircle2,
  Clock3,
  Copy,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Heart,
  Link2,
  Loader2,
  Mail,
  PencilLine,
  Plus,
  RefreshCw,
  Save,
  Sparkles,
  Settings2,
  Trash2,
  UploadCloud,
  UserPlus,
  Users,
  X,
  XCircle,
  Youtube,
} from 'lucide-react';
import swal from 'sweetalert';

import { adminPost, get, post } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';

type AdminMini = {
  _id?: string;
  adminId?: string;
  name?: string;
  email?: string;
  proxyEmail?: string;
  role?: string;
  designation?: string;
  teamType?: string | null;
  status?: string;
};

type FolderShare = {
  token?: string;
  url?: string;
  generatedAt?: string | null;
  sharedBy?: {
    _id?: string;
    adminId?: string;
    name?: string;
    email?: string;
    role?: string;
    designation?: string;
    teamType?: string | null;
  } | null;
};

type FolderItemMediaKit = {
  s3Key?: string;
  fileName?: string;
  mimeType?: string;
  size?: number | null;
  uploadedAt?: string | null;
  showToBrand?: boolean;
  requestStatus?: 'none' | 'requested' | 'approved' | 'rejected';
  requestedAt?: string | null;
  reviewedAt?: string | null;
};

type FolderItemMediaKitLink = {
  url?: string;
  generatedAt?: string | null;
  showToBrand?: boolean;
  requestStatus?: 'none' | 'requested' | 'approved' | 'rejected';
  requestedAt?: string | null;
  reviewedAt?: string | null;
};

type FolderItemMediaKitAccess = {
  hasAdded?: boolean;
  allowed?: boolean;
  visibleSource?: 'pdf' | 'link' | null;
  requestStatus?: 'none' | 'requested' | 'approved' | 'rejected';
  requestedAt?: string | null;
  availableOnRequest?: boolean;
  buttonLabel?: string;
  url?: string;
};

type RateCardHistoryEntry = {
  _id?: string;
  field?: 'influencerRateCard' | 'platformRateCard';
  previousValue?: string;
  newValue?: string;
  changedAt?: string | null;
  changedByAdminId?: string | null;
};


type AssignedCampaign = {
  campaignId?: string | null;
  campaignsId?: string;
  campaignTitle?: string;
  productOrServiceName?: string;
  brandId?: string | null;
  brandName?: string;
  assignedAt?: string | null;
  assignedByAdminId?: string | null;
};

type FolderItemCampaignActivation = {
  active?: boolean;
  campaignId?: string | null;
  campaignsId?: string;
  influencerId?: string | null;
  activeAt?: string | null;
  activatedByAdminId?: string | null;
};

type FolderItemCampaignInvitation = {
  invitationId?: string | null;
  campaignId?: string | null;
  status?: string | null;
  sentAt?: string | null;
  updatedAt?: string | null;
};

type FolderItem = {
  _id: string;
  provider?: string;
  name?: string;
  handle?: string;
  followers?: number | null;
  primaryLink?: string;
  links?: string[];
  niche?: string[];
  email?: string;
  country?: string;
  selectionReason?: string;
  goodFit?: boolean | null;
  influencerRateCard?: string;
  platformRateCard?: string;
  rateCardCurrency?: string;
  rateCardHistory?: RateCardHistoryEntry[];
  ourFeePct?: number | null;
  shippingAddress?: string;
  comments?: string;
  mediaKit?: FolderItemMediaKit | null;
  mediaKitLink?: FolderItemMediaKitLink | null;
  mediaKitAccess?: FolderItemMediaKitAccess | null;
  createdInfluencerId?: string | null;
  influencerCreatedAt?: string | null;
  influencerIsAdminCreated?: boolean | null;
  influencerCreatedBySource?: string | null;
  linkedInfluencer?: {
    influencerId?: string | null;
    createdAt?: string | null;
    isAdminCreated?: boolean | null;
    createdBySource?: string | null;
    signupCompleted?: boolean | null;
  } | null;
  campaignActivation?: FolderItemCampaignActivation | null;
  campaignInvitation?: FolderItemCampaignInvitation | null;
};

type FolderResponse = {
  _id: string;
  title: string;
  slug?: string;
  description?: string;
  brandVisibleItemCount?: number | null;
  showFullListToBrand?: boolean;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: AdminMini | null;
  updatedBy?: AdminMini | null;
  share?: FolderShare;
  shares?: Array<{
    token: string;
    url: string;
    brandName: string;
    generatedAt: string | null;
    sharedBy?: unknown;
  }>;
  assignedCampaign?: AssignedCampaign | null;
  items?: FolderItem[];
};

type TransferMode = 'move' | 'copy';

type TransferItemsResponse = {
  success?: boolean;
  data?: {
    action?: 'copy' | 'move';
    copiedCount?: number;
    movedCount?: number;
    skippedMissingItemIds?: string[];
    skippedDuplicateItemIds?: string[];
  };
};

type FolderListItem = {
  _id: string;
  title: string;
  description?: string;
};

type FolderListResponse = {
  success: boolean;
  data: FolderListItem[];
};

type AdminInfluencerListItem = {
  _id?: string;
  email?: string | null;
  proxyEmail?: string | null;
  isAdminCreated?: boolean | null;
  signupCompleted?: boolean | null;
  createdBySource?: string | null;
  createdByLabel?: string | null;
  currentStatus?: string | null;
};

type InfluencerMatchMeta = {
  influencerId: string;
  isAdminCreated?: boolean | null;
  createdBySource?: string | null;
  signupCompleted?: boolean | null;
};

type AdminInfluencerListResponse = {
  success?: boolean;
  influencers?: AdminInfluencerListItem[];
};

type DrawerMode = 'create' | 'edit';
type RateCardTab = 'influencer' | 'admin' | 'history';

type DraftState = {
  provider: string;
  name: string;
  handle: string;
  followers: string | number;
  niche: string;
  email: string;
  country: string;
  selectionReason: string;
  goodFit: boolean;
  influencerRateCard: string;
  platformRateCard: string;
  rateCardCurrency: string;
  ourFeePct: string | number;
  shippingAddress: string;
};

type DiffToken = {
  text: string;
  changed: boolean;
};

const DASH = '--';
const MEDIAKIT_BUCKET =
  process.env.NEXT_PUBLIC_MEDIAKIT_BUCKET || 'pitch-mediakit';
const MEDIAKIT_REGION =
  process.env.NEXT_PUBLIC_MEDIAKIT_REGION || 'us-east-1';

const DEFAULT_DRAFT: DraftState = {
  provider: 'instagram',
  name: '',
  handle: '',
  followers: '',
  niche: '',
  email: '',
  country: '',
  selectionReason: '',
  goodFit: false,
  influencerRateCard: '',
  platformRateCard: '',
  rateCardCurrency: 'USD',
  ourFeePct: '',
  shippingAddress: '',
};

function showErr(message: string) {
  return swal({
    title: 'Error',
    text: message || 'Something went wrong.',
    icon: 'error',
  });
}

function showSuccess(message: string) {
  return swal({
    title: 'Success',
    text: message,
    icon: 'success',
  });
}

function getApiErrorMessage(error: any, fallback = 'Something went wrong.') {
  const possibleMessage =
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.data?.message ||
    error?.data?.error ||
    error?.error?.message ||
    error?.message ||
    '';

  if (typeof possibleMessage === 'string') {
    const trimmed = possibleMessage.trim();

    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const parsed = JSON.parse(trimmed);
        return parsed?.message || parsed?.error || fallback;
      } catch {
        return trimmed || fallback;
      }
    }

    return trimmed || fallback;
  }

  return fallback;
}

function isBrandEmailRegisteredError(message?: string | null) {
  const normalized = asText(message).toLowerCase();
  return (
    normalized.includes('already registered as a brand') ||
    (normalized.includes('email') &&
      normalized.includes('brand') &&
      normalized.includes('already registered'))
  );
}

function showCreateInfluencerError(message: string, email?: string) {
  if (isBrandEmailRegisteredError(message)) {
    return swal({
      title: 'Email Already Registered as Brand',
      text: `${email ? `${email} is` : 'This email is'} already registered as a brand. Please use a different influencer email address.`,
      icon: 'error',
    });
  }

  return showErr(message || 'Failed to create influencer.');
}

function asText(v: unknown) {
  if (v === undefined || v === null) return '';
  return String(v).trim();
}

function parseCsv(v: string) {
  return (v || '')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
}

function toNullableNumber(v: unknown) {
  if (v === '' || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function toNullableInteger(v: unknown) {
  const n = toNullableNumber(v);
  return n !== null && Number.isInteger(n) && n >= 0 ? n : null;
}

function formatNumber(n?: number | null) {
  if (n == null || !Number.isFinite(n)) return DASH;
  return new Intl.NumberFormat('en-IN').format(n);
}

function cleanText(value?: string | null) {
  return String(value || '').trim();
}

function getHandleWithoutAt(handle?: string) {
  return cleanText(handle).replace(/^@+/, '');
}

function ensureAbsoluteUrl(url?: string | null) {
  const value = cleanText(url);
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  return `https://${value}`;
}

function buildFallbackProfileUrl(provider?: string, handle?: string) {
  const username = getHandleWithoutAt(handle);
  if (!username) return '';

  const p = cleanText(provider).toLowerCase();

  if (p === 'youtube') return `https://www.youtube.com/@${username}`;
  if (p === 'instagram') return `https://www.instagram.com/${username}/`;
  if (p === 'tiktok') return `https://www.tiktok.com/@${username}`;

  return '';
}

function getProfileUrl(row: FolderItem) {
  const primary = ensureAbsoluteUrl(row.primaryLink);
  if (primary) return primary;

  const firstLink =
    Array.isArray(row.links) && row.links.length
      ? ensureAbsoluteUrl(row.links[0])
      : '';
  if (firstLink) return firstLink;

  return buildFallbackProfileUrl(row.provider, row.handle);
}

function normalizeAdminCreatePlatform(value?: string | null) {
  const provider = cleanText(value).toLowerCase();

  if (provider === 'youtube' || provider === 'yt') return 'youtube';
  if (provider === 'instagram' || provider === 'ig' || provider === 'insta') return 'instagram';
  if (provider === 'tiktok' || provider === 'tt' || provider === 'tk') return 'tiktok';

  return '';
}

function extractUsernameFromUrl(url?: string | null) {
  const value = ensureAbsoluteUrl(url);
  if (!value) return '';

  try {
    const parsed = new URL(value);
    const host = parsed.hostname.toLowerCase();
    const parts = parsed.pathname.split('/').map((part) => part.trim()).filter(Boolean);

    if (!parts.length) return '';

    if (host.includes('instagram.com')) {
      return parts[0].replace(/^@+/, '');
    }

    if (host.includes('tiktok.com')) {
      return parts[0].replace(/^@+/, '');
    }

    if (host.includes('youtube.com') || host.includes('youtu.be')) {
      const atPart = parts.find((part) => part.startsWith('@'));
      if (atPart) return atPart.replace(/^@+/, '');
      return parts[0].replace(/^@+/, '');
    }
  } catch {
    return '';
  }

  return '';
}

function getAdminCreateUsernameFromRow(row: FolderItem) {
  const handleUsername = asText(row.handle).replace(/^@+/, '');
  if (handleUsername) return handleUsername;

  const primaryUsername = extractUsernameFromUrl(row.primaryLink);
  if (primaryUsername) return primaryUsername;

  if (Array.isArray(row.links)) {
    for (const link of row.links) {
      const username = extractUsernameFromUrl(link);
      if (username) return username;
    }
  }

  return '';
}

function normalizeEmailForCompare(value?: string | null) {
  return asText(value).toLowerCase();
}

function getInfluencerMatchFromList(
  influencers: AdminInfluencerListItem[] = [],
  email: string
): InfluencerMatchMeta | null {
  const targetEmail = normalizeEmailForCompare(email);
  if (!targetEmail) return null;

  const exactMatch = influencers.find((influencer) => {
    const influencerEmail = normalizeEmailForCompare(influencer.email);
    const proxyEmail = normalizeEmailForCompare(influencer.proxyEmail);

    return influencerEmail === targetEmail || proxyEmail === targetEmail;
  });

  if (!exactMatch?._id) return null;

  return {
    influencerId: String(exactMatch._id),
    isAdminCreated:
      exactMatch.isAdminCreated === true
        ? true
        : exactMatch.isAdminCreated === false
          ? false
          : null,
    createdBySource: exactMatch.createdBySource || null,
    signupCompleted:
      exactMatch.signupCompleted === true
        ? true
        : exactMatch.signupCompleted === false
          ? false
          : null,
  };
}

function markRowAsExistingInfluencer(
  row: FolderItem,
  influencer: string | InfluencerMatchMeta
) {
  const meta: InfluencerMatchMeta =
    typeof influencer === 'string'
      ? { influencerId: influencer }
      : influencer;

  return {
    ...row,
    createdInfluencerId: row.createdInfluencerId || meta.influencerId,
    influencerIsAdminCreated:
      meta.isAdminCreated ?? row.influencerIsAdminCreated ?? null,
    influencerCreatedBySource:
      meta.createdBySource || row.influencerCreatedBySource || null,
    linkedInfluencer: {
      ...(row.linkedInfluencer || {}),
      influencerId: row.linkedInfluencer?.influencerId || meta.influencerId,
      createdAt: row.linkedInfluencer?.createdAt || row.influencerCreatedAt || null,
      isAdminCreated:
        meta.isAdminCreated ?? row.linkedInfluencer?.isAdminCreated ?? null,
      createdBySource:
        meta.createdBySource || row.linkedInfluencer?.createdBySource || null,
      signupCompleted:
        meta.signupCompleted ?? row.linkedInfluencer?.signupCompleted ?? null,
    },
  };
}

function getRowInfluencerId(row: FolderItem) {
  const influencerId = asText(row.createdInfluencerId || row.linkedInfluencer?.influencerId);
  return influencerId === 'already-created' ? '' : influencerId;
}

function getRowInfluencerSource(row: FolderItem): 'admin' | 'self' | 'unknown' {
  const source = asText(
    row.influencerCreatedBySource || row.linkedInfluencer?.createdBySource
  ).toLowerCase();

  const isAdminCreated =
    row.influencerIsAdminCreated ?? row.linkedInfluencer?.isAdminCreated ?? null;

  if (isAdminCreated === true || source === 'admin') return 'admin';

  if (
    isAdminCreated === false ||
    source === 'self' ||
    source === 'influencer' ||
    source.includes('self')
  ) {
    return 'self';
  }

  return 'unknown';
}

function getAssignedCampaignId(assignedCampaign?: AssignedCampaign | null) {
  return asText(assignedCampaign?.campaignId || assignedCampaign?.campaignsId);
}

function getCampaignInvitationStatus(row: FolderItem, campaignId?: string | null) {
  const invitation = row.campaignInvitation;
  if (!invitation?.status) return '';

  const currentCampaignId = asText(campaignId);
  if (currentCampaignId && invitation.campaignId && String(invitation.campaignId) !== currentCampaignId) {
    return '';
  }

  return asText(invitation.status).toLowerCase();
}

function isRowGoodFit(row?: FolderItem | null) {
  return row?.goodFit === true;
}

function formatDate(iso?: string | null) {
  if (!iso) return DASH;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return DASH;

  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  }).format(d);
}

function formatDateTime(iso?: string | null) {
  if (!iso) return DASH;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return DASH;

  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

function prettyText(value?: string | null) {
  const v = String(value || '').trim();
  if (!v) return DASH;
  return v.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function normalizeHandle(value: string) {
  const raw = asText(value).replace(/^@+/, '');
  return raw ? `@${raw}` : '';
}

function buildPublicMediaKitUrl(mediaKit?: FolderItemMediaKit | null) {
  const s3Key = asText(mediaKit?.s3Key);
  if (!s3Key) return '';

  const encodedKey = s3Key
    .split('/')
    .map((part) => encodeURIComponent(part))
    .join('/');

  return `https://${MEDIAKIT_BUCKET}.s3.${MEDIAKIT_REGION}.amazonaws.com/${encodedKey}`;
}

function getShippingAddress(row?: FolderItem | null) {
  return asText(row?.shippingAddress || row?.comments);
}

function buildPayloadFromDraft(draft: DraftState) {
  return {
    provider: asText(draft.provider).toLowerCase(),
    name: asText(draft.name),
    handle: normalizeHandle(asText(draft.handle)),
    followers: toNullableNumber(draft.followers),
    niche: parseCsv(asText(draft.niche)),
    email: asText(draft.email),
    country: asText(draft.country),
    selectionReason: asText(draft.selectionReason),
    goodFit: !!draft.goodFit,
    influencerRateCard: asText(draft.influencerRateCard),
    platformRateCard: asText(draft.platformRateCard),
    rateCardCurrency: asText(draft.rateCardCurrency || 'USD').toUpperCase(),
    ourFeePct: toNullableNumber(draft.ourFeePct),
    shippingAddress: asText(draft.shippingAddress),
  };
}

function buildSelectionReasonPayloadFromRow(
  row: FolderItem,
  folder?: FolderResponse | null,
  currentSelectionReason = ''
) {
  const assignedCampaign = folder?.assignedCampaign || null;
  const assignedCampaignId = getAssignedCampaignId(assignedCampaign);

  return {
    folderId: folder?._id || '',
    itemId: row._id,
    folderTitle: folder?.title || '',
    folderDescription: folder?.description || '',
    assignedCampaign,

    provider: asText(row.provider).toLowerCase(),
    name: asText(row.name),
    handle: normalizeHandle(asText(row.handle)),
    followers: toNullableNumber(row.followers),
    niche: Array.isArray(row.niche) ? row.niche : [],
    email: asText(row.email),
    country: asText(row.country),
    profileLink: getProfileUrl(row),
    primaryLink: asText(row.primaryLink),
    links: Array.isArray(row.links) ? row.links : [],

    currentSelectionReason: asText(currentSelectionReason || row.selectionReason),
    selectionReason: asText(currentSelectionReason || row.selectionReason),
    goodFit: !!row.goodFit,

    influencerRateCard: asText(row.influencerRateCard),
    platformRateCard: asText(row.platformRateCard),
    rateCardCurrency: asText(row.rateCardCurrency || 'USD').toUpperCase(),
    ourFeePct: toNullableNumber(row.ourFeePct),
    shippingAddress: getShippingAddress(row),

    mediaKitAccess: row.mediaKitAccess || null,
    hasMediaKit: !!row.mediaKitAccess?.hasAdded || !!row.mediaKit?.s3Key || !!row.mediaKitLink?.url,
    mediaKitStatus: asText(row.mediaKitAccess?.requestStatus),
    mediaKitVisibleSource: asText(row.mediaKitAccess?.visibleSource),

    influencerSource: getRowInfluencerSource(row),
    createdInfluencerId: getRowInfluencerId(row),
    campaignActivation: row.campaignActivation || null,
    campaignInvitationStatus: getCampaignInvitationStatus(row, assignedCampaignId),
  };
}

function hasUsefulSelectionReasonPayload(payload: ReturnType<typeof buildSelectionReasonPayloadFromRow>) {
  return !!(
    payload.name ||
    payload.handle ||
    payload.profileLink ||
    payload.followers ||
    payload.country ||
    (Array.isArray(payload.niche) && payload.niche.length > 0) ||
    payload.influencerRateCard ||
    payload.platformRateCard ||
    payload.shippingAddress ||
    payload.folderTitle ||
    payload.folderDescription ||
    payload.assignedCampaign?.campaignTitle ||
    payload.assignedCampaign?.brandName ||
    payload.assignedCampaign?.productOrServiceName
  );
}

function buildDraftFromRow(row: FolderItem): DraftState {
  return {
    provider: row.provider || 'instagram',
    name: row.name || '',
    handle: row.handle || '',
    followers: row.followers ?? '',
    niche: Array.isArray(row.niche) ? row.niche.join(', ') : '',
    email: row.email || '',
    country: row.country || '',
    selectionReason: row.selectionReason || '',
    goodFit: !!row.goodFit,
    influencerRateCard: row.influencerRateCard || '',
    platformRateCard: row.platformRateCard || '',
    rateCardCurrency: row.rateCardCurrency || 'USD',
    ourFeePct: row.ourFeePct ?? '',
    shippingAddress: getShippingAddress(row),
  };
}

function tokenizeWords(value: string) {
  return String(value || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

function buildWordTokenDiff(previousLine = '', newLine = '') {
  const prevWords = tokenizeWords(previousLine);
  const nextWords = tokenizeWords(newLine);

  const m = prevWords.length;
  const n = nextWords.length;

  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array.from({ length: n + 1 }, () => 0)
  );

  for (let i = m - 1; i >= 0; i -= 1) {
    for (let j = n - 1; j >= 0; j -= 1) {
      if (prevWords[i] === nextWords[j]) {
        dp[i][j] = dp[i + 1][j + 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
  }

  const previousTokens: DiffToken[] = [];
  const nextTokens: DiffToken[] = [];

  let i = 0;
  let j = 0;

  while (i < m && j < n) {
    if (prevWords[i] === nextWords[j]) {
      previousTokens.push({ text: prevWords[i], changed: false });
      nextTokens.push({ text: nextWords[j], changed: false });
      i += 1;
      j += 1;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      previousTokens.push({ text: prevWords[i], changed: true });
      i += 1;
    } else {
      nextTokens.push({ text: nextWords[j], changed: true });
      j += 1;
    }
  }

  while (i < m) {
    previousTokens.push({ text: prevWords[i], changed: true });
    i += 1;
  }

  while (j < n) {
    nextTokens.push({ text: nextWords[j], changed: true });
    j += 1;
  }

  return {
    previousTokens,
    nextTokens,
    changed:
      previousTokens.some((token) => token.changed) ||
      nextTokens.some((token) => token.changed),
  };
}

function buildLineDiff(previousValue?: string, newValue?: string) {
  const prevLines = String(previousValue || '').split(/\r?\n/);
  const nextLines = String(newValue || '').split(/\r?\n/);
  const max = Math.max(prevLines.length, nextLines.length, 1);

  return Array.from({ length: max }, (_, index) =>
    buildWordTokenDiff(prevLines[index] ?? '', nextLines[index] ?? '')
  );
}

function slugifyFileName(value?: string | null) {
  const base = asText(value) || 'pitch-folder';
  return (
    base
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'pitch-folder'
  );
}

function escapeCsvCell(value: unknown) {
  const text = value === undefined || value === null ? '' : String(value);
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function buildRowsCsv(rows: FolderItem[]) {
  const headers = [
    'Provider',
    'Name',
    'Handle',
    'Followers',
    'Profile Links',
    'Niche',
    'Email',
    'Country',
    'Influencer Rate Card',
    'Platform Rate Card',
    'Shipping Address',
    'Selection Reason',
    'Media Kit Link',
    'Good Fit',
  ];

  const csvRows = rows.map((row) => [
    row.provider || '',
    row.name || '',
    row.handle || '',
    row.followers ?? '',
    getProfileUrl(row),
    Array.isArray(row.niche) ? row.niche.join(', ') : '',
    row.email || '',
    row.country || '',
    row.influencerRateCard || '',
    row.platformRateCard || '',
    getShippingAddress(row),
    row.selectionReason || '',
    row.mediaKitLink?.url || '',
    row.goodFit ? 'Yes' : 'No',
  ]);

  return [headers, ...csvRows]
    .map((line) => line.map(escapeCsvCell).join(','))
    .join('\n');
}

const SectionHeading = memo(function SectionHeading({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div>
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
          {title}
        </h2>
        {description ? (
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
});

const ProviderBadge = memo(function ProviderBadge({
  provider,
}: {
  provider?: string;
}) {
  const value = String(provider || 'instagram').toLowerCase();

  const tone =
    value === 'youtube'
      ? 'bg-red-50 text-red-700 ring-red-200'
      : value === 'instagram'
        ? 'bg-pink-50 text-pink-700 ring-pink-200'
        : 'bg-slate-100 text-slate-800 ring-slate-200';

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${tone}`}
    >
      {prettyText(value)}
    </span>
  );
});

const StatusBadge = memo(function StatusBadge({
  value,
}: {
  value?: 'none' | 'requested' | 'approved' | 'rejected';
}) {
  const tone =
    value === 'approved'
      ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
      : value === 'requested'
        ? 'bg-amber-50 text-amber-700 ring-amber-200'
        : value === 'rejected'
          ? 'bg-rose-50 text-rose-700 ring-rose-200'
          : 'bg-slate-100 text-slate-700 ring-slate-200';

  const label =
    value === 'approved'
      ? 'Approved'
      : value === 'requested'
        ? 'Requested'
        : value === 'rejected'
          ? 'Rejected'
          : 'No Request';

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${tone}`}
    >
      {label}
    </span>
  );
});

const AssetCheck = memo(function AssetCheck({
  label,
  ok,
}: {
  label: string;
  ok: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${ok
        ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
        : 'bg-rose-50 text-rose-700 ring-rose-200'
        }`}
    >
      {ok ? (
        <CheckCircle2 className="h-3.5 w-3.5" />
      ) : (
        <XCircle className="h-3.5 w-3.5" />
      )}
      {label}
    </span>
  );
});

const AccessBadge = memo(function AccessBadge({
  access,
}: {
  access?: FolderItemMediaKitAccess | null;
}) {
  if (!access?.hasAdded) {
    return (
      <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700 ring-1 ring-inset ring-slate-200">
        Not Added
      </span>
    );
  }

  if (access.allowed) {
    return (
      <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
        Allowed
      </span>
    );
  }

  if (access.requestStatus === 'requested') {
    return (
      <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700 ring-1 ring-inset ring-amber-200">
        Requested
      </span>
    );
  }

  if (access.requestStatus === 'rejected') {
    return (
      <span className="inline-flex rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-700 ring-1 ring-inset ring-rose-200">
        Rejected
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full bg-sky-50 px-2.5 py-1 text-[11px] font-semibold text-sky-700 ring-1 ring-inset ring-sky-200">
      Available on Request
    </span>
  );
});

const Field = memo(function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="space-y-2.5">
      <Label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </Label>
      {children}
      {hint ? <p className="text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
});

const Toggle = memo(function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => {
        if (!disabled) onChange(!checked);
      }}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${checked ? 'bg-teal-600' : 'bg-slate-300'
        } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${checked ? 'translate-x-5' : 'translate-x-0.5'
          }`}
      />
    </button>
  );
});

const ModalShell = memo(function ModalShell({
  open,
  title,
  description,
  onClose,
  children,
  maxWidthClass = 'max-w-5xl',
  zIndexClass = 'z-50',
}: {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
  maxWidthClass?: string;
  zIndexClass?: string;
}) {
  if (!open) return null;

return (
  <div
    className={`fixed inset-y-0 right-0 left-0 flex items-center justify-center bg-black/55 py-4 pr-4 pl-4 sm:py-5 sm:pr-5 sm:pl-5 md:left-[280px] md:pl-8 lg:py-6 lg:pr-6 lg:pl-10 ${zIndexClass}`}
  >
    <div className="absolute inset-0" onClick={onClose} />
      <div
        className={`relative z-10 flex max-h-[92vh] w-full ${maxWidthClass} flex-col overflow-hidden rounded-3xl bg-white shadow-2xl`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div>
            <h3 className="text-xl font-semibold text-slate-950">{title}</h3>
            {description ? (
              <p className="mt-1 text-sm text-slate-500">{description}</p>
            ) : null}
          </div>
          <Button variant="outline" className="rounded-xl" onClick={onClose}>
            <X className="mr-2 h-4 w-4" />
            Close
          </Button>
        </div>
        <div className="flex-1 overflow-auto px-6 py-6">{children}</div>
      </div>
    </div>
  );
});

const TabButton = memo(function TabButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl px-4 py-2 text-sm font-medium transition ${active
        ? 'bg-teal-600 text-white'
        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
        }`}
    >
      {label}
    </button>
  );
});

const RateCardPanel = memo(function RateCardPanel({
  title,
  value,
  currency,
}: {
  title: string;
  value?: string;
  currency?: string;
}) {
  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-slate-950">{title}</p>
          <Badge variant="secondary">{currency || 'USD'}</Badge>
        </div>
        <div className="mt-4 min-h-[340px] rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-7 whitespace-pre-wrap text-slate-700">
          {value || DASH}
        </div>
      </div>
    </div>
  );
});

const DiffWordLine = memo(function DiffWordLine({
  tokens,
  emptyLabel = '—',
  tone,
}: {
  tokens: DiffToken[];
  emptyLabel?: string;
  tone: 'previous' | 'next';
}) {
  const changedClasses =
    tone === 'previous'
      ? 'bg-rose-100 text-rose-900 ring-rose-200'
      : 'bg-emerald-100 text-emerald-900 ring-emerald-200';

  if (!tokens.length) {
    return <span className="text-slate-400">{emptyLabel}</span>;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {tokens.map((token, index) => (
        <span
          key={`${token.text}-${index}`}
          className={`rounded-md px-1.5 py-0.5 text-xs leading-5 ${token.changed
            ? `ring-1 ring-inset ${changedClasses}`
            : 'text-slate-700'
            }`}
        >
          {token.text}
        </span>
      ))}
    </div>
  );
});

const HistoryComparisonCard = memo(function HistoryComparisonCard({
  entry,
}: {
  entry: RateCardHistoryEntry;
}) {
  const diffRows = useMemo(
    () => buildLineDiff(entry.previousValue, entry.newValue),
    [entry.previousValue, entry.newValue]
  );

  return (
    <div className="rounded-2xl border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-slate-950">
            {entry.field === 'influencerRateCard'
              ? 'Influencer Rate Card'
              : 'Admin Rate Card'}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {formatDateTime(entry.changedAt)}
          </p>
        </div>
        <Badge variant="outline">Change Logged</Badge>
      </div>

      <div className="grid gap-4 p-4 lg:grid-cols-2">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Previous
          </p>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
            {diffRows.map((row, index) => (
              <div
                key={`prev-row-${index}`}
                className={`border-b border-slate-200 px-3 py-2 last:border-b-0 ${row.changed ? 'bg-rose-50/60' : 'bg-white'
                  }`}
              >
                <DiffWordLine
                  tokens={row.previousTokens}
                  tone="previous"
                  emptyLabel="—"
                />
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            New
          </p>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
            {diffRows.map((row, index) => (
              <div
                key={`next-row-${index}`}
                className={`border-b border-slate-200 px-3 py-2 last:border-b-0 ${row.changed ? 'bg-emerald-50/60' : 'bg-white'
                  }`}
              >
                <DiffWordLine
                  tokens={row.nextTokens}
                  tone="next"
                  emptyLabel="—"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});

type DrawerFormProps = {
  open: boolean;
  mode: DrawerMode;
  draft: DraftState;
  saving: boolean;
  onClose: () => void;
  onSave: () => void;
  onDraftFieldChange: (
    key: keyof DraftState,
    value: string | number | boolean
  ) => void;
};

const DrawerForm = memo(function DrawerForm({
  open,
  mode,
  draft,
  saving,
  onClose,
  onSave,
  onDraftFieldChange,
}: DrawerFormProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/45" onClick={onClose} />
      <div className="absolute inset-y-0 right-0 flex w-full max-w-2xl flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="text-xl font-semibold text-slate-950">
              {mode === 'create' ? 'Add Influencer' : 'Edit Influencer'}
            </h2>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Name">
                <Input
                  value={draft.name}
                  onChange={(e) => onDraftFieldChange('name', e.target.value)}
                  placeholder="Creator name"
                />
              </Field>

              <Field label="Provider">
                <select
                  value={draft.provider}
                  onChange={(e) => onDraftFieldChange('provider', e.target.value)}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="instagram">Instagram</option>
                  <option value="youtube">YouTube</option>
                  <option value="tiktok">TikTok</option>
                </select>
              </Field>

              <Field label="Handle">
                <Input
                  value={draft.handle}
                  onChange={(e) => onDraftFieldChange('handle', e.target.value)}
                  placeholder="@creator"
                />
              </Field>

              <Field label="Followers">
                <Input
                  type="number"
                  value={draft.followers}
                  onChange={(e) => onDraftFieldChange('followers', e.target.value)}
                  placeholder="150000"
                />
              </Field>

              <Field label="Niche" hint="Comma separated values">
                <Input
                  value={draft.niche}
                  onChange={(e) => onDraftFieldChange('niche', e.target.value)}
                  placeholder="beauty, fashion, lifestyle"
                />
              </Field>

              <Field label="Email">
                <Input
                  value={draft.email}
                  onChange={(e) => onDraftFieldChange('email', e.target.value)}
                  placeholder="creator@email.com"
                />
              </Field>

              <Field label="Country">
                <Input
                  value={draft.country}
                  onChange={(e) => onDraftFieldChange('country', e.target.value)}
                  placeholder="United States"
                />
              </Field>
            </div>

            <Field
              label="Selection Reason"
              hint="Use the table row AI button after adding, or write/edit the reason manually here."
            >
              <Textarea
                value={draft.selectionReason}
                onChange={(e) =>
                  onDraftFieldChange('selectionReason', e.target.value)
                }
                rows={4}
                placeholder="Why this creator is included in the pitch"
              />
            </Field>

            <div className="grid gap-4 xl:grid-cols-2">
              <Field
                label="Influencer Rate Card"
                hint="Exact rate card received from the influencer."
              >
                <Textarea
                  value={draft.influencerRateCard}
                  onChange={(e) =>
                    onDraftFieldChange('influencerRateCard', e.target.value)
                  }
                  rows={12}
                />
              </Field>

              <Field
                label="Platform Rate Card"
                hint="Edited rate card that we show on behalf of the influencer."
              >
                <Textarea
                  value={draft.platformRateCard}
                  onChange={(e) =>
                    onDraftFieldChange('platformRateCard', e.target.value)
                  }
                  rows={12}
                />
              </Field>
            </div>

            <Field label="Shipping Address">
              <Textarea
                value={draft.shippingAddress}
                onChange={(e) =>
                  onDraftFieldChange('shippingAddress', e.target.value)
                }
                rows={4}
                placeholder="Shipping address"
              />
            </Field>
          </div>
        </div>

        <div className="border-t border-slate-200 px-6 py-4">
          <div className="flex justify-end gap-2">
            <Button variant="outline" className="rounded-xl" onClick={onClose}>
              Cancel
            </Button>
            <Button className="rounded-xl" onClick={onSave} disabled={saving}>
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {mode === 'create' ? 'Save Influencer' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
});

type PdfViewerModalProps = {
  open: boolean;
  title: string;
  url: string;
  onClose: () => void;
};

const PdfViewerModal = memo(function PdfViewerModal({
  open,
  title,
  url,
  onClose,
}: PdfViewerModalProps) {
  return (
    <ModalShell
      open={open}
      title={title || 'Media Kit PDF'}
      description="Previewing uploaded Media Kit PDF"
      onClose={onClose}
      maxWidthClass="max-w-7xl"
      zIndexClass="z-[80]"
    >
      <div className="mb-4 flex justify-end">
        <Button
          variant="outline"
          className="rounded-xl"
          onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}
        >
          <ExternalLink className="mr-2 h-4 w-4" />
          Open in New Tab
        </Button>
      </div>
      <div className="h-[70vh] rounded-2xl border border-slate-200 bg-slate-100 p-3">
        <iframe
          src={url}
          title={title || 'Media Kit PDF Preview'}
          className="h-full w-full rounded-2xl border border-slate-200 bg-white"
        />
      </div>
    </ModalShell>
  );
});

type RateCardModalProps = {
  item: FolderItem | null;
  tab: RateCardTab;
  onClose: () => void;
  onTabChange: (tab: RateCardTab) => void;
};

const RateCardModal = memo(function RateCardModal({
  item,
  tab,
  onClose,
  onTabChange,
}: RateCardModalProps) {
  const rateCardHistory = useMemo(() => {
    if (!item) return [];
    return [...(item.rateCardHistory || [])].sort((a, b) => {
      const aTime = a.changedAt ? new Date(a.changedAt).getTime() : 0;
      const bTime = b.changedAt ? new Date(b.changedAt).getTime() : 0;
      return bTime - aTime;
    });
  }, [item]);

  return (
<ModalShell
  open={!!item}
  title={item ? `${item.name || 'Influencer'} - Rate Cards` : 'Rate Cards'}
  description="Review influencer rate card, admin rate card, and change history."
  onClose={onClose}
  maxWidthClass="max-w-6xl"
  zIndexClass="z-[70]"
>
      {item ? (
        <div className="space-y-5">
          <div className="flex flex-wrap gap-2">
            <TabButton
              active={tab === 'influencer'}
              label="Influencer"
              onClick={() => onTabChange('influencer')}
            />
            <TabButton
              active={tab === 'admin'}
              label="Admin"
              onClick={() => onTabChange('admin')}
            />
            <TabButton
              active={tab === 'history'}
              label="History"
              onClick={() => onTabChange('history')}
            />
          </div>

          {tab === 'influencer' ? (
            <RateCardPanel
              title="Influencer Rate Card"
              value={item.influencerRateCard}
              currency={item.rateCardCurrency}
            />
          ) : null}

          {tab === 'admin' ? (
            <RateCardPanel
              title="Admin / Platform Rate Card"
              value={item.platformRateCard}
              currency={item.rateCardCurrency}
            />
          ) : null}

          {tab === 'history' ? (
            <div className="space-y-4">
              {rateCardHistory.length ? (
                rateCardHistory.map((entry) => (
                  <HistoryComparisonCard
                    key={entry._id || `${entry.changedAt}-${entry.field}`}
                    entry={entry}
                  />
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center text-sm text-slate-500">
                  No rate card history available yet.
                </div>
              )}
            </div>
          ) : null}
        </div>
      ) : null}
    </ModalShell>
  );
});

type LiveVideoModalProps = {
  item: FolderItem | null;
  submitting: boolean;
  link: string;
  onClose: () => void;
  onSubmit: (videoUrl: string) => Promise<void>;
  onCopyLink: (url: string) => Promise<void>;
};

const LiveVideoModal = memo(function LiveVideoModal({
  item,
  submitting,
  link,
  onClose,
  onSubmit,
  onCopyLink,
}: LiveVideoModalProps) {
  const [videoUrl, setVideoUrl] = useState('');

  useEffect(() => {
    if (item) setVideoUrl('');
  }, [item]);

  return (
    <ModalShell
      open={!!item}
      title={item ? `${item.name || 'Influencer'} - Live Video URL` : 'Live Video URL'}
      description="Attach the live YouTube video for this campaign to start tracking a public performance report."
      onClose={onClose}
      maxWidthClass="max-w-lg"
      zIndexClass="z-[70]"
    >
      {item ? (
        <div className="space-y-4">
          {link ? (
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700">Public campaign report link:</p>
              <div className="flex items-center gap-2 rounded-xl border border-teal-200 bg-teal-50 p-3">
                <span className="flex-1 truncate text-sm text-teal-700">{link}</span>
                <Button size="sm" className="rounded-lg bg-teal-600 text-white hover:bg-teal-700" onClick={() => onCopyLink(link)}>
                  Copy
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">YouTube video URL</label>
              <input
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              />
              <Button
                className="w-full rounded-xl bg-teal-600 text-white hover:bg-teal-700"
                disabled={!videoUrl.trim() || submitting}
                onClick={() => onSubmit(videoUrl.trim())}
              >
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Create Campaign Report
              </Button>
            </div>
          )}
        </div>
      ) : null}
    </ModalShell>
  );
});

type MediaKitModalProps = {
  item: FolderItem | null;
  actionLoadingKey: string;
  onClose: () => void;
  onGenerateLink: (row: FolderItem) => Promise<void>;
  onPickPdf: (itemId: string) => void;
  onToggleLink: (row: FolderItem, nextValue: boolean) => Promise<void>;
  onTogglePdf: (row: FolderItem, nextValue: boolean) => Promise<void>;
  onCopyLink: (url: string) => Promise<void>;
  onOpenPdf: (row: FolderItem) => void;
  onRemovePdf: (itemId: string) => Promise<void>;
};

const MediaKitModal = memo(function MediaKitModal({
  item,
  actionLoadingKey,
  onClose,
  onGenerateLink,
  onPickPdf,
  onToggleLink,
  onTogglePdf,
  onCopyLink,
  onOpenPdf,
  onRemovePdf,
}: MediaKitModalProps) {
  if (!item) return null;

  const hasLink = !!asText(item.mediaKitLink?.url);
  const hasPdf = !!asText(item.mediaKit?.s3Key);
  const access = item.mediaKitAccess;
  const visibleSourceLabel =
    access?.visibleSource === 'pdf'
      ? 'PDF'
      : access?.visibleSource === 'link'
        ? 'Link'
        : DASH;

  return (
    <ModalShell
      open={!!item}
      title={`${item.name || 'Influencer'} - Media Kit`}
      description="Manage link, PDF, and the single brand-facing media kit access state."
      onClose={onClose}
      maxWidthClass="max-w-4xl"
      zIndexClass="z-[60]"
    >
      <div className="space-y-5">
        <div className="rounded-3xl border border-slate-200 bg-white shadow-none">
          <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-lg font-semibold text-slate-950">
                Media Kit Center
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Generate link, upload PDF, preview files, and switch the visible
                brand source.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => onGenerateLink(item)}
                disabled={actionLoadingKey === `link-generate:${item._id}`}
              >
                {actionLoadingKey === `link-generate:${item._id}` ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Link2 className="mr-2 h-4 w-4" />
                )}
                Get Media Kit Link
              </Button>

              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => onPickPdf(item._id)}
                disabled={actionLoadingKey === `pdf-upload:${item._id}`}
              >
                {actionLoadingKey === `pdf-upload:${item._id}` ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <UploadCloud className="mr-2 h-4 w-4" />
                )}
                Upload PDF
              </Button>
            </div>
          </div>

          <div className="space-y-5 px-5 py-5">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-950">
                    Media Kit Link
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Generated profile/media kit link for this creator.
                  </p>
                </div>
                <StatusBadge value={item.mediaKitLink?.requestStatus} />
              </div>

              {hasLink ? (
                <div className="mt-4 space-y-4">
                  <div className="rounded-xl border border-slate-200 bg-white p-3">
                    <a
                      href={asText(item.mediaKitLink?.url)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Open Link
                    </a>
                    <p className="mt-2 break-all text-xs text-slate-500">
                      {asText(item.mediaKitLink?.url)}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                      Generated: {formatDateTime(item.mediaKitLink?.generatedAt)}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-slate-950">
                        Show Link To Brand
                      </p>
                      <p className="text-xs text-slate-500">
                        Turning this on will make Link the only visible source.
                      </p>
                    </div>
                    <Toggle
                      checked={!!item.mediaKitLink?.showToBrand}
                      onChange={(next) => onToggleLink(item, next)}
                      disabled={actionLoadingKey === `link-toggle:${item._id}`}
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-xl"
                      onClick={() => onCopyLink(asText(item.mediaKitLink?.url))}
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Copy Link
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-500">
                  No Media Kit Link generated yet.
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-950">
                    Media Kit PDF
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Upload and manage the PDF version for the brand.
                  </p>
                </div>
                <StatusBadge value={item.mediaKit?.requestStatus} />
              </div>

              {hasPdf ? (
                <div className="mt-4 space-y-4">
                  <div className="rounded-xl border border-slate-200 bg-white p-3">
                    <button
                      type="button"
                      onClick={() => onOpenPdf(item)}
                      className="inline-flex items-center gap-1 text-sm font-medium text-teal-600 hover:underline"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      {item.mediaKit?.fileName || 'View PDF'}
                    </button>
                    <p className="mt-2 text-xs text-slate-500">
                      Uploaded: {formatDateTime(item.mediaKit?.uploadedAt)}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-slate-950">
                        Show PDF To Brand
                      </p>
                      <p className="text-xs text-slate-500">
                        Turning this on will make PDF the only visible source.
                      </p>
                    </div>
                    <Toggle
                      checked={!!item.mediaKit?.showToBrand}
                      onChange={(next) => onTogglePdf(item, next)}
                      disabled={actionLoadingKey === `pdf-toggle:${item._id}`}
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-xl"
                      onClick={() => onOpenPdf(item)}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      View PDF
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-xl text-rose-600 hover:text-rose-700"
                      onClick={() => onRemovePdf(item._id)}
                      disabled={actionLoadingKey === `pdf-remove:${item._id}`}
                    >
                      {actionLoadingKey === `pdf-remove:${item._id}` ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="mr-2 h-4 w-4" />
                      )}
                      Remove PDF
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-500">
                  No Media Kit PDF uploaded yet.
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-semibold text-slate-950">
                Current Brand Source
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Visible source:{' '}
                <span className="font-medium">{visibleSourceLabel}</span>
              </p>
              <div className="mt-3">
                <AccessBadge access={access} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </ModalShell>
  );
});

type BrandViewSettingsModalProps = {
  open: boolean;
  onClose: () => void;
  shareUrl: string;
  totalItems: number;
  sharedCountPreview: number;
  showFullListToBrand: boolean;
  setShowFullListToBrand: React.Dispatch<React.SetStateAction<boolean>>;
  folderBrandCount: string;
  setFolderBrandCount: React.Dispatch<React.SetStateAction<string>>;
  savingFolderConfig: boolean;
  onSave: () => Promise<void>;
};

const BrandViewSettingsModal = memo(function BrandViewSettingsModal({
  open,
  onClose,
  shareUrl,
  totalItems,
  sharedCountPreview,
  showFullListToBrand,
  setShowFullListToBrand,
  folderBrandCount,
  setFolderBrandCount,
  savingFolderConfig,
  onSave,
}: BrandViewSettingsModalProps) {
  return (
    <ModalShell
      open={open}
      title="Brand View Settings"
      description="Control how this folder appears on the shared brand-facing page."
      onClose={onClose}
      maxWidthClass="max-w-2xl"
      zIndexClass="z-[55]"
    >
      <div className="space-y-5">
        <Field label="Share Link">
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm break-all text-slate-700">
            {shareUrl || DASH}
          </div>
        </Field>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-950">
                Show Full Influencer List To Brand
              </p>
              <p className="text-xs text-slate-500">
                When enabled, the full influencer list is visible on the shared
                page.
              </p>
            </div>
            <Toggle
              checked={showFullListToBrand}
              onChange={(next) => {
                setShowFullListToBrand(next);
                if (next) {
                  setFolderBrandCount('');
                }
              }}
            />
          </div>
        </div>

        <Field
          label="Brand Visible Count"
          hint={
            showFullListToBrand
              ? 'Disabled because full list is enabled.'
              : `Leave blank to auto use ${totalItems}`
          }
        >
          <Input
            type="number"
            min={0}
            value={showFullListToBrand ? '' : folderBrandCount}
            onChange={(e) => setFolderBrandCount(e.target.value)}
            placeholder={
              showFullListToBrand
                ? 'Disabled while full list is enabled'
                : `Leave blank to auto use ${totalItems}`
            }
            disabled={showFullListToBrand}
          />
        </Field>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
          <p>
            Current preview:
            <span className="ml-2 font-semibold text-slate-950">
              {sharedCountPreview}
            </span>
          </p>
          <p className="mt-1">
            Brand list mode:
            <span className="ml-2 font-semibold text-slate-950">
              {showFullListToBrand ? 'Full list visible' : 'Count only'}
            </span>
          </p>
        </div>

        <div className="flex justify-end">
          <Button
            className="rounded-xl"
            onClick={onSave}
            disabled={savingFolderConfig}
          >
            {savingFolderConfig ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Brand Settings
          </Button>
        </div>
      </div>
    </ModalShell>
  );
});

type MoveItemsModalProps = {
  open: boolean;
  onClose: () => void;
  folders: FolderListItem[];
  selectedCount: number;
  destinationFolderId: string;
  setDestinationFolderId: React.Dispatch<React.SetStateAction<string>>;
  transferMode: TransferMode;
  setTransferMode: React.Dispatch<React.SetStateAction<TransferMode>>;
  moving: boolean;
  onSubmit: () => Promise<void>;
};

const MoveItemsModal = memo(function MoveItemsModal({
  open,
  onClose,
  folders,
  selectedCount,
  destinationFolderId,
  setDestinationFolderId,
  transferMode,
  setTransferMode,
  moving,
  onSubmit,
}: MoveItemsModalProps) {
  const actionLabel = transferMode === 'copy' ? 'Copy' : 'Move';

  return (
    <ModalShell
      open={open}
      title="Transfer To Another Folder"
      description={`${actionLabel} ${selectedCount} selected influencer${selectedCount === 1 ? '' : 's'
        } to another folder.`}
      onClose={onClose}
      maxWidthClass="max-w-xl"
      zIndexClass="z-[58]"
    >
      <div className="space-y-5">
        <Field label="Action">
          <select
            value={transferMode}
            onChange={(e) => setTransferMode(e.target.value as TransferMode)}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="move">Direct Move</option>
            <option value="copy">Copy & Move to another folder</option>
          </select>
        </Field>

        <Field label="Destination Folder">
          <select
            value={destinationFolderId}
            onChange={(e) => setDestinationFolderId(e.target.value)}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">Select destination folder</option>
            {folders.map((folder) => (
              <option key={folder._id} value={folder._id}>
                {folder.title}
              </option>
            ))}
          </select>
        </Field>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          <p>
            Selected influencers:{' '}
            <span className="font-semibold text-slate-950">{selectedCount}</span>
          </p>
          <p className="mt-2">
            Action:{' '}
            <span className="font-semibold text-slate-950">{actionLabel}</span>
          </p>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" className="rounded-xl" onClick={onClose}>
            Cancel
          </Button>

          <Button className="rounded-xl" onClick={onSubmit} disabled={moving}>
            {moving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <ArrowRightLeft className="mr-2 h-4 w-4" />
            )}
            {actionLabel} Selected
          </Button>
        </div>
      </div>
    </ModalShell>
  );
});

type InfluencerTableRowProps = {
  row: FolderItem;
  selected: boolean;
  isLinkToggleLoading: boolean;
  isPdfToggleLoading: boolean;
  onToggleSelected: (itemId: string) => void;
  onOpenRateCard: (itemId: string) => void;
  onOpenMediaKit: (itemId: string) => void;
  onToggleLink: (row: FolderItem, nextValue: boolean) => Promise<void>;
  onTogglePdf: (row: FolderItem, nextValue: boolean) => Promise<void>;
  onCreateInfluencer: (row: FolderItem) => Promise<void>;
  onActivateOnCampaign: (row: FolderItem) => Promise<void>;
  onSendCampaignInvitation: (row: FolderItem) => Promise<void>;
  onSetLiveVideoUrl: (itemId: string) => void;
  onGenerateSelectionReason: (row: FolderItem, currentReason: string) => Promise<string>;
  onSaveSelectionReason: (row: FolderItem, selectionReason: string) => Promise<void>;
  onEdit: (row: FolderItem) => void;
  onDelete: (itemId: string) => Promise<void>;
  assignedCampaign?: AssignedCampaign | null;
  isCreateInfluencerLoading: boolean;
  isActivateCampaignLoading: boolean;
  isCampaignInvitationLoading: boolean;
  isSelectionReasonGenerating: boolean;
  isSelectionReasonSaving: boolean;
};

const InfluencerTableRowMemo = memo(function InfluencerTableRow({
  row,
  selected,
  isLinkToggleLoading,
  isPdfToggleLoading,
  onToggleSelected,
  onOpenRateCard,
  onOpenMediaKit,
  onToggleLink,
  onTogglePdf,
  onCreateInfluencer,
  onActivateOnCampaign,
  onSendCampaignInvitation,
  onSetLiveVideoUrl,
  onGenerateSelectionReason,
  onSaveSelectionReason,
  onEdit,
  onDelete,
  assignedCampaign,
  isCreateInfluencerLoading,
  isActivateCampaignLoading,
  isCampaignInvitationLoading,
  isSelectionReasonGenerating,
  isSelectionReasonSaving,
}: InfluencerTableRowProps) {
  const hasLink = !!asText(row.mediaKitLink?.url);
  const hasPdf = !!asText(row.mediaKit?.s3Key);
  const access = row.mediaKitAccess;
  const profileUrl = getProfileUrl(row);
  const influencerLinked = !!getRowInfluencerId(row);
  const assignedCampaignId = getAssignedCampaignId(assignedCampaign);
  const hasAssignedCampaign = !!assignedCampaignId;
  const isGoodFit = isRowGoodFit(row);
  const hasCreateInfluencerRequiredFields = !!asText(row.name) && !!asText(row.email);
  const canCreateInfluencer = isGoodFit && hasAssignedCampaign && hasCreateInfluencerRequiredFields;
  const influencerSource = getRowInfluencerSource(row);
  const isSelfCreatedInfluencer = influencerSource === 'self';
  const isActiveOnCampaign = row.campaignActivation?.active === true;
  const campaignInvitationStatus = getCampaignInvitationStatus(row, assignedCampaignId);
  const campaignInvitationSent = ['sent', 'accepted', 'reject', 'failed'].includes(campaignInvitationStatus);
  const canActivateOnCampaign = isGoodFit && hasAssignedCampaign && influencerLinked && !isActiveOnCampaign;
  const canSendCampaignInvitation =
    isGoodFit && hasAssignedCampaign && influencerLinked && isSelfCreatedInfluencer && !campaignInvitationSent;
  const [selectionReasonDraft, setSelectionReasonDraft] = useState(asText(row.selectionReason));

  useEffect(() => {
    setSelectionReasonDraft(asText(row.selectionReason));
  }, [row._id, row.selectionReason]);

  const selectionReasonChanged =
    selectionReasonDraft.trim() !== asText(row.selectionReason).trim();

  const visibleSource =
    access?.visibleSource === 'pdf'
      ? 'PDF'
      : access?.visibleSource === 'link'
        ? 'Link'
        : DASH;

  return (
    <TableRow className="border-slate-200">
      <TableCell className="align-top">
        <div className="flex justify-center pt-1">
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onToggleSelected(row._id)}
            className="h-4 w-4 rounded border-slate-300"
          />
        </div>
      </TableCell>

      <TableCell className="align-top">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-slate-950">{row.name || DASH}</p>
            <ProviderBadge provider={row.provider} />
          </div>
          <p className="text-sm text-slate-500">{row.handle || DASH}</p>
          <div className="inline-flex items-center gap-2 text-xs text-slate-500">
            <Mail className="h-3.5 w-3.5" />
            <span>{row.email || DASH}</span>
          </div>
        </div>
      </TableCell>

      <TableCell className="align-top">
        {profileUrl ? (
          <a
            href={profileUrl}
            target="_blank"
            rel="noreferrer"
            title={profileUrl}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <ExternalLink className="h-4 w-4 shrink-0" />
            <span>Profile Link</span>
          </a>
        ) : (
          <span className="text-sm text-slate-400">{DASH}</span>
        )}
      </TableCell>

      <TableCell className="align-top text-sm text-slate-700">
        <div className="max-w-[220px] whitespace-pre-wrap break-words">
          {Array.isArray(row.niche) && row.niche.length
            ? row.niche.join(', ')
            : DASH}
        </div>
      </TableCell>

      <TableCell className="align-top text-sm text-slate-700">
        {row.country || DASH}
      </TableCell>

      <TableCell className="align-top text-sm text-slate-700">
        <div className="min-w-[360px] max-w-[460px] space-y-2">
          <Textarea
            value={selectionReasonDraft}
            onChange={(e) => setSelectionReasonDraft(e.target.value)}
            rows={7}
            placeholder="Add or generate a detailed selection reason"
            className="max-h-[250px] resize-y rounded-2xl bg-white text-sm leading-6"
          />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="rounded-xl"
                onClick={() => {
                  void (async () => {
                    const generated = await onGenerateSelectionReason(
                      row,
                      selectionReasonDraft
                    );
                    if (asText(generated)) {
                      setSelectionReasonDraft(generated);
                    }
                  })();
                }}
                disabled={isSelectionReasonGenerating || isSelectionReasonSaving}
              >
                {isSelectionReasonGenerating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                AI Reason
              </Button>
              <Button
                type="button"
                size="sm"
                className="rounded-xl"
                onClick={() => {
                  void onSaveSelectionReason(row, selectionReasonDraft);
                }}
                disabled={
                  isSelectionReasonGenerating ||
                  isSelectionReasonSaving ||
                  !selectionReasonChanged
                }
              >
                {isSelectionReasonSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save
              </Button>
            </div>
          </div>
        </div>
      </TableCell>

      <TableCell className="align-top text-sm text-slate-700">
        <div className="max-w-[260px] whitespace-pre-wrap break-words leading-6">
          {getShippingAddress(row) || DASH}
        </div>
      </TableCell>

      <TableCell className="align-top text-sm font-medium text-slate-800">
        {formatNumber(row.followers)}
      </TableCell>

      <TableCell className="align-top">
        <Button
          size="sm"
          variant="outline"
          className="rounded-xl"
          onClick={() => onOpenRateCard(row._id)}
        >
          <FileText className="mr-2 h-4 w-4" />
          Open
        </Button>
      </TableCell>

      <TableCell className="align-top">
        <div className="min-w-[320px] rounded-2xl border border-slate-200 bg-slate-50 p-3">
          <div className="mb-3 flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-slate-950">
                Media Kit Access
              </p>
              <p className="mt-1 text-[11px] text-slate-500">
                Source: {visibleSource}
              </p>
            </div>
            <AccessBadge access={access} />
          </div>

          <div className="mb-3 grid gap-2 rounded-xl bg-white p-3 text-xs text-slate-600">
            <div className="flex items-center justify-between">
              <span>Requested At</span>
              <span className="font-medium text-slate-900">
                {formatDateTime(access?.requestedAt)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Request Status</span>
              <StatusBadge value={access?.requestStatus} />
            </div>
          </div>

          <div className="mb-3 flex justify-end">
            <Button
              size="sm"
              variant="outline"
              className="rounded-xl"
              onClick={() => onOpenMediaKit(row._id)}
            >
              <Eye className="mr-2 h-4 w-4" />
              Manage
            </Button>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between rounded-xl bg-white px-3 py-2">
              <div className="flex items-center gap-2">
                <AssetCheck label="Link" ok={hasLink} />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-medium text-slate-500">
                  Brand
                </span>
                <Toggle
                  checked={!!row.mediaKitLink?.showToBrand}
                  onChange={(next) => onToggleLink(row, next)}
                  disabled={!hasLink || isLinkToggleLoading}
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-white px-3 py-2">
              <div className="flex items-center gap-2">
                <AssetCheck label="PDF" ok={hasPdf} />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-medium text-slate-500">
                  Brand
                </span>
                <Toggle
                  checked={!!row.mediaKit?.showToBrand}
                  onChange={(next) => onTogglePdf(row, next)}
                  disabled={!hasPdf || isPdfToggleLoading}
                />
              </div>
            </div>
          </div>
        </div>
      </TableCell>

      <TableCell className="align-top text-center">
        <div className="flex justify-center">
          <div
            className={`inline-flex h-9 w-9 items-center justify-center rounded-full border ${row.goodFit
              ? 'border-rose-200 bg-rose-50'
              : 'border-slate-200 bg-slate-50'
              }`}
            title={row.goodFit ? 'Good Fit' : 'Not Marked'}
          >
            <Heart
              className={`h-5 w-5 ${row.goodFit
                ? 'fill-rose-500 text-rose-500'
                : 'text-slate-300'
                }`}
            />
          </div>
        </div>
      </TableCell>

      <TableCell className="align-top text-right">
        <div className="flex justify-end gap-2">
          {influencerLinked ? (
            <Badge
              variant="outline"
              className="rounded-full border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-700"
              title="Influencer already created / linked"
            >
              <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
              Already Created
            </Badge>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="rounded-xl"
              disabled={!canCreateInfluencer || isCreateInfluencerLoading}
              title={
                !isGoodFit
                  ? 'Mark this influencer as Good Fit first, then create influencer'
                  : !hasAssignedCampaign
                    ? 'Assign a campaign to this pitch folder first, then create influencer'
                    : !hasCreateInfluencerRequiredFields
                      ? 'Name and email are required to create influencer'
                      : 'Create influencer account from this pitch folder row'
              }
              onClick={() => onCreateInfluencer(row)}
            >
              {isCreateInfluencerLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="mr-2 h-4 w-4" />
              )}
              Create Influencer
            </Button>
          )}

          {hasAssignedCampaign ? (
            isSelfCreatedInfluencer ? (
              campaignInvitationSent ? (
                <Badge
                  variant="outline"
                  className="rounded-full border-blue-200 bg-blue-50 px-3 py-1 text-blue-700"
                  title="Campaign invitation already exists for this creator"
                >
                  <Mail className="mr-1.5 h-3.5 w-3.5" />
                  {campaignInvitationStatus === 'accepted'
                    ? 'Invitation Accepted'
                    : campaignInvitationStatus === 'reject'
                      ? 'Invitation Rejected'
                      : campaignInvitationStatus === 'failed'
                        ? 'Invitation Failed'
                        : 'Invitation Sent'}
                </Badge>
              ) : (
                <Button
                  size="sm"
                  className="rounded-xl bg-teal-600 text-white hover:bg-teal-700"
                  disabled={!canSendCampaignInvitation || isCampaignInvitationLoading}
                  title={
                    !isGoodFit
                      ? 'Mark this influencer as Good Fit first, then send campaign invitation'
                      : !influencerLinked
                        ? 'Create/link influencer first, then send campaign invitation'
                        : 'Send campaign invitation to this self-created influencer'
                  }
                  onClick={() => onSendCampaignInvitation(row)}
                >
                  {isCampaignInvitationLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Mail className="mr-2 h-4 w-4" />
                  )}
                  Send Campaign Invitation
                </Button>
              )
            ) : isActiveOnCampaign ? (
              <>
                <Badge
                  variant="outline"
                  className="rounded-full border-slate-900 bg-slate-900 px-3 py-1 text-white"
                  title="Influencer is already active on the assigned campaign"
                >
                  <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                  Already Active
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-xl border-teal-200 text-teal-700 hover:bg-teal-50"
                  onClick={() => onSetLiveVideoUrl(row._id)}
                  title="Attach the live YouTube video and generate a public campaign performance report"
                >
                  <Link2 className="mr-2 h-4 w-4" />
                  Set Live Video URL
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                className="rounded-xl bg-teal-600 text-white hover:bg-teal-700"
                disabled={!canActivateOnCampaign || isActivateCampaignLoading}
                title={
                  !isGoodFit
                    ? 'Mark this influencer as Good Fit first, then activate on campaign'
                    : !influencerLinked
                      ? 'Create/link influencer first, then activate on campaign'
                      : influencerSource === 'unknown'
                        ? 'Creator source is not confirmed yet. Admin-created creators can be activated directly.'
                        : 'Activate this admin-created influencer on the assigned campaign'
                }
                onClick={() => onActivateOnCampaign(row)}
              >
                {isActivateCampaignLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                )}
                Active on Campaign
              </Button>
            )
          ) : null}

          <Button
            size="sm"
            variant="outline"
            className="rounded-xl"
            onClick={() => onEdit(row)}
          >
            <PencilLine className="mr-2 h-4 w-4" />
            Edit
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="rounded-xl text-rose-600 hover:text-rose-700"
            onClick={() => onDelete(row._id)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
});

type InfluencerTableProps = {
  loading: boolean;
  rows: FolderItem[];
  selectedItemIds: string[];
  selectedCount: number;
  allVisibleSelected: boolean;
  onToggleSelectAll: () => void;
  onToggleSelected: (itemId: string) => void;
  onOpenMoveModal: () => void;
  onClearSelection: () => void;
  onOpenCreateDrawer: () => void;
  onDownloadCsv: () => void;
  onOpenRateCard: (itemId: string) => void;
  onOpenMediaKit: (itemId: string) => void;
  onToggleLink: (row: FolderItem, nextValue: boolean) => Promise<void>;
  onTogglePdf: (row: FolderItem, nextValue: boolean) => Promise<void>;
  onCreateInfluencer: (row: FolderItem) => Promise<void>;
  onActivateOnCampaign: (row: FolderItem) => Promise<void>;
  onSendCampaignInvitation: (row: FolderItem) => Promise<void>;
  onSetLiveVideoUrl: (itemId: string) => void;
  onGenerateSelectionReason: (row: FolderItem, currentReason: string) => Promise<string>;
  onSaveSelectionReason: (row: FolderItem, selectionReason: string) => Promise<void>;
  onEdit: (row: FolderItem) => void;
  onDelete: (itemId: string) => Promise<void>;
  onGoToYoutube: () => void;
  assignedCampaign?: AssignedCampaign | null;
  linkToggleItemId: string;
  pdfToggleItemId: string;
  creatingInfluencerItemId: string;
  activatingCampaignItemId: string;
  campaignInvitationItemId: string;
  actionLoadingKey: string;
};

const InfluencerTableSection = memo(function InfluencerTableSection({
  loading,
  rows,
  selectedItemIds,
  selectedCount,
  allVisibleSelected,
  onToggleSelectAll,
  onToggleSelected,
  onOpenMoveModal,
  onClearSelection,
  onOpenCreateDrawer,
  onDownloadCsv,
  onOpenRateCard,
  onOpenMediaKit,
  onToggleLink,
  onTogglePdf,
  onCreateInfluencer,
  onActivateOnCampaign,
  onSendCampaignInvitation,
  onSetLiveVideoUrl,
  onGenerateSelectionReason,
  onSaveSelectionReason,
  onEdit,
  onDelete,
  onGoToYoutube,
  assignedCampaign,
  linkToggleItemId,
  pdfToggleItemId,
  creatingInfluencerItemId,
  activatingCampaignItemId,
  campaignInvitationItemId,
  actionLoadingKey,
}: InfluencerTableProps) {
  return (
    <Card className="rounded-2xl border border-slate-200 shadow-none">
      <CardHeader className="border-b border-slate-200 pb-5">
        <SectionHeading
          eyebrow="Workspace"
          title="Influencer Management"
          description="Manage creators, rate cards, media kit access, and folder-level actions in one clean table."
          actions={
            <>
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={onOpenCreateDrawer}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Influencer
              </Button>

              <Button
                variant="outline"
                className="rounded-xl"
                onClick={onGoToYoutube}
              >
                <Youtube className="mr-2 h-4 w-4" />
                Add from YouTube
              </Button>

              <Button
                variant="outline"
                className="rounded-xl"
                onClick={onDownloadCsv}
              >
                <Download className="mr-2 h-4 w-4" />
                Download CSV
              </Button>
            </>
          }
        />
      </CardHeader>

      <CardContent className="p-0">
        {selectedCount > 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-6 py-4">
            <p className="text-sm font-medium text-slate-700">
              {selectedCount} influencer{selectedCount === 1 ? '' : 's'} selected
            </p>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={onClearSelection}
              >
                Clear Selection
              </Button>

              <Button className="rounded-xl" onClick={onOpenMoveModal}>
                <ArrowRightLeft className="mr-2 h-4 w-4" />
                Copy / Move
              </Button>
            </div>
          </div>
        ) : null}

        {loading ? (
          <div className="space-y-3 p-6">
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-14 w-full rounded-xl" />
          </div>
        ) : !rows.length ? (
          <div className="p-8">
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-12 text-center">
              <p className="text-sm font-medium text-slate-700">
                No influencers found in this folder.
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Add a creator manually or import from YouTube.
              </p>
              <div className="mt-4 flex justify-center gap-2">
                <Button className="rounded-xl" onClick={onOpenCreateDrawer}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Influencer
                </Button>
                <Button
                  variant="outline"
                  className="rounded-xl"
                  onClick={onGoToYoutube}
                >
                  <Youtube className="mr-2 h-4 w-4" />
                  Add from YouTube
                </Button>
                <Button
                  variant="outline"
                  className="rounded-xl"
                  onClick={onDownloadCsv}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download CSV
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <div className="min-w-[2040px]">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-200">
                    <TableHead className="w-[56px]">
                      <div className="flex justify-center">
                        <input
                          type="checkbox"
                          checked={allVisibleSelected}
                          onChange={onToggleSelectAll}
                          className="h-4 w-4 rounded border-slate-300"
                        />
                      </div>
                    </TableHead>
                    <TableHead>Influencer</TableHead>
                    <TableHead>Profile</TableHead>
                    <TableHead>Niche</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead>Selection Reason</TableHead>
                    <TableHead>Shipping Address</TableHead>
                    <TableHead>Followers</TableHead>
                    <TableHead>Rate Cards</TableHead>
                    <TableHead>Media Kit Access</TableHead>
                    <TableHead className="text-center">Fit</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {rows.map((row) => (
                    <InfluencerTableRowMemo
                      key={row._id}
                      row={row}
                      selected={selectedItemIds.includes(row._id)}
                      isLinkToggleLoading={linkToggleItemId === row._id}
                      isPdfToggleLoading={pdfToggleItemId === row._id}
                      onToggleSelected={onToggleSelected}
                      onOpenRateCard={onOpenRateCard}
                      onOpenMediaKit={onOpenMediaKit}
                      onToggleLink={onToggleLink}
                      onTogglePdf={onTogglePdf}
                      onCreateInfluencer={onCreateInfluencer}
                      onActivateOnCampaign={onActivateOnCampaign}
                      onSendCampaignInvitation={onSendCampaignInvitation}
                      onSetLiveVideoUrl={onSetLiveVideoUrl}
                      onGenerateSelectionReason={onGenerateSelectionReason}
                      onSaveSelectionReason={onSaveSelectionReason}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      assignedCampaign={assignedCampaign}
                      isCreateInfluencerLoading={creatingInfluencerItemId === row._id}
                      isActivateCampaignLoading={activatingCampaignItemId === row._id}
                      isCampaignInvitationLoading={campaignInvitationItemId === row._id}
                      isSelectionReasonGenerating={actionLoadingKey === `selection-generate:${row._id}`}
                      isSelectionReasonSaving={actionLoadingKey === `selection-save:${row._id}`}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

export default function PitchFolderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const folderId = asText(params?.id);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [folder, setFolder] = useState<FolderResponse | null>(null);
  const [rows, setRows] = useState<FolderItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [savingFolderConfig, setSavingFolderConfig] = useState(false);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<DrawerMode>('create');
  const [drawerSaving, setDrawerSaving] = useState(false);
  const [activeItemId, setActiveItemId] = useState('');
  const [draft, setDraft] = useState<DraftState>(DEFAULT_DRAFT);

  const [folderBrandCount, setFolderBrandCount] = useState('');
  const [showFullListToBrand, setShowFullListToBrand] = useState(true);
  const [brandSettingsOpen, setBrandSettingsOpen] = useState(false);

  const [actionLoadingKey, setActionLoadingKey] = useState('');
  const [uploadTargetItemId, setUploadTargetItemId] = useState('');

  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
  const [pdfViewerUrl, setPdfViewerUrl] = useState('');
  const [pdfViewerTitle, setPdfViewerTitle] = useState('');

  const [rateCardItemId, setRateCardItemId] = useState('');
  const [rateCardTab, setRateCardTab] = useState<RateCardTab>('influencer');

  const [mediaKitItemId, setMediaKitItemId] = useState('');

  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [moveDestinationFolderId, setMoveDestinationFolderId] = useState('');
  const [moveTransferMode, setMoveTransferMode] = useState<TransferMode>('move');
  const [moveFolderOptions, setMoveFolderOptions] = useState<FolderListItem[]>(
    []
  );
  const [movingItems, setMovingItems] = useState(false);
  const [creatingInfluencerItemId, setCreatingInfluencerItemId] = useState('');
  const [activatingCampaignItemId, setActivatingCampaignItemId] = useState('');
  const [campaignInvitationItemId, setCampaignInvitationItemId] = useState('');

  const [liveVideoItemId, setLiveVideoItemId] = useState('');
  const [liveVideoSubmitting, setLiveVideoSubmitting] = useState(false);
  const [liveVideoReportLink, setLiveVideoReportLink] = useState('');

  const rowMap = useMemo(() => {
    const map = new Map<string, FolderItem>();
    for (const row of rows) map.set(row._id, row);
    return map;
  }, [rows]);

  const rateCardModalItem = useMemo(
    () => rowMap.get(rateCardItemId) || null,
    [rowMap, rateCardItemId]
  );

  const mediaKitModalItem = useMemo(
    () => rowMap.get(mediaKitItemId) || null,
    [rowMap, mediaKitItemId]
  );

  const liveVideoModalItem = useMemo(
    () => rowMap.get(liveVideoItemId) || null,
    [rowMap, liveVideoItemId]
  );

  const totalItems = rows.length;

  const visibleMediaAssets = useMemo(
    () => rows.filter((row) => !!row.mediaKitAccess?.allowed).length,
    [rows]
  );

  const pendingMediaKitRequests = useMemo(
    () =>
      rows.filter((row) => row.mediaKitAccess?.requestStatus === 'requested')
        .length,
    [rows]
  );

  const sharedCountPreview = useMemo(() => {
    const configured = toNullableInteger(folderBrandCount);
    return configured == null ? totalItems : configured;
  }, [folderBrandCount, totalItems]);

  const selectedCount = selectedItemIds.length;

  const allVisibleSelected = useMemo(() => {
    return rows.length > 0 && rows.every((row) => selectedItemIds.includes(row._id));
  }, [rows, selectedItemIds]);

  const linkToggleItemId = useMemo(() => {
    if (!actionLoadingKey.startsWith('link-toggle:')) return '';
    return actionLoadingKey.split(':')[1] || '';
  }, [actionLoadingKey]);

  const pdfToggleItemId = useMemo(() => {
    if (!actionLoadingKey.startsWith('pdf-toggle:')) return '';
    return actionLoadingKey.split(':')[1] || '';
  }, [actionLoadingKey]);

  const shareUrl = folder?.share?.url || '';

  const downloadCsv = useCallback(() => {
    if (!rows.length) {
      void showErr('No influencer rows available to export.');
      return;
    }

    const csv = buildRowsCsv(rows);
    const blob = new Blob([csv], {
      type: 'text/csv;charset=utf-8;',
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${slugifyFileName(folder?.title)}-influencers.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }, [rows, folder?.title]);

  const goToFolders = useCallback(() => {
    router.push('/admin/pitch-folders');
  }, [router]);

  const goToYoutube = useCallback(() => {
    router.push(`/admin/influencer-data?folderId=${folderId}`);
  }, [router, folderId]);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    setActiveItemId('');
    setDraft(DEFAULT_DRAFT);
    setDrawerMode('create');
  }, []);

  const openCreateDrawer = useCallback(() => {
    setDrawerMode('create');
    setActiveItemId('');
    setDraft(DEFAULT_DRAFT);
    setDrawerOpen(true);
  }, []);

  const openEditDrawer = useCallback((row: FolderItem) => {
    setDrawerMode('edit');
    setActiveItemId(row._id);
    setDraft(buildDraftFromRow(row));
    setDrawerOpen(true);
  }, []);

  const openRateCardModal = useCallback((itemId: string) => {
    setRateCardItemId(itemId);
    setRateCardTab('influencer');
  }, []);

  const closeRateCardModal = useCallback(() => {
    setRateCardItemId('');
    setRateCardTab('influencer');
  }, []);

  const openMediaKitModal = useCallback((itemId: string) => {
    setMediaKitItemId(itemId);
  }, []);

  const openLiveVideoModal = useCallback((itemId: string) => {
    setLiveVideoItemId(itemId);
    setLiveVideoReportLink('');
  }, []);

  const closeLiveVideoModal = useCallback(() => {
    setLiveVideoItemId('');
    setLiveVideoReportLink('');
  }, []);

  const submitLiveVideoUrl = useCallback(
    async (videoUrl: string) => {
      const row = rowMap.get(liveVideoItemId);
      if (!row) return;

      try {
        setLiveVideoSubmitting(true);
        const resp = await post<{ success?: boolean; data?: { link?: string } }>(
          '/campaign-reports',
          {
            pitchFolderItemId: row._id,
            videoUrl,
            campaignId: folder?.assignedCampaign?.campaignId || '',
            campaignTitle: folder?.assignedCampaign?.campaignTitle || '',
            creatorName: row.name || '',
          }
        );
        setLiveVideoReportLink(resp?.data?.link || '');
      } catch (e: any) {
        await showErr(e?.message || 'Failed to create campaign report.');
      } finally {
        setLiveVideoSubmitting(false);
      }
    },
    [rowMap, liveVideoItemId, folder?.assignedCampaign]
  );

  const copyLiveVideoLink = useCallback(async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      await showSuccess('Link copied to clipboard.');
    } catch (_) {
      // ignore clipboard failures
    }
  }, []);

  const closeMediaKitModal = useCallback(() => {
    setMediaKitItemId('');
  }, []);

  const openPdfViewer = useCallback((row: FolderItem) => {
    const url = buildPublicMediaKitUrl(row.mediaKit);
    if (!url) {
      void showErr('PDF URL is not available for this Media Kit.');
      return;
    }

    setPdfViewerUrl(url);
    setPdfViewerTitle(row.mediaKit?.fileName || `${row.name || 'Media Kit'} PDF`);
    setPdfViewerOpen(true);
  }, []);

  const closePdfViewer = useCallback(() => {
    setPdfViewerOpen(false);
    setPdfViewerUrl('');
    setPdfViewerTitle('');
  }, []);

  const setDraftField = useCallback(
    (key: keyof DraftState, value: string | number | boolean) => {
      setDraft((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const hydrateRowsWithExistingInfluencers = useCallback(
    async (items: FolderItem[]) => {
      const emailsToCheck = Array.from(
        new Set(
          items
            .map((item) => normalizeEmailForCompare(item.email))
            .filter(Boolean)
        )
      );

      if (!emailsToCheck.length) return items;

      const existingByEmail = new Map<string, InfluencerMatchMeta>();
      const batchSize = 8;

      for (let index = 0; index < emailsToCheck.length; index += batchSize) {
        const batch = emailsToCheck.slice(index, index + batchSize);

        await Promise.all(
          batch.map(async (email) => {
            try {
              const resp = await post<AdminInfluencerListResponse>(
                '/admin/influencer/list',
                {
                  page: 1,
                  limit: 10,
                  search: email,
                  sortBy: 'createdAt',
                  sortOrder: 'desc',
                }
              );

              const influencerMatch = getInfluencerMatchFromList(
                Array.isArray(resp?.influencers) ? resp.influencers : [],
                email
              );

              if (influencerMatch) existingByEmail.set(email, influencerMatch);
            } catch {
              // Keep folder loading even if the existing-influencer check fails.
            }
          })
        );
      }

      if (!existingByEmail.size) return items;

      return items.map((item) => {
        const email = normalizeEmailForCompare(item.email);
        const influencerMatch = existingByEmail.get(email);

        return influencerMatch ? markRowAsExistingInfluencer(item, influencerMatch) : item;
      });
    },
    []
  );

  const hydrateRowsWithCampaignInvitations = useCallback(
    async (items: FolderItem[], assignedCampaign?: AssignedCampaign | null) => {
      const campaignId = getAssignedCampaignId(assignedCampaign);
      if (!campaignId) return items;

      try {
        const resp = await post<{
          status?: string;
          invitations?: Array<{
            _id?: string;
            influencerId?: string | null;
            campaignId?: string | null;
            status?: string | null;
            sentAt?: string | null;
            updatedAt?: string | null;
          }>;
        }>('/campaign-invitation/get-invitation-status-by-campaign-id', {
          campaignId,
          ...(assignedCampaign?.brandId ? { brandId: assignedCampaign.brandId } : {}),
        });

        const invitationsByInfluencerId = new Map<string, FolderItemCampaignInvitation>();

        for (const invitation of resp?.invitations || []) {
          const influencerId = asText(invitation.influencerId);
          if (!influencerId || invitationsByInfluencerId.has(influencerId)) continue;

          invitationsByInfluencerId.set(influencerId, {
            invitationId: invitation._id || null,
            campaignId: invitation.campaignId || campaignId,
            status: invitation.status || null,
            sentAt: invitation.sentAt || null,
            updatedAt: invitation.updatedAt || null,
          });
        }

        if (!invitationsByInfluencerId.size) return items;

        return items.map((item) => {
          const influencerId = getRowInfluencerId(item);
          const invitation = influencerId
            ? invitationsByInfluencerId.get(influencerId)
            : null;

          return invitation ? { ...item, campaignInvitation: invitation } : item;
        });
      } catch {
        // Keep folder loading even if invitation status lookup fails.
        return items;
      }
    },
    []
  );

  const loadFolder = useCallback(async () => {
    if (!folderId) return;

    setLoading(true);
    try {
      const resp = await get<{ success: boolean; data: FolderResponse }>(
        `/pitch-folders/${folderId}`
      );

      const data = resp?.data || null;
      const nextRows = Array.isArray(data?.items) ? data.items : [];
      const rowsWithExistingInfluencers = await hydrateRowsWithExistingInfluencers(nextRows);
      const rowsWithCampaignInvitations = await hydrateRowsWithCampaignInvitations(
        rowsWithExistingInfluencers,
        data?.assignedCampaign || null
      );

      setFolder(data);
      setRows(rowsWithCampaignInvitations);
      setSelectedItemIds((prev) =>
        prev.filter((id) => rowsWithCampaignInvitations.some((row) => row._id === id))
      );
      setFolderBrandCount(
        data?.brandVisibleItemCount === null ||
          data?.brandVisibleItemCount === undefined
          ? ''
          : String(data.brandVisibleItemCount)
      );
      setShowFullListToBrand(
        data?.showFullListToBrand === undefined
          ? true
          : !!data.showFullListToBrand
      );
    } catch (e: any) {
      await showErr(e?.message || 'Failed to load folder.');
    } finally {
      setLoading(false);
    }
  }, [folderId, hydrateRowsWithExistingInfluencers, hydrateRowsWithCampaignInvitations]);

  useEffect(() => {
    if (!folderId) return;
    closeDrawer();
    setRateCardItemId('');
    setMediaKitItemId('');
    void loadFolder();
  }, [folderId, closeDrawer, loadFolder]);

  const generateSelectionReasonForRow = useCallback(
    async (row: FolderItem, currentReason: string) => {
      const payload = buildSelectionReasonPayloadFromRow(
        row,
        folder,
        currentReason
      );

      if (!hasUsefulSelectionReasonPayload(payload)) {
        await showErr('Add creator, campaign, or rate-card details first, then generate a selection reason.');
        return '';
      }

      try {
        setActionLoadingKey(`selection-generate:${row._id}`);

        const resp = await post<{
          success?: boolean;
          message?: string;
          error?: string;
          selectionReason?: string;
          data?: {
            selectionReason?: string;
            source?: string;
          };
        }>('/pitch-folders/selection-reason/generate', payload);

        if (resp?.success === false) {
          throw new Error(resp?.message || resp?.error || 'Failed to generate selection reason.');
        }

        const selectionReason = asText(
          resp?.selectionReason || resp?.data?.selectionReason
        );

        if (!selectionReason) {
          throw new Error('Selection reason was not returned.');
        }
        return selectionReason;
      } catch (e: any) {
        await showErr(
          getApiErrorMessage(e, 'Failed to generate selection reason.')
        );
        return '';
      } finally {
        setActionLoadingKey('');
      }
    },
    [folder]
  );

  const saveSelectionReasonForRow = useCallback(
    async (row: FolderItem, selectionReason: string) => {
      try {
        setActionLoadingKey(`selection-save:${row._id}`);

        await post('/pitch-folders/item/update', {
          folderId,
          itemId: row._id,
          selectionReason: asText(selectionReason),
        });

        await loadFolder();
        await showSuccess('Selection reason saved successfully.');
      } catch (e: any) {
        await showErr(
          getApiErrorMessage(e, 'Failed to save selection reason.')
        );
      } finally {
        setActionLoadingKey('');
      }
    },
    [folderId, loadFolder]
  );

  const saveDrawer = useCallback(async () => {
    try {
      setDrawerSaving(true);

      if (drawerMode === 'create') {
        await post(`/pitch-folders/${folderId}/item`, buildPayloadFromDraft(draft));
        await showSuccess('Influencer added successfully.');
      } else {
        await post('/pitch-folders/item/update', {
          folderId,
          itemId: activeItemId,
          ...buildPayloadFromDraft(draft),
        });
        await showSuccess('Influencer updated successfully.');
      }

      closeDrawer();
      await loadFolder();
    } catch (e: any) {
      await showErr(
        e?.message ||
        (drawerMode === 'create'
          ? 'Failed to create influencer.'
          : 'Failed to update influencer.')
      );
    } finally {
      setDrawerSaving(false);
    }
  }, [drawerMode, folderId, activeItemId, draft, closeDrawer, loadFolder]);

  const saveFolderBrandSettings = useCallback(async () => {
    try {
      setSavingFolderConfig(true);

      await post('/pitch-folders/update', {
        id: folderId,
        brandVisibleItemCount:
          folderBrandCount === '' ? null : toNullableInteger(folderBrandCount),
        showFullListToBrand,
      });

      await loadFolder();
      await showSuccess('Brand visibility settings updated successfully.');
      setBrandSettingsOpen(false);
    } catch (e: any) {
      await showErr(e?.message || 'Failed to save folder settings.');
    } finally {
      setSavingFolderConfig(false);
    }
  }, [folderId, folderBrandCount, showFullListToBrand, loadFolder]);

  const createInfluencerFromRow = useCallback(
    async (row: FolderItem) => {
      let attemptedEmail = '';

      try {
        if (!row?._id) {
          await showErr('Influencer row is missing.');
          return;
        }

        if (!isRowGoodFit(row)) {
          await showErr('Mark this influencer as Good Fit first, then create influencer.');
          return;
        }

        const assignedCampaignId = getAssignedCampaignId(folder?.assignedCampaign);

        if (!assignedCampaignId) {
          await showErr('Assign a campaign to this pitch folder first, then create influencer.');
          return;
        }

        const name = asText(row.name);
        const email = asText(row.email).toLowerCase();
        attemptedEmail = email;
        const platform = normalizeAdminCreatePlatform(row.provider);
        const username = getAdminCreateUsernameFromRow(row);

        if (!name) {
          await showErr('Influencer name is required.');
          return;
        }

        if (!email) {
          await showErr('Influencer email is required.');
          return;
        }

        if (!platform) {
          await showErr('Platform is required. Allowed values: YouTube, Instagram, or TikTok.');
          return;
        }

        if (!username) {
          await showErr('Username / handle is required to create influencer.');
          return;
        }

        setCreatingInfluencerItemId(row._id);

        const resp = await post<{
          success?: boolean;
          message?: string;
          influencer?: {
            _id?: string;
            name?: string;
            email?: string;
            primaryPlatform?: string;
          };
        }>('/admin/influencer/create', {
          name,
          email,
          platform,
          username,

          // Extra row data is sent for future backend support. The current
          // adminCreateInfluencer API primarily consumes name, email, platform,
          // and username.
          followers: row.followers ?? null,
          profileLink: getProfileUrl(row),
          country: asText(row.country),
          niche: Array.isArray(row.niche) ? row.niche : [],
          selectionReason: asText(row.selectionReason),
          influencerRateCard: asText(row.influencerRateCard),
          platformRateCard: asText(row.platformRateCard),
          rateCardCurrency: asText(row.rateCardCurrency || 'USD'),
          ourFeePct: row.ourFeePct ?? null,
          shippingAddress: getShippingAddress(row),
        });

        if (resp?.success === false) {
          throw new Error(resp?.message || 'Failed to create influencer.');
        }

        const influencerId = resp?.influencer?._id || '';

        if (influencerId) {
          setRows((prev) =>
            prev.map((item) =>
              item._id === row._id
                ? {
                  ...item,
                  createdInfluencerId: influencerId,
                  influencerIsAdminCreated: true,
                  influencerCreatedBySource: 'admin',
                  linkedInfluencer: {
                    influencerId,
                    createdAt: new Date().toISOString(),
                    isAdminCreated: true,
                    createdBySource: 'admin',
                    signupCompleted: false,
                  },
                }
                : item
            )
          );
        }

        await showSuccess(resp?.message || 'Influencer created successfully.');
      } catch (e: any) {
        const message = getApiErrorMessage(e, 'Failed to create influencer.');

        if (/influencer already exists/i.test(message)) {
          setRows((prev) =>
            prev.map((item) =>
              item._id === row._id
                ? {
                  ...item,
                  createdInfluencerId: item.createdInfluencerId || 'already-created',
                  influencerIsAdminCreated: item.influencerIsAdminCreated ?? null,
                  influencerCreatedBySource: item.influencerCreatedBySource || null,
                  linkedInfluencer: item.linkedInfluencer || {
                    influencerId: 'already-created',
                    createdAt: new Date().toISOString(),
                    isAdminCreated: null,
                    createdBySource: null,
                    signupCompleted: null,
                  },
                }
                : item
            )
          );

          await showSuccess('Influencer already created.');
          return;
        }

        await showCreateInfluencerError(message, attemptedEmail);
      } finally {
        setCreatingInfluencerItemId('');
      }
    },
    [folder?.assignedCampaign?.campaignId, folder?.assignedCampaign?.campaignsId]
  );

  const activateRowOnCampaign = useCallback(
    async (row: FolderItem) => {
      try {
        if (!isRowGoodFit(row)) {
          await showErr('Mark this influencer as Good Fit first, then activate on campaign.');
          return;
        }

        const assignedCampaignId = getAssignedCampaignId(folder?.assignedCampaign);

        if (!assignedCampaignId) {
          await showErr('Assign a campaign to this pitch folder first.');
          return;
        }

        const influencerId = getRowInfluencerId(row);

        if (!influencerId) {
          await showErr('Create/link this influencer first, then activate them on the campaign.');
          return;
        }

        setActivatingCampaignItemId(row._id);

        const resp = await post<{
          success?: boolean;
          message?: string;
          data?: {
            alreadyActive?: boolean;
            folder?: FolderResponse;
          };
        }>(`/pitch-folders/${folderId}/item/${row._id}/activate-campaign`, {});

        const nextFolder = resp?.data?.folder;

        if (nextFolder) {
          const nextRows = Array.isArray(nextFolder.items) ? nextFolder.items : [];
          const rowsWithExistingInfluencers = await hydrateRowsWithExistingInfluencers(nextRows);
          const rowsWithCampaignInvitations = await hydrateRowsWithCampaignInvitations(
            rowsWithExistingInfluencers,
            nextFolder.assignedCampaign || folder?.assignedCampaign || null
          );

          setFolder(nextFolder);
          setRows(rowsWithCampaignInvitations);
        } else {
          setRows((prev) =>
            prev.map((item) =>
              item._id === row._id
                ? {
                  ...item,
                  campaignActivation: {
                    active: true,
                    campaignId: assignedCampaignId || null,
                    campaignsId: folder?.assignedCampaign?.campaignsId || '',
                    influencerId,
                    activeAt: new Date().toISOString(),
                    activatedByAdminId: null,
                  },
                }
                : item
            )
          );
        }

        await showSuccess(
          resp?.message ||
          (resp?.data?.alreadyActive
            ? 'Influencer is already active on this campaign.'
            : 'Influencer activated on campaign successfully.')
        );
      } catch (e: any) {
        await showErr(e?.message || 'Failed to activate influencer on campaign.');
      } finally {
        setActivatingCampaignItemId('');
      }
    },
    [folder, folderId, hydrateRowsWithExistingInfluencers, hydrateRowsWithCampaignInvitations]
  );

  const sendCampaignInvitationForRow = useCallback(
    async (row: FolderItem) => {
      try {
        if (!isRowGoodFit(row)) {
          await showErr('Mark this influencer as Good Fit first, then send campaign invitation.');
          return;
        }

        const assignedCampaign = folder?.assignedCampaign || null;
        const campaignId = getAssignedCampaignId(assignedCampaign);
        const brandId = asText(assignedCampaign?.brandId);
        const influencerId = getRowInfluencerId(row);

        if (!campaignId) {
          await showErr('Assign a campaign to this pitch folder first.');
          return;
        }

        if (!brandId) {
          await showErr('Assigned campaign brand ID is missing.');
          return;
        }

        if (!influencerId) {
          await showErr('Create/link this influencer first, then send campaign invitation.');
          return;
        }

        setCampaignInvitationItemId(row._id);

        const resp = await adminPost<{
          status?: string;
          message?: string;
          invitations?: Array<{
            _id?: string;
            campaignId?: string | null;
            status?: string | null;
            sentAt?: string | null;
            updatedAt?: string | null;
          }>;
        }>('/campaign-invitation/admin/create', {
          brandId,
          influencerId,
          campaignIds: [campaignId],
          platform: asText(row.provider).toLowerCase() || undefined,
          handle: normalizeHandle(asText(row.handle)) || undefined,
          emailTo: normalizeEmailForCompare(row.email) || undefined,
        });

        const invitation = resp?.invitations?.[0] || null;

        setRows((prev) =>
          prev.map((item) =>
            item._id === row._id
              ? {
                ...item,
                campaignInvitation: {
                  invitationId: invitation?._id || null,
                  campaignId: invitation?.campaignId || campaignId,
                  status: invitation?.status || 'sent',
                  sentAt: invitation?.sentAt || new Date().toISOString(),
                  updatedAt: invitation?.updatedAt || new Date().toISOString(),
                },
              }
              : item
          )
        );

        await showSuccess(resp?.message || 'Campaign invitation sent successfully.');
      } catch (e: any) {
        await showErr(e?.message || 'Failed to send campaign invitation.');
      } finally {
        setCampaignInvitationItemId('');
      }
    },
    [folder]
  );

  const deleteRow = useCallback(
    async (itemId: string) => {
      try {
        const ok = await swal({
          title: 'Delete influencer?',
          text: 'This will remove the influencer from this folder.',
          icon: 'warning',
          buttons: ['Cancel', 'Delete'],
          dangerMode: true,
        });

        if (!ok) return;

        await post('/pitch-folders/item/delete', {
          folderId,
          itemId,
        });

        await loadFolder();
        await showSuccess('Influencer removed successfully.');
      } catch (e: any) {
        await showErr(e?.message || 'Failed to delete influencer.');
      }
    },
    [folderId, loadFolder]
  );

  const copyShareLink = useCallback(async () => {
    try {
      const inputEl = document.createElement('input');
      inputEl.className = 'swal-content__input';
      inputEl.placeholder = 'e.g. Nike, Zomato, Boat...';
      inputEl.setAttribute(
        'style',
        'width:100%;height:40px;border:1px solid #cbd5e1;border-radius:8px;padding:0 12px;font-size:14px;outline:none;'
      );

      const brandName = await swal({
        title: 'Share Pitch Folder',
        text: 'Enter the brand this link is being generated for.',
        content: { element: inputEl },
        buttons: ['Cancel', 'Generate Link'],
      });

      if (!brandName) return;

      const trimmedBrandName = asText(brandName);
      if (!trimmedBrandName) {
        await showErr('Brand name is required to generate a share link.');
        return;
      }

      setSharing(true);

      const resp = await post<{
        success: boolean;
        data: { url: string; brandName?: string };
      }>(`/pitch-folders/${folderId}/share-link`, {
        brandName: trimmedBrandName,
      });

      const url = resp?.data?.url || '';
      if (!url) {
        await showErr('Could not generate share link.');
        return;
      }

      await navigator.clipboard.writeText(url);
      await loadFolder();
      await showSuccess(
        `Share link for ${resp?.data?.brandName || trimmedBrandName} copied.`
      );
    } catch (e: any) {
      await showErr(e?.message || 'Failed to copy share link.');
    } finally {
      setSharing(false);
    }
  }, [folderId, loadFolder]);

  const runRowAction = useCallback(
    async (key: string, handler: () => Promise<void>) => {
      try {
        setActionLoadingKey(key);
        await handler();
      } finally {
        setActionLoadingKey('');
      }
    },
    []
  );

  const handleGenerateMediaKitLink = useCallback(
    async (row: FolderItem) => {
      try {
        const provider = asText(row.provider).toLowerCase();
        const username = asText(row.handle).replace(/^@/, '');

        if (!provider) {
          await showErr('Platform is missing for this creator.');
          return;
        }

        if (!username) {
          await showErr('Handle is missing for this creator.');
          return;
        }

        await runRowAction(`link-generate:${row._id}`, async () => {
          const resp = await get<{
            success: boolean;
            data?: {
              modashId: string;
              link: string;
              username?: string;
              platform?: string;
            };
            error?: string;
          }>('/modash/media-kit-link', {
            platform: provider,
            username,
          });

          const link = asText(resp?.data?.link);

          if (!link) {
            throw new Error(resp?.error || 'Could not generate media kit link.');
          }

          await post('/pitch-folders/item/update', {
            folderId,
            itemId: row._id,
            mediaKitLink: {
              url: link,
              generatedAt: new Date().toISOString(),
            },
          });

          await navigator.clipboard.writeText(link);
          await loadFolder();
          await showSuccess('Media Kit Link generated, saved, and copied.');
        });
      } catch (e: any) {
        await showErr(e?.message || 'Failed to generate media kit link.');
      }
    },
    [folderId, loadFolder, runRowAction]
  );

  const copyMediaKitLink = useCallback(async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      await showSuccess('Media Kit Link copied.');
    } catch {
      await showErr('Could not copy link.');
    }
  }, []);

  const pickMediaKit = useCallback((itemId: string) => {
    setUploadTargetItemId(itemId);
    fileInputRef.current?.click();
  }, []);

  const onMediaKitSelected = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      const itemId = uploadTargetItemId;

      e.target.value = '';

      if (!file || !itemId) return;

      if (
        file.type !== 'application/pdf' &&
        !file.name.toLowerCase().endsWith('.pdf')
      ) {
        await showErr('Only PDF Media Kit files are allowed.');
        return;
      }

      await runRowAction(`pdf-upload:${itemId}`, async () => {
        const presignResp = await post<{
          success: boolean;
          data: {
            key: string;
            fileName: string;
            contentType: string;
            uploadUrl: string;
            expiresIn: number;
          };
        }>('/pitch-folders/item/media-kit/presign', {
          folderId,
          fileName: file.name,
          contentType: file.type || 'application/pdf',
        });

        const uploadUrl = presignResp?.data?.uploadUrl || '';
        const key = presignResp?.data?.key || '';
        const fileName = presignResp?.data?.fileName || file.name;

        if (!uploadUrl || !key) {
          throw new Error('Could not create upload URL for Media Kit.');
        }

        const uploadResp = await fetch(uploadUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/pdf',
          },
          body: file,
        });

        if (!uploadResp.ok) {
          throw new Error('PDF upload to storage failed.');
        }

        await post('/pitch-folders/item/update', {
          folderId,
          itemId,
          mediaKit: {
            s3Key: key,
            fileName,
            mimeType: 'application/pdf',
            size: file.size,
            uploadedAt: new Date().toISOString(),
          },
        });

        await loadFolder();
        await showSuccess('Media Kit PDF uploaded successfully.');
      });
    },
    [folderId, loadFolder, runRowAction, uploadTargetItemId]
  );

  const handleMediaKitLinkToggle = useCallback(
    async (row: FolderItem, nextValue: boolean) => {
      const itemId = row._id;
      const hasLink = !!asText(row.mediaKitLink?.url);
      const isRequested = row.mediaKitLink?.requestStatus === 'requested';
      const isVisible = !!row.mediaKitLink?.showToBrand;

      if (!hasLink) return;

      await runRowAction(`link-toggle:${itemId}`, async () => {
        if (nextValue) {
          if (isRequested && !isVisible) {
            await post('/pitch-folders/item/media-kit-link/approval', {
              folderId,
              itemId,
              action: 'approve',
            });
          } else {
            await post('/pitch-folders/item/media-kit-link/visibility', {
              folderId,
              itemId,
              showToBrand: true,
            });
          }
        } else {
          if (isRequested && !isVisible) {
            await post('/pitch-folders/item/media-kit-link/approval', {
              folderId,
              itemId,
              action: 'reject',
            });
          } else {
            await post('/pitch-folders/item/media-kit-link/visibility', {
              folderId,
              itemId,
              showToBrand: false,
            });
          }
        }

        await loadFolder();
        await showSuccess('Media Kit Link access updated successfully.');
      });
    },
    [folderId, loadFolder, runRowAction]
  );

  const handleMediaKitPdfToggle = useCallback(
    async (row: FolderItem, nextValue: boolean) => {
      const itemId = row._id;
      const hasPdf = !!asText(row.mediaKit?.s3Key);
      const isRequested = row.mediaKit?.requestStatus === 'requested';
      const isVisible = !!row.mediaKit?.showToBrand;

      if (!hasPdf) return;

      await runRowAction(`pdf-toggle:${itemId}`, async () => {
        if (nextValue) {
          if (isRequested && !isVisible) {
            await post('/pitch-folders/item/media-kit/approval', {
              folderId,
              itemId,
              action: 'approve',
            });
          } else {
            await post('/pitch-folders/item/media-kit/visibility', {
              folderId,
              itemId,
              showToBrand: true,
            });
          }
        } else {
          if (isRequested && !isVisible) {
            await post('/pitch-folders/item/media-kit/approval', {
              folderId,
              itemId,
              action: 'reject',
            });
          } else {
            await post('/pitch-folders/item/media-kit/visibility', {
              folderId,
              itemId,
              showToBrand: false,
            });
          }
        }

        await loadFolder();
        await showSuccess('Media Kit PDF access updated successfully.');
      });
    },
    [folderId, loadFolder, runRowAction]
  );

  const removeMediaKit = useCallback(
    async (itemId: string) => {
      const ok = await swal({
        title: 'Remove Media Kit PDF?',
        text: 'This will remove the uploaded PDF from this influencer record.',
        icon: 'warning',
        buttons: ['Cancel', 'Remove'],
        dangerMode: true,
      });

      if (!ok) return;

      await runRowAction(`pdf-remove:${itemId}`, async () => {
        await post('/pitch-folders/item/update', {
          folderId,
          itemId,
          removeMediaKit: true,
        });

        await loadFolder();
        await showSuccess('Media Kit PDF removed successfully.');
      });
    },
    [folderId, loadFolder, runRowAction]
  );

  const toggleSelectedItem = useCallback((itemId: string) => {
    setSelectedItemIds((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  }, []);

  const toggleSelectAllVisible = useCallback(() => {
    setSelectedItemIds((prev) => {
      if (rows.length && rows.every((row) => prev.includes(row._id))) {
        return prev.filter((id) => !rows.some((row) => row._id === id));
      }

      const next = new Set(prev);
      rows.forEach((row) => next.add(row._id));
      return Array.from(next);
    });
  }, [rows]);

  const clearSelection = useCallback(() => {
    setSelectedItemIds([]);
  }, []);

  const loadMoveFolderOptions = useCallback(async () => {
    try {
      const resp = await get<FolderListResponse>('/pitch-folders/list');
      const options = Array.isArray(resp?.data) ? resp.data : [];
      setMoveFolderOptions(options.filter((item) => item._id !== folderId));
    } catch (e: any) {
      await showErr(e?.message || 'Failed to load destination folders.');
    }
  }, [folderId]);

  const openMoveModal = useCallback(async () => {
    if (!selectedItemIds.length) {
      await showErr('Please select at least one influencer.');
      return;
    }

    await loadMoveFolderOptions();
    setMoveTransferMode('move');
    setMoveModalOpen(true);
  }, [selectedItemIds, loadMoveFolderOptions]);

  const closeMoveModal = useCallback(() => {
    setMoveModalOpen(false);
    setMoveDestinationFolderId('');
    setMoveTransferMode('move');
  }, []);

  const moveSelectedItems = useCallback(async () => {
    try {
      if (!selectedItemIds.length) {
        await showErr('Please select at least one influencer.');
        return;
      }

      if (!moveDestinationFolderId) {
        await showErr('Please select a destination folder.');
        return;
      }

      setMovingItems(true);

      const resp = await post<TransferItemsResponse>('/pitch-folders/items/move', {
        sourceFolderId: folderId,
        destinationFolderId: moveDestinationFolderId,
        itemIds: selectedItemIds,
        transferType: moveTransferMode,
      });

      const action = resp?.data?.action === 'copy' ? 'copy' : moveTransferMode;
      const completedCount =
        action === 'copy'
          ? Number(resp?.data?.copiedCount || 0)
          : Number(resp?.data?.movedCount || 0);

      const skippedDuplicateCount = resp?.data?.skippedDuplicateItemIds?.length || 0;
      const skippedMissingCount = resp?.data?.skippedMissingItemIds?.length || 0;

      const finalCount =
        completedCount > 0 ? completedCount : selectedItemIds.length;

      const notes: string[] = [];
      if (skippedDuplicateCount) {
        notes.push(`${skippedDuplicateCount} duplicate skipped`);
      }
      if (skippedMissingCount) {
        notes.push(`${skippedMissingCount} missing skipped`);
      }

      const actionPast = action === 'copy' ? 'copied' : 'moved';

      await showSuccess(
        `${finalCount} influencer${finalCount === 1 ? '' : 's'} ${actionPast} successfully${notes.length ? `. ${notes.join(', ')}.` : '.'
        }`
      );

      closeMoveModal();
      setSelectedItemIds([]);
      await loadFolder();
    } catch (e: any) {
      await showErr(
        e?.message ||
        `Failed to ${moveTransferMode === 'copy' ? 'copy' : 'move'} selected influencers.`
      );
    } finally {
      setMovingItems(false);
    }
  }, [
    folderId,
    moveDestinationFolderId,
    moveTransferMode,
    selectedItemIds,
    closeMoveModal,
    loadFolder,
  ]);

  if (!folderId) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-4xl px-4 py-12">
          <Card className="rounded-3xl shadow-none">
            <CardHeader>
              <CardTitle>Invalid Folder</CardTitle>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={onMediaKitSelected}
      />

      <PdfViewerModal
        open={pdfViewerOpen}
        title={pdfViewerTitle}
        url={pdfViewerUrl}
        onClose={closePdfViewer}
      />

      <RateCardModal
        item={rateCardModalItem}
        tab={rateCardTab}
        onClose={closeRateCardModal}
        onTabChange={setRateCardTab}
      />

      <LiveVideoModal
        item={liveVideoModalItem}
        submitting={liveVideoSubmitting}
        link={liveVideoReportLink}
        onClose={closeLiveVideoModal}
        onSubmit={submitLiveVideoUrl}
        onCopyLink={copyLiveVideoLink}
      />

      <MediaKitModal
        item={mediaKitModalItem}
        actionLoadingKey={actionLoadingKey}
        onClose={closeMediaKitModal}
        onGenerateLink={handleGenerateMediaKitLink}
        onPickPdf={pickMediaKit}
        onToggleLink={handleMediaKitLinkToggle}
        onTogglePdf={handleMediaKitPdfToggle}
        onCopyLink={copyMediaKitLink}
        onOpenPdf={openPdfViewer}
        onRemovePdf={removeMediaKit}
      />

      <BrandViewSettingsModal
        open={brandSettingsOpen}
        onClose={() => setBrandSettingsOpen(false)}
        shareUrl={shareUrl}
        totalItems={totalItems}
        sharedCountPreview={sharedCountPreview}
        showFullListToBrand={showFullListToBrand}
        setShowFullListToBrand={setShowFullListToBrand}
        folderBrandCount={folderBrandCount}
        setFolderBrandCount={setFolderBrandCount}
        savingFolderConfig={savingFolderConfig}
        onSave={saveFolderBrandSettings}
      />

      <MoveItemsModal
        open={moveModalOpen}
        onClose={closeMoveModal}
        folders={moveFolderOptions}
        selectedCount={selectedCount}
        destinationFolderId={moveDestinationFolderId}
        setDestinationFolderId={setMoveDestinationFolderId}
        transferMode={moveTransferMode}
        setTransferMode={setMoveTransferMode}
        moving={movingItems}
        onSubmit={moveSelectedItems}
      />

      <DrawerForm
        open={drawerOpen}
        mode={drawerMode}
        draft={draft}
        saving={drawerSaving}
        onClose={closeDrawer}
        onSave={saveDrawer}
        onDraftFieldChange={setDraftField}
      />

      <div className="mx-auto w-full max-w-[1700px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <Card className="rounded-3xl border border-slate-200 shadow-none">
          <CardContent className="p-6 sm:p-8">
            <SectionHeading
              eyebrow="Pitch Folder"
              title={folder?.title || 'Pitch Folder'}
              description={
                folder?.description ||
                'Manage brand visibility, influencer access, media kits, and rate cards from one minimal workspace.'
              }
              actions={
                <>
                  <Button
                    variant="outline"
                    className="rounded-xl"
                    onClick={goToFolders}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>

                  <Button
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => setBrandSettingsOpen(true)}
                  >
                    <Settings2 className="mr-2 h-4 w-4" />
                    Manage Brand View
                  </Button>

                  <Button
                    variant="outline"
                    className="rounded-xl"
                    onClick={loadFolder}
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="mr-2 h-4 w-4" />
                    )}
                    Refresh
                  </Button>

                  <Button
                    className="rounded-xl"
                    onClick={copyShareLink}
                    disabled={sharing}
                  >
                    {sharing ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Copy className="mr-2 h-4 w-4" />
                    )}
                    Copy Share Link
                  </Button>
                </>
              }
            />

            <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Created By
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-950">
                  {folder?.createdBy?.name || folder?.createdBy?.email || DASH}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {folder?.createdBy?.designation ||
                    prettyText(folder?.createdBy?.role)}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Created On
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-950">
                  {formatDate(folder?.createdAt)}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Last Updated
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-950">
                  {formatDate(folder?.updatedAt)}
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-teal-100 bg-teal-50/40 p-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-teal-700" />
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-700">
                  Shared With
                </p>
              </div>

              {folder?.shares && folder.shares.length > 0 ? (
                <div className="mt-3 space-y-2">
                  {folder.shares
                    .slice()
                    .sort((a, b) => {
                      const aTime = a.generatedAt
                        ? new Date(a.generatedAt).getTime()
                        : 0;
                      const bTime = b.generatedAt
                        ? new Date(b.generatedAt).getTime()
                        : 0;
                      return bTime - aTime;
                    })
                    .map((s, idx) => (
                      <div
                        key={`${s.token}-${idx}`}
                        className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-950">
                            {s.brandName || 'Unlabeled Brand'}
                          </p>
                          <p className="truncate text-xs text-slate-500">
                            {s.url}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-3">
                          <span className="text-xs text-slate-500">
                            {formatDate(s.generatedAt)}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-lg"
                            onClick={async () => {
                              if (!s.url) return;
                              await navigator.clipboard.writeText(s.url);
                              await showSuccess(
                                `Link for ${s.brandName || 'this brand'} copied.`
                              );
                            }}
                          >
                            <Copy className="mr-1.5 h-3.5 w-3.5" />
                            Copy
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-slate-500">
                  Not shared with any brand yet.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <InfluencerTableSection
          loading={loading}
          rows={rows}
          selectedItemIds={selectedItemIds}
          selectedCount={selectedCount}
          allVisibleSelected={allVisibleSelected}
          onToggleSelectAll={toggleSelectAllVisible}
          onToggleSelected={toggleSelectedItem}
          onOpenMoveModal={openMoveModal}
          onClearSelection={clearSelection}
          onOpenCreateDrawer={openCreateDrawer}
          onDownloadCsv={downloadCsv}
          onOpenRateCard={openRateCardModal}
          onOpenMediaKit={openMediaKitModal}
          onToggleLink={handleMediaKitLinkToggle}
          onTogglePdf={handleMediaKitPdfToggle}
          onCreateInfluencer={createInfluencerFromRow}
          onActivateOnCampaign={activateRowOnCampaign}
          onSendCampaignInvitation={sendCampaignInvitationForRow}
          onSetLiveVideoUrl={openLiveVideoModal}
          onGenerateSelectionReason={generateSelectionReasonForRow}
          onSaveSelectionReason={saveSelectionReasonForRow}
          onEdit={openEditDrawer}
          onDelete={deleteRow}
          onGoToYoutube={goToYoutube}
          assignedCampaign={folder?.assignedCampaign || null}
          linkToggleItemId={linkToggleItemId}
          pdfToggleItemId={pdfToggleItemId}
          creatingInfluencerItemId={creatingInfluencerItemId}
          activatingCampaignItemId={activatingCampaignItemId}
          campaignInvitationItemId={campaignInvitationItemId}
          actionLoadingKey={actionLoadingKey}
        />
      </div>
    </div>
  );
}