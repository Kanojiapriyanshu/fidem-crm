"use client";

import { useCallback, useState } from "react";
import type { Platform as ReportPlatform } from "./types";
import { post2 } from "@/lib/api";

interface UseEmailStatus {
  exists: boolean | null;
  email: string | null;
  loading: boolean;
  error: string | null;
  checkStatus: (handle: string, platform: ReportPlatform) => Promise<void>;
}

type EmailStatusResponse =
  | {
      status: 0 | 1;
      email?: string;
      handle?: string;
      platform?: ReportPlatform;
    }
  | { status: "error"; message?: string };

export function useEmailStatus(): UseEmailStatus {
  const [exists, setExists] = useState<boolean | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkStatus = useCallback(async (handle: string, platform: ReportPlatform) => {
    try {
      setLoading(true);
      setError(null);

      const normalized = `@${String(handle).replace(/^@/, "").trim().toLowerCase()}`;
      const data = await post2<EmailStatusResponse>("/email/status", {
        handle: normalized,
        platform,
      });

      if (typeof (data as any)?.status === "number") {
        const status = (data as { status: number; email?: string }).status;
        setExists(status === 1);
        setEmail((data as any)?.email ?? null);
      } else {
        throw new Error((data as any)?.message || "Unknown error");
      }
    } catch (error: any) {
      setError(error?.message || "Failed to check email status");
      setExists(null);
      setEmail(null);
    } finally {
      setLoading(false);
    }
  }, []);

  return { exists, email, loading, error, checkStatus };
}
