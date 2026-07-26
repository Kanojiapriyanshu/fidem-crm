"use client";

import * as React from "react";
import Image, { type StaticImageData } from "next/image";
import { cn } from "@/lib/utils";

type LoaderProps = {
  /** ✅ your logo */
  logoSrc: StaticImageData | string;
  logoAlt?: string;

  /** outer box size in px (default 205) */
  size?: number;

  /** center logo size in px (default 72) */
  logoSize?: number;

  /** ring thickness in px */
  strokeWidth?: number;

  /** ring color */
  stroke?: string;

  /** rotation speed in ms */
  speedMs?: number;

  className?: string;
  ariaLabel?: string;
};

const pxToRem = (px: number, base = 16) => `${px / base}rem`;

export function Loader({
  logoSrc,
  logoAlt = "Loading",
  size = 205,
  logoSize = 72,
  strokeWidth = 2,
  stroke = "#010101",
  speedMs = 1100,
  className,
  ariaLabel = "Loading",
}: LoaderProps) {
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;

  // open ring (arc + gap) like your design
  const arc = c * 0.78;
  const gap = c - arc;

  return (
    <div
      role="status"
      aria-label={ariaLabel}
      className={cn("flex items-center justify-center", className)}
      style={{ width: pxToRem(size), height: pxToRem(size) }}
    >
      <div className="relative" style={{ width: pxToRem(size), height: pxToRem(size) }}>
        {/* rotating ring */}
        <svg
          width={pxToRem(size)}
          height={pxToRem(size)}
          viewBox={`0 0 ${size} ${size}`} // keep numeric for SVG math
          className="absolute inset-0 animate-spin"
          style={{ animationDuration: `${speedMs}ms` }}
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={stroke}
            strokeWidth={strokeWidth} // keep numeric for SVG
            strokeLinecap="round"
            strokeDasharray={`${arc} ${gap}`}
            strokeDashoffset={c * 0.12}
          />
        </svg>

        {/* center logo */}
        <div className="absolute inset-0 flex items-center justify-center">
          <img
            src="/logo.png"
            alt={logoAlt}
            width={logoSize}
            height={logoSize}
            className="select-none"
            draggable={false}
          />
        </div>
      </div>
    </div>
  );
}
