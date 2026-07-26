import { cn } from "@/lib/utils";
import { SectionCard } from "./SectionCard";
import type { CampaignHighlight } from "./viewModashShared";

export function CampaignHighlightsCard({ items }: { items: CampaignHighlight[] }) {
  return (
    <SectionCard title="Total sponsored content or post" eyebrow="Collaboration snapshot">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => (
          <div
            key={item.label}
            className={cn(
              "rounded-2xl border p-4",
              item.tone === "accent"
                ? "border-[#f2dfb8] bg-[#fff7e9]"
                : "border-[#efe8dd] bg-[#fffdfa]"
            )}
          >
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#ab9f8e]">
              {item.label}
            </div>
            <div className="mt-3 text-[30px] font-bold leading-none tracking-tight text-[#1f1f1f]">
              {item.value}
            </div>
            <div className="mt-2 text-xs text-[#7d7569]">{item.meta}</div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}