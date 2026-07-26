import axios, {
  AxiosRequestConfig,
  type InternalAxiosRequestConfig,
  type AxiosHeaders,
  type AxiosRequestHeaders,
} from "axios";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://api.fidem.com";
export const API_BASE_URL2 =
  process.env.NEXT_PUBLIC_API_URL2 || "https://api.sharemitra.com";
export const ADMIN_API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || API_BASE_URL;

export const TOKEN_KEY = "token";

const GENERIC_AXIOS_STATUS_MESSAGE = /^Request failed with status code \d+$/i;

const isFormData = (data: any): boolean =>
  typeof FormData !== "undefined" && data instanceof FormData;

const stripContentType = (headers: any) => {
  if (!headers) return headers;

  try {
    if (typeof headers.delete === "function") {
      headers.delete("Content-Type");
      headers.delete("content-type");
      return headers;
    }
  } catch { }

  const h = { ...(headers as any) };
  delete h["Content-Type"];
  delete h["content-type"];
  return h;
};

const attachBearer = (
  config: InternalAxiosRequestConfig,
  token: string
): InternalAxiosRequestConfig => {
  const hdrs = config.headers as AxiosHeaders | AxiosRequestHeaders | undefined;

  if (hdrs && typeof (hdrs as any).set === "function") {
    (hdrs as AxiosHeaders).set("Authorization", `Bearer ${token}`);
  } else {
    config.headers = {
      ...(hdrs as any),
      Authorization: `Bearer ${token}`,
    } as AxiosRequestHeaders;
  }

  return config;
};

const hasAuthHeader = (headers: any) => {
  if (!headers) return false;

  try {
    if (typeof headers.get === "function") {
      return !!headers.get("Authorization") || !!headers.get("authorization");
    }
  } catch { }

  return !!headers.Authorization || !!headers.authorization;
};

/**
 * Only force logout on 401.
 *
 * 403 usually means the logged-in user is not allowed to access one endpoint,
 * not that the whole session is invalid. Logging out on 403 caused influencer
 * users to bounce back to /influencer/login after dashboard API calls.
 */
const shouldForceLogout = (status?: number) => status === 401;

function firstMeaningfulString(...values: any[]): string {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
}

function readMessageFromPayload(payload: any): string {
  if (!payload) return "";

  if (typeof payload === "string") {
    return payload.trim();
  }

  if (Array.isArray(payload)) {
    for (const item of payload) {
      const nested = readMessageFromPayload(item);
      if (nested) return nested;
    }

    return "";
  }

  if (typeof payload === "object") {
    const direct = firstMeaningfulString(
      payload.message,
      payload.error,
      payload.detail,
      payload.title,
      payload.reason
    );

    if (direct) return direct;

    const nested = firstMeaningfulString(
      readMessageFromPayload(payload.details),
      readMessageFromPayload(payload.data),
      readMessageFromPayload(payload.errors)
    );

    if (nested) return nested;
  }

  return "";
}

export async function getApiErrorMessage(
  error: any,
  fallback = "Something went wrong"
): Promise<string> {
  if (typeof error === "string" && error.trim()) {
    return error.trim();
  }

  const responseData = error?.response?.data;

  if (typeof Blob !== "undefined" && responseData instanceof Blob) {
    try {
      const text = await responseData.text();

      if (text?.trim()) {
        try {
          const json = JSON.parse(text);
          const parsedMessage = readMessageFromPayload(json);
          if (parsedMessage) return parsedMessage;
        } catch { }

        return text.trim();
      }
    } catch { }
  }

  const payloadMessage = readMessageFromPayload(responseData);
  if (payloadMessage) return payloadMessage;

  const genericMessage = firstMeaningfulString(
    error?.message,
    error?.response?.statusText
  );

  if (genericMessage && !GENERIC_AXIOS_STATUS_MESSAGE.test(genericMessage)) {
    return genericMessage;
  }

  if (error?.code === "ERR_NETWORK") {
    return "Network error. Please check your internet connection or API server.";
  }

  return fallback;
}

function getLoginPathForCurrentRoute() {
  if (typeof window === "undefined") return "/admin/login";

  const pathname = window.location.pathname;

  if (pathname.startsWith("/influencer")) return "/influencer/login";
  if (pathname.startsWith("/brand")) return "/brand/login";
  if (pathname.startsWith("/admin")) return "/admin/login";

  return "/admin/login";
}

function isAuthRoute() {
  if (typeof window === "undefined") return false;

  const pathname = window.location.pathname;

  return (
    pathname === "/admin/login" ||
    pathname === "/brand/login" ||
    pathname === "/brand/signup" ||
    pathname === "/brand/forgot-password" ||
    pathname.startsWith("/brand/onboarding") ||
    pathname === "/influencer/login" ||
    pathname === "/influencer/signup" ||
    pathname === "/influencer/forgot-password" ||
    pathname.startsWith("/influencer/onboarding")
  );
}

export const forceLogout = () => {
  if (typeof window === "undefined") return;

  if (isAuthRoute()) return;

  const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  const loginPath = getLoginPathForCurrentRoute();
  const paramName = loginPath === "/admin/login" ? "next" : "returnUrl";

  /**
   * Important:
   * Do not clear localStorage here.
   *
   * The redirect loop happened because a dashboard request failed and this
   * interceptor cleared token/influencerId before redirecting. Keeping storage
   * intact lets us verify whether the API request is actually unauthorized
   * without creating a login/dashboard bounce.
   *
   * Clear storage explicitly from the logout button instead.
   */

  try {
    window.dispatchEvent(new CustomEvent("auth:logout"));
  } catch {}

  if (window.location.pathname !== loginPath) {
    window.location.replace(
      `${loginPath}?${paramName}=${encodeURIComponent(currentPath)}`
    );
  }
};

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: { Accept: "application/json" },
  timeout: 40000,
});

const api2 = axios.create({
  baseURL: API_BASE_URL2,
  withCredentials: true,
  headers: { Accept: "application/json" },
  timeout: 40000,
});

const adminApi = axios.create({
  baseURL: ADMIN_API_BASE_URL,
  withCredentials: true,
  headers: { Accept: "application/json" },
  timeout: 40000,
});

const attachAuthPrimary = (
  config: InternalAxiosRequestConfig
): InternalAxiosRequestConfig => {
  if (isFormData((config as any).data)) {
    config.headers = stripContentType(config.headers) as any;
  }

  if (hasAuthHeader(config.headers)) return config;

  if (typeof window !== "undefined") {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      if (token) return attachBearer(config, token);
    } catch { }
  }

  return config;
};

const attachAuthSecondary = (
  config: InternalAxiosRequestConfig
): InternalAxiosRequestConfig => {
  if (isFormData((config as any).data)) {
    config.headers = stripContentType(config.headers) as any;
  }

  if (hasAuthHeader(config.headers)) return config;

  if (typeof window !== "undefined") {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      if (token) return attachBearer(config, token);
    } catch { }
  }

  return config;
};

api.interceptors.request.use(attachAuthPrimary);
api2.interceptors.request.use(attachAuthSecondary);
adminApi.interceptors.request.use(attachAuthPrimary);

const onResponseErrorPrimary = (err: any) => {
  const status = err?.response?.status;

  // if (shouldForceLogout(status) && !isAuthRoute()) {
  //   forceLogout();
  // }

  return Promise.reject(err);
};

const onResponseErrorSecondary = (err: any) => Promise.reject(err);

const onResponseErrorAdmin = (err: any) => {
  const status = err?.response?.status;

  // if (shouldForceLogout(status) && !isAuthRoute()) {
  //   forceLogout();
  // }

  return Promise.reject(err);
};

api.interceptors.response.use((r) => r, onResponseErrorPrimary);
api2.interceptors.response.use((r) => r, onResponseErrorSecondary);
adminApi.interceptors.response.use((r) => r, onResponseErrorAdmin);

if (typeof window !== "undefined") {
  try {
    const pageIsHTTPS = window.location.protocol === "https:";

    if (pageIsHTTPS && /^http:\/\//i.test(API_BASE_URL)) {
      console.warn(
        "[api] Page is HTTPS but NEXT_PUBLIC_API_URL is HTTP. This causes mixed-content blocking (Network Error). Use an HTTPS API endpoint or a same-origin relative path."
      );
    }
  } catch { }
}

export const get = async <T = any>(url: string, params?: any): Promise<T> => {
  const res = await api.get<T>(url, { params });
  return res.data;
};

export const getBlob = async (
  url: string,
  params?: any,
  config: AxiosRequestConfig = {}
): Promise<Blob> => {
  const res = await api.get(url, {
    ...config,
    params,
    responseType: "blob",
  });

  return res.data as Blob;
};

export const post = async <T = any>(
  url: string,
  data?: any,
  config: AxiosRequestConfig = {}
): Promise<T> => {
  const finalConfig: AxiosRequestConfig = { ...config };

  if (isFormData(data)) {
    finalConfig.headers = stripContentType(finalConfig.headers) as any;
  }

  const res = await api.post<T>(url, data, finalConfig);
  return res.data;
};

export const patch = async <T = any>(
  url: string,
  data?: any,
  config: AxiosRequestConfig = {}
): Promise<T> => {
  const finalConfig: AxiosRequestConfig = { ...config };

  if (isFormData(data)) {
    finalConfig.headers = stripContentType(finalConfig.headers) as any;
  }

  const res = await api.patch<T>(url, data, finalConfig);
  return res.data;
};

export const postFormData = async <T = any>(
  url: string,
  formData: FormData,
  opts?: { signal?: AbortSignal }
): Promise<T> => {
  const res = await api.post<T>(url, formData, {
    signal: opts?.signal,
  });

  return res.data;
};

export const get2 = async <T = any>(url: string, params?: any): Promise<T> => {
  const res = await api2.get<T>(url, { params });
  return res.data;
};

export const getBlob2 = async (
  url: string,
  params?: any,
  config: AxiosRequestConfig = {}
): Promise<Blob> => {
  const res = await api2.get(url, {
    ...config,
    params,
    responseType: "blob",
  });

  return res.data as Blob;
};

export const post2 = async <T = any>(
  url: string,
  data?: any,
  opts?: { signal?: AbortSignal }
): Promise<T> => {
  const baseConfig: AxiosRequestConfig = { signal: opts?.signal };

  if (isFormData(data)) {
    baseConfig.headers = stripContentType(baseConfig.headers) as any;
  }

  const res = await api2.post<T>(url, data, baseConfig);
  return res.data;
};

export const postFormData2 = async <T = any>(
  url: string,
  formData: FormData,
  opts?: { signal?: AbortSignal }
): Promise<T> => {
  const res = await api2.post<T>(url, formData, {
    signal: opts?.signal,
  });

  return res.data;
};

export const adminGet = async <T = any>(
  url: string,
  params?: any
): Promise<T> => {
  const res = await adminApi.get<T>(url, { params });
  return res.data;
};

export const adminGetBlob = async (
  url: string,
  params?: any,
  config: AxiosRequestConfig = {}
): Promise<Blob> => {
  const res = await adminApi.get(url, {
    ...config,
    params,
    responseType: "blob",
  });

  return res.data as Blob;
};

export const adminPost = async <T = any>(
  url: string,
  data?: any,
  config: AxiosRequestConfig = {}
): Promise<T> => {
  const finalConfig: AxiosRequestConfig = { ...config };

  if (isFormData(data)) {
    finalConfig.headers = stripContentType(finalConfig.headers) as any;
  }

  const res = await adminApi.post<T>(url, data, finalConfig);
  return res.data;
};

export const adminPut = async <T = any>(
  url: string,
  data?: any,
  config: AxiosRequestConfig = {}
): Promise<T> => {
  const finalConfig: AxiosRequestConfig = { ...config };

  if (isFormData(data)) {
    finalConfig.headers = stripContentType(finalConfig.headers) as any;
  }

  const res = await adminApi.put<T>(url, data, finalConfig);
  return res.data;
};

export const adminPatch = async <T = any>(
  url: string,
  data?: any,
  config: AxiosRequestConfig = {}
): Promise<T> => {
  const finalConfig: AxiosRequestConfig = { ...config };

  if (isFormData(data)) {
    finalConfig.headers = stripContentType(finalConfig.headers) as any;
  }

  const res = await adminApi.patch<T>(url, data, finalConfig);
  return res.data;
};

export const adminDelete = async <T = any>(
  url: string,
  data?: any,
  config: AxiosRequestConfig = {}
): Promise<T> => {
  const finalConfig: AxiosRequestConfig = { ...config, data };

  if (isFormData(data)) {
    finalConfig.headers = stripContentType(finalConfig.headers) as any;
  }

  const res = await adminApi.delete<T>(url, finalConfig);
  return res.data;
};

export const adminPostFormData = async <T = any>(
  url: string,
  formData: FormData,
  opts?: { signal?: AbortSignal }
): Promise<T> => {
  const res = await adminApi.post<T>(url, formData, {
    signal: opts?.signal,
  });

  return res.data;
};

export const adminUpload = adminPostFormData;
export const adminDownload = adminGetBlob;

export const downloadBlob = async (
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<Blob> => {
  const opts: AxiosRequestConfig = { responseType: "blob", ...config };

  if (isFormData(data)) {
    opts.headers = stripContentType(opts.headers) as any;
  }

  const response = await api.post<Blob>(url, data, opts);
  return response.data;
};

export const downloadBlob2 = async (
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<Blob> => {
  const opts: AxiosRequestConfig = { responseType: "blob", ...config };

  if (isFormData(data)) {
    opts.headers = stripContentType(opts.headers) as any;
  }

  const response = await api2.post<Blob>(url, data, opts);
  return response.data;
};

export const adminDownloadBlob = async (
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<Blob> => {
  const opts: AxiosRequestConfig = { responseType: "blob", ...config };

  if (isFormData(data)) {
    opts.headers = stripContentType(opts.headers) as any;
  }

  const response = await adminApi.post<Blob>(url, data, opts);
  return response.data;
};

export const setToken = (token: string) => {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch { }
};

export const getToken = (): string | null => {
  if (typeof window === "undefined") return null;

  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const clearToken = () => {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch { }
};
function buildApiUrl(baseUrl: string, endpoint: string) {
  const base = String(baseUrl || "").replace(/\/+$/, "");
  const path = String(endpoint || "").startsWith("/")
    ? String(endpoint || "")
    : `/${String(endpoint || "")}`;

  return `${base}${path}`;
}

export async function adminPostBlob(
  endpoint: string,
  body?: unknown
): Promise<Blob> {
  const baseUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    "";

  const response = await fetch(buildApiUrl(baseUrl, endpoint), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(body || {}),
  });

  if (!response.ok) {
    let message = "Request failed.";

    try {
      const errorData = await response.json();
      message = errorData?.message || errorData?.error || message;
    } catch {
      // PDF/blob endpoints may not return JSON errors.
    }

    throw new Error(message);
  }

  return response.blob();
}
export default api;
export { api2, adminApi };
