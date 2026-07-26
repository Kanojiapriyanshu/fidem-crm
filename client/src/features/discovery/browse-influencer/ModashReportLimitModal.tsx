'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';

type ModashReportLimitModalProps = {
  open: boolean;
  onClose: () => void;
  onUpgrade?: () => void;
};

export function ModashReportLimitModal({
  open,
  onClose,
  onUpgrade,
}: ModashReportLimitModalProps) {
  const router = useRouter();

  if (!open) return null;

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
      return;
    }

    onClose();
    router.push('/brand/subscriptions');
  };

  return (
    <div className="fixed inset-0 z-[220] flex items-center justify-center bg-black/25 px-4 py-6">
      <div
        className="
          relative
          w-full
          max-w-[520px]
          rounded-[16px]
          bg-white
          px-8
          pb-7
          pt-8
          text-center
          shadow-[0_24px_40px_-4px_rgba(0,0,0,0.10),0_0_12px_0_rgba(0,0,0,0.08)]
          sm:max-w-[560px]
          sm:px-10
          sm:pb-8
          sm:pt-9
        "
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="
            absolute
            right-5
            top-5
            inline-flex
            h-8
            w-8
            items-center
            justify-center
            rounded-full
            text-[#1A1A1A]
            transition
            hover:bg-gray-100
          "
        >
          <X className="h-6 w-6" strokeWidth={2.4} />
        </button>

        <img
          src="/Modash_no_result.png"
          alt="Report limit reached"
          className="mx-auto h-[118px] w-auto object-contain sm:h-[132px]"
        />

        <h2
          className="
            mt-6
            text-center
            font-inter
            text-[16px]
            font-semibold
            leading-[24px]
            tracking-[0]
            text-black
          "
        >
          You&apos;ve reached your report limit
        </h2>

        <p
          className="
            mx-auto
            mt-2
            max-w-[420px]
            text-center
            font-inter
            text-[14px]
            font-medium
            leading-[20px]
            tracking-[0]
            text-[#B8B8B8]
          "
        >
          You&apos;ve used the 1 report included in your Free plan.
          <br />
          Upgrade to continue generating creator and campaign intelligence reports.
        </p>

        <div className="mt-6 flex items-center justify-center gap-5">
          <button
            type="button"
            onClick={onClose}
            className="
              inline-flex
              h-10
              items-center
              justify-center
              rounded-[8px]
              bg-transparent
              px-5
              text-[14px]
              font-semibold
              leading-5
              text-[#1A1A1A]
              transition
              hover:bg-gray-100
            "
          >
            Do It later
          </button>

          <button
            type="button"
            onClick={handleUpgrade}
            className="
              inline-flex
              h-10
              min-w-[132px]
              items-center
              justify-center
              rounded-[8px]
              bg-[#1A1A1A]
              px-5
              text-[14px]
              font-semibold
              leading-5
              text-white
              transition
              hover:bg-black
            "
          >
            Upgrade Plan
          </button>
        </div>
      </div>
    </div>
  );
}