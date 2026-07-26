"use client";

import * as React from "react";
import Cropper, { type Area } from "react-easy-crop";
import {
  X,
  ArrowCounterClockwise,
  ArrowClockwise,
  ArrowsCounterClockwise,
} from "@phosphor-icons/react";

import { Button } from "@/components/ui/buttonComp";
import { cn } from "@/lib/utils";

type CropImageModalProps = {
  open: boolean;
  imageSrc: string;
  mimeType?: string;
  aspect?: number;
  cropShape?: "round" | "rect";
  onCancel: () => void;
  onSave: (blob: Blob) => void;
};

function getRadianAngle(deg: number) {
  return (deg * Math.PI) / 180;
}

function rotateSize(width: number, height: number, rotation: number) {
  const rotRad = getRadianAngle(rotation);
  return {
    width:
      Math.abs(Math.cos(rotRad) * width) +
      Math.abs(Math.sin(rotRad) * height),
    height:
      Math.abs(Math.sin(rotRad) * width) +
      Math.abs(Math.cos(rotRad) * height),
  };
}

function createImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (e) => reject(e));
    image.crossOrigin = "anonymous";
    image.src = url;
  });
}

async function getCroppedBlob(
  imageSrc: string,
  pixelCrop: Area,
  rotation = 0,
  mimeType = "image/jpeg",
  quality = 0.92
) {
  const image = await createImage(imageSrc);

  const rotRad = getRadianAngle(rotation);
  const { width: bW, height: bH } = rotateSize(
    image.width,
    image.height,
    rotation
  );

  // draw rotated image onto safe canvas
  const safeCanvas = document.createElement("canvas");
  safeCanvas.width = bW;
  safeCanvas.height = bH;

  const safeCtx = safeCanvas.getContext("2d");
  if (!safeCtx) throw new Error("Canvas context not available");

  safeCtx.translate(bW / 2, bH / 2);
  safeCtx.rotate(rotRad);
  safeCtx.translate(-image.width / 2, -image.height / 2);
  safeCtx.drawImage(image, 0, 0);

  // crop from safe canvas onto output canvas
  const outCanvas = document.createElement("canvas");
  outCanvas.width = pixelCrop.width;
  outCanvas.height = pixelCrop.height;

  const outCtx = outCanvas.getContext("2d");
  if (!outCtx) throw new Error("Canvas context not available");

  outCtx.drawImage(
    safeCanvas,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise<Blob>((resolve, reject) => {
    outCanvas.toBlob(
      (blob) => {
        if (!blob) return reject(new Error("Crop failed"));
        resolve(blob);
      },
      mimeType,
      quality
    );
  });
}

export function CropImageModal({
  open,
  imageSrc,
  mimeType = "image/jpeg",
  aspect = 1,
  cropShape = "round",
  onCancel,
  onSave,
}: CropImageModalProps) {
  // ✅ hooks ALWAYS run (no early return before hooks)
  const [crop, setCrop] = React.useState({ x: 0, y: 0 });
  const [zoom, setZoom] = React.useState(1);
  const [rotation, setRotation] = React.useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] =
    React.useState<Area | null>(null);
  const [saving, setSaving] = React.useState(false);

  // you can set this to 0.8 if you want zoom-out to reveal image edges more
  const ZOOM_MIN = 1;
  const ZOOM_MAX = 3;

  React.useEffect(() => {
    if (!open) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onCancel]);

  React.useEffect(() => {
    if (!open) return;
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setCroppedAreaPixels(null);
    setSaving(false);
  }, [open]);

  const onCropComplete = React.useCallback((_a: Area, b: Area) => {
    setCroppedAreaPixels(b);
  }, []);

  const rotateLeft = () => setRotation((r) => (r - 90 + 360) % 360);
  const rotateRight = () => setRotation((r) => (r + 90) % 360);

  const restart = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
  };

  const handleSave = async () => {
    if (!croppedAreaPixels || !imageSrc) return;
    setSaving(true);
    try {
      const blob = await getCroppedBlob(
        imageSrc,
        croppedAreaPixels,
        rotation,
        mimeType
      );
      onSave(blob);
    } finally {
      setSaving(false);
    }
  };

  // slider fill: selected #F2F2F2, unselected #010101 @ 30%
  const zoomPct = ((zoom - ZOOM_MIN) / (ZOOM_MAX - ZOOM_MIN)) * 100;
  const rangeBg = `linear-gradient(to right,
    #F2F2F2 0%,
    #F2F2F2 ${zoomPct}%,
    rgba(1,1,1,0.30) ${zoomPct}%,
    rgba(1,1,1,0.30) 100%
  )`;

  const zoomLabelValue = Math.max(0, Math.round((zoom - 1) * 100));

  // ✅ safe early return AFTER all hooks are defined
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100]">
      {/* overlay: #010101 @ 30% */}
      <button
        type="button"
        aria-label="Close"
        onClick={onCancel}
        className="absolute inset-0 bg-[#010101]/30"
      />

      {/* modal */}
      <div
        className={cn(
          "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
          "rounded-[1rem] bg-white shadow-[0_1.25rem_4.375rem_rgba(0,0,0,0.25)]",
          "w-[calc(100vw-1.5rem)] max-w-[32.5rem]",
          "sm:max-w-[40rem]",
          "md:max-w-[47.5rem]",
          "xl:max-w-[57.5rem]",
          "2xl:max-w-[65rem]",
          "py-[0.875rem] sm:py-[1.125rem] md:py-[1.375rem]"
        )}
      >
        {/* header */}
        <div className="relative flex items-center justify-end px-4 sm:px-6 md:px-8">
          <div
            className={cn(
              "absolute left-1/2 -translate-x-1/2",
              "text-center",
              "font-['Inter'] font-semibold tracking-[0]",
              "text-[1.125rem] leading-[1.625rem]",
              "sm:text-[1.25rem] sm:leading-[1.75rem]",
              "xl:text-[1.375rem] xl:leading-[1.875rem]",
              "2xl:text-[1.375rem] 2xl:leading-[1.875rem]",
              "text-[color:var(--Light-Text-Primary,#1A1A1A)]"
            )}
          >
            Crop Image
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="rounded-full p-2 hover:bg-neutral-100 active:bg-neutral-200"
            aria-label="Close modal"
          >
            <X
              size="1em"
              weight="bold"
              className="text-neutral-900 text-[1.25rem] sm:text-[1.375rem] md:text-[1.5rem] xl:text-[1.625rem] 2xl:text-[1.75rem]"
            />
          </button>
        </div>

        {/* crop area */}
        <div className="px-4 sm:px-6 md:px-8 pt-4">
          <div
            className={cn(
              "relative w-full overflow-hidden rounded-[0.625rem] bg-neutral-200",
              "h-[16.25rem] sm:h-[20rem] md:h-[26.25rem] xl:h-[30rem] 2xl:h-[32.5rem]"
            )}
          >
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              rotation={rotation} // ✅ rotation works
              aspect={aspect}
              cropShape={cropShape}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              objectFit="contain"
              minZoom={ZOOM_MIN}
              maxZoom={ZOOM_MAX}
              style={{
                containerStyle: {
                  background: "#2B2B2B",
                  borderRadius: "0.625rem",
                },
                // shows image edges (outline) — always
                mediaStyle: {
                  outline: "0.125rem solid rgba(255,255,255,0.7)",
                  outlineOffset: "-0.125rem",
                },
              }}
            />

            {/* bottom controls */}
            <div className="absolute bottom-3 left-3 right-3 flex flex-col gap-3">
              {/* row 1 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={rotateLeft}
                    className={cn(
                      "inline-flex items-center justify-center rounded-full bg-white/70 hover:bg-white",
                      "h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 xl:h-11 xl:w-11 2xl:h-12 2xl:w-12"
                    )}
                    aria-label="Rotate left"
                  >
                    <ArrowCounterClockwise
                      size="1em"
                      weight="bold"
                      className="text-neutral-900 text-[1rem] sm:text-[1.125rem] md:text-[1.25rem] xl:text-[1.375rem] 2xl:text-[1.5rem]"
                    />
                  </button>

                  <button
                    type="button"
                    onClick={rotateRight}
                    className={cn(
                      "inline-flex items-center justify-center rounded-full bg-white/70 hover:bg-white",
                      "h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 xl:h-11 xl:w-11 2xl:h-12 2xl:w-12"
                    )}
                    aria-label="Rotate right"
                  >
                    <ArrowClockwise
                      size="1em"
                      weight="bold"
                      className="text-neutral-900 text-[1rem] sm:text-[1.125rem] md:text-[1.25rem] xl:text-[1.375rem] 2xl:text-[1.5rem]"
                    />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={restart}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2 py-1",
                    "text-[0.6875rem] sm:text-[0.75rem] md:text-[0.75rem] xl:text-[0.8125rem]",
                    "font-medium text-[color:rgba(242,242,242,0.60)] hover:text-[#F2F2F2]"
                  )}
                >
                  <ArrowsCounterClockwise
                    size="1em"
                    weight="bold"
                    className="text-[#F2F2F2] text-[1rem] sm:text-[1.125rem] md:text-[1.25rem] xl:text-[1.375rem] 2xl:text-[1.5rem]"
                  />
                  Restart
                </button>
              </div>

              {/* row 2 */}
              <div className="flex items-center gap-3">
                <span className="text-[0.6875rem] sm:text-[0.75rem] font-medium text-[color:rgba(242,242,242,0.70)]">
                  Zoom
                </span>

                <input
                  type="range"
                  min={ZOOM_MIN}
                  max={ZOOM_MAX}
                  step={0.01}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  aria-label="Zoom"
                  className={cn(
                    "cg-zoom-range flex-1",
                    "[--cg-track:0.25rem] [--cg-thumb:0.75rem]",
                    "sm:[--cg-thumb:0.875rem]",
                    "xl:[--cg-thumb:1rem]"
                  )}
                  style={{ background: rangeBg }}
                />

                <span className="w-8 text-right text-[0.6875rem] sm:text-[0.75rem] font-medium text-[color:rgba(242,242,242,0.70)]">
                  {zoomLabelValue}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* footer (inside modal) */}
        <div className="flex items-center justify-end gap-3 px-4 sm:px-6 md:px-8 pt-4">
          <Button
            variant="raised"
            onClick={onCancel}
            className="text-[0.75rem] font-medium text-neutral-900 hover:opacity-80 shadow-none"
          >
            Cancel
          </Button>

          <Button
            variant="solid"
            size="md"
            className="h-[2.5rem] rounded-[0.625rem] px-[1.375rem]"
            onClick={handleSave}
            disabled={!croppedAreaPixels || saving}
          >
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      {/* ✅ slider skin: no blue */}
      <style jsx global>{`
        .cg-zoom-range {
          -webkit-appearance: none;
          appearance: none;
          height: var(--cg-track, 0.25rem);
          border-radius: 624.9375rem;
          outline: none;
        }
        .cg-zoom-range::-webkit-slider-runnable-track {
          height: var(--cg-track, 0.25rem);
          background: transparent;
          border-radius: 624.9375rem;
        }
        .cg-zoom-range::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: var(--cg-thumb, 0.875rem);
          height: var(--cg-thumb, 0.875rem);
          border-radius: 624.9375rem;
          background: #f2f2f2; /* ✅ thumb color */
          border: 0.125rem solid rgba(1, 1, 1, 0.3);
          box-shadow: 0 0.125rem 0.625rem rgba(0, 0, 0, 0.35);
          margin-top: calc((var(--cg-track, 0.25rem) - var(--cg-thumb, 0.875rem)) / 2);
          cursor: pointer;
        }
        .cg-zoom-range::-moz-range-track {
          height: var(--cg-track, 0.25rem);
          background: transparent;
          border-radius: 624.9375rem;
        }
        .cg-zoom-range::-moz-range-thumb {
          width: var(--cg-thumb, 0.875rem);
          height: var(--cg-thumb, 0.875rem);
          border-radius: 624.9375rem;
          background: #f2f2f2; /* ✅ thumb color */
          border: 0.125rem solid rgba(1, 1, 1, 0.3);
          box-shadow: 0 0.125rem 0.625rem rgba(0, 0, 0, 0.35);
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
