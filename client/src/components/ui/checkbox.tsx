"use client"

import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

const tickVariants = {
  checked: {
    pathLength: 1,
    opacity: 1,
    transition: {
      duration: 0.2,
      delay: 0.2,
    },
  },
  unchecked: {
    pathLength: 0,
    opacity: 0,
    transition: {
      duration: 0.2,
    },
  },
}

type CheckedState = CheckboxPrimitive.CheckedState

function Checkbox({
  className,
  checked: checkedProp,
  defaultChecked,
  onCheckedChange,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  // sync state for both controlled/uncontrolled usage
  const [checked, setChecked] = React.useState<CheckedState>(defaultChecked ?? false)

  React.useEffect(() => {
    if (checkedProp !== undefined) setChecked(checkedProp)
  }, [checkedProp])

  const handleCheckedChange = (next: CheckedState) => {
    if (checkedProp === undefined) setChecked(next)
    onCheckedChange?.(next)
  }

  const isChecked = checked === true

  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      checked={checkedProp ?? checked}
      onCheckedChange={handleCheckedChange}
      className={cn(
        "peer relative size-4 shrink-0 rounded-[0.25rem] border shadow-xs outline-none",
        "border-[#CFCFCF] bg-white",
        "data-[state=checked]:border-black data-[state=checked]:bg-black",
        "focus-visible:ring-[0.1875rem] focus-visible:ring-black/20",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "transition-all duration-300 active:scale-95",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white"
      >
        {/* ✅ EXACT same animation style you provided */}
        <motion.svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="3.5"
          stroke="currentColor"
          className="h-3.5 w-3.5"
          initial={false}
          animate={isChecked ? "checked" : "unchecked"}
        >
          <motion.path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4.5 12.75l6 6 9-13.5"
            variants={tickVariants}
          />
        </motion.svg>
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
