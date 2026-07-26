"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  Check,
  ChevronRight,
  Loader2,
  Search,
  Settings,
} from "lucide-react";
import { get, post } from "@/lib/api";

type ActionPath =
  | string
  | {
      admin?: string;
      brand?: string;
      influencer?: string;
    };

type AdminNotification = {
  _id: string;
  notificationId?: string;

  brandId?: string | null;
  influencerId?: string | null;
  adminId?: string | null;

  type: string;
  title: string;
  message: string;

  entityType?: string | null;
  entityId?: string | null;
  actionPath?: ActionPath | null;

  actorAdminId?: string | null;
  actorName?: string;
  actorEmail?: string;
  actorRole?: string;

  isRead?: boolean;
  read?: number;
  createdAt?: string;
  updatedAt?: string;
};

type NotificationsResponse =
  | AdminNotification[]
  | {
      success?: boolean;
      data?: AdminNotification[];
      total?: number;
      unread?: number;
      unreadCount?: number;
      page?: number;
      limit?: number;
    };

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function formatSegment(value: string) {
  return value
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function isDynamicIdSegment(segment: string) {
  const value = decodeURIComponent(segment || "").trim();

  if (!value) return true;
  if (/^\d+$/.test(value)) return true;
  if (/^[a-f0-9]{24}$/i.test(value)) return true;

  if (
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value
    )
  ) {
    return true;
  }

  if (/^c[a-z0-9]{20,}$/i.test(value)) return true;
  if (/^[a-z0-9_-]{14,}$/i.test(value) && /\d/.test(value)) return true;

  return false;
}

function isUnread(notification: AdminNotification) {
  if (typeof notification.isRead === "boolean") return !notification.isRead;
  if (typeof notification.read === "number") return notification.read !== 1;
  return false;
}

function formatTime(value?: string) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatTypeLabel(type = "") {
  const value = String(type || "").trim();
  if (!value) return "Notification";

  return value
    .replace(/\./g, " · ")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatRoleLabel(role = "") {
  const value = String(role || "").trim().toLowerCase();

  if (value === "super_admin") return "Super Admin";
  if (value === "revenue_head") return "RH";
  if (value === "bme") return "BME";
  if (value === "ime") return "IME";
  if (value === "sdr") return "SDR";

  return value ? value.replace(/_/g, " ").toUpperCase() : "";
}

function getActorLabel(notification: AdminNotification) {
  const name = String(notification.actorName || "").trim();
  const email = String(notification.actorEmail || "").trim();
  const role = formatRoleLabel(notification.actorRole || "");

  if (name && role) return `${name} (${role})`;
  if (name) return name;
  if (email && role) return `${email} (${role})`;
  if (email) return email;
  if (role) return role;

  return "";
}

function getNotificationInitial(notification: AdminNotification) {
  const actor = getActorLabel(notification);
  const title = String(notification.title || "").trim();

  return (actor || title || "N").charAt(0).toUpperCase();
}

function getNotificationRows(response: NotificationsResponse) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  return [];
}

function getUnreadCount(
  response: NotificationsResponse,
  rows: AdminNotification[]
) {
  if (!Array.isArray(response)) {
    if (typeof response?.unreadCount === "number") return response.unreadCount;
    if (typeof response?.unread === "number") return response.unread;
  }

  return rows.filter(isUnread).length;
}

function sortNotifications(rows: AdminNotification[]) {
  return [...rows].sort((a, b) => {
    const unreadDiff = Number(isUnread(b)) - Number(isUnread(a));
    if (unreadDiff) return unreadDiff;

    const bTime = new Date(b.createdAt || b.updatedAt || 0).getTime();
    const aTime = new Date(a.createdAt || a.updatedAt || 0).getTime();

    return bTime - aTime;
  });
}

function ensureLeadingSlash(path = "") {
  const value = String(path || "").trim();
  if (!value) return "";
  return value.startsWith("/") ? value : `/${value}`;
}

function readQueryParam(path = "", key = "") {
  const query = String(path || "").split("?")[1]?.split("#")[0] || "";
  if (!query) return "";

  return new URLSearchParams(query).get(key) || "";
}

function buildEntityAdminPath(notification: AdminNotification) {
  const entityType = String(notification.entityType || "").trim().toLowerCase();
  const entityId = String(notification.entityId || "").trim();
  const type = String(notification.type || "").trim().toLowerCase();

  if (!entityId && !entityType && !type) return "";

  if (entityType === "brand" && entityId) {
    return `/admin/brands/view?brandId=${encodeURIComponent(entityId)}`;
  }

  if (entityType === "influencer" && entityId) {
    return `/admin/influencers/view?influencerId=${encodeURIComponent(
      entityId
    )}`;
  }

  if (entityType === "campaign" && entityId) {
    return `/admin/crm/campaigns/${encodeURIComponent(entityId)}`;
  }

  if (entityType === "dispute" && entityId) {
    return `/admin/disputes/${encodeURIComponent(entityId)}`;
  }

  if (
    ["group", "group_chat", "team_discussion", "team_discussions"].includes(
      entityType
    ) &&
    entityId
  ) {
    return `/admin/team-discussions/${encodeURIComponent(entityId)}`;
  }

  if (
    entityType.includes("reply") ||
    entityType.includes("thread") ||
    type.includes("reply") ||
    type.includes("thread")
  ) {
    return "/admin/crm/replies";
  }

  if (
    entityType.includes("review") ||
    type.includes("review_queue") ||
    type.includes("review.queue")
  ) {
    return "/admin/crm/review-queue";
  }

  return "";
}

function normalizeAdminActionPath(path = "", notification: AdminNotification) {
  const cleanPath = ensureLeadingSlash(path);
  const fallback = buildEntityAdminPath(notification) || "/admin/notifications";

  if (!cleanPath) return fallback;

  const groupIdFromQuery = readQueryParam(cleanPath, "groupId");
  if (groupIdFromQuery) {
    return `/admin/team-discussions/${encodeURIComponent(groupIdFromQuery)}`;
  }

  const campaignIdFromView = readQueryParam(cleanPath, "id");
  if (cleanPath.startsWith("/admin/crm/campaigns/view") && campaignIdFromView) {
    return `/admin/crm/campaigns/${encodeURIComponent(campaignIdFromView)}`;
  }

  const brandIdFromView = readQueryParam(cleanPath, "brandId");
  if (cleanPath.startsWith("/admin/brands/view") && brandIdFromView) {
    return `/admin/brands/view?brandId=${encodeURIComponent(brandIdFromView)}`;
  }

  const influencerIdFromView = readQueryParam(cleanPath, "influencerId");
  if (cleanPath.startsWith("/admin/influencers/view") && influencerIdFromView) {
    return `/admin/influencers/view?influencerId=${encodeURIComponent(
      influencerIdFromView
    )}`;
  }

  if (
    cleanPath.startsWith("/admin/group-chat") ||
    cleanPath.startsWith("/admin/campaigns?") ||
    cleanPath.startsWith("/admin/crm/campaigns?groupId=")
  ) {
    return fallback;
  }

  if (
    cleanPath.startsWith("/admin/campaigns/replies") ||
    cleanPath.startsWith("/admin/crm/campaigns/replies")
  ) {
    return "/admin/crm/replies";
  }

  if (cleanPath.startsWith("/admin/crm/replies")) {
    return "/admin/crm/replies";
  }

  if (cleanPath.startsWith("/admin/crm/review-queue")) {
    return "/admin/crm/review-queue";
  }

  if (cleanPath.startsWith("/admin/crm/my-accounts")) {
    return "/admin/crm/my-accounts";
  }

  if (cleanPath.startsWith("/admin/team-discussions/")) {
    return cleanPath;
  }

  const legacyBrandMatch = cleanPath.match(/^\/admin\/brands\/([^/?#]+)/);
  if (legacyBrandMatch?.[1] && legacyBrandMatch[1] !== "view") {
    return `/admin/brands/view?brandId=${encodeURIComponent(
      legacyBrandMatch[1]
    )}`;
  }

  const legacyInfluencerMatch = cleanPath.match(
    /^\/admin\/influencers\/([^/?#]+)/
  );
  if (legacyInfluencerMatch?.[1] && legacyInfluencerMatch[1] !== "view") {
    return `/admin/influencers/view?influencerId=${encodeURIComponent(
      legacyInfluencerMatch[1]
    )}`;
  }

  const legacyCampaignMatch = cleanPath.match(/^\/admin\/campaigns\/([^/?#]+)/);
  if (
    legacyCampaignMatch?.[1] &&
    legacyCampaignMatch[1] !== "view" &&
    legacyCampaignMatch[1] !== "replies"
  ) {
    return `/admin/crm/campaigns/${encodeURIComponent(
      legacyCampaignMatch[1]
    )}`;
  }

  if (
    cleanPath.startsWith("/brand") ||
    cleanPath.startsWith("/influencer") ||
    cleanPath === "/"
  ) {
    return fallback;
  }

  if (cleanPath.startsWith("/admin")) {
    return cleanPath;
  }

  return fallback;
}

function getAdminActionPath(notification: AdminNotification) {
  const actionPath = notification.actionPath;

  let rawPath = "";

  if (typeof actionPath === "string") {
    rawPath = actionPath;
  } else if (actionPath && typeof actionPath === "object") {
    rawPath = actionPath.admin || "";
  }

  return normalizeAdminActionPath(rawPath, notification);
}

export default function AdminTopBar() {
  const pathname = usePathname();
  const router = useRouter();

  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationError, setNotificationError] = useState("");
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [busyId, setBusyId] = useState("");

  const { pageTitle, breadcrumbs } = useMemo(() => {
    const segments = String(pathname || "")
      .split("/")
      .filter(Boolean);

    const adminSegments =
      segments[0] === "admin" ? segments.slice(1) : segments;

    const startsWithDashboard = adminSegments[0] === "dashboard";

    const breadcrumbSegments = startsWithDashboard
      ? adminSegments.slice(1)
      : adminSegments;

    const baseParts = startsWithDashboard ? ["admin", "dashboard"] : ["admin"];

    const visibleBreadcrumbSegments = breadcrumbSegments
      .map((segment, index) => ({ segment, index }))
      .filter(({ segment }) => !isDynamicIdSegment(segment));

    const crumbs = [
      { label: "Admin", href: "/admin/pitch-folders" },
      ...visibleBreadcrumbSegments.map(({ segment, index }) => ({
        label: formatSegment(segment),
        href: `/${[...baseParts, ...breadcrumbSegments.slice(0, index + 1)].join(
          "/"
        )}`,
      })),
    ];

    const lastVisibleSegment =
      visibleBreadcrumbSegments[visibleBreadcrumbSegments.length - 1]?.segment;

    let title = startsWithDashboard ? "Dashboard" : "Overview";

    if (lastVisibleSegment) {
      title = formatSegment(lastVisibleSegment);
    }

    return { pageTitle: title, breadcrumbs: crumbs };
  }, [pathname]);

  const loadNotifications = useCallback(async (showLoader = false) => {
    try {
      if (showLoader) setNotificationsLoading(true);
      setNotificationError("");

      const response = await get<NotificationsResponse>(
        "/notifications/admin?limit=100"
      );

      const rows = sortNotifications(getNotificationRows(response));

      setNotifications(rows);
      setUnreadCount(getUnreadCount(response, rows));
    } catch (error: any) {
      setNotificationError(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to load notifications."
      );
    } finally {
      if (showLoader) setNotificationsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadNotifications(false);

    const intervalId = window.setInterval(() => {
      void loadNotifications(false);
    }, 30000);

    return () => window.clearInterval(intervalId);
  }, [loadNotifications]);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (!notificationsOpen) return;

      const target = event.target as Node | null;

      if (dropdownRef.current && target && !dropdownRef.current.contains(target)) {
        setNotificationsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [notificationsOpen]);

  function updateNotificationAsRead(notification: AdminNotification) {
    setNotifications((prev) =>
      sortNotifications(
        prev.map((item) =>
          item._id === notification._id ||
          (notification.notificationId &&
            item.notificationId === notification.notificationId)
            ? {
                ...item,
                isRead: true,
                read: 1,
              }
            : item
        )
      )
    );

    setUnreadCount((prev) => Math.max(0, prev - 1));
  }

  async function markRead(notification: AdminNotification) {
    if (!notification?._id || !isUnread(notification)) return;

    setBusyId(notification._id);

    try {
      await post("/notifications/admin/mark-read", {
        id: notification._id,
      });

      updateNotificationAsRead(notification);
    } catch (error: any) {
      setNotificationError(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to mark notification as read."
      );
    } finally {
      setBusyId("");
    }
  }

  async function openNotification(notification: AdminNotification) {
    if (!notification?._id) return;

    setBusyId(notification._id);

    try {
      if (isUnread(notification)) {
        await post("/notifications/admin/mark-read", {
          id: notification._id,
        });

        updateNotificationAsRead(notification);
      }

      const path = getAdminActionPath(notification);

      setNotificationsOpen(false);
      router.push(path || "/admin/notifications");
    } catch (error: any) {
      setNotificationError(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to open notification."
      );
    } finally {
      setBusyId("");
    }
  }

  function handleNotificationKeyDown(
    event: React.KeyboardEvent<HTMLDivElement>,
    notification: AdminNotification
  ) {
    if (event.key !== "Enter" && event.key !== " ") return;

    event.preventDefault();
    void openNotification(notification);
  }

  return (
    <header className="sticky top-0 z-30 flex h-20 w-full items-center justify-between border-b border-slate-200 bg-white/80 px-6 backdrop-blur-md">
      <div className="flex min-w-0 flex-col justify-center">
        <nav className="mb-1 flex items-center gap-1.5 overflow-x-auto whitespace-nowrap text-xs font-medium text-slate-500">
          {breadcrumbs.map((item, index) => (
            <div
              key={`${item.href}-${index}`}
              className="flex items-center gap-1.5"
            >
              <Link
                href={item.href}
                className="transition-colors hover:text-slate-900"
              >
                {item.label}
              </Link>

              {index < breadcrumbs.length - 1 && (
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              )}
            </div>
          ))}
        </nav>

        <h1 className="truncate text-2xl font-bold tracking-tight text-slate-900">
          {pageTitle}
        </h1>
      </div>

      <div className="hidden flex-1 px-8 lg:flex lg:max-w-md">
        <div className="group relative flex w-full items-center rounded-xl bg-slate-100 transition-all focus-within:bg-white focus-within:ring-2 focus-within:ring-slate-900 focus-within:ring-offset-1">
          <Search className="absolute left-3.5 h-4 w-4 text-slate-400 group-focus-within:text-slate-900" />

          <input
            type="text"
            placeholder="Search anything..."
            className="w-full bg-transparent py-2.5 pl-10 pr-14 text-sm font-medium text-slate-900 placeholder:text-slate-500 focus:outline-none"
          />

          <div className="absolute right-2 hidden rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-bold text-slate-400 lg:block">
            ⌘K
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3 lg:gap-4">
        <div ref={dropdownRef} className="relative">
          <button
            type="button"
            onClick={() => {
              const nextOpen = !notificationsOpen;
              setNotificationsOpen(nextOpen);

              if (nextOpen) {
                void loadNotifications(true);
              }
            }}
            className="relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-600 transition-all hover:bg-slate-100 hover:text-slate-900"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />

            {unreadCount > 0 ? (
              <>
                <span className="absolute right-2 top-2 flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
                </span>

                <span className="absolute -right-1 -top-1 inline-flex min-w-[18px] items-center justify-center rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              </>
            ) : null}
          </button>

          {notificationsOpen ? (
            <div className="absolute right-0 top-12 z-50 w-[380px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.16)]">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <div>
                  <p className="text-sm font-bold text-slate-900">
                    Notifications
                  </p>

                  <p className="text-xs text-slate-500">
                    {unreadCount > 0
                      ? `${unreadCount} unread notification${
                          unreadCount > 1 ? "s" : ""
                        }`
                      : "You're all caught up"}
                  </p>
                </div>

                <Link
                  href="/admin/notifications"
                  onClick={() => setNotificationsOpen(false)}
                  className="rounded-full px-3 py-1.5 text-xs font-semibold text-teal-600 transition hover:bg-teal-50"
                >
                  Open notifications
                </Link>
              </div>

              {notificationError ? (
                <div className="border-b border-red-100 bg-red-50 px-4 py-3 text-xs font-medium text-red-700">
                  {notificationError}
                </div>
              ) : null}

              <div className="max-h-[460px] overflow-y-auto">
                {notificationsLoading ? (
                  <div className="flex items-center justify-center gap-2 px-4 py-10 text-sm font-medium text-slate-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading notifications...
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="px-4 py-10 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                      <Bell className="h-5 w-5" />
                    </div>

                    <p className="mt-3 text-sm font-semibold text-slate-700">
                      No notifications yet
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      New admin notifications will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {notifications.map((notification) => {
                      const unread = isUnread(notification);
                      const actorLabel = getActorLabel(notification);
                      const busy = busyId === notification._id;

                      return (
                        <div
                          key={notification._id}
                          role="button"
                          tabIndex={0}
                          onClick={() => {
                            if (busy) return;
                            void openNotification(notification);
                          }}
                          onKeyDown={(event) =>
                            handleNotificationKeyDown(event, notification)
                          }
                          className={cx(
                            "cursor-pointer px-4 py-3 transition outline-none hover:bg-slate-50 focus:bg-slate-50",
                            unread ? "bg-teal-50/70" : "bg-white"
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={cx(
                                "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                                unread
                                  ? "bg-teal-600 text-white"
                                  : "bg-slate-100 text-slate-600"
                              )}
                            >
                              {busy ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                getNotificationInitial(notification)
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <p
                                  className={cx(
                                    "line-clamp-1 text-sm text-slate-900",
                                    unread ? "font-bold" : "font-semibold"
                                  )}
                                >
                                  {notification.title || "Notification"}
                                </p>

                                {unread ? (
                                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-teal-600" />
                                ) : null}
                              </div>

                              <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-600">
                                {notification.message || "No message"}
                              </p>

                              {actorLabel ? (
                                <p className="mt-1 line-clamp-1 text-[11px] font-medium text-slate-500">
                                  Created by: {actorLabel}
                                </p>
                              ) : null}

                              <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                                <span>{formatTypeLabel(notification.type)}</span>

                                {formatTime(notification.createdAt) ? (
                                  <>
                                    <span>•</span>
                                    <span>{formatTime(notification.createdAt)}</span>
                                  </>
                                ) : null}
                              </div>

                              <div className="mt-3 flex items-center gap-2">
                                {unread ? (
                                  <button
                                    type="button"
                                    onClick={(event) => {
                                      event.preventDefault();
                                      event.stopPropagation();

                                      if (busy) return;
                                      void markRead(notification);
                                    }}
                                    disabled={busy}
                                    className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                    {busy ? (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                      <Check className="h-3 w-3" />
                                    )}
                                    Read
                                  </button>
                                ) : null}

                                <span className="text-[11px] font-medium text-slate-400">
                                  Click to open
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>

        <div className="hidden h-9 w-9 overflow-hidden rounded-full border-2 border-slate-200 bg-slate-100 md:block">
          <img
            src="https://api.dicebear.com/7.x/notionists/svg?seed=Admin"
            alt="Admin avatar"
            className="h-full w-full object-cover"
          />
        </div>
      </div>
    </header>
  );
}