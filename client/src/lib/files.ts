// lib/files.ts
import { API_BASE_URL } from "./api";

export const API_BASE = (API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");

const isAbsoluteUrl = (value: string) => /^https?:\/\//i.test(value);
const isDataOrBlob = (value: string) => /^(data:|blob:)/i.test(value);

const joinBase = (path: string) => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  if (!API_BASE) return normalizedPath;
  return `${API_BASE}${normalizedPath}`;
};

/**
 * Convert a stored GridFS filename or relative path into a fully-qualified URL.
 * Falls back when the API base URL isn't configured.
 */
export const resolveFileUrl = (input?: string | null): string => {
  const raw = (input || "").trim();
  if (!raw) return "";
  if (isAbsoluteUrl(raw) || isDataOrBlob(raw)) return raw;

  if (raw.startsWith("/file/")) return API_BASE ? `${API_BASE}${raw}` : raw;
  if (raw.startsWith("file/"))  return joinBase(`/${raw}`);

  const encoded = encodeURIComponent(raw);
  return joinBase(`/file/${encoded}`);
};

export const resolveFileList = (values?: Array<string | null | undefined>): string[] => {
  if (!Array.isArray(values)) return [];
  const out: string[] = [];
  values.forEach((v) => {
    const u = resolveFileUrl(v);
    if (u) out.push(u);
  });
  return out;
};

export const fileUrl = resolveFileUrl;

export const isPdfHref  = (href: string) => /\.pdf(?:$|[?#])/i.test(href);
export const isPdfMime  = (mime?: string) => (mime || "").toLowerCase().includes("pdf");
export const isImageMime = (mime?: string) => (mime || "").startsWith("image/");
export const isVideoMime = (mime?: string) => (mime || "").startsWith("video/");

export const withDownload = (href: string) => href.includes("?") ? `${href}&download=1` : `${href}?download=1`;

export async function downloadByHref(src: string, filename = "download") {
  try {
    const res = await fetch(src, { credentials: "include" });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename || src.split("/").pop() || "download";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error("download failed", err);
    window.open(src, "_blank", "noopener,noreferrer");
  }
}

export function getWsUrl() {
  const base = API_BASE || (typeof window !== "undefined" ? window.location.origin : "");
  if (!base) return "wss://api.fidem.com/ws";

  const u = new URL(base);
  u.protocol = u.protocol === "https:" ? "wss:" : "ws:";
  u.pathname = "/ws";
  return u.toString();
}