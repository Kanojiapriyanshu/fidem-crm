import {
  type Audience,
  type AudienceSummary,
  type InfluencerHeader,
  type InfluencerProfile,
  type MiniUser,
  type ModashAudienceRaw,
  type ModashMiniUserRaw,
  type ModashPostRaw,
  type ModashProfileRaw,
  type ModashReportRaw,
  type Platform,
  type RecentPost,
  type ReportResponse,
  type StatHistoryEntry,
  type WeightedItem,
} from "./types";

export function pruneEmpty<T>(obj: T): T {
  if (obj && typeof obj === "object") {
    for (const key of Object.keys(obj as any)) {
      const value = (obj as any)[key];
      if (value == null) {
        delete (obj as any)[key];
        continue;
      }
      if (Array.isArray(value)) {
        if (value.length === 0) {
          delete (obj as any)[key];
          continue;
        }
      } else if (typeof value === "object") {
        (obj as any)[key] = pruneEmpty(value);
        if (Object.keys((obj as any)[key]).length === 0) delete (obj as any)[key];
      }
      if (typeof value === "number" && Number.isNaN(value)) delete (obj as any)[key];
    }
  }
  return obj;
}

export function nfmt(n?: number) {
  if (n == null || Number.isNaN(n)) return "—";
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(Math.round(n));
}

export function pfmt(x?: number, digits = 2) {
  if (x == null || Number.isNaN(x)) return "—";
  return `${(x * 100).toFixed(digits)}%`;
}

export function titleCase(value?: string) {
  if (!value) return "—";
  const text = value.toString();
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

export function prettyPlace(country?: string, city?: string, state?: string) {
  const cityPretty = city
    ? city
        .split(" ")
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(" ")
    : "";
  const statePretty = state ? `, ${state}` : "";
  return `${country || "—"}${cityPretty ? ` · ${cityPretty}${statePretty}` : ""}`;
}

export function pct(x?: number) {
  if (x == null || Number.isNaN(x)) return "—";
  return `${Math.round(x * 100)}%`;
}

export function topN<T>(arr: T[] | undefined | null, n = 5): T[] {
  return Array.isArray(arr) ? arr.filter(Boolean).slice(0, n) : [];
}

export function getMedian(agg: any, field: "likes" | "comments" | "views"): number | undefined {
  if (!agg) return undefined;

  const known =
    typeof agg[`median_${field}`] === "number"
      ? agg[`median_${field}`]
      : typeof agg[`p50_${field}`] === "number"
      ? agg[`p50_${field}`]
      : typeof agg?.medians?.[field] === "number"
      ? agg.medians[field]
      : typeof agg?.percentiles?.[field]?.p50 === "number"
      ? agg.percentiles[field].p50
      : typeof agg?.p50?.[field] === "number"
      ? agg.p50[field]
      : undefined;

  if (typeof known === "number") return known;

  const arr = Array.isArray(agg?.items)
    ? agg.items.map((item: any) => item?.[field])
    : Array.isArray(agg?.values)
    ? agg.values
    : Array.isArray(agg?.[field])
    ? agg[field]
    : [];

  const nums = (arr as any[])
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value))
    .sort((a, b) => a - b);

  if (!nums.length) return undefined;
  const mid = Math.floor(nums.length / 2);
  return nums.length % 2 ? nums[mid] : (nums[mid - 1] + nums[mid]) / 2;
}

const mapMiniUser = (user?: ModashMiniUserRaw): MiniUser | null => {
  if (!user || user.userId == null) return null;
  return {
    userId: user.userId,
    url: user.url,
    picture: user.picture,
    fullname: user.fullname,
    username: user.username ?? user.handle,
    followers: user.followers,
  };
};

const mapMiniUserList = (list?: ModashMiniUserRaw[]): MiniUser[] =>
  (list || []).map(mapMiniUser).filter((item): item is MiniUser => Boolean(item));

const mapPost = (post?: ModashPostRaw): RecentPost | null => {
  if (!post || post.id == null) return null;
  return {
    id: post.id,
    url: post.url,
    thumbnail: post.thumbnail,
    image: post.image,
    video: Boolean(post.video),
    title: post.title,
    text: post.text,
    type: post.type,
    likes: post.likes,
    comments: post.comments,
    views: post.views,
    hashtags: post.hashtags,
    created: post.created,
  };
};

const mapPostList = (list?: ModashPostRaw[]): RecentPost[] =>
  (list || []).map(mapPost).filter((item): item is RecentPost => Boolean(item));

const mapWeightedList = (list?: any[]): WeightedItem[] =>
  (list || []).map((item: any) => ({
    name: item?.name,
    code: item?.code,
    weight: typeof item?.weight === "number" ? item.weight : undefined,
  }));

export function normalizeReport(raw: ModashReportRaw, platform: Platform): ReportResponse {
  const profileRaw: ModashProfileRaw = raw?.profile || {};
  const headerRaw = profileRaw.profile || {};

  const header: InfluencerHeader = {
    picture: headerRaw.picture,
    fullname: headerRaw.fullname,
    username: headerRaw.username,
    handle: headerRaw.handle,
    url: headerRaw.url,
    followers: headerRaw.followers,
    engagementRate: headerRaw.engagementRate,
  };

  const audienceRaw: ModashAudienceRaw = profileRaw.audience || {};
  const audience: Audience & AudienceSummary = {
    genders: mapWeightedList(audienceRaw.genders),
    ages: mapWeightedList(audienceRaw.ages),
    geoCountries: mapWeightedList(audienceRaw.geoCountries),
    languages: mapWeightedList(audienceRaw.languages),
    ethnicities: mapWeightedList(audienceRaw.ethnicities),
    audienceTypes: mapWeightedList(audienceRaw.audienceTypes),
    audienceReachability: mapWeightedList(audienceRaw.audienceReachability),
    notable: audienceRaw.notable,
    credibility: audienceRaw.credibility,
  };

  const language =
    profileRaw.language ||
    (audienceRaw.languages && audienceRaw.languages[0]
      ? {
          code: audienceRaw.languages[0].code,
          name: audienceRaw.languages[0].name,
        }
      : undefined);

  const statsByContentType = profileRaw.statsByContentType ? { ...profileRaw.statsByContentType } : {};
  if (!statsByContentType.all) statsByContentType.all = {};
  if (!statsByContentType.all.statHistory && Array.isArray(profileRaw.statHistory)) {
    const statHistory: StatHistoryEntry[] = profileRaw.statHistory.map((entry) => ({
      month: entry.month,
      avgEngagements: (entry.avgLikes || 0) + (entry.avgComments || 0),
    }));
    statsByContentType.all.statHistory = statHistory;
  }

  const brandAffinity = audienceRaw.brandAffinity?.length
    ? mapWeightedList(audienceRaw.brandAffinity)
    : mapWeightedList(profileRaw.brandAffinity);

  const normalized: InfluencerProfile = {
    userId: profileRaw.userId,
    profile: header,
    isVerified: profileRaw.isVerified,
    isPrivate: profileRaw.isPrivate,
    country: profileRaw.country,
    city: profileRaw.city,
    state: profileRaw.state,
    description: profileRaw.description,
    interests: profileRaw.interests || [],
    contacts: profileRaw.contacts || [],
    language,
    ageGroup: profileRaw.ageGroup,
    gender: profileRaw.gender,
    audience,
    avgLikes: profileRaw.avgLikes,
    avgComments: profileRaw.avgComments,
    averageViews: profileRaw.averageViews ?? headerRaw.averageViews,
    avgReelsPlays: profileRaw.avgReelsPlays,
    postsCount: profileRaw.postsCount ?? headerRaw.postsCount,
    totalViews: profileRaw.totalViews ?? headerRaw.totalViews,
    totalLikes: profileRaw.totalLikes,
    brandAffinity,
    statsByContentType,
    popularPosts: mapPostList(profileRaw.popularPosts),
    notableUsers: mapMiniUserList(audienceRaw.notableUsers),
    lookalikes: mapMiniUserList(profileRaw.lookalikes),
    lookalikesByTopics: mapMiniUserList(profileRaw.lookalikesByTopics),
    audienceLookalikes: mapMiniUserList(audienceRaw.audienceLookalikes),
  };

  void platform;
  return { profile: normalized };
}
