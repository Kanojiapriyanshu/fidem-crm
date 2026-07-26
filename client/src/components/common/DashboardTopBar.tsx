import type { SubscriptionPlan } from "./viewModashShared";
import { DashboardTopBarMenus } from "./viewModashShared";

export function DashboardTopBar({ plan: _plan }: { plan: SubscriptionPlan }) {
  return (
    <header className="mb-6 flex flex-col gap-4 border-b border-[#efe8dd] pb-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p className="text-xs font-medium text-[#9a9287]">InfluxAdmin / Creator Dashboard</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {DashboardTopBarMenus.map((menu) => {
          const Icon = menu.icon;
          const isBlock = menu.label.toLowerCase() === "block";

          return (
            <button
              key={menu.label}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition ${
                isBlock
                  ? "border-red-200 bg-red-50 text-red-600 hover:border-red-300 hover:bg-red-100"
                  : "border-[#e8e0d5] bg-white text-[#5e584f] hover:border-[#d7cab8] hover:bg-[#fff9f1]"
              }`}
            >
              <Icon className="h-4 w-4" />
              {menu.label}
            </button>
          );
        })}
      </div>
    </header>
  );
}