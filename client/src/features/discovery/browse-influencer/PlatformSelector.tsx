import React from "react";
import type { Platform } from "./filters";
import { platformTheme } from "./utils/platform";

interface PlatformSelectorProps {
  selected: Platform[];
  onChange: (platforms: Platform[]) => void;
}

export function PlatformSelector({ selected, onChange }: PlatformSelectorProps) {
  const platforms: Platform[] = ["youtube", "tiktok", "instagram"];

  const toggle = (platform: Platform) => {
    const next = new Set(selected);
    if (next.has(platform)) next.delete(platform);
    else next.add(platform);
    onChange(Array.from(next.size ? next : new Set([platform])));
  };

  return (
    <div>
      <label className="mb-3 block text-sm font-medium text-gray-700">Platform(s)</label>
      <div className="grid grid-cols-3 gap-2">
        {platforms.map((platform) => {
          const theme = platformTheme[platform];
          const isSelected = selected.includes(platform);
          return (
            <button
              key={platform}
              type="button"
              onClick={() => toggle(platform)}
              className={`relative flex flex-col items-center rounded-lg border p-3 transition-all ${
                isSelected
                  ? `border-gray-700 ${theme.color} text-white shadow-md`
                  : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              }`}
              aria-pressed={isSelected}
            >
              <div className={`mb-1 ${isSelected ? "text-white" : "text-gray-600"}`}>{theme.icon}</div>
              <span className="text-xs font-medium">{theme.label}</span>
              {isSelected ? <div className="pointer-events-none absolute inset-0 rounded-lg ring-2 ring-gray-700 ring-offset-1" /> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
