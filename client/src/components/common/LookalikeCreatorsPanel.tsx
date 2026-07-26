import { ArrowUpRight } from "lucide-react";
import { SectionCard } from "./SectionCard";
import { buildInitials, type LookalikeCreator } from "./viewModashShared";

export type SupportedPlatform = "instagram" | "tiktok" | "youtube";

export type LookalikePanelItem = LookalikeCreator & {
  userId?: string;
  modashId?: string;
  platform?: SupportedPlatform | string;
  provider?: SupportedPlatform | string;

  username?: string;
  fullname?: string;
  picture?: string;
  followersRaw?: number;
  engagementsRaw?: number;
  engagementRateRaw?: number;
  raw?: any;
};

type LookalikeCreatorsPanelProps = {
  items?: LookalikePanelItem[];
  platform?: SupportedPlatform | string | null;
  onSelectLookalike?: (item: LookalikePanelItem) => void;
};

function normalizePlatform(value?: string | null): SupportedPlatform {
  const normalized = String(value ?? "").toLowerCase();

  if (normalized.includes("youtube")) return "youtube";
  if (normalized.includes("tiktok")) return "tiktok";
  return "instagram";
}

function inferPlatformFromUrl(url?: string): SupportedPlatform | null {
  const normalized = String(url ?? "").toLowerCase();

  if (normalized.includes("youtube.com") || normalized.includes("youtu.be")) {
    return "youtube";
  }

  if (normalized.includes("tiktok.com")) {
    return "tiktok";
  }

  if (normalized.includes("instagram.com")) {
    return "instagram";
  }

  return null;
}

function getLookalikeUserId(item: LookalikePanelItem): string {
  return String(item.userId ?? item.modashId ?? item.id ?? "").trim();
}

function buildMediaKitUrl(
  item: LookalikePanelItem,
  fallbackPlatform?: string | null
): string | null {
  const userId = getLookalikeUserId(item);

  if (!userId) {
    return item.url || null;
  }

  const resolvedPlatform = normalizePlatform(
    String(item.platform ?? item.provider ?? "") ||
    inferPlatformFromUrl(item.url) ||
    fallbackPlatform ||
    "instagram"
  );

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  return `${origin}/mediakit/${encodeURIComponent(userId)}?platform=${encodeURIComponent(
    resolvedPlatform
  )}`;
}

export function LookalikeCreatorsPanel({
  items = [],
  platform,
  onSelectLookalike,
}: LookalikeCreatorsPanelProps) {
  const safeItems = Array.isArray(items) ? items : [];
  const hasItems = safeItems.length > 0;

  const openProfile = (item: LookalikePanelItem) => {
    if (onSelectLookalike) {
      onSelectLookalike(item);
      return;
    }

    const mediaKitUrl = buildMediaKitUrl(item, platform);
    if (!mediaKitUrl) return;

    window.open(mediaKitUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <SectionCard
      title="Lookalike Creators"
      action={
        hasItems ? (
          <button className="inline-flex items-center gap-1 text-xs font-semibold text-[#7d7569]">
            Discover more <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        ) : null
      }
    >
      {!hasItems ? (
        <div className="rounded-2xl border border-dashed border-[#efe8dd] bg-[#fffdfa] px-6 py-10 text-center">
          <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-[#f4eee5] text-[#8a8175]">
            <ArrowUpRight className="h-5 w-5" />
          </div>

          <div className="text-sm font-semibold text-[#1f1f1f]">
            No lookalike creator found
          </div>

          <div className="mt-1 text-xs text-[#8a8175]">
            Similar creators will appear here once lookalike data is available.
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {safeItems.map((item) => {
            const mediaKitUrl = buildMediaKitUrl(item, platform);
            const canOpen = Boolean(onSelectLookalike || mediaKitUrl);

            return (
              <div
                key={item.id}
                onClick={() => openProfile(item)}
                onKeyDown={(e) => {
                  if (!canOpen) return;

                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openProfile(item);
                  }
                }}
                tabIndex={canOpen ? 0 : -1}
                role={canOpen ? "button" : undefined}
                title={
                  canOpen
                    ? onSelectLookalike
                      ? "Open in this modal"
                      : "Open media kit"
                    : undefined
                }
                className={`rounded-2xl border border-[#efe8dd] bg-[#fffdfa] p-4 text-center transition ${canOpen ? "cursor-pointer hover:bg-[#fdf8f1] hover:shadow-sm" : ""
                  }`}
              >
                <div className="mx-auto h-14 w-14 overflow-hidden rounded-full bg-[#ece4d8]">
                  {item.avatar ? (
                    <img
                      src={item.avatar}
                      alt={item.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-xs font-bold text-[#5d5349]">
                      {buildInitials(item.name)}
                    </div>
                  )}
                </div>

                <div className="mt-3 text-sm font-semibold text-[#1f1f1f]">
                  {item.name}
                </div>
                <div className="text-xs text-[#8a8175]">{item.handle}</div>

                <div className="mt-4 flex items-center justify-between border-t border-[#efe8dd] pt-3 text-sm">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.16em] text-[#ab9f8e]">
                      Reach
                    </div>
                    <div className="font-semibold text-[#1f1f1f]">
                      {item.followers}
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] uppercase tracking-[0.16em] text-[#ab9f8e]">
                      ER
                    </div>
                    <div className="font-semibold text-[#1f1f1f]">
                      {item.engagement}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
}