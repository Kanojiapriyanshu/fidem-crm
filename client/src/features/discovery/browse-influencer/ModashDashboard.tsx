"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ResultsGrid } from "./ResultsGrid";
import { useInfluencerSearch } from "./useInfluencerSearch";
import type { FilterState, Platform } from "./filters";
import { SearchHeader } from "./SearchHeader";
import { DetailPanel } from "./DetailPanel";
import { useInfluencerReport } from "./useInfluencerReport";
import type { Platform as ReportPlatform } from "./types";
import { useEmailStatus } from "./useEmailStatus";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ModashReportLimitModal } from "./ModashReportLimitModal";

const DETAIL_PANEL_STORAGE_KEY = "brand_modash_detail_panel_state";
const SEARCH_UI_STORAGE_KEY = "brand_modash_search_ui_state";
const SEARCH_UI_RESTORE_KEY = "brand_modash_restore_search_after_reload";
const UPGRADE_PLAN_URL = "/brand/subscription";

type SavedDetailPanelState = {
  open: boolean;
  selectedId: string | null;
  selectedPlatform: ReportPlatform | null;
  selectedHandle: string | null;
};

type SavedSearchUiState = {
  queryText: string;
  platforms: Platform[];
  results: any[];
  total?: number;
  hasMore?: boolean;
};

type TierKey = "nano" | "micro" | "mid" | "macro" | "mega";

const DEFAULT_PLATFORM: Platform = "youtube";
const COUNTED_PLATFORMS: Platform[] = ["youtube", "instagram", "tiktok"];

const TIER_RANGES: Record<TierKey, { min: number; max?: number }> = {
  nano: { min: 1000, max: 10000 },
  micro: { min: 10000, max: 100000 },
  mid: { min: 100000, max: 500000 },
  macro: { min: 500000, max: 1000000 },
  mega: { min: 1000000, max: undefined },
};

const PLATFORM_FILTER_KEYS = [
  "followersMin",
  "followersMax",
  "avgViewsMin",
  "avgViewsMax",
  "engagementsMin",
  "engagementsMax",
  "engagementRateMin",
  "languageCode",
  "lastPostedDays",
  "lastposted",
  "locationIdsText",
  "bioQuery",
  "keywords",
  "relevance",
  "audienceRelevance",
  "textTags",
  "hasAudienceData",
  "contactEmailOnly",
  "followersGrowthInterval",
  "followersGrowthOperator",
  "followersGrowthValue",
  "viewsGrowthInterval",
  "viewsGrowthOperator",
  "viewsGrowthValue",
  "likesGrowthInterval",
  "likesGrowthOperator",
  "likesGrowthValue",
  "reelsPlaysMin",
  "reelsPlaysMax",
  "sharesMin",
  "sharesMax",
  "savesMin",
  "savesMax",
  "interestsIdsText",
  "brandsIdsText",
  "igAccountTypesText",
  "hasSponsoredPosts",
  "hasYouTube",
  "isOfficialArtist",
] as const;

function getInfluencerIdentity(influencer: any): string {
  return String(
    influencer?.userId ||
    influencer?.id ||
    influencer?.username ||
    influencer?.handle ||
    influencer?.url ||
    ""
  ).trim();
}

function toRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object") return {};
  return value as Record<string, unknown>;
}

function hasActiveFilterValue(value: unknown): boolean {
  if (value === undefined || value === null) return false;

  if (typeof value === "string") {
    return value.trim().length > 0;
  }

  if (typeof value === "boolean") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.length > 0;
  }

  if (typeof value === "number") {
    return Number.isFinite(value);
  }

  return true;
}

function countFilledFilterValues(values: unknown[]): number {
  return values.reduce<number>((total, value) => {
    return total + (hasActiveFilterValue(value) ? 1 : 0);
  }, 0);
}

function getFilterRoot(filters: FilterState): Record<string, unknown> {
  return toRecord(filters as unknown);
}

function getTier(filters: FilterState): TierKey | null {
  const root = getFilterRoot(filters);
  const influencer = toRecord(root.influencer);
  const value = String(influencer.tier || "");

  if (
    value === "nano" ||
    value === "micro" ||
    value === "mid" ||
    value === "macro" ||
    value === "mega"
  ) {
    return value;
  }

  return null;
}

function isTierGeneratedPlatformFollowerValue({
  key,
  value,
  tier,
}: {
  key: string;
  value: unknown;
  tier: TierKey | null;
}) {
  if (!tier) return false;

  const range = TIER_RANGES[tier];

  if (key === "followersMin") {
    return value === range.min;
  }

  if (key === "followersMax") {
    return value === range.max;
  }

  return false;
}

function countPlatformFilters(filters: FilterState): number {
  const root = getFilterRoot(filters);
  const platformRoot = toRecord(root.platform);
  const tier = getTier(filters);

  return COUNTED_PLATFORMS.reduce<number>((total, platform) => {
    const platformFilters = toRecord(platformRoot[platform]);

    const values = PLATFORM_FILTER_KEYS.map((key) => {
      const value = platformFilters[key];

      if (
        isTierGeneratedPlatformFollowerValue({
          key,
          value,
          tier,
        })
      ) {
        return undefined;
      }

      return value;
    });

    return total + countFilledFilterValues(values);
  }, 0);
}

function countMoreFilters(filters: FilterState): number {
  const root = getFilterRoot(filters);
  const search = toRecord(root.search);
  const influencer = toRecord(root.influencer);
  const audience = toRecord(root.audience);

  const searchMode =
    typeof search.mode === "string" ? search.mode : "combined";

  let total = 0;

  if (searchMode && searchMode !== "combined") {
    total += 1;
  }

  if (hasActiveFilterValue(influencer.tier)) {
    total += 1;
  }

  if (searchMode === "standard" && influencer.isVerified === true) {
    total += 1;
  } else if (!searchMode || searchMode === "combined") {
    if (influencer.isVerified === true) total += 1;
  }

  if (hasActiveFilterValue(influencer.gender)) {
    total += 1;
  }

  if (
    hasActiveFilterValue(influencer.ageMin) ||
    hasActiveFilterValue(influencer.ageMax)
  ) {
    total += 1;
  }

  if (hasActiveFilterValue(audience.country)) {
    total += 1;
  }

  return total;
}

export default function ModashDashboard() {

  const router = useRouter();
  const [platforms, setPlatforms] = useState<Platform[]>([DEFAULT_PLATFORM]);
  const [queryText, setQueryText] = useState("");
  const [brandId, setBrandId] = useState<string>("");
  const searchParams = useSearchParams();

  const campaignIdFromQuery = searchParams.get("campaignId") || "";
  const campaignNameFromQuery = searchParams.get("campaignName") || "";

  const [lockedCampaignName, setLockedCampaignName] = useState(campaignNameFromQuery);
  const [panelOpen, setPanelOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedPlatform, setSelectedPlatform] =
    useState<ReportPlatform | null>(null);
  const [selectedHandle, setSelectedHandle] = useState<string | null>(null);
  const [calculationMethod, setCalculationMethod] = useState<
    "median" | "average"
  >("average");
  const [selectedInfluencer, setSelectedInfluencer] = useState<any>(null);
  const [reportLimitModalOpen, setReportLimitModalOpen] = useState(false);

  const [restoredSearch, setRestoredSearch] =
    useState<SavedSearchUiState | null>(null);

  const latestSearchPayloadRef = useRef<SavedSearchUiState>({
    queryText: "",
    platforms: [DEFAULT_PLATFORM],
    results: [],
  });

  useEffect(() => {
    const id = localStorage.getItem("brandId") || "";
    if (id) setBrandId(id);
  }, []);
  useEffect(() => {
    if (!campaignIdFromQuery) return;

    if (campaignNameFromQuery) {
      setLockedCampaignName(campaignNameFromQuery);
      return;
    }

    try {
      const saved = sessionStorage.getItem("browseCampaignContext");
      if (!saved) return;

      const parsed = JSON.parse(saved);

      if (parsed?.campaignId === campaignIdFromQuery && parsed?.campaignName) {
        setLockedCampaignName(parsed.campaignName);
      }
    } catch { }
  }, [campaignIdFromQuery, campaignNameFromQuery]);
  const {
    report,
    rawReport,
    loading: loadingReport,
    error: reportError,
    limitExceeded,
    lastFetchedAt,
    clearLimitExceeded,
    fetchReport,
  } = useInfluencerReport();

  const { exists: emailExists, checkStatus } = useEmailStatus();


  useEffect(() => {
    if (limitExceeded) {
      setReportLimitModalOpen(true);
    }
  }, [limitExceeded]);

  const closeReportLimitModal = useCallback(() => {
    setReportLimitModalOpen(false);
    clearLimitExceeded();
  }, [clearLimitExceeded]);

  const handleUpgradePlan = useCallback(() => {
    closeReportLimitModal();

    if (typeof window !== "undefined") {
      window.location.href = UPGRADE_PLAN_URL;
    }
  }, [closeReportLimitModal]);

  const {
    searchState,
    filters,
    updateFilter,
    runSearch,
    resetFilters,
    loadMore,
    loadAll,
  } = useInfluencerSearch(platforms);

  const primaryPlatform: Platform = useMemo(
    () => platforms[0] ?? DEFAULT_PLATFORM,
    [platforms]
  );

  const platformFilterCount = useMemo<number>(
    () => countPlatformFilters(filters),
    [filters]
  );

  const moreFilterCount = useMemo<number>(
    () => countMoreFilters(filters),
    [filters]
  );

  const persistPanelState = useCallback((next: SavedDetailPanelState) => {
    if (typeof window === "undefined") return;

    window.sessionStorage.setItem(
      DETAIL_PANEL_STORAGE_KEY,
      JSON.stringify(next)
    );
  }, []);

  const clearPanelState = useCallback(() => {
    if (typeof window === "undefined") return;
    window.sessionStorage.removeItem(DETAIL_PANEL_STORAGE_KEY);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const shouldRestore =
      window.sessionStorage.getItem(SEARCH_UI_RESTORE_KEY) === "1";

    if (!shouldRestore) {
      window.sessionStorage.removeItem(SEARCH_UI_STORAGE_KEY);
      window.sessionStorage.removeItem(SEARCH_UI_RESTORE_KEY);
      return;
    }

    const rawSaved = window.sessionStorage.getItem(SEARCH_UI_STORAGE_KEY);

    window.sessionStorage.removeItem(SEARCH_UI_RESTORE_KEY);

    if (!rawSaved) return;

    try {
      const saved: SavedSearchUiState = JSON.parse(rawSaved);

      if (typeof saved?.queryText === "string") {
        setQueryText(saved.queryText);
      }

      if (Array.isArray(saved?.platforms) && saved.platforms.length) {
        setPlatforms(saved.platforms);
      }

      setRestoredSearch(saved);
      latestSearchPayloadRef.current = saved;
    } catch {
      window.sessionStorage.removeItem(SEARCH_UI_STORAGE_KEY);
      window.sessionStorage.removeItem(SEARCH_UI_RESTORE_KEY);
    }
  }, []);

  const visibleResults = useMemo(() => {
    if (Array.isArray(searchState.results) && searchState.results.length > 0) {
      return searchState.results;
    }

    return restoredSearch?.results ?? [];
  }, [searchState.results, restoredSearch]);

  const visibleTotal =
    searchState.total != null ? searchState.total : restoredSearch?.total;

  const visibleHasMore =
    typeof searchState.hasMore === "boolean"
      ? searchState.hasMore
      : restoredSearch?.hasMore;

  useEffect(() => {
    latestSearchPayloadRef.current = {
      queryText,
      platforms,
      results: visibleResults,
      total: visibleTotal,
      hasMore: visibleHasMore,
    };
  }, [queryText, platforms, visibleResults, visibleTotal, visibleHasMore]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let isBrowserLeaving = false;

    const saveSearchForRefresh = () => {
      isBrowserLeaving = true;

      window.sessionStorage.setItem(
        SEARCH_UI_STORAGE_KEY,
        JSON.stringify(latestSearchPayloadRef.current)
      );

      window.sessionStorage.setItem(SEARCH_UI_RESTORE_KEY, "1");
    };

    window.addEventListener("beforeunload", saveSearchForRefresh);

    return () => {
      window.removeEventListener("beforeunload", saveSearchForRefresh);

      if (!isBrowserLeaving) {
        window.sessionStorage.removeItem(SEARCH_UI_STORAGE_KEY);
        window.sessionStorage.removeItem(SEARCH_UI_RESTORE_KEY);
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const rawSaved = window.sessionStorage.getItem(DETAIL_PANEL_STORAGE_KEY);
    if (!rawSaved) return;

    try {
      const saved: SavedDetailPanelState = JSON.parse(rawSaved);

      if (!saved?.open || !saved?.selectedId || !saved?.selectedPlatform) {
        return;
      }

      setSelectedId(saved.selectedId);
      setSelectedPlatform(saved.selectedPlatform);
      setSelectedHandle(saved.selectedHandle ?? null);
      setPanelOpen(true);

      fetchReport(saved.selectedId, saved.selectedPlatform, calculationMethod);
    } catch {
      window.sessionStorage.removeItem(DETAIL_PANEL_STORAGE_KEY);
    }
  }, [fetchReport, calculationMethod]);

  useEffect(() => {
    if (selectedInfluencer || !selectedId) return;

    const matched = visibleResults.find(
      (item) => getInfluencerIdentity(item) === selectedId
    );

    if (matched) {
      setSelectedInfluencer(matched);
    }
  }, [selectedId, selectedInfluencer, visibleResults]);

  const onApplyFilters = useCallback(() => { }, []);

  const onViewProfile = useCallback(
    (influencer: any) => {
      const inferredPlatform = influencer?.platform as
        | ReportPlatform
        | undefined;

      if (!inferredPlatform) return;

      const idCandidate =
        influencer?.userId ||
        influencer?.id ||
        influencer?.username ||
        influencer?.handle ||
        influencer?.url;

      if (!idCandidate) return;

      const handleCandidate = influencer?.username ?? influencer?.handle ?? null;
      const idStr = String(idCandidate);

      setSelectedInfluencer(influencer);
      setSelectedId(idStr);
      setSelectedPlatform(inferredPlatform);
      setSelectedHandle(
        handleCandidate ? String(handleCandidate).replace(/^@/, "") : null
      );
      setPanelOpen(true);

      persistPanelState({
        open: true,
        selectedId: idStr,
        selectedPlatform: inferredPlatform,
        selectedHandle: handleCandidate
          ? String(handleCandidate).replace(/^@/, "")
          : null,
      });

      fetchReport(idStr, inferredPlatform, calculationMethod);

      if (handleCandidate) {
        const safeHandle = String(handleCandidate).startsWith("@")
          ? String(handleCandidate)
          : `@${String(handleCandidate)}`;

        checkStatus(safeHandle, inferredPlatform);
      }
    },
    [calculationMethod, checkStatus, fetchReport, persistPanelState]
  );

  const handlePanelClose = useCallback(() => {
    setPanelOpen(false);
    setSelectedId(null);
    setSelectedPlatform(null);
    setSelectedHandle(null);
    setSelectedInfluencer(null);
    clearPanelState();
  }, [clearPanelState]);

  const handleRefreshReport = useCallback(async () => {
    if (!selectedId || !selectedPlatform) return;

    await fetchReport(
      selectedId,
      selectedPlatform,
      calculationMethod,
      undefined,
      true
    );
  }, [calculationMethod, fetchReport, selectedId, selectedPlatform]);

  const handlePanelPlatformChange = useCallback(
    (profile: any) => {
      const nextPlatform = (profile?.provider ||
        profile?.platform) as ReportPlatform | undefined;

      const nextId =
        profile?.modashId ||
        profile?._id ||
        profile?.userId ||
        profile?.id;

      if (!nextPlatform || !nextId) return;

      const nextHandle = profile?.username ?? profile?.handle ?? null;
      const nextIdString = String(nextId);
      const nextHandleString = nextHandle
        ? String(nextHandle).replace(/^@/, "")
        : null;

      setSelectedId(nextIdString);
      setSelectedPlatform(nextPlatform);
      setSelectedHandle(nextHandleString);

      persistPanelState({
        open: true,
        selectedId: nextIdString,
        selectedPlatform: nextPlatform,
        selectedHandle: nextHandleString,
      });

      fetchReport(nextIdString, nextPlatform, calculationMethod);

      if (nextHandle) {
        const safeHandle = String(nextHandle).startsWith("@")
          ? String(nextHandle)
          : `@${String(nextHandle)}`;

        checkStatus(safeHandle, nextPlatform);
      }
    },
    [calculationMethod, checkStatus, fetchReport, persistPanelState]
  );

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-[1480px] px-4 py-4 sm:px-6 lg:px-8">
        <div className="space-y-5">
          <SearchHeader
            queryText={queryText}
            setQueryText={(text) => {
              setQueryText(text);

              if (restoredSearch) {
                setRestoredSearch(null);
              }
            }}
            loading={searchState.loading}
            onSearch={(q) => {
              setQueryText(q);
              setRestoredSearch(null);
              runSearch({ queryText: q });
            }}
            platforms={platforms}
            setPlatforms={setPlatforms}
            filters={filters}
            updateFilter={updateFilter}
            onResetFilters={() => {
              resetFilters();
              setQueryText("");
              setRestoredSearch(null);

              if (typeof window !== "undefined") {
                window.sessionStorage.removeItem(SEARCH_UI_STORAGE_KEY);
                window.sessionStorage.removeItem(SEARCH_UI_RESTORE_KEY);
              }
            }}
            onApplyFilters={onApplyFilters}
            platformFilterCount={platformFilterCount}
            moreFilterCount={moreFilterCount}
          />

          <ResultsGrid
            platform={primaryPlatform}
            results={visibleResults}
            loading={searchState.loading}
            error={searchState.error}
            total={visibleTotal}
            hasMore={visibleHasMore}
            onLoadMore={loadMore}
            onLoadAll={loadAll}
            onViewProfile={onViewProfile}
          />
        </div>
      </div>

      <DetailPanel
        open={panelOpen}
        onClose={handlePanelClose}
        loading={loadingReport}
        error={reportError}
        data={report}
        raw={rawReport}
        platform={selectedPlatform}
        onChangeCalc={(calc) => {
          setCalculationMethod(calc);

          if (selectedId && selectedPlatform) {
            fetchReport(selectedId, selectedPlatform, calc);

            persistPanelState({
              open: true,
              selectedId,
              selectedPlatform,
              selectedHandle,
            });
          }
        }}
        emailExists={emailExists}
        brandId={brandId}
        campaignId={campaignIdFromQuery}
        campaignName={lockedCampaignName}
        handle={selectedHandle}
        lastFetchedAt={lastFetchedAt}
        onRefreshReport={handleRefreshReport}
        connectedProfiles={
          selectedInfluencer?.socialProfiles ??
          selectedInfluencer?.connectedProfiles ??
          selectedInfluencer?.profiles ??
          []
        }
        onPlatformChange={handlePanelPlatformChange}
        onReportLimitExceeded={() => setReportLimitModalOpen(true)}
      />

      <ModashReportLimitModal
        open={reportLimitModalOpen}
        onClose={() => setReportLimitModalOpen(false)}
        onUpgrade={() => {
          setReportLimitModalOpen(false);
          router.push('/brand/subscriptions');
        }}
      />
    </div>
  );
}