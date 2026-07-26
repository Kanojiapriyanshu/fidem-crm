import type { DashboardMetric } from "./viewModashShared";

type TinyStatProps = Omit<DashboardMetric, "key">;

export function TinyStat({ label, value, delta }: TinyStatProps) {
  return (
    <div className="rounded-xl border border-[#efe8dd] bg-[#fffdfa] p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#ab9f8e]">
          {label}
        </p>
        {delta ? (
          <span className="text-[11px] font-semibold text-[#8b7f6f]">{delta}</span>
        ) : null}
      </div>

      <div className="mt-3 text-[28px] font-bold leading-none tracking-tight text-[#1f1f1f]">
        {value}
      </div>
    </div>
  );
}