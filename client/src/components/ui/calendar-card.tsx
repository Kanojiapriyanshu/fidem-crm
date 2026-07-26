"use client";

import * as React from "react";

type WeekStart = 0 | 1; // 0 = Sunday, 1 = Monday

type CalendarCardProps = {
  value?: Date | null;
  onChange?: (date: Date) => void;

  /** Matches the second screenshot footer */
  withTime?: boolean;
  timeValue?: string; // "00:00"
  onTimeChange?: (time24h: string) => void;
  timezoneLabel?: string;

  /** Matches the purple “active” outline + bottom bar in the first screenshot */
  highlight?: boolean;

  /** First screenshot shows year, second doesn't */
  showYear?: boolean;

  /** Screenshot uses Monday */
  weekStartsOn?: WeekStart;
  maxDate?: Date | null;

  className?: string;
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function clampDate(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function addMonths(d: Date, amount: number) {
  return new Date(d.getFullYear(), d.getMonth() + amount, 1);
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Convert JS getDay() (0=Sun..6=Sat) to an index based on weekStartsOn */
function dayIndex(d: Date, weekStartsOn: WeekStart) {
  const js = d.getDay();
  if (weekStartsOn === 0) return js;
  // Monday-start: Mon->0 ... Sun->6
  return (js + 6) % 7;
}

function formatHeader(d: Date, showYear: boolean) {
  const fmt = new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "long",
    day: "2-digit",
    ...(showYear ? { year: "numeric" } : {}),
  });
  // Example: "Thu, April 18, 2025" (or without year)
  return fmt.format(d);
}

const WEEKDAYS_MON = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const WEEKDAYS_SUN = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function buildTimeOptions(stepMinutes = 60) {
  const out: Array<{ label: string; value: string }> = [];
  for (let m = 0; m < 24 * 60; m += stepMinutes) {
    const hh = Math.floor(m / 60);
    const mm = m % 60;
    const value = `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;

    const hour12 = ((hh + 11) % 12) + 1;
    const ampm = hh < 12 ? "AM" : "PM";
    const label = mm === 0 ? `${hour12} ${ampm}` : `${hour12}:${String(mm).padStart(2, "0")} ${ampm}`;

    out.push({ label, value });
  }
  return out;
}

const DEFAULT_TIME_OPTIONS = buildTimeOptions(60);

export function CalendarCard({
  value,
  onChange,
  withTime = false,
  timeValue,
  onTimeChange,
  timezoneLabel,
  highlight = false,
  showYear = true,
  weekStartsOn = 1,
  className,
  maxDate,
}: CalendarCardProps) {
  const today = React.useMemo(() => clampDate(new Date()), []);
  const selected = value ? clampDate(value) : null;
  const max = maxDate ? clampDate(maxDate) : null;

  const [viewMonth, setViewMonth] = React.useState<Date>(() =>
    startOfMonth(selected ?? today)
  );

  React.useEffect(() => {
    if (!selected) return;
    // keep the month view in sync when externally controlled
    setViewMonth(startOfMonth(selected));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value?.getFullYear(), value?.getMonth(), value?.getDate()]);

  const headerLabel = React.useMemo(() => {
    // Header uses the selected date if present; else "today" (like many pickers)
    return formatHeader(selected ?? today, showYear);
  }, [selected, today, showYear]);

  const days = React.useMemo(() => {
    const first = startOfMonth(viewMonth);
    const offset = dayIndex(first, weekStartsOn); // how many cells from prev month
    const start = new Date(first);
    start.setDate(first.getDate() - offset);

    const cells: Array<{
      date: Date;
      inMonth: boolean;
      isToday: boolean;
      isSelected: boolean;
      isDisabled: boolean;
    }> = [];

    for (let i = 0; i < 42; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const cd = clampDate(d);

      cells.push({
        date: cd,
        inMonth: cd.getMonth() === viewMonth.getMonth(),
        isToday: isSameDay(cd, today),
        isSelected: !!selected && isSameDay(cd, selected),
        isDisabled: !!max && cd.getTime() > max.getTime(),
      });
    }

    return cells;
  }, [viewMonth, selected, today, weekStartsOn, max]);

  const weekdays = weekStartsOn === 1 ? WEEKDAYS_MON : WEEKDAYS_SUN;

  const tz =
    timezoneLabel ??
    (() => {
      try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone;
      } catch {
        return "Local Time";
      }
    })();

  const effectiveTime = timeValue ?? "00:00";

  return (
    <div
      className={cn(
        "relative w-full max-w-[22.5rem] overflow-hidden rounded-2xl border border-border bg-background",
        // subtle “active” style like your top screenshot
        highlight && "ring-2 ring-purple-500",
        highlight &&
        "after:content-[''] after:absolute after:inset-x-0 after:bottom-0 after:h-1 after:bg-purple-500",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-[1rem] pt-[1rem] pb-[0.5rem]">
        <button
          type="button"
          aria-label="Previous month"
          onClick={() => setViewMonth((m) => addMonths(m, -1))}
          className="grid size-[2rem] place-items-center rounded-full text-muted-foreground hover:bg-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="text-[1.125rem] leading-none">‹</span>
        </button>

        <div className="text-[0.875rem] font-semibold text-foreground">
          {headerLabel}
        </div>

        <button
          type="button"
          aria-label="Next month"
          onClick={() => setViewMonth((m) => addMonths(m, 1))}
          className="grid size-[2rem] place-items-center rounded-full text-muted-foreground hover:bg-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="text-[1.125rem] leading-none">›</span>
        </button>
      </div>

      {/* Weekdays */}
      <div className="grid grid-cols-7 px-[1rem] pb-[0.5rem] text-center text-[0.75rem] font-medium text-muted-foreground">
        {weekdays.map((w) => (
          <div key={w} className="py-[0.25rem]">
            {w}
          </div>
        ))}
      </div>

      {/* Days */}
      <div className="grid grid-cols-7 gap-y-[0.25rem] px-[1rem] pb-[1rem]">
        {days.map(({ date, inMonth, isSelected, isToday, isDisabled }) => {
          const label = date.getDate();
          return (
            <button
              key={date.toISOString()}
              type="button"
              disabled={isDisabled}
              onClick={() => {
                if (isDisabled) return;
                onChange?.(date);
              }}
              className={cn(
                "mx-auto grid size-[2.25rem] place-items-center rounded-full text-[0.875rem] font-medium transition",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                inMonth ? "text-foreground" : "text-muted-foreground/50",
                !isSelected && inMonth && !isDisabled && "hover:bg-secondary",
                isToday && !isSelected && "ring-1 ring-border",
                isSelected && "bg-primary text-primary-foreground",
                isDisabled && "cursor-not-allowed opacity-30 hover:bg-transparent"
              )}
              aria-pressed={isSelected}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Footer (time + timezone) */}
      {withTime && (
        <div className="flex items-center justify-between border-t border-border px-[1rem] py-[0.75rem]">
          <div className="flex items-center gap-[0.5rem]">
            {/* simple clock icon */}
            <svg
              width="1rem"
              height="1rem"
              viewBox="0 0 24 24"
              fill="none"
              className="text-muted-foreground"
              aria-hidden="true"
            >
              <path
                d="M12 22a10 10 0 1 0-10-10 10 10 0 0 0 10 10Z"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="M12 6v6l4 2"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>

            <select
              value={effectiveTime}
              onChange={(e) => onTimeChange?.(e.target.value)}
              className={cn(
                "h-[2rem] rounded-md border border-border bg-background px-[0.5rem] text-[0.8125rem] text-foreground",
                "focus:outline-none focus:ring-2 focus:ring-ring"
              )}
            >
              {DEFAULT_TIME_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="text-[0.75rem] font-medium text-muted-foreground">
            {tz}
          </div>
        </div>
      )}
    </div>
  );
}
