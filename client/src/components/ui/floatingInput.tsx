import * as React from "react";
import { cn } from "@/lib/utils";
import { X } from "@phosphor-icons/react";
import { FieldInfoIcon } from "@/components/ui/field-info-icon";

type FieldState = "default" | "selected" | "error" | "disabled";
type FieldSize = "small" | "large";

export const FIELD_SHELL_SIZE: Record<FieldSize, string> = {
  small: "min-h-[4rem] md:min-h-[4.25rem] xl:min-h-[4.5rem] 2xl:min-h-[5rem]",
  large: "min-h-[4.5rem] md:min-h-[4.75rem] xl:min-h-[5rem] 2xl:min-h-[5.5rem]",
};

export type FloatingInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "size" | "placeholder" | "maxLength"
> & {
  state?: FieldState;
  size?: FieldSize;
  label: string;

  required?: boolean;
  optional?: boolean;

  hint?: boolean;
  hintText?: string;

  /** optional message area (you won't use it for required validations now) */
  errorText?: string;

  placeholderText?: string;
  showPlaceholder?: boolean;

  wordCount?: boolean;
  showTextInInput?: boolean;

  icon?: boolean;
  filled?: boolean;
  info?: React.ReactNode;
  /** ✅ NEW: left prefix like "$" */
  prefixText?: string;
  prefixClassName?: string;

  suffixText?: string;
  suffixClassName?: string;

  onValueChange?: (val: string) => void;
  maxLength?: number;
  enforceMaxLength?: boolean;
};

export const FloatingInput = React.forwardRef<HTMLInputElement, FloatingInputProps>(
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

      placeholderText = "",
      showPlaceholder = false,

      wordCount = false,
      showTextInInput = true,

      icon = true,
      filled = false,
      info,
      prefixText,
      prefixClassName,

      suffixText,
      suffixClassName,

      disabled,
      value,
      defaultValue,
      maxLength,
      enforceMaxLength = false,
      minLength,
      onChange,
      onValueChange,
      type = "text",
      id,
      step,
      min,
      max,
      ...props
    },
    forwardedRef
  ) => {
    const reactId = React.useId();
    const inputId = id ?? `fi-${reactId}`;

    const isControlled = value !== undefined;
    const [inner, setInner] = React.useState<string>(defaultValue?.toString?.() ?? "");
    const currentValue = String((isControlled ? value : inner) ?? "");
    const hasValue = currentValue.length > 0;

    const [isFocused, setIsFocused] = React.useState(false);

    const localRef = React.useRef<HTMLInputElement | null>(null);
    const setRef = (node: HTMLInputElement | null) => {
      localRef.current = node;
      if (typeof forwardedRef === "function") forwardedRef(node);
      else if (forwardedRef)
        (forwardedRef as React.MutableRefObject<HTMLInputElement | null>).current = node;
    };

    const derivedState: FieldState = disabled ? "disabled" : state ?? "default";
    const isDisabled = derivedState === "disabled";
    const isSelectedForced = derivedState === "selected";
    const propInvalid = derivedState === "error";

    /**
     * ✅ Sticky error behavior:
     * Latch ON when parent sets state="error".
     * Stay ON until the user clicks anywhere once (including input).
     */
    const [latchedError, setLatchedError] = React.useState(false);
    const prevPropInvalidRef = React.useRef(false);
    const CARET_VECTOR = "w-[0.61569rem] h-[0.28131rem]";
    const CARET_COLOR = "text-[color:var(--Neutrals-700,#7A7A7A)]";
    React.useEffect(() => {
      if (!prevPropInvalidRef.current && propInvalid) setLatchedError(true);
      prevPropInvalidRef.current = propInvalid;
    }, [propInvalid]);

    const isInvalid = propInvalid && latchedError;

    // ✅ AUTOFILL FIX (robust)
    const [autofilled, setAutofilled] = React.useState(false);

    const currentValueRef = React.useRef(currentValue);
    React.useEffect(() => {
      currentValueRef.current = currentValue;
    }, [currentValue]);

    const onValueChangeRef = React.useRef(onValueChange);
    React.useEffect(() => {
      onValueChangeRef.current = onValueChange;
    }, [onValueChange]);

    const clampToMax = React.useCallback(
      (val: string) => {
        if (typeof maxLength === "number" && maxLength >= 0) return val.slice(0, maxLength);
        return val;
      },
      [maxLength]
    );

    const syncFromDom = React.useCallback(() => {
      const el = localRef.current;
      if (!el) return;

      let domVal = String(el.value ?? "");
      const domHas = domVal.trim().length > 0;

      // ✅ If browser autofills beyond maxLength, normalize it
      if (typeof maxLength === "number" && maxLength >= 0 && domVal.length > maxLength) {
        domVal = clampToMax(domVal);

        const setter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          "value"
        )?.set;
        setter?.call(el, domVal);
        el.dispatchEvent(new Event("input", { bubbles: true }));
      }

      setAutofilled(domHas);

      // If DOM has a value but React doesn't, sync it (controlled + uncontrolled)
      if (domHas && domVal !== currentValueRef.current) {
        if (!isControlled) setInner(domVal);
        onValueChangeRef.current?.(domVal);
      }

      if (!domHas && currentValueRef.current.length === 0) {
        setAutofilled(false);
      }
    }, [isControlled, maxLength, clampToMax]);

    // Poll briefly after mount (covers delayed autofill)
    React.useEffect(() => {
      let ticks = 0;
      const id = window.setInterval(() => {
        ticks += 1;
        syncFromDom();
        if (ticks >= 25) window.clearInterval(id); // ~2.5s
      }, 100);

      return () => window.clearInterval(id);
    }, [syncFromDom]);

    // Also re-check when user focuses (covers choosing autofill suggestions)
    const scheduleSyncSoon = React.useCallback(() => {
      window.setTimeout(syncFromDom, 0);
      window.setTimeout(syncFromDom, 120);
      window.setTimeout(syncFromDom, 300);
    }, [syncFromDom]);

    // optional bottom message area
    const showErrorMsg = isInvalid && Boolean(String(errorText ?? "").trim());
    const showHintMsg = !isInvalid && hint;

    const isNumber = type === "number";

    const hasVisualValue = hasValue || autofilled;
    const canHover = !isDisabled;
    const canClear = icon && !isDisabled && hasVisualValue;

    const countText =
      wordCount && typeof maxLength === "number" ? `${currentValue.length}/${maxLength}` : null;

    // ✅ float if autofilled too
    const isFloatingNow = hasVisualValue || isSelectedForced || isFocused;

    const showPrefix = Boolean(prefixText) && isFloatingNow;
    const plWithPrefix =
      size === "large"
        ? "pl-[2rem] md:pl-[2.125rem] xl:pl-[2.125rem] 2xl:pl-[2.25rem]"
        : "pl-[1.875rem] md:pl-[2rem] xl:pl-[2rem] 2xl:pl-[2.125rem]";

    const CaretUpIcon = ({ className }: { className?: string }) => (
      <svg
        viewBox="0 0 8.251 4.501"
        className={className}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M0.75 3.75L4.125 0.75L7.501 3.75"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );

    const CaretDownIcon = ({ className }: { className?: string }) => (
      <svg
        viewBox="0 0 8.251 4.501"
        className={className}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M0.75 0.75L4.125 3.75L7.501 0.75"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (latchedError) setLatchedError(false);

      let nextVal = e.target.value ?? "";

      // ✅ MaxLength update
      if (typeof maxLength === "number" && maxLength >= 0) {
        if (enforceMaxLength && nextVal.length > maxLength) {
          // Block extra input (do nothing)
          // Keep autofilled state correct
          setAutofilled(currentValueRef.current.trim().length > 0);
          return;
        }
        if (!enforceMaxLength && nextVal.length > maxLength) {
          nextVal = clampToMax(nextVal);

          // make DOM match trimmed value
          const setter = Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype,
            "value"
          )?.set;
          setter?.call(e.target, nextVal);
        }
      }

      if (!isControlled) setInner(nextVal);
      onValueChange?.(nextVal);
      onChange?.(e);
      setAutofilled(nextVal.trim().length > 0);
    };

    const handleClear = () => {
      const el = localRef.current;
      if (!el) return;

      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
      setter?.call(el, "");
      el.dispatchEvent(new Event("input", { bubbles: true }));

      if (!isControlled) setInner("");
      onValueChange?.("");
      setAutofilled(false);

      el.focus();
    };

    // ---- layout helpers (px -> rem; 1rem = 16px)
    const LEFT_PAD =
      size === "large"
        ? "left-[0.75rem] md:left-[0.875rem] xl:left-[0.875rem] 2xl:left-[1rem]"
        : "left-[0.625rem] md:left-[0.75rem] xl:left-[0.75rem] 2xl:left-[0.875rem]";

    const RIGHT_PAD =
      size === "large"
        ? "right-[0.75rem] md:right-[0.875rem] xl:right-[0.875rem] 2xl:right-[1rem]"
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
      "text-[0.875rem] leading-[1.25rem] xl:text-[1rem] xl:leading-[1.5rem] font-semibold";

    const LABEL_DEFAULT = "text-[1rem] leading-[1.5rem] font-medium";
    const LABEL_FLOAT = "text-[0.875rem] leading-[1.25rem] font-normal";
    const LABEL_SECONDARY = "text-[color:var(--Light-Text-Secondary,#969696)]";

    // ✅ Border priority: error > selected/focus > default
    const shellBorder = isInvalid
      ? "border-[color:var(--Errors-500,#E35141)]"
      : isSelectedForced || isFocused
        ? "border-black"
        : "border-bd-primary";

    const shellBg = filled ? "bg-bg-inverse" : "bg-bg-primary";
    const patchBg = filled ? "bg-bg-inverse" : "bg-bg-primary";

    const SUFFIX_TOP =
      size === "large"
        ? "top-[2.625rem] md:top-[2.75rem] xl:top-[3rem] 2xl:top-[3.125rem]"
        : "top-[2.5rem] md:top-[2.625rem] xl:top-[2.875rem] 2xl:top-[3rem]";

    const STEPPER_Y = isFloatingNow
      ? cn(SUFFIX_TOP, "-translate-y-1/2") // aligns with input value line
      : "top-1/2 -translate-y-1/2"; // center when label is centered

    const STEPPER_BTN = size === "large" ? "h-[1.125rem] w-[1.125rem]" : "h-4 w-4";

    const STEPPER_ICON = "w-[0.51569rem] h-[0.28131rem]";
    const STEPPER_ICON_COLOR = "text-[color:var(--Neutrals-700,#7A7A7A)]";

    const prBase = isNumber
      ? size === "large"
        ? "pr-[4.5rem]"
        : "pr-[4.25rem]"
      : canClear || countText || suffixText
        ? "pr-[8.75rem] md:pr-[9.75rem] 2xl:pr-[10.75rem]"
        : "";

    const clearRight = suffixText
      ? size === "large"
        ? "right-[8.25rem] md:right-[8.875rem] xl:right-[9.25rem] 2xl:right-[10rem]"
        : "right-[8rem] md:right-[8.625rem] xl:right-[9rem] 2xl:right-[9.75rem]"
      : RIGHT_PAD;

    // ✅ Ring: black only when focused/selected AND not error
    const shellRing =
      !isDisabled && !isInvalid && (isSelectedForced || isFocused) ? "ring-1 ring-black" : "";

    // step logic
    const stepValue = () => {
      const n = Number(step);
      return Number.isFinite(n) && n > 0 ? n : 1;
    };

    const clamp = (n: number) => {
      const minN = min !== undefined ? Number(min) : undefined;
      const maxN = max !== undefined ? Number(max) : undefined;

      let out = n;
      if (Number.isFinite(minN as any)) out = Math.max(out, minN as number);
      if (Number.isFinite(maxN as any)) out = Math.min(out, maxN as number);
      return out;
    };

    const setNumber = (nextNum: number) => {
      const el = localRef.current;
      if (!el) return;

      const next = String(clamp(nextNum));

      if (!isControlled) setInner(next);
      onValueChange?.(next);

      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
      setter?.call(el, next);
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.focus();
    };

    const doStep = (dir: 1 | -1) => {
      const base = currentValue.trim() === "" ? 0 : Number(currentValue);
      const safeBase = Number.isFinite(base) ? base : 0;
      setNumber(safeBase + dir * stepValue());
    };

    return (
      <div className={cn("w-full my-2", className)}>
        <div
          className={cn(
            "group relative w-full rounded-m border",
            "transition-[background-color,box-shadow] duration-300 ease-out",
            shellBorder,
            shellBg,
            shellSize,
            isDisabled ? "cursor-not-allowed opacity-60" : "cursor-text",
            shellRing
          )}
        >
          {countText ? (
            <div
              className={cn(
                "absolute z-10",
                RIGHT_PAD,
                FLOAT_TOP,
                LABEL_FLOAT,
                "font-normal",
                LABEL_SECONDARY,
                "pointer-events-none select-none whitespace-nowrap"
              )}
            >
              {countText}
            </div>
          ) : null}

          {suffixText && !isNumber ? (
            <div
              className={cn(
                "absolute z-10",
                RIGHT_PAD,
                SUFFIX_TOP,
                "-translate-y-1/2",
                "pointer-events-none select-none whitespace-nowrap",
                "text-[0.875rem] leading-[1.25rem] xl:text-[1rem] xl:leading-[1.5rem] font-medium",
                "text-[color:var(--Light-Text-Secondary,#969696)]",
                suffixClassName
              )}
            >
              {suffixText}
            </div>
          ) : null}

          {showPrefix ? (
            <div
              className={cn(
                "absolute z-10",
                LEFT_PAD,
                SUFFIX_TOP,
                "-translate-y-1/2",
                "pointer-events-none select-none whitespace-nowrap",
                "text-[0.875rem] leading-[1.25rem] xl:text-[1rem] xl:leading-[1.5rem] font-medium",
                "text-[color:var(--Light-Text-Secondary,#969696)]",
                prefixClassName
              )}
            >
              {prefixText}
            </div>
          ) : null}

          {!isNumber && !suffixText && canClear ? (
            <button
              type="button"
              onClick={handleClear}
              className={cn(
                "absolute z-10",
                clearRight,
                SUFFIX_TOP,
                "-translate-y-1/2",
                "inline-flex items-center justify-center",
                "rounded-s",
                "text-neutral-600 transition-colors duration-300 ease-out",
                !isDisabled && "hover:text-neutral-700"
              )}
              aria-label="Clear input"
            >
              <X />
            </button>
          ) : null}

          {isNumber ? (
            <div
              className={cn(
                "absolute z-10",
                size === "large" ? "right-[0.75rem]" : "right-[0.625rem]",
                STEPPER_Y,
                "flex flex-col items-center gap-0.5"
              )}
            >
              <button
                type="button"
                disabled={isDisabled}
                aria-label="Increment"
                className={cn(
                  STEPPER_BTN,
                  "p-0 leading-none rounded-xs",
                  "flex items-center justify-center",
                  "bg-[color:var(--Light-Background-Pressed,#EDEDED)]",
                  "transition hover:brightness-95 active:brightness-90",
                  isDisabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
                )}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  doStep(1);
                }}
              >
                <CaretUpIcon className={cn(CARET_VECTOR, CARET_COLOR)} />
              </button>

              <button
                type="button"
                disabled={isDisabled}
                aria-label="Decrement"
                className={cn(
                  STEPPER_BTN,
                  "p-0 leading-none rounded-xs",
                  "flex items-center justify-center",
                  "bg-[color:var(--Light-Background-Pressed,#EDEDED)]",
                  "transition hover:brightness-95 active:brightness-90",
                  isDisabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
                )}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  doStep(-1);
                }}
              >
                <CaretDownIcon className={cn(CARET_VECTOR, CARET_COLOR)} />
              </button>
            </div>
          ) : null}

          <input
            id={inputId}
            ref={setRef}
            disabled={isDisabled}
            value={currentValue}
            minLength={minLength}
            maxLength={maxLength} // ✅ native attribute still applied
            type={type}
            step={step}
            min={min}
            max={max}
            onChange={handleChange}
            onFocus={(e) => {
              setIsFocused(true);
              if (latchedError) setLatchedError(false);
              scheduleSyncSoon();
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              scheduleSyncSoon();
              props.onBlur?.(e);
            }}
            onAnimationStart={(e) => {
              if (e.animationName === "cgAutofillStart") scheduleSyncSoon();
              props.onAnimationStart?.(e);
            }}
            aria-invalid={isInvalid || undefined}
            className={cn(
              "peer w-full bg-transparent outline-none",
              "transition-[color] duration-300 ease-out",
              INPUT_TEXT,
              inputPad,
              prefixText && plWithPrefix,
              prBase,
              isDisabled ? "text-tx-disabled" : "text-tx-primary",
              !showTextInInput && "text-transparent caret-transparent",
              showPlaceholder
                ? cn(
                  "placeholder:text-tx-tertiary placeholder:opacity-0",
                  "peer-focus:placeholder:opacity-100"
                )
                : "placeholder:opacity-0",
              isNumber &&
              "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            )}
            placeholder={showPlaceholder ? placeholderText : ""}
            {...props}
          />

          <label
            htmlFor={inputId}
            className={cn(
              "absolute z-10 select-none",
              LEFT_PAD,
              "pr-[11.25rem]",
              "max-w-full truncate",
              "transition-[top,transform,font-size,line-height,font-weight] duration-300 ease-out",
              isInvalid ? "text-[color:var(--Errors-500,#E35141)]" : LABEL_SECONDARY,
              isDisabled ? "cursor-not-allowed" : "cursor-text",
              "top-1/2 -translate-y-1/2",
              LABEL_DEFAULT,
              canHover &&
              cn(
                "group-hover:translate-y-0",
                "group-hover:top-[0.625rem] xl:group-hover:top-[0.75rem] 2xl:group-hover:top-[0.875rem]",
                "group-hover:text-[0.875rem] group-hover:leading-[1.25rem] group-hover:font-normal"
              ),
              canHover &&
              cn(
                "peer-focus:translate-y-0",
                "peer-focus:top-[0.625rem] xl:peer-focus:top-[0.75rem] 2xl:peer-focus:top-[0.875rem]",
                "peer-focus:text-[0.875rem] peer-focus:leading-[1.25rem] peer-focus:font-normal"
              ),
              isFloatingNow && cn(FLOAT_TOP, "translate-y-0", LABEL_FLOAT)
            )}
          >
            <span
              className={cn(
                "inline-flex items-center",
                isFloatingNow && cn("px-[0.375rem] -ml-[0.375rem] rounded-xs", patchBg)
              )}
            >
              <span className="inline-flex items-center gap-[0.125rem]">
                <span>{label}</span>

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
            </span>
          </label>
        </div>

        {(showErrorMsg || showHintMsg) && (
          <div className="mt-xs">
            <p
              className={cn(
                "text-[0.875rem] leading-[1.25rem] xl:text-[1rem] xl:leading-[1.5rem]",
                showErrorMsg ? "text-error-500" : "text-tx-tertiary"
              )}
            >
              {showErrorMsg ? errorText : hintText}
            </p>
          </div>
        )}
      </div>
    );
  }
);

FloatingInput.displayName = "FloatingInput";
