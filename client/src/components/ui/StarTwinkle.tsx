"use client";

import React, { useEffect, useId } from "react";

const KEYFRAMES = `
@keyframes sparkle-fade-sync {
  0%, 100% { transform: scale(0.5); opacity: 0; }
  50%      { transform: scale(1.5);   opacity: 1; }
}
`;

let injected = false;
function ensureKeyframes() {
  if (injected || typeof document === "undefined") return;
  const el = document.createElement("style");
  el.textContent = KEYFRAMES;
  document.head.appendChild(el);
  injected = true;
}

const PUFFY_PATH =
  "M80 15C80 15 90 65 115 80C140 95 175 95 175 95C175 95 140 95 115 110C90 125 80 175 80 175C80 175 70 125 45 110C20 95 -15 95 -15 95C-15 95 20 95 45 80C70 65 80 15 80 15Z";

function PuffySpark({ size }: { size: number }) {
  const uid = useId();
  const roundness = size * 0.32;

  return (
    <svg
      width={size}
      height={size}
      viewBox="-25 -25 210 240"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="overflow-visible"
    >
      <defs>
        <linearGradient id={`grad-${uid}`} x1="80" y1="15" x2="80" y2="175" gradientUnits="userSpaceOnUse">
          <stop stopColor="#D9FF80" />
          <stop offset="0.18" stopColor="white" />
          <stop offset="0.45" stopColor="#FFEBD2" />
          <stop offset="1" stopColor="#F58E23" />
        </linearGradient>
      </defs>
      <path
        d={PUFFY_PATH}
        fill={`url(#grad-${uid})`}
        stroke={`url(#grad-${uid})`}
        strokeWidth={roundness}
        strokeLinejoin="round"
        style={{ paintOrder: "stroke fill" }}
      />
    </svg>
  );
}

export default function SparkleAnimation({
  className = "",
}: {
  className?: string;
}) {
  useEffect(() => {
    ensureKeyframes();
  }, []);

  const totalDuration = 3; // 3 seconds for a full back-and-forth cycle

  const anim = (delay: number): React.CSSProperties => ({
    display: "block",
    transform: "scale(0)",
    opacity: 0,
    animation: `sparkle-fade-sync ${totalDuration}s ease-in-out ${delay}s infinite`,
    willChange: "transform, opacity",
    pointerEvents: "none",
    position: "absolute",
  });

  return (
    <div
      className={className}
      style={{
        position: "relative",
        display: "inline-block",
        width: 60,
        height: 60,
      }}
    >
      {/* Star 1 — Bottom Right: Starts immediately */}
      <span style={{ ...anim(0), bottom: "15%", left:"10px" }}>
        <PuffySpark size={20} />
      </span>

      {/* Star 2 — Top Left: Starts halfway through (1.5s offset) */}
      <span style={{ ...anim(totalDuration ), top: "5%", left: "%" }}>
        <PuffySpark size={20} />
      </span>
      {/* Star 3 — Top Center (Starts at 2.4s) */}
      <span style={{ ...anim((totalDuration / 3) * 2), top: "-5%", left: "45%" }}>
        <PuffySpark size={18} />
      </span>
    </div>
  );
}