"use client";

import React from "react";
import {
  Kanban,
  Telescope,
  UserCog,
  Sparkles,
} from "lucide-react";

export type IconType = React.ElementType;

export type AdminChildLink = {
  key: string;
  label: string;
  href: string;
};

export type AdminPermission = {
  key?: string;
  isEdit?: boolean;
  isDelete?: boolean;
  isManager?: boolean;
};

export type AdminModule = {
  key: string;
  label: string;
  href: string;
  icon: IconType;
  aliases?: string[];
  children?: AdminChildLink[];
};

export type AdminPermissionSection = {
  key: string;
  title: string;
  icon: IconType;
  items: string[];
};

export const ADMIN_MODULES: AdminModule[] = [
  {
    key: "pipelines",
    label: "Pitch Sheets",
    href: "/admin/pitch-folders",
    icon: Kanban,
    aliases: [
      "pitch-folders",
      "pitchfolders",
      "pitch-sheet",
      "pitchsheet",
    ],
  },
  {
    key: "influencer-discovery",
    label: "Influencer Discovery",
    href: "/admin/influencer-data",
    icon: Telescope,
    aliases: [
      "influencer-discovery",
      "influencerdiscovery",
      "influencer-data",
      "influencerdata",
      "youtube",
      "yt-data",
      "ytdata",
      "modash",
      "modash-data",
      "modashdata",
      "influencer-pipeline",
      "influencerpipeline",
    ],
  },
  {
    key: "campaign-reports",
    label: "Insight OS (Live)",
    href: "/admin/campaign-reports",
    icon: Sparkles,
    aliases: ["campaign-reports", "campaignreports", "insight-os", "insightos", "campaign-report"],
  },
];

export const ROLE_PERMISSION_SECTIONS: AdminPermissionSection[] = [
  {
    key: "core",
    title: "Core Modules",
    icon: UserCog,
    items: [
      "pipelines",
      "influencer-discovery",
      "campaign-reports",
    ],
  },
];

export function normalizeModuleKey(value?: string) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[\s_-]+/g, "");
}

const MODULE_KEY_MAP = new Map<string, string>();

for (const module of ADMIN_MODULES) {
  MODULE_KEY_MAP.set(normalizeModuleKey(module.key), module.key);

  for (const alias of module.aliases || []) {
    MODULE_KEY_MAP.set(normalizeModuleKey(alias), module.key);
  }
}

export function canonicalizeModuleKey(value?: string) {
  const normalized = normalizeModuleKey(value);
  return MODULE_KEY_MAP.get(normalized) || String(value || "");
}

export function getAdminModule(value?: string) {
  const canonicalKey = canonicalizeModuleKey(value);
  return ADMIN_MODULES.find((item) => item.key === canonicalKey);
}

export function hasModuleAccess(
  permissionEntries: Array<string | AdminPermission> = [],
  moduleKey?: string
) {
  const wanted = canonicalizeModuleKey(moduleKey);

  return permissionEntries.some((entry) => {
    if (typeof entry === "string") {
      return canonicalizeModuleKey(entry) === wanted;
    }

    return canonicalizeModuleKey(entry?.key) === wanted;
  });
}

export function canEditModule(
  permissions: AdminPermission[] = [],
  moduleKey?: string
) {
  const wanted = canonicalizeModuleKey(moduleKey);

  return permissions.some(
    (item) =>
      canonicalizeModuleKey(item?.key) === wanted && item?.isEdit === true
  );
}

export function canDeleteModule(
  permissions: AdminPermission[] = [],
  moduleKey?: string
) {
  const wanted = canonicalizeModuleKey(moduleKey);

  return permissions.some(
    (item) =>
      canonicalizeModuleKey(item?.key) === wanted && item?.isDelete === true
  );
}

export function canManageModule(
  permissions: AdminPermission[] = [],
  moduleKey?: string
) {
  const wanted = canonicalizeModuleKey(moduleKey);

  return permissions.some(
    (item) =>
      canonicalizeModuleKey(item?.key) === wanted && item?.isManager === true
  );
}