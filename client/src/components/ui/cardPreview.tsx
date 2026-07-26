import React, { useMemo } from "react";
import {
  Images,
  UsersThree,
  DotsThree,
  MapPin,
  BookmarkSimpleIcon,
} from "@phosphor-icons/react";
import { PenLine, Eye } from "lucide-react";
import { Button } from "./button";
import { useRouter } from "next/navigation";

type Option = { label: string; value: string };
type IdLabelMap = Record<string, string>;
export type ProductImage =
  | string
  | {
    name?: string;
    type?: string;
    size?: number;
    dataUrl?: string;
    url?: string;
  };


export type ManualForm = {
  title?: string;
  description?: string;
  categoryName?: string;
  subcategories?: string[];
  targetCountry?: string[];
  targetAgeGroups?: string[];
  goals?: string[];
  platforms?: string[];
  hashtags?: string[];
  campaigngoal?: string;
  campaignBudget?: number;
  productImages?: ProductImage[];
};

export type PreviewMeta = {
  subcategoriesMap?: IdLabelMap;
  countryMap?: IdLabelMap;
  ageMap?: IdLabelMap;
  goalsMap?: IdLabelMap;
  hashtagsMap?: IdLabelMap;

  campaignBudget?: number;
};

/* ─────────────────────── Contract action types ─────────────────────── */

export type ContractStatus =
  | "DRAFT"
  | "BRAND_SENT_DRAFT"
  | "BRAND_EDITED"
  | "INFLUENCER_EDITED"
  | "BRAND_ACCEPTED"
  | "INFLUENCER_ACCEPTED"
  | "READY_TO_SIGN"
  | "CONTRACT_SIGNED"
  | "MILESTONES_CREATED"
  | "REJECTED"
  | "SUPERSEDED"
  | string;

export type ContractCardMeta = {
  status?: ContractStatus;
  acceptances?: {
    brand?: { accepted?: boolean; acceptedVersion?: number };
    influencer?: { accepted?: boolean; acceptedVersion?: number };
  };
  version?: number;
  signatures?: {
    brand?: { signed?: boolean };
    influencer?: { signed?: boolean };
  };
  lockedAt?: string | null;
  editsLockedAt?: string | null;
  awaitingRole?: string | null;
  contractId?: string;
  supersededBy?: string | null;
  resendOf?: string | null;
  resendIteration?: number;
};

export type ContractCardProps = {
  /** The effective contract id to act on */
  contractId: string;
  /** Live contract metadata (fetched async; null = not loaded yet) */
  meta: ContractCardMeta | null;
  onReviewAccept: () => void;
  onView: () => void;
  onSign: () => void;
  onReject: () => void;
};

/* ─────────────────────── Internal helpers ─────────────────────── */

const normSt = (s?: string) => String(s || "").trim().toUpperCase();
function hasAcceptedCurrent(
  meta: ContractCardMeta | null,
  role: "brand" | "influencer"
) {
  if (!meta) return false;
  const version = Number(meta.version || 0);
  const acceptance = meta.acceptances?.[role];
  return !!(
    acceptance?.accepted &&
    Number(acceptance.acceptedVersion || 0) === version
  );
}
function getProductImageSrc(img?: ProductImage) {
  if (!img) return "";
  if (typeof img === "string") return img;
  return img.dataUrl || img.url || "";
}
function resolveContractStatus(meta: ContractCardMeta | null): {
  statusText: string;
  isLocked: boolean;
  isRejected: boolean;
  isSuperseded: boolean;
  isReadyToSign: boolean;
  influencerConfirmed: boolean;
  brandConfirmed: boolean;
  influencerSigned: boolean;
  brandSigned: boolean;
  needsAccept: boolean;
  canEdit: boolean;
  canSign: boolean;
  canReject: boolean;
} {
  const st = normSt(meta?.status);

  const isLocked =
    !!meta?.lockedAt ||
    st === "CONTRACT_SIGNED" ||
    st === "MILESTONES_CREATED";
  const isRejected = st === "REJECTED";
  const isSuperseded = st === "SUPERSEDED";
  const isReadyToSign = st === "READY_TO_SIGN" || !!meta?.editsLockedAt;

  const influencerConfirmed = hasAcceptedCurrent(meta, "influencer");
  const brandConfirmed = hasAcceptedCurrent(meta, "brand");
  const influencerSigned = !!meta?.signatures?.influencer?.signed;
  const brandSigned = !!meta?.signatures?.brand?.signed;
  const anyoneSigned = influencerSigned || brandSigned;

  const canEdit =
    !isLocked && !isReadyToSign && !isRejected && !isSuperseded && !anyoneSigned;
  const needsAccept = !influencerConfirmed && canEdit;
  const canSign =
    !isLocked &&
    isReadyToSign &&
    influencerConfirmed &&
    brandConfirmed &&
    !influencerSigned;
  const canReject = !isLocked && !isRejected && !isSuperseded;

  // Human-readable status label
  const sigLabel = (() => {
    if (st === "MILESTONES_CREATED") return "Milestone Added";
    if (st === "CONTRACT_SIGNED") return "Awaiting Milestone Creation";
    if (!isReadyToSign) return null;
    if (influencerSigned && brandSigned) return "Signed";
    const aw = String(meta?.awaitingRole || "").toLowerCase();
    if (aw === "brand") return "Awaiting brand signature";
    if (aw === "influencer") return "Awaiting influencer signature";
    if (!influencerSigned && !brandSigned) return "Ready to sign";
    if (brandSigned && !influencerSigned) return "Awaiting your signature";
    if (!brandSigned && influencerSigned) return "Awaiting brand signature";
    return null;
  })();

  const statusText =
    sigLabel ??
    (st === "BRAND_SENT_DRAFT"
      ? "Awaiting Your Acceptance"
      : st === "BRAND_EDITED"
        ? "Updated by Brand"
        : st === "INFLUENCER_ACCEPTED"
          ? "Awaiting Brand Acceptance"
          : st === "INFLUENCER_EDITED"
            ? "Sent to Brand"
            : st === "READY_TO_SIGN"
              ? "Ready to Sign"
              : st === "REJECTED"
                ? "Rejected"
                : st === "SUPERSEDED"
                  ? "Superseded"
                  : meta?.status
                    ? String(meta.status)
                    : "Contract");

  return {
    statusText,
    isLocked,
    isRejected,
    isSuperseded,
    isReadyToSign,
    influencerConfirmed,
    brandConfirmed,
    influencerSigned,
    brandSigned,
    needsAccept,
    canEdit,
    canSign,
    canReject,
  };
}

/* ─────────────────────── Shared card sub-components ─────────────────────── */

function SkeletonLine({ className = "" }: { className?: string }) {
  return <div className={`h-3 rounded-full bg-neutral-100 ${className}`} />;
}

function stripLeadingEmoji(label: string) {
  return String(label || "").replace(/^[^\p{L}\p{N}]+/u, "").trim();
}

function idsToLabels(
  ids: string[] | undefined,
  map: IdLabelMap | undefined,
  clean = (s: string) => s
) {
  const m = map ?? {};
  return (ids ?? []).map((id) => clean(m[id] ?? "")).filter(Boolean);
}

function firstAndExtra(labels: string[]) {
  const first = labels[0] ?? "";
  const extra = Math.max(0, labels.length - 1);
  return { first, extra };
}

function pillText(first: string, extra: number) {
  return extra > 0 ? `${first} +${extra}` : first;
}

function InlinePlus({
  first,
  extra,
  sep = " · ",
  className = "",
}: {
  first: string;
  extra: number;
  sep?: string;
  className?: string;
}) {
  if (!first) return null;

  return (
    <span className={["text-[12px] text-primary", className].join(" ")}>
      <span className="truncate">{first}</span>
      {extra > 0 ? (
        <span className="text-primary">
          {sep}+{extra}
        </span>
      ) : null}
    </span>
  );
}

function formatBudget(n: number) {
  if (!Number.isFinite(n) || n <= 0) return "—";
  return n.toLocaleString();
}

function OutlinedPill({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={[
        "inline-flex items-center gap-1.5 rounded-full",
        "border border-[#1A1A1A] bg-white",
        "px-3 py-1 text-[12px] text-neutral-900",
        "min-w-0",
        "min-w-0",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

function CampaignGlobalBadge({ value }: { value: string }) {
  if (!value) return null;
  return (
    <div
      className={[
        "inline-flex items-center px-3 py-1",
        "text-[12px] text-neutral-900",
        "rounded-[1.25rem]",
        "border border-[#FFBF00]",
        "bg-[#FFF9E6]",
      ].join(" ")}
    >
      {value}
    </div>
  );
}

/* ─────────────────────── Invite action types ─────────────────────── */

export type InviteCardProps = {
  status?: "pending" | "accepted" | "declined";
  respondBy?: string;
  onAccept: () => void;
  onDecline: () => void;
  onViewDetails: () => void;
};

/* ─────────────────────── Invite actions (inline, replaces Save/View) ─────────────────────── */

function InviteActions({ invite }: { invite: InviteCardProps }) {
  const isPending = !invite.status || invite.status === "pending";
  const isAccepted = invite.status === "accepted";
  const isDeclined = invite.status === "declined";

  if (isAccepted) {
    return (
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-[11px] font-semibold text-emerald-700">
          ✓ Accepted
        </span>
        <button
          onClick={invite.onViewDetails}
          className="flex items-center gap-1 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-[12px] font-medium text-neutral-700 transition hover:bg-neutral-50 active:scale-[0.98]"
        >
          <Eye className="h-3 w-3" />
          Details
        </button>
      </div>
    );
  }

  if (isDeclined) {
    return (
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="rounded-full bg-red-50 border border-red-200 px-3 py-1.5 text-[11px] font-semibold text-red-600">
          Declined
        </span>
        <button
          onClick={invite.onViewDetails}
          className="flex items-center gap-1 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-[12px] font-medium text-neutral-700 transition hover:bg-neutral-50 active:scale-[0.98]"
        >
          <Eye className="h-3 w-3" />
          Details
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 shrink-0">
      <button
        onClick={invite.onAccept}
        className="rounded-lg bg-[#1A1A1A] text-white px-3 py-2 text-[12px] font-semibold text-gray-900 shadow-sm transition hover:brightness-95 active:scale-[0.98] whitespace-nowrap"
      >
        Accept Invite
      </button>
      <button
        onClick={invite.onDecline}
        className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-[12px] font-medium text-neutral-700 transition hover:bg-neutral-50 active:scale-[0.98]"
      >
        Decline
      </button>
      <button
        onClick={invite.onViewDetails}
        className="flex items-center gap-1 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-[12px] font-medium text-neutral-700 transition hover:bg-neutral-50 active:scale-[0.98] whitespace-nowrap"
      >
        <Eye className="h-3 w-3" />
        Details
      </button>
    </div>
  );
}

/* ─────────────────────── Contract actions (inline, replaces Save/View) ─────────────────────── */

function ContractActions({ contract }: { contract: ContractCardProps }) {
  const meta = contract.meta;
  const contractStatus = String(meta?.status || "").trim().toUpperCase();
  const awaitingRole = String(meta?.awaitingRole || "").trim().toLowerCase();

  const version = Number(meta?.version || 0);

  const influencerAccepted =
    !!meta?.acceptances?.influencer?.accepted &&
    Number(meta?.acceptances?.influencer?.acceptedVersion || 0) === version;

  const brandAccepted =
    !!meta?.acceptances?.brand?.accepted &&
    Number(meta?.acceptances?.brand?.acceptedVersion || 0) === version;

  const influencerSigned = !!meta?.signatures?.influencer?.signed;

  const isLocked =
    !!meta?.lockedAt ||
    contractStatus === "CONTRACT_SIGNED" ||
    contractStatus === "MILESTONES_CREATED";

  const isRejected = contractStatus === "REJECTED";
  const isSuperseded = contractStatus === "SUPERSEDED";

  const isReadyToSign =
    contractStatus === "READY_TO_SIGN" || !!meta?.editsLockedAt;

  const canReject = !isLocked && !isRejected && !isSuperseded;

  const needsInfluencerReview =
    !isLocked &&
    !isRejected &&
    !isSuperseded &&
    !influencerAccepted &&
    (
      contractStatus === "BRAND_SENT_DRAFT" ||
      contractStatus === "BRAND_EDITED" ||
      awaitingRole === "influencer"
    );

  const canSign =
    !isLocked &&
    !isRejected &&
    !isSuperseded &&
    isReadyToSign &&
    influencerAccepted &&
    brandAccepted &&
    !influencerSigned;

  if (needsInfluencerReview) {
    return (
      <div className="flex items-center gap-1.5 shrink-0">
        <Button
          onClick={contract.onReviewAccept}
          className="rounded-lg bg-black px-3 py-2 text-[12px] font-semibold text-white shadow-sm transition hover:brightness-95 active:scale-[0.98] whitespace-nowrap"
        >
          Review & Accept
        </Button>

        {canReject && (
          <Button
            onClick={contract.onReject}
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12px] font-medium text-red-600 transition hover:bg-red-100 active:scale-[0.98]"
          >
            Reject
          </Button>
        )}
      </div>
    );
  }

  if (canSign) {
    return (
      <div className="flex items-center gap-1.5 shrink-0">
        <Button
          onClick={contract.onSign}
          className="rounded-lg bg-black px-3 py-2 text-[12px] font-semibold text-white shadow-sm transition hover:brightness-95 active:scale-[0.98] whitespace-nowrap"
        >
          <PenLine className="h-3 w-3" />
          Sign
        </Button>

        <Button
          variant="ghost"
          onClick={contract.onView}
          className="flex items-center gap-1 rounded-lg border hover:bg-gray-100 border-neutral-200 bg-white text-black px-3 py-2 text-[12px] font-medium"
        >
          <Eye className="h-3 w-3" />
          View
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 shrink-0">
      <Button
        variant="ghost"
        onClick={contract.onView}
        className="flex items-center gap-1 rounded-lg border hover:bg-gray-100 border-neutral-200 bg-white text-black px-3 py-2 text-[12px] font-medium"
      >
        <Eye className="h-3 w-3" />
        View Contract
      </Button>
    </div>
  );
}
/* ─────────────────────── ManualPreviewCard ─────────────────────── */

export function ManualPreviewCard({
  form,
  meta,
  contract,
  invite,
  className = "",
  onViewClick,
}: {
  form: ManualForm;
  meta?: PreviewMeta;
  contract?: ContractCardProps;
  invite?: InviteCardProps;
  className?: string;
  onViewClick?: () => void;
}) {
  console.log("Contract in manualpreview card", contract)
  const title = form.title?.trim() ?? "";
  const desc = form.description?.trim() ?? "";
  const productImages = useMemo(
    () => (Array.isArray(form.productImages) ? form.productImages : []),
    [form.productImages]
  );

  const heroImage = useMemo(
    () => getProductImageSrc(productImages[0]),
    [productImages]
  );

  const imageCount = productImages.length;
  const hasTitle = Boolean(title);
  const hasDesc = Boolean(desc);

  const categoryLabel = (form.categoryName ?? "").trim();

  const countryLabels = useMemo(
    () => idsToLabels(form.targetCountry, meta?.countryMap, stripLeadingEmoji),
    [form.targetCountry, meta?.countryMap]
  );
  const country = useMemo(() => firstAndExtra(countryLabels), [countryLabels]);

  const ageLabels = useMemo(
    () => idsToLabels(form.targetAgeGroups, meta?.ageMap),
    [form.targetAgeGroups, meta?.ageMap]
  );
  const age = useMemo(() => firstAndExtra(ageLabels), [ageLabels]);

  const budget = Number(meta?.campaignBudget ?? form?.campaignBudget ?? 0);
  const goalLabels = useMemo(
    () => idsToLabels(form.goals, meta?.goalsMap),
    [form.goals, meta?.goalsMap]
  );
  const goal = useMemo(() => firstAndExtra(goalLabels), [goalLabels]);
  const topBadge = goal.first ? pillText(goal.first, goal.extra) : "";

  return (
    <div
      className={[
        "w-full max-w-[26.25rem] overflow-hidden rounded-[1.625rem] bg-white p-5 border border-[#D6D6D6]",
        "[@media_(max-width:80rem)_and_(max-height:48.75rem)]:max-w-[23.75rem]",
        "[@media_(max-width:80rem)_and_(max-height:48.75rem)]:p-4",
        className,
      ].join(" ")}
    >
      {/* Campaign goal badge */}
      <div className="-mx-5 -mt-5">
        <div className="relative h-[13.75rem] w-full bg-[#F7F7F7]">
          <div className="h-full w-full overflow-hidden rounded-t-[1.625rem]">
            {heroImage ? (
              <img
                src={heroImage}
                alt={title || "Campaign product"}
                className="h-full w-full object-contain object-center"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Images className="h-[4.625rem] w-[4.625rem] text-[#EDEDED] [@media_(max-width:80rem)_and_(max-height:48.75rem)]:scale-[0.92]" />
              </div>
            )}
          </div>

          {topBadge ? (
            <div className="absolute right-3 top-3">
              <CampaignGlobalBadge value={topBadge} />
            </div>
          ) : null}

          {imageCount > 1 ? (
            <div className="absolute right-3 top-12 rounded-full bg-black/70 px-2.5 py-1 text-[11px] font-medium text-white">
              +{imageCount - 1} more
            </div>
          ) : null}

          <div className="absolute left-5 bottom-[-1.375rem] z-10">
            <div className="grid h-11 w-11 place-items-center rounded-s border-2 border-neutral-200 bg-white">
              <span className="text-[0.75rem] font-semibold tracking-wide text-neutral-900">
                AD
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* top row: Category + Age + dots */}
      <div className="mt-8 flex items-center justify-between gap-3 [@media_(max-width:1280px)_and_(max-height:800px)]:mt-7">
        <div className="flex items-center gap-3 min-w-0">
          {categoryLabel ? (
            <OutlinedPill className="max-w-[150px]">
              <span className="truncate">{categoryLabel}</span>
            </OutlinedPill>
          ) : (
            <SkeletonLine className="h-4 w-20" />
          )}
          {age.first ? (
            <OutlinedPill className="max-w-[170px]">
              <UsersThree size={14} className="text-[#1A1A1A]" />
              <span className="truncate">{pillText(age.first, age.extra)}</span>
            </OutlinedPill>
          ) : (
            <SkeletonLine className="h-4 w-14" />
          )}
        </div>
        <button
          type="button"
          aria-label="More"
          className="shrink-0 text-neutral-700 hover:text-neutral-900"
        >
          <DotsThree size={24} weight="bold" />
        </button>
      </div>

      {/* Campaign Title */}
      <div className="mt-3">
        {hasTitle ? (
          <div className="overflow-hidden text-ellipsis whitespace-nowrap text-[#1A1A1A] font-['Inter'] text-[1rem] font-semibold leading-[1.5rem] tracking-[0]">
            {title}
          </div>
        ) : (
          <SkeletonLine className="w-[58%] h-4" />
        )}
      </div>
      <div className="mt-3 space-y-3">
        {hasDesc ? (
          <div className="text-[0.75rem] leading-5 text-neutral-700 line-clamp-2">
            {desc}
          </div>
        ) : (
          <>
            <SkeletonLine className="w-[92%]" />
            <SkeletonLine className="w-[78%]" />
          </>
        )}
      </div>

      {/* countries line */}
      <div className="mt-3">
        {country.first ? (
          <div className="flex items-center gap-2 min-w-0">
            <MapPin size={14} className="shrink-0 text-primary" />
            <InlinePlus
              first={country.first}
              extra={country.extra}
              className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap"
            />
          </div>
        ) : (
          <div className="mt-4 [@media_(max-width:80rem)_and_(max-height:50rem)]:mt-3">
            <div className="h-10 w-40 rounded-full bg-neutral-100" />
          </div>
        )}
      </div>


      <div className="mt-6 h-px w-full bg-neutral-100 [@media_(max-width:80rem)_and_(max-height:50rem)]:mt-5" />

      <div className="mt-4 flex w-full items-center justify-between gap-3 [@media_(max-width:1280px)_and_(max-height:800px)]:mt-3">
        <div className="min-w-0 flex-1">
          {budget > 0 ? (
            <span className="block min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-[#1A1A1A] font-['Inter'] text-[1.25rem] font-semibold leading-[1.75rem] tracking-[0]">
              ${formatBudget(budget)}
            </span>
          ) : (
            <div className="h-4 w-24 rounded-full bg-neutral-100" />
          )}
        </div>

        <div className="ml-auto flex shrink-0 items-center justify-end gap-3">
          {invite ? (
            <InviteActions invite={invite} />
          ) : contract ? (
            <ContractActions contract={contract} />
          ) : (
            <>
              <Button
                variant="ghost"
                disabled
                className="cursor-not-allowed shadow-none opacity-50 hover:bg-white"
              >
                Save
              </Button>

              <Button
                variant="default"
                onClick={onViewClick}
                disabled
                className="cursor-not-allowed opacity-50"
              >
                Apply
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function ManualPreviewCardStack({
  form,
  meta,
}: {
  form: ManualForm;
  meta?: PreviewMeta;
}) {
  return (
    <div className="h-full min-h-0 w-full  overflow-y-auto overflow-x-hidden overscroll-contain">
      <div className="min-h-full flex items-center justify-center px-6 py-10 [@media_(max-height:50rem)]:items-start [@media_(max-height:50rem)]:py-6">
        <div
          className="
            relative w-full max-w-[420px]
            [@media_(max-width:80rem)_and_(max-height:50rem)]:max-w-[380px]
            [@media_(max-width:80rem)_and_(max-height:50rem)]:scale-[0.94]
            [@media_(max-width:80rem)_and_(max-height:50rem)]:origin-top
          "
        >
          <div
            aria-hidden="true"
            className="
              pointer-events-none absolute z-0
              left-[54px] right-[54px] top-[28px] bottom-[28px]
              translate-y-[66px]
              rounded-[11.664px]
              opacity-50
              bg-[#EDEDED]
              [@media_(max-width:80rem)_and_(max-height:50rem)]:left-[44px]
              [@media_(max-width:80rem)_and_(max-height:50rem)]:right-[44px]
              [@media_(max-width:80rem)_and_(max-height:50rem)]:translate-y-[56px]
            "
          />
          <div
            aria-hidden="true"
            className="
              pointer-events-none absolute z-[1]
              left-[36px] right-[36px] top-[36px] bottom-[18px]
              translate-y-[44px]
              rounded-[13.997px]
              opacity-[0.98]
              bg-[#EDEDED]
              [@media_(max-width:80rem)_and_(max-height:50rem)]:left-[30px]
              [@media_(max-width:80rem)_and_(max-height:50rem)]:right-[30px]
              [@media_(max-width:80rem)_and_(max-height:50rem)]:translate-y-[38px]
            "
          />
          <div
            aria-hidden="true"
            className="
              pointer-events-none absolute z-[2]
              left-[18px] right-[18px] top-[18px] bottom-[9px]
              translate-y-[22px]
              rounded-[15.388px]
              bg-[#E6E6E6]
              [@media_(max-width:80rem)_and_(max-height:50rem)]:left-[14px]
              [@media_(max-width:80rem)_and_(max-height:50rem)]:right-[14px]
              [@media_(max-width:80rem)_and_(max-height:50rem)]:translate-y-[18px]
            "
          />
          <ManualPreviewCard form={form} meta={meta} className="relative z-10" />
        </div>
      </div>
    </div>
  );
}

export function toMap(
  options: Option[],
  clean = (s: string) => s
): IdLabelMap {
  const out: IdLabelMap = {};
  for (const o of options ?? []) {
    const v = String(o?.value ?? "").trim();
    const l = clean(String(o?.label ?? "").trim());
    if (!v || !l) continue;
    out[v] = l;
  }
  return out;
}