"use client";

import React from "react";
import { HiChevronLeft, HiChevronRight } from "react-icons/hi";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const DEFAULT_ROW_OPTIONS = [10, 20, 50, 100] as const;

type AdminPaginationProps = {
  page: number;
  totalPages: number;
  totalItems: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  rowOptions?: readonly number[];
  loading?: boolean;
  className?: string;
  showRowsSelector?: boolean;
  showSummary?: boolean;
};

function getPageNumbers(currentPage: number, totalPages: number) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  if (currentPage <= 3) {
    return [1, 2, 3, 4, "dots-right", totalPages] as const;
  }

  if (currentPage >= totalPages - 2) {
    return [1, "dots-left", totalPages - 3, totalPages - 2, totalPages - 1, totalPages] as const;
  }

  return [1, "dots-left", currentPage - 1, currentPage, currentPage + 1, "dots-right", totalPages] as const;
}

const AdminPagination = ({
  page,
  totalPages,
  totalItems,
  limit,
  onPageChange,
  onLimitChange,
  rowOptions = DEFAULT_ROW_OPTIONS,
  loading = false,
  className,
  showRowsSelector = true,
  showSummary = true,
}: AdminPaginationProps) => {
  const safePage = Math.max(1, page);
  const safeTotalPages = Math.max(1, totalPages);

  const showingFrom = totalItems === 0 ? 0 : (safePage - 1) * limit + 1;
  const showingTo = Math.min(safePage * limit, totalItems);

  const pageNumbers = getPageNumbers(safePage, safeTotalPages);

  if (totalItems === 0) return null;

  return (
    <div
      className={cn(
        "flex flex-col gap-4 border-t border-slate-200 px-5 py-4 lg:flex-row lg:items-center lg:justify-between",
        className
      )}
    >
      {showSummary ? (
        <div className="text-sm font-semibold text-slate-500">
          Showing <span className="font-extrabold text-slate-800">{showingFrom}</span>–
          <span className="font-extrabold text-slate-800">{showingTo}</span> of{" "}
          <span className="font-extrabold text-slate-800">{totalItems}</span>
        </div>
      ) : (
        <div />
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {showRowsSelector && onLimitChange ? (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-500">Rows</span>
            <div className="flex items-center gap-1 rounded-2xl border border-slate-200 bg-slate-50 p-1">
              {rowOptions.map((rows) => (
                <Button
                  key={rows}
                  size="sm"
                  variant={limit === rows ? "default" : "ghost"}
                  disabled={loading}
                  className={cn(
                    "h-8 rounded-xl px-3 text-xs font-bold",
                    limit === rows
                      ? "bg-teal-600 text-white hover:bg-teal-600"
                      : "text-slate-600 hover:bg-white"
                  )}
                  onClick={() => onLimitChange(rows)}
                >
                  {rows}
                </Button>
              ))}
            </div>
          </div>
        ) : null}

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            disabled={loading || safePage === 1}
            onClick={() => onPageChange(Math.max(1, safePage - 1))}
            className="rounded-full"
          >
            <HiChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-1">
            {pageNumbers.map((item, index) => {
              if (typeof item !== "number") {
                return (
                  <span
                    key={`${item}-${index}`}
                    className="px-2 text-sm font-bold text-slate-400"
                  >
                    ...
                  </span>
                );
              }

              const isActive = item === safePage;

              return (
                <Button
                  key={item}
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  disabled={loading}
                  onClick={() => onPageChange(item)}
                  className={cn(
                    "h-9 min-w-[36px] rounded-xl px-3 text-xs font-bold",
                    isActive
                      ? "bg-teal-600 text-white hover:bg-teal-600"
                      : "border-slate-200 text-slate-700"
                  )}
                >
                  {item}
                </Button>
              );
            })}
          </div>

          <Button
            variant="outline"
            size="icon"
            disabled={loading || safePage >= safeTotalPages}
            onClick={() => onPageChange(Math.min(safeTotalPages, safePage + 1))}
            className="rounded-full"
          >
            <HiChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminPagination;