import * as React from "react";
import { cn } from "@/lib/utils";
import { X, CaretDown, CaretUp, Plus } from "@phosphor-icons/react";
import { FieldInfoIcon } from "@/components/ui/field-info-icon";

type FieldState = "default" | "selected" | "error" | "disabled";
type FieldSize = "small" | "large";

export const FIELD_SHELL_SIZE: Record<FieldSize, string> = {
  small: "min-h-[4rem] md:min-h-[4.25rem] xl:min-h-[4.5rem] 2xl:min-h-[5rem]",
  large: "min-h-[4.5rem] md:min-h-[4.75rem] xl:min-h-[5rem] 2xl:min-h-[5.5rem]",
};

// ✅ supports string options OR {label,value} options
export type TagOption = string | { label: string; value?: string | null };

export type FloatingTagInputProps = {
  label: string;

  state?: FieldState;
  size?: FieldSize;

  required?: boolean;
  optional?: boolean;

  hint?: boolean;
  hintText?: string;
  info?: React.ReactNode;
  /** ✅ message only; error styling comes from `state="error"` */
  errorText?: string;

  /** controlled/uncontrolled tags (stored values) */
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (next: string[]) => void;
  dropdownDirection?: "auto" | "up" | "down"; // ✅ NEW

  /** typing */
  placeholderText?: string;

  /** suggestions dropdown */
  options?: TagOption[];
  showDropdown?: boolean;
  maxTags?: number;

  /** behavior */
  allowDuplicates?: boolean; // default false

  /**
   * normalize user-typed labels (ex: "fashion" -> "#fashion")
   * NOTE: we call this only on strings safely.
   */
  normalize?: (raw: string) => string | null;

  disabled?: boolean;
  className?: string;
};

const defaultNormalizeHashtag = (raw: string) => {
  const t = String(raw ?? "").trim();
  if (!t) return null;

  const cleaned = t.replace(/,+$/g, "").trim();
  if (!cleaned) return null;

  const withHash = cleaned.startsWith("#") ? cleaned : `#${cleaned}`;
  const finalTag = withHash.replace(/\s+/g, "");
  return finalTag.length > 1 ? finalTag : null;
};

type ParsedOpt = {
  labelRaw: string;
  labelNorm: string; // normalized label for display/dedup/search
  value: string; // stored value
  valueKey: string;
  labelKey: string;
};

type MenuItem =
  | { kind: "add"; labelNorm: string; labelKey: string }
  | { kind: "option"; opt: ParsedOpt };

export const FloatingTagInput: React.FC<FloatingTagInputProps> = ({
  label,
  state,
  size = "small",
  required = false,
  optional = false,
  hint = false,
  hintText = "Hint text",
  errorText,
  dropdownDirection = "auto",
  value,
  defaultValue = [],
  onValueChange,
  info,
  placeholderText = "",
  options = [],
  showDropdown,
  maxTags,
  allowDuplicates = false,
  normalize = defaultNormalizeHashtag,

  disabled,
  className,
}) => {
  const reactId = React.useId();
  const inputId = `fti-${reactId}`;

  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const dropdownRef = React.useRef<HTMLDivElement | null>(null);
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  const isControlled = value !== undefined;
  const [inner, setInner] = React.useState<string[]>(defaultValue);
  const tags = (isControlled ? value : inner) ?? [];

  const [draft, setDraft] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [isFocused, setIsFocused] = React.useState(false);

  const [placement, setPlacement] = React.useState<"down" | "up">("down");

  // ✅ CHANGE: error styling is controlled ONLY by `state`
  const derivedState: FieldState = disabled ? "disabled" : state ?? "default";

  const isDisabled = derivedState === "disabled";
  const isInvalid = derivedState === "error";
  const isSelectedForced = derivedState === "selected";

  // ✅ bottom message rules
  const showErrorMsg = isInvalid && Boolean(String(errorText ?? "").trim());
  const showHintMsg = !isInvalid && hint;

  const canHover = !isDisabled;

  // ✅ safe normalize wrapper (never crashes)
  const safeNormalize = React.useCallback(
    (raw: unknown) => {
      try {
        return normalize(typeof raw === "string" ? raw : String(raw ?? ""));
      } catch {
        return null;
      }
    },
    [normalize]
  );

  const labelKeyOf = React.useCallback(
    (labelStr: string) =>
      (safeNormalize(labelStr) ?? String(labelStr ?? "").trim()).toLowerCase(),
    [safeNormalize]
  );

  const setTags = (next: string[]) => {
    if (!isControlled) setInner(next);
    onValueChange?.(next);
  };

  // remove EXACT item (so allowDuplicates behaves)
  const removeTagAt = (idx: number) => {
    setTags(tags.filter((_, i) => i !== idx));
  };

  const clearAll = () => {
    setTags([]);
    setDraft("");
    setOpen(false);
    inputRef.current?.focus();
  };

  // ---- Parse options into consistent shape
  const parsedOptions = React.useMemo<ParsedOpt[]>(() => {
    const out: ParsedOpt[] = [];

    for (const o of options ?? []) {
      const labelRaw = typeof o === "string" ? o : String(o?.label ?? "").trim();
      if (!labelRaw) continue;

      const labelNorm = safeNormalize(labelRaw) ?? labelRaw;
      const value =
        typeof o === "string"
          ? labelNorm
          : String(o?.value ?? "").trim() || labelNorm;

      const labelKey = labelKeyOf(labelNorm);
      const valueKey = String(value).toLowerCase();

      out.push({ labelRaw, labelNorm, value, labelKey, valueKey });
    }

    // de-dupe by labelKey (so same hashtag doesn't repeat)
    const seen = new Set<string>();
    return out.filter((x) => {
      if (!x.labelKey) return false;
      if (seen.has(x.labelKey)) return false;
      seen.add(x.labelKey);
      return true;
    });
  }, [options, safeNormalize, labelKeyOf]);

  // map stored value -> label for display (helps when value is an id)
  const valueToLabel = React.useMemo(() => {
    const m = new Map<string, string>();
    for (const o of parsedOptions) {
      if (o.value) m.set(o.value, o.labelNorm);
    }
    return m;
  }, [parsedOptions]);

  const resolveLabelForStoredValue = React.useCallback(
    (stored: string) => valueToLabel.get(stored) ?? stored,
    [valueToLabel]
  );

  // selected label keys (dedup based on actual tag text, not IDs)
  const selectedLabelKeys = React.useMemo(() => {
    const s = new Set<string>();
    for (const t of tags) {
      const lbl = resolveLabelForStoredValue(t);
      const key = labelKeyOf(lbl);
      if (key) s.add(key);
    }
    return s;
  }, [tags, resolveLabelForStoredValue, labelKeyOf]);

  // ✅ dropdown can appear when options exist OR user is typing
  const shouldShowDropdown =
    showDropdown ??
    ((Array.isArray(options) && options.length > 0) || draft.trim().length > 0);

  const isFloatingNow =
    tags.length > 0 || draft.length > 0 || isSelectedForced || isFocused;

  const addStoredValue = (valueToStore: string, labelForDedup: string) => {
    if (!valueToStore) return;
    if (typeof maxTags === "number" && tags.length >= maxTags) return;

    if (!allowDuplicates) {
      const key = labelKeyOf(labelForDedup);
      if (key && selectedLabelKeys.has(key)) return;
    }

    setTags([...tags, valueToStore]);
  };

  const commitDraft = () => {
    const raw = draft.trim();
    if (!raw) return;

    const norm = safeNormalize(raw);
    if (!norm) return;

    addStoredValue(norm, norm);
    setDraft("");
  };

  // Build menu items (Add + filtered options)
  const menuItems = React.useMemo<MenuItem[]>(() => {
    const q = draft.trim().toLowerCase();

    const filteredOpts = (parsedOptions ?? [])
      .filter((o) => (q ? o.labelNorm.toLowerCase().includes(q) : true))
      .filter((o) => {
        if (allowDuplicates) return true;
        return !selectedLabelKeys.has(o.labelKey);
      });

    const normDraft = safeNormalize(draft);
    const draftKey = normDraft ? labelKeyOf(normDraft) : "";

    const optionHasExactDraft =
      !!draftKey && (parsedOptions ?? []).some((o) => o.labelKey === draftKey);

    const canAdd =
      !!normDraft &&
      !isDisabled &&
      !(typeof maxTags === "number" && tags.length >= maxTags) &&
      (allowDuplicates ? true : !selectedLabelKeys.has(draftKey)) &&
      !optionHasExactDraft;

    const addItem: MenuItem[] = canAdd
      ? [{ kind: "add", labelNorm: normDraft!, labelKey: draftKey }]
      : [];

    const optItems: MenuItem[] = filteredOpts.map((opt) => ({
      kind: "option",
      opt,
    }));

    return [...addItem, ...optItems];
  }, [
    draft,
    parsedOptions,
    safeNormalize,
    labelKeyOf,
    allowDuplicates,
    selectedLabelKeys,
    isDisabled,
    maxTags,
    tags.length,
  ]);

  // ---- layout helpers (match your FloatingInput)
  const LEFT_PAD =
    size === "large"
      ? "left-[12px] md:left-[14px] xl:left-[14px] 2xl:left-[16px]"
      : "left-[10px] md:left-[12px] xl:left-[12px] 2xl:left-[14px]";

  const RIGHT_PAD =
    size === "large"
      ? "right-[12px] md:right-[14px] xl:right-[14px] 2xl:right-[16px]"
      : "right-[10px] md:right-[12px] xl:right-[12px] 2xl:right-[14px]";

  const FLOAT_TOP = "top-[10px] xl:top-[12px] 2xl:top-[14px]";

  const shellSize = FIELD_SHELL_SIZE[size];

  const inputPad =
    size === "large"
      ? cn(
        "px-[12px] md:px-[14px] 2xl:px-[16px]",
        "pt-[32px] md:pt-[34px] xl:pt-[36px] 2xl:pt-[38px]",
        "pb-[14px] md:pb-[16px] 2xl:pb-[18px]"
      )
      : cn(
        "px-[10px] md:px-[12px] 2xl:px-[14px]",
        "pt-[30px] md:pt-[32px] xl:pt-[34px] 2xl:pt-[36px]",
        "pb-[12px] md:pb-[14px] 2xl:pb-[16px]"
      );

  const LABEL_DEFAULT = "text-[16px] leading-[24px] font-medium";
  const LABEL_FLOAT = "text-[14px] leading-[20px] font-normal";
  const LABEL_SECONDARY = "text-[color:var(--Light-Text-Secondary,#969696)]";

  const shellBorder = isInvalid ? "border-error-500" : "border-bd-primary";
  const shellBg = "bg-bg-primary";
  const patchBg = "bg-bg-primary";

  const SUFFIX_TOP =
    size === "large"
      ? "top-[42px] md:top-[44px] xl:top-[48px] 2xl:top-[50px]"
      : "top-[40px] md:top-[42px] xl:top-[46px] 2xl:top-[48px]";

  const recomputePlacement = React.useCallback(() => {
    // ✅ Forced directions
    if (dropdownDirection === "up") {
      setPlacement("up");
      return;
    }
    if (dropdownDirection === "down") {
      setPlacement("down");
      return;
    }

    // ✅ Auto logic (your existing logic)
    if (!rootRef.current) return;

    const rect = rootRef.current.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;

    const spaceBelow = vh - rect.bottom;
    const spaceAbove = rect.top;

    const dropH = dropdownRef.current?.getBoundingClientRect().height ?? 240;
    const margin = 12;

    const next = spaceBelow < dropH + margin && spaceAbove > spaceBelow ? "up" : "down";
    setPlacement(next);
  }, [dropdownDirection]);


  React.useLayoutEffect(() => {
    if (!open) return;
    recomputePlacement();

    const onResize = () => recomputePlacement();
    const onScroll = () => recomputePlacement();

    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onScroll, true);

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open, recomputePlacement, menuItems.length, dropdownDirection]);

  return (
    <div className={cn("w-full my-2", className)}>
      <div
        ref={rootRef}
        className={cn(
          "group relative w-full rounded-m border",
          "transition-[background-color,box-shadow] duration-300 ease-out",
          shellBorder,
          shellBg,
          shellSize,
          isDisabled ? "cursor-not-allowed opacity-60" : "cursor-text",
          !isDisabled &&
          !isInvalid &&
          (isSelectedForced || isFocused) &&
          "ring-1 ring-[color:var(--bd-primary)]"
        )}
        aria-invalid={isInvalid || undefined}
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) {
            e.preventDefault();
            inputRef.current?.focus();
          }
        }}
      >
        {/* Icons inside the text-input area (X | caret) */}
        <div
          className={cn(
            "absolute z-10 flex items-center gap-2",
            RIGHT_PAD,
            SUFFIX_TOP,
            "-translate-y-1/2",
            "select-none"
          )}
        >
          {tags.length > 0 ? (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!isDisabled) clearAll();
              }}
              disabled={isDisabled}
              className={cn(
                "text-neutral-700 hover:text-neutral-900 transition",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
              aria-label="Clear hashtags"
              title="Clear"
            >
              <X size={16} />
            </button>
          ) : null}

          {shouldShowDropdown ? (
            <>
              <span className="h-4 w-px bg-neutral-200" />
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (!isDisabled) {
                    setOpen((v) => {
                      const next = !v;
                      if (next) requestAnimationFrame(() => recomputePlacement());
                      return next;
                    });
                  }
                  inputRef.current?.focus();
                }}
                disabled={isDisabled}
                className={cn(
                  "text-neutral-700 hover:text-neutral-900 transition",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
                aria-label="Toggle hashtag suggestions"
                title="Suggestions"
              >
                {open ? <CaretUp size={16} /> : <CaretDown size={16} />}
              </button>
            </>
          ) : null}
        </div>

        {/* Chips + typing input area */}
        <div className={cn("w-full", inputPad, "pr-[92px]")}>
          <div className="flex w-full flex-nowrap items-center gap-2 min-w-0 overflow-hidden">
            {/* ✅ Chips stay ONE line, scroll horizontally */}
            {tags.length > 0 ? (
              <div className="flex shrink min-w-0 max-w-[80%] items-center gap-2 overflow-x-auto whitespace-nowrap cg-scrollbar">
                {tags.map((stored, idx) => {
                  const display = resolveLabelForStoredValue(stored);
                  const displayNorm = safeNormalize(display) ?? display;

                  return (
                    <button
                      key={`${stored}-${idx}`}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (!isDisabled) removeTagAt(idx);
                      }}
                      className={cn(
                        "shrink-0 max-w-[160px] md:max-w-[220px] truncate", // ✅ prevents long tags stretching layout
                        "rounded-pill bg-neutral-900 text-white",
                        "px-3 py-1 text-[12px] leading-[16px]",
                        "hover:opacity-90 transition",
                        isDisabled ? "cursor-not-allowed" : "cursor-pointer"
                      )}
                      title={displayNorm}
                    >
                      {displayNorm}
                    </button>
                  );
                })}
              </div>
            ) : null}

            {/* ✅ Input stays visible and does NOT get pushed to a new line */}
            <input
              id={inputId}
              ref={inputRef}
              disabled={isDisabled}
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                if (shouldShowDropdown) {
                  setOpen(true);
                  requestAnimationFrame(() => recomputePlacement());
                }
              }}
              onFocus={() => setIsFocused(true)}
              onBlur={() => {
                setIsFocused(false);
                window.setTimeout(() => {
                  setOpen(false);
                  setDraft("");
                }, 120);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault();
                  commitDraft();
                  return;
                }
                if (e.key === "Backspace" && draft.length === 0 && tags.length > 0) {
                  e.preventDefault();
                  setTags(tags.slice(0, -1));
                  return;
                }
              }}
              placeholder={tags.length === 0 ? placeholderText : ""}
              className={cn(
                "flex-1 min-w-[90px] bg-transparent outline-none",
                "text-[14px] leading-[20px] xl:text-[16px] xl:leading-[24px] font-semibold",
                "text-tx-primary",
                "placeholder:text-tx-tertiary placeholder:font-medium"
              )}
            />
          </div>
        </div>

        {/* Label (floating) */}
        <label
          htmlFor={inputId}
          className={cn(
            "absolute z-10 select-none",
            LEFT_PAD,
            "pr-[180px]",
            "max-w-full truncate",
            "transition-[top,transform,font-size,line-height,font-weight] duration-300 ease-out",
            isInvalid ? "text-error-500" : LABEL_SECONDARY,
            isDisabled ? "cursor-not-allowed" : "cursor-text",
            "top-1/2 -translate-y-1/2",
            LABEL_DEFAULT,
            canHover &&
            cn(
              "group-hover:translate-y-0",
              "group-hover:top-[10px] xl:group-hover:top-[12px] 2xl:group-hover:top-[14px]",
              "group-hover:text-[14px] group-hover:leading-[20px] group-hover:font-normal"
            ),
            isFloatingNow && cn(FLOAT_TOP, "translate-y-0", LABEL_FLOAT)
          )}
        >
          <span
            className={cn(
              "inline-flex items-center",
              isFloatingNow && cn("px-[6px] -ml-[6px] rounded-xs", patchBg)
            )}
          >
            <span className="inline-flex items-center gap-[0.125rem]">
              <span>{label}</span>

              {required ? <span className="ml-sm text-neutral-750">*</span> : null}
              {optional ? <span className="ml-xs text-tx-tertiary">(optional)</span> : null}

              {info ? (
                <span className="ml-1 inline-flex pointer-events-auto">
                  <FieldInfoIcon content={info} />
                </span>
              ) : null}
            </span>
          </span>
        </label>

        {/* Dropdown list */}
        {shouldShowDropdown && open && menuItems.length > 0 ? (
          <div
            ref={dropdownRef}
            className={cn(
              "absolute z-20 left-0 right-0",
              "rounded-m border border-neutral-200 bg-white shadow-lg overflow-hidden"
            )}
            style={placement === "up" ? { bottom: "calc(100% + 8px)" } : { top: "calc(100% + 8px)" }}
            onMouseDown={(e) => e.preventDefault()}
          >
            <div className="max-h-[220px] overflow-auto cg-scrollbar">
              {menuItems.slice(0, 12).map((item, idx) => {
                if (item.kind === "add") {
                  return (
                    <button
                      key={`add-${item.labelKey}-${idx}`}
                      type="button"
                      className={cn(
                        "w-full text-left px-3 py-2 text-[14px] hover:bg-neutral-50",
                        "flex items-center gap-2"
                      )}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        addStoredValue(item.labelNorm, item.labelNorm);
                        setDraft("");
                        inputRef.current?.focus();
                      }}
                    >
                      <Plus size={16} />
                      <span className="text-neutral-700">Add</span>
                      <span className="rounded-pill bg-neutral-900 text-white px-2 py-[2px] text-[12px] leading-[16px]">
                        {item.labelNorm}
                      </span>
                    </button>
                  );
                }

                const opt = item.opt;
                return (
                  <button
                    key={`opt-${opt.labelKey}-${idx}`}
                    type="button"
                    className={cn(
                      "w-full text-left px-3 py-2 text-[14px] hover:bg-neutral-50",
                      "flex items-center"
                    )}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      addStoredValue(opt.value, opt.labelNorm);
                      setDraft("");
                      inputRef.current?.focus();
                    }}
                  >
                    <span className="rounded-pill bg-neutral-900/10 text-neutral-900 px-2 py-[2px] text-[12px] leading-[16px]">
                      {opt.labelNorm}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>

      {/* ✅ Message row (same behavior as Select/PasswordInput) */}
      {(showErrorMsg || showHintMsg) && (
        <div className="mt-xs">
          <p
            className={cn(
              "text-[14px] leading-[20px] xl:text-[16px] xl:leading-[24px]",
              showErrorMsg ? "text-error-500" : "text-tx-tertiary"
            )}
          >
            {showErrorMsg ? errorText : hintText}
          </p>
        </div>
      )}
    </div>
  );
};
