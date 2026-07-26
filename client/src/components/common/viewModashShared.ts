import type React from "react";
import type { ElementType } from "react";
import {
  ChatIcon,
  DownloadSimpleIcon,
  EnvelopeIcon,
  FlagIcon,
  PhoneCallIcon,
  ProhibitIcon,
  TiktokLogoIcon,
  UserPlusIcon,
} from "@phosphor-icons/react";
import { Instagram, Play, Youtube } from "lucide-react";

export type SubscriptionPlan = "free" | "starter" | "pro" | "enterprise";
export type UserRole = "admin" | "manager" | "creator" | "viewer";

export type SectionKey =
  | "contactManagement"
  | "riskCompliance"
  | "metricGrid"
  | "performanceTrend"
  | "campaignHighlights"
  | "audienceIntelligence"
  | "recentPosts"
  | "popularContent"
  | "lookalikeCreators"
  | "auditTrail";

export interface CampaignRow {
  _id?: string;
  company: string;
  brief: string;
  rate: string;
  status: string;
  payout: string;
  raw?: unknown;
  category?: string;
}
export interface SocialPost {
  likes?: number | string;
  views?: number | string;
  text?: string;
  type?: string;
  image?: string;
  thumbnail?: string;
  url?: string;
  sponsors?: Array<{ name?: string }>;
  createdAt?: string;
  publishedAt?: string;
  postedAt?: string;
  date?: string;
  created?: string;
  plays?: number;
  comments?: number;
}

export interface AudienceAge {
  code: string;
  weight: number;
}

export interface AudienceGender {
  code: string;
  weight: number;
}

export interface AudienceCountry {
  name: string;
  weight: number;
}

export interface ModashStatHistory {
  month: string;
  followers: number;
  avgLikes: number;
  following: number;
  avgComments: number;
  avgViews: number;
}

export interface ModashLookalike {
  userId: string;
  username: string;
  picture?: string;
  fullname?: string;
  url?: string;
  followers: number;
  engagements: number;
  isVerified?: boolean;
}

export interface InfluencerReport {
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
  location?:string;
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
  };
  isPrivate?: boolean;
  isVerified?: boolean;
  accountType?: string;
  postsCount?: number;
  statHistory?: ModashStatHistory[];
  lookalikes?: ModashLookalike[];
  followersRange?: { leftNumber?: number; rightNumber?: number };
}

export interface ReviewData {
  name?: string;
  role?: string;
  text?: string;
  image?: string;
  rating?: number;
}

export interface MediaKit {
  _id?: string;
  mediaKitId?: string;
  influencerId?: string;
  primaryPlatform?: string | null;
  primaryInfluencerReport?: InfluencerReport;
  influencerReports?: InfluencerReport[];
  socialProfiles?: InfluencerReport[];
  name?: string;
  country?: string;
  location?:string;
  languages?: Array<{ name?: string }>;
  email?: string;
  phone?: string;
  additionalNotes?: string;
  reviews?: ReviewData[];
  updatedAt?: string;
}

export interface ContactManagementCardProps {
  primaryReport: InfluencerReport | null;
  mediaKit: MediaKit | null;
  onCopy: () => void;
}

export interface DashboardMetric {
  key: string;
  label: string;
  value: string;
  delta?: string;
}

export interface CampaignHighlight {
  label: string;
  value: string;
  meta: string;
  tone?: "default" | "accent";
}

export interface LookalikeCreator {
  id: string;
  name: string;
  handle: string;
  followers: string;
  engagement: string;
  avatar?: string;
  url?: string;
}

export interface AuditItem {
  id: string;
  date: string;
  action: string;
  actor: string;
  status: string;
}

export interface SectionCardProps {
  title: string;
  eyebrow?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const PLAN_DISPLAY_NAME: Record<SubscriptionPlan, string> = {
  free: "Free",
  starter: "Starter",
  pro: "Pro",
  enterprise: "Enterprise",
};

export const cardClassName =
  "rounded-[24px] border border-[#efe8dd] bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)]";

export const monthLabels = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export const DashboardTopBarMenus: Array<{
  label: string;
  icon: ElementType;
}> = [
    { label: "Message", icon: ChatIcon },
    { label: "Call", icon: PhoneCallIcon },
    { label: "Email", icon: EnvelopeIcon },
    { label: "Assign", icon: UserPlusIcon },
    { label: "Flag", icon: FlagIcon },
    { label: "Export", icon: DownloadSimpleIcon },
    { label: "Block", icon: ProhibitIcon },
  ];

export function buildInitials(name?: string): string {
  return (
    name
      ?.split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "CR"
  );
}

export function formatCompactNumber(value: number | string | null | undefined): string {
  if (value === undefined || value === null || value === "") return "—";
  if (typeof value === "string" && value.trim() !== "" && Number.isNaN(Number(value))) {
    return value;
  }

  const num = Number(value);
  if (!Number.isFinite(num)) return "—";
  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}B`;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;

  return `${Math.round(num)}`;
}

export function formatDate(value?: string): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toISOString().slice(0, 10);
}

export function truncateText(text?: string, max = 34): string {
  if (!text) return "—";
  return text.length > max ? `${text.slice(0, max)}...` : text;
}

export function getPlatformIcon(provider?: string): ElementType {
  const normalized = provider?.toLowerCase();
  if (normalized === "instagram") return Instagram;
  if (normalized === "youtube") return Youtube;
  if (normalized === "tiktok") return TiktokLogoIcon;
  return Play;
}