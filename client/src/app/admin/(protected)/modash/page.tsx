'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ChevronDown,
  ExternalLink,
  Info,
  RefreshCw,
  Search,
  Download,
  Filter,
  X,
} from 'lucide-react';
import swal from 'sweetalert';
import { get, post } from '@/lib/api';
import { Checkbox } from '@/components/animate-ui/components/radix/checkbox';

const DASH = '--';

type LangObj = { code?: string; name?: string };

type CategoryObj = {
  categoryId?: string | null;
  categoryName?: string | null;
  subcategoryId?: string | null;
  subcategoryName?: string | null;
};

type InfluencerDoc = {
  _id?: string;
  provider?: string;
  platform?: string;
  userId?: string;

  fullname?: string;
  handle?: string;
  username?: string;

  country?: string | null;
  city?: string | null;
  state?: string | null;
  language?: LangObj | string | null;

  followers?: number | null;
  averageViews?: number | null;
  engagements?: number | null;
  engagementRate?: number | null;

  isPrivate?: boolean | null;
  isVerified?: boolean | null;

  picture?: string | null;
  url?: string | null;

  createdAt?: string;
  updatedAt?: string;

  influencerId?: string;
  influencer?: string;

  bio?: string | null;
  category?: string[] | string | null;
  categories?: Array<CategoryObj | string> | string[] | null;
};

type ListResponse = {
  page: number;
  limit: number;
  total: number;
  results: InfluencerDoc[];
};

type InfluencerFilters = {
  followersMin?: string;
  followersMax?: string;
  countries?: string[];
  country?: string;
  provider?: string;
  category?: string;
  categories?: string[];
};

type Platform = 'youtube' | 'instagram' | 'tiktok';

const PLATFORM_OPTIONS: { key: Platform; label: string }[] = [
  { key: 'youtube', label: 'YouTube' },
  { key: 'instagram', label: 'Instagram' },
  { key: 'tiktok', label: 'TikTok' },
];

const COUNTRY_OPTIONS: Array<{ code: string; name: string }> = [
  { code: 'US', name: 'United States' },
  { code: 'IN', name: 'India' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'IE', name: 'Ireland' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'IT', name: 'Italy' },
  { code: 'ES', name: 'Spain' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'BE', name: 'Belgium' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'AT', name: 'Austria' },
  { code: 'SE', name: 'Sweden' },
  { code: 'NO', name: 'Norway' },
  { code: 'DK', name: 'Denmark' },
  { code: 'FI', name: 'Finland' },
  { code: 'PL', name: 'Poland' },
  { code: 'CZ', name: 'Czechia' },
  { code: 'PT', name: 'Portugal' },
  { code: 'RO', name: 'Romania' },
  { code: 'GR', name: 'Greece' },
  { code: 'TR', name: 'Turkey' },
  { code: 'UA', name: 'Ukraine' },
  { code: 'RU', name: 'Russia' },
  { code: 'BR', name: 'Brazil' },
  { code: 'AR', name: 'Argentina' },
  { code: 'CL', name: 'Chile' },
  { code: 'CO', name: 'Colombia' },
  { code: 'MX', name: 'Mexico' },
  { code: 'PE', name: 'Peru' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'NG', name: 'Nigeria' },
  { code: 'EG', name: 'Egypt' },
  { code: 'KE', name: 'Kenya' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'IL', name: 'Israel' },
  { code: 'SG', name: 'Singapore' },
  { code: 'MY', name: 'Malaysia' },
  { code: 'ID', name: 'Indonesia' },
  { code: 'PH', name: 'Philippines' },
  { code: 'TH', name: 'Thailand' },
  { code: 'VN', name: 'Vietnam' },
  { code: 'JP', name: 'Japan' },
  { code: 'KR', name: 'South Korea' },
  { code: 'HK', name: 'Hong Kong' },
  { code: 'TW', name: 'Taiwan' },
  { code: 'CN', name: 'China' },
  { code: 'PK', name: 'Pakistan' },
  { code: 'BD', name: 'Bangladesh' },
  { code: 'LK', name: 'Sri Lanka' },
  { code: 'NP', name: 'Nepal' },
];

function cleanStr(v: unknown) {
  if (v === undefined || v === null) return '';
  return String(v).trim();
}

function showErr(message: string) {
  return swal({
    title: 'Error',
    text: message || 'Something went wrong.',
    icon: 'error',
  });
}

function formatNumber(n?: number | null) {
  if (n == null || !Number.isFinite(n)) return DASH;
  return new Intl.NumberFormat('en-IN').format(n);
}

function formatPercent(x?: number | null) {
  if (x == null || !Number.isFinite(x)) return DASH;
  return `${(x * 100).toFixed(2)}%`;
}

function formatBool(b?: boolean | null) {
  if (b === true) return 'Yes';
  if (b === false) return 'No';
  return DASH;
}

function formatDate(iso?: string | null, timeZone = 'Asia/Kolkata') {
  if (!iso) return DASH;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return DASH;

  return new Intl.DateTimeFormat('en-IN', {
    timeZone,
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

function splitCsv(v: string): string[] {
  return (v || '')
    .split(/[,\n]/g)
    .map((x) => x.trim())
    .filter(Boolean);
}

function countryLabel(code: string) {
  const c = COUNTRY_OPTIONS.find((x) => x.code === code);
  return c ? `${c.code} — ${c.name}` : code;
}

function countryCodeToName(codeOrName: string) {
  const normalized = cleanStr(codeOrName).toUpperCase();
  const found = COUNTRY_OPTIONS.find((x) => x.code === normalized);
  return found ? found.name : cleanStr(codeOrName);
}

function countriesToCsv(f: InfluencerFilters) {
  if (Array.isArray(f.countries) && f.countries.length) {
    return f.countries.map(countryCodeToName).join(',');
  }
  return cleanStr(f.country || '');
}

function categoriesFromFilter(f: InfluencerFilters) {
  const arr =
    Array.isArray(f.categories) && f.categories.length
      ? f.categories
      : splitCsv(String(f.category || ''));

  return Array.from(new Set(arr.map((x) => x.trim()).filter(Boolean)));
}

function chipText(filters: InfluencerFilters) {
  const chips: string[] = [];

  if (filters.provider && filters.provider !== 'all') {
    chips.push(`Provider: ${filters.provider}`);
  }

  if (filters.followersMin || filters.followersMax) {
    chips.push(
      `Followers: ${filters.followersMin || '0'} - ${filters.followersMax || '∞'}`
    );
  }

  const cs =
    Array.isArray(filters.countries) && filters.countries.length
      ? filters.countries.map(countryCodeToName)
      : splitCsv(filters.country || '');

  if (cs.length) chips.push(`Country: ${cs.join(', ')}`);

  const cats = categoriesFromFilter(filters);
  if (cats.length) chips.push(`Category: ${cats.join(', ')}`);

  return chips;
}

function getCategoryNames(doc: InfluencerDoc) {
  const out = new Set<string>();

  const push = (v?: string | null) => {
    const s = cleanStr(v);
    if (s) out.add(s);
  };

  if (Array.isArray(doc.category)) {
    doc.category.forEach((x) => push(String(x)));
  } else {
    push(doc.category as string);
  }

  if (Array.isArray(doc.categories)) {
    for (const item of doc.categories) {
      if (!item) continue;
      if (typeof item === 'string') {
        push(item);
      } else {
        push(item.categoryName || null);
        push(item.subcategoryName || null);
      }
    }
  }

  return Array.from(out);
}

function getRowKey(p: InfluencerDoc) {
  const platform = cleanStr(p.provider || p.platform || 'unknown').toLowerCase();
  const userId = cleanStr(p.userId);
  if (userId) return `${platform}:${userId}`;

  const fallback = cleanStr(
    p._id || p.influencerId || p.handle || p.username || p.url || 'missing_id'
  );
  return `${platform}:${fallback}`;
}

function toDomId(key: string) {
  return `row_${String(key).replace(/[^a-zA-Z0-9_-]/g, '_')}`;
}

function MultiCountrySelect({
  value,
  onChange,
}: {
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const [pos, setPos] = useState<{ left: number; top: number; width: number } | null>(null);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return COUNTRY_OPTIONS;
    return COUNTRY_OPTIONS.filter(
      (c) =>
        c.code.toLowerCase().includes(s) || c.name.toLowerCase().includes(s)
    );
  }, [q]);

  const summary = value?.length ? value.join(', ') : 'All';

  function updatePos() {
    const el = btnRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPos({ left: r.left, top: r.bottom + 8, width: r.width });
  }

  function toggle(code: string) {
    const next = new Set(value || []);
    if (next.has(code)) next.delete(code);
    else next.add(code);
    onChange(Array.from(next).sort());
  }

  useEffect(() => {
    if (!open) return;

    updatePos();

    const onReflow = () => updatePos();
    window.addEventListener('scroll', onReflow, true);
    window.addEventListener('resize', onReflow);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);

    return () => {
      window.removeEventListener('scroll', onReflow, true);
      window.removeEventListener('resize', onReflow);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const overlay =
    open && pos && typeof document !== 'undefined'
      ? createPortal(
        <div className="fixed inset-0 z-[9999]">
          <div
            className="absolute inset-0 bg-black/10"
            onClick={() => setOpen(false)}
          />

          <div
            className="fixed overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
            style={{
              left: pos.left,
              top: pos.top,
              width: pos.width,
              maxHeight: 'min(70vh, 520px)',
            }}
          >
            <div className="border-b border-slate-200 p-3">
              <input
                className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-transparent focus:ring-2 focus:ring-teal-600"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search country"
                autoFocus
              />
              <div className="mt-2 flex items-center justify-between">
                <button
                  type="button"
                  className="text-xs font-semibold text-slate-700 hover:underline"
                  onClick={() => onChange([])}
                >
                  Clear
                </button>
                <span className="text-xs text-slate-500">
                  {value.length} selected
                </span>
              </div>
            </div>

            <div className="max-h-[420px] overflow-auto p-2">
              {filtered.map((c) => {
                const checked = value.includes(c.code);
                return (
                  <label
                    key={c.code}
                    className="flex cursor-pointer items-center gap-2 rounded-xl px-2 py-2 hover:bg-slate-50"
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => toggle(c.code)}
                    />
                    <span className="text-sm text-slate-800">
                      {countryLabel(c.code)}
                    </span>
                  </label>
                );
              })}

              {!filtered.length ? (
                <div className="px-2 py-6 text-center text-sm text-slate-500">
                  No countries found
                </div>
              ) : null}
            </div>

            <div className="border-t border-slate-200 bg-slate-50 p-3">
              <button
                type="button"
                className="w-full rounded-xl bg-teal-600 px-3 py-2 text-sm font-semibold text-white hover:bg-teal-700"
                onClick={() => setOpen(false)}
              >
                Done
              </button>
            </div>
          </div>
        </div>,
        document.body
      )
      : null;

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className="flex w-full items-center justify-between gap-2 rounded-xl border border-slate-300 bg-white px-3 py-3 text-left hover:bg-slate-50"
        onClick={() => {
          setOpen((v) => {
            const next = !v;
            if (!v && next) updatePos();
            return next;
          });
        }}
      >
        <span className="truncate text-sm text-slate-800">{summary}</span>
        <ChevronDown
          className={`h-4 w-4 text-slate-500 transition-transform ${open ? 'rotate-180' : ''
            }`}
        />
      </button>

      {overlay}
    </>
  );
}

export default function Page() {
  const searchParams = useSearchParams();
  const campaignId = cleanStr(searchParams.get('id'));

  const SAVED_ENDPOINT = '/modash/saved';
  const USERS_ENDPOINT = '/modash/users';
  const EXPORT_ENDPOINT = '/modash/export-csv';

  const [items, setItems] = useState<InfluencerDoc[]>([]);
  const [usersItems, setUsersItems] = useState<InfluencerDoc[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [view, setView] = useState<'saved' | 'users'>('saved');

  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [total, setTotal] = useState(0);
  const [hasNext, setHasNext] = useState(false);

  const [query, setQuery] = useState('');
  const [listLoading, setListLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [downloadLimit, setDownloadLimit] = useState('');

  const [searchPlatforms, setSearchPlatforms] = useState<Record<Platform, boolean>>({
    youtube: true,
    instagram: true,
    tiktok: true,
  });

  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});
  const [selectedMeta, setSelectedMeta] = useState<Record<string, { modashId?: string }>>({});

  const [filtersDraft, setFiltersDraft] = useState<InfluencerFilters>({
    provider: 'all',
    followersMin: '',
    followersMax: '',
    countries: [],
    category: '',
  });

  const [filtersActive, setFiltersActive] = useState<InfluencerFilters>({
    provider: 'all',
    followersMin: '',
    followersMax: '',
    countries: [],
    category: '',
  });

  const selectedPlatformKeys = useMemo(() => {
    return PLATFORM_OPTIONS.filter((p) => !!searchPlatforms[p.key]).map((p) => p.key);
  }, [searchPlatforms]);

  const selectedCount = useMemo(
    () => Object.values(selectedIds).filter(Boolean).length,
    [selectedIds]
  );

  const selectedModashIds = useMemo(() => {
    return Object.entries(selectedIds)
      .filter(([, v]) => v)
      .map(([rowKey]) => selectedMeta[rowKey]?.modashId)
      .filter(Boolean) as string[];
  }, [selectedIds, selectedMeta]);

  const activeChips = useMemo(() => chipText(filtersActive), [filtersActive]);

  const platformChip = useMemo(() => {
    if (selectedPlatformKeys.length === 0) return 'Global search: none';
    if (selectedPlatformKeys.length === 3) return 'Global search: all platforms';
    return `Global search: ${selectedPlatformKeys.join(', ')}`;
  }, [selectedPlatformKeys]);

  const currentItems = view === 'saved' ? items : usersItems;

  const itemsByHandle = useMemo(() => {
    const map = new Map<string, { key: string; doc: InfluencerDoc }>();
    for (const x of items) {
      const h = cleanStr(x.handle || x.username).toLowerCase();
      if (h) map.set(h.replace(/^@/, ''), { key: getRowKey(x), doc: x });
    }
    return map;
  }, [items]);

  function toggleExpand(rowKey: string) {
    setExpanded((p) => ({ ...p, [rowKey]: !p[rowKey] }));
  }

  function openAndScrollTo(rowKey: string) {
    setExpanded((p) => ({ ...p, [rowKey]: true }));
    setTimeout(() => {
      const el = document.getElementById(toDomId(rowKey));
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  }

  function toggleSelect(rowKey: string, checked: boolean, modashId?: string) {
    setSelectedIds((prev) => ({ ...prev, [rowKey]: checked }));

    setSelectedMeta((prev) => {
      const next = { ...prev };
      if (!checked) {
        delete next[rowKey];
        return next;
      }
      next[rowKey] = { modashId: modashId || next[rowKey]?.modashId };
      return next;
    });
  }

  function clearSelection() {
    setSelectedIds({});
    setSelectedMeta({});
  }

async function addOutreach() {
  try {
    if (!campaignId) {
      await showErr('Campaign id missing.');
      return;
    }

    const selectedRows = currentItems.filter((it) => selectedIds[getRowKey(it)]);

    const modashIds = selectedRows
      .map((x) => x._id)
      .filter(Boolean);

    const rawUsers = selectedRows
      .filter((x) => !x._id)
      .map((x) => ({
        sourceRefId: x.userId || x.handle || x.username,
        platform: x.platform || x.provider,
        fullname: x.fullname,
        username: x.username,
        handle: x.handle,
        userId: x.userId,
        followers: x.followers,
        url: x.url,
        picture: x.picture,
        categories: getCategoryNames(x),
        bio: x.bio,
        country: x.country,
        state: x.state,
        city: x.city,
        language:
          typeof x.language === 'string'
            ? x.language
            : x.language?.name || x.language?.code,
        engagementRate: x.engagementRate,
      }));

    await post('/pipeline/bulk-add', {
      campaignId,
      modashIds,
      rawUsers,
    });

    swal({ title: 'Done', text: 'Added to outreach pipeline.', icon: 'success' });
    clearSelection();
  } catch (e: any) {
    await showErr(e?.message || 'Failed to add to outreach.');
  }
}

  function selectAllOnPage(list: InfluencerDoc[]) {
    const nextIds: Record<string, boolean> = {};
    const nextMeta: Record<string, { modashId?: string }> = {};

    for (const it of list) {
      const key = getRowKey(it);
      nextIds[key] = true;
      if (it._id) nextMeta[key] = { modashId: String(it._id) };
    }

    setSelectedIds((prev) => ({ ...prev, ...nextIds }));
    setSelectedMeta((prev) => ({ ...prev, ...nextMeta }));
  }

  function clearSelectionOnPage(list: InfluencerDoc[]) {
    setSelectedIds((prev) => {
      const next = { ...prev };
      for (const it of list) delete next[getRowKey(it)];
      return next;
    });

    setSelectedMeta((prev) => {
      const next = { ...prev };
      for (const it of list) delete next[getRowKey(it)];
      return next;
    });
  }

  function getEffectiveSearchPlatforms() {
    const checked = selectedPlatformKeys;

    if (!checked.length) return [];

    const provider = cleanStr(filtersActive.provider).toLowerCase();
    if (provider && provider !== 'all') {
      return checked.includes(provider as Platform) ? [provider as Platform] : [provider as Platform];
    }

    return checked;
  }

  function buildSavedParams(pUI: number, f: InfluencerFilters, q: string) {
    const params: Record<string, any> = {
      page: Math.max(0, pUI - 1),
      limit,
      sort: 'updatedAt',
      dir: 'desc',
    };

    const qClean = cleanStr(q);
    if (qClean) params.q = qClean;

    if (f.provider && f.provider !== 'all') {
      params.provider = f.provider;
    }

    if (cleanStr(f.followersMin)) params.minFollowers = cleanStr(f.followersMin);
    if (cleanStr(f.followersMax)) params.maxFollowers = cleanStr(f.followersMax);

    const countryCsv = countriesToCsv(f);
    if (countryCsv) params.country = countryCsv;

    const cats = categoriesFromFilter(f);
    if (cats.length) params.category = cats.join(',');

    return params;
  }

  function buildUsersParams(pUI: number, q: string, f: InfluencerFilters) {
    const params: Record<string, any> = {
      page: Math.max(0, pUI - 1),
      limit,
    };

    const qClean = cleanStr(q);
    if (qClean) params.q = qClean;

    const effectivePlatforms = getEffectiveSearchPlatforms();
    if (effectivePlatforms.length === 1) {
      params.platform = effectivePlatforms[0];
    } else if (effectivePlatforms.length > 1) {
      params.platforms = effectivePlatforms.join(',');
    }

    if (f.provider && f.provider !== 'all') {
      params.provider = f.provider;
    }

    if (cleanStr(f.followersMin)) params.minFollowers = cleanStr(f.followersMin);
    if (cleanStr(f.followersMax)) params.maxFollowers = cleanStr(f.followersMax);

    const countryCsv = countriesToCsv(f);
    if (countryCsv) params.country = countryCsv;

    const cats = categoriesFromFilter(f);
    if (cats.length) params.category = cats.join(',');

    return params;
  }

  function updatePaging(resp: ListResponse, fallbackLength = 0) {
    const serverPage = Number(resp?.page ?? 0);
    const serverLimit = Number(resp?.limit ?? limit);
    const serverTotal = Number(resp?.total ?? fallbackLength);

    setPage(serverPage + 1);
    setHasNext((serverPage + 1) * serverLimit < serverTotal);
    setTotal(serverTotal);
  }

  async function loadSaved(
    pUI = 1,
    f: InfluencerFilters = filtersActive,
    q = ''
  ) {
    setListLoading(true);
    try {
      const resp = await get<ListResponse>(SAVED_ENDPOINT, buildSavedParams(pUI, f, q));

      setView('saved');
      setUsersItems([]);

      const results = Array.isArray(resp?.results) ? resp.results : [];
      setItems(results);
      updatePaging(resp, results.length);
    } catch (e: any) {
      await showErr(e?.message || 'Failed to load saved influencers.');
    } finally {
      setListLoading(false);
    }
  }

  async function loadUsers(
    pUI = 1,
    q = '',
    f: InfluencerFilters = filtersActive
  ) {
    setListLoading(true);
    try {
      const resp = await get<ListResponse>(USERS_ENDPOINT, buildUsersParams(pUI, q, f));

      setView('users');
      const results = Array.isArray(resp?.results) ? resp.results : [];
      setUsersItems(results);
      updatePaging(resp, results.length);
    } catch (e: any) {
      await showErr(e?.message || 'Failed to load users.');
    } finally {
      setListLoading(false);
    }
  }

  function applyFilters() {
    const cats = categoriesFromFilter(filtersDraft);
    const next: InfluencerFilters = {
      ...filtersDraft,
      categories: cats,
    };

    setFiltersActive(next);
    clearSelection();
    loadSaved(1, next, query.trim());
  }

  function clearFilters() {
    const empty: InfluencerFilters = {
      provider: 'all',
      followersMin: '',
      followersMax: '',
      countries: [],
      country: '',
      category: '',
      categories: [],
    };

    setFiltersDraft(empty);
    setFiltersActive(empty);
    clearSelection();
    loadSaved(1, empty, query.trim());
  }

  async function onSearch(e: React.FormEvent) {
    e.preventDefault();

    const q = cleanStr(query).replace(/^@/, '');
    if (!q) {
      await showErr('Please enter a handle/username to search.');
      return;
    }

    if (!selectedPlatformKeys.length) {
      await showErr('Select at least one platform for global search.');
      return;
    }

    const existing = itemsByHandle.get(q.toLowerCase());
    if (existing?.key) {
      setView('saved');
      openAndScrollTo(existing.key);
      return;
    }

    setSearchLoading(true);
    try {
      const savedResp = await get<ListResponse>(
        SAVED_ENDPOINT,
        buildSavedParams(1, filtersActive, q)
      );

      const savedResults = Array.isArray(savedResp?.results)
        ? savedResp.results
        : [];

      if (savedResults.length) {
        setView('saved');
        setUsersItems([]);
        setItems(savedResults);
        updatePaging(savedResp, savedResults.length);
        openAndScrollTo(getRowKey(savedResults[0]));
        return;
      }

      await loadUsers(1, q, filtersActive);
    } catch (e: any) {
      await showErr(e?.message || 'Search failed.');
    } finally {
      setSearchLoading(false);
    }
  }

  useEffect(() => {
    loadSaved(1, filtersActive, '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const didMount = useRef(false);
  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      return;
    }

    if (view !== 'saved') return;

    const q = query.trim();

    const t = setTimeout(() => {
      loadSaved(1, filtersActive, q);
    }, 350);

    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, filtersActive, view]);

  function getApiUrl(path: string) {
    const API_BASE = (
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      ''
    ).replace(/\/$/, '');
    return API_BASE ? `${API_BASE}${path}` : path;
  }

  async function downloadCsvAll() {
    if (view !== 'saved') {
      await showErr('CSV export works for Saved Results only.');
      return;
    }

    const n = parseInt(downloadLimit, 10);
    if (!Number.isFinite(n) || n <= 0) {
      await showErr('Enter a valid download count.');
      return;
    }

    setDownloadLoading(true);
    try {
      const url = getApiUrl(EXPORT_ENDPOINT);

      const payload: any = {
        limit: n,
        sortBy: 'updatedAt',
        sortOrder: 'desc',
        sort: 'updatedAt',
        dir: 'desc',
      };

      if (filtersActive.provider && filtersActive.provider !== 'all') {
        payload.provider = filtersActive.provider;
      }

      if (cleanStr(filtersActive.followersMin)) {
        payload.minFollowers = cleanStr(filtersActive.followersMin);
      }
      if (cleanStr(filtersActive.followersMax)) {
        payload.maxFollowers = cleanStr(filtersActive.followersMax);
      }

      const qClean = cleanStr(query);
      if (qClean) payload.search = qClean;

      const countryCsv = countriesToCsv(filtersActive);
      if (countryCsv) payload.country = countryCsv;

      const cats = categoriesFromFilter(filtersActive);
      if (cats.length) payload.category = cats.join(',');

      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!resp.ok) {
        const txt = await resp.text().catch(() => '');
        throw new Error(txt || `Export failed (${resp.status})`);
      }

      const blob = await resp.blob();

      let filename = '';
      const cd = resp.headers.get('content-disposition') || '';
      const m = cd.match(/filename="([^"]+)"/i);
      if (m?.[1]) filename = m[1];
      if (!filename) filename = `modash_saved_${n}.csv`;

      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (e: any) {
      await showErr(e?.message || 'Failed to download CSV.');
    } finally {
      setDownloadLoading(false);
    }
  }

  async function downloadCsvSelected() {
    if (view !== 'saved') {
      await showErr('Selected export works for Saved Results only.');
      return;
    }

    if (!selectedModashIds.length) {
      await showErr('Select at least 1 saved influencer to export.');
      return;
    }

    setDownloadLoading(true);
    try {
      const url = getApiUrl(EXPORT_ENDPOINT);

      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          modashIds: selectedModashIds,
          sortBy: 'updatedAt',
          sortOrder: 'desc',
        }),
      });

      if (!resp.ok) {
        const txt = await resp.text().catch(() => '');
        throw new Error(txt || `Export failed (${resp.status})`);
      }

      const blob = await resp.blob();

      let filename = '';
      const cd = resp.headers.get('content-disposition') || '';
      const m = cd.match(/filename="([^"]+)"/i);
      if (m?.[1]) filename = m[1];
      if (!filename) filename = `modash_selected_${selectedModashIds.length}.csv`;

      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (e: any) {
      await showErr(e?.message || 'Failed to download selected CSV.');
    } finally {
      setDownloadLoading(false);
    }
  }

  function buildMediaKitHref(p: InfluencerDoc) {
    const userId = cleanStr(p.userId);
    if (!userId) return '#';

    const qs = new URLSearchParams();
    qs.set(
      'platform',
      cleanStr(p.platform || p.provider || 'youtube').toLowerCase()
    );

    const handle = cleanStr(p.handle || p.username);
    if (handle) qs.set('handle', handle);

    if (campaignId) qs.set('campaignId', campaignId);

    return `/mediakit/${encodeURIComponent(userId)}?${qs.toString()}`;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              {view === 'saved' ? 'Modash Influencers' : 'Users Results'}
            </h1>
          </div>

          <p className="mt-2 text-sm text-slate-600">
            Cleaner filtering, better search flow, and stable selection/export.
          </p>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatCard
            title="Current View"
            value={view === 'saved' ? 'Saved Results' : 'Global Users'}
          />
          <StatCard title="Total Rows" value={formatNumber(total)} />
          <StatCard title="Selected" value={String(selectedCount)} />
        </div>

        <div className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-slate-50 px-6 py-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Search & Filters
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Search saved first. If not found, it falls back to live Modash users.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {activeChips.length ? (
                  activeChips.map((c) => (
                    <span
                      key={c}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700 shadow-[0_1px_0_rgba(0,0,0,0.03)]"
                    >
                      {c}
                    </span>
                  ))
                ) : (
                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600">
                    No active filters
                  </span>
                )}

                <span className="rounded-full bg-teal-600 px-3 py-1 text-xs text-white">
                  {platformChip}
                </span>
              </div>
            </div>
          </div>

          <form onSubmit={onSearch} className="space-y-5 p-6">
            <div className="grid grid-cols-1 items-end gap-3 lg:grid-cols-12">
              <div className="lg:col-span-6">
                <label className="mb-2 block text-xs font-medium text-slate-600">
                  Handle / Username
                </label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    className="w-full rounded-xl border border-slate-300 bg-white py-3.5 pl-12 pr-4 outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-teal-600"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="e.g. @SamZonebd"
                  />
                </div>
              </div>

              <div className="lg:col-span-3">
                <label className="mb-2 block text-xs font-medium text-slate-600">
                  Platforms for Global Search
                </label>
                <div className="rounded-xl border border-slate-200 bg-white px-3 py-3">
                  <div className="flex flex-wrap gap-x-4 gap-y-2">
                    {PLATFORM_OPTIONS.map((p) => {
                      const checked = !!searchPlatforms[p.key];
                      return (
                        <label
                          key={p.key}
                          className="flex cursor-pointer select-none items-center gap-2"
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(v: any) =>
                              setSearchPlatforms((prev) => ({
                                ...prev,
                                [p.key]: !!v,
                              }))
                            }
                          />
                          <span className="text-sm text-slate-800">{p.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2 lg:col-span-3 sm:grid-cols-2">
                <button
                  className="flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 font-semibold text-white shadow-sm transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
                  type="submit"
                  disabled={searchLoading || listLoading}
                >
                  {searchLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Searching…
                    </>
                  ) : (
                    'Search'
                  )}
                </button>

                <button
                  type="button"
                  className="flex h-[52px] w-full items-center justify-center gap-2 rounded-xl border border-slate-300 px-5 font-semibold text-slate-800 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={() => {
                    setView('saved');
                    setUsersItems([]);
                    clearSelection();
                    loadSaved(1, filtersActive, query.trim());
                  }}
                  disabled={listLoading}
                >
                  <RefreshCw
                    className={`h-4 w-4 ${listLoading ? 'animate-spin' : ''}`}
                  />
                  Refresh
                </button>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-5 py-4">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-slate-500" />
                  <div>
                    <div className="text-sm font-semibold text-slate-900">
                      Filters
                    </div>
                    <div className="mt-0.5 text-xs text-slate-600">
                      Country is multi-select. Category accepts comma-separated values.
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-5">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
                  <div className="rounded-xl border border-slate-200 bg-white p-3">
                    <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                      Provider
                    </label>
                    <select
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 outline-none focus:border-transparent focus:ring-2 focus:ring-teal-600"
                      value={filtersDraft.provider || 'all'}
                      onChange={(e) =>
                        setFiltersDraft((p) => ({ ...p, provider: e.target.value }))
                      }
                    >
                      <option value="all">All</option>
                      <option value="youtube">YouTube</option>
                      <option value="instagram">Instagram</option>
                      <option value="tiktok">TikTok</option>
                    </select>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-3">
                    <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                      Followers Min
                    </label>
                    <input
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 outline-none focus:border-transparent focus:ring-2 focus:ring-teal-600"
                      value={filtersDraft.followersMin || ''}
                      onChange={(e) =>
                        setFiltersDraft((p) => ({
                          ...p,
                          followersMin: e.target.value,
                        }))
                      }
                      placeholder="100000"
                      inputMode="numeric"
                    />
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-3">
                    <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                      Followers Max
                    </label>
                    <input
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 outline-none focus:border-transparent focus:ring-2 focus:ring-teal-600"
                      value={filtersDraft.followersMax || ''}
                      onChange={(e) =>
                        setFiltersDraft((p) => ({
                          ...p,
                          followersMax: e.target.value,
                        }))
                      }
                      placeholder="5000000"
                      inputMode="numeric"
                    />
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-3">
                    <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                      Country
                    </label>
                    <MultiCountrySelect
                      value={filtersDraft.countries || []}
                      onChange={(next) =>
                        setFiltersDraft((p) => ({
                          ...p,
                          countries: next,
                          country: '',
                        }))
                      }
                    />
                    <p className="mt-2 text-[11px] text-slate-500">
                      Uses country names in API, even if you pick country codes.
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-3">
                    <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                      Category
                    </label>
                    <input
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 outline-none focus:border-transparent focus:ring-2 focus:ring-teal-600"
                      value={filtersDraft.category || ''}
                      onChange={(e) =>
                        setFiltersDraft((p) => ({
                          ...p,
                          category: e.target.value,
                          categories: [],
                        }))
                      }
                      placeholder="Fitness or Fitness,Beauty"
                    />
                    <p className="mt-2 text-[11px] text-slate-500">
                      Example: <span className="font-mono">Fitness,Beauty</span>
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  <button
                    type="button"
                    className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={clearFilters}
                    disabled={listLoading}
                  >
                    Clear
                  </button>

                  <button
                    type="button"
                    className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={applyFilters}
                    disabled={listLoading}
                  >
                    Apply
                  </button>
                </div>

                {activeChips.length ? (
                  <div className="mt-5 flex flex-wrap gap-2">
                    {activeChips.map((chip) => (
                      <span
                        key={chip}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-700"
                      >
                        {chip}
                      </span>
                    ))}
                  </div>
                ) : null}

                <div className="mt-6 border-t border-slate-200 pt-5">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="relative">
                        <input
                          className="w-[160px] rounded-xl border border-slate-300 bg-white px-3 py-3 pr-14 outline-none focus:border-transparent focus:ring-2 focus:ring-teal-600"
                          value={downloadLimit}
                          onChange={(e) => setDownloadLimit(e.target.value)}
                          placeholder="No. of"
                          inputMode="numeric"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">
                          rows
                        </span>
                      </div>

                      {!campaignId && (
                        <>

                          <button
                            type="button"
                            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                            onClick={downloadCsvAll}
                            disabled={downloadLoading || listLoading}
                          >
                            <Download className="h-4 w-4" />
                            {downloadLoading ? 'Downloading…' : 'Download CSV'}
                          </button>

                          <button
                            type="button"
                            className="flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
                            onClick={downloadCsvSelected}
                            disabled={downloadLoading || selectedModashIds.length === 0}
                          >
                            <Download className="h-4 w-4" />
                            Download Selected ({selectedModashIds.length})
                          </button>
                        </>
                      )}

                      {selectedCount ? (
                        <button
                          type="button"
                          className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-50"
                          onClick={clearSelection}
                          disabled={downloadLoading}
                        >
                          Clear Selection
                        </button>
                      ) : null}

                      {selectedCount && campaignId ? (
                        <button
                          type="button"
                          className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                          onClick={addOutreach}
                          disabled={downloadLoading}
                        >
                          Add to Outreach
                        </button>
                      ) : null}

                    </div>

                    {view !== 'saved' ? (
                      <div className="text-xs text-slate-500">
                        CSV export works on <b>Saved Results</b> only.
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 px-6 py-4">
            <div className="flex flex-wrap items-center gap-4">
              <h2 className="text-lg font-semibold text-slate-900">
                {view === 'saved' ? 'Saved Results' : 'Users Results'}
              </h2>
              <span className="text-sm text-slate-600">
                {formatNumber(total)} total
              </span>
              {selectedCount ? (
                <span className="text-sm text-slate-700">
                  • Selected <b>{selectedCount}</b>
                </span>
              ) : null}
            </div>
          </div>

          <div className="border-b border-slate-200 bg-slate-50 px-6 py-3">
            <div className="grid grid-cols-12 items-center gap-3">
              <div className="col-span-1 flex items-center">
                <Checkbox
                  checked={
                    currentItems.length
                      ? currentItems.every((it) => !!selectedIds[getRowKey(it)])
                        ? (true as any)
                        : currentItems.some((it) => !!selectedIds[getRowKey(it)])
                          ? ('indeterminate' as any)
                          : (false as any)
                      : (false as any)
                  }
                  onCheckedChange={(v: any) => {
                    const checked = !!v;
                    checked
                      ? selectAllOnPage(currentItems)
                      : clearSelectionOnPage(currentItems);
                  }}
                />
              </div>

              <div className="col-span-9">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                  Handle
                </div>
              </div>

              <div className="col-span-2 text-right">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                  Actions
                </div>
              </div>
            </div>
          </div>

          {listLoading && currentItems.length === 0 ? (
            <div className="px-6 py-12 text-center text-slate-500">
              <RefreshCw className="mx-auto mb-2 h-8 w-8 animate-spin" />
              Loading...
            </div>
          ) : null}

          {!listLoading && currentItems.length === 0 ? (
            <div className="px-6 py-12 text-center text-slate-500">
              No results found.
            </div>
          ) : null}

          <div className="divide-y divide-slate-200">
            {currentItems.map((p) => {
              const rowKey = getRowKey(p);
              const domId = toDomId(rowKey);
              const isOpen = !!expanded[rowKey];
              const thumb = p.picture || '';
              const url = p.url || '';
              const checked = !!selectedIds[rowKey];
              const providerLabel = cleanStr(p.provider || p.platform || DASH);
              const categories = getCategoryNames(p);

              return (
                <div
                  key={rowKey}
                  id={domId}
                  className="transition-colors hover:bg-slate-50"
                >
                  <div className="px-6 py-4">
                    <div className="grid grid-cols-12 items-start gap-3">
                      <div className="col-span-1 pt-2">
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(v: any) =>
                            toggleSelect(
                              rowKey,
                              !!v,
                              p._id ? String(p._id) : undefined
                            )
                          }
                        />
                      </div>

                      <div className="col-span-9 min-w-0">
                        <div className="mb-2 flex items-center gap-3">
                          <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-slate-200">
                            {thumb ? (
                              <img
                                src={thumb}
                                alt=""
                                className="h-full w-full object-cover"
                                loading="lazy"
                              />
                            ) : null}
                          </div>

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="truncate text-lg font-semibold text-slate-900">
                                {p.handle || p.username || DASH}
                              </h3>

                              <span className="rounded-full border border-slate-300 px-2 py-0.5 text-[10px] text-slate-600">
                                {providerLabel}
                              </span>

                              {p.isVerified ? (
                                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] text-emerald-700">
                                  Verified
                                </span>
                              ) : null}
                            </div>

                            <div className="truncate text-sm text-slate-600">
                              {p.fullname || DASH}
                            </div>
                          </div>
                        </div>

                        <div className="mb-3 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
                          <Metric label="Country" value={p.country || DASH} />
                          <Metric label="Followers" value={formatNumber(p.followers)} />
                          <Metric label="Avg Views" value={formatNumber(p.averageViews)} />
                          <Metric
                            label="Engagement"
                            value={formatPercent(p.engagementRate)}
                          />
                          <Metric
                            label="Engagements"
                            value={formatNumber(p.engagements)}
                            className="hidden lg:block"
                          />
                          <Metric
                            label={view === 'saved' ? 'Updated' : 'Created'}
                            value={
                              view === 'saved'
                                ? formatDate(p.updatedAt)
                                : formatDate(p.createdAt)
                            }
                            className="hidden lg:block"
                          />
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                          <span>Private: {formatBool(p.isPrivate)}</span>
                          <span>UserId: {p.userId || DASH}</span>
                          {categories.length ? (
                            <span className="max-w-full truncate">
                              Category: {categories.join(', ')}
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <div className="col-span-2 flex flex-col items-end gap-2">
                        {url ? (
                          <a
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
                          >
                            <ExternalLink className="h-4 w-4" />
                            Open
                          </a>
                        ) : null}

                        {p.userId ? (
                          <Link
                            href={buildMediaKitHref(p)}
                            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
                          >
                            <Info className="h-4 w-4" />
                            View
                          </Link>
                        ) : (
                          <button
                            type="button"
                            className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-400"
                            disabled
                          >
                            <Info className="h-4 w-4" />
                            View
                          </button>
                        )}

                        <button
                          type="button"
                          className="rounded-lg p-2 transition-colors hover:bg-slate-100"
                          onClick={() => toggleExpand(rowKey)}
                          aria-expanded={isOpen}
                        >
                          <ChevronDown
                            className={`h-5 w-5 text-slate-600 transition-transform ${isOpen ? 'rotate-180' : ''
                              }`}
                          />
                        </button>
                      </div>
                    </div>

                    {isOpen ? (
                      <div className="mt-6 space-y-6 border-t border-slate-200 pt-6">
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                          <div className="rounded-2xl bg-slate-50 p-4">
                            <h4 className="mb-3 font-semibold text-slate-900">
                              Profile Details
                            </h4>
                            <div className="space-y-2 text-sm">
                              <Row label="User ID" value={p.userId || DASH} mono />
                              <Row label="Username" value={p.username || DASH} />
                              <Row label="Handle" value={p.handle || DASH} />
                              <Row label="City" value={p.city || DASH} />
                              <Row label="State" value={p.state || DASH} />
                              <Row label="Country" value={p.country || DASH} />
                              <Row
                                label="Language"
                                value={
                                  typeof p.language === 'string'
                                    ? p.language
                                    : p.language?.name || p.language?.code || DASH
                                }
                              />
                              <Row
                                label="Category"
                                value={categories.length ? categories.join(', ') : DASH}
                              />
                              <Row label="Bio" value={p.bio || DASH} />
                            </div>
                          </div>

                          <div className="rounded-2xl bg-slate-50 p-4">
                            <h4 className="mb-3 font-semibold text-slate-900">
                              Metrics
                            </h4>
                            <div className="space-y-2 text-sm">
                              <Row label="Followers" value={formatNumber(p.followers)} />
                              <Row
                                label="Average Views"
                                value={formatNumber(p.averageViews)}
                              />
                              <Row
                                label="Engagement Rate"
                                value={formatPercent(p.engagementRate)}
                              />
                              <Row
                                label="Engagements"
                                value={formatNumber(p.engagements)}
                              />
                              <Row label="Verified" value={formatBool(p.isVerified)} />
                              <Row label="Private" value={formatBool(p.isPrivate)} />
                              <Row label="Created" value={formatDate(p.createdAt)} />
                              <Row label="Updated" value={formatDate(p.updatedAt)} />
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 bg-white px-6 py-4">
            <div className="text-sm text-slate-600">
              Page <span className="font-semibold text-slate-900">{page}</span>
              {total ? (
                <>
                  {' '}
                  • <span className="font-semibold text-slate-900">{formatNumber(total)}</span> total
                </>
              ) : null}
            </div>

            <div className="flex gap-2">
              <button
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => {
                  const next = Math.max(1, page - 1);
                  view === 'saved'
                    ? loadSaved(next, filtersActive, query.trim())
                    : loadUsers(next, query.trim(), filtersActive);
                }}
                disabled={listLoading || page <= 1}
              >
                Previous
              </button>

              <button
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => {
                  const next = page + 1;
                  view === 'saved'
                    ? loadSaved(next, filtersActive, query.trim())
                    : loadUsers(next, query.trim(), filtersActive);
                }}
                disabled={listLoading || !hasNext}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </div>
      <div className="mt-2 text-2xl font-bold text-slate-900">{value}</div>
    </div>
  );
}

function Metric({
  label,
  value,
  className = '',
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="mb-1 text-xs text-slate-500">{label}</div>
      <div className="text-sm font-medium text-slate-900">{value}</div>
    </div>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: any;
  mono?: boolean;
}) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-slate-600">{label}:</span>
      <span
        className={`text-right font-medium text-slate-900 ${mono ? 'font-mono text-xs' : ''
          }`}
      >
        {String(value)}
      </span>
    </div>
  );
}