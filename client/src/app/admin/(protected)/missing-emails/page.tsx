"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Search,
  Filter,
  Calendar,
  Users,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  Plus,
  MailWarning,
} from "lucide-react";
import Swal from "sweetalert2";
import { get, post } from "@/lib/api";

export type MissingEmailRecordItem = {
  _id: string;
  missingEmailId?: string | null;
  handle: string;
  platform: string;
  channelId?: string | null;
  email?: string | null;
  status?: string;
  campaigns?: any[];
  createdByAdminId?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  infoMediaKit?: {
    _id: string;
    platform: string;
    channelId?: string | null;
    channelName?: string;
    channelUrl?: string;
    thumbnail?: string;
    country?: string;
    creatorTier?: string;
    subscribers?: number;
    email?: string;
    emails?: string[];
  } | null;
};

export type MissingEmailRecordsResponse = {
  status: string;
  message?: string;
  page: number;
  limit: number;
  total: number;
  hasNext: boolean;
  data: MissingEmailRecordItem[];
};

export type MissingEmailRecordsRequest = {
  page?: number;
  limit?: number;
  search?: string;
  platform?: string;
  handle?: string;
  status?: string;
  channelId?: string;
};

export type UpdateInfluencerEmailResponse = {
  status: string;
  message: string;
  channelId: string;
  platform: string;
  email: string;
  createdMissingRecord?: boolean;
  missingEmailMatchedCount?: number;
  missingEmailModifiedCount?: number;
  invitationModifiedCount?: number;
  data?: {
    missingRecords?: MissingEmailRecordItem[];
    infoMediaKit?: any;
  };
};

type ModalSource = "record" | "manual";

const buildQueryString = (params: Record<string, any>) => {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    query.set(key, String(value));
  });

  const qs = query.toString();
  return qs ? `?${qs}` : "";
};

async function listMissingEmailRecords(
  body: MissingEmailRecordsRequest
): Promise<MissingEmailRecordsResponse> {
  const query = buildQueryString(body);

  return await get<MissingEmailRecordsResponse>(
    `/newinvitations/getAllMissing${query}`
  );
}

async function updateInfluencerEmailByChannelId(body: {
  channelId: string;
  email: string;
  handle?: string;
  platform?: string;
  channelName?: string;
  channelUrl?: string;
  thumbnail?: string;
  country?: string;
  creatorTier?: string;
  subscribers?: number;
  createdByAdminId?: string;
}): Promise<UpdateInfluencerEmailResponse> {
  return await post<UpdateInfluencerEmailResponse>(
    `/newinvitations/missing-email-records/${encodeURIComponent(
      body.channelId
    )}/email`,
    body
  );
}

const prettyDate = (iso?: string | null) => {
  if (!iso) return "—";

  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString();
};

const formatNumber = (value?: number | null) => {
  const n = Number(value);

  if (!Number.isFinite(n)) return "—";

  return n.toLocaleString();
};

const useDebouncedValue = (value: string, delay = 400) => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
};

const isValidEmail = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const normalizeHandleForApi = (value: string) => {
  const trimmed = value.trim();

  if (!trimmed) return "";

  return trimmed.startsWith("@") ? trimmed : `@${trimmed}`;
};

const getPlatformColor = (platform: string) => {
  switch (platform.toLowerCase()) {
    case "youtube":
    case "yt":
      return "bg-red-100 text-red-700 border-red-200";
    default:
      return "bg-blue-100 text-blue-700 border-blue-200";
  }
};

const getPlatformIcon = (platform: string) => {
  switch (platform.toLowerCase()) {
    case "youtube":
    case "yt":
      return <div className="w-3.5 h-3.5 bg-red-600 rounded-sm" />;
    default:
      return <div className="w-3.5 h-3.5 bg-blue-500 rounded" />;
  }
};

export default function MissingListPage() {
  const [items, setItems] = useState<MissingEmailRecordItem[]>([]);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [total, setTotal] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [platform, setPlatform] = useState("");
  const [handle, setHandle] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending" | "resolved"
  >("all");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const debouncedSearch = useDebouncedValue(search, 500);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalSource, setModalSource] = useState<ModalSource>("manual");
  const [modalHandle, setModalHandle] = useState("");
  const [modalEmail, setModalEmail] = useState("");
  const [modalChannelId, setModalChannelId] = useState("");
  const [modalTitleText, setModalTitleText] = useState("");
  const [modalPlatform, setModalPlatform] = useState<string>("youtube");
  const [emailConfirmed, setEmailConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);

  const getRecordChannelId = (row: MissingEmailRecordItem) => {
    return String(row.channelId || row.infoMediaKit?.channelId || "").trim();
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const body: MissingEmailRecordsRequest = {
        page,
        limit,
        search: debouncedSearch.trim() || undefined,
        platform: platform.trim() || undefined,
        handle: handle.trim()
          ? normalizeHandleForApi(handle.trim())
          : undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
      };

      const res = await listMissingEmailRecords(body);

      setItems(res.data || []);
      setTotal(res.total || 0);
      setHasNext(Boolean(res.hasNext));
    } catch (e: any) {
      setItems([]);
      setTotal(0);
      setHasNext(false);
      setError(
        e?.response?.data?.message ||
          e?.message ||
          "Failed to load missing email records. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, platform, handle, statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, platform, handle, statusFilter]);

  const pageCount = useMemo(
    () => Math.max(1, Math.ceil(total / Math.max(1, limit))),
    [total, limit]
  );

  const hasActiveFilters = Boolean(
    search || platform || handle || statusFilter !== "all"
  );

  const clearFilters = () => {
    setSearch("");
    setPlatform("");
    setHandle("");
    setStatusFilter("all");
  };

  const openModalForRecord = (row: MissingEmailRecordItem) => {
    const channelId = getRecordChannelId(row);

    setModalSource("record");
    setModalHandle(row.handle || "");
    setModalEmail(row.email || row.infoMediaKit?.email || "");
    setModalChannelId(channelId);
    setModalTitleText(row.infoMediaKit?.channelName || row.handle || "");
    setModalPlatform(row.platform || "youtube");
    setEmailConfirmed(false);
    setModalOpen(true);
  };

  const openModalManual = () => {
    setModalSource("manual");
    setModalHandle("");
    setModalEmail("");
    setModalChannelId("");
    setModalTitleText("");
    setModalPlatform("youtube");
    setEmailConfirmed(false);
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;

    setModalOpen(false);
    setModalSource("manual");
    setModalHandle("");
    setModalEmail("");
    setModalChannelId("");
    setModalTitleText("");
    setModalPlatform("youtube");
    setEmailConfirmed(false);
  };

  const handleSaveDetails = async () => {
    const email = modalEmail.trim();
    const channelId = modalChannelId.trim();
    let handleVal = modalHandle.trim();

    if (!channelId) {
      await Swal.fire("Missing channel ID", "Please enter channelId.", "warning");
      return;
    }

    if (!email) {
      await Swal.fire("Missing email", "Please enter an email address.", "warning");
      return;
    }

    if (!isValidEmail(email)) {
      await Swal.fire("Invalid email", "Please enter a valid email address.", "warning");
      return;
    }

    if (!emailConfirmed) {
      await Swal.fire(
        "Confirm email",
        "Please confirm that this email is correct for the influencer.",
        "warning"
      );
      return;
    }

    if (handleVal && !handleVal.startsWith("@")) {
      handleVal = `@${handleVal}`;
    }

    setSaving(true);

    try {
      const res = await updateInfluencerEmailByChannelId({
        channelId,
        email,
        handle: handleVal || undefined,
        platform: modalPlatform || "youtube",
      });

      await Swal.fire(
        "Saved",
        res?.message || "Influencer email updated successfully.",
        "success"
      );

      closeModal();
      fetchData();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to save details. Please try again.";

      await Swal.fire("Error", msg, "error");
    } finally {
      setSaving(false);
    }
  };

  const modalTitle =
    modalSource === "record"
      ? "Add / update influencer email"
      : "Add new influencer email";

  const primaryButtonLabel = "Save email";
  const currentCountLabel = "missing email records";
  const tableColSpan = 8;

  return (
    <div className="min-h-screen">
      <div className="max-w-[1800px] mx-auto">
        <header className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Missing Email Records
              </h1>

              <p className="text-gray-600">
                Admin panel to check missing influencer emails and update them by
                YouTube channel ID.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 text-sm">
              <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border">
                <MailWarning className="w-4 h-4 text-orange-600" />

                <span className="font-medium text-gray-900">
                  {total.toLocaleString()}
                </span>

                <span className="text-gray-500">{currentCountLabel}</span>
              </div>

              <button
                onClick={openModalManual}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-blue-600 text-white text-sm font-medium shadow-sm hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add channel/email</span>
              </button>
            </div>
          </div>
        </header>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />

            <input
              placeholder="Search by handle, email, channel ID, campaign name..."
              className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <Filter className="w-4 h-4" />
              Advanced Filters

              {hasActiveFilters && (
                <span className="w-2 h-2 bg-blue-500 rounded-full" />
              )}
            </button>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Clear filters
              </button>
            )}
          </div>

          {filtersOpen && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-100">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Platform
                </label>

                <select
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                >
                  <option value="">All platforms</option>
                  <option value="youtube">YouTube</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Handle
                </label>

                <input
                  placeholder="@handle or handle"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>

                <select
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(
                      e.target.value as "all" | "pending" | "resolved"
                    )
                  }
                >
                  <option value="all">All</option>
                  <option value="pending">Pending</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <Th>Creator</Th>
                  <Th>Channel ID</Th>
                  <Th>Email</Th>
                  <Th>Platform</Th>
                  <Th>Status</Th>
                  <Th>Campaigns</Th>
                  <Th>Updated</Th>
                  <Th>Actions</Th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {loading && (
                  <tr>
                    <td colSpan={tableColSpan} className="p-12 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                        <span className="text-gray-600">Loading data...</span>
                      </div>
                    </td>
                  </tr>
                )}

                {!loading && items.length === 0 && (
                  <tr>
                    <td colSpan={tableColSpan} className="p-12 text-center">
                      <div className="text-gray-500">
                        <Users className="w-12 h-12 mx-auto mb-3 opacity-40" />
                        <p className="font-medium">No results found</p>
                        <p className="text-sm">
                          Try adjusting your search or filters
                        </p>
                      </div>
                    </td>
                  </tr>
                )}

                {!loading &&
                  items.map((item, index) => {
                    const channelId = getRecordChannelId(item);
                    const email = item.email || item.infoMediaKit?.email || "";
                    const campaignCount = Array.isArray(item.campaigns)
                      ? item.campaigns.length
                      : 0;

                    return (
                      <tr
                        key={item._id || `${item.handle}-${index}`}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <Td>
                          <div className="font-medium text-gray-900">
                            {item.infoMediaKit?.channelName ||
                              item.handle ||
                              "—"}
                          </div>

                          <div className="text-xs text-gray-500 mt-1">
                            Handle:{" "}
                            <span className="font-medium">
                              {item.handle || "—"}
                            </span>
                          </div>

                          {item.infoMediaKit?.subscribers !== undefined && (
                            <div className="text-xs text-gray-500 mt-1">
                              Subscribers:{" "}
                              {formatNumber(item.infoMediaKit.subscribers)}
                            </div>
                          )}
                        </Td>

                        <Td mono>
                          <span className="text-gray-800">
                            {channelId || "—"}
                          </span>
                        </Td>

                        <Td mono>
                          <span
                            className={email ? "text-gray-800" : "text-orange-600"}
                          >
                            {email || "Missing email"}
                          </span>
                        </Td>

                        <Td>
                          <div className="flex items-center gap-2">
                            {getPlatformIcon(item.platform || "youtube")}

                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getPlatformColor(
                                item.platform || "youtube"
                              )}`}
                            >
                              {item.platform || "youtube"}
                            </span>
                          </div>
                        </Td>

                        <Td>
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
                              item.status === "resolved"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-orange-50 text-orange-700 border-orange-200"
                            }`}
                          >
                            {item.status || "pending"}
                          </span>
                        </Td>

                        <Td>
                          <div className="text-sm text-gray-800">
                            {campaignCount ? `${campaignCount} campaign(s)` : "—"}
                          </div>

                          {campaignCount > 0 && item.campaigns?.[0]?.campaignName && (
                            <div className="text-xs text-gray-500 mt-1 max-w-[240px] truncate">
                              {item.campaigns[0].campaignName}
                            </div>
                          )}
                        </Td>

                        <Td>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Calendar className="w-4 h-4 opacity-50" />

                            <span className="text-sm">
                              {prettyDate(item.updatedAt || item.createdAt)}
                            </span>
                          </div>
                        </Td>

                        <Td>
                          <button
                            onClick={() => openModalForRecord(item)}
                            className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium rounded-lg border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
                          >
                            Add / update email
                          </button>
                        </Td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          <div className="bg-gray-50 border-t border-gray-200 px-6 py-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>Show</span>

                  <select
                    className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={limit}
                    onChange={(e) => setLimit(parseInt(e.target.value, 10))}
                  >
                    {[25, 50, 100, 150, 200].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>

                  <span>per page</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-600">
                  Page <span className="font-medium">{page}</span> of{" "}
                  <span className="font-medium">{pageCount}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1 || loading}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>

                  <button
                    className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={!hasNext || loading}
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {modalTitle}
              </h2>

              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
                disabled={saving}
              >
                ✕
              </button>
            </div>

            {modalSource === "record" && (
              <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50 p-3">
                <p className="text-xs font-medium text-blue-700 mb-1">
                  Selected influencer
                </p>

                <p className="text-sm text-blue-900">
                  {modalTitleText || modalHandle || "Creator"}
                </p>

                {modalChannelId && (
                  <p className="mt-1 text-xs text-blue-700 break-all">
                    Channel ID: {modalChannelId}
                  </p>
                )}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Handle
                </label>

                <input
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm read-only:bg-gray-50 read-only:text-gray-500"
                  placeholder="@creatorhandle"
                  value={modalHandle}
                  onChange={(e) => setModalHandle(e.target.value)}
                  readOnly={modalSource !== "manual"}
                />

                {modalSource !== "manual" && (
                  <p className="mt-1 text-xs text-gray-500">
                    Handle is prefilled from the selected row.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Channel ID
                </label>

                <input
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm read-only:bg-gray-50 read-only:text-gray-500"
                  placeholder="YouTube channelId"
                  value={modalChannelId}
                  onChange={(e) => setModalChannelId(e.target.value)}
                  readOnly={modalSource !== "manual"}
                />

                {modalSource !== "manual" && (
                  <p className="mt-1 text-xs text-gray-500">
                    Channel ID is used to update MissingEmail and InfoMediaKit.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>

                <input
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="creator@example.com"
                  value={modalEmail}
                  onChange={(e) => setModalEmail(e.target.value)}
                />

                <div className="mt-3 flex items-start gap-2">
                  <input
                    id="email-confirm-checkbox"
                    type="checkbox"
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    checked={emailConfirmed}
                    onChange={(e) => setEmailConfirmed(e.target.checked)}
                  />

                  <label
                    htmlFor="email-confirm-checkbox"
                    className="text-xs text-gray-700"
                  >
                    This email is correct for the influencer.
                  </label>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100"
                disabled={saving}
              >
                Cancel
              </button>

              <button
                onClick={handleSaveDetails}
                disabled={saving || !emailConfirmed}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}

                <span>{saving ? "Saving..." : primaryButtonLabel}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
      {children}
    </th>
  );
}

function Td({
  children,
  mono = false,
}: {
  children: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <td
      className={`px-6 py-4 align-top whitespace-nowrap ${
        mono ? "font-mono text-sm" : ""
      }`}
    >
      {children}
    </td>
  );
}