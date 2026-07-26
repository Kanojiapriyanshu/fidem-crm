"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const ANIM_MS = 220;

function clamp0(n: number) {
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = React.useState(false);

  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(mq.matches);

    onChange();
    // Safari fallback
    if (mq.addEventListener) mq.addEventListener("change", onChange);
    else mq.addListener(onChange);

    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", onChange);
      else mq.removeListener(onChange);
    };
  }, []);

  return reduced;
}

function TickerDigit({
  digit,
  className,
}: {
  digit: number;
  className?: string;
}) {
  const reduceMotion = usePrefersReducedMotion();

  const [curr, setCurr] = React.useState(digit);
  const [prev, setPrev] = React.useState<number | null>(null);

  const timeoutRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    if (digit === curr) return;

    // clear any pending cleanup so we don't get overlap/ghost digits
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);

    setPrev(curr);
    setCurr(digit);

    timeoutRef.current = window.setTimeout(() => {
      setPrev(null);
      timeoutRef.current = null;
    }, ANIM_MS + 40); // tiny buffer prevents snap-back overlap

    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, [digit, curr]);

  // Reduced motion: show only the current digit, no layers
  if (reduceMotion) {
    return (
      <span
        className={cn("inline-block tabular-nums align-middle", className)}
        style={{ width: "1ch" }}
        aria-hidden="true"
      >
        {digit}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "cg-digit relative inline-block overflow-hidden align-middle tabular-nums",
        className
      )}
      style={{
        height: "1.1em",
        width: "1ch",
        lineHeight: "1.1em",
      }}
      aria-hidden="true"
    >
      {/* Incoming digit */}
      <span
        key={`in-${curr}`}
        className="cg-layer cg-in absolute inset-0 grid place-items-center"
        style={{
          animationDuration: `${ANIM_MS}ms`,
          animationFillMode: "both",
        }}
      >
        {curr}
      </span>

      {/* Outgoing digit */}
      {prev !== null && (
        <span
          key={`out-${prev}`}
          className="cg-layer cg-out absolute inset-0 grid place-items-center"
          style={{
            animationDuration: `${ANIM_MS}ms`,
            animationFillMode: "both",
          }}
        >
          {prev}
        </span>
      )}

      {/* self-contained styles so you don't need globals.css */}
      <style jsx global>{`
        .cg-digit {
          will-change: transform;
          transform: translateZ(0);
        }

        @keyframes cgTickIn {
          from {
            transform: translate3d(0, -110%, 0);
            opacity: 0;
          }
          to {
            transform: translate3d(0, 0%, 0);
            opacity: 1;
          }
        }

        @keyframes cgTickOut {
          from {
            transform: translate3d(0, 0%, 0);
            opacity: 1;
          }
          to {
            transform: translate3d(0, 110%, 0);
            opacity: 0;
          }
        }

        .cg-in {
          animation-name: cgTickIn;
          animation-timing-function: cubic-bezier(0.2, 0.8, 0.2, 1);
          z-index: 2;
        }

        .cg-out {
          animation-name: cgTickOut;
          animation-timing-function: cubic-bezier(0.2, 0.8, 0.2, 1);
          z-index: 1;
        }
      `}</style>
    </span>
  );
}

export function CountdownTicker({
  seconds,
  className,
}: {
  seconds: number;
  className?: string;
}) {
  const s = clamp0(seconds);

  const mm = Math.floor(s / 60);
  const ss = s % 60;

  const mT = Math.floor(mm / 10);
  const mO = mm % 10;
  const sT = Math.floor(ss / 10);
  const sO = ss % 10;

  return (
    <span
      className={cn("inline-flex items-center tabular-nums", className)}
      aria-label={`Time left ${mm}:${String(ss).padStart(2, "0")}`}
    >
      <TickerDigit digit={mT} />
      <TickerDigit digit={mO} />
      <span className="mx-[0.125rem]">:</span>
      <TickerDigit digit={sT} />
      <TickerDigit digit={sO} />
    </span>
  );
}
