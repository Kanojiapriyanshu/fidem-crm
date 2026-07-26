// src/components/common/Button.tsx
"use client";

import React, { ButtonHTMLAttributes, ReactNode } from "react";
import clsx from "clsx";

const MAIN_COLOR = "bg-[#ef2f5b]";
const MAIN_COLOR_HOVER = "hover:bg-[#d12a52]";
const DISABLED_COLOR = "bg-gray-300 cursor-not-allowed";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary";
}
export default function Button({
  children,
  className,
  variant = "primary",
  disabled,
  ...rest
}: ButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center px-4 py-2 rounded-md font-medium transition focus:outline-none focus:ring-2 focus:ring-offset-2";

  const variantStyles = variant === "primary" && !disabled
    ? `${MAIN_COLOR} text-white ${MAIN_COLOR_HOVER} focus:ring-[#ef2f5b]/50`
    : "";

  const disabledStyles = disabled ? DISABLED_COLOR + " text-gray-600" : "";

  return (
    <button
      className={clsx(baseStyles, variantStyles, disabledStyles, className)}
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  );
}
