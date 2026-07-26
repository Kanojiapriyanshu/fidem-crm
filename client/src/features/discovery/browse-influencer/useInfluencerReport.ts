import { useState, useCallback } from 'react';
import { Platform, ReportResponse, ModashReportRaw } from './types';
import { normalizeReport } from './utils';
import {
  createReportApiError,
  isReportLimitExceededError,
  isReportLimitExceededPayload,
} from './reportLimit';

type CalcMethod = 'median' | 'average';
type AuthRole = 'brand' | 'admin';

type FetchReportOptions = {
  influencerId?: string;
  forceRefresh?: boolean;
  brandId?: string;
  adminId?: string;
  role?: AuthRole;
  np?: string | boolean;
};

interface UseInfluencerReportReturn {
  report: ReportResponse | null;
  rawReport: ModashReportRaw | null;
  loading: boolean;
  error: string | null;
  limitExceeded: boolean;
  lastFetchedAt: string | null;
  brandId: string | null;
  adminId: string | null;
  authRole: AuthRole | null;
  clearLimitExceeded: () => void;
  fetchReport: {
    (
      id: string,
      platform: Platform,
      calc: CalcMethod,
      influencerId?: string,
      forceRefresh?: boolean
    ): Promise<void>;
    (
      id: string,
      platform: Platform,
      calc: CalcMethod,
      opts?: FetchReportOptions
    ): Promise<void>;
  };
}

type PublicCreatorResponse = {
  message?: string;
  msg?: string;
  error?: string;
  data?: {
    _id?: string;
    creatorId?: string;
    userId?: string;
    averageViews?: number | string;
    avgViews?: number | string;
    bio?: string;
    categories?: string[];
    country?: string;
    createdAt?: string;
    engagementRate?: number | string;
    engagements?: number | string;
    followers?: number | string;
    fullname?: string;
    handle?: string;
    isPrivate?: boolean;
    isVerified?: boolean;
    location?: string;
    picture?: string;
    platform?: string;
    searchType?: string;
    source?: string;
    updatedAt?: string;
    url?: string;
    username?: string;
  };
  _lastFetchedAt?: string;
};

const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
const API_REPORT_ENDPOINT = `${BACKEND_BASE_URL}/modash/report`;
const API_CREATOR_ENDPOINT = `${BACKEND_BASE_URL}/modash/creator`;

function cleanId(v: any): string | null {
  const s = String(v || '').trim();
  return s ? s : null;
}

function getAuthFromStorage(): {
  brandId: string | null;
  adminId: string | null;
  authRole: AuthRole | null;
} {
  if (typeof window === 'undefined') {
    return { brandId: null, adminId: null, authRole: null };
  }

  try {
    const b = cleanId(window.localStorage.getItem('brandId'));
    const a = cleanId(window.localStorage.getItem('adminId'));

    if (b) return { brandId: b, adminId: null, authRole: 'brand' };
    if (a) return { brandId: null, adminId: a, authRole: 'admin' };

    return { brandId: null, adminId: null, authRole: null };
  } catch {
    return { brandId: null, adminId: null, authRole: null };
  }
}

function resolveAuth(
  opts: FetchReportOptions | undefined,
  storage: ReturnType<typeof getAuthFromStorage>
) {
  const role: AuthRole | null =
    opts?.role ||
    (opts?.brandId ? 'brand' : opts?.adminId ? 'admin' : storage.authRole);

  const brandId = cleanId(opts?.brandId) || storage.brandId;
  const adminId = cleanId(opts?.adminId) || storage.adminId;

  if (role === 'admin') {
    return { authRole: 'admin' as const, brandId: null, adminId };
  }
  if (role === 'brand') {
    return { authRole: 'brand' as const, brandId, adminId: null };
  }

  if (brandId) return { authRole: 'brand' as const, brandId, adminId: null };
  if (adminId) return { authRole: 'admin' as const, brandId: null, adminId };
  return { authRole: null, brandId: null, adminId: null };
}

function buildPublicCreatorSyntheticProfile(
  creator: NonNullable<PublicCreatorResponse['data']>,
  platform: Platform,
  fallbackUserId: string
) {
  return {
    _id: creator.creatorId ?? creator._id,
    creatorId: creator.creatorId ?? creator._id,
    userId: creator.userId ?? fallbackUserId,
    modashId: creator.userId ?? fallbackUserId,
    fullname: creator.fullname,
    name: creator.fullname,
    username: creator.username ?? creator.handle,
    handle: creator.handle,
    bio: creator.bio,
    picture: creator.picture,
    followers: creator.followers,
    avgViews: creator.averageViews ?? creator.avgViews,
    averageViews: creator.averageViews ?? creator.avgViews,
    engagementRate: creator.engagementRate,
    engagements: creator.engagements,
    country: creator.country ?? creator.location,
    location: creator.location ?? creator.country,
    url: creator.url,
    platform: (creator.platform as Platform) ?? platform,
    provider: (creator.platform as Platform) ?? platform,
    isPrivate: creator.isPrivate,
    isVerified: creator.isVerified,
    categories: Array.isArray(creator.categories) ? creator.categories : [],
    source: creator.source,
    searchType: creator.searchType,
    createdAt: creator.createdAt,
    updatedAt: creator.updatedAt,
  };
}

function normalizePublicCreatorResponse(
  raw: PublicCreatorResponse,
  platform: Platform,
  userId: string
): {
  normalized: ReportResponse;
  syntheticRaw: ModashReportRaw;
  fetchedAt: string | null;
} {
  const creator = raw?.data;
  if (!creator) {
    throw new Error(raw?.message || 'Creator data not found');
  }

  const profile = buildPublicCreatorSyntheticProfile(creator, platform, userId);

  return {
    normalized: {
      profile,
    } as ReportResponse,
    syntheticRaw: profile as unknown as ModashReportRaw,
    fetchedAt:
      typeof creator?.updatedAt === 'string'
        ? creator.updatedAt
        : typeof raw?._lastFetchedAt === 'string'
          ? raw._lastFetchedAt
          : null,
  };
}

export function useInfluencerReport(): UseInfluencerReportReturn {
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [rawReport, setRawReport] = useState<ModashReportRaw | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [limitExceeded, setLimitExceeded] = useState(false);
  const [lastFetchedAt, setLastFetchedAt] = useState<string | null>(null);

  const initialAuth = getAuthFromStorage();
  const [brandId, setBrandId] = useState<string | null>(initialAuth.brandId);
  const [adminId, setAdminId] = useState<string | null>(initialAuth.adminId);
  const [authRole, setAuthRole] = useState<AuthRole | null>(initialAuth.authRole);

  const fetchReport = useCallback(
    async (
      id: string,
      platform: Platform,
      calc: CalcMethod,
      arg4?: string | FetchReportOptions,
      arg5?: boolean
    ) => {
      try {
        setLoading(true);
        setError(null);
        setLimitExceeded(false);

        let opts: FetchReportOptions | undefined;
        if (typeof arg4 === 'string' || arg4 == null) {
          opts = {
            influencerId: arg4 || undefined,
            forceRefresh: !!arg5,
          };
        } else {
          opts = arg4;
        }

        const storageAuth = getAuthFromStorage();
        const resolved = resolveAuth(opts, storageAuth);

        setBrandId(resolved.brandId);
        setAdminId(resolved.adminId);
        setAuthRole(resolved.authRole);

        const shouldUsePublicCreatorEndpoint =
          !resolved.brandId &&
          !resolved.adminId &&
          resolved.authRole == null;

        if (shouldUsePublicCreatorEndpoint) {
          const creatorRes = await fetch(
            `${API_CREATOR_ENDPOINT}/${encodeURIComponent(id)}`
          );
          const creatorRaw: PublicCreatorResponse = await creatorRes.json();

          if (isReportLimitExceededPayload(creatorRaw, creatorRes.status)) {
            throw createReportApiError(
              creatorRaw,
              creatorRes.status,
              'Report limit exceeded'
            );
          }

          if (!creatorRes.ok || creatorRaw?.error) {
            const msg =
              creatorRaw?.message ||
              creatorRaw?.msg ||
              (typeof creatorRaw?.error === 'string'
                ? creatorRaw.error
                : `Failed to fetch creator (${creatorRes.status})`);
            throw createReportApiError(creatorRaw, creatorRes.status, msg);
          }

          const { normalized, syntheticRaw, fetchedAt } =
            normalizePublicCreatorResponse(creatorRaw, platform, id);

          setReport(normalized);
          setRawReport(syntheticRaw);
          setLastFetchedAt(fetchedAt);
          return;
        }

        const params: Record<string, string> = {
          platform,
          userId: id,
          calculationMethod: calc,
        };

        if (resolved.brandId) params.brandId = resolved.brandId;
        if (resolved.adminId) params.adminId = resolved.adminId;
        if (opts?.influencerId) params.influencerId = opts.influencerId;
        if (opts?.forceRefresh) params.force = '1';

        if (opts?.np === true || opts?.np === '1' || opts?.np === 'true') {
          params.np = '1';
        }

        const q = new URLSearchParams(params);
        const res = await fetch(`${API_REPORT_ENDPOINT}?${q.toString()}`);
        const raw: ModashReportRaw = await res.json();

        if (isReportLimitExceededPayload(raw, res.status)) {
          throw createReportApiError(raw, res.status, 'Report limit exceeded');
        }

        if (!res.ok || (raw as any)?.error) {
          const msg =
            (raw as any)?.message ||
            (raw as any)?.msg ||
            (typeof (raw as any)?.error === 'string'
              ? (raw as any).error
              : `Failed to fetch report (${res.status})`);
          throw createReportApiError(raw, res.status, msg);
        }

        const normalized: ReportResponse = normalizeReport(raw, platform);

        setReport(normalized);
        setRawReport(raw);

        const fetchedAt =
          typeof (raw as any)?._lastFetchedAt === 'string'
            ? (raw as any)._lastFetchedAt
            : null;
        setLastFetchedAt(fetchedAt);
      } catch (e: any) {
        if (isReportLimitExceededError(e)) {
          setLimitExceeded(true);
          setError(null);
        } else {
          setError(e?.message || 'Something went wrong');
        }

        setReport(null);
        setRawReport(null);
        setLastFetchedAt(null);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const clearLimitExceeded = useCallback(() => {
    setLimitExceeded(false);
  }, []);

  return {
    report,
    rawReport,
    loading,
    error,
    limitExceeded,
    lastFetchedAt,
    brandId,
    adminId,
    authRole,
    clearLimitExceeded,
    fetchReport: fetchReport as UseInfluencerReportReturn['fetchReport'],
  };
}
