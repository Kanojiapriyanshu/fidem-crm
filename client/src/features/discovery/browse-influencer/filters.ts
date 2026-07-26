export type Platform = "youtube" | "instagram" | "tiktok";

export type SearchMode = "combined" | "standard" | "ai";
export type GenderValue = "MALE" | "FEMALE" | "KNOWN" | "UNKNOWN";
export type AudienceGenderValue = "MALE" | "FEMALE";
export type AudienceAgeBucket = "13-17" | "18-24" | "25-34" | "35-44" | "45-64" | "65-";
export type GrowthOperator = "gte" | "gt" | "lt" | "lte";
export type GrowthInterval = "i1month" | "i2months" | "i3months" | "i4months" | "i5months" | "i6months";
export type AiContentType = "video" | "image";
export type AiAccountType = "creator" | "brand";

export interface PlatformFilterState {
  followersMin?: number;
  followersMax?: number;
  avgViewsMin?: number;
  avgViewsMax?: number;
  engagementsMin?: number;
  engagementsMax?: number;
  engagementRateMin?: number; // UI percent, backend expects 0..1
  languageCode?: string;
  lastPostedDays?: number;
  locationIdsText?: string;

  bioQuery?: string;
  keywords?: string;
  relevance?: string;
  audienceRelevance?: string;
  textTags?: string;

  hasAudienceData?: boolean;
  contactEmailOnly?: boolean;

  followersGrowthInterval?: GrowthInterval;
  followersGrowthOperator?: GrowthOperator;
  followersGrowthValue?: number;

  viewsGrowthInterval?: GrowthInterval;
  viewsGrowthOperator?: GrowthOperator;
  viewsGrowthValue?: number;

  likesGrowthInterval?: GrowthInterval;
  likesGrowthOperator?: GrowthOperator;
  likesGrowthValue?: number;

  reelsPlaysMin?: number;
  reelsPlaysMax?: number;
  sharesMin?: number;
  sharesMax?: number;
  savesMin?: number;
  savesMax?: number;

  interestsIdsText?: string;
  brandsIdsText?: string;
  igAccountTypesText?: string;

  hasSponsoredPosts?: boolean;
  hasYouTube?: boolean;
  isOfficialArtist?: boolean;
}

export interface InfluencerFilterState {
  isVerified?: boolean;
  ageMin?: number;
  ageMax?: number;
  gender?: GenderValue;
}

export interface AudienceFilterState {
  country?: string; // lightweight client-side filter
  locationIdsText?: string;
  locationWeight?: number;

  languageCode?: string;
  languageWeight?: number;

  gender?: AudienceGenderValue;
  genderWeight?: number;

  ageBucket?: AudienceAgeBucket;
  ageWeight?: number;

  interestsIdsText?: string;
  interestsWeight?: number;

  credibilityMin?: number;
}

export interface SearchSettingsState {
  mode: SearchMode;
  aiQuery?: string;
  exactHandleBoost?: boolean;
  aiHasEmail?: boolean;
  aiContentType?: AiContentType;
  aiMaxPostAgeMonths?: 3 | 6 | 9 | 12;
  aiUsername?: string;
  aiBrandsText?: string;
  aiAccountType?: AiAccountType;
}

export interface FilterState {
  search: SearchSettingsState;
  influencer: InfluencerFilterState;
  audience: AudienceFilterState;
  platform: Record<Platform, PlatformFilterState>;
}

export const PLATFORM_ORDER: Platform[] = ["youtube", "instagram", "tiktok"];

export const LANGUAGE_OPTIONS = [
  { label: "Any language", value: "" },
  { label: "English", value: "en" },
  { label: "Hindi", value: "hi" },
  { label: "Spanish", value: "es" },
  { label: "French", value: "fr" },
  { label: "German", value: "de" },
  { label: "Portuguese", value: "pt" },
  { label: "Arabic", value: "ar" },
  { label: "Japanese", value: "ja" },
  { label: "Korean", value: "ko" },
];

export const LAST_POSTED_OPTIONS = [
  { label: "Any time", value: undefined },
  { label: "30 days", value: 30 },
  { label: "60 days", value: 60 },
  { label: "90 days", value: 90 },
  { label: "180 days", value: 180 },
];

export const GROWTH_INTERVAL_OPTIONS: Array<{ label: string; value: GrowthInterval }> = [
  { label: "1 month", value: "i1month" },
  { label: "2 months", value: "i2months" },
  { label: "3 months", value: "i3months" },
  { label: "4 months", value: "i4months" },
  { label: "5 months", value: "i5months" },
  { label: "6 months", value: "i6months" },
];

export const GROWTH_OPERATOR_OPTIONS: Array<{ label: string; value: GrowthOperator }> = [
  { label: ">=", value: "gte" },
  { label: ">", value: "gt" },
  { label: "<=", value: "lte" },
  { label: "<", value: "lt" },
];

export const SEARCH_MODE_OPTIONS: Array<{ label: string; value: SearchMode }> = [
  { label: "Combined", value: "combined" },
  { label: "Standard only", value: "standard" },
  { label: "AI only", value: "ai" },
];

export const AI_CONTENT_TYPE_OPTIONS: Array<{ label: string; value: AiContentType | "" }> = [
  { label: "Any content", value: "" },
  { label: "Video", value: "video" },
  { label: "Image", value: "image" },
];

export const AI_ACCOUNT_TYPE_OPTIONS: Array<{ label: string; value: AiAccountType | "" }> = [
  { label: "Any account type", value: "" },
  { label: "Creator", value: "creator" },
  { label: "Brand", value: "brand" },
];

export const AUDIENCE_AGE_OPTIONS: Array<{ label: string; value: AudienceAgeBucket | "" }> = [
  { label: "Any age bucket", value: "" },
  { label: "13-17", value: "13-17" },
  { label: "18-24", value: "18-24" },
  { label: "25-34", value: "25-34" },
  { label: "35-44", value: "35-44" },
  { label: "45-64", value: "45-64" },
  { label: "65+", value: "65-" },
];

export const AUDIENCE_GENDER_OPTIONS: Array<{ label: string; value: AudienceGenderValue | "" }> = [
  { label: "Any audience gender", value: "" },
  { label: "Male", value: "MALE" },
  { label: "Female", value: "FEMALE" },
];

export const INFLUENCER_GENDER_OPTIONS: Array<{ label: string; value: GenderValue | "" }> = [
  { label: "Any influencer gender", value: "" },
  { label: "Male", value: "MALE" },
  { label: "Female", value: "FEMALE" },
  { label: "Known", value: "KNOWN" },
  { label: "Unknown", value: "UNKNOWN" },
];

export const DEFAULT_PLATFORM_FILTERS: PlatformFilterState = {
  followersMin: undefined,
  followersMax: undefined,
  avgViewsMin: undefined,
  avgViewsMax: undefined,
  engagementsMin: undefined,
  engagementsMax: undefined,
  engagementRateMin: undefined,
  languageCode: undefined,
  lastPostedDays: undefined,
  locationIdsText: undefined,

  bioQuery: undefined,
  keywords: undefined,
  relevance: undefined,
  audienceRelevance: undefined,
  textTags: undefined,

  hasAudienceData: undefined,
  contactEmailOnly: undefined,

  followersGrowthInterval: undefined,
  followersGrowthOperator: undefined,
  followersGrowthValue: undefined,

  viewsGrowthInterval: undefined,
  viewsGrowthOperator: undefined,
  viewsGrowthValue: undefined,

  likesGrowthInterval: undefined,
  likesGrowthOperator: undefined,
  likesGrowthValue: undefined,

  reelsPlaysMin: undefined,
  reelsPlaysMax: undefined,
  sharesMin: undefined,
  sharesMax: undefined,
  savesMin: undefined,
  savesMax: undefined,

  interestsIdsText: undefined,
  brandsIdsText: undefined,
  igAccountTypesText: undefined,

  hasSponsoredPosts: undefined,
  hasYouTube: undefined,
  isOfficialArtist: undefined,
};

export const DEFAULT_FILTER_STATE: FilterState = {
  search: {
    mode: "combined",
    aiQuery: undefined,
    exactHandleBoost: undefined,
    aiHasEmail: undefined,
    aiContentType: undefined,
    aiMaxPostAgeMonths: undefined,
    aiUsername: undefined,
    aiBrandsText: undefined,
    aiAccountType: undefined,
  },
  influencer: {
    isVerified: undefined,
    ageMin: undefined,
    ageMax: undefined,
    gender: undefined,
  },
  audience: {
    country: undefined,
    locationIdsText: undefined,
    locationWeight: undefined,
    languageCode: undefined,
    languageWeight: undefined,
    gender: undefined,
    genderWeight: undefined,
    ageBucket: undefined,
    ageWeight: undefined,
    interestsIdsText: undefined,
    interestsWeight: undefined,
    credibilityMin: undefined,
  },
  platform: {
    youtube: { ...DEFAULT_PLATFORM_FILTERS },
    instagram: { ...DEFAULT_PLATFORM_FILTERS },
    tiktok: { ...DEFAULT_PLATFORM_FILTERS },
  },
};

export function createDefaultFilters(): FilterState {
  return {
    search: { ...DEFAULT_FILTER_STATE.search },
    influencer: { ...DEFAULT_FILTER_STATE.influencer },
    audience: { ...DEFAULT_FILTER_STATE.audience },
    platform: {
      youtube: { ...DEFAULT_PLATFORM_FILTERS },
      instagram: { ...DEFAULT_PLATFORM_FILTERS },
      tiktok: { ...DEFAULT_PLATFORM_FILTERS },
    },
  };
}

export function languageCodeToLabel(code?: string): string {
  return LANGUAGE_OPTIONS.find((item) => item.value === (code || ""))?.label || "Any language";
}

export function lastPostedDaysToLabel(days?: number): string {
  return LAST_POSTED_OPTIONS.find((item) => item.value === days)?.label || "Any time";
}

export function normalizeInfluencerAgeRange(
  min?: number,
  max?: number,
): { min?: number; max?: number } | undefined {
  const allowed = [18, 25, 35, 45, 65];

  const normalizedMin =
    min == null ? undefined : allowed.find((value) => min <= value) ?? allowed[allowed.length - 1];

  const normalizedMax =
    max == null
      ? undefined
      : [...allowed].reverse().find((value) => max >= value) ?? allowed[0];

  if (normalizedMin == null && normalizedMax == null) return undefined;
  if (normalizedMin != null && normalizedMax != null && normalizedMin > normalizedMax) {
    return { min: normalizedMax, max: normalizedMin };
  }

  return { min: normalizedMin, max: normalizedMax };
}

export function isFilled(value: unknown): boolean {
  if (value == null) return false;
  if (typeof value === "string") return value.trim() !== "";
  if (typeof value === "number") return Number.isFinite(value);
  if (typeof value === "boolean") return value;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.values(value as Record<string, unknown>).some(isFilled);
  return false;
}

function countAgainstDefault(current: any, baseline: any): number {
  const currentIsObject = current && typeof current === "object" && !Array.isArray(current);
  const baselineIsObject = baseline && typeof baseline === "object" && !Array.isArray(baseline);

  if (currentIsObject || baselineIsObject) {
    const keys = new Set([
      ...Object.keys(current || {}),
      ...Object.keys(baseline || {}),
    ]);

    let total = 0;
    keys.forEach((key) => {
      total += countAgainstDefault(current?.[key], baseline?.[key]);
    });
    return total;
  }

  if (Array.isArray(current) || Array.isArray(baseline)) {
    const a = JSON.stringify(current ?? []);
    const b = JSON.stringify(baseline ?? []);
    return a === b ? 0 : isFilled(current) ? 1 : 0;
  }

  if (current === baseline) return 0;
  return isFilled(current) ? 1 : 0;
}

export function countActiveFilters(filters: FilterState): number {
  return countAgainstDefault(filters, createDefaultFilters());
}

export function setNestedFilterValue<T extends Record<string, any>>(
  state: T,
  path: string,
  value: unknown,
): T {
  const keys = path.split(".");
  const clone: Record<string, any> = Array.isArray(state) ? [...state] : { ...state };

  let cursor: Record<string, any> = clone;
  for (let i = 0; i < keys.length; i += 1) {
    const key = keys[i];
    const isLast = i === keys.length - 1;

    if (isLast) {
      if (value === undefined || value === null || value === "") {
        delete cursor[key];
      } else {
        cursor[key] = value;
      }
      break;
    }

    const current = cursor[key];
    cursor[key] =
      current && typeof current === "object" && !Array.isArray(current)
        ? { ...current }
        : {};
    cursor = cursor[key];
  }

  return clone as T;
}