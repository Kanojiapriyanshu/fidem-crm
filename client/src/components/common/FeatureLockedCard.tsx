import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  PLAN_DISPLAY_NAME,
  cardClassName,
  type SubscriptionPlan,
} from "./viewModashShared";

export function FeatureLockedCard({
  title,
  plan,
}: {
  title: string;
  plan: SubscriptionPlan;
}) {
  return (
    <div
      className={cn(
        cardClassName,
        `flex min-h-[220px] items-center justify-center border-dashed ${title === "Performance Trend" ? "p-44" : "p-6"} text-center`
      )}
    >
      <div className="max-w-sm space-y-3">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#fff4df] text-[#d99707]">
          <ShieldCheck className="h-5 w-5" />
        </div>

        <div>
          <h3 className="text-base font-semibold text-[#1f1f1f]">{title} is locked</h3>
          <p className="mt-1 text-sm leading-6 text-[#7b7468]">
            Visible on{" "}
            <span className="font-semibold text-[#1f1f1f]">{PLAN_DISPLAY_NAME[plan]}</span> and
            higher plans.
          </p>
        </div>
      </div>
    </div>
  );
}