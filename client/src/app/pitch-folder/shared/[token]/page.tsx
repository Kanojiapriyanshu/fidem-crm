"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { get, post } from "@/lib/api";
import swal from "sweetalert";
import {
  ExternalLink,
  Loader2,
  Users,
  Heart,
  Globe,
  Sparkles,
  Eye,
  X,
  Building2,
  ShieldCheck,
  Tags,
  Zap,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type SharedMediaKitAccess = {
  hasAdded?: boolean;
  allowed?: boolean;
  availableOnRequest?: boolean;
  requestStatus?: "none" | "requested" | "approved" | "rejected";
  requestedAt?: string | null;
  buttonLabel?: string;
  url?: string;
};

type SharedRow = {
  _id: string;
  provider?: string;
  name?: string;
  handle?: string;
  followers?: number | null;
  primaryLink?: string;
  links?: string[];
  niche?: string[];
  country?: string;
  selectionReason?: string;
  goodFit?: boolean | null;
  platformRateCard?: string;
  rateCardCurrency?: string;
  mediaKitAccess?: SharedMediaKitAccess | null;
};

type SharedFolderResponse = {
  success: boolean;
  data: {
    _id: string;
    title: string;
    description?: string;
    brandName?: string;
    share?: {
      token?: string;
      url?: string;
      generatedAt?: string | null;
    };
    items: SharedRow[];
  };
};

const DASH = "--";

function fmtFollowers(n: number | null | undefined): string {
  if (n == null) return DASH;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toLocaleString();
}

function formatDateTime(iso?: string | null) {
  if (!iso) return DASH;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return DASH;

  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

function cleanText(value?: string | null) {
  return String(value || "").trim();
}

function getApiErrorMessage(error: any, fallback = "Something went wrong.") {
  const possibleMessage =
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.data?.message ||
    error?.data?.error ||
    error?.message ||
    "";

  if (typeof possibleMessage !== "string") return fallback;

  const trimmed = possibleMessage.trim();
  if (!trimmed) return fallback;

  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    try {
      const parsed = JSON.parse(trimmed);
      return parsed?.message || parsed?.error || fallback;
    } catch {
      return trimmed;
    }
  }

  return trimmed;
}

function normalizeSharedActionError(message?: string | null) {
  const text = cleanText(message);
  const normalized = text.toLowerCase();

  if (
    normalized.includes("campaign is assigned") ||
    normalized.includes("assigned campaign") ||
    normalized.includes("already active") ||
    normalized.includes("active on this campaign") ||
    normalized.includes("working on this campaign") ||
    (normalized.includes("campaign") &&
      (normalized.includes("unfit") ||
        normalized.includes("good fit") ||
        normalized.includes("cannot") ||
        normalized.includes("not allowed")))
  ) {
    return "This influencer is already active or working on this campaign.";
  }

  return text || "Something went wrong.";
}

async function showActionAlert(
  message: string,
  title = "Action not allowed",
  icon: "error" | "warning" | "success" = "warning"
) {
  await swal({
    title,
    text: message,
    icon,
  });
}

function getNicheText(niche?: string[]) {
  return Array.isArray(niche) && niche.length ? niche.join(", ") : DASH;
}

function getHandleWithoutAt(handle?: string) {
  return cleanText(handle).replace(/^@+/, "");
}

function buildFallbackProfileUrl(provider?: string, handle?: string) {
  const username = getHandleWithoutAt(handle);
  if (!username) return "";

  const p = cleanText(provider).toLowerCase();

  if (p === "youtube") return `https://youtube.com/@${username}`;
  if (p === "instagram") return `https://instagram.com/${username}`;
  if (p === "tiktok") return `https://tiktok.com/@${username}`;

  return "";
}

function getProfileUrl(row: SharedRow) {
  return (
    cleanText(row.primaryLink) ||
    (Array.isArray(row.links) && row.links.length ? cleanText(row.links[0]) : "") ||
    buildFallbackProfileUrl(row.provider, row.handle)
  );
}

function getCompactReasonTitle(row?: SharedRow | null) {
  if (!row) return "Selection Reason";
  return `${row.name || row.handle || "Influencer"} - Selection Reason`;
}


const CHIP_STYLES: Record<string, string> = {
  instagram: "bg-pink-50 text-pink-600 ring-pink-200",
  youtube: "bg-red-50 text-red-600 ring-red-200",
  tiktok: "bg-slate-100 text-slate-700 ring-slate-200",
  default: "bg-slate-100 text-slate-600 ring-slate-200",
};

function providerChip(provider?: string) {
  const key = String(provider || "").toLowerCase();
  return CHIP_STYLES[key] || CHIP_STYLES.default;
}

function StatCard({
  icon: Icon,
  label,
  value,
  accentClass,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  accentClass: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-none transition-colors duration-200 hover:border-slate-300">
      <div className="flex items-start justify-between">
        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-widest text-slate-500">
            {label}
          </p>
          <p className="text-2xl font-bold tracking-tight text-slate-900">
            {value}
          </p>
        </div>
        <span
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${accentClass}`}
        >
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </div>
  );
}

function GoodFitButton({
  checked,
  saving,
  disabled,
  onToggle,
}: {
  checked: boolean;
  saving: boolean;
  disabled: boolean;
  onToggle: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => !saving && !disabled && onToggle(!checked)}
      disabled={saving || disabled}
      aria-label="Toggle good fit"
      className={`group relative flex h-9 w-9 items-center justify-center rounded-full border transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 ${
        checked
          ? "border-rose-200 bg-rose-50 text-rose-500 shadow-sm"
          : "border-slate-200 bg-slate-50 text-slate-400 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-500"
      } ${(saving || disabled) ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
    >
      {saving ? (
        <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
      ) : (
        <Heart
          className={`h-4 w-4 transition-transform duration-200 ${
            checked ? "fill-current scale-110" : "group-hover:scale-110"
          }`}
        />
      )}
    </button>
  );
}

function ProviderBadge({ provider }: { provider?: string }) {
  const value = String(provider || "other");
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${providerChip(
        value
      )}`}
    >
      {value}
    </span>
  );
}

function ModalShell({
  open,
  title,
  description,
  onClose,
  children,
  maxWidthClass = "max-w-4xl",
}: {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
  maxWidthClass?: string;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
      <div className="absolute inset-0" onClick={onClose} />
      <div
        className={`relative z-10 flex max-h-[92vh] w-full ${maxWidthClass} flex-col overflow-hidden rounded-3xl bg-white shadow-2xl`}
      >
        <div className="flex items-start justify-between gap-4 border-b px-6 py-5">
          <div>
            <h3 className="text-xl font-semibold text-slate-950">{title}</h3>
            {description ? (
              <p className="mt-1 text-sm text-slate-500">{description}</p>
            ) : null}
          </div>
          <button
            onClick={onClose}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <X className="h-4 w-4" />
            Close
          </button>
        </div>
        <div className="flex-1 overflow-auto px-6 py-6">{children}</div>
      </div>
    </div>
  );
}

function getStickyFitCellClass(isHeader = false) {
  return [
    "sticky right-0 z-20",
    isHeader
      ? "bg-white shadow-[-1px_0_0_0_rgba(226,232,240,1)]"
      : "bg-white shadow-[-1px_0_0_0_rgba(241,245,249,1)]",
  ].join(" ");
}

export default function SharedPitchFolderPage() {
  const params = useParams();
  const token = String(params?.token || "");

  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState("");
  const [rows, setRows] = useState<SharedRow[]>([]);
  const [title, setTitle] = useState("Shared Pitch Folder");
  const [description, setDescription] = useState("");
  const [brandName, setBrandName] = useState("");
  const [rateCardItemId, setRateCardItemId] = useState("");
  const [selectionReasonItemId, setSelectionReasonItemId] = useState("");

  const reloadSheet = useCallback(async () => {
    const resp = await get<SharedFolderResponse>(`/pitch-folders/shared/${token}`);
    setTitle(resp?.data?.title || "Shared Pitch Folder");
    setDescription(resp?.data?.description || "");
    setBrandName(cleanText(resp?.data?.brandName));
    setRows(resp?.data?.items || []);
  }, [token]);

  useEffect(() => {
    async function loadSheet() {
      if (!token) return;

      try {
        setLoading(true);
        await reloadSheet();
      } catch (e: any) {
        await showActionAlert(
          normalizeSharedActionError(getApiErrorMessage(e, "Failed to load shared folder")),
          "Unable to load shared folder",
          "error"
        );
      } finally {
        setLoading(false);
      }
    }

    loadSheet();
  }, [token, reloadSheet]);

  async function saveGoodFit(id: string, goodFit: boolean) {
    try {
      setSavingId(id);
      const resp = await post(`/pitch-folders/shared/${token}/good-fit/${id}`, {
        goodFit,
      });

      const updated = resp?.data;
      setRows((prev) =>
        prev.map((item) =>
          item._id === id ? { ...item, goodFit: !!updated?.goodFit } : item
        )
      );
    } catch (e: any) {
      await showActionAlert(
        normalizeSharedActionError(getApiErrorMessage(e, "Failed to update good fit")),
        "Unable to update fit",
        "warning"
      );
      await reloadSheet().catch(() => undefined);
    } finally {
      setSavingId("");
    }
  }

  async function requestMediaKit(id: string) {
    try {
      setSavingId(`media-kit-${id}`);
      await post(`/pitch-folders/shared/${token}/media-kit-request/${id}`, {});
      await reloadSheet();
    } catch (e: any) {
      await showActionAlert(
        normalizeSharedActionError(getApiErrorMessage(e, "Failed to request demographics")),
        "Unable to request demographics",
        "warning"
      );
    } finally {
      setSavingId("");
    }
  }

  const handleMediaKitAction = useCallback(
    async (row: SharedRow) => {
      const access = row.mediaKitAccess;

      if (access?.allowed && access?.url) {
        window.open(access.url, "_blank", "noopener,noreferrer");
        return;
      }

      if (
        access?.requestStatus !== "requested" &&
        savingId !== `media-kit-${row._id}`
      ) {
        await requestMediaKit(row._id);
      }
    },
    [savingId]
  );

  const rateCardRow = useMemo(
    () => rows.find((row) => row._id === rateCardItemId) || null,
    [rows, rateCardItemId]
  );

  const selectionReasonRow = useMemo(
    () => rows.find((row) => row._id === selectionReasonItemId) || null,
    [rows, selectionReasonItemId]
  );

  const stats = useMemo(
    () => ({
      total: rows.length,
      goodFit: rows.filter((r) => r.goodFit).length,
      totalReach: rows.reduce((s, r) => s + (r.followers || 0), 0),
      pendingRequests: rows.filter(
        (r) => r.mediaKitAccess?.requestStatus === "requested"
      ).length,
    }),
    [rows]
  );

  useEffect(() => {
    if (document.getElementById("pitch-sheet-fonts")) return;
    const link = document.createElement("link");
    link.id = "pitch-sheet-fonts";
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap";
    document.head.appendChild(link);
  }, []);

  if (loading) {
    return (
      <div
        className="min-h-screen bg-slate-50/50 p-6 md:p-10"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        <div className="mx-auto max-w-7xl space-y-6">
          <Skeleton className="h-10 w-48 rounded-xl bg-slate-200/60" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-2xl bg-white shadow-sm" />
            ))}
          </div>
          <Skeleton className="h-[420px] w-full rounded-2xl bg-white shadow-sm" />
        </div>
      </div>
    );
  }

  const statCards = [
    {
      icon: Users,
      label: "Total Creators",
      value: stats.total,
      accentClass: "bg-teal-50 text-teal-600",
    },
    {
      icon: Heart,
      label: "Shortlisted",
      value: stats.goodFit,
      accentClass: "bg-rose-50 text-rose-500",
    },
    {
      icon: Users,
      label: "Total Reach",
      value: fmtFollowers(stats.totalReach),
      accentClass: "bg-lime-50 text-lime-700",
    },
  ];

  const valueProps = [
    {
      icon: ShieldCheck,
      title: "Hand-Vetted Roster",
      description: `Every one of these ${stats.total} creator${
        stats.total !== 1 ? "s" : ""
      } was personally reviewed and hand-picked by our talent team for this campaign — not pulled from a generic database.`,
      accentClass: "bg-teal-50 text-teal-600",
    },
    {
      icon: Zap,
      title: "Real, Combined Reach",
      description: `A combined audience of ${fmtFollowers(
        stats.totalReach
      )} followers across this shortlist, ready to be activated as soon as you give the go-ahead.`,
      accentClass: "bg-lime-50 text-lime-700",
    },
    {
      icon: Building2,
      title: "Curated, Not Crowdsourced",
      description:
        "No open marketplace, no self-nominated influencers. Every profile here was matched to your brand's niche and audience by our team.",
      accentClass: "bg-amber-50 text-amber-700",
    },
    {
      icon: Tags,
      title: "Transparent Rate Cards",
      description:
        "Each creator's rate card is available up front so you can plan budgets with full visibility before committing.",
      accentClass: "bg-slate-100 text-slate-700",
    },
  ];

  return (
    <>
      <style>{`
        .pitch-sheet-root * { font-family: 'Inter', sans-serif; }

        .pitch-sheet-root ::-webkit-scrollbar { height: 6px; width: 6px; }
        .pitch-sheet-root ::-webkit-scrollbar-track { background: transparent; }
        .pitch-sheet-root ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 99px; }
        .pitch-sheet-root ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }

        .selection-reason-preview {
          display: -webkit-box;
          -webkit-line-clamp: 4;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>

      <ModalShell
        open={!!rateCardRow}
        title={
          rateCardRow
            ? `${rateCardRow.name || "Influencer"} - Rate Card`
            : "Rate Card"
        }
        onClose={() => setRateCardItemId("")}
      >
        {rateCardRow ? (
          <div className="rounded-2xl border bg-slate-50 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-slate-950">Rate Card</p>
              <span className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-200">
                {rateCardRow.rateCardCurrency || "USD"}
              </span>
            </div>

            <div className="min-h-[320px] rounded-2xl border bg-white p-4 text-sm leading-7 whitespace-pre-wrap text-slate-700">
              {rateCardRow.platformRateCard || DASH}
            </div>
          </div>
        ) : null}
      </ModalShell>

      <ModalShell
        open={!!selectionReasonRow}
        title={getCompactReasonTitle(selectionReasonRow)}
        description="Full selection rationale for this creator."
        onClose={() => setSelectionReasonItemId("")}
        maxWidthClass="max-w-3xl"
      >
        {selectionReasonRow ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <ProviderBadge provider={selectionReasonRow.provider} />
              {selectionReasonRow.handle ? (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                  {selectionReasonRow.handle}
                </span>
              ) : null}
              {selectionReasonRow.followers ? (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                  {fmtFollowers(selectionReasonRow.followers)} followers
                </span>
              ) : null}
            </div>

            <div className="max-h-[68vh] overflow-auto rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm leading-7 whitespace-pre-wrap text-slate-700">
              {cleanText(selectionReasonRow.selectionReason) || DASH}
            </div>
          </div>
        ) : null}
      </ModalShell>

      <div className="pitch-sheet-root relative min-h-screen overflow-x-hidden bg-slate-50/50">
        <div className="relative border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-[96rem] px-4 py-8 md:px-8 md:py-10">
            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
              <div className="flex items-start gap-4">
                <div className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white p-2 sm:flex">
                  <img
                    src="/logo.png"
                    alt="Fidem logo"
                    className="h-full w-full object-contain"
                  />
                </div>
                <div>
                  <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-teal-700">
                    <Sparkles className="h-3.5 w-3.5" /> Curated
                    Pitch Folder
                  </div>

                  {brandName ? (
                    <p className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-500">
                      Prepared exclusively for {brandName}
                    </p>
                  ) : null}

                  <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
                    {title}
                  </h1>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                    {description ||
                      "A hand-selected shortlist of creators, prepared by the Fidem team for your review."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 mx-auto max-w-[96rem] px-4 py-8 md:px-8">

          {rows.length > 0 && (
            <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-2 xl:grid-cols-3 lg:gap-3">
              {statCards.map((card) => (
                <StatCard
                  key={card.label}
                  icon={card.icon}
                  label={card.label}
                  value={card.value}
                  accentClass={card.accentClass}
                />
              ))}
            </div>
          )}

          {rows.length > 0 && (
            <div className="mb-10">
              <div className="mb-5 flex items-center gap-2">
                <h2 className="text-lg font-bold tracking-tight text-slate-900">
                  Why Partner With Us
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {valueProps.map((prop) => (
                  <div
                    key={prop.title}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-none transition-colors duration-200 hover:border-slate-300"
                  >
                    <span
                      className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${prop.accentClass}`}
                    >
                      <prop.icon className="h-5 w-5" />
                    </span>
                    <p className="text-sm font-semibold text-slate-900">
                      {prop.title}
                    </p>
                    <p className="mt-1.5 text-xs leading-5 text-slate-500">
                      {prop.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-bold tracking-tight text-slate-900">
              {rows.length > 0
                ? `Curated Creators (${rows.length})`
                : "Curated Creators"}
            </h2>
            {rows.length > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-medium text-slate-500">Live</span>
              </div>
            )}
          </div>

          {!rows.length ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white py-28 text-center shadow-sm">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-slate-100 bg-slate-50">
                <Users className="h-8 w-8 text-slate-400" />
              </div>
              <p className="text-base font-semibold text-slate-900">
                No influencers yet
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Candidates will appear here once shared.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {rows.map((row) => {
                const access = row.mediaKitAccess;
                const isRequesting = savingId === `media-kit-${row._id}`;
                const isFitSaving = savingId === row._id;
                const profileUrl = getProfileUrl(row);
                const niche = getNicheText(row.niche);

                const mediaButtonLabel = access?.allowed
                  ? "Insights"
                  : access?.requestStatus === "requested"
                  ? "Requested"
                  : "Request";

                const mediaButtonDisabled =
                  access?.requestStatus === "requested" || isRequesting;

                return (
                  <div
                    key={row._id}
                    className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-none transition-colors duration-200 hover:border-teal-300"
                  >
                    <div className="flex items-start justify-between gap-3 border-b border-slate-100 p-5">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-teal-50 text-base font-bold text-teal-700 ring-1 ring-inset ring-teal-100/50">
                          {row.name?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900">
                            {row.name || DASH}
                          </p>
                          <p className="truncate text-xs text-slate-500">
                            {row.handle || DASH}
                          </p>
                        </div>
                      </div>

                      <GoodFitButton
                        checked={!!row.goodFit}
                        saving={isFitSaving}
                        disabled={savingId !== "" && !isFitSaving}
                        onToggle={(v) => saveGoodFit(row._id, v)}
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-2 px-5 pt-4">
                      <ProviderBadge provider={row.provider} />
                      <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 ring-1 ring-inset ring-slate-200">
                        <Users className="h-3 w-3 text-slate-400" />
                        {fmtFollowers(row.followers)}
                      </span>
                      {row.country ? (
                        <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 ring-1 ring-inset ring-slate-200">
                          <Globe className="h-3 w-3 text-slate-400" />
                          {row.country}
                        </span>
                      ) : null}
                    </div>

                    <div className="px-5 pt-3">
                      <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                        Niche
                      </p>
                      <p className="mt-1 text-sm leading-5 text-slate-700">
                        {niche}
                      </p>
                    </div>

                    {cleanText(row.selectionReason) ? (
                      <div className="mt-3 px-5">
                        <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                          Why We Picked Them
                        </p>
                        <div className="selection-reason-preview mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
                          {cleanText(row.selectionReason)}
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectionReasonItemId(row._id)}
                          className="mt-1.5 inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View full reason
                        </button>
                      </div>
                    ) : null}

                    <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-slate-100 p-5">
                      {profileUrl ? (
                        <a
                          href={profileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          Profile
                        </a>
                      ) : null}

                      <button
                        onClick={() => setRateCardItemId(row._id)}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Rate Card
                      </button>

                      <button
                        onClick={() => void handleMediaKitAction(row)}
                        disabled={mediaButtonDisabled}
                        className="inline-flex items-center gap-2 rounded-xl border border-teal-200 bg-teal-50 px-3.5 py-2 text-xs font-semibold text-teal-700 hover:bg-teal-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isRequesting ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : access?.allowed ? (
                          <ExternalLink className="h-3.5 w-3.5" />
                        ) : (
                          <Eye className="h-3.5 w-3.5" />
                        )}
                        {mediaButtonLabel}
                      </button>
                    </div>

                    {access?.requestedAt ? (
                      <p className="px-5 pb-4 text-xs text-slate-500">
                        Requested: {formatDateTime(access.requestedAt)}
                      </p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}

          {rows.length > 0 && (
            <p className="mt-8 text-center text-sm text-slate-500">
              Click the <Heart className="inline h-3.5 w-3.5 text-rose-500" /> icon
              to mark influencers as a good fit.
            </p>
          )}
        </div>
      </div>
    </>
  );
}