"use client";

import * as React from "react";
import { Info } from "@phosphor-icons/react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function FieldInfoIcon({
  content,
  className,
}: {
  content?: React.ReactNode;
  className?: string;
}) {
  if (!content) return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label="More info"
          tabIndex={-1}
          onPointerDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          className={cn(
            "pointer-events-auto relative z-10 inline-flex items-center justify-center text-gray-400 hover:text-gray-600",
            className
          )}
        >
          <Info className="h-4 w-4" />
        </button>
      </TooltipTrigger>

      <TooltipContent
        side="top"
        align="center"
        sideOffset={6}
        className="z-[200] max-w-xs text-sm leading-6"
      >
        <div>{content}</div>
      </TooltipContent>
    </Tooltip>
  );
}