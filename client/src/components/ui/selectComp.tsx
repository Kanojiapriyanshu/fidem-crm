"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { X } from "@phosphor-icons/react";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  Search as SearchIcon,
} from "lucide-react";
import { FieldInfoIcon } from "@/components/ui/field-info-icon";

type FieldState = "default" | "selected" | "error" | "disabled";
type FieldSize = "small" | "large";

export const FIELD_SHELL_SIZE: Record<FieldSize, string> = {
  small: "min-h-[4rem] md:min-h-[4.25rem] xl:min-h-[4.5rem] 2xl:min-h-[5rem]",
  large:
    "min-h-[4.5rem] md:min-h-[4.75rem] xl:min-h-[5rem] 2xl:min-h-[5.5rem]",
};

/* -------------------------------------------------------------------------------------------------
 * helpers
 * ------------------------------------------------------------------------------------------------- */

function normalizeText(v: unknown) {
  return String(v ?? "").toLowerCase().trim();
}

function isItemEl(el: React.ReactElement<any>) {
  return el.type === SelectItem || el.type === SelectPrimitive.Item;
}

function filterSelectChildren(
  children: React.ReactNode,
  query: string,
  keepValue?: string
): React.ReactNode {
  const q = normalizeText(query);
  if (!q) return children;

  const arr = React.Children.toArray(children);
  const filtered = arr
    .map((node) => {
      if (!React.isValidElement(node)) return node;
      const el = node as React.ReactElement<any>;

      if (isItemEl(el)) {
        const value = String(el.props.value ?? "");
        if (keepValue && value === String(keepValue)) return el;

        const txt = normalizeText(el.props.textValue ?? el.props.children);
        return txt.includes(q) ? el : null;
      }

      if (el.props && "children" in el.props) {
        const nextKids = filterSelectChildren(
          el.props.children,
          query,
          keepValue
        );
        const nextArr = React.Children.toArray(nextKids).filter(Boolean);
        if (nextArr.length === 0) return null;
        return React.cloneElement(el, { children: nextKids });
      }

      return el;
    })
    .filter(Boolean);

  return filtered.length ? filtered : null;
}

const X_SCROLLBAR_BOTTOM =
  "[scrollbar-width:thin] [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-black/30 [&::-webkit-scrollbar-track]:bg-transparent";

const HOVER_BG = "hover:bg-[var(--Light-Background-NeutralPressed,#EDEDED)]";
const ACTIVE_BG = "active:bg-[var(--Light-Background-NeutralSelected,#DFDFDF)]";
const SELECTED_BG = "bg-[var(--Light-Background-NeutralSelected,#DFDFDF)]";

const FIELD_CONTROL_PADDING: Record<
  FieldSize,
  { rest: string; float: string; iconBottom: string }
> = {
  small: {
    rest: "pt-[18px] pb-[8px]",
    float: "pt-[26px] pb-[8px]",
    iconBottom: "bottom-[10px]",
  },
  large: {
    rest: "pt-[20px] pb-[10px]",
    float: "pt-[28px] pb-[10px]",
    iconBottom: "bottom-[12px]",
  },
};

function SearchField({
  value,
  onChange,
  placeholder,
  inputRef,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "sticky top-0 z-10 border-b border-bd-primary bg-bg-primary",
        className
      )}
    >
      <div className="flex items-center gap-2 px-3 py-2">
        <SearchIcon className="size-4 opacity-60" />
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => {
            const el = e.currentTarget;
            const next = el.value;
            const caret = el.selectionStart ?? next.length;

            onChange(next);

            requestAnimationFrame(() => {
              const target = inputRef?.current ?? el;
              if (!target) return;
              target.focus({ preventScroll: true });
              const pos = Math.min(caret, target.value.length);
              target.setSelectionRange(pos, pos);
            });
          }}
          placeholder={placeholder ?? "Search..."}
          onKeyDownCapture={(e) => {
            if (e.key !== "Escape") e.stopPropagation();
          }}
          onKeyDown={(e) => {
            if (e.key !== "Escape") e.stopPropagation();
          }}
          onPointerDownCapture={(e) => {
            e.stopPropagation();
          }}
          onClickCapture={(e) => {
            e.stopPropagation();
          }}
          className={cn(
            "w-full bg-transparent outline-none",
            "text-[14px] font-medium leading-[20px]",
            "text-tx-primary placeholder:text-tx-tertiary"
          )}
        />

        {value ? (
          <button
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onChange("");
              requestAnimationFrame(() =>
                inputRef?.current?.focus?.({ preventScroll: true })
              );
            }}
            className="inline-flex items-center justify-center rounded-s p-1 hover:bg-black/10"
            aria-label="Clear search"
          >
            <X size={14} className="opacity-70" />
          </button>
        ) : null}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------------------------------
 * small hooks
 * ------------------------------------------------------------------------------------------------- */

function useEventListener<T extends Window | Document>(
  target: T | null,
  type: string,
  handler: (ev: any) => void,
  options?: boolean | AddEventListenerOptions
) {
  const handlerRef = React.useRef(handler);
  handlerRef.current = handler;

  React.useEffect(() => {
    if (!target) return;
    const fn = (ev: any) => handlerRef.current(ev);
    target.addEventListener(type as any, fn, options);
    return () => target.removeEventListener(type as any, fn, options);
  }, [target, type, options]);
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

type DropdownDirection = "auto" | "up" | "down";

function decideDirection(opts: {
  direction: DropdownDirection;
  triggerRect: DOMRect;
  safeTop: number;
  safeBottom: number;
  minSpace: number;
}) {
  const { direction, triggerRect: r, safeTop, safeBottom, minSpace } = opts;

  if (direction === "up") return "up" as const;
  if (direction === "down") return "down" as const;

  const below = window.innerHeight - safeBottom - r.bottom;
  const above = r.top - safeTop;

  if (below < minSpace && above > below) return "up" as const;
  return "down" as const;
}

function measureEl(el: HTMLElement | null) {
  if (!el) return 0;
  const r = el.getBoundingClientRect();
  return Math.ceil(r.width || 0);
}

function isNodeInside(container: HTMLElement | null, target: EventTarget | null) {
  if (!container || !target) return false;
  return container.contains(target as Node);
}

function useLatestRef<T>(value: T) {
  const ref = React.useRef(value);
  ref.current = value;
  return ref;
}

/* -------------------------------------------------------------------------------------------------
 * 1) Radix Select building blocks
 * ------------------------------------------------------------------------------------------------- */

export function Select(props: React.ComponentProps<typeof SelectPrimitive.Root>) {
  return <SelectPrimitive.Root data-slot="select" {...props} />;
}

export function SelectGroup(
  props: React.ComponentProps<typeof SelectPrimitive.Group>
) {
  return <SelectPrimitive.Group data-slot="select-group" {...props} />;
}

export function SelectValue(
  props: React.ComponentProps<typeof SelectPrimitive.Value>
) {
  return <SelectPrimitive.Value data-slot="select-value" {...props} />;
}

export const SelectContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof SelectPrimitive.Content> & {
    position?: "popper" | "item-aligned";
    searchable?: boolean;
    searchValue?: string;
    onSearchValueChange?: (v: string) => void;
    searchPlaceholder?: string;
    searchInputRef?: React.RefObject<HTMLInputElement | null>;
    safeBottom?: number;
    safeTop?: number;
  }
>(function SelectContent(
  {
    className,
    children,
    position = "popper",
    align = "start",
    side = "bottom",
    sideOffset = 0,
    avoidCollisions = true,
    searchable,
    searchValue,
    onSearchValueChange,
    searchPlaceholder,
    searchInputRef,
    safeBottom = 140,
    ...props
  },
  ref
) {
  React.useEffect(() => {
    if (!searchable) return;

    const id = window.requestAnimationFrame(() => {
      searchInputRef?.current?.focus?.({ preventScroll: true });
    });

    return () => window.cancelAnimationFrame(id);
  }, [searchable, searchInputRef]);

  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        ref={ref as React.Ref<HTMLDivElement>}
        data-slot="select-content"
        position={position}
        align={align}
        side={side}
        sideOffset={sideOffset}
        avoidCollisions={avoidCollisions}
        collisionPadding={0}
        onKeyDownCapture={(e) => {
          if (e.key === "Escape") return;
          const t = e.target as HTMLElement | null;
          if (t?.tagName === "INPUT") e.stopPropagation();
        }}
        style={{
          maxHeight: `min(360px, calc(var(--radix-select-content-available-height) - ${safeBottom}px))`,
        }}
        className={cn(
          "bg-popover text-popover-foreground relative z-[99999]",
          "w-[var(--radix-select-trigger-width)] min-w-[var(--radix-select-trigger-width)]",
          "origin-[var(--radix-select-content-transform-origin)] overflow-x-hidden overflow-y-auto rounded-md border shadow-md",
          "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          "data-[side=bottom]:slide-in-from-top-2",
          "data-[side=top]:slide-in-from-bottom-2",
          className
        )}
        {...props}
      >
        <SelectScrollUpButton />

        {searchable ? (
          <SearchField
            value={searchValue ?? ""}
            onChange={onSearchValueChange ?? (() => {})}
            placeholder={searchPlaceholder ?? "Search..."}
            inputRef={searchInputRef}
          />
        ) : null}

        <SelectPrimitive.Viewport
          className={cn("space-y-[1px] p-1", position === "popper" && "w-full scroll-my-1")}
        >
          {children}
        </SelectPrimitive.Viewport>

        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
});

export function SelectItem({
  className,
  children,
  textValue,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item> & { textValue?: string }) {
  const derivedTextValue =
    textValue ??
    (typeof children === "string" || typeof children === "number"
      ? String(children)
      : undefined);

  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      textValue={derivedTextValue}
      className={cn(
        "relative flex w-full cursor-default items-center rounded-sm px-3 py-2 text-sm outline-none select-none",
        "text-tx-primary",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        "hover:bg-[var(--Light-Background-NeutralPressed,#EDEDED)] hover:text-tx-primary",
        "data-[highlighted]:bg-[var(--Light-Background-NeutralPressed,#EDEDED)] data-[highlighted]:text-tx-primary",
        "active:bg-[var(--Light-Background-NeutralSelected,#DFDFDF)] active:text-tx-primary",
        "data-[state=checked]:bg-[var(--Light-Background-NeutralSelected,#DFDFDF)] data-[state=checked]:text-tx-primary",
        className
      )}
      {...props}
    >
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
}

export function SelectLabel({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Label>) {
  return (
    <SelectPrimitive.Label
      data-slot="select-label"
      className={cn("text-muted-foreground px-2 py-1.5 text-xs", className)}
      {...props}
    />
  );
}

export function SelectSeparator({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Separator>) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn("bg-border pointer-events-none -mx-1 my-[1px] h-px", className)}
      {...props}
    />
  );
}

export function SelectScrollUpButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpButton>) {
  return (
    <SelectPrimitive.ScrollUpButton
      data-slot="select-scroll-up-button"
      className={cn("flex cursor-default items-center justify-center py-1", className)}
      {...props}
    >
      <ChevronUpIcon className="size-4" />
    </SelectPrimitive.ScrollUpButton>
  );
}

export function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownButton>) {
  return (
    <SelectPrimitive.ScrollDownButton
      data-slot="select-scroll-down-button"
      className={cn("flex cursor-default items-center justify-center py-1", className)}
      {...props}
    >
      <ChevronDownIcon className="size-4" />
    </SelectPrimitive.ScrollDownButton>
  );
}

/* -------------------------------------------------------------------------------------------------
 * 2) Floating shell
 * ------------------------------------------------------------------------------------------------- */

type FloatingShellProps = {
  className?: string;
  state?: FieldState;
  size?: FieldSize;
  label: string;
  required?: boolean;
  optional?: boolean;
  hint?: boolean;
  hintText?: string;
  info?: React.ReactNode;
  errorText?: string;
  filled?: boolean;
  disabled?: boolean;
  isFloatingNow: boolean;
  isActive: boolean;
  onShellPointerDown?: (e: React.PointerEvent<HTMLDivElement>) => void;
  children: (api: { fieldId: string }) => React.ReactNode;
};

function FloatingShell({
  className,
  state,
  size = "small",
  label,
  required = false,
  optional = false,
  info,
  hint = false,
  hintText = "Hint text",
  errorText,
  filled = false,
  disabled,
  isFloatingNow,
  isActive,
  onShellPointerDown,
  children,
}: FloatingShellProps) {
  const reactId = React.useId();
  const fieldId = `fs-${reactId}`;

  const derivedState: FieldState = disabled ? "disabled" : state ?? "default";
  const isDisabled = derivedState === "disabled";
  const isInvalid = derivedState === "error";
  const isSelectedForced = derivedState === "selected";

  const showErrorMsg = isInvalid && Boolean(String(errorText ?? "").trim());
  const showHintMsg = !isInvalid && hint;

  const LEFT_PAD = "left-[18px]";
  const FLOAT_TOP = "top-[8px]";
  const shellSize = FIELD_SHELL_SIZE[size];
  const shellRadius = "rounded-[12px]";

  const LABEL_DEFAULT = "text-[16px] leading-[24px] font-medium";
  const LABEL_FLOAT = "text-[14px] leading-[16px] font-normal";
  const LABEL_SECONDARY = "text-[color:var(--Light-Text-Secondary,#969696)]";

  const ERROR_BORDER = "border-[color:var(--Errors-500,#E35141)]";
  const ERROR_TEXT = "text-[color:var(--Errors-500,#E35141)]";

  const shellBorder = isInvalid
    ? ERROR_BORDER
    : isSelectedForced || isActive
      ? "border-black"
      : "border-bd-primary";
  const shellBg = filled ? "bg-bg-inverse" : "bg-bg-primary";
  const patchBg = filled ? "bg-bg-inverse" : "bg-bg-primary";
  const shellRing =
    !isDisabled && !isInvalid && (isSelectedForced || isActive)
      ? "ring-1 ring-black"
      : "";
  const shellHover = "";

  return (
    <div className={cn("my-2 w-full", className)}>
      <div
        className={cn(
          "group relative flex w-full items-stretch border",
          "transition-[background-color,box-shadow] duration-300 ease-out",
          shellRadius,
          shellBorder,
          shellBg,
          shellSize,
          isDisabled ? "cursor-not-allowed opacity-60" : "cursor-text",
          shellRing,
          shellHover
        )}
        onPointerDown={onShellPointerDown}
      >
        {children({ fieldId })}

        <label
          htmlFor={fieldId}
          className={cn(
            "pointer-events-none absolute z-10 max-w-full select-none truncate pr-[84px]",
            LEFT_PAD,
            isInvalid ? ERROR_TEXT : LABEL_SECONDARY,
            isDisabled ? "cursor-not-allowed" : "cursor-text",
            "top-1/2 -translate-y-1/2",
            LABEL_DEFAULT,
            "transition-[top,transform,font-size,line-height,font-weight] duration-300 ease-out",
            !isDisabled &&
              cn(
                "group-hover:top-[8px] group-hover:translate-y-0",
                "group-hover:text-[14px] group-hover:font-normal group-hover:leading-[16px]"
              ),
            !isDisabled &&
              cn(
                "peer-focus:top-[8px] peer-focus:translate-y-0",
                "peer-focus:text-[14px] peer-focus:font-normal peer-focus:leading-[16px]"
              ),
            isFloatingNow && cn(FLOAT_TOP, "translate-y-0", LABEL_FLOAT)
          )}
        >
          <span
            className={cn(
              "inline-flex items-center",
              isFloatingNow && cn("rounded-xs -ml-[6px] px-[6px]", patchBg)
            )}
          >
            <span className="inline-flex items-center gap-[2px]">
              <span>{label}</span>

              {required ? (
                <span
                  className={cn(
                    "font-normal",
                    isDisabled ? "text-neutral-400" : "text-[#E53935]"
                  )}
                >
                  *
                </span>
              ) : null}

              {optional ? (
                <span className="ml-xs text-tx-tertiary">(optional)</span>
              ) : null}

              {info ? (
                <span className="pointer-events-auto ml-1 inline-flex">
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

/* -------------------------------------------------------------------------------------------------
 * 3) Floating SINGLE Select
 * ------------------------------------------------------------------------------------------------- */

export type FloatingSelectProps = React.ComponentProps<
  typeof SelectPrimitive.Root
> & {
  state?: FieldState;
  size?: FieldSize;
  label: string;
  required?: boolean;
  optional?: boolean;
  hint?: boolean;
  hintText?: string;
  errorText?: string;
  icon?: boolean;
  filled?: boolean;
  info?: React.ReactNode;
  className?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchValueChange?: (v: string) => void;
  clientFilter?: boolean;
  onFieldFocus?: () => void;
  onFieldBlur?: () => void;
  dropdownDirection?: DropdownDirection;
  safeBottom?: number;
  safeTop?: number;
  minSpace?: number;
  disabled?: boolean;
};

export function FloatingSelect({
  className,
  state,
  size = "small",
  label,
  required = false,
  optional = false,
  hint = false,
  hintText = "Hint text",
  errorText,
  icon = true,
  filled = false,
  info,
  disabled = false,
  value,
  defaultValue,
  onValueChange,
  children,
  searchable = true,
  searchPlaceholder = "Search...",
  searchValue: searchValueProp,
  onSearchValueChange: onSearchValueChangeProp,
  clientFilter = true,
  onFieldFocus,
  onFieldBlur,
  dropdownDirection = "auto",
  safeBottom = 140,
  safeTop = 12,
  minSpace = 260,
  ...rootProps
}: FloatingSelectProps) {
  const isControlled = value !== undefined;
  const [inner, setInner] = React.useState<string>(String(defaultValue ?? ""));
  const currentValue = String((isControlled ? value : inner) ?? "");
  const hasValue = currentValue.length > 0;

  const derivedState: FieldState = disabled ? "disabled" : state ?? "default";
  const isDisabled = derivedState === "disabled";
  const isInvalid = derivedState === "error";
  const isSelectedForced = derivedState === "selected";
  const canClear = icon && !isDisabled && hasValue;

  const [open, setOpen] = React.useState(false);
  const [isFocused, setIsFocused] = React.useState(false);

  const isSearchControlled = searchValueProp !== undefined;
  const [innerSearch, setInnerSearch] = React.useState("");
  const search = isSearchControlled ? searchValueProp ?? "" : innerSearch;

  const setSearch = React.useCallback(
    (v: string) => {
      if (!isSearchControlled) setInnerSearch(v);
      onSearchValueChangeProp?.(v);
    },
    [isSearchControlled, onSearchValueChangeProp]
  );

  const searchRef = React.useRef<HTMLInputElement | null>(null);

  type TriggerEl = React.ElementRef<typeof SelectPrimitive.Trigger>;
  const triggerRef = React.useRef<TriggerEl | null>(null);
  const contentRef = React.useRef<HTMLDivElement | null>(null);

  const clearBtnRef = React.useRef<HTMLButtonElement | null>(null);
  const chevronWrapRef = React.useRef<HTMLSpanElement | null>(null);

  const isFloatingNow = hasValue || isSelectedForced || isFocused || open;

  const FIELD_TRIGGER_PAD_Y: Record<FieldSize, { rest: string; float: string }> = {
    small: {
      rest: "py-[22px] md:py-[24px] xl:py-[26px] 2xl:py-[30px]",
      float:
        "pt-[28px] pb-[16px] md:pt-[30px] md:pb-[18px] xl:pt-[32px] xl:pb-[20px] 2xl:pt-[36px] 2xl:pb-[24px]",
    },
    large: {
      rest: "py-[26px] md:py-[28px] xl:py-[30px] 2xl:py-[34px]",
      float:
        "pt-[32px] pb-[20px] md:pt-[34px] md:pb-[22px] xl:pt-[36px] xl:pb-[24px] 2xl:pt-[40px] 2xl:pb-[28px]",
    },
  };

  const PAD_Y = isFloatingNow
    ? FIELD_TRIGGER_PAD_Y[size].float
    : FIELD_TRIGGER_PAD_Y[size].rest;
  const PL = "pl-[18px]";
  const ICON_Y = FIELD_CONTROL_PADDING[size].iconBottom;
  const CHEVRON_RIGHT = "right-[.62rem]";
  const CLEAR_RIGHT = "right-[44px]";
  const PR_WITH_CLEAR = "pr-[78px]";
  const PR_NO_CLEAR = "pr-[48px]";
  const INPUT_TEXT = "text-[14px] leading-[20px] font-semibold";

  const [contentSide, setContentSide] = React.useState<"top" | "bottom">(
    "bottom"
  );

  const computeSide = React.useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;

    const r = el.getBoundingClientRect();
    const dir = decideDirection({
      direction: dropdownDirection,
      triggerRect: r,
      safeTop,
      safeBottom,
      minSpace,
    });
    setContentSide(dir === "up" ? "top" : "bottom");
  }, [dropdownDirection, safeTop, safeBottom, minSpace]);

  const [rightPadPx, setRightPadPx] = React.useState<number | null>(null);

  const computeRightPad = React.useCallback(() => {
    const chevronW = measureEl(chevronWrapRef.current);
    const clearW = canClear ? measureEl(clearBtnRef.current) : 0;

    const gutter = 10;
    const gapBetweenIcons = canClear ? 10 : 0;

    const minPad = canClear ? 78 : 48;
    const pad = Math.max(
      minPad,
      gutter + chevronW + (canClear ? clearW + gapBetweenIcons : 0) + 8
    );

    setRightPadPx(pad);
  }, [canClear]);

  React.useEffect(() => {
    computeRightPad();
  }, [computeRightPad, open, hasValue]);

  const win = typeof window !== "undefined" ? window : null;
  useEventListener(win, "resize", () => computeRightPad());

  React.useEffect(() => {
    if (!open || !searchable) return;

    const id = window.requestAnimationFrame(() => {
      const el = searchRef.current;
      if (!el) return;

      if (document.activeElement !== el) {
        el.focus({ preventScroll: true });
        const len = el.value.length;
        el.setSelectionRange(len, len);
      }
    });

    return () => window.cancelAnimationFrame(id);
  }, [open, searchable]);

  React.useEffect(() => {
    if (!open) return;
    computeSide();
  }, [open, computeSide]);

  useEventListener(
    win,
    "scroll",
    (e: Event) => {
      if (!open) return;
      const target = e.target as any;
      if (isNodeInside(contentRef.current, target)) return;
      setOpen(false);
      setSearch("");
      onFieldBlur?.();
      setIsFocused(false);
    },
    true
  );

  const contentChildren = React.useMemo(() => {
    if (!searchable) return children;
    if (!clientFilter) return children;

    const out = filterSelectChildren(children, search, currentValue);
    if (!out) {
      return (
        <SelectItem value="__no_results__" disabled textValue="No results">
          No results
        </SelectItem>
      );
    }
    return out;
  }, [children, search, searchable, clientFilter, currentValue]);

  return (
    <Select
      value={currentValue}
      onValueChange={(v) => {
        if (!isControlled) setInner(v);
        onValueChange?.(v);
      }}
      open={open}
      onOpenChange={(next) => {
        setOpen(next);

        if (next) {
          setIsFocused(true);
          onFieldFocus?.();
          requestAnimationFrame(() => {
            computeSide();
            computeRightPad();
          });
          return;
        }

        setSearch("");
        onFieldBlur?.();
        setIsFocused(false);
      }}
      disabled={isDisabled}
      {...rootProps}
    >
      <FloatingShell
        className={className}
        state={derivedState}
        size={size}
        label={label}
        required={required}
        optional={optional}
        hint={hint}
        hintText={hintText}
        errorText={errorText}
        filled={filled}
        disabled={isDisabled}
        isFloatingNow={isFloatingNow}
        isActive={isFocused || open}
        onShellPointerDown={(e) => {
          if (isDisabled) return;

          const t = e.target as Node;
          const trigger = triggerRef.current;
          if (trigger && trigger.contains(t)) return;

          e.preventDefault();
          setIsFocused(true);
          setOpen(true);

          requestAnimationFrame(() => {
            computeSide();
            computeRightPad();
            trigger?.focus?.();
          });
        }}
      >
        {({ fieldId }) => (
          <>
            {canClear ? (
              <button
                ref={clearBtnRef}
                type="button"
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (!isControlled) setInner("");
                  onValueChange?.("");
                  requestAnimationFrame(() => {
                    computeRightPad();
                    triggerRef.current?.focus?.();
                  });
                }}
                className={cn(
                  "absolute z-10",
                  CLEAR_RIGHT,
                  ICON_Y,
                  "inline-flex size-4xl items-end justify-center rounded-s pb-[2px]",
                  "text-neutral-600 transition-colors duration-300 ease-out",
                  "hover:text-neutral-700"
                )}
                aria-label="Clear selection"
              >
                <X size={16} />
              </button>
            ) : null}

            <span
              ref={chevronWrapRef}
              className={cn(
                "pointer-events-none absolute z-10 text-neutral-600",
                CHEVRON_RIGHT,
                ICON_Y
              )}
            >
              <ChevronDownIcon
                className={cn(
                  "size-4 opacity-60 transition-transform",
                  open && "rotate-180"
                )}
              />
            </span>

            <SelectPrimitive.Trigger
              ref={triggerRef}
              id={fieldId}
              aria-invalid={isInvalid || undefined}
              className={cn(
                "peer flex min-w-0 flex-1 items-end border-0 bg-transparent text-left outline-none",
                INPUT_TEXT,
                PL,
                PAD_Y,
                canClear ? PR_WITH_CLEAR : PR_NO_CLEAR,
                isDisabled ? "text-tx-disabled" : "text-tx-primary",
                "[&>span]:block [&>span]:truncate [&>span]:whitespace-nowrap"
              )}
              style={
                rightPadPx != null
                  ? ({ paddingRight: `${rightPadPx}px` } as React.CSSProperties)
                  : undefined
              }
              onFocus={() => setIsFocused(true)}
              onBlur={() => {
                window.setTimeout(() => {
                  if (!open) setIsFocused(false);
                }, 0);
              }}
              onPointerDown={() => {
                requestAnimationFrame(() => {
                  computeSide();
                  computeRightPad();
                });
              }}
            >
              <SelectPrimitive.Value placeholder="" />
            </SelectPrimitive.Trigger>

            <SelectContent
              ref={contentRef}
              side={contentSide}
              searchable={searchable}
              searchValue={search}
              onSearchValueChange={setSearch}
              searchPlaceholder={searchPlaceholder}
              searchInputRef={searchRef}
            >
              {contentChildren}
            </SelectContent>
          </>
        )}
      </FloatingShell>
    </Select>
  );
}

/* -------------------------------------------------------------------------------------------------
 * 4) Floating MULTI Select
 * ------------------------------------------------------------------------------------------------- */

const FIELD_MULTI_ICON_BOTTOM: Record<FieldSize, string> = {
  small: "bottom-[12px]",
  large: "bottom-[14px]",
};

export type MultiOption = {
  label: string;
  value: string;
  disabled?: boolean;
};

export type FloatingMultiSelectProps = {
  className?: string;
  state?: FieldState;
  size?: FieldSize;
  label: string;
  required?: boolean;
  optional?: boolean;
  hint?: boolean;
  hintText?: string;
  errorText?: string;
  icon?: boolean;
  filled?: boolean;
  disabled?: boolean;
  options: MultiOption[];
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (val: string[]) => void;
  includeAll?: boolean;
  allLabel?: string;
  dropdownZIndex?: number;
  info?: React.ReactNode;
  searchable?: boolean;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchValueChange?: (v: string) => void;
  clientFilter?: boolean;
  dropdownDirection?: DropdownDirection;
  safeBottom?: number;
  safeTop?: number;
  minSpace?: number;
  maxDropdownHeight?: number;
};

export function FloatingMultiSelect({
  className,
  state,
  size = "small",
  label,
  required = false,
  optional = false,
  hint = false,
  hintText = "Hint text",
  errorText,
  info,
  icon = true,
  filled = false,
  disabled,
  options,
  value,
  defaultValue,
  onValueChange,
  includeAll = true,
  allLabel = "All",
  dropdownZIndex = 99999,
  searchable = true,
  searchPlaceholder = "Search...",
  searchValue: searchValueProp,
  onSearchValueChange: onSearchValueChangeProp,
  clientFilter = true,
  dropdownDirection = "auto",
  safeBottom = 140,
  safeTop = 12,
  minSpace = 260,
  maxDropdownHeight = 360,
}: FloatingMultiSelectProps) {
  const isControlled = value !== undefined;

  const [inner, setInner] = React.useState<string[]>(
    (defaultValue ?? []).map(String)
  );
  const selected = (isControlled ? value ?? [] : inner).map(String);
  const selectedRef = useLatestRef(selected);

  const derivedState: FieldState = disabled ? "disabled" : state ?? "default";
  const isDisabled = derivedState === "disabled";
  const isInvalid = derivedState === "error";
  const isSelectedForced = derivedState === "selected";

  const hasValue = selected.length > 0;
  const canClear = icon && !isDisabled && hasValue;

  const [open, setOpen] = React.useState(false);
  const [isFocused, setIsFocused] = React.useState(false);

  const wrapRef = React.useRef<HTMLDivElement | null>(null);
  const btnRef = React.useRef<HTMLButtonElement | null>(null);
  const dropdownRef = React.useRef<HTMLDivElement | null>(null);

  const clearBtnRef = React.useRef<HTMLButtonElement | null>(null);
  const chevronWrapRef = React.useRef<HTMLSpanElement | null>(null);
  const [rightPadPx, setRightPadPx] = React.useState<number | null>(null);

  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const isSearchControlled = searchValueProp !== undefined;
  const [innerSearch, setInnerSearch] = React.useState("");
  const search = isSearchControlled ? searchValueProp ?? "" : innerSearch;

  const setSearch = React.useCallback(
    (v: string) => {
      if (!isSearchControlled) setInnerSearch(v);
      onSearchValueChangeProp?.(v);
    },
    [isSearchControlled, onSearchValueChangeProp]
  );

  const searchRef = React.useRef<HTMLInputElement | null>(null);
  const blurSearch = React.useCallback(() => {
    searchRef.current?.blur?.();
  }, []);

  React.useEffect(() => {
    if (!open || !searchable) return;
    const el = searchRef.current;
    if (!el) return;

    if (document.activeElement !== el) {
      requestAnimationFrame(() => {
        el.focus({ preventScroll: true });
        const len = el.value.length;
        el.setSelectionRange(len, len);
      });
    }
  }, [search, open, searchable]);

  const isFloatingNow = hasValue || isSelectedForced || isFocused || open;

  const labelCacheRef = React.useRef<Map<string, string>>(new Map());
  React.useEffect(() => {
    const m = labelCacheRef.current;
    for (const o of options) m.set(String(o.value), o.label);
  }, [options]);

  const getLabel = React.useCallback(
    (v: string) => labelCacheRef.current.get(String(v)) ?? String(v),
    []
  );

  const disabledCacheRef = React.useRef<Map<string, boolean>>(new Map());
  React.useEffect(() => {
    const m = disabledCacheRef.current;
    for (const o of options) m.set(String(o.value), !!o.disabled);
  }, [options]);

  const isDisabledValue = React.useCallback(
    (v: string) => disabledCacheRef.current.get(String(v)) === true,
    []
  );

  const filteredOptions = React.useMemo(() => {
    if (!clientFilter) return options;
    const q = normalizeText(search);
    if (!q) return options;
    return options.filter((o) => normalizeText(o.label).includes(q));
  }, [options, search, clientFilter]);

  const filteredEnabledValues = React.useMemo(
    () => filteredOptions.filter((o) => !o.disabled).map((o) => String(o.value)),
    [filteredOptions]
  );

  const allCheckedFiltered =
    filteredEnabledValues.length > 0 &&
    filteredEnabledValues.every((v) => selectedRef.current.includes(v));

  const commitSelected = React.useCallback(
    (next: string[]) => {
      const deduped = Array.from(new Set(next.map(String)));
      const clean = deduped.filter((v) => !isDisabledValue(v));
      if (!isControlled) setInner(clean);
      onValueChange?.(clean);
    },
    [isControlled, onValueChange, isDisabledValue]
  );

  const toggleValue = React.useCallback(
    (v: string) => {
      const valueStr = String(v);
      if (isDisabledValue(valueStr)) return;

      const cur = selectedRef.current;
      const next = cur.includes(valueStr)
        ? cur.filter((x) => x !== valueStr)
        : [...cur, valueStr];
      commitSelected(next);
    },
    [commitSelected, isDisabledValue, selectedRef]
  );

  const computeRightPad = React.useCallback(() => {
    const chevronW = measureEl(chevronWrapRef.current);
    const clearW = canClear ? measureEl(clearBtnRef.current) : 0;

    const gutter = 10;
    const gapBetweenIcons = canClear ? 10 : 0;

    const minPad = canClear ? 78 : 48;
    const pad = Math.max(
      minPad,
      gutter + chevronW + (canClear ? clearW + gapBetweenIcons : 0) + 8
    );
    setRightPadPx(pad);
  }, [canClear]);

  React.useEffect(() => {
    computeRightPad();
  }, [computeRightPad, open, hasValue]);

  const wind = typeof window !== "undefined" ? window : null;
  const doc = typeof document !== "undefined" ? document : null;

  useEventListener(wind, "resize", () => computeRightPad());

  const OFFSET = 4;
  const [dropDir, setDropDir] = React.useState<"up" | "down">("down");
  const [pos, setPos] = React.useState<{
    top?: number;
    bottom?: number;
    left: number;
    width: number;
    maxH: number;
  }>({
    top: 0,
    left: 0,
    width: 0,
    maxH: maxDropdownHeight,
  });

  const rafRef = React.useRef<number | null>(null);

  const updatePosition = React.useCallback(() => {
    const r = btnRef.current?.getBoundingClientRect();
    if (!r) return;

    const dir = decideDirection({
      direction: dropdownDirection,
      triggerRect: r,
      safeTop,
      safeBottom,
      minSpace,
    });

    setDropDir(dir);

    const left = r.left;
    const width = r.width;

    const below = window.innerHeight - safeBottom - r.bottom;
    const above = r.top - safeTop;

    const available = dir === "down" ? below : above;
    const maxH = clamp(available - 8, 160, maxDropdownHeight);

    let top: number | undefined;
    let bottom: number | undefined;

    if (dir === "down") {
      top = r.bottom + OFFSET;
    } else {
      bottom = window.innerHeight - r.top + OFFSET;
    }

    setPos({ top, bottom, left, width, maxH });
  }, [dropdownDirection, safeTop, safeBottom, minSpace, maxDropdownHeight]);

  const scheduleUpdate = React.useCallback(() => {
    if (rafRef.current) return;
    rafRef.current = window.requestAnimationFrame(() => {
      rafRef.current = null;
      updatePosition();
    });
  }, [updatePosition]);

  React.useEffect(() => {
    if (!open) return;
    updatePosition();
    return () => {
      if (rafRef.current) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [open, updatePosition]);

  useEventListener(
    wind,
    "scroll",
    (e: Event) => {
      if (!open) return;
      const target = e.target as any;
      if (isNodeInside(dropdownRef.current, target)) return;
      setOpen(false);
      setSearch("");
      setIsFocused(false);
    },
    true
  );

  useEventListener(wind, "resize", () => {
    if (open) scheduleUpdate();
  });

  useEventListener(doc, "pointerdown", (e: PointerEvent) => {
    if (!open) return;
    const t = e.target as Node;
    const inWrap = wrapRef.current?.contains(t) ?? false;
    const inDrop = dropdownRef.current?.contains(t) ?? false;
    if (!inWrap && !inDrop) {
      setOpen(false);
      setSearch("");
      setIsFocused(false);
    }
  });

  useEventListener(doc, "keydown", (e: KeyboardEvent) => {
    if (!open) return;
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      setSearch("");
      setIsFocused(false);
      requestAnimationFrame(() => btnRef.current?.focus?.());
    }
  });

  const PAD_Y = isFloatingNow
    ? FIELD_CONTROL_PADDING[size].float
    : FIELD_CONTROL_PADDING[size].rest;
  const PL = "pl-[18px]";
  const ICON_Y = FIELD_MULTI_ICON_BOTTOM[size];
  const CHEVRON_RIGHT = "right-[.62rem]";
  const CLEAR_RIGHT = "right-[44px]";
  const PR_WITH_CLEAR = "pr-[78px]";
  const PR_NO_CLEAR = "pr-[48px]";
  const INPUT_TEXT = "text-[14px] leading-[20px] font-semibold";

  const activateAll = React.useCallback(() => {
    if (allCheckedFiltered) {
      commitSelected(
        selectedRef.current.filter((v) => !filteredEnabledValues.includes(v))
      );
    } else {
      for (const o of filteredOptions) {
        labelCacheRef.current.set(String(o.value), o.label);
      }
      commitSelected([...selectedRef.current, ...filteredEnabledValues]);
    }
    blurSearch();
  }, [
    allCheckedFiltered,
    commitSelected,
    filteredEnabledValues,
    filteredOptions,
    blurSearch,
    selectedRef,
  ]);

  const activateOption = React.useCallback(
    (o: MultiOption) => {
      const v = String(o.value);
      labelCacheRef.current.set(v, o.label);
      toggleValue(v);
      blurSearch();
    },
    [toggleValue, blurSearch]
  );

  const chipsRef = React.useRef<HTMLSpanElement | null>(null);
  const [chipsHasScrollbar, setChipsHasScrollbar] = React.useState(false);

  const checkChipsScrollbar = React.useCallback(() => {
    const el = chipsRef.current;
    if (!el) return;
    const has = el.scrollWidth > el.clientWidth + 1;
    setChipsHasScrollbar(has);
  }, []);

  React.useLayoutEffect(() => {
    checkChipsScrollbar();
  }, [checkChipsScrollbar, selected.length, rightPadPx, size]);

  React.useEffect(() => {
    const el = chipsRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;

    const ro = new ResizeObserver(() => checkChipsScrollbar());
    ro.observe(el);
    return () => ro.disconnect();
  }, [checkChipsScrollbar]);

  const onOptionPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const onOptionKeyDown = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      action();
    }
  };

  return (
    <div ref={wrapRef} className="relative w-full">
      <FloatingShell
        className={className}
        state={derivedState}
        size={size}
        label={label}
        required={required}
        optional={optional}
        hint={hint}
        hintText={hintText}
        errorText={errorText}
        filled={filled}
        disabled={isDisabled}
        isFloatingNow={isFloatingNow}
        isActive={isFocused || open}
        onShellPointerDown={(e) => {
          if (isDisabled) return;

          const t = e.target as Node;
          const btn = btnRef.current;
          if (btn && btn.contains(t)) return;

          e.preventDefault();
          setIsFocused(true);
          setOpen(true);

          requestAnimationFrame(() => {
            computeRightPad();
            updatePosition();
            btn?.focus?.();
          });
        }}
      >
        {({ fieldId }) => (
          <>
            {canClear ? (
              <button
                ref={clearBtnRef}
                type="button"
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  commitSelected([]);
                  requestAnimationFrame(() => {
                    computeRightPad();
                    btnRef.current?.focus?.();
                  });
                }}
                className={cn(
                  "absolute z-10",
                  CLEAR_RIGHT,
                  ICON_Y,
                  "inline-flex size-4xl items-end justify-center rounded-s pb-[2px]",
                  "text-neutral-600 transition-colors duration-300 ease-out",
                  "hover:text-neutral-700"
                )}
                aria-label="Clear selection"
              >
                <X />
              </button>
            ) : null}

            <span
              ref={chevronWrapRef}
              className={cn(
                "pointer-events-none absolute z-10 text-neutral-600",
                CHEVRON_RIGHT,
                ICON_Y
              )}
            >
              <ChevronDownIcon
                className={cn(
                  "size-4 opacity-60 transition-transform",
                  open && "rotate-180"
                )}
              />
            </span>

            <button
              ref={btnRef}
              id={fieldId}
              type="button"
              disabled={isDisabled}
              aria-invalid={isInvalid || undefined}
              onClick={() => {
                setOpen((v) => {
                  const next = !v;
                  setIsFocused(next);
                  if (!next) setSearch("");
                  if (next) {
                    requestAnimationFrame(() => {
                      computeRightPad();
                      updatePosition();
                    });
                  }
                  return next;
                });
              }}
              onFocus={() => setIsFocused(true)}
              onBlur={() => {
                window.setTimeout(() => {
                  if (!open) setIsFocused(false);
                }, 0);
              }}
              className={cn(
                "peer relative flex min-w-0 flex-1 items-end border-0 bg-transparent text-left outline-none",
                INPUT_TEXT,
                PL,
                PAD_Y,
                canClear ? PR_WITH_CLEAR : PR_NO_CLEAR,
                isDisabled ? "text-tx-disabled" : "text-tx-primary"
              )}
              style={
                rightPadPx != null
                  ? ({ paddingRight: `${rightPadPx}px` } as React.CSSProperties)
                  : undefined
              }
              aria-haspopup="listbox"
              aria-expanded={open}
            >
              {selectedRef.current.length > 0 ? (
                <span
                  ref={chipsRef}
                  className={cn(
                    "absolute bottom-[6px] left-[18px]",
                    size === "small" ? "min-h-[28px]" : "min-h-[30px]",
                    "flex min-w-0 max-w-full flex-nowrap items-center gap-[10px]",
                    "overflow-x-auto overflow-y-hidden whitespace-nowrap",
                    X_SCROLLBAR_BOTTOM,
                    "pb-[6px]"
                  )}
                  style={{
                    right: `${rightPadPx ?? (canClear ? 78 : 48)}px`,
                  }}
                >
                  {selectedRef.current.map((v) => (
                    <span
                      key={v}
                      className="inline-flex h-6 max-w-full shrink-0 items-center gap-1 rounded-full bg-[#1A1A1A] px-2"
                    >
                      <span className="truncate text-[14px] font-semibold leading-[20px] text-[color:var(--Light-Text-PrimaryInverse,#F9F9F9)]">
                        {getLabel(v)}
                      </span>

                      <span
                        className="inline-flex items-center justify-center rounded-full p-0.5 hover:bg-white/10"
                        onPointerDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          commitSelected(
                            selectedRef.current.filter((x) => x !== v)
                          );
                        }}
                        aria-label={`Remove ${getLabel(v)}`}
                      >
                        <X
                          size={14}
                          className="text-[color:var(--Light-Text-PrimaryInverse,#F9F9F9)]"
                        />
                      </span>
                    </span>
                  ))}
                </span>
              ) : null}
            </button>

            {open && mounted
              ? createPortal(
                  <div
                    ref={dropdownRef}
                    role="listbox"
                    aria-multiselectable="true"
                    onPointerDown={(e) => {
                      const el = e.target as HTMLElement | null;
                      if (el?.tagName !== "INPUT") blurSearch();
                    }}
                    style={{
                      position: "fixed",
                      top: pos.top !== undefined ? pos.top : "auto",
                      bottom: pos.bottom !== undefined ? pos.bottom : "auto",
                      left: pos.left,
                      width: pos.width,
                      zIndex: dropdownZIndex,
                      maxHeight: pos.maxH,
                      display: "flex",
                      flexDirection: "column",
                    }}
                    className={cn(
                      "overflow-hidden rounded-m border border-bd-primary bg-bg-primary",
                      "shadow-[0_12px_28px_-8px_rgba(0,0,0,0.22)]"
                    )}
                  >
                    {searchable ? (
                      <SearchField
                        value={search}
                        onChange={setSearch}
                        placeholder={searchPlaceholder}
                        inputRef={searchRef}
                      />
                    ) : null}

                    <div
                      className="space-y-[1px] overflow-auto p-1"
                      style={{ maxHeight: pos.maxH }}
                    >
                      {includeAll ? (
                        <button
                          type="button"
                          className={cn(
                            "w-full rounded-sm px-3 py-2 text-left text-sm outline-none select-none",
                            "text-tx-primary",
                            HOVER_BG,
                            ACTIVE_BG,
                            allCheckedFiltered ? SELECTED_BG : ""
                          )}
                          onPointerDown={(e) => {
                            onOptionPointerDown(e);
                            activateAll();
                          }}
                          onKeyDown={(e) => onOptionKeyDown(e, activateAll)}
                        >
                          {allLabel}
                        </button>
                      ) : null}

                      {includeAll ? (
                        <div className="bg-border -mx-1 my-[1px] h-px" />
                      ) : null}

                      {filteredOptions.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-tx-tertiary">
                          No results
                        </div>
                      ) : (
                        filteredOptions.map((o) => {
                          const v = String(o.value);
                          const checked = selectedRef.current.includes(v);
                          const disabledBtn = isDisabled || o.disabled;

                          return (
                            <button
                              key={v}
                              type="button"
                              disabled={disabledBtn}
                              aria-selected={checked}
                              className={cn(
                                "w-full rounded-sm px-3 py-2 text-left text-sm outline-none select-none",
                                "text-tx-primary",
                                "disabled:pointer-events-none disabled:opacity-50",
                                HOVER_BG,
                                ACTIVE_BG,
                                checked ? SELECTED_BG : ""
                              )}
                              onPointerDown={(e) => {
                                onOptionPointerDown(e);
                                if (!disabledBtn) activateOption(o);
                              }}
                              onKeyDown={(e) =>
                                onOptionKeyDown(
                                  e,
                                  () => !disabledBtn && activateOption(o)
                                )
                              }
                            >
                              {o.label}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>,
                  document.body
                )
              : null}
          </>
        )}
      </FloatingShell>
    </div>
  );
}