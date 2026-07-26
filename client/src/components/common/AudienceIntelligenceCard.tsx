import { SectionCard } from "./SectionCard";
import { PieChart } from "@mui/x-charts/PieChart";
import { BarChart } from "@mui/x-charts/BarChart";
import { ProgressBar } from "./ProgressBar";
import { AudienceCredibilityGauge } from "./AudienceCredibilityGauge";

export function AudienceIntelligenceCard({
  ageData,
  genderData,
  topCountries,
  credibilityScore,
  topLanguages,
}: {
  ageData: Array<{ label: string; value: number }>;
  genderData: Array<{ label: string; value: number }>;
  topCountries: Array<{ name: string; value: number }>;
  credibilityScore?: number | null;
  topLanguages: Array<{ label: string; value: number }>;
}) {
  const hasCredibilityScore =
    credibilityScore !== null &&
    credibilityScore !== undefined &&
    Number.isFinite(Number(credibilityScore));

  if (!hasCredibilityScore) {
    return null;
  }

  const pieSeries = genderData.length
    ? genderData.map((item, index) => ({
      id: item.label,
      value: item.value,
      label: item.label,
      color: ["#d65db1", "#f0a52d", "#f5d58f"][index % 3],
    }))
    : [{ id: "empty", value: 1, label: "No data", color: "#ede7dc" }];

  return (
    <SectionCard title="Audience Intelligence" eyebrow="Demographics, geography, credibility">
      <div className="grid gap-6 xl:grid-cols-[0.95fr_1fr_0.8fr]">
        <div className="rounded-[20px] border border-[#efe8dd] bg-[#fffdfa] p-4">
          <div className="mb-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#ab9f8e]">
            Gender &amp; age
          </div>

          <div className="space-y-5">
            <div className="flex flex-col items-center rounded-[20px] p-4">
              <PieChart
                width={220}
                height={180}
                margin={{ top: 0, bottom: 0, left: 0, right: 0 }}
                series={[
                  {
                    innerRadius: 48,
                    outerRadius: 78,
                    data: pieSeries,
                    paddingAngle: 2,
                    cornerRadius: 4,
                    valueFormatter: (item) => `${Math.round(Number(item.value ?? 0))}%`,
                  },
                ]}
              />

              <div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-xs text-[#6d675e]">
                {genderData.length ? (
                  genderData.map((item, index) => (
                    <div key={item.label} className="inline-flex items-center gap-1.5">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{
                          backgroundColor: ["#d65db1", "#f0a52d", "#f5d58f"][index % 3],
                        }}
                      />
                      {item.label}{" "}
                      <span className="font-semibold text-[#1f1f1f]">
                        {item.value.toFixed(0)}%
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-[#8b857b]">No gender data available.</div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              {ageData.length ? (
                ageData.map((item) => (
                  <ProgressBar key={item.label} label={item.label} value={item.value} />
                ))
              ) : (
                <div className="text-sm text-[#8b857b]">No audience age data available.</div>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-[20px] border border-[#efe8dd] bg-[#fffdfa] p-4">
          <div className="mb-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#ab9f8e]">
            Geography
          </div>

          <div className="space-y-4">
            <div>
              {topCountries.length ? (
                <BarChart
                  layout="horizontal"
                  height={Math.max(220, topCountries.length * 44)}
                  yAxis={[
                    {
                      scaleType: "band",
                      data: topCountries.map((item) => item.name),
                      tickLabelStyle: { fontSize: 12, fill: "#3b342b" },
                    },
                  ]}
                  xAxis={[
                    {
                      min: 0,
                      max: 100,
                      disableLine: true,
                      disableTicks: true,
                      tickLabelStyle: { display: "none" },
                    },
                  ]}
                  series={[
                    {
                      data: topCountries.map((item) => Math.round(item.value)),
                      color: "#e0a421",
                      valueFormatter: (value) => `${Math.round(Number(value ?? 0))}%`,
                    },
                  ]}
                  margin={{ top: 0, bottom: 0, left: 96, right: 12 }}
                  sx={{
                    "& .MuiChartsAxis-left .MuiChartsAxis-line": { display: "none" },
                    "& .MuiChartsAxis-left .MuiChartsAxis-tick": { display: "none" },
                    "& .MuiChartsAxis-bottom": { display: "none" },
                  }}
                />
              ) : (
                <div className="text-sm text-[#8b857b]">No country data available.</div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 border-t border-[#efe8dd] pt-4 text-sm">
              <div>
                <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#ab9f8e]">
                  Top languages
                </div>
                <div className="space-y-2 text-[#5f5a52]">
                  {topLanguages.length ? (
                    topLanguages.slice(0, 3).map((item) => (
                      <div
                        key={item.label}
                        className="flex items-center justify-between gap-3"
                      >
                        <span>{item.label}</span>
                        <span className="font-semibold text-[#1f1f1f]">
                          {item.value.toFixed(0)}%
                        </span>
                      </div>
                    ))
                  ) : (
                    <div>—</div>
                  )}
                </div>
              </div>

              <div>
                <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#ab9f8e]">
                  Audience quality
                </div>
                <div className="space-y-2 text-[#5f5a52]">
                  {topCountries.slice(0, 3).map((item) => (
                    <div key={item.name} className="flex items-center justify-between gap-3">
                      <span>{item.name}</span>
                      <span className="font-semibold text-[#1f1f1f]">
                        {item.value.toFixed(0)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[20px] border border-[#efe8dd] bg-[#fffdfa] p-4">
          <div className="mb-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#ab9f8e]">
            Audience credibility
          </div>
          <AudienceCredibilityGauge score={credibilityScore} />
        </div>
      </div>
    </SectionCard>
  );
}