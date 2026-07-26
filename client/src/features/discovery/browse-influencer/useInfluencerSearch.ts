"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import type { FilterState, Platform } from "./filters";
import {
  createDefaultFilters,
  normalizeInfluencerAgeRange,
  setNestedFilterValue,
} from "./filters";

const PAGE_SIZE = 24;
const REQUEST_PAGE = 1;
const REQUEST_LIMIT = 15;

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
const API_USERS_ENDPOINT =
  process.env.NEXT_PUBLIC_MODASH_FRONTEND_USERS_ENDPOINT ||
  `${API_BASE}/modash/users`;
const API_UNIFIED_ENDPOINT =
  process.env.NEXT_PUBLIC_MODASH_FRONTEND_UNIFIED_SEARCH_ENDPOINT ||
  `${API_BASE}/modash/search-unified`;

type SearchArgs = {
  queryText?: string;
};

type BackendResult = {
  id?: string | number;
  userId?: string | number;
  username?: string;
  handle?: string;
  fullname?: string;
  fullName?: string;
  name?: string;
  followers?: number;
  followersCount?: number;
  engagementRate?: number;
  picture?: string;
  avatar?: string;
  profilePicture?: string;
  url?: string;
  link?: string;
  platform?: Platform;
  isVerified?: boolean;
  verifiedStatus?: boolean;
  location?: string;
  country?: string;
  state?: string;
  city?: string;
  categories?: string[];
  category?: string;
  primaryCategory?: string;
  matchedPosts?: any[];
  recentPosts?: any[];
  aiMatchedPostsCount?: number;
  accountCategory?: string;
  searchType?: "exact" | "standard" | "ai" | "combined";
};

export type UiResult = {
  id: string;
  userId?: string;
  username: string;
  handle?: string;
  fullname?: string;
  name: string;
  followers: number;
  engagementRate: number;
  picture?: string;
  avatar?: string;
  url?: string;
  link?: string;
  platform: Platform;
  isVerified?: boolean;
  verifiedStatus?: boolean;
  location?: string;
  country?: string;
  state?: string;
  city?: string;
  categories?: string[];
  matchedPosts?: any[];
  recentPosts?: any[];
  aiMatchedPostsCount?: number;
  accountCategory?: string;
  searchType?: "exact" | "standard" | "ai" | "combined";
};

type SearchState = {
  loading: boolean;
  error: string | null;
  results: UiResult[];
  total: number;
  hasMore: boolean;
  rawResponse: unknown;
};

type SearchMode = "ai" | "standard" | "combined";

function getBrandIdFromStorage(): string {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem("brandId") || "";
  } catch {
    return "";
  }
}

function cleanText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function toNumber(value: unknown): number | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
}

function splitCommaList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseCountries(value?: string): string[] {
  return splitCommaList(cleanText(value));
}

function parseTextTags(
  value?: string
): Array<{ type: "hashtag" | "mention"; value: string }> {
  const tokens = splitCommaList(cleanText(value));
  const out: Array<{ type: "hashtag" | "mention"; value: string }> = [];

  for (const token of tokens) {
    const lower = token.toLowerCase();

    if (token.startsWith("#")) {
      out.push({ type: "hashtag", value: token.slice(1) });
      continue;
    }

    if (token.startsWith("@")) {
      out.push({ type: "mention", value: token.slice(1) });
      continue;
    }

    if (lower.startsWith("hashtag:")) {
      out.push({ type: "hashtag", value: token.slice(8).trim() });
      continue;
    }

    if (lower.startsWith("mention:")) {
      out.push({ type: "mention", value: token.slice(8).trim() });
      continue;
    }
  }

  return out.filter((item) => item.value);
}

function extractExplicitHandles(queryText: string): string[] {
  const found = new Set<string>();
  const value = queryText.trim();

  for (const match of value.matchAll(
    /(?:instagram\.com\/|tiktok\.com\/@|youtube\.com\/@)([A-Za-z0-9._-]{2,30})/gi
  )) {
    found.add(match[1]);
  }

  for (const match of value.matchAll(/(^|\s)@([A-Za-z0-9._-]{2,30})\b/g)) {
    found.add(match[2]);
  }

  return Array.from(found);
}

function minDefined(values: Array<number | undefined>): number | undefined {
  const nums = values.filter(
    (value): value is number => value != null && Number.isFinite(value)
  );
  return nums.length ? Math.min(...nums) : undefined;
}

function maxDefined(values: Array<number | undefined>): number | undefined {
  const nums = values.filter(
    (value): value is number => value != null && Number.isFinite(value)
  );
  return nums.length ? Math.max(...nums) : undefined;
}

function firstDefined<T>(values: Array<T | undefined>): T | undefined {
  return values.find((value) => value !== undefined);
}

function uniqStrings(values: Array<string | undefined>): string[] {
  const out: string[] = [];
  const seen = new Set<string>();

  for (const value of values) {
    const clean = cleanText(value);
    if (!clean) continue;

    const key = clean.toLowerCase();
    if (seen.has(key)) continue;

    seen.add(key);
    out.push(clean);
  }

  return out;
}

function setMinMaxRange(
  target: Record<string, any>,
  key: string,
  min?: number,
  max?: number
) {
  if (min == null && max == null) return;

  target[key] = {
    ...(min != null ? { min } : {}),
    ...(max != null ? { max } : {}),
  };
}

function uiResultScore(item: UiResult): number {
  const searchType = item.searchType || "standard";
  let score = 0;

  if (searchType === "combined") score += 500;
  else if (searchType === "exact") score += 400;
  else if (searchType === "ai") score += 300;
  else score += 100;

  if (item.isVerified) score += 25;
  score += Math.min(item.aiMatchedPostsCount || 0, 10) * 12;
  score += Math.min(Math.log10((item.followers || 0) + 1) * 12, 60);
  score += Math.min((item.engagementRate || 0) * 100, 20);

  return score;
}

function mergeResultsPreserveOrder(items: UiResult[]): UiResult[] {
  const keyToIndex = new Map<string, number>();
  const out: UiResult[] = [];

  for (const item of items) {
    const key = `${item.platform}:${item.userId || item.username || item.id}`.toLowerCase();
    const existingIndex = keyToIndex.get(key);

    if (existingIndex == null) {
      keyToIndex.set(key, out.length);
      out.push(item);
      continue;
    }

    const prev = out[existingIndex];
    const preferred = uiResultScore(item) >= uiResultScore(prev) ? item : prev;
    const other = preferred === item ? prev : item;

    out[existingIndex] = {
      ...other,
      ...preferred,
      categories: uniqStrings([
        ...(other.categories || []),
        ...(preferred.categories || []),
      ]),
      matchedPosts:
        (preferred.matchedPosts && preferred.matchedPosts.length
          ? preferred.matchedPosts
          : other.matchedPosts) || [],
      recentPosts:
        (preferred.recentPosts && preferred.recentPosts.length
          ? preferred.recentPosts
          : other.recentPosts) || [],
      aiMatchedPostsCount: Math.max(
        Number(other.aiMatchedPostsCount || 0),
        Number(preferred.aiMatchedPostsCount || 0)
      ),
      searchType:
        prev.searchType && item.searchType && prev.searchType !== item.searchType
          ? "combined"
          : preferred.searchType,
    };
  }

  return out;
}

function mapBackendResult(
  item: BackendResult,
  fallbackPlatform: Platform,
  source: "exact" | "standard" | "ai" | "combined" = "standard"
): UiResult | null {
  const platform = item.platform || fallbackPlatform;
  const id = String(
    item.userId ||
    item.id ||
    item.username ||
    item.handle ||
    item.url ||
    item.link ||
    ""
  ).trim();

  if (!id) return null;

  const username = cleanText(item.username || item.handle || "");
  const handle = cleanText(item.handle || item.username || "") || undefined;
  const fullname = cleanText(
    item.fullname || item.fullName || item.name || username || handle || "Unknown"
  );
  const location =
    cleanText(item.location) ||
    [item.city, item.state, item.country].filter(Boolean).join(", ") ||
    undefined;

  const categories = Array.isArray(item.categories)
    ? item.categories
    : uniqStrings([item.category, item.primaryCategory]);

  return {
    id,
    userId: item.userId != null ? String(item.userId) : undefined,
    username,
    handle,
    fullname,
    name: fullname,
    followers: Number(item.followers || item.followersCount || 0),
    engagementRate: Number(item.engagementRate || 0),
    picture: cleanText(item.picture || item.avatar || item.profilePicture) || undefined,
    avatar: cleanText(item.avatar || item.picture || item.profilePicture) || undefined,
    url: cleanText(item.url || item.link) || undefined,
    link: cleanText(item.link || item.url) || undefined,
    platform,
    isVerified: item.isVerified ?? item.verifiedStatus,
    verifiedStatus: item.verifiedStatus ?? item.isVerified,
    location,
    country: cleanText(item.country) || undefined,
    state: cleanText(item.state) || undefined,
    city: cleanText(item.city) || undefined,
    categories,
    matchedPosts: Array.isArray(item.matchedPosts) ? item.matchedPosts : [],
    recentPosts: Array.isArray(item.recentPosts) ? item.recentPosts : [],
    aiMatchedPostsCount: Number(item.aiMatchedPostsCount || item.matchedPosts?.length || 0),
    accountCategory: cleanText(item.accountCategory) || undefined,
    searchType: item.searchType || source,
  };
}

function applyClientFilters(items: UiResult[], filters: FilterState): UiResult[] {
  const country = cleanText(filters.audience.country).toLowerCase();
  if (!country) return items;

  return items.filter((item) => {
    const haystack = [item.country, item.location]
      .map((value) => cleanText(value).toLowerCase())
      .filter(Boolean);

    return haystack.some((value) => value.includes(country));
  });
}

function buildMergedInfluencerPayload(
  queryText: string,
  filters: FilterState,
  selectedPlatforms: Platform[]
) {
  const globalInfluencer = filters.influencer;
  const selectedPlatformFilters = selectedPlatforms.map(
    (platform) => filters.platform[platform] || {}
  );
  const singlePlatform =
    selectedPlatforms.length === 1 ? selectedPlatforms[0] : null;

  const influencer: Record<string, any> = {};

  if (globalInfluencer.isVerified) {
    influencer.isVerified = true;
  }

  setMinMaxRange(
    influencer,
    "followers",
    minDefined(selectedPlatformFilters.map((item) => toNumber(item.followersMin))),
    maxDefined(selectedPlatformFilters.map((item) => toNumber(item.followersMax)))
  );

  setMinMaxRange(
    influencer,
    "views",
    minDefined(selectedPlatformFilters.map((item) => toNumber(item.avgViewsMin))),
    maxDefined(selectedPlatformFilters.map((item) => toNumber(item.avgViewsMax)))
  );

  const language = firstDefined(
    selectedPlatformFilters.map((item) => cleanText(item.languageCode) || undefined)
  );
  if (language) {
    influencer.language = language;
  }

  const engagementRateMin = minDefined(
    selectedPlatformFilters.map((item) => toNumber(item.engagementRateMin))
  );
  if (engagementRateMin != null) {
    influencer.engagementRate = { min: engagementRateMin };
  }

  const lastposted = minDefined(
    selectedPlatformFilters.map((item) => toNumber(item.lastPostedDays))
  );
  if (lastposted != null) {
    influencer.lastposted = lastposted;
  }

  const explicitHandles = extractExplicitHandles(queryText);
  const keywordQuery = cleanText(queryText);
  const platformKeywords = firstDefined(
    selectedPlatformFilters.map((item) => cleanText(item.keywords) || undefined)
  );

  if (platformKeywords) {
    influencer.keywords = platformKeywords;
  } else if (keywordQuery && explicitHandles.length === 0) {
    influencer.keywords = keywordQuery;
  }

  const normalizedAge = normalizeInfluencerAgeRange(
    globalInfluencer.ageMin,
    globalInfluencer.ageMax
  );
  if (normalizedAge) {
    influencer.age = normalizedAge;
  }

  if (globalInfluencer.gender) {
    influencer.gender = globalInfluencer.gender;
  }

  const countries = parseCountries(filters.audience.country);
  if (countries.length) {
    influencer.locations = { countries };
  }

  if (singlePlatform === "youtube") {
    const platformFilter = filters.platform.youtube || {};
    const bio = cleanText(platformFilter.bioQuery);
    if (bio) {
      influencer.bio = bio;
    }
  }

  if (singlePlatform === "instagram") {
    const platformFilter = filters.platform.instagram || {};

    setMinMaxRange(
      influencer,
      "reelsPlays",
      toNumber(platformFilter.reelsPlaysMin),
      toNumber(platformFilter.reelsPlaysMax)
    );

    if (platformFilter.hasSponsoredPosts) {
      influencer.sponsoredPostsOnly = true;
    }
  }

  if (singlePlatform === "tiktok") {
    const platformFilter = filters.platform.tiktok || {};

    setMinMaxRange(
      influencer,
      "engagements",
      toNumber(platformFilter.engagementsMin),
      toNumber(platformFilter.engagementsMax)
    );

    const textTags = parseTextTags(platformFilter.textTags);
    if (textTags.length) {
      influencer.textTags = textTags;
    }
  }

  return influencer;
}

function buildStandardSearchBody(
  queryText: string,
  filters: FilterState,
  selectedPlatforms: Platform[]
) {
  return {
    page: 0,
    calculationMethod: "median" as const,
    sort: {
      field: "followers",
      direction: "desc" as const,
    },
    filter: {
      influencer: buildMergedInfluencerPayload(queryText, filters, selectedPlatforms),
    },
  };
}

function buildAiPayload(
  queryText: string,
  filters: FilterState,
  selectedPlatforms: Platform[]
) {
  const selectedPlatformFilters = selectedPlatforms.map(
    (platform) => filters.platform[platform] || {}
  );

  const aiFilters: Record<string, any> = {};

  if (filters.influencer.isVerified) {
    aiFilters.isVerified = true;
  }

  setMinMaxRange(
    aiFilters,
    "followers",
    minDefined(selectedPlatformFilters.map((item) => toNumber(item.followersMin))),
    maxDefined(selectedPlatformFilters.map((item) => toNumber(item.followersMax)))
  );

  setMinMaxRange(
    aiFilters,
    "views",
    minDefined(selectedPlatformFilters.map((item) => toNumber(item.avgViewsMin))),
    maxDefined(selectedPlatformFilters.map((item) => toNumber(item.avgViewsMax)))
  );

  const language = firstDefined(
    selectedPlatformFilters.map((item) => cleanText(item.languageCode) || undefined)
  );
  if (language) {
    aiFilters.language = language;
  }

  const engagementRateMin = minDefined(
    selectedPlatformFilters.map((item) => toNumber(item.engagementRateMin))
  );
  if (engagementRateMin != null) {
    aiFilters.engagementRate = { min: engagementRateMin };
  }

  const lastposted = minDefined(
    selectedPlatformFilters.map((item) => toNumber(item.lastPostedDays))
  );
  if (lastposted != null) {
    aiFilters.lastposted = lastposted;
  }

  const normalizedAge = normalizeInfluencerAgeRange(
    filters.influencer.ageMin,
    filters.influencer.ageMax
  );
  if (normalizedAge) {
    aiFilters.age = normalizedAge;
  }

  if (filters.influencer.gender) {
    aiFilters.gender = filters.influencer.gender;
  }

  const countries = parseCountries(filters.audience.country);
  if (countries.length) {
    aiFilters.countries = countries;
  }

  return {
    page: 0,
    query: cleanText(filters.search.aiQuery || queryText),
    filters: aiFilters,
  };
}

function buildUnifiedPayload(
  queryText: string,
  filters: FilterState,
  platforms: Platform[]
) {
  const selectedPlatforms = platforms.length
    ? platforms
    : (["youtube"] as Platform[]);

  const requestedMode = (filters.search.mode || "combined") as SearchMode;

  const payload: Record<string, any> = {
    brandId: getBrandIdFromStorage(),
    platforms: selectedPlatforms,
    page: REQUEST_PAGE,
    limit: REQUEST_LIMIT,
    searchMode: requestedMode,
    query: cleanText(queryText),
  };

  if (requestedMode === "ai") {
    payload.ai = buildAiPayload(queryText, filters, selectedPlatforms);
  } else if (requestedMode === "standard") {
    payload.body = buildStandardSearchBody(queryText, filters, selectedPlatforms);
  } else if (requestedMode === "combined") {
    payload.body = buildStandardSearchBody(queryText, filters, selectedPlatforms);
  }

  return {
    payload,
    effectiveMode: requestedMode,
    shouldRunAi: requestedMode === "ai",
  };
}

export function useInfluencerSearch(platforms: Platform[]) {
  const [filters, setFilters] = useState<FilterState>(createDefaultFilters());
  const [allResults, setAllResults] = useState<UiResult[]>([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRaw, setLastRaw] = useState<unknown>(null);
  const lastQueryRef = useRef("");

  const updateFilter = useCallback((path: string, value: unknown) => {
    setFilters((current) => setNestedFilterValue(current, path, value));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(createDefaultFilters());
  }, []);

  const fetchExactUsers = useCallback(
    async (queryText: string): Promise<UiResult[]> => {
      const handles = extractExplicitHandles(queryText);
      if (!handles.length) return [];

      const search = new URLSearchParams({
        q: handles.join(","),
        platforms: (platforms.length ? platforms : ["youtube"]).join(","),
      });

      const response = await fetch(`${API_USERS_ENDPOINT}?${search.toString()}`);
      const data = await response.json().catch(() => ({}));

      if (!response.ok || !Array.isArray(data?.results)) return [];

      return data.results
        .map((item: BackendResult) =>
          mapBackendResult(item, platforms[0] || "youtube", "exact")
        )
        .filter(Boolean) as UiResult[];
    },
    [platforms]
  );

  const runSearch = useCallback(
    async ({ queryText = "" }: SearchArgs = {}) => {
      const value = queryText.trim();
      lastQueryRef.current = value;

      const brandId = getBrandIdFromStorage();
      if (!brandId) {
        setError("brandId is missing in localStorage.");
        setAllResults([]);
        setVisibleCount(PAGE_SIZE);
        return;
      }

      const { payload, effectiveMode, shouldRunAi } = buildUnifiedPayload(
        value,
        filters,
        platforms
      );

      setLoading(true);
      setError(null);
      setVisibleCount(PAGE_SIZE);

      try {
        const response = await fetch(API_UNIFIED_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const unifiedData = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(unifiedData?.error || "Unified search failed");
        }

        const fallbackPlatform = (payload.platforms?.[0] || "youtube") as Platform;

        const unifiedResults = Array.isArray(unifiedData?.results)
          ? (unifiedData.results
            .map((item: BackendResult) =>
              mapBackendResult(
                item,
                item.platform || fallbackPlatform,
                item.searchType || "standard"
              )
            )
            .filter(Boolean) as UiResult[])
          : [];

        const merged = mergeResultsPreserveOrder(unifiedResults);
        const filtered = applyClientFilters(merged, filters);

        setAllResults(filtered);
        setLastRaw({
          unified: unifiedData,
          exact: [],
          payload,
          effectiveMode,
          shouldRunExact: false,
          shouldRunAi,
        });

        if (!filtered.length) {
          setError(null);
        }
      } catch (err: any) {
        setError(err?.message || "Search failed.");
        setAllResults([]);
        setLastRaw(null);
      } finally {
        setLoading(false);
      }
    },
    [filters, platforms]
  );

  const loadMore = useCallback(() => {
    setVisibleCount((count) => Math.min(count + PAGE_SIZE, allResults.length));
  }, [allResults.length]);

  const loadAll = useCallback(() => {
    setVisibleCount(allResults.length);
  }, [allResults.length]);

  const visibleResults = useMemo(
    () => allResults.slice(0, visibleCount),
    [allResults, visibleCount]
  );

  const searchState: SearchState = useMemo(
    () => ({
      loading,
      error,
      results: visibleResults,
      total: allResults.length,
      hasMore: visibleCount < allResults.length,
      rawResponse: lastRaw,
    }),
    [allResults.length, error, lastRaw, loading, visibleCount, visibleResults]
  );

  return {
    searchState,
    filters,
    updateFilter,
    runSearch,
    resetFilters,
    loadMore,
    loadAll,
    buildPayload: () =>
      buildUnifiedPayload(lastQueryRef.current, filters, platforms).payload,
  };
}