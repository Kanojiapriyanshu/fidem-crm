"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import AdminSidebar from "../components/AdminSideBar";
import AdminTopBar from "../components/AdminTopBar";

function isInstantlyRoute(pathname: string) {
  const normalized = String(pathname || "").toLowerCase();
  return normalized.includes("/admin") && normalized.includes("crm");
}

function isMessagingRoute(pathname: string) {
  const normalized = String(pathname || "").toLowerCase();
  return normalized.includes("/admin/team-discussions");
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [ready, setReady] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const isLoginRoute = pathname === "/admin/login";
  const isInstantlyPage = isInstantlyRoute(pathname);
  const isMessagingPage = isMessagingRoute(pathname);
  const isFullScreenPage = isInstantlyPage || isMessagingPage;

  useEffect(() => {
    if (isLoginRoute) {
      setAuthorized(true);
      setReady(true);
      return;
    }

    try {
      const adminId =
        window.localStorage.getItem("adminId") ??
        window.localStorage.getItem("admin_id");

      if (!adminId) {
        setAuthorized(false);
        router.replace("/admin/login");
      } else {
        setAuthorized(true);
      }
    } finally {
      setReady(true);
    }
  }, [isLoginRoute, router]);

  useEffect(() => {
    setSidebarCollapsed(isInstantlyPage);
  }, [isInstantlyPage]);

  const showSidebar = !isLoginRoute;
  const showTopbar = !isLoginRoute && !isInstantlyPage && !isMessagingPage;

  const desktopSidebarOffset = useMemo(() => {
    if (!showSidebar) return "";
    return sidebarCollapsed ? "md:ml-24" : "md:ml-72";
  }, [showSidebar, sidebarCollapsed]);

  if (!ready) return null;
  if (!authorized && !isLoginRoute) return null;

  return (
    <div
      className={`relative flex h-screen overflow-hidden font-sans text-foreground ${
        isInstantlyPage ? "bg-[#f6f6f7]" : "bg-muted"
      }`}
    >
      {showSidebar && (
        <div className="relative z-[70] h-screen shrink-0 overflow-visible">
          <AdminSidebar
            collapsed={sidebarCollapsed}
            onCollapsedChange={setSidebarCollapsed}
          />
        </div>
      )}

      <div
        className={`relative z-0 flex h-screen min-h-0 flex-1 flex-col overflow-hidden transition-all duration-300 ${desktopSidebarOffset}`}
      >
        {showTopbar && (
          <div className="shrink-0 pt-16 md:pt-0">
            <AdminTopBar />
          </div>
        )}

        <main
          className={`min-h-0 flex-1 ${
            isFullScreenPage ? "overflow-hidden" : "overflow-y-auto"
          } ${isInstantlyPage ? "bg-[#f6f6f7]" : "bg-muted"}`}
        >
          {isFullScreenPage ? (
            <div className="h-full min-h-0 w-full overflow-hidden">
              {children}
            </div>
          ) : (
            <div className="mx-auto min-h-full max-w-full rounded-2xl border border-border bg-card p-6 shadow-sm ring-1 ring-teal-500/10 sm:p-8">
              {children}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}