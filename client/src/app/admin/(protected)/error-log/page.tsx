"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { get } from "@/lib/api";
import { toast, ToastStyles } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  FileWarning,
} from "lucide-react";

type ErrorLog = {
  _id: string;
  message?: string;
  name?: string;
  statusCode?: number;
  errorCode?: string | null;
  method?: string;
  url?: string;
  ip?: string;
  userAgent?: string;
  role?: string | null;
  adminId?: string | null;
  brandId?: string | null;
  influencerId?: string | null;
  userId?: string | null;
  actorEmail?: string | null;
  tokenAvailable?: boolean;
  requestBody?: Record<string, unknown>;
  requestParams?: Record<string, unknown>;
  requestQuery?: Record<string, unknown>;
  environment?: string;
  stack?: string;
  createdAt?: string;
  updatedAt?: string;
};

type ErrorLogListResp = {
  success?: boolean;
  totalLogs?: number;
  currentPage?: number;
  totalPages?: number;
  logs?: ErrorLog[];
};

type ApiErrorLike = {
  message?: unknown;
  error?: unknown;
  errors?: unknown;
  detail?: unknown;
  data?: unknown;
  statusText?: unknown;
  response?: {
    data?: unknown;
    statusText?: unknown;
  };
};

const pageSize = 10;

const STATUS_COLORS: Record<number, string> = {
  400: "bg-amber-50 text-amber-700 border border-amber-200",
  401: "bg-orange-50 text-orange-700 border border-orange-200",
  403: "bg-orange-50 text-orange-700 border border-orange-200",
  404: "bg-gray-100 text-gray-700 border border-gray-200",
  409: "bg-purple-50 text-purple-700 border border-purple-200",
  422: "bg-amber-50 text-amber-700 border border-amber-200",
  500: "bg-red-50 text-red-600 border border-red-200",
};

function normalizeErrorValue(value: unknown): string {
  if (!value) return "";

  if (typeof value === "string") {
    return value.trim();
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => normalizeErrorValue(item))
      .filter(Boolean)
      .join(", ");
  }

  if (typeof value === "object") {
    const objectValue = value as Record<string, unknown>;

    const directMessage =
      normalizeErrorValue(objectValue.message) ||
      normalizeErrorValue(objectValue.error) ||
      normalizeErrorValue(objectValue.detail) ||
      normalizeErrorValue(objectValue.msg);

    if (directMessage) return directMessage;

    return Object.entries(objectValue)
      .map(([key, item]) => {
        const itemMessage = normalizeErrorValue(item);
        return itemMessage ? `${key}: ${itemMessage}` : "";
      })
      .filter(Boolean)
      .join(", ");
  }

  return "";
}

function getErrorMessage(error: unknown, fallback: string) {
  const err = error as ApiErrorLike | undefined;

  const candidates = [
    err?.response?.data,
    err?.data,
    err?.errors,
    err?.error,
    err?.detail,
    err?.message,
    err?.response?.statusText,
    err?.statusText,
    error,
  ];

  for (const candidate of candidates) {
    const message = normalizeErrorValue(candidate);
    if (message) return message;
  }

  return fallback;
}

function showErrorToast(title: string, error: unknown, fallback: string) {
  toast({
    icon: "error",
    title,
    text: getErrorMessage(error, fallback),
    timer: 4000,
  });
}

function HeaderCarets() {
  const cls = "h-3 w-3 text-[#343330]";

  return (
    <span className="ml-1 flex flex-col items-center leading-none">
      <ChevronUp className={cls} strokeWidth={3} />
      <ChevronDown className={cls} strokeWidth={3} />
    </span>
  );
}

const formatDateTime = (value?: string) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const shortText = (value?: string | null, max = 42) => {
  const text = String(value || "").trim();
  if (!text) return "—";
  return text.length > max ? `${text.slice(0, max)}...` : text;
};

const getStatusClass = (statusCode?: number) => {
  if (!statusCode) {
    return "bg-gray-100 text-gray-600 border border-gray-200";
  }

  return (
    STATUS_COLORS[statusCode] ||
    (statusCode >= 500
      ? "bg-red-50 text-red-600 border border-red-200"
      : "bg-amber-50 text-amber-700 border border-amber-200")
  );
};

export default function AdminErrorLogsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<ErrorLog[]>([]);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();

      params.set("page", String(page));
      params.set("limit", String(pageSize));

      const data = await get<ErrorLogListResp>(`/error-logs?${params.toString()}`);

      setRows(data.logs || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.totalLogs || 0);
    } catch (e) {
      const message = getErrorMessage(e, "Failed to load error logs.");
      setError(message);
      setRows([]);
      setTotalPages(1);
      setTotal(0);

      showErrorToast("Error logs loading failed", e, "Failed to load error logs.");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  const pageNumbers = useMemo(() => {
    const pages: number[] = [];
    const maxButtons = 5;
    let start = Math.max(1, page - Math.floor(maxButtons / 2));
    let end = Math.min(totalPages, start + maxButtons - 1);
    start = Math.max(1, end - maxButtons + 1);

    for (let i = start; i <= end; i++) pages.push(i);

    return pages;
  }, [page, totalPages]);

  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  const col = {
    error: "min-w-0 flex-[2.25_1_0%]",
    code: "min-w-[12rem] flex-[0_0_12rem] shrink-0",
    method: "min-w-[5.5rem] flex-[0_0_5.5rem] shrink-0",
    status: "min-w-[6.5rem] flex-[0_0_6.5rem] shrink-0",
    url: "min-w-0 flex-[1.55_1_0%]",
    role: "min-w-[8rem] flex-[0_0_8rem] shrink-0",
    user: "min-w-[12rem] flex-[0_0_12rem] shrink-0",
    date: "min-w-[9rem] flex-[0_0_9rem] shrink-0",
  };

  const headerCell =
    "flex min-w-0 w-full items-center justify-between gap-2 text-sm font-semibold text-[#1A1A1A]";

  return (
    <>
      <ToastStyles />

      <div className="mx-auto max-w-[100rem] min-w-0 overflow-hidden p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[#1A1A1A]">Error Logs</h1>
            <p className="mt-1 text-sm text-gray-500">
              Backend API error list only
            </p>
          </div>

          <Button
            className="!h-[2.5rem] !rounded-[0.75rem] !bg-[#1A1A1A] !px-5 text-white hover:!bg-[#2A2A2A]"
            onClick={load}
            disabled={loading}
          >
            Refresh
          </Button>
        </div>

        <div className="w-full overflow-x-auto overflow-y-visible">
          <div className="mt-[1.5rem] min-w-[86rem] w-full pb-[2rem]">
            <div className="flex h-12 items-center rounded-lg bg-[#E6E6E6] px-3">
              <div className={`${col.error} pl-2 pr-3`}>
                <div className={headerCell}>
                  <span className="min-w-0 truncate">Error Message</span>
                  <HeaderCarets />
                </div>
              </div>

              <div className={`${col.code} px-1.5`}>
                <div className={headerCell}>
                  <span>Error Code</span>
                  <HeaderCarets />
                </div>
              </div>

              <div className={`${col.method} px-1.5`}>
                <div className={headerCell}>
                  <span>Method</span>
                  <HeaderCarets />
                </div>
              </div>

              <div className={`${col.status} px-1.5`}>
                <div className={headerCell}>
                  <span>Status</span>
                  <HeaderCarets />
                </div>
              </div>

              <div className={`${col.url} px-1.5`}>
                <div className={headerCell}>
                  <span className="min-w-0 truncate">API URL</span>
                  <HeaderCarets />
                </div>
              </div>

              <div className={`${col.role} px-1.5`}>
                <div className={headerCell}>
                  <span>Role</span>
                  <HeaderCarets />
                </div>
              </div>

              <div className={`${col.user} px-1.5`}>
                <div className={headerCell}>
                  <span>User / Actor</span>
                  <HeaderCarets />
                </div>
              </div>

              <div className={`${col.date} px-1.5`}>
                <div className={headerCell}>
                  <span>Created</span>
                  <HeaderCarets />
                </div>
              </div>
            </div>

            <div className="mt-[2rem] flex flex-col gap-[0.75rem]">
              {loading &&
                Array.from({ length: 5 }).map((_, index) => (
                  <div
                    key={index}
                    className="flex h-[5rem] items-center rounded-lg border border-[#D6D6D6] bg-white px-3 animate-pulse"
                  >
                    <div className={`${col.error} space-y-2 pl-2 pr-3`}>
                      <div className="h-3.5 w-3/4 rounded bg-gray-200" />
                      <div className="h-3 w-1/2 rounded bg-gray-100" />
                    </div>

                    <div className={`${col.code} px-1.5`}>
                      <div className="h-3.5 w-24 rounded bg-gray-200" />
                    </div>

                    <div className={`${col.method} px-1.5`}>
                      <div className="h-6 w-14 rounded-full bg-gray-200" />
                    </div>

                    <div className={`${col.status} px-1.5`}>
                      <div className="h-6 w-16 rounded-full bg-gray-200" />
                    </div>

                    <div className={`${col.url} px-1.5`}>
                      <div className="h-3.5 w-3/4 rounded bg-gray-200" />
                    </div>

                    <div className={`${col.role} px-1.5`}>
                      <div className="h-6 w-20 rounded-full bg-gray-200" />
                    </div>

                    <div className={`${col.user} px-1.5`}>
                      <div className="h-3.5 w-24 rounded bg-gray-200" />
                    </div>

                    <div className={`${col.date} px-1.5`}>
                      <div className="h-3.5 w-24 rounded bg-gray-200" />
                    </div>
                  </div>
                ))}

              {!loading && error && (
                <div className="flex flex-col items-center justify-center gap-3 py-20 text-red-500">
                  <AlertCircle className="size-8" />
                  <p className="text-sm font-medium">{error}</p>

                  <button
                    onClick={load}
                    className="text-xs text-[#1A1A1A] underline hover:opacity-70"
                  >
                    Try again
                  </button>
                </div>
              )}

              {!loading && !error && rows.length === 0 && (
                <div className="flex flex-col items-center justify-center gap-3 py-20 text-[#888]">
                  <FileWarning className="size-9" />
                  <p className="text-sm font-medium">No error logs found</p>
                </div>
              )}

              {!loading &&
                !error &&
                rows.map((row) => {
                  const actor =
                    row.actorEmail ||
                    row.adminId ||
                    row.brandId ||
                    row.influencerId ||
                    row.userId ||
                    "—";

                  return (
                    <div
                      key={row._id}
                      className="flex min-h-[5rem] items-center rounded-lg border border-[#D6D6D6] bg-white px-3 py-3 transition-colors hover:bg-[#FAFAFA]"
                    >
                      <div className={`${col.error} min-w-0 overflow-hidden pl-2 pr-3`}>
                        <div
                          title={row.message || ""}
                          className="max-w-full truncate font-medium text-[#1A1A1A]"
                        >
                          {row.message || "Unknown error"}
                        </div>

                        <div
                          title={row.name || ""}
                          className="mt-0.5 max-w-full truncate text-xs text-gray-400"
                        >
                          {row.name || "Error"} • {row.environment || "development"}
                        </div>
                      </div>

                      <div className={`${col.code} min-w-0 px-1.5`}>
                        <div
                          title={row.errorCode || ""}
                          className="max-w-full truncate font-mono text-xs text-gray-600"
                        >
                          {row.errorCode || "—"}
                        </div>
                      </div>

                      <div className={`${col.method} px-1.5`}>
                        <span className="rounded-full bg-[#F3F3F3] px-2.5 py-1 text-xs font-semibold text-[#1A1A1A]">
                          {row.method || "—"}
                        </span>
                      </div>

                      <div className={`${col.status} px-1.5`}>
                        <span
                          className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClass(row.statusCode)}`}
                        >
                          {row.statusCode || "—"}
                        </span>
                      </div>

                      <div className={`${col.url} min-w-0 overflow-hidden px-1.5`}>
                        <div
                          title={row.url || ""}
                          className="max-w-full truncate font-mono text-xs text-gray-600"
                        >
                          {row.url || "—"}
                        </div>
                      </div>

                      <div className={`${col.role} px-1.5`}>
                        {row.role ? (
                          <span className="rounded-full bg-[#F3F3F3] px-2.5 py-1 text-xs font-medium capitalize text-[#1A1A1A]">
                            {row.role.replace(/_/g, " ")}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </div>

                      <div className={`${col.user} min-w-0 overflow-hidden px-1.5`}>
                        <div
                          title={String(actor)}
                          className="max-w-full truncate text-xs text-gray-600"
                        >
                          {shortText(String(actor), 28)}
                        </div>
                      </div>

                      <div className={`${col.date} whitespace-nowrap px-1.5 text-sm text-gray-500`}>
                        {formatDateTime(row.createdAt)}
                      </div>
                    </div>
                  );
                })}
            </div>

            {!loading && !error && totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Showing{" "}
                  <span className="font-medium text-[#1A1A1A]">
                    {from}–{to}
                  </span>{" "}
                  of{" "}
                  <span className="font-medium text-[#1A1A1A]">{total}</span>
                </p>

                <div className="flex items-center gap-1">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E2E2E2] text-[#1A1A1A] transition-colors hover:bg-[#F5F5F5] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft className="size-4" />
                  </button>

                  {pageNumbers.map((pageNumber) => (
                    <button
                      key={pageNumber}
                      onClick={() => setPage(pageNumber)}
                      className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm transition-colors ${
                        pageNumber === page
                          ? "bg-[#1A1A1A] font-semibold text-white"
                          : "border border-[#E2E2E2] text-[#1A1A1A] hover:bg-[#F5F5F5]"
                      }`}
                    >
                      {pageNumber}
                    </button>
                  ))}

                  <button
                    disabled={page >= totalPages}
                    onClick={() =>
                      setPage((prev) =>
                        prev >= totalPages ? totalPages : prev + 1
                      )
                    }
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E2E2E2] text-[#1A1A1A] transition-colors hover:bg-[#F5F5F5] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronRight className="size-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
