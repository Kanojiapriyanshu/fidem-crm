"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { ChevronUp, ChevronDown, Send, MoreHorizontal } from "lucide-react"
import { Checkbox } from "@/components/animate-ui/components/radix/checkbox"

type CellVariant = "default" | "checkbox"

// --- SMALL UTILITIES ---

function mergeRefs<T>(...refs: Array<React.Ref<T> | undefined>) {
  return (node: T) => {
    for (const ref of refs) {
      if (!ref) continue
      if (typeof ref === "function") ref(node)
      else (ref as React.MutableRefObject<T | null>).current = node
    }
  }
}

// --- CORE CONTAINERS ---

export function TableContainer({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        // ✅ Bold (2px) Grey Border for the container
        "w-full max-w-full min-w-0 rounded-[12px] border-2 border-gray-300 bg-[#FFFFFF] shadow-sm overflow-hidden flex flex-col",
        className
      )}
      {...props}
    />
  )
}

export function TableScrollArea({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "w-full max-w-full min-w-0 overflow-x-auto relative",
        // Better mobile/touch horizontal scrolling without changing visuals
        "overscroll-x-contain touch-pan-x",
        // ✅ CSS to hide scrollbar but keep functionality
        "[&::-webkit-scrollbar]:hidden", // Chrome, Safari, Edge
        "[-ms-overflow-style:none]", // IE and Edge Legacy
        "[scrollbar-width:none]", // Firefox
        "[-ms-overflow-style:none]", // IE and Edge Legacy
        "[scrollbar-width:none]", // Firefox
        className
      )}
      {...props}
    />
  )
}

// --- TABLE ELEMENTS ---

export function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <table className={cn("w-full min-w-max caption-bottom text-sm border-separate border-spacing-0", className)} {...props} />
  )
}

export function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      className={cn(
        // Sticky header background
        "sticky top-0 bg-[#FFFFFF]",
        // Rounding corners for the first row
        "[&_tr:first-child_th:first-child]:rounded-tl-[9px]",
        "[&_tr:first-child_th:last-child]:rounded-tr-[9px]",
        className
      )}
      {...props}
    />
  )
}

export function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      className={cn(
        "[&_tr:last-child]:border-0",
        // Rounding corners for the last row
        "[&_tr:last-child_td:first-child]:rounded-bl-[9px]",
        "[&_tr:last-child_td:last-child]:rounded-br-[9px]",
        className
      )}
      {...props}
    />
  )
}

export function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      className={cn(
        // ✅ Bold border bottom for rows
        "h-[56px] group hover:bg-gray-50/50 data-[state=selected]:bg-gray-50 transition-colors border-b-2 border-gray-300",
        className
      )}
      {...props}
    />
  )
}

// --- SPECIALIZED UI COMPONENTS ---

export function TableStickyFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        // ✅ Bold border top
        "sticky bottom-0 w-full z-50 bg-[#FFFFFF] border-t-2 border-gray-300",
        "h-[72px] px-[20px] py-[16px] flex items-center justify-between gap-4",
        className
      )}
      {...props}
    />
  )
}

// ✅ Uses the Custom Radix Checkbox
export function TableCheckbox({ className, ...props }: React.ComponentProps<typeof Checkbox>) {
  return (
    <div className="flex items-center justify-center w-full h-full">
      <Checkbox
        className={cn("border-gray-400 data-[state=checked]:bg-black data-[state=checked]:border-black", className)}
        {...props}
      />
    </div>
  )
}

export function TableAvatar({ className, src, alt, ...props }: React.ComponentProps<"img">) {
  return (
    <img
      src={src}
      alt={alt}
      loading={(props as any).loading ?? "lazy"}
      decoding={(props as any).decoding ?? "async"}
      className={cn("w-[32px] h-[32px] rounded-[6px] object-cover bg-gray-200 border border-gray-200", className)}
      {...props}
    />
  )
}

export function TableStatusBadge({ status, className }: { status: "Pending" | "Sent" | "Rejected"; className?: string }) {
  const variants = {
    Pending: "bg-[#FFF4D1] border-[#FFD978] text-black",
    Sent: "bg-[#D6F5E1] border-[#A8E9BD] text-black",
    Rejected: "bg-[#FFE0E0] border-[#F9BABA] text-black",
  }

  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          "w-[64px] h-[22px] flex items-center justify-center rounded-[20px] border border-solid text-[11px] font-bold",
          variants[status],
          className
        )}
      >
        {status}
      </div>
      <ChevronDown className="w-4 h-4 text-gray-400 cursor-pointer" aria-hidden="true" />
    </div>
  )
}

export function TableActionGroup({ className, onSend }: { onSend?: () => void; className?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <button
        type="button"
        onClick={onSend}
        className="flex items-center gap-2 bg-black text-white px-3 py-1.5 rounded-[8px] hover:bg-neutral-800 transition-colors"
      >
        <span className="text-xs font-bold whitespace-nowrap">Send Invitation</span>
      </button>
      <MoreHorizontal className="w-5 h-5 text-gray-400 cursor-pointer hover:text-black" aria-hidden="true" />
    </div>
  )
}

// --- UNIVERSAL STICKY LOGIC ---

function useStickyOffset(isFixed?: boolean) {
  const ref = React.useRef<HTMLTableCellElement | null>(null)
  const [leftOffset, setLeftOffset] = React.useState(0)

  React.useLayoutEffect(() => {
    if (!isFixed) return

    let raf = 0
    let ro: ResizeObserver | null = null

    const calculateOffset = () => {
      if (!ref.current) return
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        if (!ref.current) return
        let offset = 0
        let prev = ref.current.previousElementSibling
        while (prev instanceof HTMLTableCellElement) {
          offset += prev.offsetWidth
          prev = prev.previousElementSibling
        }
        setLeftOffset(offset)
      })
    }

    // Initial calc
    calculateOffset()

    // Observe size changes for better responsiveness (container/columns/fonts)
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => calculateOffset())
      // Observe the row and the table (covers sibling width changes)
      const row = ref.current?.parentElement
      const table = ref.current?.closest("table")
      if (row) ro.observe(row)
      if (table) ro.observe(table)
    }

    // Fonts can shift widths after load
    const fonts = (document as any).fonts
    if (fonts?.ready?.then) {
      fonts.ready.then(() => calculateOffset()).catch(() => { })
    }

    window.addEventListener("resize", calculateOffset, { passive: true })
    window.addEventListener("orientationchange", calculateOffset, { passive: true } as any)

    return () => {
      cancelAnimationFrame(raf)
      ro?.disconnect()
      window.removeEventListener("resize", calculateOffset)
      window.removeEventListener("orientationchange", calculateOffset as any)
    }
  }, [isFixed])

  return {
    ref,
    style: isFixed
      ? ({
        position: "sticky",
        left: leftOffset,
        zIndex: 20,
      } as React.CSSProperties)
      : ({} as React.CSSProperties),
  }
}

// --- SMART CELL COMPONENTS ---

interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  fixed?: boolean
  variant?: CellVariant
  sortable?: boolean
  sortDirection?: "asc" | "desc" | null
  onSort?: () => void
}

export const TableHead = React.forwardRef<HTMLTableCellElement, TableHeadProps>(
  ({ className, fixed, variant = "default", sortable, sortDirection, onSort, children, ...props }, outerRef) => {
    const { ref, style } = useStickyOffset(fixed)
    const isCheckbox = variant === "checkbox"

    const ariaSort: React.AriaAttributes["aria-sort"] =
      sortable && sortDirection
        ? sortDirection === "asc"
          ? "ascending"
          : "descending"
        : sortable
          ? "none"
          : undefined

    return (
      <th
        ref={mergeRefs(ref, outerRef)}
        style={{ ...style, ...props.style, zIndex: fixed ? 30 : undefined } as React.CSSProperties}
        className={cn(
          // ✅ Bold borders (right and bottom) - 2px thick, gray-300
          "h-[56px] px-[20px] py-[10px] align-middle font-semibold text-black border-b-2 border-r-2 border-gray-300 bg-[#FFFFFF] whitespace-nowrap text-center",
          // Checkbox column sizing + rounded corner logic
          isCheckbox && "w-[52px] min-w-[52px] max-w-[52px] px-0",
          isCheckbox && "rounded-tl-[9px] overflow-hidden",
          className
        )}
        scope={(props as any).scope ?? "col"}
        aria-sort={ariaSort}
        onClick={sortable && onSort ? onSort : undefined}
        {...props}
      >
        {sortable ? (
          <button
            type="button"
            className="flex items-center justify-center gap-2 w-full h-full cursor-pointer group"
            onClick={onSort}
          >
            {children}
            <div className="flex items-center justify-center" aria-hidden="true">
              {sortDirection === "asc" ? (
                <ChevronUp className="w-4 h-4 text-black" />
              ) : sortDirection === "desc" ? (
                <ChevronDown className="w-4 h-4 text-black" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-300 opacity-50 group-hover:opacity-100 transition-opacity" />
              )}
            </div>
          </button>
        ) : (
          children
        )}
      </th>
    )
  }
)
TableHead.displayName = "TableHead"
TableHead.displayName = "TableHead"

export const TableCell = React.forwardRef<
  HTMLTableCellElement,
  { fixed?: boolean; variant?: CellVariant } & React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, fixed, variant = "default", ...props }, outerRef) => {
  const { ref, style } = useStickyOffset(fixed)
  const isCheckbox = variant === "checkbox"

  return (
    <td
      ref={mergeRefs(ref, outerRef)}
      style={{ ...style, ...props.style } as React.CSSProperties}
      className={cn(
        // ✅ Bold borders (right and bottom) - 2px thick, gray-300
        "h-[56px] px-[20px] py-[10px] align-middle whitespace-nowrap text-black text-left border-b-2 border-r-2 border-gray-300 bg-[#FFFFFF] group-hover:bg-gray-50",
        // Checkbox column sizing
        isCheckbox && "w-[52px] min-w-[52px] max-w-[52px] px-0 text-center",
        isCheckbox && "rounded-l-[9px] overflow-hidden",
        className
      )}
      {...props}
    />
  )
})
TableCell.displayName = "TableCell"
