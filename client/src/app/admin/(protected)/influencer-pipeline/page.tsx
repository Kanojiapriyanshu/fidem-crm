'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  FolderKanban,
  RefreshCw,
  CalendarDays,
  BadgeIndianRupee,
  UserRound,
  Users,
  Tag,
  Layers3,
  ChevronRight,
} from 'lucide-react';
import swal from 'sweetalert';
import { get } from '@/lib/api';

type CampaignItem = {
  _id: string;
  brandId?: string;
  brandName?: string;
  campaignTitle?: string;
  campaignType?: string;
  campaignCategory?: string;
  campaignSubcategory?: string;
  numberOfInfluencers?: number;
  targetCountry?: string;
  campaignBudget?: number;
  budget?: number;
  influencerBudget?: number;
  paymentType?: string;
  platformSelection?: string[];
  scheduledAt?: string | null;
  startAt?: string | null;
  endAt?: string | null;
  status?: string;
  publishStatus?: string;
  createdAt?: string;
  updatedAt?: string;
  assignedRh?: string;
  assignedBme?: string;
  assignedIme?: string;
};

type CampaignListResponse = {
  success: boolean;
  count: number;
  data: CampaignItem[];
};

function showErr(message: string) {
  return swal({
    title: 'Error',
    text: message || 'Something went wrong.',
    icon: 'error',
  });
}

function formatDate(value?: string | null) {
  if (!value) return '--';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '--';

  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  }).format(d);
}

function formatCurrency(value?: number) {
  if (value == null || !Number.isFinite(value)) return '--';
  return new Intl.NumberFormat('en-IN').format(value);
}

function getStatusClasses(status?: string) {
  switch ((status || '').toLowerCase()) {
    case 'active':
      return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200';
    case 'completed':
      return 'bg-blue-50 text-blue-700 ring-1 ring-blue-200';
    case 'draft':
      return 'bg-amber-50 text-amber-700 ring-1 ring-amber-200';
    case 'paused':
      return 'bg-orange-50 text-orange-700 ring-1 ring-orange-200';
    case 'inactive':
      return 'bg-slate-100 text-slate-600 ring-1 ring-slate-200';
    default:
      return 'bg-slate-100 text-slate-700 ring-1 ring-slate-200';
  }
}

function AssigneeChip({
  label,
  value,
}: {
  label: string;
  value?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-medium text-slate-800">
        {value || '--'}
      </p>
    </div>
  );
}

export default function CampaignsPage() {
  const [items, setItems] = useState<CampaignItem[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadCampaigns() {
    setLoading(true);
    try {
      const resp = await get<CampaignListResponse>('/admins/campaign/list');
      setItems(Array.isArray(resp?.data) ? resp.data : []);
    } catch (e: any) {
      await showErr(e?.message || 'Failed to load campaigns.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCampaigns();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Campaigns
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Click any campaign to open Outreach, Roster, and Pitch pipeline.
            </p>
          </div>

          <button
            type="button"
            onClick={loadCampaigns}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-100"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center text-slate-500 shadow-sm">
            <RefreshCw className="mx-auto mb-3 h-8 w-8 animate-spin" />
            Loading campaigns...
          </div>
        ) : !items.length ? (
          <div className="rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center text-slate-500 shadow-sm">
            No campaigns found.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((campaign) => (
              <Link
                key={campaign._id}
                href={`/admin/influencer-pipeline/pipeline?id=${campaign._id}`}
                className="group flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-teal-200 hover:shadow-lg"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 ring-1 ring-teal-100">
                    <FolderKanban className="h-6 w-6" />
                  </div>

                  <span
                    className={`inline-flex shrink-0 rounded-full px-3 py-1 text-xs font-semibold capitalize ${getStatusClasses(
                      campaign.status
                    )}`}
                  >
                    {campaign.status || '--'}
                  </span>
                </div>

                <div className="mt-4">
                  <h2 className="line-clamp-2 text-lg font-bold leading-6 text-slate-900 transition group-hover:text-teal-700">
                    {campaign.campaignTitle || 'Untitled Campaign'}
                  </h2>

                  <p className="mt-2 text-sm text-slate-600">
                    <span className="font-semibold text-slate-800">Brand:</span>{' '}
                    {campaign.brandName || '--'}
                  </p>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                    <Tag className="h-3.5 w-3.5" />
                    {campaign.campaignType || '--'}
                  </span>

                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                    <Layers3 className="h-3.5 w-3.5" />
                    {campaign.campaignCategory || '--'}
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <div className="flex items-center gap-2 text-slate-500">
                      <BadgeIndianRupee className="h-4 w-4" />
                      <span className="text-xs font-semibold uppercase tracking-wide">
                        Budget
                      </span>
                    </div>
                    <p className="mt-2 text-base font-bold text-slate-900">
                      ₹ {formatCurrency(campaign.campaignBudget ?? campaign.budget)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <div className="flex items-center gap-2 text-slate-500">
                      <Users className="h-4 w-4" />
                      <span className="text-xs font-semibold uppercase tracking-wide">
                        Influencers
                      </span>
                    </div>
                    <p className="mt-2 text-base font-bold text-slate-900">
                      {campaign.numberOfInfluencers ?? '--'}
                    </p>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-center gap-2 text-slate-500">
                    <CalendarDays className="h-4 w-4" />
                    <span className="text-xs font-semibold uppercase tracking-wide">
                      Campaign Duration
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-medium text-slate-800">
                    {formatDate(campaign.startAt)} - {formatDate(campaign.endAt)}
                  </p>
                </div>

                <div className="mt-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Platforms
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {Array.isArray(campaign.platformSelection) &&
                    campaign.platformSelection.length ? (
                      campaign.platformSelection.map((platform) => (
                        <span
                          key={platform}
                          className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold capitalize text-teal-700 ring-1 ring-teal-100"
                        >
                          {platform}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-slate-500">--</span>
                    )}
                  </div>
                </div>

                <div className="mt-5 border-t border-slate-200 pt-4">
                  <div className="mb-3 flex items-center gap-2">
                    <UserRound className="h-4 w-4 text-slate-500" />
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Assigned Team
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <AssigneeChip label="RH" value={campaign.assignedRh} />
                    <AssigneeChip label="BME" value={campaign.assignedBme} />
                    <AssigneeChip label="IME" value={campaign.assignedIme} />
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-slate-200 pt-4 text-sm font-semibold text-teal-600">
                  <span>Open Pipeline</span>
                  <ChevronRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}