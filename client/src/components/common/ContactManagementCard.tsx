"use client";

import { useEffect, useMemo, useState } from "react";
import { Copy, Globe, Mail, MapPin, Phone } from "lucide-react";
import {
  FacebookLogoIcon,
  InstagramLogoIcon,
  LinktreeLogoIcon,
  TiktokLogoIcon,
  TwitchLogoIcon,
  XLogoIcon,
  YoutubeLogoIcon,
} from "@phosphor-icons/react";
import { SectionCard } from "./SectionCard";
import type {
  InfluencerReport,
  MediaKit,
  SupportedPlatform,
} from "./ViewModashClient";

interface ContactManagementCardProps {
  primaryReport: InfluencerReport | null;
  mediaKit: MediaKit | null;
  onCopy: () => void;
  connectedProfiles?: InfluencerReport[];
  activePlatform?: SupportedPlatform | null;
  onPlatformSelect?: (profile: InfluencerReport) => void;
}

type ContactRow = {
  label: string;
  value: string;
  icon: any;
};

function normalisePlatform(raw?: string | null): SupportedPlatform {
  const value = String(raw ?? "").toLowerCase();

  if (value.includes("tiktok")) return "tiktok";
  if (value.includes("youtube")) return "youtube";

  return "instagram";
}

function getPlatformMeta(provider?: string) {
  const normalized = String(provider || "").toLowerCase();

  if (normalized.includes("instagram")) {
    return { label: "Instagram", Icon: InstagramLogoIcon };
  }

  if (normalized.includes("youtube")) {
    return { label: "YouTube", Icon: YoutubeLogoIcon };
  }

  if (normalized.includes("tiktok")) {
    return { label: "TikTok", Icon: TiktokLogoIcon };
  }

  if (normalized.includes("facebook")) {
    return { label: "Facebook", Icon: FacebookLogoIcon };
  }

  if (
    normalized === "x" ||
    normalized.includes("twitter") ||
    normalized.includes("x/twitter")
  ) {
    return { label: "Twitter / X", Icon: XLogoIcon };
  }

  if (normalized.includes("twitch")) {
    return { label: "Twitch", Icon: TwitchLogoIcon };
  }

  if (normalized.includes("linktree")) {
    return { label: "Linktree", Icon: LinktreeLogoIcon };
  }

  return { label: provider || "Other", Icon: Globe };
}

function getDisplayHandle(profile?: InfluencerReport | null) {
  if (!profile) return "—";

  if (profile.handle) {
    return profile.handle.startsWith("@")
      ? profile.handle
      : `@${profile.handle}`;
  }

  if (profile.username) {
    return profile.username.startsWith("@")
      ? profile.username
      : `@${profile.username}`;
  }

  return "—";
}

function cleanContactValue(value: unknown): string {
  if (value === undefined || value === null) return "";

  const text = String(value).trim();

  if (
    !text ||
    text === "—" ||
    text === "--" ||
    text.toLowerCase() === "null" ||
    text.toLowerCase() === "undefined"
  ) {
    return "";
  }

  return text;
}

function formatContactLabel(value: unknown): string {
  const text = cleanContactValue(value);

  if (!text) return "Contact";

  const lower = text.toLowerCase();

  if (lower === "twitchtv") return "Twitch";
  if (lower === "twitter") return "Twitter / X";
  if (lower === "x") return "Twitter / X";
  if (lower === "linktree") return "Linktree";

  return text
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function isUrl(value: string) {
  return /^https?:\/\//i.test(value);
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isPhone(label: string, value: string) {
  return (
    label.toLowerCase().includes("phone") ||
    label.toLowerCase().includes("mobile") ||
    /^[+()\d\s-]{7,}$/.test(value)
  );
}

function getContactIcon(label: string, value: string) {
  const lowerLabel = label.toLowerCase();
  const lowerValue = value.toLowerCase();

  if (lowerLabel.includes("email") || isEmail(value)) return Mail;

  if (
    lowerLabel.includes("phone") ||
    lowerLabel.includes("mobile") ||
    isPhone(label, value)
  ) {
    return Phone;
  }

  if (
    lowerLabel.includes("youtube") ||
    lowerValue.includes("youtube.com") ||
    lowerValue.includes("youtu.be")
  ) {
    return YoutubeLogoIcon;
  }

  if (
    lowerLabel.includes("instagram") ||
    lowerValue.includes("instagram.com")
  ) {
    return InstagramLogoIcon;
  }

  if (
    lowerLabel.includes("tiktok") ||
    lowerValue.includes("tiktok.com")
  ) {
    return TiktokLogoIcon;
  }

  if (
    lowerLabel.includes("facebook") ||
    lowerValue.includes("facebook.com") ||
    lowerValue.includes("fb.com")
  ) {
    return FacebookLogoIcon;
  }

  if (
    lowerLabel.includes("twitter") ||
    lowerLabel === "x" ||
    lowerLabel.includes("x ") ||
    lowerValue.includes("twitter.com") ||
    lowerValue.includes("x.com")
  ) {
    return XLogoIcon;
  }

  if (
    lowerLabel.includes("linktree") ||
    lowerValue.includes("linktr.ee") ||
    lowerValue.includes("linktree")
  ) {
    return LinktreeLogoIcon;
  }

  if (
    lowerLabel.includes("twitch") ||
    lowerLabel.includes("twitchtv") ||
    lowerValue.includes("twitch.tv")
  ) {
    return TwitchLogoIcon;
  }

  return Globe;
}

function getLocationValue(primaryReport: any, mediaKit: any): string {
  return (
    cleanContactValue(primaryReport?.country) ||
    cleanContactValue(primaryReport?.location) ||
    cleanContactValue(primaryReport?.city) ||
    cleanContactValue(primaryReport?.state) ||
    cleanContactValue(mediaKit?.country) ||
    cleanContactValue(mediaKit?.location) ||
    cleanContactValue(mediaKit?.city) ||
    cleanContactValue(mediaKit?.state) ||
    "—"
  );
}

function extractContactRows(primaryReport: any, mediaKit: any): ContactRow[] {
  const rows: ContactRow[] = [];
  const seen = new Set<string>();

  const addRow = (labelRaw: unknown, valueRaw: unknown) => {
    const value = cleanContactValue(valueRaw);
    if (!value) return;

    const label = formatContactLabel(labelRaw);
    const key = `${label}:${value}`.toLowerCase();

    if (seen.has(key)) return;

    seen.add(key);

    rows.push({
      label,
      value,
      icon: getContactIcon(label, value),
    });
  };

  addRow(
    "Email",
    mediaKit?.email ||
      primaryReport?.email ||
      primaryReport?.contactEmail
  );

  addRow(
    "Phone",
    mediaKit?.phone ||
      primaryReport?.phone ||
      primaryReport?.contactPhone
  );

  const contactSources = [
    mediaKit?.contact,
    mediaKit?.contacts,
    mediaKit?.primaryInfluencerReport?.contact,
    mediaKit?.primaryInfluencerReport?.contacts,
    primaryReport?.contact,
    primaryReport?.contacts,
  ];

  contactSources.forEach((source) => {
    if (Array.isArray(source)) {
      source.forEach((item) => {
        if (!item) return;

        if (typeof item === "string") {
          addRow("Contact", item);
          return;
        }

        addRow(
          item.type || item.label || item.name || item.platform || "Contact",
          item.value || item.url || item.href || item.email || item.phone
        );
      });

      return;
    }

    if (source && typeof source === "object") {
      Object.entries(source).forEach(([key, value]) => {
        addRow(key, value);
      });
    }
  });

  return rows;
}

function ContactValue({ label, value }: { label: string; value: string }) {
  const valueClass =
    "block max-w-full whitespace-normal break-words [overflow-wrap:anywhere] text-sm leading-5 text-[#2a2a2a]";

  if (isEmail(value)) {
    return (
      <a
        href={`mailto:${value}`}
        className={`${valueClass} hover:underline`}
        title={value}
      >
        {value}
      </a>
    );
  }

  if (isPhone(label, value)) {
    return (
      <a
        href={`tel:${value}`}
        className={`${valueClass} hover:underline`}
        title={value}
      >
        {value}
      </a>
    );
  }

  if (isUrl(value)) {
    return (
      <a
        href={value}
        target="_blank"
        rel="noreferrer"
        className={`${valueClass} hover:underline`}
        title={value}
      >
        {value}
      </a>
    );
  }

  return (
    <div className={valueClass} title={value}>
      {value}
    </div>
  );
}

export function ContactManagementCard({
  primaryReport,
  mediaKit,
  onCopy,
  connectedProfiles,
  activePlatform,
  onPlatformSelect,
}: ContactManagementCardProps) {
  const [hasAdminAccess, setHasAdminAccess] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    setHasAdminAccess(Boolean(window.localStorage.getItem("adminId")));
  }, []);

  const activeProvider =
    primaryReport?.provider ?? mediaKit?.primaryPlatform ?? "instagram";

  const activePlatformMeta = getPlatformMeta(activeProvider);

  const rawPlatformProfiles: InfluencerReport[] =
    connectedProfiles?.length
      ? connectedProfiles
      : mediaKit?.influencerReports?.length
        ? mediaKit.influencerReports
        : mediaKit?.socialProfiles || [];

  const uniqueConnectedPlatforms = Array.from(
    new Map(
      rawPlatformProfiles
        .filter((item) => item?.provider)
        .map((item) => [normalisePlatform(item.provider), item])
    ).values()
  );

  const adminContactRows = useMemo(() => {
    if (!hasAdminAccess) return [];

    return extractContactRows(primaryReport as any, mediaKit as any);
  }, [hasAdminAccess, primaryReport, mediaKit]);

  const socialRows = [
    {
      label: activePlatformMeta.label,
      value: getDisplayHandle(primaryReport),
      icon: activePlatformMeta.Icon,
    },
    ...adminContactRows,
    {
      label: "Location",
      value: getLocationValue(primaryReport as any, mediaKit as any),
      icon: MapPin,
    },
  ];

  return (
    <SectionCard title="Contact & Management" eyebrow="Profile access">
      <div className="space-y-4">
        {socialRows.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={`${item.label}-${item.value}`}
              className="flex min-w-0 items-start gap-3"
            >
              <div className="mt-0.5 shrink-0 rounded-full bg-[#fff4df] p-2 text-[#d39305]">
                <Icon className="h-4 w-4" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#ab9f8e]">
                  {item.label}
                </div>

                <ContactValue label={item.label} value={String(item.value)} />
              </div>
            </div>
          );
        })}

        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#ab9f8e]">
            Connected platforms
          </div>

          {uniqueConnectedPlatforms.length ? (
            <div className="mt-3 flex flex-wrap gap-2 text-[#7d7569]">
              {uniqueConnectedPlatforms.map((profile, index) => {
                const { Icon, label } = getPlatformMeta(profile.provider);
                const profilePlatform = normalisePlatform(profile.provider);

                const isActive = activePlatform
                  ? profilePlatform === activePlatform
                  : profilePlatform === normalisePlatform(primaryReport?.provider);

                const profileHandle = profile.handle
                  ? profile.handle
                  : profile.username
                    ? profile.username.startsWith("@")
                      ? profile.username
                      : `@${profile.username}`
                    : "";

                return (
                  <button
                    key={`${
                      profile.provider || "platform"
                    }-${profile.modashId || profile._id || profile.username || index}`}
                    type="button"
                    onClick={() => onPlatformSelect?.(profile)}
                    className={`inline-flex max-w-full min-w-0 items-center gap-2 rounded-full border px-3 py-2 text-xs transition ${
                      isActive
                        ? "border-[#d9a441] bg-[#fff4df] text-[#1f1f1f]"
                        : "border-[#e8e0d5] bg-white text-[#5e584f] hover:bg-[#fff9f1]"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="shrink-0 font-medium">{label}</span>

                    {profileHandle ? (
                      <span className="min-w-0 break-words [overflow-wrap:anywhere] text-left text-[#9a9287]">
                        {profileHandle}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="mt-3 text-sm text-[#7d7569]">
              No connected platforms
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={onCopy}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1f1f1f] px-4 py-3 text-sm font-semibold text-white transition hover:bg-black"
          >
            <Copy className="h-4 w-4" />
            Copy kit
          </button>
        </div>
      </div>
    </SectionCard>
  );
}