"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { X, CalendarDots, CaretLeft, CaretRight } from "@phosphor-icons/react";
import { FieldInfoIcon } from "@/components/ui/field-info-icon";

type FieldState = "default" | "selected" | "error" | "disabled";
type WeekStart = 0 | 1; // 0 = Sunday, 1 = Monday
type DateOutputFormat = "iso" | "mdy"; // iso = YYYY-MM-DD, mdy = MM/DD/YYYY

// ✅ Black-ish focus ring everywhere (no blue)
const FOCUS_BLACK =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-black/60 focus-visible:ring-offset-0";

type FieldSize = "small" | "large";

export const FIELD_SHELL_SIZE: Record<FieldSize, string> = {
  small: "min-h-[4rem] md:min-h-[4.25rem] xl:min-h-[4.5rem] 2xl:min-h-[5rem]",
  large: "min-h-[4.5rem] md:min-h-[4.75rem] xl:min-h-[5rem] 2xl:min-h-[5.5rem]",
};

export type FloatingDateInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "size" | "placeholder" | "type"
> & {
  state?: FieldState;
  size?: FieldSize;
  label: string;

  required?: boolean;
  optional?: boolean;
  info?: React.ReactNode;
  hint?: boolean;
  hintText?: string;

  errorText?: string;

  placeholderText?: string;
  showPlaceholder?: boolean;

  wordCount?: boolean;
  showTextInInput?: boolean;

  icon?: boolean;
  filled?: boolean;

  suffixText?: string;
  suffixClassName?: string;

  onValueChange?: (val: string) => void;
  type?: "date";

  weekStartsOn?: WeekStart;
  outputFormat?: DateOutputFormat;
  showYearDropdown?: boolean;
  showMonthDropdown?: boolean;

  min?: string;
  max?: string;

  withTime?: boolean;
  timeValue?: string; // "HH:MM" (24h)
  onTimeChange?: (time24h: string) => void;
  timezoneLabel?: string;
};

/* -----------------------------
   Timezone helpers (IP + GMT offset)
----------------------------- */
async function fetchTimezoneFromIP(): Promise<string | null> {
  const browserTimezone =
    Intl.DateTimeFormat().resolvedOptions().timeZone;

  if (browserTimezone) {
    return browserTimezone;
  }

  try {
    const cachedTimezone = sessionStorage.getItem("app_timezone");

    if (cachedTimezone) {
      return cachedTimezone;
    }
  } catch { }

  try {
    const r = await fetch("https://ipapi.co/json/", {
      cache: "force-cache",
    });

    if (r.ok) {
      const j = await r.json();

      if (typeof j?.timezone === "string" && j.timezone.trim()) {
        try {
          sessionStorage.setItem("app_timezone", j.timezone.trim());
        } catch { }

        return j.timezone.trim();
      }
    }
  } catch { }

  try {
    const r = await fetch("https://ipwho.is/", {
      cache: "force-cache",
    });

    if (r.ok) {
      const j = await r.json();

      if (typeof j?.timezone?.id === "string" && j.timezone.id.trim()) {
        try {
          sessionStorage.setItem("app_timezone", j.timezone.id.trim());
        } catch { }

        return j.timezone.id.trim();
      }
    }
  } catch { }

  return null;
}

function getOffsetMinutesForTimeZone(timeZone: string, date = new Date()): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const parts = dtf.formatToParts(date);
  const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));

  let y = Number(map.year);
  let m = Number(map.month);
  let d = Number(map.day);
  let hh = Number(map.hour);
  const mm = Number(map.minute);
  const ss = Number(map.second);

  // Some environments can emit "24" for midnight; normalize it.
  if (hh === 24) {
    hh = 0;
    const bump = new Date(Date.UTC(y, m - 1, d));
    bump.setUTCDate(bump.getUTCDate() + 1);
    y = bump.getUTCFullYear();
    m = bump.getUTCMonth() + 1;
    d = bump.getUTCDate();
  }

  const asUTC = Date.UTC(y, m - 1, d, hh, mm, ss);
  const diffMin = Math.round((asUTC - date.getTime()) / 60000);
  return diffMin;
}

function formatGMTOffset(timeZone: string, date = new Date()): string {
  // Prefer modern "shortOffset" if supported
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      timeZoneName: "shortOffset",
    }).formatToParts(date);

    const tzPart = parts.find((p) => p.type === "timeZoneName")?.value; // e.g. "GMT+5:30"
    if (tzPart && tzPart.startsWith("GMT")) {
      const m = tzPart.match(/^GMT([+-])(\d{1,2})(?::(\d{2}))?$/);
      if (m) {
        const sign = m[1];
        const hh = String(m[2]).padStart(2, "0");
        const mm = String(m[3] ?? "00").padStart(2, "0");
        return `GMT${sign}${hh}:${mm}`;
      }
      return tzPart;
    }
  } catch { }

  // Fallback: compute minutes offset
  const off = getOffsetMinutesForTimeZone(timeZone, date);
  const sign = off >= 0 ? "+" : "-";
  const abs = Math.abs(off);
  const hh = String(Math.floor(abs / 60)).padStart(2, "0");
  const mm = String(abs % 60).padStart(2, "0");
  return `GMT${sign}${hh}:${mm}`;
}

/* -----------------------------
   Date helpers
----------------------------- */
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

function toISODate(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function toMDY(d: Date) {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
}

function parseISO(v: string) {
  const m = v.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  const dt = new Date(y, mo, d);
  return Number.isFinite(dt.getTime()) ? clampDate(dt) : null;
}

function parseMDY(v: string) {
  const m = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const mm = Number(m[1]);
  const dd = Number(m[2]);
  const yyyy = Number(m[3]);
  if (!Number.isFinite(mm) || !Number.isFinite(dd) || !Number.isFinite(yyyy))
    return null;
  if (mm < 1 || mm > 12) return null;

  const dt = new Date(yyyy, mm - 1, dd);
  if (
    dt.getFullYear() !== yyyy ||
    dt.getMonth() !== mm - 1 ||
    dt.getDate() !== dd
  )
    return null;
  return clampDate(dt);
}

function parseDateLike(s: string): Date | null {
  const v = (s ?? "").trim();
  if (!v) return null;

  const iso = parseISO(v);
  if (iso) return iso;

  const mdy = parseMDY(v);
  if (mdy) return mdy;

  const dt = new Date(v);
  return Number.isFinite(dt.getTime()) ? clampDate(dt) : null;
}

function isCompleteMDY(v: string) {
  return /^\d{2}\/\d{2}\/\d{4}$/.test(v);
}

function maskToMDY(input: string) {
  const digits = (input ?? "").replace(/[^\d]/g, "").slice(0, 8); // MMDDYYYY
  const mm = digits.slice(0, 2);
  const dd = digits.slice(2, 4);
  const yyyy = digits.slice(4, 8);

  if ((input ?? "").includes("/"))
    return (input ?? "").replace(/[^\d/]/g, "").slice(0, 10);

  let out = "";
  if (mm.length) out += mm;
  if (digits.length >= 3) out += "/" + dd;
  if (digits.length >= 5) out += "/" + yyyy;
  return out;
}

function dayIndex(d: Date, weekStartsOn: WeekStart) {
  const js = d.getDay();
  if (weekStartsOn === 0) return js;
  return (js + 6) % 7; // Monday-start
}

const WEEKDAYS_MON = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const WEEKDAYS_SUN = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function clampToRange(d: Date, minD: Date | null, maxD: Date | null) {
  const t = d.getTime();
  if (minD && t < minD.getTime()) return minD;
  if (maxD && t > maxD.getTime()) return maxD;
  return d;
}

function isOutOfRange(d: Date, minD: Date | null, maxD: Date | null) {
  const t = d.getTime();
  if (minD && t < minD.getTime()) return true;
  if (maxD && t > maxD.getTime()) return true;
  return false;
}

/* -----------------------------
   Time helpers
----------------------------- */
function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function digits2(v: string) {
  return (v ?? "").replace(/[^\d]/g, "").slice(0, 2);
}

function parseTime24(v?: string) {
  const raw = (v ?? "").trim();
  const m = raw.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return { hh: 0, mm: 0 };
  const hh = Math.max(0, Math.min(23, Number(m[1]) || 0));
  const mm = Math.max(0, Math.min(59, Number(m[2]) || 0));
  return { hh, mm };
}

function clampMinute(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(59, Math.floor(n)));
}

function to12h(hh: number) {
  const ampm = hh >= 12 ? "PM" : "AM";
  const h12 = ((hh + 11) % 12) + 1;
  return { h12, ampm: ampm as "AM" | "PM" };
}

function to24h(h12: number, ampm: "AM" | "PM") {
  const safe = Math.max(1, Math.min(12, h12));
  if (ampm === "AM") return safe === 12 ? 0 : safe;
  return safe === 12 ? 12 : safe + 12;
}

function buildTimeOptions(stepMinutes = 30) {
  const out: Array<{ label: string; value: string }> = [];
  for (let m = 0; m < 24 * 60; m += stepMinutes) {
    const hh = Math.floor(m / 60);
    const mm = m % 60;
    const value = `${pad2(hh)}:${pad2(mm)}`;

    const { h12, ampm } = to12h(hh);
    const label = `${h12}:${pad2(mm)} ${ampm}`;

    out.push({ label, value });
  }
  return out;
}

const TIME_SLOTS_30 = buildTimeOptions(30);

/* -----------------------------
   Portal popover
----------------------------- */
function DatePopoverPortal({
  anchorRef,
  children,
  onRequestClose,
}: {
  anchorRef: React.RefObject<HTMLElement | null>;
  children: React.ReactNode;
  onRequestClose: () => void;
}) {
  const [mounted, setMounted] = React.useState(false);
  const popRef = React.useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = React.useState({ top: 0, left: 0 });

  React.useEffect(() => setMounted(true), []);

  const recompute = React.useCallback(() => {
    const anchor = anchorRef.current;
    const pop = popRef.current;
    if (!anchor || !pop) return;

    const gap = 8; // (JS px math kept as-is)
    const rect = anchor.getBoundingClientRect();
    const popRect = pop.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let top = rect.bottom + gap;

    const canFlipUp = rect.top - gap - popRect.height > gap;
    const wouldOverflowBottom = top + popRect.height > vh - gap;
    if (wouldOverflowBottom && canFlipUp) top = rect.top - gap - popRect.height;

    let left = rect.left;
    if (left + popRect.width > vw - gap)
      left = Math.max(gap, vw - gap - popRect.width);
    if (left < gap) left = gap;

    setPos({ top, left });
  }, [anchorRef]);

  React.useLayoutEffect(() => {
    if (!mounted) return;
    recompute();
  }, [mounted, recompute, children]);

  React.useEffect(() => {
    if (!mounted) return;
    const onAnyScrollOrResize = () => recompute();
    window.addEventListener("resize", onAnyScrollOrResize);
    window.addEventListener("scroll", onAnyScrollOrResize, true);
    return () => {
      window.removeEventListener("resize", onAnyScrollOrResize);
      window.removeEventListener("scroll", onAnyScrollOrResize, true);
    };
  }, [mounted, recompute]);

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[999999] bg-transparent"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onRequestClose();
      }}
    >
      <div
        ref={popRef}
        className="absolute"
        style={{ top: pos.top, left: pos.left }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}

/* -----------------------------
   Calendar UI
----------------------------- */
function CalendarPopover({
  selected,
  onSelect,
  viewMonth,
  setViewMonth,
  weekStartsOn = 1,
  minDate,
  maxDate,
  showYearDropdown = true,
  size = "small",
  withTime,
  timeValue,
  onTimeChange,
  timezoneLabel,
  onRequestClose,
}: {
  selected: Date | null;
  onSelect: (d: Date) => void;
  viewMonth: Date;
  setViewMonth: (d: Date) => void;
  weekStartsOn?: WeekStart;
  minDate: Date | null;
  maxDate: Date | null;
  showYearDropdown?: boolean;
  size?: FieldSize;
  withTime?: boolean;
  timeValue?: string;
  onTimeChange?: (t: string) => void;
  timezoneLabel?: string;
  onRequestClose?: () => void;
}) {
  const today = React.useMemo(() => clampDate(new Date()), []);
  const weekdays = weekStartsOn === 1 ? WEEKDAYS_MON : WEEKDAYS_SUN;

  const days = React.useMemo(() => {
    const first = startOfMonth(viewMonth);
    const offset = dayIndex(first, weekStartsOn);
    const start = new Date(first);
    start.setDate(first.getDate() - offset);

    const cells: Array<{
      date: Date;
      inMonth: boolean;
      isToday: boolean;
      isSelected: boolean;
      disabled: boolean;
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
        disabled: isOutOfRange(cd, minDate, maxDate),
      });
    }

    return cells;
  }, [viewMonth, selected, today, weekStartsOn, minDate, maxDate]);

  const canPrev = React.useMemo(() => {
    if (!minDate) return true;
    const prev = addMonths(viewMonth, -1);
    const lastOfPrev = new Date(prev.getFullYear(), prev.getMonth() + 1, 0);
    return lastOfPrev.getTime() >= minDate.getTime();
  }, [viewMonth, minDate]);

  const canNext = React.useMemo(() => {
    if (!maxDate) return true;
    const next = addMonths(viewMonth, 1);
    const firstOfNext = new Date(next.getFullYear(), next.getMonth(), 1);
    return firstOfNext.getTime() <= maxDate.getTime();
  }, [viewMonth, maxDate]);

  const [yearOpen, setYearOpen] = React.useState(false);
  const yearWrapRef = React.useRef<HTMLDivElement | null>(null);

  const currentYear = React.useMemo(() => new Date().getFullYear(), []);
  const yearRange = React.useMemo(
    () => Array.from({ length: 6 }, (_, i) => currentYear - i),
    [currentYear]
  );

  const viewYear = viewMonth.getFullYear();
  const viewMonthIdx = viewMonth.getMonth();
  const setYear = (y: number) => setViewMonth(new Date(y, viewMonthIdx, 1));

  const isYearDisabled = (y: number) => {
    if (minDate && y < minDate.getFullYear()) return true;
    if (maxDate && y > maxDate.getFullYear()) return true;
    return false;
  };

  React.useEffect(() => {
    if (!yearOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!yearWrapRef.current) return;
      if (!yearWrapRef.current.contains(e.target as Node)) setYearOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [yearOpen]);

  // ✅ Header label logic
  const monthYearLabel = React.useMemo(() => {
    try {
      return new Intl.DateTimeFormat("en-US", {
        month: "long",
        year: "numeric",
      }).format(viewMonth);
    } catch {
      return `${viewMonth.getMonth() + 1}/${viewMonth.getFullYear()}`;
    }
  }, [viewMonth]);

  const selectedLabel = React.useMemo(() => {
    if (!selected) return "";
    try {
      return new Intl.DateTimeFormat("en-US", {
        weekday: "short",
        month: "long",
        day: "numeric",
      }).format(selected);
    } catch {
      return selected.toDateString();
    }
  }, [selected]);

  const headerLabel = React.useMemo(() => {
    if (!selected) return monthYearLabel;
    const sameMonth =
      selected.getFullYear() === viewMonth.getFullYear() &&
      selected.getMonth() === viewMonth.getMonth();
    return sameMonth ? selectedLabel : monthYearLabel;
  }, [selected, viewMonth, monthYearLabel, selectedLabel]);

  // ✅ Timezone display "Asia/Kolkata (GMT+05:30)"
  const tzName =
    timezoneLabel ??
    (() => {
      try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone;
      } catch {
        return "Local Time";
      }
    })();

  const gmt = React.useMemo(() => formatGMTOffset(tzName), [tzName]);
  const tzDisplayFull = React.useMemo(() => `${tzName} (${gmt})`, [tzName, gmt]);

  // Time state
  const { hh: rawHH, mm: rawMM } = React.useMemo(
    () => parseTime24(timeValue ?? "00:00"),
    [timeValue]
  );
  const { h12: initH12, ampm: initAmPm } = React.useMemo(
    () => to12h(rawHH),
    [rawHH]
  );

  const clampHour12Text = React.useCallback((v: string) => {
    const d = digits2(v);
    if (!d) return "";
    const n = Number(d) || 1;
    return String(Math.max(1, Math.min(12, n)));
  }, []);

  const normalizeMinuteText = React.useCallback((v: string) => {
    const d = digits2(v);
    if (!d) return "";
    const n = clampMinute(Number(d) || 0);
    return pad2(n);
  }, []);

  const [hourText, setHourText] = React.useState<string>(() => String(initH12));
  const [minuteText, setMinuteText] = React.useState<string>(() =>
    pad2(clampMinute(rawMM))
  );
  const [ampm, setAmPm] = React.useState<"AM" | "PM">(() => initAmPm);

  React.useEffect(() => {
    const { hh, mm } = parseTime24(timeValue ?? "00:00");
    const { h12, ampm } = to12h(hh);
    setHourText(String(h12));
    setAmPm(ampm);
    setMinuteText(pad2(clampMinute(mm)));
  }, [timeValue]);

  const commitTime = React.useCallback(
    (next?: { hourText?: string; minuteText?: string; ampm?: "AM" | "PM" }) => {
      const ap = next?.ampm ?? ampm;

      const htxt = (next?.hourText ?? hourText).trim();
      const hNum = Math.max(1, Math.min(12, Number(htxt) || 1));

      const mtxt = (next?.minuteText ?? minuteText).trim();
      const mNum = clampMinute(Number(mtxt) || 0);

      const hh24 = to24h(hNum, ap);
      const out = `${pad2(hh24)}:${pad2(mNum)}`;
      onTimeChange?.(out);
    },
    [hourText, minuteText, ampm, onTimeChange]
  );

  const [timeOpen, setTimeOpen] = React.useState(false);
  const timeWrapRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!timeOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!timeWrapRef.current) return;
      if (!timeWrapRef.current.contains(e.target as Node)) setTimeOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [timeOpen]);

  const currentTime24 = React.useMemo(() => {
    const hNum = Math.max(1, Math.min(12, Number(hourText) || 1));
    const hh24 = to24h(hNum, ampm);
    const mNum = clampMinute(Number(minuteText) || 0);
    return `${pad2(hh24)}:${pad2(mNum)}`;
  }, [hourText, minuteText, ampm]);

  const selectSlot = (val24: string) => {
    const { hh, mm } = parseTime24(val24);
    const { h12, ampm } = to12h(hh);

    setHourText(String(h12));
    setAmPm(ampm);
    setMinuteText(pad2(clampMinute(mm)));

    onTimeChange?.(`${pad2(hh)}:${pad2(clampMinute(mm))}`);
    setTimeOpen(false);
  };

  const [timeDropUp, setTimeDropUp] = React.useState(false);
  React.useEffect(() => {
    if (!timeOpen) return;
    requestAnimationFrame(() => {
      const el = timeWrapRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const dropdownH = size === "large" ? 240 : 220; // (JS px math kept as-is)
      const gap = 16;

      const spaceBelow = window.innerHeight - rect.bottom;
      setTimeDropUp(spaceBelow < dropdownH + gap);
    });
  }, [timeOpen, size]);

  return (
    <div
      role="dialog"
      aria-label="Choose date"
      className={cn(
        "relative w-[22.5rem] max-w-[calc(100vw-1rem)] rounded-2xl border border-border bg-background shadow-xl",
        "overflow-visible"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <button
          type="button"
          aria-label="Previous month"
          disabled={!canPrev}
          onClick={() => canPrev && setViewMonth(addMonths(viewMonth, -1))}
          className={cn(
            "grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-secondary",
            FOCUS_BLACK,
            !canPrev && "opacity-50 cursor-not-allowed hover:bg-transparent"
          )}
        >
          <CaretLeft className="h-5 w-5" />
        </button>

        <div ref={yearWrapRef} className="relative">
          <button
            type="button"
            onClick={() => {
              if (!showYearDropdown) return;
              setYearOpen(!yearOpen);
            }}
            className={cn(
              "inline-flex items-center gap-2",
              "text-[14px] font-semibold text-foreground",
              "rounded-md px-2 py-1",
              showYearDropdown && "hover:bg-secondary",
              FOCUS_BLACK
            )}
            aria-haspopup={showYearDropdown ? "listbox" : undefined}
            aria-expanded={showYearDropdown ? yearOpen : undefined}
          >
            {headerLabel}
          </button>

          {showYearDropdown && yearOpen ? (
            <div
              role="listbox"
              className={cn(
                "absolute left-1/2 top-full z-40 mt-2 -translate-x-1/2",
                "w-[10rem] rounded-xl border border-border bg-background shadow-lg overflow-hidden"
              )}
            >
              {yearRange.map((y) => {
                const active = y === viewYear;
                const disabled = isYearDisabled(y);
                return (
                  <button
                    key={y}
                    type="button"
                    role="option"
                    aria-selected={active}
                    disabled={disabled}
                    onClick={() => {
                      if (disabled) return;
                      setYear(y);
                      setYearOpen(false);
                    }}
                    className={cn(
                      "w-full px-3 py-2 text-left text-[13px] font-semibold transition",
                      FOCUS_BLACK,
                      active
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground",
                      !active && !disabled && "hover:bg-secondary",
                      disabled && "opacity-40 cursor-not-allowed hover:bg-transparent"
                    )}
                  >
                    {y}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>

        <button
          type="button"
          aria-label="Next month"
          disabled={!canNext}
          onClick={() => canNext && setViewMonth(addMonths(viewMonth, 1))}
          className={cn(
            "grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-secondary",
            FOCUS_BLACK,
            !canNext && "opacity-50 cursor-not-allowed hover:bg-transparent"
          )}
        >
          <CaretRight className="h-5 w-5" />
        </button>
      </div>

      {/* Weekdays */}
      <div className="grid grid-cols-7 px-4 pb-2 text-center text-[12px] font-semibold text-muted-foreground">
        {weekdays.map((w) => (
          <div key={w} className="py-1">
            {w}
          </div>
        ))}
      </div>

      {/* Days */}
      <div className="grid grid-cols-7 gap-y-1 px-4 pb-4">
        {days.map(({ date, inMonth, isSelected, isToday, disabled }) => (
          <button
            key={date.toISOString()}
            type="button"
            disabled={disabled}
            onClick={() => {
              if (disabled) return;
              onSelect(date);
              onRequestClose?.();
            }}
            className={cn(
              "mx-auto grid size-9 place-items-center rounded-m text-[14px] font-medium transition",
              FOCUS_BLACK,
              inMonth ? "text-foreground" : "text-muted-foreground/50",
              !disabled && !isSelected && inMonth && "hover:bg-secondary",
              isToday && !isSelected && "ring-1 ring-border",
              isSelected && "bg-primary text-primary-foreground",
              disabled && "opacity-35 cursor-not-allowed hover:bg-transparent"
            )}
            aria-pressed={isSelected}
          >
            {date.getDate()}
          </button>
        ))}
      </div>

      <hr className="mx-4" />

      {/* Time row */}
      {withTime ? (
        <div className="px-4 py-4">
          <div
            ref={timeWrapRef}
            className={cn(
              "relative rounded-l border border-border bg-background overflow-hidden",
              size === "large" ? "px-4 py-3" : "px-3 py-2"
            )}
          >
            <div
              className={cn(
                "text-muted-foreground",
                size === "large" ? "text-[13px]" : "text-[12px]"
              )}
            >
              Select Time
            </div>

            <div className="mt-2 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {/* Hour */}
                <input
                  value={hourText}
                  onClick={() => setTimeOpen((v) => !v)}
                  onChange={(e) => {
                    const raw = digits2(e.target.value);
                    if (!raw) return setHourText("");
                    const n = Math.min(12, Math.max(1, Number(raw) || 1));
                    setHourText(String(n));
                  }}
                  onBlur={() => {
                    const clamped = clampHour12Text(hourText);
                    const final = clamped || "1";
                    setHourText(final);
                    commitTime({ hourText: final });
                  }}
                  inputMode="numeric"
                  className={cn(
                    size === "large"
                      ? "h-8 w-[2.75rem] text-[16px]"
                      : "h-7 w-[2.25rem] text-[14px]",
                    "rounded-md border border-border bg-background px-2 font-semibold text-foreground",
                    FOCUS_BLACK
                  )}
                  aria-label="Hour"
                />

                <div
                  className={cn(
                    "font-semibold text-foreground",
                    size === "large" ? "text-[16px]" : "text-[14px]"
                  )}
                >
                  :
                </div>

                {/* Minutes */}
                <input
                  value={minuteText}
                  onClick={() => setTimeOpen((v) => !v)}
                  onChange={(e) => setMinuteText(digits2(e.target.value))}
                  onBlur={() => {
                    const normalized = normalizeMinuteText(minuteText);
                    const final = normalized || "00";
                    setMinuteText(final);
                    commitTime({ minuteText: final });
                  }}
                  inputMode="numeric"
                  className={cn(
                    size === "large"
                      ? "h-8 w-[2.75rem] text-[16px]"
                      : "h-7 w-[2.5rem] text-[14px]",
                    "rounded-md border border-border bg-background px-2 font-semibold text-foreground",
                    FOCUS_BLACK
                  )}
                  aria-label="Minutes"
                  placeholder="00"
                />

                {/* AM/PM */}
                <select
                  value={ampm}
                  onChange={(e) => {
                    const next = (e.target.value === "PM" ? "PM" : "AM") as
                      | "AM"
                      | "PM";
                    setAmPm(next);
                    commitTime({ ampm: next });
                  }}
                  className={cn(
                    size === "large" ? "h-8 text-[14px]" : "h-7 text-[12px]",
                    "rounded-md border border-transparent bg-background px-1 font-semibold text-foreground",
                    FOCUS_BLACK
                  )}
                  aria-label="AM/PM"
                >
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
              </div>

              {/* ✅ Timezone + (GMT) inside, GMT 2pt smaller + lighter */}
              <div className="max-w-[9.375rem] sm:max-w-[11.25rem] md:max-w-[13.75rem] text-right">
                <div
                  className={cn(
                    "whitespace-nowrap overflow-hidden text-ellipsis leading-tight"
                  )}
                  title={tzDisplayFull}
                >
                  <span
                    className={cn(
                      "font-semibold text-foreground",
                      size === "large" ? "text-[14px]" : "text-[12px]"
                    )}
                  >
                    {tzName}
                  </span>
                  <span
                    className={cn(
                      "ml-1 font-normal text-muted-foreground",
                      size === "large" ? "text-[12px]" : "text-[10px]"
                    )}
                  >
                    ({gmt})
                  </span>
                </div>
              </div>
            </div>

            {/* Time slots dropdown */}
            {timeOpen ? (
              <div
                className={cn(
                  "absolute left-4 right-4 z-[9999]",
                  timeDropUp
                    ? "bottom-[calc(100%+0.5rem)]"
                    : "top-[calc(100%+0.5rem)]",
                  "rounded-xl border border-border bg-background shadow-lg overflow-hidden"
                )}
              >
                <div
                  className={cn(
                    "overflow-auto",
                    size === "large" ? "max-h-[15rem]" : "max-h-[13.75rem]"
                  )}
                >
                  {TIME_SLOTS_30.map((opt) => {
                    const active = opt.value === currentTime24;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => selectSlot(opt.value)}
                        className={cn(
                          "w-full text-left font-semibold transition",
                          FOCUS_BLACK,
                          size === "large"
                            ? "px-3 py-2 text-[13px]"
                            : "px-3 py-1.5 text-[12px]",
                          active
                            ? "bg-primary text-primary-foreground"
                            : "text-foreground hover:bg-secondary"
                        )}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

/* -----------------------------
   Main component
----------------------------- */
export const FloatingDateInput = React.forwardRef<
  HTMLInputElement,
  FloatingDateInputProps
>(
  (
    {
      className,
      state,
      size = "small",
      label,

      required = false,
      optional = false,

      hint = false,
      hintText = "Hint text",

      errorText,

      placeholderText = "MM/DD/YYYY",
      showPlaceholder = true,

      wordCount = false,
      showTextInInput = true,

      icon = true,
      filled = false,

      suffixText,
      suffixClassName,
      info,
      disabled,
      value,
      defaultValue,
      maxLength,
      minLength,
      onChange,
      onValueChange,
      type = "date",
      id,
      step,
      min,
      max,

      weekStartsOn = 1,
      outputFormat = "iso",
      showYearDropdown = true,
      showMonthDropdown = true,

      withTime = false,
      timeValue,
      onTimeChange,
      timezoneLabel,

      ...props
    },
    forwardedRef
  ) => {
    const reactId = React.useId();
    const inputId = id ?? `fdi-${reactId}`;

    const isControlled = value !== undefined;
    const [inner, setInner] = React.useState<string>(
      defaultValue?.toString?.() ?? ""
    );

    const rawValue = String((isControlled ? value : inner) ?? "");
    const minDate = React.useMemo(() => (min ? parseDateLike(min) : null), [min]);
    const maxDate = React.useMemo(() => (max ? parseDateLike(max) : null), [max]);

    const [textValue, setTextValue] = React.useState<string>(() => {
      const d = parseDateLike(rawValue);
      return d ? toMDY(clampToRange(d, minDate, maxDate)) : rawValue ? maskToMDY(rawValue) : "";
    });

    const [isFocused, setIsFocused] = React.useState(false);
    const isEditingRef = React.useRef(false);

    React.useEffect(() => {
      if (isEditingRef.current) return;

      const d = parseDateLike(rawValue);
      if (d) {
        const clamped = clampToRange(d, minDate, maxDate);
        setTextValue(toMDY(clamped));
      } else {
        setTextValue(rawValue ? maskToMDY(rawValue) : "");
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rawValue, minDate?.getTime(), maxDate?.getTime()]);

    const localRef = React.useRef<HTMLInputElement | null>(null);
    const shellRef = React.useRef<HTMLDivElement | null>(null);

    const setRef = (node: HTMLInputElement | null) => {
      localRef.current = node;
      if (typeof forwardedRef === "function") forwardedRef(node);
      else if (forwardedRef)
        (forwardedRef as React.MutableRefObject<HTMLInputElement | null>).current =
          node;
    };

    const derivedState: FieldState = disabled ? "disabled" : errorText ? "error" : state ?? "default";
    const isDisabled = derivedState === "disabled";
    const isInvalid = derivedState === "error";
    const isSelectedForced = derivedState === "selected";

    const hasValue = textValue.length > 0;
    const canHover = !isDisabled;
    const canClear = icon && !isDisabled && hasValue;

    const countText =
      wordCount && typeof maxLength === "number"
        ? `${textValue.length}/${maxLength}`
        : null;

    // label always floats
    const isFloatingNow = true;

    const [open, setOpen] = React.useState(false);

    // ✅ timezone resolved from IP (fallback to browser)
    const [resolvedTimezone, setResolvedTimezone] = React.useState<string>(() => {
      try {
        return (
          timezoneLabel ??
          Intl.DateTimeFormat().resolvedOptions().timeZone ??
          "Local Time"
        );
      } catch {
        return timezoneLabel ?? "Local Time";
      }
    });

    React.useEffect(() => {
      if (timezoneLabel) {
        setResolvedTimezone(timezoneLabel);
        return;
      }

      let alive = true;
      (async () => {
        const tz = await fetchTimezoneFromIP();
        if (!alive) return;

        if (tz) setResolvedTimezone(tz);
        else {
          try {
            setResolvedTimezone(
              Intl.DateTimeFormat().resolvedOptions().timeZone ?? "Local Time"
            );
          } catch {
            setResolvedTimezone("Local Time");
          }
        }
      })();

      return () => {
        alive = false;
      };
    }, [timezoneLabel]);

    const selectedDate = React.useMemo(() => {
      const d = parseMDY(textValue) ?? parseDateLike(rawValue);
      return d ? clampToRange(d, minDate, maxDate) : null;
    }, [textValue, rawValue, minDate, maxDate]);

    const [viewMonth, setViewMonth] = React.useState<Date>(() =>
      startOfMonth(selectedDate ?? clampDate(new Date()))
    );

    React.useEffect(() => {
      if (!selectedDate) return;
      setViewMonth(startOfMonth(selectedDate));
    }, [selectedDate?.getFullYear(), selectedDate?.getMonth(), selectedDate?.getDate()]);

    React.useEffect(() => {
      if (!open) return;
      const onDocKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") setOpen(false);
      };
      document.addEventListener("keydown", onDocKeyDown);
      return () => document.removeEventListener("keydown", onDocKeyDown);
    }, [open]);

    const commitDate = (d: Date) => {
      const clamped = clampToRange(d, minDate, maxDate);
      const nextText = toMDY(clamped);
      setTextValue(nextText);

      const out = outputFormat === "mdy" ? nextText : toISODate(clamped);
      if (!isControlled) setInner(out);
      onValueChange?.(out);

      const el = localRef.current;
      if (el) {
        const setter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          "value"
        )?.set;
        setter?.call(el, nextText);
        el.dispatchEvent(new Event("input", { bubbles: true }));
      }
    };

    const handleClear = () => {
      setTextValue("");
      if (!isControlled) setInner("");
      onValueChange?.("");
      localRef.current?.focus();
    };

    const handleSelectDate = (d: Date) => {
      commitDate(d);
      setOpen(false);
      requestAnimationFrame(() => localRef.current?.focus());
    };

    const tryCommitFromText = (nextText: string) => {
      if (!isCompleteMDY(nextText)) return;
      const parsed = parseMDY(nextText);
      if (!parsed) return;
      commitDate(parsed);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      isEditingRef.current = true;

      const next = maskToMDY(e.target.value);
      setTextValue(next);
      onChange?.(e);

      tryCommitFromText(next);
    };

    const handleBlurCommit = () => {
      isEditingRef.current = false;

      if (!textValue.trim()) return;

      if (isCompleteMDY(textValue)) {
        const d = parseMDY(textValue);
        if (d) return commitDate(d);
      }

      const d = parseDateLike(textValue);
      if (d) return commitDate(d);
    };

    const LEFT_PAD =
      size === "large"
        ? "left-[0.75rem] md:left-[0.875rem] xl:left-[0.875rem] 2xl:left-[1rem]"
        : "left-[0.625rem] md:left-[0.75rem] xl:left-[0.75rem] 2xl:left-[0.875rem]";

    const RIGHT_PAD =
      size === "large"
        ? "right-[0.65rem] md:right-[0.875rem] xl:right-[0.875rem] 2xl:right-[1rem]"
        : "right-[0.625rem] md:right-[0.75rem] xl:right-[0.75rem] 2xl:right-[0.875rem]";

    const FLOAT_TOP = "top-[0.625rem] xl:top-[0.75rem] 2xl:top-[0.875rem]";

    const shellSize = FIELD_SHELL_SIZE[size];

    const inputPad =
      size === "large"
        ? cn(
          "px-[0.75rem] md:px-[0.875rem] 2xl:px-[1rem]",
          "pt-[2rem] md:pt-[2.125rem] xl:pt-[2.25rem] 2xl:pt-[2.375rem]",
          "pb-[0.875rem] md:pb-[1rem] 2xl:pb-[1.125rem]"
        )
        : cn(
          "px-[0.625rem] md:px-[0.75rem] 2xl:px-[0.875rem]",
          "pt-[1.875rem] md:pt-[2rem] xl:pt-[2.125rem] 2xl:pt-[2.25rem]",
          "pb-[0.75rem] md:pb-[0.875rem] 2xl:pb-[1rem]"
        );

    const INPUT_TEXT =
      "text-[14px] leading-[20px] xl:text-[16px] xl:leading-[24px] font-semibold";

    const LABEL_DEFAULT = "text-[16px] leading-[24px] font-medium";
    const LABEL_FLOAT = "text-[14px] leading-[20px] font-normal";
    const LABEL_SECONDARY = "text-[color:var(--Light-Text-Secondary,#969696)]";

    const shellBorder = isInvalid ? "border-error-500" : "border-bd-primary";
    const shellBg = filled ? "bg-bg-inverse" : "bg-bg-primary";
    const patchBg = filled ? "bg-bg-inverse" : "bg-bg-primary";

    const SUFFIX_TOP =
      size === "large"
        ? "top-[2.625rem] md:top-[2.75rem] xl:top-[3rem] 2xl:top-[3.125rem]"
        : "top-[2.5rem] md:top-[2.625rem] xl:top-[2.875rem] 2xl:top-[3rem]";

    const prBase =
      size === "large"
        ? "pr-[9.75rem] md:pr-[10.75rem] 2xl:pr-[11.75rem]"
        : "pr-[9.5rem] md:pr-[10.5rem] 2xl:pr-[11.5rem]";

    const clearRight =
      size === "large"
        ? "right-[3rem] md:right-[3.375rem] xl:right-[3.625rem] 2xl:right-[4rem]"
        : "right-[2.875rem] md:right-[3.25rem] xl:right-[3.5rem] 2xl:right-[3.875rem]";

    return (
      <div className={cn("w-full my-2", className)}>
        <div
          ref={shellRef}
          className={cn(
            "group relative w-full rounded-m border",
            "transition-[background-color,box-shadow] duration-300 ease-out",
            shellBorder,
            shellBg,
            shellSize,
            isDisabled ? "cursor-not-allowed opacity-60" : "cursor-text",
            // ✅ black-ish ring on active/focus/open (no blue)
            !isDisabled &&
            !isInvalid &&
            (isSelectedForced || isFocused || open) &&
            "ring-1 ring-black/60"
          )}
        >
          {/* Word count */}
          {countText ? (
            <div
              className={cn(
                "absolute z-10",
                RIGHT_PAD,
                FLOAT_TOP,
                LABEL_FLOAT,
                "font-normal",
                isInvalid ? "text-error-500" : LABEL_SECONDARY,
                "pointer-events-none select-none whitespace-nowrap"
              )}
            >
              {countText}
            </div>
          ) : null}

          {/* Clear */}
          {canClear ? (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleClear();
              }}
              className={cn(
                "absolute z-10",
                clearRight,
                SUFFIX_TOP,
                "-translate-y-1/2",
                "inline-flex items-center justify-center",
                "size-4xl rounded-s",
                "text-neutral-600 transition-colors duration-300 ease-out",
                !isDisabled && "hover:text-neutral-700",
                FOCUS_BLACK
              )}
              aria-label="Clear date"
            >
              <X />
            </button>
          ) : null}

          {/* Calendar icon */}
          <button
            type="button"
            disabled={isDisabled}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setOpen((v) => !v);
              requestAnimationFrame(() => localRef.current?.focus());
            }}
            className={cn(
              "absolute z-10",
              RIGHT_PAD,
              SUFFIX_TOP,
              "-translate-y-1/2",
              "inline-flex items-center justify-center",
              "rounded-s",
              isDisabled
                ? "text-neutral-400 cursor-not-allowed"
                : "text-neutral-650 hover:text-neutral-800",
              FOCUS_BLACK
            )}
            aria-label="Open calendar"
          >
            <CalendarDots className="h-5 w-5" />
          </button>

          {/* Input */}
          <input
            id={inputId}
            ref={setRef}
            disabled={isDisabled}
            value={textValue}
            minLength={minLength}
            maxLength={maxLength ?? 10}
            inputMode="numeric"
            autoComplete="off"
            type="text"
            onChange={handleChange}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
              if (!isDisabled) setOpen(true);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
              handleBlurCommit();
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown" && !open && !isDisabled) {
                e.preventDefault();
                setOpen(true);
              }
              if (e.key === "Enter") {
                tryCommitFromText(textValue);
                setOpen(false);
              }
              props.onKeyDown?.(e);
            }}
            aria-invalid={isInvalid || undefined}
            aria-haspopup="dialog"
            aria-expanded={open}
            className={cn(
              "peer w-full bg-transparent outline-none",
              "transition-[color] duration-300 ease-out",
              INPUT_TEXT,
              inputPad,
              prBase,
              isDisabled ? "text-tx-disabled" : "text-tx-primary",
              !showTextInInput && "text-transparent caret-transparent",
              showPlaceholder
                ? cn(
                  "placeholder:text-tx-tertiary placeholder:opacity-0",
                  "peer-focus:placeholder:opacity-100"
                )
                : "placeholder:opacity-0"
            )}
            placeholder={showPlaceholder ? placeholderText : ""}
            {...props}
          />

          {/* Label */}
          <label
            htmlFor={inputId}
            className={cn(
              "absolute z-10 select-none",
              LEFT_PAD,
              "pr-[11.25rem]",
              "max-w-full truncate",
              "transition-[top,transform,font-size,line-height,font-weight] duration-300 ease-out",
              isInvalid ? "text-error-500" : LABEL_SECONDARY,
              isDisabled ? "cursor-not-allowed" : "cursor-text",
              "top-1/2 -translate-y-1/2",
              LABEL_DEFAULT,
              canHover &&
              cn(
                "group-hover:translate-y-0",
                "group-hover:top-[0.625rem] xl:group-hover:top-[0.75rem] 2xl:group-hover:top-[0.875rem]",
                "group-hover:text-[14px] group-hover:leading-[20px] group-hover:font-normal"
              ),
              canHover &&
              cn(
                "peer-focus:translate-y-0",
                "peer-focus:top-[0.625rem] xl:peer-focus:top-[0.75rem] 2xl:peer-focus:top-[0.875rem]",
                "peer-focus:text-[14px] peer-focus:leading-[20px] peer-focus:font-normal"
              ),
              isFloatingNow && cn(FLOAT_TOP, "translate-y-0", LABEL_FLOAT)
            )}
          >
            <span className="inline-flex items-center gap-[0.125rem]">
              {label}
              {required ? (
                <span
                  className={cn("font-normal", isDisabled ? "text-neutral-400" : "text-[#E53935]")}
                  aria-hidden="true"
                >
                  *
                </span>
              ) : null}

              {optional ? <span className="ml-xs text-tx-tertiary">(optional)</span> : null}

              {info ? (
                <span className="ml-1 inline-flex pointer-events-auto">
                  <FieldInfoIcon content={info} />
                </span>
              ) : null}

            </span>
          </label>

          {/* Popover */}
          {open && !isDisabled ? (
            <DatePopoverPortal
              anchorRef={shellRef}
              onRequestClose={() => setOpen(false)}
            >
              <CalendarPopover
                size={size}
                selected={selectedDate}
                onSelect={handleSelectDate}
                viewMonth={viewMonth}
                setViewMonth={(d) => setViewMonth(startOfMonth(d))}
                weekStartsOn={weekStartsOn}
                minDate={minDate}
                maxDate={maxDate}
                showYearDropdown={showYearDropdown}
                withTime={withTime}
                timeValue={timeValue}
                onTimeChange={onTimeChange}
                timezoneLabel={resolvedTimezone}
                onRequestClose={() => setOpen(false)}
              />
            </DatePopoverPortal>
          ) : null}
        </div>

        {(isInvalid || hint) && (
          <div className="mt-xs">
            <p
              className={cn(
                "text-[14px] leading-[20px] xl:text-[16px] xl:leading-[24px]",
                isInvalid ? "text-error-500" : "text-tx-tertiary"
              )}
            >
              {isInvalid ? errorText : hintText}
            </p>
          </div>
        )}
      </div>
    );
  }
);

export function DateTimePanel(props: {
  value: string; // date only (YYYY-MM-DD if outputFormat="iso")
  onValueChange: (val: string) => void;

  outputFormat?: "iso" | "mdy";
  weekStartsOn?: 0 | 1;

  min?: string;
  max?: string;

  showYearDropdown?: boolean;
  size?: "small" | "large";

  withTime?: boolean;
  timeValue?: string; // "HH:mm"
  onTimeChange?: (time24h: string) => void;

  timezoneLabel?: string;

  className?: string;
}) {
  const {
    value,
    onValueChange,
    outputFormat = "iso",
    weekStartsOn = 1,
    min,
    max,
    showYearDropdown = true,
    size = "small",
    withTime = true,
    timeValue,
    onTimeChange,
    timezoneLabel,
    className,
  } = props;

  const minDate = React.useMemo(() => (min ? parseDateLike(min) : null), [min]);
  const maxDate = React.useMemo(() => (max ? parseDateLike(max) : null), [max]);

  const selectedDate = React.useMemo(() => {
    const d = parseDateLike(String(value ?? ""));
    return d ? clampToRange(d, minDate, maxDate) : null;
  }, [value, minDate, maxDate]);

  const [viewMonth, setViewMonth] = React.useState<Date>(() =>
    startOfMonth(selectedDate ?? clampDate(new Date()))
  );

  React.useEffect(() => {
    if (!selectedDate) return;
    setViewMonth(startOfMonth(selectedDate));
  }, [selectedDate?.getFullYear(), selectedDate?.getMonth(), selectedDate?.getDate()]);

  const commitDate = (d: Date) => {
    const clamped = clampToRange(d, minDate, maxDate);
    const out = outputFormat === "mdy" ? toMDY(clamped) : toISODate(clamped);
    onValueChange(out);
  };

  return (
    <div className={cn("w-full", className)}>
      <CalendarPopover
        size={size}
        selected={selectedDate}
        onSelect={(d) => commitDate(d)}
        viewMonth={viewMonth}
        setViewMonth={(d) => setViewMonth(startOfMonth(d))}
        weekStartsOn={weekStartsOn}
        minDate={minDate}
        maxDate={maxDate}
        showYearDropdown={showYearDropdown}
        withTime={withTime}
        timeValue={timeValue}
        onTimeChange={onTimeChange}
        timezoneLabel={timezoneLabel}
      // IMPORTANT: don't pass onRequestClose (so it won't close on date click)
      />
    </div>
  );
}


FloatingDateInput.displayName = "FloatingDateInput";
