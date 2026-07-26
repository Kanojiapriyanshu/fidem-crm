export function ProgressBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="text-[#6f6a61]">{label}</span>
        <span className="font-semibold text-[#1f1f1f]">{value.toFixed(0)}%</span>
      </div>
      <div className="h-2 rounded-full bg-[#f3eee6]">
        <div
          className="h-2 rounded-full bg-[#e0a421]"
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
    </div>
  );
}