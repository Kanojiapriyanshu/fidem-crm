import * as React from "react";
import { cn } from "@/lib/utils";
import { FieldInfoIcon } from "@/components/ui/field-info-icon";

type FieldState = "default" | "selected" | "error" | "disabled";

export interface LabeledTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  containerClassName?: string;
  labelClassName?: string;

  /** ✅ Field state (error styling comes ONLY from this) */
  state?: FieldState;

  /** Optional label helpers (like your other fields) */
  required?: boolean;
  optional?: boolean;
info?: React.ReactNode;
  /** Helper row */
  hint?: boolean; // default false
  hintText?: string; // default "Hint text"
  errorText?: string; // message only; shown only when state="error"
  minlength?: number;
  maxlength?: number;

  /** Counts */
  showCharCount?: boolean; // default true
  showWordCount?: boolean; // default false

  /** ✅ Attachment */
  showAttachment?: boolean; // default false
  attachmentLabel?: string; // default "Attachment"
  attachment?: File | null; // controlled
  defaultAttachment?: File | null; // uncontrolled
  onAttachmentChange?: (file: File | null) => void;
  accept?: string; // file accept (e.g. "image/*,.pdf")
}

const DefaultAttachmentIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M21.44 11.05l-8.49 8.49a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.19 9.19a2 2 0 11-2.83-2.83l8.49-8.49"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const LabeledTextarea = React.forwardRef<HTMLTextAreaElement, LabeledTextareaProps>(
  (
    {
      label,
      id,
      className,
      containerClassName,
      labelClassName,

      state,
      required = false,
      optional = false,
info,
      hint = false,
      hintText = "Hint text",
      errorText,

      showCharCount = true,
      showWordCount = false,
      maxLength,
      minLength,
      value,
      defaultValue,
      onChange,

      showAttachment = false,
      attachmentLabel = "Attachment",
      attachment,
      defaultAttachment = null,
      onAttachmentChange,
      accept,

      disabled,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const textareaId = id ?? generatedId;

    // ✅ Spec: error styling only from `state`, not from `errorText`
    const derivedState: FieldState = disabled ? "disabled" : state ?? "default";
    const isDisabled = derivedState === "disabled";

    // textarea controlled/uncontrolled
    const isControlled = value !== undefined;
    const [inner, setInner] = React.useState<string>(String(defaultValue ?? ""));
    const currentText = String((isControlled ? value : inner) ?? "");

    const charCount = currentText.length;

    const isTooShort =
      typeof minLength === "number" ? charCount > 0 && charCount < minLength : false;

    // ✅ Make minLength failure also count as invalid for UI (red border)
    const isInvalid = derivedState === "error" || isTooShort;

    // ✅ Show errorText ONLY when state="error"
    const showErrorMsg =
      derivedState === "error" && Boolean(String(errorText ?? "").trim());

    const minLenText =
      typeof minLength === "number" ? `Minimum ${minLength} characters.` : "";

    // ✅ Show min message when too short (and not disabled)
    const showMinLenMsg = !showErrorMsg && isTooShort;

    // ✅ Hint only when not invalid
    const showHintMsg = !isInvalid && hint;

    const showAnyMsg = showErrorMsg || showMinLenMsg || showHintMsg;

    // attachment controlled/uncontrolled
    const isAttachmentControlled = attachment !== undefined;
    const [innerAttachment, setInnerAttachment] =
      React.useState<File | null>(defaultAttachment);
    const currentAttachment = isAttachmentControlled ? attachment : innerAttachment;

    const fileInputRef = React.useRef<HTMLInputElement | null>(null);

    const wordCount = React.useMemo(() => {
      const t = currentText.trim();
      if (!t) return 0;
      return t.split(/\s+/).filter(Boolean).length;
    }, [currentText]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (!isControlled) setInner(e.target.value);
      onChange?.(e);
    };

    const showCount = showCharCount || showWordCount;

    const countLabel = showWordCount
      ? `${wordCount} words`
      : typeof maxLength === "number"
        ? `${charCount}/${maxLength}`
        : typeof minLength === "number"
          ? `${charCount} (min ${minLength})`
          : `${charCount}`;

    const pickAttachment = () => {
      if (isDisabled) return;
      fileInputRef.current?.click();
    };

    const handleAttachmentPick = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] ?? null;

      if (!isAttachmentControlled) setInnerAttachment(file);
      onAttachmentChange?.(file);

      // allow re-picking the same file
      e.target.value = "";
    };

    const clearAttachment = (ev?: React.MouseEvent) => {
      ev?.stopPropagation();
      if (!isAttachmentControlled) setInnerAttachment(null);
      onAttachmentChange?.(null);
    };

    const shellBorder = isInvalid
      ? "border border-error-500"
      : "border border-[color:var(--Light-Border-Primary,#D6D6D6)]";

    return (
      <div className={cn("w-full", isDisabled && "opacity-60", containerClassName)}>
        <div
          className={cn(
            "rounded-[12px] overflow-hidden",
            "bg-[color:var(--Fill-Inverse-strong,#FFF)]",
            "shadow-none",
            "transition-colors",
            shellBorder,
            isInvalid
              ? "focus-within:border-2 focus-within:border-error-500 focus-within:ring-0"
              : "focus-within:border-2 focus-within:border-black focus-within:ring-0"
          )}
        >
          {/* ✅ Top row: label left, attachment right */}
          <div
            className={cn(
              "flex items-center justify-between gap-3 px-4 py-3 border-b",
              isInvalid
                ? "border-error-500"
                : "border-[color:var(--Light-Border-Primary,#D6D6D6)]"
            )}
          >
            <label
  htmlFor={textareaId}
  className={cn(
    "min-w-0 truncate",
    isInvalid ? "text-error-500" : "text-[color:var(--Light-Text-Secondary,#969696)]",
    "text-[16px] leading-[24px] font-normal",
    "font-[var(--Font-Family-Inter,Inter)]",
    labelClassName
  )}
>
  <span className="inline-flex items-center gap-[0.125rem] min-w-0">
    <span className="truncate">{label}</span>

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
      <span className="ml-1 inline-flex shrink-0">
        <FieldInfoIcon content={info} />
      </span>
    ) : null}
  </span>
</label>

            {showAttachment ? (
              <div className="flex items-center gap-2 shrink-0">
                {/* hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleAttachmentPick}
                  accept={accept}
                  disabled={isDisabled}
                />

                <button
                  type="button"
                  onClick={pickAttachment}
                  disabled={isDisabled}
                  className={cn(
                    "inline-flex items-center gap-2",
                    "text-[14px] text-neutral-900",
                    "cursor-pointer select-none",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                >
                  <DefaultAttachmentIcon className="text-neutral-900" />
                  <span className="underline">{attachmentLabel}</span>
                </button>

                {currentAttachment ? (
                  <>
                    <span className="text-[12px] text-neutral-600 truncate max-w-[220px]">
                      {currentAttachment.name}
                    </span>
                    <button
                      type="button"
                      onClick={clearAttachment}
                      disabled={isDisabled}
                      className="text-[12px] text-neutral-500 hover:text-neutral-900 disabled:cursor-not-allowed"
                      title="Remove attachment"
                    >
                      ×
                    </button>
                  </>
                ) : null}
              </div>
            ) : null}
          </div>

          {/* Textarea */}
          <textarea
            ref={ref}
            id={textareaId}
            data-slot="textarea"
            value={currentText}
            minLength={minLength}
            maxLength={maxLength}
            onChange={handleChange}
            disabled={isDisabled}
            aria-invalid={isInvalid || undefined}
            className={cn(
              "w-full bg-transparent px-4 py-3 outline-none resize-none",
              "min-h-[180px]",
              "text-[#1a1a1a]",
              "disabled:cursor-not-allowed disabled:opacity-50",

              // ✅ Placeholder spec: 404x84px, font-size 14px
              "placeholder:text-[14px] placeholder:text-[color:var(--Light-Text-Secondary,#969696)]",
              "[&::placeholder]:block [&::placeholder]:w-[404px] [&::placeholder]:h-[84px] [&::placeholder]:leading-[20px]",

              className
            )}
            {...props}
          />

          {/* Bottom row (count on right) */}
          {showCount ? (
            <div className="flex items-center justify-end px-4 pb-3">
              <span
                className="
                  text-[color:var(--Light-Text-Tertiary,#B8B8B8)]
                  font-[var(--Font-Family-Inter,Inter)]
                  text-[12px]
                  not-italic
                  font-[400]
                  leading-[16px]
                  tracking-[0px]
                "
              >
                {countLabel}
              </span>
            </div>
          ) : null}
        </div>

        {/* ✅ Message row (now minLength message is also red) */}
        {showAnyMsg && (
          <div className="mt-xs">
            <p
              className={cn(
                "text-[14px] leading-[20px] xl:text-[16px] xl:leading-[24px]",
                showErrorMsg || showMinLenMsg ? "text-error-500" : "text-tx-tertiary"
              )}
            >
              {showErrorMsg ? errorText : showMinLenMsg ? minLenText : hintText}
            </p>
          </div>
        )}
      </div>
    );
  }
);

LabeledTextarea.displayName = "LabeledTextarea";
export { LabeledTextarea };
