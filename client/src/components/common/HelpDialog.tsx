"use client";

import React from "react";
import { AnimatePresence, m } from "framer-motion";
import type { Transition, Variants } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  FilesIcon,
  GavelIcon,
  LinkIcon,
  QuestionIcon,
} from "@phosphor-icons/react";

export type SupportMenuKey =
  | "dispute"
  | "report_issue"
  | "help_center"
  | "privacy_policy";

export type HelpMenuItem = {
  key: SupportMenuKey;
  label: string;
};

export interface HelpDialogProps {
  open: boolean;
  dialogRef?: React.RefObject<HTMLDivElement | null>;
  position: {
    top: number;
    left: number;
  };
  items: HelpMenuItem[];
  onSelect: (key: SupportMenuKey) => void;
  className?: string;
  focusRingClassName?: string;
}

const fadeScale: Variants = {
  initial: { opacity: 0, scale: 0.96 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.96 },
};

const contentTransition: Transition = {
  duration: 0.2,
  ease: [0.4, 0, 0.2, 1],
};

function SupportMenuIcon({
  kind,
  className,
}: {
  kind: SupportMenuKey;
  className?: string;
}) {
  if (kind === "dispute") {
    return <GavelIcon className={className} />;
  }

  if (kind === "report_issue") {
    return <LinkIcon className={className} />;
  }

  if (kind === "help_center") {
    return <QuestionIcon className={className} />;
  }

  return <FilesIcon className={className} />;
}

export default function HelpDialog({
  open,
  dialogRef,
  position,
  items,
  onSelect,
  className,
  focusRingClassName = "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#1a1a1a]/35 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
}: HelpDialogProps) {
  return (
    <AnimatePresence>
      {open ? (
        <m.div
          ref={dialogRef}
          key="help-support-dialog"
          role="dialog"
          aria-modal="false"
          aria-labelledby="help-support-dialog-title"
          variants={fadeScale}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={contentTransition}
          className={cn("fixed z-[140] w-full max-w-[320px]", className)}
          style={{
            top: position.top,
            left: position.left,
          }}
        >
          <div className="rounded-[18px] border border-neutral-200 bg-white px-3 py-4 shadow-[0_24px_40px_-4px_rgba(0,0,0,0.10),0_0_12px_0_rgba(0,0,0,0.08)]">
            {/* <div className="mb-2 flex items-center justify-between gap-3 px-1">
              <div>
                <h2
                  id="help-support-dialog-title"
                  className="text-[16px] font-semibold text-[#1a1a1a]"
                >
                  Help & Support
                </h2>
                <p className="mt-1 text-[12px] text-neutral-500">
                  Choose where you want to go next.
                </p>
              </div>
            </div> */}

            <div className="mt-3 flex flex-col gap-1">
              {items.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => onSelect(item.key)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-[#1a1a1a] transition hover:bg-[#F8F8F8]",
                    focusRingClassName
                  )}
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center text-[#1a1a1a]">
                    <SupportMenuIcon kind={item.key} className="h-5 w-5" />
                  </span>
                  <span className="text-[16px] font-medium leading-6">
                    {item.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </m.div>
      ) : null}
    </AnimatePresence>
  );
}