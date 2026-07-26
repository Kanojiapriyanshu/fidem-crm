"use client";

import * as React from "react";
import { OTPInput, OTPInputContext } from "input-otp";
import { MinusIcon } from "lucide-react";
import { cn } from "@/lib/utils";

function InputOTP({
  className,
  containerClassName,
  ...props
}: React.ComponentProps<typeof OTPInput> & {
  containerClassName?: string;
}) {
  return (
    <OTPInput
      data-slot="input-otp"
      containerClassName={cn(
        "flex items-center justify-center w-full has-disabled:opacity-50",
        containerClassName
      )}
      className={cn("disabled:cursor-not-allowed", className)}
      {...props}
    />
  );
}

function InputOTPGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="input-otp-group"
      className={cn(
        // ✅ responsive container (no overflow on mobile)
        "flex items-center justify-between w-full max-w-[520px]",
        "h-[40px] sm:h-[44px] md:h-[64px]",
        className
      )}
      {...props}
    />
  );
}

function InputOTPSlot({
  index,
  className,
  ...props
}: React.ComponentProps<"div"> & { index: number }) {
  const inputOTPContext = React.useContext(OTPInputContext);
  const { char, hasFakeCaret, isActive } = inputOTPContext?.slots[index] ?? {};

  return (
    <div
      data-slot="input-otp-slot"
      data-active={isActive}
      className={cn(
        // ✅ responsive slot sizing
        "relative flex items-center justify-center outline-none transition-all",
        "w-[40px] h-[40px] sm:w-[44px] sm:h-[44px] md:w-[73.333336px] md:h-[64px]",
        "rounded-[10px] md:rounded-[8px]",
        "bg-background border border-input text-[16px] shadow-xs",
        // active
        "data-[active=true]:border-[#1a1a1a] data-[active=true]:ring-[#1a1a1a] data-[active=true]:ring-1 data-[active=true]:z-10",
        // invalid (works when aria-invalid="true" is set on this slot)
        "aria-invalid:border-destructive data-[active=true]:aria-invalid:border-destructive",
        className
      )}
      {...props}
    >
      {char}
      {hasFakeCaret && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="animate-caret-blink bg-foreground h-4 w-px duration-1000" />
        </div>
      )}
    </div>
  );
}

function InputOTPSeparator(props: React.ComponentProps<"div">) {
  return (
    <div data-slot="input-otp-separator" role="separator" {...props}>
      <MinusIcon />
    </div>
  );
}

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator };
