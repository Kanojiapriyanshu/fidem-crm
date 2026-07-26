export type Platform = "instagram" | "tiktok" | "youtube";

export interface InfluencerResult {
  id: string;
  name: string;
  username: string;
  platform: Platform;
  followers: number;
  engagementRate: number;
  avatar?: string;
  verifiedStatus?: boolean;
  location?: string;
  categories?: string[];
  link?: string;
}

export type UiSortOption = "relevance" | "followers" | "engagement" | "recent";
export type SortField = "followers" | "engagementRate" | "avgViews" | "avgLikes";
export type SortDirection = "asc" | "desc";
export type SortOption = { field: SortField; direction: SortDirection };

export type Operator = "gt" | "lt" | "eq";
export type GrowthInterval = "i1month" | "i3months" | "i6months" | "i12months";

export interface Weighted<T = string | number> {
  id: T;
  weight: number;
}

export interface TextTag {
  type: "hashtag" | "mention";
  value: string;
}

export interface Contact {
  value: string;
  type?: string;
}

export interface Language {
  code?: string;
  name?: string;
}

export interface WeightedItem {
  name?: string;
  code?: string;
  weight?: number;
}

export interface Audience {
  genders?: WeightedItem[];
  ages?: WeightedItem[];
  geoCountries?: WeightedItem[];
  languages?: WeightedItem[];
  ethnicities?: WeightedItem[];
  audienceTypes?: WeightedItem[];
  audienceReachability?: WeightedItem[];
}

export interface AudienceSummary {
  notable?: number;
  credibility?: number;
}

export interface InfluencerHeader {
  picture?: string;
  fullname?: string;
  username?: string;
  handle?: string;
  url?: string;
  followers?: number;
  engagementRate?: number;
}

export interface MiniUser {
  userId: string | number;
  url?: string;
  picture?: string;
  fullname?: string;
  username?: string;
  followers?: number;
}

export interface RecentPost {
  id: string | number;
  url?: string;
  thumbnail?: string;
  image?: string;
  video?: boolean;
  title?: string;
  text?: string;
  type?: string;
  likes?: number;
  comments?: number;
  views?: number;
  hashtags?: string[];
  created?: string | number | Date;
}

export interface StatHistoryEntry {
  month: string;
  avgEngagements: number;
}

export interface InfluencerProfile {
  userId?: string | number;
  profile?: InfluencerHeader;
  isVerified?: boolean;
  isPrivate?: boolean;
  country?: string;
  city?: string;
  state?: string;
  description?: string;
  interests?: Array<string | { name?: string; code?: string }>;
  contacts?: Contact[];
  language?: Language;
  ageGroup?: string;
  gender?: string;
  audience?: Audience & AudienceSummary;
  avgLikes?: number;
  avgComments?: number;
  averageViews?: number;
  avgReelsPlays?: number;
  postsCount?: number;
  totalViews?: number;
  totalLikes?: number;
  brandAffinity?: WeightedItem[];
  statsByContentType?: any;
  popularPosts?: RecentPost[];
  notableUsers?: MiniUser[];
  lookalikes?: MiniUser[];
  lookalikesByTopics?: MiniUser[];
  audienceLookalikes?: MiniUser[];
}

export interface ReportResponse {
  profile: InfluencerProfile;
}

export interface ModashWeightedItemRaw {
  name?: string;
  code?: string;
  weight?: number;
}

export interface ModashMiniUserRaw {
  userId?: string | number;
  url?: string;
  picture?: string;
  fullname?: string;
  username?: string;
  handle?: string;
  followers?: number;
}

export interface ModashPostRaw {
  id?: string | number;
  url?: string;
  thumbnail?: string;
  image?: string;
  video?: string | boolean;
  title?: string;
  text?: string;
  type?: string;
  likes?: number;
  comments?: number;
  views?: number;
  hashtags?: string[];
  created?: string | number | Date;
}

export interface ModashStatHistoryRaw {
  month: string;
  avgLikes?: number;
  avgComments?: number;
  avgViews?: number;
  followers?: number;
  totalViews?: number;
}

export interface ModashAudienceRaw {
  genders?: ModashWeightedItemRaw[];
  ages?: ModashWeightedItemRaw[];
  geoCountries?: ModashWeightedItemRaw[];
  languages?: ModashWeightedItemRaw[];
  ethnicities?: ModashWeightedItemRaw[];
  audienceTypes?: ModashWeightedItemRaw[];
  audienceReachability?: ModashWeightedItemRaw[];
  brandAffinity?: ModashWeightedItemRaw[];
  notable?: number;
  credibility?: number;
  notableUsers?: ModashMiniUserRaw[];
  audienceLookalikes?: ModashMiniUserRaw[];
}

export interface ModashHeaderRaw {
  picture?: string;
  fullname?: string;
  username?: string;
  handle?: string;
  url?: string;
  followers?: number;
  engagementRate?: number;
  averageViews?: number;
  postsCount?: number;
  totalViews?: number;
}

export interface ModashProfileRaw {
  userId?: string | number;
  profile?: ModashHeaderRaw;
  isVerified?: boolean;
  isPrivate?: boolean;
  country?: string;
  city?: string;
  state?: string;
  description?: string;
  interests?: Array<string | { name?: string; code?: string }>;
  contacts?: Contact[];
  language?: Language;
  ageGroup?: string;
  gender?: string;
  audience?: ModashAudienceRaw;
  avgLikes?: number;
  avgComments?: number;
  averageViews?: number;
  avgReelsPlays?: number;
  postsCount?: number;
  totalViews?: number;
  totalLikes?: number;
  brandAffinity?: ModashWeightedItemRaw[];
  statsByContentType?: any;
  statHistory?: ModashStatHistoryRaw[];
  popularPosts?: ModashPostRaw[];
  recentPosts?: ModashPostRaw[];
  sponsoredPosts?: ModashPostRaw[];
  lookalikes?: ModashMiniUserRaw[];
  lookalikesByTopics?: ModashMiniUserRaw[];
}

export interface ModashReportRaw {
  error?: boolean | string;
  message?: string;
  profile?: ModashProfileRaw;
  _lastFetchedAt?: string;
}
