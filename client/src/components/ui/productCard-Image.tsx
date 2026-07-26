import React from "react";
import { CloudArrowUp, X } from "@phosphor-icons/react";

const MAX_BYTES = 5 * 1024 * 1024;
const MAX_FILES = 5;
const ACCEPT = ".svg,.png,.jpg,.jpeg";

function pickValidFiles(list: FileList | File[]) {
  const files = Array.from(list);
  return files.filter((f) => f.size <= MAX_BYTES);
}

const fileKey = (f: File) => `${f.name}__${f.size}__${f.lastModified}`;
export function ProductCardUpload({
  showLabel = true,
  files,
  existingImages = [],
  existingImageKeys = [],
  onFilesChange,
  onRemoveExistingImage,
  title = "Click to upload Images",
  helperPrefix = "or drag and drop",
  helperTypes = "SVG, PNG, JPG under (max 5mb)",
  required = false,
  error = false,
  errorText,
}: {
  showLabel?: boolean;
  files: File[];
  existingImages?: string[];
  existingImageKeys?: string[];
  onFilesChange: (files: File[]) => void;
  onRemoveExistingImage?: (url: string) => void;
  title?: string;
  helperPrefix?: string;
  helperTypes?: string;
  required?: boolean;
  error?: boolean;
  errorText?: string;
}) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [dragOver, setDragOver] = React.useState(false);
  const [notice, setNotice] = React.useState<string | null>(null);
  const noticeTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const totalCount = (files?.length ?? 0) + (existingImages?.length ?? 0);

  const showNotice = React.useCallback((msg: string) => {
    if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
    setNotice(msg);
    noticeTimerRef.current = setTimeout(() => setNotice(null), 2500);
  }, []);

  React.useEffect(() => {
    return () => {
      if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
    };
  }, []);

  const [flashKeys, setFlashKeys] = React.useState<Set<string>>(new Set());
  const flashTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const flashItems = React.useCallback((keys: string[]) => {
    if (!keys.length) return;
    setFlashKeys(new Set(keys));
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    flashTimerRef.current = setTimeout(() => setFlashKeys(new Set()), 700);
  }, []);

  React.useEffect(() => {
    return () => {
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    };
  }, []);

  const mergedError = error;
  const mergedErrorText = errorText;

  const openPicker = () => {
    if (totalCount >= MAX_FILES) {
      showNotice(`Limit reached. Only ${MAX_FILES} images can be accepted.`);
      return;
    }
    inputRef.current?.click();
  };

  const handleAddFiles = (incoming: FileList | File[]) => {
    const valid = pickValidFiles(incoming);
    const existingLocalFiles = files ?? [];

    const localKeys = new Set(existingLocalFiles.map(fileKey));
    const remoteKeys = new Set(existingImageKeys.filter(Boolean));
    const seenIncoming = new Set<string>();

    const duplicateKeysToFlash: string[] = [];
    const uniqueToAdd: File[] = [];

    for (const f of valid) {
      const k = fileKey(f);

      if (localKeys.has(k)) {
        duplicateKeysToFlash.push(k);
        continue;
      }

      if (remoteKeys.has(k)) {
        duplicateKeysToFlash.push(k);
        continue;
      }

      if (seenIncoming.has(k)) continue;

      seenIncoming.add(k);
      uniqueToAdd.push(f);
    }

    if (duplicateKeysToFlash.length) {
      flashItems(duplicateKeysToFlash);
    }

    const remaining = MAX_FILES - ((existingLocalFiles.length ?? 0) + (existingImages?.length ?? 0));
    const kept = remaining > 0 ? uniqueToAdd.slice(0, remaining) : [];

    if (kept.length) {
      onFilesChange([...existingLocalFiles, ...kept]);
    }

    if (uniqueToAdd.length > kept.length || totalCount >= MAX_FILES) {
      showNotice(`Limit reached. Only ${MAX_FILES} images can be accepted.`);
    }
  };

  const previewUrls = React.useMemo(() => {
    return (files ?? []).map((f) => ({
      file: f,
      key: fileKey(f),
      url: URL.createObjectURL(f),
    }));
  }, [files]);

  React.useEffect(() => {
    return () => {
      previewUrls.forEach((p) => URL.revokeObjectURL(p.url));
    };
  }, [previewUrls]);

  const removeAt = (idx: number) => {
    const next = (files ?? []).filter((_, i) => i !== idx);
    onFilesChange(next);
  };

  return (
    <div className="flex flex-col gap-2">
      <style>{`
        @keyframes cgThumbFlash {
          0%   { transform: scale(1); box-shadow: 0 0 0 0 rgba(0,0,0,0); }
          40%  { transform: scale(1.06); box-shadow: 0 0 0 4px rgba(0,0,0,0.14); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(0,0,0,0); }
        }
      `}</style>

      <div
        className={[
          "cg-description text-size-[14px]",
          mergedError
            ? "!text-error-500"
            : "text-[color:var(--Light-Text-Primary,#1A1A1A)]",
        ].join(" ")}
      >
        {showLabel && (
          <span>Product images / references</span>
        )}
        {required ? (
          <span className="ml-1 !text-[#E53935]" aria-hidden="true">
            *
          </span>
        ) : null}
      </div>

      <div
        className={[
          "w-full",
          "flex flex-col items-center justify-center text-center",
          "h-[188px] p-8 gap-6",
          "rounded-[12px] border",
          mergedError
            ? "border-error-500"
            : "border-[color:var(--Neutrals-400,#B8B8B8)]",
          "bg-[color:var(--Neutrals-50,#F9F9F9)]",
          "cursor-pointer select-none",
          dragOver ? "ring-0 border-2 border-black" : "",
        ].join(" ")}
        role="button"
        tabIndex={0}
        onClick={openPicker}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") openPicker();
        }}
        onDragEnter={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragOver(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragOver(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragOver(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragOver(false);

          if (totalCount >= MAX_FILES) {
            showNotice(`Limit reached. Only ${MAX_FILES} images can be accepted.`);
            return;
          }

          if (e.dataTransfer.files?.length) handleAddFiles(e.dataTransfer.files);
        }}
      >
        <div className="flex h-[48px] w-[48px] items-center justify-center rounded-full bg-[#F2F2F2]">
          <CloudArrowUp size={24} weight="regular" className="text-[#969696]" />
        </div>

        <div className="flex flex-col items-center gap-1">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="text-[color:var(--Light-Text-Primary,#1A1A1A)] font-[600] underline">
              {title}
            </span>
            <span className="text-[color:var(--Light-Text-Secondary,#969696)] text-[14px] font-[400]">
              {helperPrefix}
            </span>
          </div>

          <div className="text-[color:var(--Light-Text-Tertiary,#B8B8B8)] text-[12px] font-[400] leading-[16px]">
            {helperTypes} • {totalCount}/{MAX_FILES}
          </div>
        </div>

        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => {
            if (totalCount >= MAX_FILES) {
              showNotice(`Limit reached. Only ${MAX_FILES} images can be accepted.`);
              e.currentTarget.value = "";
              return;
            }

            if (e.target.files?.length) handleAddFiles(e.target.files);
            e.currentTarget.value = "";
          }}
        />
      </div>

      {existingImages.length > 0 || previewUrls.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {existingImages.map((url, idx) => {
            const flashKey = existingImageKeys[idx] || url;
            const flashing = flashKeys.has(flashKey);

            return (
              <div
                key={url}
                className="relative"
                style={{
                  animation: flashing ? "cgThumbFlash 700ms ease-in-out" : undefined,
                }}
              >
                <div
                  className={[
                    "overflow-hidden rounded-[0.5rem] border bg-white",
                    flashing ? "border-neutral-900" : "border-neutral-400",
                  ].join(" ")}
                  style={{
                    width: "4.5rem",
                    height: "4.5rem",
                    aspectRatio: "1 / 1",
                    backgroundImage: `url(${url})`,
                    backgroundPosition: "50% 50%",
                    backgroundSize: "cover",
                    backgroundRepeat: "no-repeat",
                  }}
                  title="Saved image"
                />

                {onRemoveExistingImage ? (
                  <button
                    type="button"
                    aria-label="Remove saved image"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onRemoveExistingImage(url);
                    }}
                    className="absolute -right-1 -top-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-sm border border-neutral-200"
                  >
                    <X size={12} className="text-neutral-700" />
                  </button>
                ) : null}
              </div>
            );
          })}

          {previewUrls.map((p, idx) => {
            const flashing = flashKeys.has(p.key);

            return (
              <div
                key={p.key}
                className="relative"
                style={{
                  animation: flashing ? "cgThumbFlash 700ms ease-in-out" : undefined,
                }}
              >
                <div
                  className={[
                    "overflow-hidden rounded-[0.5rem] border bg-white",
                    flashing ? "border-neutral-900" : "border-neutral-400",
                  ].join(" ")}
                  style={{
                    width: "4.5rem",
                    height: "4.5rem",
                    aspectRatio: "1 / 1",
                    backgroundImage: `url(${p.url})`,
                    backgroundPosition: "50% 50%",
                    backgroundSize: "cover",
                    backgroundRepeat: "no-repeat",
                  }}
                  title={p.file.name}
                />

                <button
                  type="button"
                  aria-label={`Remove ${p.file.name}`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    removeAt(idx);
                  }}
                  className="absolute -right-1 -top-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-sm border border-neutral-200"
                >
                  <X size={12} className="text-neutral-700" />
                </button>
              </div>
            );
          })}
        </div>
      ) : null}

      {mergedError && mergedErrorText ? (
        <p className="text-[14px] leading-[20px] text-error-500">{mergedErrorText}</p>
      ) : notice ? (
        <p className="text-[14px] leading-[20px] text-[color:var(--Light-Text-Secondary,#969696)]">
          {notice}
        </p>
      ) : null}
    </div>
  );
}