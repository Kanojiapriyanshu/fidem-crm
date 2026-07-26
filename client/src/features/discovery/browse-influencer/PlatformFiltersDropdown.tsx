"use client";

import React, { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { flushSync } from "react-dom";
import {
  InstagramLogo,
  TiktokLogo,
  YoutubeLogo,
} from "@phosphor-icons/react";
import type { FilterState, Platform, PlatformFilterState } from "./filters";
import {
  LANGUAGE_OPTIONS,
  LAST_POSTED_OPTIONS,
  PLATFORM_ORDER,
} from "./filters";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

interface PlatformFiltersDropdownProps {
  anchorRef: React.RefObject<HTMLDivElement | null>;
  platforms: Platform[];
  setPlatforms: (platforms: Platform[]) => void;
  filters: FilterState;
  updateFilter: (path: string, value: any) => void;
  onApply?: () => void;
  onClose: () => void;
}

type PlatformDraft = {
  followersMin: string;
  followersMax: string;
  avgViewsMin: string;
  avgViewsMax: string;
  engagementsMin: string;
  engagementsMax: string;
  engagementRateMin: string;
  languageCode: string;
  lastPostedDays: string;
  locationIdsText: string;

  bioQuery: string;
  keywords: string;
  relevance: string;
  audienceRelevance: string;
  textTags: string;

  hasAudienceData: boolean;
  contactEmailOnly: boolean;

  followersGrowthInterval: string;
  followersGrowthOperator: string;
  followersGrowthValue: string;

  viewsGrowthInterval: string;
  viewsGrowthOperator: string;
  viewsGrowthValue: string;

  likesGrowthInterval: string;
  likesGrowthOperator: string;
  likesGrowthValue: string;

  reelsPlaysMin: string;
  reelsPlaysMax: string;

  sharesMin: string;
  sharesMax: string;
  savesMin: string;
  savesMax: string;

  interestsIdsText: string;
  brandsIdsText: string;
  igAccountTypesText: string;

  hasSponsoredPosts: boolean;
  hasYouTube: boolean;
  isOfficialArtist: boolean;
};

const platformConfig: Record<
  Platform,
  { label: string; icon: React.ReactNode }
> = {
  youtube: {
    label: "YouTube",
    icon: <YoutubeLogo size={18} weight="fill" />,
  },
  instagram: {
    label: "Instagram",
    icon: <InstagramLogo size={18} weight="fill" />,
  },
  tiktok: {
    label: "TikTok",
    icon: <TiktokLogo size={18} weight="fill" />,
  },
};

function toDraftValue(value?: number | string) {
  return value == null ? "" : String(value);
}

function toDraftBool(value?: boolean) {
  return !!value;
}

function createEmptyDraft(): PlatformDraft {
  return {
    followersMin: "",
    followersMax: "",
    avgViewsMin: "",
    avgViewsMax: "",
    engagementsMin: "",
    engagementsMax: "",
    engagementRateMin: "",
    languageCode: "",
    lastPostedDays: "",
    locationIdsText: "",

    bioQuery: "",
    keywords: "",
    relevance: "",
    audienceRelevance: "",
    textTags: "",

    hasAudienceData: false,
    contactEmailOnly: false,

    followersGrowthInterval: "",
    followersGrowthOperator: "",
    followersGrowthValue: "",

    viewsGrowthInterval: "",
    viewsGrowthOperator: "",
    viewsGrowthValue: "",

    likesGrowthInterval: "",
    likesGrowthOperator: "",
    likesGrowthValue: "",

    reelsPlaysMin: "",
    reelsPlaysMax: "",

    sharesMin: "",
    sharesMax: "",
    savesMin: "",
    savesMax: "",

    interestsIdsText: "",
    brandsIdsText: "",
    igAccountTypesText: "",

    hasSponsoredPosts: false,
    hasYouTube: false,
    isOfficialArtist: false,
  };
}

function fromFilters(platformFilters: PlatformFilterState | undefined): PlatformDraft {
  return {
    followersMin: toDraftValue(platformFilters?.followersMin),
    followersMax: toDraftValue(platformFilters?.followersMax),
    avgViewsMin: toDraftValue(platformFilters?.avgViewsMin),
    avgViewsMax: toDraftValue(platformFilters?.avgViewsMax),
    engagementsMin: toDraftValue(platformFilters?.engagementsMin),
    engagementsMax: toDraftValue(platformFilters?.engagementsMax),
    engagementRateMin: toDraftValue(platformFilters?.engagementRateMin),
    languageCode: platformFilters?.languageCode || "",
    lastPostedDays: toDraftValue(platformFilters?.lastPostedDays),
    locationIdsText: platformFilters?.locationIdsText || "",

    bioQuery: platformFilters?.bioQuery || "",
    keywords: platformFilters?.keywords || "",
    relevance: platformFilters?.relevance || "",
    audienceRelevance: platformFilters?.audienceRelevance || "",
    textTags: platformFilters?.textTags || "",

    hasAudienceData: toDraftBool(platformFilters?.hasAudienceData),
    contactEmailOnly: toDraftBool(platformFilters?.contactEmailOnly),

    followersGrowthInterval: platformFilters?.followersGrowthInterval || "",
    followersGrowthOperator: platformFilters?.followersGrowthOperator || "",
    followersGrowthValue: toDraftValue(platformFilters?.followersGrowthValue),

    viewsGrowthInterval: platformFilters?.viewsGrowthInterval || "",
    viewsGrowthOperator: platformFilters?.viewsGrowthOperator || "",
    viewsGrowthValue: toDraftValue(platformFilters?.viewsGrowthValue),

    likesGrowthInterval: platformFilters?.likesGrowthInterval || "",
    likesGrowthOperator: platformFilters?.likesGrowthOperator || "",
    likesGrowthValue: toDraftValue(platformFilters?.likesGrowthValue),

    reelsPlaysMin: toDraftValue(platformFilters?.reelsPlaysMin),
    reelsPlaysMax: toDraftValue(platformFilters?.reelsPlaysMax),

    sharesMin: toDraftValue(platformFilters?.sharesMin),
    sharesMax: toDraftValue(platformFilters?.sharesMax),
    savesMin: toDraftValue(platformFilters?.savesMin),
    savesMax: toDraftValue(platformFilters?.savesMax),

    interestsIdsText: platformFilters?.interestsIdsText || "",
    brandsIdsText: platformFilters?.brandsIdsText || "",
    igAccountTypesText: platformFilters?.igAccountTypesText || "",

    hasSponsoredPosts: toDraftBool(platformFilters?.hasSponsoredPosts),
    hasYouTube: toDraftBool(platformFilters?.hasYouTube),
    isOfficialArtist: toDraftBool(platformFilters?.isOfficialArtist),
  };
}

function parseNumber(value: string): number | undefined {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseString(value: string): string | undefined {
  const clean = value.trim();
  return clean ? clean : undefined;
}

function PlatformIconButton({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative inline-flex h-9 w-9 items-center justify-center rounded-full border transition",
        selected
          ? "border-[#D8D8D8] bg-white shadow-sm"
          : "border-[#E6E6E6] bg-white hover:bg-[#FAFAFA]"
      )}
    >
      {children}
      {selected ? (
        <span className="absolute -right-0.5 -top-0.5 inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#31C759] text-white">
          <Check className="h-2.5 w-2.5" />
        </span>
      ) : null}
    </button>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1 block text-[11px] font-medium text-[#1A1A1A]">
      {children}
    </label>
  );
}

function InputField({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="h-8 w-full rounded-[8px] border border-[#E3E3E3] bg-white px-2.5 text-[11px] text-[#1A1A1A] outline-none placeholder:text-[#A0A0A0]"
    />
  );
}

function NumberInputField({
  value,
  onChange,
  placeholder,
  suffix,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  suffix?: string;
}) {
  return (
    <div className="flex h-8 items-center overflow-hidden rounded-[8px] border border-[#E3E3E3] bg-white">
      <input
        type="number"
        inputMode="decimal"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-full w-full min-w-0 bg-transparent px-2.5 text-[11px] text-[#1A1A1A] outline-none placeholder:text-[#A0A0A0]"
      />
      {suffix ? (
        <span className="shrink-0 pr-2.5 text-[11px] text-[#555]">{suffix}</span>
      ) : null}
    </div>
  );
}

function MinMaxField({
  label,
  minValue,
  maxValue,
  onMinChange,
  onMaxChange,
}: {
  label: string;
  minValue: string;
  maxValue: string;
  onMinChange: (value: string) => void;
  onMaxChange: (value: string) => void;
}) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-1.5">
        <NumberInputField value={minValue} onChange={onMinChange} placeholder="Min" />
        <span className="text-[10px] text-[#8E8E8E]">—</span>
        <NumberInputField value={maxValue} onChange={onMaxChange} placeholder="Max" />
      </div>
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ label: string; value: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div className="relative">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-8 w-full appearance-none rounded-[8px] border border-[#E3E3E3] bg-white px-2.5 pr-8 text-[11px] text-[#1A1A1A] outline-none"
        >
          {options.map((option) => (
            <option key={`${option.label}-${option.value}`} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8B8B8B]" />
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between rounded-[8px] border border-[#EEEEEE] bg-[#FAFAFA] px-2.5 py-2">
      <span className="text-[11px] text-[#1A1A1A]">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-3.5 w-3.5"
      />
    </label>
  );
}

function PlatformSection({
  platform,
  draft,
  setDraft,
  onClear,
  expanded,
  onToggle,
}: {
  platform: Platform;
  draft: PlatformDraft;
  setDraft: (patch: Partial<PlatformDraft>) => void;
  onClear: () => void;
  expanded: boolean;
  onToggle: () => void;
}) {
  const config = platformConfig[platform];
  const isYoutube = platform === "youtube";
  const isInstagram = platform === "instagram";
  const isTiktok = platform === "tiktok";

  return (
    <div className="overflow-hidden border-[#E8E8E8] bg-white shadow-[0_6px_18px_rgba(0,0,0,0.04)]">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 border-b border-[#F0F0F0] px-3 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-[#1A1A1A]">{config.icon}</span>
          <span className="text-[12px] font-semibold text-[#1A1A1A]">
            {config.label}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onClear();
            }}
            className="inline-flex items-center gap-1 rounded-[8px] border border-[#ECECEC] px-2 py-1 text-[10px] text-[#666] hover:bg-[#FAFAFA]"
          >
            Clear <X className="h-3 w-3" />
          </button>

          <ChevronDown
            className={cn(
              "h-4 w-4 text-[#777] transition-transform",
              expanded ? "rotate-180" : ""
            )}
          />
        </div>
      </button>

      {expanded ? (
        <div className="space-y-4 p-3">
          <div className="grid grid-cols-2 gap-2.5">
            <MinMaxField
              label={isYoutube ? "Subscribers" : "Followers"}
              minValue={draft.followersMin}
              maxValue={draft.followersMax}
              onMinChange={(value) => setDraft({ followersMin: value })}
              onMaxChange={(value) => setDraft({ followersMax: value })}
            />

            <MinMaxField
              label="Avg views"
              minValue={draft.avgViewsMin}
              maxValue={draft.avgViewsMax}
              onMinChange={(value) => setDraft({ avgViewsMin: value })}
              onMaxChange={(value) => setDraft({ avgViewsMax: value })}
            />

            <SelectField
              label="Language"
              value={draft.languageCode}
              onChange={(value) => setDraft({ languageCode: value })}
              options={LANGUAGE_OPTIONS}
            />

            <div>
              <FieldLabel>Min engagement rate</FieldLabel>
              <NumberInputField
                value={draft.engagementRateMin}
                onChange={(value) => setDraft({ engagementRateMin: value })}
                placeholder="%"
                suffix="%"
              />
            </div>

            <div className="col-span-2">
              <SelectField
                label="Last posted"
                value={draft.lastPostedDays}
                onChange={(value) => setDraft({ lastPostedDays: value })}
                options={LAST_POSTED_OPTIONS.map((item) => ({
                  label: item.label,
                  value: item.value == null ? "" : String(item.value),
                }))}
              />
            </div>

            {/* <div>
              <FieldLabel>Keywords</FieldLabel>
              <InputField
                value={draft.keywords}
                onChange={(value) => setDraft({ keywords: value })}
                placeholder="tech, beauty..."
              />
            </div> */}
          </div>

          {/* {isYoutube ? (
            <div className="grid grid-cols-1 gap-2.5">
              <div>
                <FieldLabel>Bio query</FieldLabel>
                <InputField
                  value={draft.bioQuery}
                  onChange={(value) => setDraft({ bioQuery: value })}
                  placeholder="creator bio"
                />
              </div>
            </div>
          ) : null} */}

          {isInstagram ? (
            <div className="grid grid-cols-1 gap-2.5">
              <MinMaxField
                label="Reels plays"
                minValue={draft.reelsPlaysMin}
                maxValue={draft.reelsPlaysMax}
                onMinChange={(value) => setDraft({ reelsPlaysMin: value })}
                onMaxChange={(value) => setDraft({ reelsPlaysMax: value })}
              />

              <ToggleRow
                label="Sponsored posts only"
                checked={draft.hasSponsoredPosts}
                onChange={(next) => setDraft({ hasSponsoredPosts: next })}
              />
            </div>
          ) : null}

          {isTiktok ? (
            <div className="grid grid-cols-1 gap-2.5">
              <MinMaxField
                label="Engagements"
                minValue={draft.engagementsMin}
                maxValue={draft.engagementsMax}
                onMinChange={(value) => setDraft({ engagementsMin: value })}
                onMaxChange={(value) => setDraft({ engagementsMax: value })}
              />

              {/* <div>
                <FieldLabel>Text tags</FieldLabel>
                <InputField
                  value={draft.textTags}
                  onChange={(value) => setDraft({ textTags: value })}
                  placeholder="#tech, @creator"
                />
              </div> */}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function PlatformFiltersDropdown({
  anchorRef,
  platforms,
  setPlatforms,
  filters,
  updateFilter,
  onApply,
  onClose,
}: PlatformFiltersDropdownProps) {
  const initialPlatform = platforms[0] || "youtube";

  const [draftPlatforms, setDraftPlatforms] = useState<Platform[]>([initialPlatform]);
  const [drafts, setDrafts] = useState<Record<Platform, PlatformDraft>>({
    youtube: fromFilters(filters.platform.youtube),
    instagram: fromFilters(filters.platform.instagram),
    tiktok: fromFilters(filters.platform.tiktok),
  });
  const [expanded, setExpanded] = useState<Record<Platform, boolean>>({
    youtube: initialPlatform === "youtube",
    instagram: initialPlatform === "instagram",
    tiktok: initialPlatform === "tiktok",
  });
  const [menuWidth, setMenuWidth] = useState(540);
  const [alignRight, setAlignRight] = useState(true);

  useEffect(() => {
    const nextPlatform = platforms[0] || "youtube";

    setDraftPlatforms([nextPlatform]);
    setDrafts({
      youtube: fromFilters(filters.platform.youtube),
      instagram: fromFilters(filters.platform.instagram),
      tiktok: fromFilters(filters.platform.tiktok),
    });
    setExpanded({
      youtube: nextPlatform === "youtube",
      instagram: nextPlatform === "instagram",
      tiktok: nextPlatform === "tiktok",
    });
  }, [filters, platforms]);

  const selectedPlatforms = useMemo(
    () => PLATFORM_ORDER.filter((platform) => draftPlatforms.includes(platform)),
    [draftPlatforms]
  );

  useLayoutEffect(() => {
    const updatePosition = () => {
      const rect = anchorRef.current?.getBoundingClientRect();
      if (!rect) return;

      const viewportPadding = 16;
      const idealWidth = 540;
      const safeWidth = Math.min(idealWidth, window.innerWidth - viewportPadding * 2);

      setMenuWidth(safeWidth);
      setAlignRight(rect.right - safeWidth >= viewportPadding);
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    return () => window.removeEventListener("resize", updatePosition);
  }, [anchorRef]);

  const selectPlatform = (platform: Platform) => {
    setDraftPlatforms([platform]);

    setExpanded({
      youtube: platform === "youtube",
      instagram: platform === "instagram",
      tiktok: platform === "tiktok",
    });
  };

  const clearPlatform = (platform: Platform) => {
    setDrafts((current) => ({
      ...current,
      [platform]: createEmptyDraft(),
    }));
  };

  const handleClearAll = () => {
    setDrafts({
      youtube: createEmptyDraft(),
      instagram: createEmptyDraft(),
      tiktok: createEmptyDraft(),
    });
  };

  const applyChanges = () => {
    const selectedPlatform = draftPlatforms[0] || "youtube";

    flushSync(() => {
      setPlatforms([selectedPlatform]);

      PLATFORM_ORDER.forEach((platform) => {
        const draft = drafts[platform];

        updateFilter(`platform.${platform}.followersMin`, parseNumber(draft.followersMin));
        updateFilter(`platform.${platform}.followersMax`, parseNumber(draft.followersMax));
        updateFilter(`platform.${platform}.avgViewsMin`, parseNumber(draft.avgViewsMin));
        updateFilter(`platform.${platform}.avgViewsMax`, parseNumber(draft.avgViewsMax));
        updateFilter(`platform.${platform}.engagementsMin`, parseNumber(draft.engagementsMin));
        updateFilter(`platform.${platform}.engagementsMax`, parseNumber(draft.engagementsMax));
        updateFilter(`platform.${platform}.engagementRateMin`, parseNumber(draft.engagementRateMin));
        updateFilter(`platform.${platform}.languageCode`, parseString(draft.languageCode));
        updateFilter(`platform.${platform}.lastPostedDays`, parseNumber(draft.lastPostedDays));
        updateFilter(`platform.${platform}.locationIdsText`, parseString(draft.locationIdsText));

        updateFilter(`platform.${platform}.bioQuery`, parseString(draft.bioQuery));
        updateFilter(`platform.${platform}.keywords`, parseString(draft.keywords));
        updateFilter(`platform.${platform}.relevance`, parseString(draft.relevance));
        updateFilter(`platform.${platform}.audienceRelevance`, parseString(draft.audienceRelevance));
        updateFilter(`platform.${platform}.textTags`, parseString(draft.textTags));

        updateFilter(`platform.${platform}.hasAudienceData`, draft.hasAudienceData || undefined);
        updateFilter(`platform.${platform}.contactEmailOnly`, draft.contactEmailOnly || undefined);

        updateFilter(`platform.${platform}.followersGrowthInterval`, parseString(draft.followersGrowthInterval));
        updateFilter(`platform.${platform}.followersGrowthOperator`, parseString(draft.followersGrowthOperator));
        updateFilter(`platform.${platform}.followersGrowthValue`, parseNumber(draft.followersGrowthValue));

        updateFilter(`platform.${platform}.viewsGrowthInterval`, parseString(draft.viewsGrowthInterval));
        updateFilter(`platform.${platform}.viewsGrowthOperator`, parseString(draft.viewsGrowthOperator));
        updateFilter(`platform.${platform}.viewsGrowthValue`, parseNumber(draft.viewsGrowthValue));

        updateFilter(`platform.${platform}.likesGrowthInterval`, parseString(draft.likesGrowthInterval));
        updateFilter(`platform.${platform}.likesGrowthOperator`, parseString(draft.likesGrowthOperator));
        updateFilter(`platform.${platform}.likesGrowthValue`, parseNumber(draft.likesGrowthValue));

        updateFilter(`platform.${platform}.reelsPlaysMin`, parseNumber(draft.reelsPlaysMin));
        updateFilter(`platform.${platform}.reelsPlaysMax`, parseNumber(draft.reelsPlaysMax));

        updateFilter(`platform.${platform}.sharesMin`, parseNumber(draft.sharesMin));
        updateFilter(`platform.${platform}.sharesMax`, parseNumber(draft.sharesMax));
        updateFilter(`platform.${platform}.savesMin`, parseNumber(draft.savesMin));
        updateFilter(`platform.${platform}.savesMax`, parseNumber(draft.savesMax));

        updateFilter(`platform.${platform}.interestsIdsText`, parseString(draft.interestsIdsText));
        updateFilter(`platform.${platform}.brandsIdsText`, parseString(draft.brandsIdsText));
        updateFilter(`platform.${platform}.igAccountTypesText`, parseString(draft.igAccountTypesText));

        updateFilter(`platform.${platform}.hasSponsoredPosts`, draft.hasSponsoredPosts || undefined);
        updateFilter(`platform.${platform}.hasYouTube`, draft.hasYouTube || undefined);
        updateFilter(`platform.${platform}.isOfficialArtist`, draft.isOfficialArtist || undefined);
      });
    });

    onApply?.();
    onClose();
  };

  return (
    <div
      style={{ width: `${menuWidth}px` }}
      className={cn(
        "absolute top-[calc(100%+8px)] z-50 max-h-[min(82vh,48rem)] overflow-y-auto rounded-[18px] border border-[#E7E7E7] bg-white shadow-[0_18px_48px_rgba(0,0,0,0.12)]",
        alignRight ? "right-0" : "left-0"
      )}
    >
      <div className="space-y-4">
        <div className="border border-[#EAEAEA] bg-white p-3">
          <div className="mb-2">
            <h3 className="text-[12px] font-semibold text-[#1A1A1A]">
              Select Platform
            </h3>
            <p className="mt-1 text-[10px] text-[#8A8A8A]">
              Select one platform at a time to apply platform-specific filters.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            {PLATFORM_ORDER.map((platform) => {
              const selected = draftPlatforms.includes(platform);
              return (
                <PlatformIconButton
                  key={platform}
                  selected={selected}
                  onClick={() => selectPlatform(platform)}
                >
                  <span className="text-[#1A1A1A]">
                    {platformConfig[platform].icon}
                  </span>
                </PlatformIconButton>
              );
            })}
          </div>
        </div>

        {selectedPlatforms.length > 0 ? (
          <div className="flex flex-col gap-3">
            {selectedPlatforms.map((platform) => (
              <PlatformSection
                key={platform}
                platform={platform}
                draft={drafts[platform]}
                setDraft={(patch) =>
                  setDrafts((current) => ({
                    ...current,
                    [platform]: {
                      ...current[platform],
                      ...patch,
                    },
                  }))
                }
                onClear={() => clearPlatform(platform)}
                expanded={expanded[platform]}
                onToggle={() =>
                  setExpanded((current) => ({
                    ...current,
                    [platform]: !current[platform],
                  }))
                }
              />
            ))}
          </div>
        ) : null}
      </div>

      <div className="sticky bottom-0 flex flex-col gap-3 border-t border-[#ECECEC] bg-white p-4 sm:flex-row sm:items-center sm:justify-end">
        <button
          type="button"
          onClick={handleClearAll}
          className="inline-flex h-10 items-center justify-center rounded-[10px] border border-[#E5E5E5] bg-white px-4 text-[12px] font-semibold text-[#1A1A1A]"
        >
          Clear all filters
        </button>

        <button
          type="button"
          onClick={applyChanges}
          className="inline-flex h-10 min-w-[120px] items-center justify-center rounded-[10px] bg-[#121417] px-5 text-[12px] font-semibold text-white"
        >
          Apply
        </button>
      </div>
    </div>
  );
}