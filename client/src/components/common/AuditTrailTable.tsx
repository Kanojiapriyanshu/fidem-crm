import { SectionCard } from "./SectionCard";
import type { AuditItem } from "./viewModashShared";

export function AuditTrailTable({ items }: { items: AuditItem[] }) {
  return (
    <SectionCard title="Related System Logs & Audit Trail">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left">
          <thead>
            <tr className="border-b border-[#efe8dd] text-[11px] font-semibold uppercase tracking-[0.16em] text-[#ab9f8e]">
              <th className="px-3 py-3">Date &amp; time</th>
              <th className="px-3 py-3">Action</th>
              <th className="px-3 py-3">User / system</th>
              <th className="px-3 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr
                key={item.id}
                className="border-b border-[#f4eee4] text-sm text-[#5f5a52] last:border-b-0"
              >
                <td className="px-3 py-4">{item.date}</td>
                <td className="px-3 py-4 font-medium text-[#1f1f1f]">{item.action}</td>
                <td className="px-3 py-4">{item.actor}</td>
                <td className="px-3 py-4 font-medium text-[#1f1f1f]">{item.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}