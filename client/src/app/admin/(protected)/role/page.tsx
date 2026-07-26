"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  GitBranch,
  Info,
  RefreshCw,
  Search,
  Shield,
  Users,
} from "lucide-react";
import {
  ROLE_PERMISSION_SECTIONS,
  canonicalizeModuleKey,
  getAdminModule,
} from "@/app/admin/components/admin-access";

type AdminStatus = "pending" | "active" | "inactive" | "suspended";
type PermissionLevel = "none" | "read" | "write";
type AdminRole = "super_admin" | "revenue_head" | "ime" | "bme";

type AdminAccess = {
  key: string;
  name?: string;
  isEdit?: boolean;
  isDelete?: boolean;
  isManager?: boolean;
};

type AdminMini = {
  _id: string;
  name?: string;
  email?: string;
  role?: string;
};

type AdminRow = {
  _id: string;
  email: string;
  name?: string;
  proxyEmail?: string;
  role: AdminRole | string;
  status?: AdminStatus;
  invitedAt?: string;
  lastLoginAt?: string;
  createdAt?: string;
  updatedAt?: string;
  access?: AdminAccess[];
  permissions?: AdminAccess[];
  parentAdmin?: string | AdminMini | null;
  rootAdmin?: string | AdminMini | null;
  createdBy?: string | AdminMini | null;
};

type MeResponse = {
  _id: string;
  email: string;
  name?: string;
  proxyEmail?: string;
  role: AdminRole | string;
  status?: AdminStatus;
  permissions?: AdminAccess[];
  access?: AdminAccess[];
  parentAdmin?: string | AdminMini | null;
  rootAdmin?: string | AdminMini | null;
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/";

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  revenue_head: "Revenue Head",
  ime: "IME",
  bme: "BME",
};

const ROLE_OPTIONS: Array<{ value: AdminRole; label: string }> = [
  { value: "super_admin", label: "Super Admin" },
  { value: "revenue_head", label: "Revenue Head" },
  { value: "ime", label: "IME" },
  { value: "bme", label: "BME" },
];

const noBlueFocus =
  "outline-none focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0";

const inputBase = `border border-black/10 rounded-2xl bg-white text-sm ${noBlueFocus} focus:border-teal-600/40`;
const selectBase = `border border-black/10 rounded-2xl bg-white text-sm ${noBlueFocus} focus:border-teal-600/40`;

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function formatDT(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString();
}

function normalizeTextKey(value: string) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-");
}

function toApiUrl(path: string) {
  const base = API_BASE.endsWith("/") ? API_BASE : `${API_BASE}/`;
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  return `${base}${cleanPath}`;
}

function getRoleLabel(role?: string) {
  return ROLE_LABELS[String(role || "").toLowerCase()] || role || "—";
}

function getParentName(parent?: string | AdminMini | null) {
  if (!parent) return "—";
  if (typeof parent === "string") return "Assigned";
  return parent.name || parent.email || "Assigned";
}

function getToken() {
  return typeof window !== "undefined" ? localStorage.getItem("token") : null;
}

function getPermissionLevel(
  access: AdminAccess[] = [],
  moduleKey: string
): PermissionLevel {
  const found = access.find(
    (item) => canonicalizeModuleKey(item.key) === canonicalizeModuleKey(moduleKey)
  );

  if (!found) return "none";
  return found.isEdit ? "write" : "read";
}

function getAllowedInviteRoles(currentRole?: string): AdminRole[] {
  const role = String(currentRole || "").toLowerCase();

  if (role === "super_admin") {
    return ["revenue_head", "ime", "bme"];
  }

  if (role === "revenue_head") {
    return ["ime", "bme"];
  }

  return [];
}

function roleCanEdit(currentRole?: string) {
  const role = String(currentRole || "").toLowerCase();
  return role === "super_admin" || role === "revenue_head";
}

function roleCanInvite(currentRole?: string) {
  return getAllowedInviteRoles(currentRole).length > 0;
}

function needsParentRevenueHead(inviterRole?: string, targetRole?: string) {
  return (
    String(inviterRole || "").toLowerCase() === "super_admin" &&
    ["ime", "bme"].includes(String(targetRole || "").toLowerCase())
  );
}

function canonicalizeAccessList(access: AdminAccess[] = []) {
  const map = new Map<string, AdminAccess>();

  for (const item of access) {
    const module = getAdminModule(item.key);
    const canonicalKey = module?.key || canonicalizeModuleKey(item.key);

    if (!canonicalKey) continue;

    const prev = map.get(canonicalKey);

    map.set(canonicalKey, {
      key: canonicalKey,
      name: module?.label || item.name || canonicalKey,
      isEdit: Boolean(prev?.isEdit || item.isEdit),
      isDelete: Boolean(prev?.isDelete || item.isDelete),
      isManager: Boolean(prev?.isManager || item.isManager),
    });
  }

  return Array.from(map.values());
}

function StatusPill({ status }: { status: AdminStatus }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize",
        status === "active" && "bg-black text-white",
        status === "inactive" && "bg-black/10 text-black",
        status === "suspended" && "bg-black/10 text-black/70",
        status === "pending" && "bg-black/5 text-black/60"
      )}
    >
      {status}
    </span>
  );
}

function PermissionSwitch({
  value,
  onChange,
  disabled,
}: {
  value: PermissionLevel;
  onChange: (next: PermissionLevel) => void;
  disabled?: boolean;
}) {
  const options: PermissionLevel[] = ["none", "read", "write"];

  return (
    <div className="inline-flex items-center rounded-full bg-black/5 p-1">
      {options.map((option) => {
        const active = value === option;

        return (
          <button
            key={option}
            type="button"
            onClick={() => !disabled && onChange(option)}
            disabled={disabled}
            className={cn(
              "min-w-[64px] rounded-full px-4 py-2 text-xs font-semibold capitalize transition",
              active
                ? "bg-teal-600 text-white shadow-sm"
                : "text-black/45 hover:text-black",
              disabled && "cursor-not-allowed opacity-50"
            )}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

export default function AdminsPage() {
  const [rows, setRows] = useState<AdminRow[]>([]);
  const [me, setMe] = useState<MeResponse | null>(null);

  const [loading, setLoading] = useState(true);
  const [loadingMe, setLoadingMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rowMsg, setRowMsg] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | AdminStatus>("all");
  const [roleFilter, setRoleFilter] = useState("all");

  const [page, setPage] = useState(1);
  const limit = 5;

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteProxyEmail, setInviteProxyEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<AdminRole | "">("");
  const [inviteParentAdmin, setInviteParentAdmin] = useState("");
  const [inviteAccess, setInviteAccess] = useState<AdminAccess[]>([]);
  const [inviting, setInviting] = useState(false);
  const [inviteErr, setInviteErr] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState<AdminRole | "">("");
  const [editStatus, setEditStatus] = useState<AdminStatus>("pending");
  const [editAccess, setEditAccess] = useState<AdminAccess[]>([]);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editErr, setEditErr] = useState<string | null>(null);

  const currentRole = String(me?.role || "").toLowerCase();

  const myAccess = useMemo(() => {
    const raw = (me?.permissions ?? me?.access ?? []) as AdminAccess[];
    return canonicalizeAccessList(raw);
  }, [me]);

  const canViewAdmins =
    currentRole === "super_admin" ||
    currentRole === "revenue_head" ||
    myAccess.some((item) => item.key === "role");

  const canEditAdmins = roleCanEdit(currentRole) && canViewAdmins;
  const canInviteAdmins = roleCanInvite(currentRole) && canViewAdmins;

  const selectedAdmin = useMemo(
    () => rows.find((row) => row._id === selectedId) || null,
    [rows, selectedId]
  );

  const inviteRoleOptions = useMemo(() => {
    const allowed = getAllowedInviteRoles(currentRole);
    return ROLE_OPTIONS.filter((item) => allowed.includes(item.value));
  }, [currentRole]);

  const editRoleOptions = useMemo(() => {
    const base = inviteRoleOptions.length ? inviteRoleOptions : ROLE_OPTIONS;
    const current = String(selectedAdmin?.role || "").toLowerCase() as AdminRole;

    if (!current) return base;

    const exists = base.some((item) => item.value === current);
    return exists
      ? base
      : [{ value: current, label: getRoleLabel(current) }, ...base];
  }, [inviteRoleOptions, selectedAdmin]);

  const revenueHeadOptions = useMemo(() => {
    return rows.filter((row) => String(row.role).toLowerCase() === "revenue_head");
  }, [rows]);

  const roleOptions = useMemo(() => {
    const visibleRoles = rows
      .map((row) => String(row.role || "").trim())
      .filter(Boolean)
      .map((role) => normalizeTextKey(role));

    return Array.from(new Set(visibleRoles));
  }, [rows]);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();

    return rows.filter((row) => {
      const matchesSearch =
        !query ||
        row.email?.toLowerCase().includes(query) ||
        (row.proxyEmail || "").toLowerCase().includes(query) ||
        (row.name || "").toLowerCase().includes(query) ||
        String(row.role || "").toLowerCase().includes(query);

      const status = (row.status || "pending") as AdminStatus;
      const matchesStatus =
        statusFilter === "all" ? true : status === statusFilter;

      const normalizedRole = normalizeTextKey(String(row.role || ""));
      const matchesRole =
        roleFilter === "all"
          ? true
          : normalizedRole === normalizeTextKey(roleFilter);

      return matchesSearch && matchesStatus && matchesRole;
    });
  }, [rows, search, statusFilter, roleFilter]);

  const total = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(page, totalPages);
  const paginatedRows = filteredRows.slice(
    (safePage - 1) * limit,
    safePage * limit
  );

  function hydrateEditor(admin: AdminRow | null) {
    if (!admin) {
      setSelectedId(null);
      setEditName("");
      setEditRole("");
      setEditStatus("pending");
      setEditAccess([]);
      setEditErr(null);
      return;
    }

    const nextAccess = canonicalizeAccessList(
      Array.isArray(admin.access)
        ? admin.access
        : Array.isArray(admin.permissions)
        ? admin.permissions
        : []
    );

    setSelectedId(admin._id);
    setEditName(admin.name || "");
    setEditRole((String(admin.role || "").toLowerCase() as AdminRole) || "");
    setEditStatus((admin.status || "pending") as AdminStatus);
    setEditAccess(nextAccess);
    setEditErr(null);
  }

  function buildAccessEntry(
    moduleKey: string,
    level: PermissionLevel
  ): AdminAccess {
    const module = getAdminModule(moduleKey);

    return {
      key: module?.key || canonicalizeModuleKey(moduleKey),
      name: module?.label || moduleKey,
      isEdit: level === "write",
      isDelete: false,
      isManager: false,
    };
  }

  function updateAccessState(
    setter: React.Dispatch<React.SetStateAction<AdminAccess[]>>,
    moduleKey: string,
    level: PermissionLevel
  ) {
    setter((prev) => {
      const canonicalKey = canonicalizeModuleKey(moduleKey);
      const next = canonicalizeAccessList(prev);
      const index = next.findIndex((item) => item.key === canonicalKey);

      if (level === "none") {
        return next.filter((item) => item.key !== canonicalKey);
      }

      const nextValue = buildAccessEntry(moduleKey, level);

      if (index === -1) return canonicalizeAccessList([...next, nextValue]);

      return canonicalizeAccessList(
        next.map((item, i) => (i === index ? { ...item, ...nextValue } : item))
      );
    });
  }

  async function fetchMe() {
    setLoadingMe(true);

    try {
      const token = getToken();

      const res = await fetch(toApiUrl("admins/me"), {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Failed to load current admin");
      }

      setMe(data?.data || data);
    } catch (e: any) {
      setMe(null);
      setError(e?.message || "Failed to load current admin");
    } finally {
      setLoadingMe(false);
    }
  }

  async function fetchAdmins() {
    setLoading(true);
    setError(null);

    try {
      const token = getToken();

      const res = await fetch(toApiUrl("admins/list"), {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Failed to load admins");
      }

      const nextRows = Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data)
        ? data
        : [];

      setRows(nextRows);

      if (nextRows.length && !selectedId) {
        hydrateEditor(nextRows[0]);
      }
    } catch (e: any) {
      setRows([]);
      setError(e?.message || "Failed to load admins");
    } finally {
      setLoading(false);
    }
  }

  async function refreshAll() {
    await Promise.all([fetchMe(), fetchAdmins()]);
  }

  async function updateStatus(adminId: string, status: AdminStatus) {
    if (!canEditAdmins) return;

    setUpdatingId(adminId);
    setRowMsg(null);

    try {
      const token = getToken();

      const res = await fetch(toApiUrl("admins/update-status"), {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ adminId, status }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Failed to update status");
      }

      setRows((prev) =>
        prev.map((item) => (item._id === adminId ? { ...item, status } : item))
      );

      if (selectedId === adminId) {
        setEditStatus(status);
      }

      setRowMsg(data?.message || "Status updated successfully");
    } catch (e: any) {
      setRowMsg(e?.message || "Failed to update status");
    } finally {
      setUpdatingId(null);
      setTimeout(() => setRowMsg(null), 2500);
    }
  }

  async function onInvite() {
    setInviteErr(null);

    const email = inviteEmail.trim().toLowerCase();
    const role = String(inviteRole || "").trim().toLowerCase() as AdminRole;
    const proxyEmail = inviteProxyEmail.trim();

    if (!email) return setInviteErr("Email is required");
    if (!role) return setInviteErr("Role is required");

    if (needsParentRevenueHead(currentRole, role) && !inviteParentAdmin.trim()) {
      return setInviteErr("Please select a Revenue Head");
    }

    setInviting(true);

    try {
      const token = getToken();

      const payload: Record<string, any> = {
        email,
        name: inviteName.trim() || undefined,
        role,
        access: canonicalizeAccessList(inviteAccess),
        proxyEmail: proxyEmail || undefined,
      };

      if (needsParentRevenueHead(currentRole, role)) {
        payload.parentAdmin = inviteParentAdmin;
      }

      const res = await fetch(toApiUrl("admins/invite"), {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Invite failed");
      }

      setInviteOpen(false);
      setInviteEmail("");
      setInviteName("");
      setInviteProxyEmail("");
      setInviteRole("");
      setInviteParentAdmin("");
      setInviteAccess([]);
      setRowMsg(data?.message || "Invite sent successfully");

      await fetchAdmins();
    } catch (e: any) {
      setInviteErr(e?.message || "Invite failed");
    } finally {
      setInviting(false);
    }
  }

  async function onSaveCurrent() {
    if (!selectedId || !selectedAdmin) return;

    setSavingEdit(true);
    setEditErr(null);

    try {
      const token = getToken();

      const payload: Record<string, any> = {
        adminId: selectedId,
        status: editStatus,
        access: canonicalizeAccessList(editAccess),
      };

      const trimmedName = editName.trim();
      const currentName = String(selectedAdmin.name || "").trim();
      if (trimmedName !== currentName) {
        payload.name = trimmedName || undefined;
      }

      const currentRoleValue = String(selectedAdmin.role || "").toLowerCase();
      if (editRole && editRole !== currentRoleValue) {
        payload.role = editRole;
      }

      const res = await fetch(toApiUrl("admins/update-status"), {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Failed to update admin");
      }

      setRowMsg(data?.message || "Changes saved");
      await fetchAdmins();
    } catch (e: any) {
      setEditErr(e?.message || "Failed to update admin");
    } finally {
      setSavingEdit(false);
      setTimeout(() => setRowMsg(null), 2500);
    }
  }

  useEffect(() => {
    refreshAll();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, roleFilter]);

  useEffect(() => {
    if (!filteredRows.length) {
      hydrateEditor(null);
      return;
    }

    const stillVisible = filteredRows.find((row) => row._id === selectedId);
    if (!stillVisible) {
      hydrateEditor(filteredRows[0]);
    }
  }, [filteredRows, selectedId]);

  if (!canViewAdmins) {
    return (
      <div className="min-h-screen bg-white p-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
          You do not have permission to view this page.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white px-4 py-5 md:px-6 lg:px-8">
      <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-black">
            Role & Permissions
          </h1>
          <p className="mt-1 text-sm text-black/60">
            Sidebar and permission modules are now synced to the actual admin folder structure.
          </p>

          {!loadingMe && me ? (
            <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-black/5 px-3 py-1 text-xs font-medium text-black/70">
              <Shield className="h-3.5 w-3.5" />
              Logged in as {me.name || me.email} · {getRoleLabel(me.role)}
              {me.proxyEmail ? ` · ${me.proxyEmail}` : ""}
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={refreshAll}
            disabled={loading || loadingMe}
            className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-4 py-2 text-sm font-medium text-black hover:bg-black/5 disabled:opacity-50"
          >
            <RefreshCw className="h-4 w-4" />
            {loading || loadingMe ? "Refreshing..." : "Refresh"}
          </button>

          {canInviteAdmins ? (
            <button
              type="button"
              onClick={() => {
                setInviteOpen(true);
                setInviteErr(null);
                setInviteEmail("");
                setInviteName("");
                setInviteProxyEmail("");
                setInviteRole("");
                setInviteParentAdmin("");
                setInviteAccess([]);
              }}
              className="rounded-2xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
            >
              + Invite Admin
            </button>
          ) : null}
        </div>
      </div>

      <div className="mb-5 grid gap-3 lg:grid-cols-[1fr_180px_180px]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-black/40" />
          <input
            placeholder="Search by name, email, proxy email or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`${inputBase} h-12 w-full pl-11 pr-4`}
          />
        </div>

        <select
          className={`${selectBase} h-12 w-full px-4`}
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="all">All Roles</option>
          {roleOptions.map((role) => (
            <option key={role} value={role}>
              {getRoleLabel(role)}
            </option>
          ))}
        </select>

        <select
          className={`${selectBase} h-12 w-full px-4`}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as "all" | AdminStatus)}
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {error ? (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {rowMsg ? (
        <div className="mb-4 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-black">
          {rowMsg}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="space-y-4">
          <div className="px-1">
            <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-black/45">
              Visible Admin Tree
            </p>
          </div>

          {loading ? (
            <div className="rounded-[22px] border border-black/10 bg-white p-5 text-sm text-black/60">
              Loading admins...
            </div>
          ) : paginatedRows.length === 0 ? (
            <div className="rounded-[22px] border border-black/10 bg-white p-5 text-sm text-black/60">
              No admins found.
            </div>
          ) : (
            paginatedRows.map((admin) => {
              const active = selectedId === admin._id;
              const status = (admin.status || "pending") as AdminStatus;
              const accessCount = canonicalizeAccessList(
                Array.isArray(admin.access)
                  ? admin.access
                  : Array.isArray(admin.permissions)
                  ? admin.permissions
                  : []
              ).length;

              return (
                <button
                  key={admin._id}
                  type="button"
                  onClick={() => hydrateEditor(admin)}
                  className={cn(
                    "w-full rounded-[22px] border text-left transition-all",
                    active
                      ? "border-teal-600 bg-teal-50 shadow-[inset_4px_0_0_0_#0d9488]"
                      : "border-black/10 bg-white hover:border-black/20"
                  )}
                >
                  <div className="p-5">
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-[24px] font-semibold tracking-[-0.03em] text-black">
                          {getRoleLabel(admin.role)}
                        </div>
                        <p className="mt-1 line-clamp-2 text-sm leading-5 text-black/55">
                          {admin.name || admin.email}
                        </p>
                      </div>

                      <StatusPill status={status} />
                    </div>

                    <div className="mt-4 flex items-center gap-2 text-sm text-black/45">
                      <Users className="h-4 w-4" />
                      <span>{accessCount} Modules</span>
                    </div>

                    <div className="mt-2 flex items-center gap-2 text-sm text-black/45">
                      <GitBranch className="h-4 w-4" />
                      <span className="truncate">
                        Parent: {getParentName(admin.parentAdmin)}
                      </span>
                    </div>

                    <div className="mt-4 text-xs text-black/45">
                      <div className="truncate">{admin.email}</div>
                      {admin.proxyEmail ? (
                        <div className="mt-1 truncate">Proxy: {admin.proxyEmail}</div>
                      ) : null}
                      <div className="mt-1">
                        Last login: {formatDT(admin.lastLoginAt)}
                      </div>
                    </div>

                    <div className="mt-5 flex items-center justify-end border-t border-black/10 pt-4">
                      <span className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white">
                        Manage
                      </span>
                    </div>
                  </div>
                </button>
              );
            })
          )}

          {filteredRows.length > 0 ? (
            <div className="flex items-center justify-between rounded-[20px] border border-black/10 bg-white px-4 py-3">
              <div className="text-sm text-black/60">
                Page <span className="font-medium text-black">{safePage}</span> of{" "}
                <span className="font-medium text-black">{totalPages}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={safePage === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-xl border border-black/10 p-2 text-black hover:bg-black/5 disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  disabled={safePage === totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="rounded-xl border border-black/10 p-2 text-black hover:bg-black/5 disabled:opacity-50"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : null}

          <div className="rounded-[22px] bg-black/[0.04] p-6 text-center">
            <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-black/10">
              <Info className="h-5 w-5 text-black" />
            </div>

            <div className="text-lg font-semibold text-black">
              Hierarchy Rules
            </div>

            <p className="mx-auto mt-3 max-w-[260px] text-sm leading-6 text-black/60">
              Revenue Head sees only their IME and BME. IME and BME see only
              their own records. Super Admin sees everything.
            </p>
          </div>
        </aside>

        <section className="rounded-[28px] border border-black/10 bg-[#f7f7f7] p-5 md:p-7 lg:p-8">
          {!selectedAdmin ? (
            <div className="rounded-2xl bg-white p-6 text-black/60">
              Select an admin from the left to manage permissions.
            </div>
          ) : (
            <>
              <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black/5">
                      <Shield className="h-4 w-4 text-black" />
                    </div>

                    <h2 className="text-[34px] font-semibold tracking-[-0.03em] text-black">
                      Permissions for{" "}
                      {getRoleLabel(editRole || selectedAdmin.role || "admin")}
                    </h2>
                  </div>

                  <p className="mt-2 text-base text-black/55">
                    Configure module access exactly according to the admin folder structure.
                  </p>
                </div>

                <div className="flex flex-col items-start gap-2 sm:items-end">
                  <StatusPill status={editStatus} />
                  <div className="text-xs text-black/50">
                    Invited: {formatDT(selectedAdmin.invitedAt)}
                  </div>
                </div>
              </div>

              {editErr ? (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {editErr}
                </div>
              ) : null}

              <div className="mb-8 grid gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-black/45">
                    Full Name
                  </label>
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    disabled={!canEditAdmins}
                    className="h-14 w-full rounded-2xl border border-black/10 bg-white px-5 text-base text-black outline-none placeholder:text-black/30 focus:border-black/20 disabled:opacity-60"
                    placeholder="Admin name"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-black/45">
                    Role
                  </label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as AdminRole)}
                    disabled={!canEditAdmins}
                    className="h-14 w-full rounded-2xl border border-black/10 bg-white px-5 text-base text-black outline-none focus:border-black/20 disabled:opacity-60"
                  >
                    <option value="">Select role</option>
                    {editRoleOptions.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-black/45">
                    Status
                  </label>
                  <select
                    className="h-14 w-full rounded-2xl border border-black/10 bg-white px-5 text-base text-black outline-none focus:border-black/20 disabled:opacity-60"
                    value={editStatus}
                    disabled={!canEditAdmins}
                    onChange={(e) => setEditStatus(e.target.value as AdminStatus)}
                  >
                    <option value="pending">Pending</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div className="mb-6 rounded-[20px] border border-black/10 bg-white px-5 py-4">
                <div className="grid gap-3 md:grid-cols-4">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-[0.16em] text-black/40">
                      Email
                    </div>
                    <div className="mt-1 text-sm font-medium text-black">
                      {selectedAdmin.email}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-bold uppercase tracking-[0.16em] text-black/40">
                      Proxy Email
                    </div>
                    <div className="mt-1 text-sm font-medium text-black">
                      {selectedAdmin.proxyEmail || "—"}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-bold uppercase tracking-[0.16em] text-black/40">
                      Parent
                    </div>
                    <div className="mt-1 text-sm font-medium text-black">
                      {getParentName(selectedAdmin.parentAdmin)}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-bold uppercase tracking-[0.16em] text-black/40">
                      Last Login
                    </div>
                    <div className="mt-1 text-sm font-medium text-black">
                      {formatDT(selectedAdmin.lastLoginAt)}
                    </div>
                  </div>
                </div>

                <div className="mt-4 border-t border-black/10 pt-4">
                  <div className="text-xs font-bold uppercase tracking-[0.16em] text-black/40">
                    Quick Status API
                  </div>
                  <button
                    type="button"
                    disabled={updatingId === selectedAdmin._id || !canEditAdmins}
                    onClick={() => updateStatus(selectedAdmin._id, editStatus)}
                    className="mt-2 rounded-xl border border-black/10 px-3 py-2 text-sm font-medium hover:bg-black/5 disabled:opacity-50"
                  >
                    {updatingId === selectedAdmin._id
                      ? "Updating..."
                      : "Update Status Only"}
                  </button>
                </div>
              </div>

              <div className="mb-5 rounded-[20px] border border-black/10 bg-white px-5 py-4">
                <div className="text-xs font-bold uppercase tracking-[0.16em] text-black/40">
                  Visibility Scope
                </div>
                <div className="mt-2 text-sm text-black/70">
                  {String(selectedAdmin.role).toLowerCase() === "super_admin" &&
                    "Can view everything across the system."}
                  {String(selectedAdmin.role).toLowerCase() === "revenue_head" &&
                    "Can view only their own IME and BME team data."}
                  {["ime", "bme"].includes(
                    String(selectedAdmin.role).toLowerCase()
                  ) && "Can view only their own records."}
                </div>
              </div>

              <div className="overflow-hidden rounded-[24px] border border-black/10 bg-white/80">
                {ROLE_PERMISSION_SECTIONS.map((section) => {
                  const SectionIcon = section.icon;

                  return (
                    <div
                      key={section.key}
                      className="border-b border-black/10 last:border-b-0"
                    >
                      <div className="flex items-center gap-2 bg-black/[0.03] px-4 py-3">
                        <SectionIcon className="h-4 w-4 text-black" />
                        <span className="text-xs font-extrabold uppercase tracking-[0.18em] text-black/55">
                          {section.title}
                        </span>
                      </div>

                      {section.items.map((itemKey) => {
                        const module = getAdminModule(itemKey);
                        if (!module) return null;

                        return (
                          <div
                            key={module.key}
                            className="flex flex-col gap-4 px-4 py-5 md:flex-row md:items-center md:justify-between"
                          >
                            <div className="text-base font-medium text-black">
                              {module.label}
                            </div>

                            <PermissionSwitch
                              value={getPermissionLevel(editAccess, module.key)}
                              disabled={!canEditAdmins}
                              onChange={(next) =>
                                updateAccessState(setEditAccess, module.key, next)
                              }
                            />
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                <button
                  type="button"
                  onClick={() => hydrateEditor(selectedAdmin)}
                  className="rounded-2xl border border-black/10 px-5 py-3 text-sm font-semibold text-black hover:bg-black/5"
                >
                  Reset
                </button>

                <button
                  type="button"
                  onClick={onSaveCurrent}
                  disabled={savingEdit || !editRole.trim() || !canEditAdmins}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-teal-600 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                >
                  <BadgeCheck className="h-4 w-4" />
                  {savingEdit ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </>
          )}
        </section>
      </div>

      {inviteOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-[28px] border border-black/10 bg-[#f7f7f7] shadow-2xl">
            <div className="shrink-0 flex items-center justify-between border-b border-black/10 px-6 py-5">
              <div>
                <div className="text-xl font-semibold text-black">
                  Invite Admin
                </div>
                <div className="mt-1 text-sm text-black/55">
                  Invite according to RBAC hierarchy
                </div>
              </div>

              <button
                className="rounded-xl border border-black/10 px-3 py-2 text-sm text-black/60 hover:bg-black/5 hover:text-black"
                onClick={() => setInviteOpen(false)}
              >
                Close
              </button>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto p-6">
              {inviteErr ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {inviteErr}
                </div>
              ) : null}

              <div className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-black/70">
                <span className="font-semibold text-black">Allowed roles:</span>{" "}
                {inviteRoleOptions.map((role) => role.label).join(", ") || "None"}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-black/45">
                    Email
                  </label>
                  <input
                    className={`${inputBase} h-12 w-full px-4`}
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="name@domain.com"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-black/45">
                    Full Name
                  </label>
                  <input
                    className={`${inputBase} h-12 w-full px-4`}
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    placeholder="Jane Doe"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-black/45">
                    Proxy Email Prefix
                  </label>
                  <input
                    className={`${inputBase} h-12 w-full px-4`}
                    value={inviteProxyEmail}
                    onChange={(e) => setInviteProxyEmail(e.target.value)}
                    placeholder="jane.doe or jane"
                  />
                  <p className="mt-2 text-xs text-black/50">
                    Final suffix will be fixed as @team.fidem.com
                  </p>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-black/45">
                    Role
                  </label>
                  <select
                    className={`${selectBase} h-12 w-full px-4`}
                    value={inviteRole}
                    onChange={(e) => {
                      setInviteRole(e.target.value as AdminRole | "");
                      setInviteParentAdmin("");
                    }}
                  >
                    <option value="">Select role</option>
                    {inviteRoleOptions.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {needsParentRevenueHead(currentRole, inviteRole) ? (
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-black/45">
                    Assign Revenue Head
                  </label>
                  <select
                    className={`${selectBase} h-12 w-full px-4`}
                    value={inviteParentAdmin}
                    onChange={(e) => setInviteParentAdmin(e.target.value)}
                  >
                    <option value="">Select Revenue Head</option>
                    {revenueHeadOptions.map((admin) => (
                      <option key={admin._id} value={admin._id}>
                        {(admin.name || admin.email) +
                          " · " +
                          getRoleLabel(admin.role)}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              <div className="overflow-hidden rounded-[24px] border border-black/10 bg-white">
                {ROLE_PERMISSION_SECTIONS.map((section) => {
                  const SectionIcon = section.icon;

                  return (
                    <div
                      key={section.key}
                      className="border-b border-black/10 last:border-b-0"
                    >
                      <div className="flex items-center gap-2 bg-black/[0.03] px-4 py-3">
                        <SectionIcon className="h-4 w-4 text-black" />
                        <span className="text-xs font-extrabold uppercase tracking-[0.18em] text-black/55">
                          {section.title}
                        </span>
                      </div>

                      {section.items.map((itemKey) => {
                        const module = getAdminModule(itemKey);
                        if (!module) return null;

                        return (
                          <div
                            key={module.key}
                            className="flex flex-col gap-4 px-4 py-5 md:flex-row md:items-center md:justify-between"
                          >
                            <div className="text-base font-medium text-black">
                              {module.label}
                            </div>

                            <PermissionSwitch
                              value={getPermissionLevel(inviteAccess, module.key)}
                              onChange={(next) =>
                                updateAccessState(setInviteAccess, module.key, next)
                              }
                            />
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="shrink-0 flex justify-end gap-2 border-t border-black/10 bg-[#f7f7f7] px-6 py-5">
              <button
                type="button"
                onClick={() => setInviteOpen(false)}
                className="rounded-2xl border border-black/10 px-5 py-3 text-sm font-medium hover:bg-black/5"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={onInvite}
                disabled={inviting || !inviteEmail.trim() || !inviteRole.trim()}
                className="rounded-2xl bg-teal-600 px-5 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
              >
                {inviting ? "Sending..." : "Send Invite"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}