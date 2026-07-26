
export function AudienceCredibilityGauge({ score }: { score: number }) {
  const safeScore = Math.max(0, Math.min(100, score));
  return (
    <div className="flex flex-col items-center justify-center rounded-[20px] bg-[#fffdfa] p-5">
      <div
        className="grid h-36 w-36 place-items-center rounded-full"
        style={{
          background: `conic-gradient(#e2a11c ${safeScore * 3.6}deg, #f3eee6 0deg)`,
        }}
      >
        <div className="grid h-24 w-24 place-items-center rounded-full bg-white text-center">
          <div>
            <div className="text-[28px] font-bold text-[#1f1f1f]">
              {safeScore === 0 ? "-" : `${safeScore}%`}
            </div>
            <div className="text-xs text-[#8a8175]">
              {safeScore >= 70 ? "Excellent" : safeScore >= 50 ? "Good" : "Fair"}
            </div>
          </div>
        </div>
      </div>
      <p className="mt-4 max-w-[240px] text-center text-sm leading-6 text-[#7b7468]">
        Based on engagement quality, brand-fit indicators, and audience consistency.
      </p>
    </div>
  );
}