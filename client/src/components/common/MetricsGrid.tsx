import { TinyStat } from "./TinyStat";
import type { DashboardMetric } from "./viewModashShared";

export function MetricsGrid({ metrics }: { metrics: DashboardMetric[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {metrics.map(({ key, ...metric }) => (
        <TinyStat key={key} {...metric} />
      ))}
    </div>
  );
}