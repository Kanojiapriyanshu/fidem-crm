import React from "react";
import { CloudArrowUp, X } from "@phosphor-icons/react";

const MAX_BYTES = 5 * 1024 * 1024;
const MAX_FILES = 5;

// ✅ UI says “or PDF”, so include it (still size-limited like others)
const ACCEPT = ".svg,.png,.jpg,.jpeg,.pdf";

function pickValidFiles(list: FileList | File[]) {
  const files = Array.from(list);
  return files.filter((f) => f.size <= MAX_BYTES);
}

// Duplicate key (simple + reliable for most cases)
const fileKey = (f: File) => `${f.name}__${f.size}__${f.lastModified}`;

export function ProductImagesUpload({
  files,
  onFilesChange,
  title = "Upload an Image",
  helperPrefix = "or drag and drop",
  helperTypes = "SVG, PNG, JPG or PDF under (max 5mb)",
  required = false,
  error = false,
  errorText,
}: {
  files: File[];
  onFilesChange: (files: File[]) => void;
  title?: string;
  helperPrefix?: string;
  helperTypes?: string;
  required?: boolean;
  error?: boolean;
  errorText?: string;
}) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [dragOver, setDragOver] = React.useState(false);

  // ✅ Non-error message (for max-limit only)
  const [notice, setNotice] = React.useState<string | null>(null);
  const noticeTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // ✅ Track which existing images to "flash" when duplicates are uploaded
  const [flashKeys, setFlashKeys] = React.useState<Set<string>>(new Set());
  const flashTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const flashExisting = React.useCallback((keys: string[]) => {
    if (!keys.length) return;

    // New Set reference each time so repeated duplicates still re-trigger
    setFlashKeys(new Set(keys));

    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    flashTimerRef.current = setTimeout(() => setFlashKeys(new Set()), 700);
  }, []);

  React.useEffect(() => {
    return () => {
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    };
  }, []);

  // ✅ Only parent "error" highlights the section in red now
  const mergedError = error;
  const mergedErrorText = errorText;

  const openPicker = () => {
    if ((files?.length ?? 0) >= MAX_FILES) {
      showNotice(`Limit reached. Only ${MAX_FILES} files can be accepted.`);
      return;
    }
    inputRef.current?.click();
  };

  const handleAddFiles = (incoming: FileList | File[]) => {
    const valid = pickValidFiles(incoming);

    const existing = files ?? [];
    const existingKeys = new Set(existing.map(fileKey));

    // track duplicates so we can flash the existing thumb
    const duplicates: string[] = [];

    // also avoid adding the same incoming file twice in one selection
    const seenIncoming = new Set<string>();

    const uniqueToAdd: File[] = [];
    for (const f of valid) {
      const k = fileKey(f);

      if (existingKeys.has(k)) {
        duplicates.push(k);
        continue;
      }
      if (seenIncoming.has(k)) continue;

      seenIncoming.add(k);
      uniqueToAdd.push(f);
    }

    // ✅ flash any duplicates (instead of doing nothing)
    if (duplicates.length) flashExisting(duplicates);

    // ✅ enforce max 5 total (but only show notice, not error highlight)
    const remaining = MAX_FILES - existing.length;
    const kept = remaining > 0 ? uniqueToAdd.slice(0, remaining) : [];

    if (kept.length) {
      onFilesChange([...existing, ...kept]);
    }

    // show notice if some unique files were ignored due to max limit
    if (uniqueToAdd.length > kept.length || existing.length >= MAX_FILES) {
      showNotice(`Limit reached. Only ${MAX_FILES} files can be accepted.`);
    }
  };

  // ✅ preview urls for thumbnails
  const previewUrls = React.useMemo(() => {
    return (files ?? []).map((f) => ({
      file: f,
      key: fileKey(f),
      url: URL.createObjectURL(f),
      isImage: /^image\//.test(f.type),
    }));
  }, [files]);

  // ✅ cleanup urls
  React.useEffect(() => {
    return () => {
      previewUrls.forEach((p) => URL.revokeObjectURL(p.url));
    };
  }, [previewUrls]);

  const removeAt = (idx: number) => {
    const next = (files ?? []).filter((_, i) => i !== idx);
    onFilesChange(next);
  };

  const fileExt = (name: string) => {
    const ext = name.split(".").pop()?.trim();
    return ext ? ext.toUpperCase() : "FILE";
  };

  return (
    <div className="flex flex-col gap-2">
      {/* local keyframes for duplicate highlight */}
      <style>{`
        @keyframes cgThumbFlash {
          0%   { transform: scale(1);   box-shadow: 0 0 0 0 rgba(0,0,0,0); }
          40%  { transform: scale(1.06); box-shadow: 0 0 0 4px rgba(0,0,0,0.14); }
          100% { transform: scale(1);   box-shadow: 0 0 0 0 rgba(0,0,0,0); }
        }
      `}</style>

      {/* Heading (kept as-is) */}
      <div
        className={[
          "cg-description text-size-[14px]",
          mergedError ? "!text-error-500" : "text-[color:var(--Light-Text-Primary,#1A1A1A)]",
        ].join(" ")}
      >
        <span>Product images / references</span>
        {required ? (
          <span className="ml-1 !text-[#E53935]" aria-hidden="true">
            *
          </span>
        ) : null}
      </div>

      {/* ✅ Dropzone UI updated to match screenshot */}
      <div
        className={[
          "w-full",
          "flex items-center justify-between gap-4",
          "rounded-[10px] border",
          mergedError ? "border-error-500" : "border-[color:#E5E5E5]",
          "bg-white",
          "px-4 py-3",
          "cursor-pointer select-none",
          dragOver ? "border-black ring-0" : "",
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

          if ((files?.length ?? 0) >= MAX_FILES) {
            showNotice(`Limit reached. Only ${MAX_FILES} files can be accepted.`);
            return;
          }

          if (e.dataTransfer.files?.length) handleAddFiles(e.dataTransfer.files);
        }}
      >
        {/* Left: icon + text */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F2F2F2]">
            <CloudArrowUp size={20} weight="regular" className="text-[#9A9A9A]" />
          </div>

          <div className="flex flex-col min-w-0">
            <div className="text-[14px] font-[600] text-[#1A1A1A] truncate">{title}</div>
            <div className="text-[12px] leading-[16px] text-[#9A9A9A] truncate">
              {helperPrefix}{" "}
              <span className="text-[#B8B8B8]">
                {helperTypes}{" "}
                {/* keep count but subtle (won’t break layout) */}
                {files.length ? `(${files.length}/${MAX_FILES})` : ""}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Upload button */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            openPicker();
          }}
          className="shrink-0 rounded-[8px] border border-[#E5E5E5] bg-white px-4 py-2 text-[13px] font-[600] text-[#1A1A1A]"
        >
          Upload
        </button>

        {/* Hidden input */}
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => {
            if ((files?.length ?? 0) >= MAX_FILES) {
              showNotice(`Limit reached. Only ${MAX_FILES} files can be accepted.`);
              e.currentTarget.value = "";
              return;
            }

            if (e.target.files?.length) handleAddFiles(e.target.files);
            e.currentTarget.value = "";
          }}
        />
      </div>

      {/* Thumbnails */}
      {previewUrls.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
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
                {/* ✅ show file thumb for images; fallback badge for PDFs/others */}
                <div
                  className={[
                    "overflow-hidden rounded-[0.5rem] border bg-white",
                    flashing ? "border-neutral-900" : "border-neutral-400",
                    "flex items-center justify-center",
                  ].join(" ")}
                  style={{
                    width: "4.5rem",
                    height: "4.5rem",
                    aspectRatio: "1 / 1",
                    ...(p.isImage
                      ? {
                          backgroundImage: `url(${p.url})`,
                          backgroundPosition: "50% 50%",
                          backgroundSize: "cover",
                          backgroundRepeat: "no-repeat",
                        }
                      : {}),
                  }}
                  title={p.file.name}
                >
                  {!p.isImage ? (
                    <div className="px-2 text-center">
                      <div className="text-[11px] font-[700] text-neutral-800">{fileExt(p.file.name)}</div>
                      <div className="mt-0.5 text-[10px] text-neutral-500 truncate max-w-[4rem]">
                        {p.file.name}
                      </div>
                    </div>
                  ) : null}
                </div>

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

      {/* Messages */}
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
