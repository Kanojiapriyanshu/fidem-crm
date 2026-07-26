import { ShieldCheck } from "@phosphor-icons/react";
import { SectionCard } from "./SectionCard";

export function RiskComplianceCard({
  credibilityScore,
  isPrivate,
}: {
  credibilityScore: number;
  isPrivate?: boolean;
}) {
  return (
    <SectionCard title="Risk & Compliance Monitoring" eyebrow="Trust layer">
      <div className="space-y-4">
        <div className="flex items-center justify-between text-sm text-[#5f5a52]">
          <span>Account privacy</span>
          <span className="font-semibold text-[#1f1f1f]">{isPrivate ? "Private" : "Public"}</span>
        </div>
        <div className="flex items-center justify-between text-sm text-[#5f5a52]">
          <span>Policy violation flags</span>
          <span className="font-semibold text-[#1f1f1f]">0 recorded</span>
        </div>
        <div className="flex items-center justify-between text-sm text-[#5f5a52]">
          <span>Audience credibility</span>
          <span className="font-semibold text-[#1f1f1f]">{credibilityScore}%</span>
        </div>

        <div className="rounded-2xl border border-[#efe8dd] bg-[#fffdfa] p-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#ab9f8e]">
            System risk score
          </div>
          <div className="mt-2 flex items-end justify-between gap-3">
            <div className="text-2xl font-bold text-[#1f1f1f]">LOW</div>
            <ShieldCheck className="h-5 w-5 text-[#d09306]" />
          </div>
        </div>
      </div>
    </SectionCard>
  );
}