import { LineChart } from "@mui/x-charts/LineChart";
import { SectionCard } from "./SectionCard";

type StatHistoryPoint = {
  month?: string;
  date?: string;
  period?: string;
  followers?: number | string | null;
  avgLikes?: number | string | null;
  avg_likes?: number | string | null;
};

type PerformanceTrendCardProps = {
  organicTrend: number[];
  sponsoredTrend: number[];
  trendLabels?: string[];
  statHistory?: StatHistoryPoint[];
  secondaryLabel?: string;
  primaryValue?: number;
  secondaryValue?: number;
};

const monthLabels = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function toNumber(value: unknown): number {
  if (value === undefined || value === null || value === "") return 0;
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;

  if (typeof value === "string") {
    const cleaned = value.trim().replace(/,/g, "").replace(/%$/, "");
    if (!cleaned) return 0;

    const compact = cleaned.match(/^(-?\d+(?:\.\d+)?)([kmb])$/i);
    if (compact) {
      const base = Number(compact[1]);
      const unit = compact[2].toLowerCase();
      const multiplier = unit === "b" ? 1_000_000_000 : unit === "m" ? 1_000_000 : 1_000;
      return Number.isFinite(base) ? base * multiplier : 0;
    }

    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatCompact(value?: number) {
  const num = Number(value ?? 0);
  if (!Number.isFinite(num)) return "0";
  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}B`;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return `${Math.round(num)}`;
}

function hasRealSeries(values: number[]) {
  return values.length >= 2 && values.some((value) => Number(value) > 0);
}

function parseMonthLabel(value: string, index: number): string {
  if (!value) return monthLabels[index % 12];

  const [year, month] = value.split("-");
  const monthIndex = Number(month) - 1;

  if (year && monthIndex >= 0 && monthIndex < 12) {
    return `${monthLabels[monthIndex]} ${String(year).slice(2)}`;
  }

  return value;
}

function normalizeHistoryPoint(point: StatHistoryPoint) {
  return {
    month: String(point?.month ?? point?.date ?? point?.period ?? ""),
    avgLikes: toNumber(point?.avgLikes ?? point?.avg_likes),
    followers: toNumber(point?.followers),
  };
}

export function PerformanceTrendCard({
  organicTrend,
  sponsoredTrend,
  trendLabels,
  statHistory,
  secondaryLabel = "Followers",
  primaryValue = 0,
  secondaryValue = 0,
}: PerformanceTrendCardProps) {
  const normalizedHistory = Array.isArray(statHistory)
    ? statHistory
        .map(normalizeHistoryPoint)
        .filter((item) => item.month || item.avgLikes > 0 || item.followers > 0)
        .sort((a, b) => a.month.localeCompare(b.month))
    : [];

  const useStatHistory =
    normalizedHistory.length >= 2 &&
    normalizedHistory.some((item) => item.avgLikes > 0 || item.followers > 0);

  const useRealOrganic = hasRealSeries(organicTrend);
  const useRealSecondary = hasRealSeries(sponsoredTrend);

  const historyLabels = normalizedHistory.map((item, index) =>
    parseMonthLabel(item.month, index)
  );

  const fallbackLabels =
    trendLabels && trendLabels.length >= 6
      ? trendLabels.slice(-6)
      : ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];

  const labels = useStatHistory
    ? historyLabels
    : trendLabels && trendLabels.length >= 2
      ? trendLabels
      : fallbackLabels;

  const fallbackLikesSeries = useRealOrganic
    ? labels.map((_, index) =>
        Number(organicTrend?.[index] ?? organicTrend[organicTrend.length - 1] ?? 0)
      )
    : labels.map(() => Number(primaryValue ?? 0));

  const fallbackSecondarySeries = useRealSecondary
    ? labels.map((_, index) =>
        Number(sponsoredTrend?.[index] ?? sponsoredTrend[sponsoredTrend.length - 1] ?? 0)
      )
    : labels.map(() => Number(secondaryValue ?? 0));

  const likesSeries = useStatHistory
    ? normalizedHistory.map((item) => item.avgLikes)
    : fallbackLikesSeries;

  const secondarySeries = useStatHistory
    ? normalizedHistory.map((item) => item.followers)
    : fallbackSecondarySeries;

  return (
    <SectionCard
      title="Performance Trend"
      eyebrow="Likes and audience growth over time"
    >
      <div className="rounded-[20px] border border-[#efe8dd] bg-[#fffdfa] p-5 md:p-6">
        <div className="mb-4 flex flex-wrap items-center gap-4 text-xs text-[#6f6a61]">
          <div className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#c07ac4]" />
            Avg Likes
          </div>
          <div className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#e1a31a]" />
            {useStatHistory ? "Followers" : secondaryLabel}
          </div>
        </div>

        <LineChart
          height={320}
          xAxis={[
            {
              scaleType: "point",
              data: labels,
            },
          ]}
          yAxis={[
            {
              id: "likes",
              min: 0,
              valueFormatter: (value: number | string) =>
                formatCompact(Number(value)),
            },
            {
              id: "secondary",
              min: 0,
              position: "right",
              valueFormatter: (value: number | string) =>
                formatCompact(Number(value)),
            },
          ]}
          series={[
            {
              id: "organic",
              yAxisId: "likes",
              data: likesSeries,
              color: "#c07ac4",
              curve: "monotoneX",
              label: "Avg Likes",
              showMark: true,
            },
            {
              id: "secondary-series",
              yAxisId: "secondary",
              data: secondarySeries,
              color: "#e1a31a",
              curve: "monotoneX",
              label: useStatHistory ? "Followers" : secondaryLabel,
              showMark: true,
            },
          ]}
          grid={{ horizontal: true }}
          margin={{ top: 16, right: 56, bottom: 28, left: 56 }}
          sx={{
            "& .MuiChartsAxis-line": { stroke: "#ece4d8" },
            "& .MuiChartsAxis-tick": { stroke: "#d8d0c4" },
            "& .MuiChartsAxis-tickLabel": {
              fill: "#7c7468",
              fontSize: 11,
            },
            "& .MuiChartsGrid-line": { stroke: "#f2ebdf" },
            "& .MuiLineElement-root": { strokeWidth: 3 },
            "& .MuiMarkElement-root": { strokeWidth: 2 },
            "& .MuiChartsLegend-root": { display: "none" },
          }}
        />
      </div>
    </SectionCard>
  );
}
