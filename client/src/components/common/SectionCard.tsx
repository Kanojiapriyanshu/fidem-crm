import { cn } from "@/lib/utils";
import { cardClassName, type SectionCardProps } from "./viewModashShared";

export function SectionCard({
  title,
  eyebrow,
  action,
  children,
  className,
}: SectionCardProps) {
  return (
    <section className={cn(cardClassName, "p-5 lg:p-6", className)}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          {eyebrow ? (
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#b18c52]">
              {eyebrow}
            </p>
          ) : null}
          <h2 className="text-[15px] font-semibold text-[#1f1f1f]">{title}</h2>
        </div>
        {/* {action} */}
      </div>
      {children}
    </section>
  );
}