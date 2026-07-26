"use client";

import React from "react";
import type { FilterState, Platform } from "./filters";
import {
  AUDIENCE_AGE_OPTIONS,
  AUDIENCE_GENDER_OPTIONS,
  LANGUAGE_OPTIONS,
} from "./filters";

type PlanName = "free" | "growth" | "pro" | "premium";

const PLAN_RANK: Record<PlanName, number> = {
  free: 0,
  growth: 1,
  pro: 2,
  premium: 3,
};

interface Props {
  filters: FilterState;
  updateFilter: (path: string, value: any) => void;
  platforms?: Platform[];
  plan?: PlanName;
}

function Num(props: {
  value?: number;
  onChange: (n?: number) => void;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <input
      type="number"
      className="w-full rounded-md border px-3 py-2 text-sm"
      value={props.value ?? ""}
      placeholder={props.placeholder}
      min={props.min}
      max={props.max}
      step={props.step}
      onChange={(event) =>
        props.onChange(event.target.value === "" ? undefined : Number(event.target.value))
      }
    />
  );
}

export default function AudienceFilters({
  filters,
  updateFilter,
  plan = "free",
}: Props) {
  const rank = PLAN_RANK[plan] ?? PLAN_RANK.free;
  const isProPlus = rank >= PLAN_RANK.pro;

  if (!isProPlus) {
    return (
      <div className="mb-4 space-y-4">
        <p className="text-xs text-gray-500">
          Audience filters are available on Pro and Premium plans.
        </p>
      </div>
    );
  }

  return (
    <div className="mb-4 space-y-4">
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Audience country text
        </label>
        <input
          className="w-full rounded-md border px-3 py-2 text-sm"
          value={filters.audience.country ?? ""}
          onChange={(event) =>
            updateFilter("audience.country", event.target.value || undefined)
          }
          placeholder="India"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Audience location IDs
        </label>
        <input
          className="w-full rounded-md border px-3 py-2 text-sm"
          value={filters.audience.locationIdsText ?? ""}
          onChange={(event) =>
            updateFilter("audience.locationIdsText", event.target.value || undefined)
          }
          placeholder="148838,62149"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Location weight
        </label>
        <Num
          value={filters.audience.locationWeight}
          onChange={(value) => updateFilter("audience.locationWeight", value)}
          placeholder="0.2"
          min={0}
          max={1}
          step={0.1}
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Audience language
        </label>
        <select
          className="w-full rounded-md border px-3 py-2 text-sm"
          value={filters.audience.languageCode ?? ""}
          onChange={(event) =>
            updateFilter("audience.languageCode", event.target.value || undefined)
          }
        >
          {LANGUAGE_OPTIONS.map((option) => (
            <option key={option.label} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Language weight
        </label>
        <Num
          value={filters.audience.languageWeight}
          onChange={(value) => updateFilter("audience.languageWeight", value)}
          placeholder="0.2"
          min={0}
          max={1}
          step={0.1}
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Audience gender
        </label>
        <select
          className="w-full rounded-md border px-3 py-2 text-sm"
          value={filters.audience.gender ?? ""}
          onChange={(event) =>
            updateFilter("audience.gender", event.target.value || undefined)
          }
        >
          {AUDIENCE_GENDER_OPTIONS.map((option) => (
            <option key={option.label} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Gender weight
        </label>
        <Num
          value={filters.audience.genderWeight}
          onChange={(value) => updateFilter("audience.genderWeight", value)}
          placeholder="0.5"
          min={0}
          max={1}
          step={0.1}
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Audience age bucket
        </label>
        <select
          className="w-full rounded-md border px-3 py-2 text-sm"
          value={filters.audience.ageBucket ?? ""}
          onChange={(event) =>
            updateFilter("audience.ageBucket", event.target.value || undefined)
          }
        >
          {AUDIENCE_AGE_OPTIONS.map((option) => (
            <option key={option.label} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Age weight
        </label>
        <Num
          value={filters.audience.ageWeight}
          onChange={(value) => updateFilter("audience.ageWeight", value)}
          placeholder="0.3"
          min={0}
          max={1}
          step={0.1}
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Audience interests IDs
        </label>
        <input
          className="w-full rounded-md border px-3 py-2 text-sm"
          value={filters.audience.interestsIdsText ?? ""}
          onChange={(event) =>
            updateFilter("audience.interestsIdsText", event.target.value || undefined)
          }
          placeholder="1708,13,3"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Interests weight
        </label>
        <Num
          value={filters.audience.interestsWeight}
          onChange={(value) => updateFilter("audience.interestsWeight", value)}
          placeholder="0.3"
          min={0}
          max={1}
          step={0.1}
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Audience credibility min
        </label>
        <Num
          value={filters.audience.credibilityMin}
          onChange={(value) => updateFilter("audience.credibilityMin", value)}
          placeholder="0.75"
          min={0}
          max={1}
          step={0.01}
        />
      </div>
    </div>
  );
}