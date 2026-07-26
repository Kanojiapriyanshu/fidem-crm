"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { Platform } from "./filters";
import Swal from "sweetalert2";
import {
  Heart,
  SealCheckIcon,
  GlobeHemisphereWest,
  InstagramLogo,
  TiktokLogo,
  YoutubeLogo,
  CopyIcon,
  Info,
} from "@phosphor-icons/react";
import api, { post } from "@/lib/api";

interface InfluencerCardProps {
  platform: Platform;
  influencer: any;
  onViewProfile?: (influencer: any) => void;
}

function normalizePlatform(value: any): "instagram" | "tiktok" | "youtube" {
  if (!value) return "instagram";

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized.includes("tiktok")) return "tiktok";
    if (normalized.includes("youtube")) return "youtube";
    return "instagram";
  }

  const normalized = String(
    value?.platform || value?.name || value?.type || ""
  )
    .trim()
    .toLowerCase();

  if (normalized.includes("tiktok")) return "tiktok";
  if (normalized.includes("youtube")) return "youtube";
  return "instagram";
}

function getPlatformIcon(platform?: string, size = 13) {
  const key = normalizePlatform(platform);

  switch (key) {
    case "instagram":
      return <InstagramLogo size={size} weight="fill" />;
    case "youtube":
      return <YoutubeLogo size={size} weight="fill" />;
    case "tiktok":
      return <TiktokLogo size={size} weight="fill" />;
    default:
      return <GlobeHemisphereWest size={size} weight="fill" />;
  }
}

async function copyWithFallback(text: string) {
  const isLocalhost =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";

  const canUseClipboardApi =
    typeof navigator !== "undefined" &&
    !!navigator.clipboard &&
    (window.isSecureContext || isLocalhost);

  if (canUseClipboardApi) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const ta = document.createElement("textarea");
  ta.value = text;
  ta.setAttribute("readonly", "");
  ta.style.position = "fixed";
  ta.style.top = "0";
  ta.style.left = "0";
  ta.style.opacity = "0";
  ta.style.pointerEvents = "none";

  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  ta.setSelectionRange(0, ta.value.length);

  const copied = document.execCommand("copy");
  document.body.removeChild(ta);

  if (!copied) {
    throw new Error("Fallback copy failed");
  }
}

function getInfluencerId(influencer: any) {
  return String(
    influencer?.influencerId ||
    influencer?.creatorId ||
    influencer?.userId ||
    influencer?.modashId ||
    influencer?.id ||
    influencer?._id ||
    ""
  ).trim();
}

function getInfluencerCategories(influencer: any) {
  if (Array.isArray(influencer?.categories)) {
    return influencer.categories
      .map((item: any) =>
        typeof item === "string"
          ? item
          : item?.categoryName ||
          item?.subcategoryName ||
          item?.name ||
          item?.subcategory ||
          ""
      )
      .filter(Boolean);
  }

  if (Array.isArray(influencer?.niche)) {
    return influencer.niche.map((item: any) => String(item)).filter(Boolean);
  }

  if (influencer?.category) return [String(influencer.category)];
  if (influencer?.niche) return [String(influencer.niche)];

  return [];
}

function normalizeBookmarkLink(value: any) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\/+$/, "");
}

function getBookmarkProfileKey(influencer: any, platform?: Platform) {
  const influencerId = getInfluencerId(influencer);
  if (influencerId) return `id:${influencerId}`;

  const email = String(influencer?.email || "")
    .trim()
    .toLowerCase();
  if (email) return `email:${email}`;

  const link = normalizeBookmarkLink(
    influencer?.primaryLink ||
    influencer?.profileUrl ||
    influencer?.profile_url ||
    influencer?.url ||
    influencer?.links?.[0]
  );
  if (link) return `link:${link}`;

  const selectedPlatform = normalizePlatform(influencer?.platform || platform);
  const handle = String(
    influencer?.handle ||
    influencer?.username ||
    influencer?.userName ||
    influencer?.screenName ||
    ""
  )
    .trim()
    .toLowerCase()
    .replace(/^@+/, "");

  if (handle) return `handle:${selectedPlatform}:${handle}`;

  const name = String(
    influencer?.fullname || influencer?.fullName || influencer?.name || ""
  )
    .trim()
    .toLowerCase();

  return name ? `name:${name}:${selectedPlatform}` : "";
}

type BookmarkFolderResponse = {
  success?: boolean;
  data?: {
    savedKeys?: string[];
    items?: any[];
  };
};

let bookmarkKeysCache: Set<string> | null = null;
let bookmarkKeysPromise: Promise<Set<string>> | null = null;

async function getBookmarkedProfileKeys() {
  if (bookmarkKeysCache) return bookmarkKeysCache;

  if (!bookmarkKeysPromise) {
    bookmarkKeysPromise = api
      .get<BookmarkFolderResponse>("/brand/bookmark/profile")
      .then((response) => {
        const savedKeys = Array.isArray(response.data?.data?.savedKeys)
          ? response.data.data.savedKeys
          : [];

        const items = Array.isArray(response.data?.data?.items)
          ? response.data.data.items
          : [];

        const keys = new Set<string>([
          ...savedKeys,
          ...items.map((item) => getBookmarkProfileKey(item)).filter(Boolean),
        ]);

        bookmarkKeysCache = keys;
        return keys;
      })
      .catch((error) => {
        bookmarkKeysPromise = null;
        throw error;
      });
  }

  return bookmarkKeysPromise;
}

function toPlainPayloadObject(value: any) {
  try {
    return JSON.parse(JSON.stringify(value || {}));
  } catch {
    return value || {};
  }
}

function getFirstText(...values: any[]): string {
  for (const value of values) {
    if (value == null) continue;

    if (Array.isArray(value)) {
      const nested: string = getFirstText(...value);
      if (nested) return nested;
      continue;
    }

    if (typeof value === "object") {
      const nested: string = getFirstText(
        value.code,
        value.isoCode,
        value.countryCode,
        value.languageCode,
        value.name,
        value.title,
        value.label,
        value.country,
        value.language
      );

      if (nested) return nested;
      continue;
    }

    const text = String(value).trim();
    if (text) return text;
  }

  return "";
}

function getArrayValues(...values: any[]): any[] {
  for (const value of values) {
    if (Array.isArray(value)) return value.filter(Boolean);

    if (typeof value === "string" && value.trim()) {
      return value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }

  return [];
}

function buildBookmarkPayload(influencer: any, platform: Platform) {
  const rawInfluencer = toPlainPayloadObject(influencer);

  const selectedPlatform = normalizePlatform(influencer?.platform || platform);
  const influencerId = getInfluencerId(influencer);

  const profileUrl = String(
    influencer?.primaryLink ||
    influencer?.url ||
    influencer?.profileUrl ||
    influencer?.profile_url ||
    influencer?.links?.[0] ||
    ""
  ).trim();

  const avatar =
    influencer?.picture ||
    influencer?.avatar ||
    influencer?.profilePicUrl ||
    influencer?.thumbnail ||
    influencer?.profilePicture ||
    influencer?.profileImage ||
    influencer?.avatarUrl ||
    influencer?.image ||
    influencer?.photo ||
    "";

  const handle =
    influencer?.handle ||
    influencer?.username ||
    influencer?.userName ||
    influencer?.screenName ||
    "";

  const country = getFirstText(
    influencer?.country,
    influencer?.countryCode,
    influencer?.location?.country,
    influencer?.location?.countryCode,
    influencer?.location?.isoCode,
    influencer?.profile?.country,
    influencer?.account?.country,
    influencer?.audience?.country,
    influencer?.audience?.countries?.[0],
    influencer?.audience?.geoCountries?.[0]
  );

  const language = getFirstText(
    influencer?.language,
    influencer?.languageCode,
    influencer?.languages,
    influencer?.profile?.language,
    influencer?.account?.language,
    influencer?.audience?.language,
    influencer?.audience?.languages,
    influencer?.stats?.language
  );

  const location = getFirstText(
    influencer?.location?.name,
    influencer?.location?.fullName,
    influencer?.location?.city,
    influencer?.location,
    country
  );

  const categories = getInfluencerCategories(influencer);

  const links = Array.from(
    new Set([
      ...(Array.isArray(influencer?.links) ? influencer.links : []),
      profileUrl,
    ].filter(Boolean))
  );

  return {
    profile: {
      ...rawInfluencer,

      influencerId,
      creatorId: String(influencer?.creatorId || influencerId || "").trim(),
      userId: String(influencer?.userId || influencerId || "").trim(),
      modashId: String(influencer?.modashId || "").trim(),

      name:
        influencer?.fullname ||
        influencer?.fullName ||
        influencer?.name ||
        influencer?.username ||
        "",
      fullname:
        influencer?.fullname ||
        influencer?.fullName ||
        influencer?.name ||
        "",
      username: influencer?.username || handle || "",
      handle,

      provider: selectedPlatform,
      platform: selectedPlatform,

      email: influencer?.email || "",
      emails: getArrayValues(influencer?.emails, influencer?.contacts?.emails),

      country,
      countryCode: country,

      language,
      languageCode: language,
      languages: getArrayValues(
        influencer?.languages,
        influencer?.audience?.languages
      ),

      location,
      city: getFirstText(influencer?.city, influencer?.location?.city),
      region: getFirstText(
        influencer?.region,
        influencer?.state,
        influencer?.location?.region,
        influencer?.location?.state
      ),

      followers: Number(
        influencer?.followers ??
        influencer?.followerCount ??
        influencer?.stats?.followers ??
        0
      ),
      engagementRate: Number(
        influencer?.engagementRate ?? influencer?.stats?.engagementRate ?? 0
      ),
      engagements: Number(
        influencer?.engagements ?? influencer?.stats?.engagements ?? 0
      ),
      averageViews: Number(
        influencer?.averageViews ??
        influencer?.stats?.avgViews ??
        influencer?.stats?.views ??
        0
      ),

      primaryLink: profileUrl,
      profileUrl,
      url: profileUrl,
      links,

      picture: avatar,
      avatarUrl: avatar,
      profileImage: avatar,

      bio: influencer?.bio || influencer?.description || "",
      description: influencer?.description || influencer?.bio || "",

      isVerified: Boolean(influencer?.isVerified || influencer?.verified),
      verified: Boolean(influencer?.isVerified || influencer?.verified),
      isPrivate: Boolean(influencer?.isPrivate),

      categories,
      niche: categories,

      searchType: influencer?.searchType || "standard",
      source: influencer?.source || "standard",

      audience: influencer?.audience || null,
      stats: influencer?.stats || null,
      contacts: influencer?.contacts || null,
      profile: influencer?.profile || null,
      account: influencer?.account || null,

      profileKey: getBookmarkProfileKey(influencer, platform),

      raw: rawInfluencer,
    },
  };
}

export function InfluencerCard({
  platform,
  influencer,
  onViewProfile,
}: InfluencerCardProps) {
  const [bgFailed, setBgFailed] = useState(false);
  const [isSaved, setIsSaved] = useState(
    Boolean(influencer?.isSaved || influencer?.bookmarked)
  );
  const [saving, setSaving] = useState(false);

  const bookmarkProfileKey = useMemo(
    () => getBookmarkProfileKey(influencer, platform),
    [influencer, platform]
  );

  const username =
    influencer?.username || influencer?.handle || influencer?.name || "unknown";

  const handle = String(username).startsWith("@")
    ? String(username)
    : `@${username}`;

  const displayName =
    influencer?.fullname ||
    influencer?.fullName ||
    influencer?.name ||
    username ||
    "Unknown Creator";

  const followers =
    influencer?.followers ??
    influencer?.followerCount ??
    influencer?.stats?.followers ??
    0;

  const engagementRate =
    influencer?.engagementRate ??
    influencer?.stats?.engagementRate ??
    0;

  const averageViews =
    influencer?.averageViews ??
    influencer?.stats?.avgViews ??
    influencer?.stats?.views ??
    0;

  const avatar =
    influencer?.picture ||
    influencer?.avatar ||
    influencer?.profilePicUrl ||
    influencer?.thumbnail ||
    influencer?.profilePicture ||
    "";

  const isVerified = Boolean(influencer?.isVerified || influencer?.verified);
  const profileUrl =
    influencer?.primaryLink || influencer?.url || influencer?.profileUrl || "#";

  useEffect(() => {
    let mounted = true;
    const initialSaved = Boolean(influencer?.isSaved || influencer?.bookmarked);

    setIsSaved(initialSaved);

    if (initialSaved || !bookmarkProfileKey) {
      return () => {
        mounted = false;
      };
    }

    getBookmarkedProfileKeys()
      .then((keys) => {
        if (!mounted) return;
        setIsSaved(keys.has(bookmarkProfileKey));
      })
      .catch((error) => {
        console.error("Failed to load bookmarked profiles:", error);
      });

    return () => {
      mounted = false;
    };
  }, [bookmarkProfileKey, influencer?.isSaved, influencer?.bookmarked]);

  const categories = useMemo(() => {
    return getInfluencerCategories(influencer).slice(0, 2);
  }, [influencer]);

  const formatNumber = (num?: number | null) => {
    if (num == null) return "—";
    if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}B`;
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(0)}K`;
    return Number(num).toLocaleString();
  };

  const formatRate = (rate?: number | null) => {
    if (rate == null) return "—";
    const normalized = rate > 1 ? rate : rate * 100;
    return `${normalized.toFixed(2)}%`;
  };

  const openExternalProfile = () => {
    if (!profileUrl || profileUrl === "#") return;
    window.open(profileUrl, "_blank", "noopener,noreferrer");
  };

  const handlePrimaryAction = () => {
    if (onViewProfile) {
      onViewProfile(influencer);
      return;
    }
    openExternalProfile();
  };

  const handleCardClick = () => {
    if (onViewProfile) {
      onViewProfile(influencer);
      return;
    }
    openExternalProfile();
  };

  const handleBookmarkProfile = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (saving || isSaved) return;

    try {
      setSaving(true);

      await post(
        "/brand/bookmark/profile",
        buildBookmarkPayload(influencer, platform)
      );

      setIsSaved(true);

      if (bookmarkProfileKey) {
        if (!bookmarkKeysCache) bookmarkKeysCache = new Set<string>();
        bookmarkKeysCache.add(bookmarkProfileKey);
      }

      await Swal.fire({
        icon: "success",
        title: "Saved",
        text: "Influencer saved to your bookmarked folder.",
        timer: 1400,
        showConfirmButton: false,
      });
    } catch (error: any) {
      console.error("Failed to bookmark influencer:", error);

      await Swal.fire({
        icon: "error",
        title: "Save failed",
        text:
          error?.response?.data?.error ||
          error?.response?.data?.message ||
          "Unable to save this influencer right now.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCopyMediaKit = async (e: React.MouseEvent) => {
    e.stopPropagation();

    try {
      const userId = getInfluencerId(influencer);
      const selectedPlatform = normalizePlatform(
        influencer?.platform || platform
      );

      if (!userId) {
        await Swal.fire({
          icon: "warning",
          title: "Missing user ID",
          text: "Could not generate media kit link because userId was not found.",
        });
        return;
      }

      const mediaKitUrl =
        `${window.location.origin}/mediakit/${encodeURIComponent(userId)}` +
        `?platform=${encodeURIComponent(selectedPlatform)}`;

      await copyWithFallback(mediaKitUrl);

      await Swal.fire({
        icon: "success",
        title: "Copied",
        text: "Media kit link copied to clipboard.",
        timer: 1600,
        showConfirmButton: false,
      });

      try {
        await post("/modash/creator", {
          userId: influencer?.userId || "",
          username: influencer?.username || "",
          handle: influencer?.handle || influencer?.username || "",
          fullname:
            influencer?.fullname ||
            influencer?.fullName ||
            influencer?.name ||
            "",
          followers: Number(
            influencer?.followers ??
            influencer?.followerCount ??
            influencer?.stats?.followers ??
            0
          ),
          engagementRate: Number(
            influencer?.engagementRate ??
            influencer?.stats?.engagementRate ??
            0
          ),
          engagements: Number(
            influencer?.engagements ??
            influencer?.stats?.engagements ??
            0
          ),
          averageViews: Number(
            influencer?.averageViews ??
            influencer?.stats?.avgViews ??
            influencer?.stats?.views ??
            0
          ),
          picture:
            influencer?.picture ||
            influencer?.avatar ||
            influencer?.profilePicUrl ||
            influencer?.thumbnail ||
            influencer?.profilePicture ||
            "",
          url: influencer?.url || "",
          isVerified: Boolean(influencer?.isVerified || influencer?.verified),
          isPrivate: Boolean(influencer?.isPrivate),
          platform: selectedPlatform,
          bio: influencer?.bio || influencer?.description || "",
          country:
            influencer?.country ||
            influencer?.location?.country ||
            influencer?.location ||
            "",
          location:
            influencer?.location ||
            influencer?.country ||
            influencer?.location?.country ||
            "",
          categories: getInfluencerCategories(influencer),
          searchType: influencer?.searchType || "standard",
          source: influencer?.source || "standard",
        });
      } catch (apiError) {
        console.error("Failed to post /modash/creator:", apiError);
      }
    } catch (error) {
      console.error("Failed to copy influencer card media kit link:", error);
      await Swal.fire({
        icon: "error",
        title: "Copy failed",
        text: "Unable to copy the media kit link.",
      });
    }
  };

  const visiblePlatforms = useMemo(() => {
    const rawPlatforms = [
      influencer?.platform,
      ...(Array.isArray(influencer?.platforms) ? influencer.platforms : []),
      platform,
    ];

    return Array.from(
      new Set(
        rawPlatforms.map((item) => normalizePlatform(item)).filter(Boolean)
      )
    ).slice(0, 3);
  }, [influencer, platform]);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleCardClick();
        }
      }}
      className="group relative isolate w-full max-w-[380px] cursor-pointer overflow-hidden rounded-[28px] bg-[#ddd1bb] shadow-[0_20px_50px_rgba(0,0,0,0.16)]"
    >
      {avatar && !bgFailed ? (
        <>
          <img
            src={avatar}
            alt={displayName}
            loading="lazy"
            onError={() => setBgFailed(true)}
            className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-[1.03]"
          />

          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-[58%] overflow-hidden"
            style={{
              WebkitMaskImage:
                "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.18) 14%, rgba(0,0,0,0.65) 30%, rgba(0,0,0,1) 52%)",
              maskImage:
                "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.18) 14%, rgba(0,0,0,0.65) 30%, rgba(0,0,0,1) 52%)",
            }}
          >
            <img
              src={avatar}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full scale-[1.08] object-cover object-center blur-[20px]"
            />
            <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(42,22,12,0.82),rgba(42,22,12,0.56)_38%,rgba(42,22,12,0.22)_68%,transparent)]" />
            <div className="absolute inset-0 bg-white/8" />
          </div>
        </>
      ) : (
        <>
          <div className="absolute inset-0 bg-gradient-to-br from-[#f7b1d0] via-[#d68eb4] to-[#6f4939]" />
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-[58%] overflow-hidden"
            style={{
              WebkitMaskImage:
                "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.18) 14%, rgba(0,0,0,0.65) 30%, rgba(0,0,0,1) 52%)",
              maskImage:
                "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.18) 14%, rgba(0,0,0,0.65) 30%, rgba(0,0,0,1) 52%)",
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#f7b1d0] via-[#d68eb4] to-[#6f4939] blur-[22px] scale-[1.08]" />
            <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(42,22,12,0.82),rgba(42,22,12,0.56)_38%,rgba(42,22,12,0.22)_68%,transparent)]" />
            <div className="absolute inset-0 bg-white/8" />
          </div>
        </>
      )}

      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,248,235,0.10),rgba(120,75,35,0.04)_32%,rgba(92,56,30,0.08)_58%,rgba(70,42,20,0.12))]" />

      <div className="relative flex min-h-[520px] flex-col justify-between p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <button
            type="button"
            aria-label="Copy media kit link"
            onClick={handleCopyMediaKit}
            className="ml-auto inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/45 bg-white/30 text-zinc-900 backdrop-blur-md transition hover:bg-white/45"
          >
            <CopyIcon size={18} weight="bold" />
          </button>
        </div>

        <div className="relative z-10 mt-auto pt-10 text-white">
          <div className="mx-auto max-w-[88%] text-center">
            <div className="flex items-center justify-center gap-1.5">
              <h3 className="text-[24px] font-semibold tracking-tight sm:text-[26px]">
                {displayName}
              </h3>

              {isVerified && (
                <SealCheckIcon size={20} weight="fill" color="#2196F3" />
              )}
            </div>

            <div className="mt-1 flex flex-wrap items-center justify-center gap-2 text-sm text-white/90">
              <span>{handle}</span>

              {categories[0] && (
                <span className="rounded-full border border-white/35 bg-white/12 px-3 py-1 text-[12px] text-white/90 backdrop-blur-sm">
                  {categories[0]}
                </span>
              )}
            </div>
          </div>

          <div className="mt-8 grid grid-cols-4 items-end gap-3 text-white">
            <div>
              <p className="text-[14px] font-semibold sm:text-[16px]">
                {formatNumber(followers)}
              </p>
              <p className="mt-1 text-[12px] text-white/80">followers</p>
            </div>

            <div>
              <p className="text-[14px] font-semibold sm:text-[16px]">
                {formatRate(engagementRate)}
              </p>
              <p className="mt-1 text-[12px] text-white/80">Avg Eng.</p>
            </div>

            <div>
              <p className="text-[14px] font-semibold sm:text-[16px]">
                {formatNumber(averageViews)}
              </p>
              <p className="mt-1 text-[12px] text-white/80">Avg views</p>
            </div>

            <div className="justify-self-end text-right">
              <div className="flex justify-end gap-1.5">
                {visiblePlatforms.map((item, index) => (
                  <span
                    key={`${item}-${index}`}
                    className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-white/50 bg-white/85 text-zinc-900 shadow-sm"
                    title={item}
                  >
                    {getPlatformIcon(item, 11)}
                  </span>
                ))}
              </div>
              <p className="mt-1 text-[12px] text-white/80">
                {visiblePlatforms.length > 1 ? "Platforms" : "Platform"}
              </p>
            </div>
          </div>

          <div className="mt-5 flex items-center gap-3">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handlePrimaryAction();
              }}
              className="inline-flex h-14 flex-1 items-center justify-center gap-2 rounded-xl bg-[#111111] px-5 text-[15px] font-semibold text-white shadow-[0_12px_24px_rgba(0,0,0,0.22)] transition hover:translate-y-[-1px] hover:bg-black"
            >
              <Info className="h-4 w-4" />
              <span>View Profile</span>
            </button>

            <button
              type="button"
              aria-label={isSaved ? "Influencer saved" : "Save influencer"}
              disabled={saving || isSaved}
              onClick={handleBookmarkProfile}
              className={[
                "inline-flex h-14 w-14 items-center justify-center rounded-full border backdrop-blur-md transition",
                isSaved
                  ? "border-rose-300 bg-rose-500 text-white"
                  : "border-white/55 bg-white/18 text-white hover:bg-white/28",
                saving ? "cursor-wait opacity-70" : "",
              ].join(" ")}
            >
              <Heart size={22} weight={isSaved ? "fill" : "regular"} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}