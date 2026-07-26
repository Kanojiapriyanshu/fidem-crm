"use client";

import React, { useId } from "react";

/**
 * REFINED STAR PATH
 * This path creates a more "organic" puffed center.
 * We use a stroke with a high stroke-width and round join 
 * to perfectly mimic the Figma "Corner Radius" look.
 */
const FIGMA_STAR_PATH = 
  "M80 15C80 15 88 65 105 80C122 95 172 95 172 95C172 95 122 95 105 110C88 125 80 175 80 175C80 175 72 125 55 110C38 95 -12 95 -12 95C-12 95 38 95 55 80C72 65 80 15 80 15Z";

interface PuffyStarProps {
  size?: number;
  className?: string;
  // Increase this to make the tips more "blunt/rounded"
  roundness?: number; 
}

export default function PuffyStar({ 
  size = 300, 
  className = "", 
  roundness = 24 
}: PuffyStarProps) {
  const uid = useId();

  return (
    <div className={className} style={{ width: size, height: size }}>
      <svg
        viewBox="0 0 160 190" 
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: "100%", height: "100%", overflow: "visible" }}
      >
        <defs>
          {/* Precise gradient stops from your screenshot */}
          <linearGradient
            id={`star-grad-${uid}`}
            x1="80"
            y1="15"
            x2="80"
            y2="175"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#D9FF80" /> {/* Lime Tip */}
            <stop offset="20%" stopColor="#FFFFFF" /> {/* White Glow */}
            <stop offset="50%" stopColor="#FFD18B" /> {/* Warm Gold */}
            <stop offset="100%" stopColor="#F58E23" /> {/* Orange Base */}
          </linearGradient>

          {/* Inner Highlight for depth */}
          <radialGradient id={`glow-${uid}`} cx="50%" cy="35%" r="50%">
            <stop offset="0%" stopColor="white" stopOpacity="0.6" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* The Star Body */}
        <path
          d={FIGMA_STAR_PATH}
          fill={`url(#star-grad-${uid})`}
          stroke={`url(#star-grad-${uid})`}
          strokeWidth={roundness}
          strokeLinejoin="round"
          style={{ 
            paintOrder: "stroke fill",
            filter: "drop-shadow(0px 4px 10px rgba(0,0,0,0.1))" 
          }}
        />

        {/* Soft Inner Highlight */}
        <path
          d={FIGMA_STAR_PATH}
          fill={`url(#glow-${uid})`}
          style={{ mixBlendMode: "overlay", pointerEvents: "none" }}
        />
      </svg>
    </div>
  );
}