import React from "react";
import type { FilterState, Platform } from "./filters";
import { LANGUAGE_OPTIONS } from "./filters";

type PlanName = "free" | "growth" | "pro" | "premium";

const PLAN_RANK: Record<PlanName, number> = {
  free: 0,
  growth: 1,
  pro: 2,
  premium: 3,
};

interface Props {
  platforms: Platform[];
  filters: FilterState;
  updateFilter: (path: string, value: any) => void;
  plan?: PlanName;
}

const Num = (props: {
  value?: number;
  onChange: (n?: number) => void;
  placeholder?: string;
  min?: number;
  max?: number;
}) => (
  <input
    type="number"
    className="w-full rounded-md border px-3 py-2 text-sm"
    value={props.value ?? ""}
    placeholder={props.placeholder}
    min={props.min}
    max={props.max}
    onChange={(event) => props.onChange(event.target.value === "" ? undefined : Number(event.target.value))}
  />
);

export function InfluencerFilters({ platforms, filters, updateFilter, plan = "free" }: Props) {
  const selectedPlatforms = platforms.length ? platforms : (["youtube"] as Platform[]);
  const primaryPlatform = selectedPlatforms[0];
  const primaryFilters = filters.platform[primaryPlatform];
  const hasIG = selectedPlatforms.includes("instagram");
  const hasTT = selectedPlatforms.includes("tiktok");
  const hasYT = selectedPlatforms.includes("youtube");

  const rank = PLAN_RANK[plan] ?? PLAN_RANK.free;
  const isGrowthPlus = rank >= PLAN_RANK.growth;

  return (
    <div className="space-y-6 lg:space-y-7 xl:space-y-8">
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">Followers / Subscribers Range</label>
        <div className="grid grid-cols-2 gap-3 lg:gap-4 xl:gap-5">
          <Num
            value={primaryFilters.followersMin}
            onChange={(value) => updateFilter(`platform.${primaryPlatform}.followersMin`, value)}
            placeholder="Min"
          />
          <Num
            value={primaryFilters.followersMax}
            onChange={(value) => updateFilter(`platform.${primaryPlatform}.followersMax`, value)}
            placeholder="Max"
          />
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">Minimum Engagement Rate</label>
        <Num
          value={primaryFilters.engagementRateMin}
          onChange={(value) => updateFilter(`platform.${primaryPlatform}.engagementRateMin`, value)}
          placeholder="e.g. 3.5"
          min={0}
          max={100}
        />
        <p className="mt-1 text-xs text-gray-500">Use percentage values like 3.5 for 3.5%.</p>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">Language</label>
        <select
          className="w-full rounded-md border px-3 py-2 text-sm"
          value={primaryFilters.languageCode ?? ""}
          onChange={(event) => updateFilter(`platform.${primaryPlatform}.languageCode`, event.target.value || undefined)}
        >
          {LANGUAGE_OPTIONS.map((option) => (
            <option key={option.value || "any"} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {isGrowthPlus ? (
        <>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Age Range</label>
            <div className="grid grid-cols-2 gap-3 lg:gap-4 xl:gap-5">
              <Num
                value={filters.influencer.ageMin}
                onChange={(value) => updateFilter("influencer.ageMin", value)}
                placeholder="Min"
              />
              <Num
                value={filters.influencer.ageMax}
                onChange={(value) => updateFilter("influencer.ageMax", value)}
                placeholder="Max"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Gender</label>
            <select
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={filters.influencer.gender ?? ""}
              onChange={(event) => updateFilter("influencer.gender", event.target.value || undefined)}
            >
              <option value="">Any</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="NON_BINARY">Non-binary</option>
            </select>
          </div>

          <div className="flex items-center">
            <input
              id="verified-only"
              type="checkbox"
              className="h-4 w-4"
              checked={!!filters.influencer.isVerified}
              onChange={(event) => updateFilter("influencer.isVerified", event.target.checked || undefined)}
            />
            <label htmlFor="verified-only" className="ml-2 text-sm">
              Verified accounts only
            </label>
          </div>
        </>
      ) : null}

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">Average views</label>
        <div className="grid grid-cols-2 gap-3 lg:gap-4 xl:gap-5">
          <Num
            value={primaryFilters.avgViewsMin}
            onChange={(value) => updateFilter(`platform.${primaryPlatform}.avgViewsMin`, value)}
            placeholder="Min"
          />
          <Num
            value={primaryFilters.avgViewsMax}
            onChange={(value) => updateFilter(`platform.${primaryPlatform}.avgViewsMax`, value)}
            placeholder="Max"
          />
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">Last posted within days</label>
        <Num
          value={primaryFilters.lastPostedDays}
          onChange={(value) => updateFilter(`platform.${primaryPlatform}.lastPostedDays`, value)}
          placeholder="30 / 90 / 180"
        />
      </div>

      {(hasIG || hasTT || hasYT) && selectedPlatforms.length > 1 ? (
        <p className="text-xs text-gray-500">
          These quick fields edit the first selected platform. Use the platform dropdown for separate filters per platform.
        </p>
      ) : null}
    </div>
  );
}
