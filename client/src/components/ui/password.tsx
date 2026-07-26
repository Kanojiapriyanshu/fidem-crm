import * as React from "react";
import { cn } from "@/lib/utils";
import { Eye, EyeSlash, Check, X, CircleDashed } from "@phosphor-icons/react";

const RAISED_SHADOW =
  "shadow-[0_2px_4px_-2px_rgba(0,0,0,0.08),0_4px_8px_-2px_rgba(0,0,0,0.04)]";

type FieldState = "default" | "selected" | "error" | "disabled";
type FieldSize = "small" | "large";

// ✅ UPDATED: added lowercase rule
type RuleKey = "numbers" | "uppercase" | "lowercase" | "special";
type RuleStatus = "idle" | "pass" | "fail";

export type PasswordInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "size" | "placeholder" | "type"
> & {
  state?: FieldState;
  size?: FieldSize;
  label: string;

  required?: boolean;
  optional?: boolean;

  hint?: boolean;
  hintText?: string;

  /** ✅ message only; error styling comes from `state="error"` */
  errorText?: string;

  placeholderText?: string;
  showPlaceholder?: boolean;

  filled?: boolean;

  icon?: boolean;
  showRules?: boolean;

  // ✅ UPDATED: supports lowercase label override
  ruleText?: Partial<Record<RuleKey, string>>;
  onValueChange?: (val: string) => void;
  onValidityChange?: (valid: boolean, details: Record<RuleKey, boolean>) => void;
};

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
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

      filled = false,

      icon = true,
      showRules = true,

      ruleText,

      disabled,
      value,
      defaultValue,
      minLength,
      maxLength,
      onChange,
      onValueChange,
      onValidityChange,
      id,
      ...props
    },
    forwardedRef
  ) => {
    const reactId = React.useId();
    const inputId = id ?? `pi-${reactId}`;

    const isControlled = value !== undefined;
    const [inner, setInner] = React.useState<string>(defaultValue?.toString?.() ?? "");
    const currentValue = String((isControlled ? value : inner) ?? "");
    const hasValue = currentValue.length > 0;

    const [isFocused, setIsFocused] = React.useState(false);
    const [showPassword, setShowPassword] = React.useState(false);

    const localRef = React.useRef<HTMLInputElement | null>(null);
    const setRef = (node: HTMLInputElement | null) => {
      localRef.current = node;
      if (typeof forwardedRef === "function") forwardedRef(node);
      else if (forwardedRef)
        (forwardedRef as React.MutableRefObject<HTMLInputElement | null>).current = node;
    };

    // ✅ styling controlled ONLY by `state`
    const derivedState: FieldState = disabled ? "disabled" : state ?? "default";
    const isDisabled = derivedState === "disabled";
    const isInvalid = derivedState === "error";
    const isSelectedForced = derivedState === "selected";

    const canHover = !isDisabled;
    const isFloatingNow = hasValue || isSelectedForced || isFocused;

    // ✅ bottom message rules
    const showErrorMsg = isInvalid && Boolean(String(errorText ?? "").trim());
    const showHintMsg = !isInvalid && hint;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!isControlled) setInner(e.target.value);
      onValueChange?.(e.target.value);
      onChange?.(e);
    };

    const LEFT_PAD =
      size === "large"
        ? "left-[12px] md:left-[14px] xl:left-[14px] 2xl:left-[16px]"
        : "left-[10px] md:left-[12px] xl:left-[12px] 2xl:left-[14px]";

    // ✅ keep ONLY 10px from right for eye button (no responsive changes)
    const RIGHT_PAD = "right-[10px]";

    const FLOAT_TOP = "top-[10px] xl:top-[12px] 2xl:top-[14px]";

    const shellSize =
      size === "large"
        ? "min-h-[72px] md:min-h-[76px] xl:min-h-[80px] 2xl:min-h-[88px]"
        : "min-h-[64px] md:min-h-[68px] xl:min-h-[72px] 2xl:min-h-[80px]";

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

    const INPUT_TEXT =
      "text-[14px] leading-[20px] xl:text-[16px] xl:leading-[24px] font-semibold";

    const LABEL_DEFAULT = "text-[16px] leading-[24px] font-medium";
    const LABEL_FLOAT = "text-[14px] leading-[20px] font-normal";
    const LABEL_SECONDARY = "text-[color:var(--Light-Text-Secondary,#969696)]";

    // ✅ selection border black (priority: error > selected/focus > default)
    const shellBorder = isInvalid
      ? "border-error-500"
      : isSelectedForced || isFocused
        ? "border-black"
        : "border-bd-primary";

    const shellBg = filled ? "bg-bg-inverse" : "bg-bg-primary";
    const patchBg = filled ? "bg-bg-inverse" : "bg-bg-primary";

    // ✅ ring black when focused/selected (don’t show ring on error)
    const shellRing =
      !isDisabled && !isInvalid && (isSelectedForced || isFocused) ? "ring-1 ring-black" : "";

    // ✅ Align eye icon to input text line (not vertically centered in the whole field)
    const TOGGLE_TOP =
      size === "large"
        ? "top-[42px] md:top-[44px] xl:top-[48px] 2xl:top-[50px]"
        : "top-[40px] md:top-[42px] xl:top-[46px] 2xl:top-[48px]";

    // ✅ UPDATED: lowercase rule label
    const ruleLabels: Record<RuleKey, string> = {
      numbers: ruleText?.numbers ?? "Numbers",
      uppercase: ruleText?.uppercase ?? "Uppercase",
      lowercase: ruleText?.lowercase ?? "Lowercase",
      special: ruleText?.special ?? "Special character like @ or #",
    };

    // ✅ UPDATED: lowercase check
    const checks = React.useMemo<Record<RuleKey, boolean>>(() => {
      return {
        numbers: /\d/.test(currentValue),
        uppercase: /[A-Z]/.test(currentValue),
        lowercase: /[a-z]/.test(currentValue),
        special: /[^A-Za-z0-9]/.test(currentValue),
      };
    }, [currentValue]);

    React.useEffect(() => {
      // ✅ UPDATED: include lowercase in validity
      const valid = checks.numbers && checks.uppercase && checks.lowercase && checks.special;
      onValidityChange?.(valid, checks);
    }, [checks, onValidityChange]);

    const statusFor = (key: RuleKey): RuleStatus => {
      if (!hasValue) return "idle";
      return checks[key] ? "pass" : "fail";
    };

    const RULE_TEXT = cn(
      "text-[12px] font-normal leading-[16px]",
      "[font-family:Inter]",
      "text-[color:var(--Light-Icon-Subtle,#969696)]"
    );

    const RuleItem = ({ k }: { k: RuleKey }) => {
      const st = statusFor(k);

      const iconEl =
        st === "idle" ? (
          <CircleDashed className="size-4" weight="regular" />
        ) : st === "pass" ? (
          <Check className="size-4" weight="bold" />
        ) : (
          <X className="size-4" weight="bold" />
        );

      const color =
        st === "idle"
          ? "text-[color:var(--Light-Icon-Subtle,#969696)]"
          : st === "pass"
            ? "text-success-500"
            : "text-error-500";

      return (
        <div className={cn("inline-flex items-center gap-[11px]", RULE_TEXT, color)}>
          {iconEl}
          <span className={RULE_TEXT}>{ruleLabels[k]}</span>
        </div>
      );
    };

    const showToggle = icon && !isDisabled && hasValue;

    return (
      <div className={cn("w-full", className)}>
        <div
          className={cn(
            "group relative w-full rounded-m border",
            "transition-[background-color,box-shadow] duration-300 ease-out",
            RAISED_SHADOW,
            shellBorder,
            shellBg,
            shellSize,
            isDisabled ? "cursor-not-allowed opacity-60" : "cursor-text",
            shellRing
          )}
        >
          {showToggle ? (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                setShowPassword((s) => !s);
                localRef.current?.focus();
              }}
              className={cn(
                "absolute z-10",
                RIGHT_PAD,
                TOGGLE_TOP,
                "-translate-y-1/2",
                "inline-flex items-center justify-center",
                "flex items-center justify-end",
                "pr-0",
                "size-4xl rounded-s",
                "text-neutral-600 transition-colors duration-300 ease-out",
                "hover:text-neutral-700"
              )}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeSlash className="size-5" weight="regular" />
              ) : (
                <Eye className="size-5" weight="regular" />
              )}
            </button>
          ) : null}

          <input
            id={inputId}
            ref={setRef}
            disabled={isDisabled}
            value={currentValue}
            minLength={minLength}
            maxLength={maxLength}
            type={showPassword ? "text" : "password"}
            onChange={handleChange}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            aria-invalid={isInvalid || undefined}
            className={cn(
              "peer w-full bg-transparent outline-none",
              "transition-[color] duration-300 ease-out",
              INPUT_TEXT,
              inputPad,
              isDisabled ? "text-tx-disabled" : "text-tx-primary",
              showPlaceholder
                ? cn(
                    "placeholder:text-tx-tertiary placeholder:opacity-0",
                    "peer-focus:placeholder:opacity-100"
                  )
                : "placeholder:opacity-0",
              showToggle ? "pr-[56px] md:pr-[64px] 2xl:pr-[72px]" : ""
            )}
            placeholder={showPlaceholder ? placeholderText : ""}
            {...props}
          />

          <label
            htmlFor={inputId}
            className={cn(
              "absolute z-10 select-none",
              LEFT_PAD,
              "pr-[100px]",
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
              canHover &&
                cn(
                  "peer-focus:translate-y-0",
                  "peer-focus:top-[10px] xl:peer-focus:top-[12px] 2xl:peer-focus:top-[14px]",
                  "peer-focus:text-[14px] peer-focus:leading-[20px] peer-focus:font-normal"
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
              <span className="inline-flex items-center gap-[2px]">
                <span>{label}</span>
                {required ? (
                  <span className={cn("font-normal", isDisabled ? "text-neutral-400" : "text-[#E53935]")}>
                    *
                  </span>
                ) : null}
                {optional ? <span className="ml-xs text-tx-tertiary">(optional)</span> : null}
              </span>
            </span>
          </label>
        </div>

        {/* ✅ Rules row */}
        {showRules ? (
          <div className={cn("mt-m flex flex-wrap items-center gap-[11px]", isDisabled && "opacity-70")}>
            <RuleItem k="numbers" />
            <RuleItem k="uppercase" />
            <RuleItem k="lowercase" /> {/* ✅ NEW */}
            <RuleItem k="special" />
          </div>
        ) : null}

        {/* ✅ Message row */}
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
  }
);

PasswordInput.displayName = "PasswordInput";
