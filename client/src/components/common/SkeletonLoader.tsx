"use client";

import React from "react";

export const SkeletonProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <style jsx global>{`
        @keyframes skeletonLeftToRight {
          100% {
            transform: translateX(100%);
          }
        }

        .skeleton-loader {
          position: relative;
          overflow: hidden;
          background: #f1f1f1;
        }

        .skeleton-loader::after {
          content: "";
          position: absolute;
          inset: 0;
          transform: translateX(-100%);
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.85),
            transparent
          );
          animation: skeletonLeftToRight 1.35s ease-in-out infinite;
        }
      `}</style>

      {children}
    </>
  );
};

type SkeletonLoaderProps = {
  className?: string;
};

const SkeletonLoader = ({ className = "" }: SkeletonLoaderProps) => {
  return <span className={`skeleton-loader block ${className}`} />;
};

export default SkeletonLoader;

export const SkeletonCircle = ({ className = "" }: SkeletonLoaderProps) => {
  return <SkeletonLoader className={`rounded-full ${className}`} />;
};

export const SkeletonCard = ({
  rows = 4,
  tall = false,
}: {
  rows?: number;
  tall?: boolean;
}) => {
  return (
    <section
      className={`flex w-full rounded-lg border border-[#E6E6E6] bg-white px-5 pb-3 pt-4 ${
        tall ? "min-h-[30rem]" : ""
      }`}
    >
      <div className="flex w-full flex-col gap-6">
        <div className="flex items-center justify-between gap-4">
          <SkeletonLoader className="h-6 w-40 rounded-md" />
          <SkeletonLoader className="h-4 w-20 rounded-md" />
        </div>

        <div className="flex w-full flex-col">
          {Array.from({ length: rows }).map((_, index) => (
            <div
              key={index}
              className="flex w-full items-center gap-3 border-b border-[#E6E6E6] py-3 last:border-b-0"
            >
              <SkeletonLoader className="h-10 w-10 shrink-0 rounded-lg" />

              <div className="min-w-0 flex-1">
                <SkeletonLoader className="h-4 w-3/5 rounded-md" />
                <SkeletonLoader className="mt-2 h-3 w-4/5 rounded-md" />
              </div>

              <SkeletonLoader className="h-7 w-16 shrink-0 rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export const SkeletonInboxList = ({ rows = 5 }: { rows?: number }) => {
  return (
    <div className="flex w-full flex-col">
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="flex w-full min-w-0 items-start gap-2 border-b border-[#E6E6E6] px-2 pb-3 pt-2 last:border-b-0"
        >
          <SkeletonCircle className="h-[1.375rem] w-[1.375rem] shrink-0" />

          <div className="min-w-0 flex-1">
            <div className="flex w-full items-start gap-2">
              <SkeletonLoader className="h-4 w-28 rounded-md" />
              <SkeletonLoader className="ml-auto h-4 w-10 rounded-md" />
            </div>

            <SkeletonLoader className="mt-2 h-4 w-3/4 rounded-md" />
            <SkeletonLoader className="mt-2 h-3 w-full rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
};