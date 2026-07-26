import { SectionCard } from "./SectionCard";
import type { CampaignRow } from "./viewModashShared";

export function PastCollaborationsTable({
  items,
}: {
  items: CampaignRow[];
}) {
  return (
    <SectionCard title="Past Collaborations" eyebrow="Partnership history">
      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-y-3 text-left">
          <thead>
            <tr className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#ab9f8e]">
              <th className="px-3">Company</th>
              <th className="px-3">Category</th>
              <th className="px-3">Brief</th>
              <th className="px-3">Rate</th>
              <th className="px-3">Status</th>
            </tr>
          </thead>

          <tbody>
            {items.length ? (
              items.map((item, index) => (
                <tr
                  key={item._id || `${item.company}-${index}`}
                  className="rounded-2xl bg-[#fffdfa] text-sm text-[#5d564d]"
                >
                  <td className="rounded-l-2xl px-3 py-3 font-medium text-[#1f1f1f]">
                    {item.company || "—"}
                  </td>

                  <td className="px-3 py-3">
                    {item.category || "—"}
                  </td>

                  <td className="px-3 py-3">
                    <div className="max-w-[320px] truncate">{item.brief || "—"}</div>
                  </td>

                  <td className="px-3 py-3 font-medium text-[#1f1f1f]">
                    {item.rate || "—"}
                  </td>

                  <td className="rounded-r-2xl px-3 py-3">
                    <span className="inline-flex rounded-full bg-[#f2f0ed] px-3 py-1 text-xs font-semibold text-[#4b4b55]">
                      {item.status || "—"}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={5}
                  className="rounded-2xl border border-dashed border-[#e8dfd2] px-4 py-10 text-center text-sm text-[#8b857b]"
                >
                  No past collaborations available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}