'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  FolderKanban,
  Plus,
  RefreshCw,
  Loader2,
  Search,
  Link2,
  X,
  Copy,
  Pencil,
  Trash2,
  ChevronDown,
  Check,
  Target,
} from 'lucide-react';
import swal from 'sweetalert';

import { adminGet, adminPost, getApiErrorMessage } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AdminTable, { type AdminTableColumn } from '../../components/table';

type AdminMini = {
  _id?: string;
  adminId?: string;
  name?: string;
  email?: string;
  proxyEmail?: string;
  role?: string;
  designation?: string;
  teamType?: string | null;
  status?: string;
  parentAdmin?: {
    _id?: string;
    name?: string;
    email?: string;
    role?: string;
    designation?: string;
    teamType?: string | null;
  } | null;
  rootAdmin?: {
    _id?: string;
    name?: string;
    email?: string;
    role?: string;
    designation?: string;
    teamType?: string | null;
  } | null;
  createdBy?: {
    _id?: string;
    name?: string;
    email?: string;
    role?: string;
    designation?: string;
    teamType?: string | null;
  } | null;
};

type FolderShare = {
  token?: string;
  url?: string;
  generatedAt?: string | null;
  sharedBy?: {
    _id?: string;
    adminId?: string;
    name?: string;
    email?: string;
    role?: string;
    designation?: string;
    teamType?: string | null;
  } | null;
};


type AssignedCampaignMini = {
  campaignId?: string;
  campaignsId?: string;
  campaignTitle?: string;
  productOrServiceName?: string;
  brandId?: unknown;
  brandName?: string;
  assignedAt?: string | null;
  assignedByAdminId?: string | null;
};

type PitchFolder = {
  _id: string;
  title: string;
  slug?: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
  itemCount?: number;
  createdBy?: AdminMini | null;
  updatedBy?: AdminMini | null;
  share?: FolderShare;
  assignedCampaign?: AssignedCampaignMini | null;
};

type ListResponse = {
  success: boolean;
  data: PitchFolder[];
};


type CampaignMini = {
  _id?: string;
  id?: string;
  campaignId?: string;
  campaignsId?: string;
  campaignTitle?: string;
  productOrServiceName?: string;
  title?: string;
  name?: string;
  brandName?: string;
  brandPlanName?: string;
  campaignStatus?: string;
  publishStatus?: string;
  status?: string;
  isActive?: number;
  budget?: number;
  startDate?: string | null;
  endDate?: string | null;
};

type CampaignListResponse = {
  success?: boolean;
  campaigns?: CampaignMini[];
  data?: CampaignMini[];
  total?: number;
  page?: number;
  pages?: number;
  totalPages?: number;
};

type AssignCampaignResponse = {
  success?: boolean;
  message?: string;
  data?: {
    folderId?: string;
    campaignId?: string;
    assignmentChanged?: boolean;
    assignedCampaign?: AssignedCampaignMini | null;
    activation?: {
      totalGoodFit?: number;
      withEmail?: number;
      matched?: number;
      activated?: number;
      alreadyInCampaign?: number;
      missingEmail?: number;
      influencerNotFound?: number;
      applicantCount?: number;
    };
    folder?: PitchFolder;
  };
};

function showErr(message: string) {
  return swal({
    title: 'Error',
    text: message || 'Something went wrong.',
    icon: 'error',
  });
}

function showSuccess(message: string) {
  return swal({
    title: 'Success',
    text: message,
    icon: 'success',
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

function prettyText(value?: string | null) {
  const v = String(value || '').trim();
  if (!v) return '--';
  return v.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function getCampaignId(campaign?: CampaignMini | null) {
  return String(
    campaign?.campaignId ||
    campaign?.campaignsId ||
    campaign?.id ||
    campaign?._id ||
    ''
  ).trim();
}

function getCampaignName(campaign?: CampaignMini | null) {
  return String(
    campaign?.campaignTitle ||
    campaign?.name ||
    campaign?.title ||
    campaign?.productOrServiceName ||
    getCampaignId(campaign) ||
    'Untitled Campaign'
  ).trim();
}

function getCampaignBrandName(campaign?: CampaignMini | null) {
  return String(campaign?.brandName || '').trim();
}

function getCampaignStatusLabel(campaign?: CampaignMini | null) {
  const status = String(
    campaign?.campaignStatus ||
    campaign?.publishStatus ||
    campaign?.status ||
    (Number(campaign?.isActive) === 1 ? 'active' : '')
  ).trim();

  return status ? prettyText(status) : 'Active';
}


function getAssignedCampaignId(assigned?: AssignedCampaignMini | null) {
  return String(assigned?.campaignsId || assigned?.campaignId || '').trim();
}

function getAssignedCampaignName(assigned?: AssignedCampaignMini | null) {
  return String(
    assigned?.campaignTitle ||
    assigned?.productOrServiceName ||
    assigned?.campaignsId ||
    assigned?.campaignId ||
    'Assigned Campaign'
  ).trim();
}

function getAssignedCampaignBrandName(assigned?: AssignedCampaignMini | null) {
  return String(assigned?.brandName || '').trim();
}

function AdminMeta({ admin }: { admin?: AdminMini | null }) {
  if (!admin) {
    return <span className="text-sm text-slate-500">--</span>;
  }

  return (
    <div className="min-w-0">
      <p className="truncate text-sm font-semibold text-slate-900">
        {admin.name || admin.email || '--'}
      </p>
      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <span>{admin.designation || prettyText(admin.role)}</span>
        {admin.teamType ? (
          <Badge
            variant="outline"
            className="rounded-full px-2 py-0 text-[10px]"
          >
            {prettyText(admin.teamType)}
          </Badge>
        ) : null}
      </div>
    </div>
  );
}

export default function PitchFoldersPage() {
  const router = useRouter();

  const [folders, setFolders] = useState<PitchFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [duplicatingFolderId, setDuplicatingFolderId] = useState<string | null>(null);
  const [deletingFolderId, setDeletingFolderId] = useState<string | null>(null);
  const [campaigns, setCampaigns] = useState<CampaignMini[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);
  const [selectedCampaignByFolder, setSelectedCampaignByFolder] = useState<Record<string, string>>({});
  const [assigningCampaignFolderId, setAssigningCampaignFolderId] = useState<string | null>(null);
  const [openCampaignPickerFolderId, setOpenCampaignPickerFolderId] = useState<string | null>(null);
  const [campaignPickerPosition, setCampaignPickerPosition] = useState<{
    top: number;
    left: number;
    width: number;
    maxHeight: number;
  } | null>(null);
  const [campaignSearchByFolder, setCampaignSearchByFolder] = useState<Record<string, string>>({});

  const [search, setSearch] = useState('');
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
  });

  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
  });

  const initialLoadDone = useRef(false);

  const loadFolders = useCallback(async (searchText = '') => {
    setLoading(true);
    try {
      const query = searchText.trim();
      const params = query ? { q: query } : {};
      const resp = await adminGet<ListResponse>('/pitch-folders/list', params);
      setFolders(Array.isArray(resp?.data) ? resp.data : []);
    } catch (e: any) {
      await showErr(await getApiErrorMessage(e, 'Failed to load folders.'));
    } finally {
      setLoading(false);
    }
  }, []);


  const loadCampaigns = useCallback(async () => {
    setLoadingCampaigns(true);

    try {
      const resp = await adminPost<CampaignListResponse>('/admin/campaign/fully', {
        page: 1,
        limit: 1000,
        search: '',
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });

      const campaignList = Array.isArray(resp?.campaigns)
        ? resp.campaigns
        : Array.isArray(resp?.data)
          ? resp.data
          : [];

      const uniqueCampaigns = Array.from(
        new Map(
          campaignList
            .map((campaign) => [getCampaignId(campaign), campaign] as const)
            .filter(([id]) => Boolean(id))
        ).values()
      );

      setCampaigns(uniqueCampaigns);
    } catch (e: any) {
      await showErr(await getApiErrorMessage(e, 'Failed to load campaigns.'));
    } finally {
      setLoadingCampaigns(false);
    }
  }, []);

  useEffect(() => {
    if (!initialLoadDone.current) {
      initialLoadDone.current = true;
      loadFolders('');
      loadCampaigns();
      return;
    }

    const timer = setTimeout(() => {
      loadFolders(search);
    }, 350);

    return () => clearTimeout(timer);
  }, [search, loadFolders, loadCampaigns]);

  useEffect(() => {
    if (!openCampaignPickerFolderId) return;

    function closePicker() {
      setOpenCampaignPickerFolderId(null);
      setCampaignPickerPosition(null);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') closePicker();
    }

    function handleMouseDown(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      if (!target) return;

      const insidePicker = target.closest('[data-campaign-picker-root="true"]');
      const insideTrigger = target.closest(`[data-campaign-trigger="${openCampaignPickerFolderId}"]`);

      if (!insidePicker && !insideTrigger) closePicker();
    }

    function handleScroll(event: Event) {
      const target = event.target as HTMLElement | null;

      // Keep the campaign list scrollable. Only close the picker when the page/table
      // outside the picker scrolls, not when the user scrolls inside the dropdown.
      if (target?.closest?.('[data-campaign-picker-root="true"]')) return;

      closePicker();
    }

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('resize', closePicker);
    window.addEventListener('scroll', handleScroll, true);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('resize', closePicker);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [openCampaignPickerFolderId]);

  function resetCreateForm() {
    setForm({
      title: '',
      description: '',
    });
  }

  function resetEditForm() {
    setEditForm({
      title: '',
      description: '',
    });
  }

  function closeCampaignPicker() {
    setOpenCampaignPickerFolderId(null);
    setCampaignPickerPosition(null);
  }

  function openCampaignPicker(
    folderId: string,
    event: React.MouseEvent<HTMLButtonElement>
  ) {
    if (loadingCampaigns || assigningCampaignFolderId === folderId) return;

    if (openCampaignPickerFolderId === folderId) {
      closeCampaignPicker();
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const panelWidth = Math.min(440, Math.max(320, window.innerWidth - 32));
    const viewportPadding = 16;
    const viewportMaxHeight = Math.max(280, window.innerHeight - viewportPadding * 2);
    const preferredMaxHeight = Math.min(460, viewportMaxHeight);

    const spaceBelow = window.innerHeight - rect.bottom - viewportPadding;
    const spaceAbove = rect.top - viewportPadding;
    const openAbove = spaceBelow < 340 && spaceAbove > spaceBelow;
    const availableHeight = openAbove ? spaceAbove - 8 : spaceBelow - 8;
    const panelMaxHeight = Math.max(
      280,
      Math.min(preferredMaxHeight, Math.max(availableHeight, 280))
    );

    const availableRight = window.innerWidth - viewportPadding;
    const preferredLeft = rect.right - panelWidth;
    const left = Math.min(
      Math.max(preferredLeft, viewportPadding),
      Math.max(viewportPadding, availableRight - panelWidth)
    );

    const preferredTop = openAbove
      ? rect.top - panelMaxHeight - 8
      : rect.bottom + 8;

    const top = Math.min(
      Math.max(preferredTop, viewportPadding),
      Math.max(viewportPadding, window.innerHeight - panelMaxHeight - viewportPadding)
    );

    setOpenCampaignPickerFolderId(folderId);
    setCampaignPickerPosition({
      top,
      left,
      width: panelWidth,
      maxHeight: panelMaxHeight,
    });
  }

  async function createFolder() {
    try {
      if (!form.title.trim()) {
        await showErr('Folder name is required.');
        return;
      }

      setCreating(true);

      const resp = await adminPost('/pitch-folders/create', {
        title: form.title.trim(),
        description: form.description.trim(),
      });

      await showSuccess('Folder created successfully.');
      resetCreateForm();
      setOpenCreateModal(false);
      await loadFolders(search);

      const id = resp?.data?._id;
    } catch (e: any) {
      await showErr(await getApiErrorMessage(e, 'Failed to create folder.'));
    } finally {
      setCreating(false);
    }
  }

  function openEditFolderModal(folder: PitchFolder) {
    setEditingFolderId(folder._id);
    setEditForm({
      title: folder.title || '',
      description: folder.description || '',
    });
    setOpenEditModal(true);
  }

  function closeEditFolderModal() {
    setOpenEditModal(false);
    setEditingFolderId(null);
    resetEditForm();
  }

  async function saveFolderEdits() {
    try {
      if (!editingFolderId) {
        await showErr('Folder not selected.');
        return;
      }

      if (!editForm.title.trim()) {
        await showErr('Folder name is required.');
        return;
      }

      setSavingEdit(true);

      await adminPost('/pitch-folders/update', {
        folderId: editingFolderId,
        title: editForm.title.trim(),
        description: editForm.description.trim(),
      });

      await showSuccess('Folder updated successfully.');
      closeEditFolderModal();
      await loadFolders(search);
    } catch (e: any) {
      await showErr(await getApiErrorMessage(e, 'Failed to update folder.'));
    } finally {
      setSavingEdit(false);
    }
  }

  async function assignCampaign(folder: PitchFolder) {
    const campaignId = String(selectedCampaignByFolder[folder._id] || '').trim();

    if (!campaignId) {
      await showErr('Please select a campaign first.');
      return;
    }

    try {
      setAssigningCampaignFolderId(folder._id);

      const resp = await adminPost<AssignCampaignResponse>('/pitch-folders/assign-campaign', {
        folderId: folder._id,
        campaignId,
      });

      await showSuccess(
        resp?.message || 'Campaign assigned to pitch folder successfully.'
      );

      await loadFolders(search);
    } catch (e: any) {
      await showErr(await getApiErrorMessage(e, 'Failed to assign campaign.'));
    } finally {
      setAssigningCampaignFolderId(null);
    }
  }

  async function duplicateFolder(folder: PitchFolder) {
    try {
      setDuplicatingFolderId(folder._id);

      const resp = await adminPost('/pitch-folders/duplicate', {
        folderId: folder._id,
      });

      await showSuccess('Folder duplicated successfully.');
      await loadFolders(search);

      const newId = resp?.data?._id;
    } catch (e: any) {
      await showErr(await getApiErrorMessage(e, 'Failed to duplicate folder.'));
    } finally {
      setDuplicatingFolderId(null);
    }
  }

  async function deleteFolder(folder: PitchFolder) {
    const confirmed = await swal({
      title: 'Delete Folder?',
      text: `This will remove "${folder.title}" from the active list.`,
      icon: 'warning',
      buttons: ['Cancel', 'Delete'],
      dangerMode: true,
    });

    if (!confirmed) return;

    try {
      setDeletingFolderId(folder._id);

      await adminPost('/pitch-folders/archive', {
        id: folder._id,
      });

      await showSuccess('Folder deleted successfully.');
      await loadFolders(search);
    } catch (e: any) {
      await showErr(await getApiErrorMessage(e, 'Failed to delete folder.'));
    } finally {
      setDeletingFolderId(null);
    }
  }

  const totalInfluencers = useMemo(() => {
    return folders.reduce((sum, folder) => sum + Number(folder.itemCount || 0), 0);
  }, [folders]);

  const sharedFolders = useMemo(() => {
    return folders.filter((folder) => Boolean(folder.share?.url)).length;
  }, [folders]);


  const campaignById = useMemo(() => {
    return new Map(
      campaigns
        .map((campaign) => [getCampaignId(campaign), campaign] as const)
        .filter(([id]) => Boolean(id))
    );
  }, [campaigns]);

  const activeCampaignSearch = openCampaignPickerFolderId
    ? campaignSearchByFolder[openCampaignPickerFolderId] || ''
    : '';

  const filteredCampaigns = useMemo(() => {
    if (!openCampaignPickerFolderId) return [];

    const q = activeCampaignSearch.trim().toLowerCase();
    if (!q) return campaigns;

    return campaigns.filter((campaign) =>
      [
        getCampaignName(campaign),
        getCampaignBrandName(campaign),
        getCampaignId(campaign),
        campaign.brandPlanName,
        campaign.campaignStatus,
        campaign.publishStatus,
        campaign.status,
      ].some((value) => String(value || '').toLowerCase().includes(q))
    );
  }, [activeCampaignSearch, campaigns, openCampaignPickerFolderId]);


  const activePickerFolderId = openCampaignPickerFolderId || '';

  const columns = useMemo<AdminTableColumn<PitchFolder>[]>(
    () => [
      {
        id: 'folder',
        header: 'Folder',
        widthClassName: 'min-w-[260px]',
        render: (folder) => (
          <div className="flex items-center gap-3">
            <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 ring-1 ring-teal-100">
              <FolderKanban className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <p className="max-w-[240px] truncate text-sm font-bold text-slate-900">
                {folder.title}
              </p>
            </div>
          </div>
        ),
      },
      {
        id: 'description',
        header: 'Description',
        widthClassName: 'min-w-[260px]',
        render: (folder) => (
          <p className="max-w-[280px] whitespace-normal break-words text-sm text-slate-600">
            {folder.description || 'No description added.'}
          </p>
        ),
      },
      {
        id: 'createdBy',
        header: 'Created By',
        widthClassName: 'min-w-[220px]',
        render: (folder) => <AdminMeta admin={folder.createdBy} />,
      },
      // {
      //   id: 'updatedBy',
      //   header: 'Last Updated By',
      //   widthClassName: 'min-w-[220px]',
      //   render: (folder) => <AdminMeta admin={folder.updatedBy} />,
      // },
      {
        id: 'createdAt',
        header: 'Created On',
        widthClassName: 'min-w-[130px]',
        render: (folder) => (
          <span className="text-sm font-medium text-slate-700">
            {formatDate(folder.createdAt)}
          </span>
        ),
      },
      // {
      //   id: 'updatedAt',
      //   header: 'Updated On',
      //   widthClassName: 'min-w-[130px]',
      //   render: (folder) => (
      //     <span className="text-sm font-medium text-slate-700">
      //       {formatDate(folder.updatedAt)}
      //     </span>
      //   ),
      // },
      {
        id: 'itemCount',
        header: 'Influencers',
        align: 'center',
        widthClassName: 'min-w-[120px]',
        render: (folder) => (
          <div className="flex justify-center">
            <Badge variant="secondary" className="rounded-full px-3 py-1">
              {folder.itemCount || 0}
            </Badge>
          </div>
        ),
      },
      {
        id: 'assignedCampaign',
        header: 'Assigned Campaign',
        widthClassName: 'min-w-[240px]',
        render: (folder) => {
          const assignedCampaign = folder.assignedCampaign?.campaignId
            ? folder.assignedCampaign
            : null;

          if (!assignedCampaign) {
            return <span className="text-sm text-slate-500">Reusable / Not assigned</span>;
          }

          return (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">
                {getAssignedCampaignName(assignedCampaign)}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                {getAssignedCampaignBrandName(assignedCampaign) ? (
                  <span>{getAssignedCampaignBrandName(assignedCampaign)}</span>
                ) : null}
                <Badge variant="outline" className="rounded-full px-2 py-0 text-[10px]">
                  Locked
                </Badge>
              </div>
            </div>
          );
        },
      },
      {
        id: 'share',
        header: 'Share',
        align: 'center',
        widthClassName: 'min-w-[120px]',
        render: (folder) => (
          <div className="flex justify-center">
            {folder.share?.url ? (
              <Badge variant="outline" className="rounded-full px-3 py-1">
                <Link2 className="mr-1 h-3.5 w-3.5" />
                Shared
              </Badge>
            ) : (
              <span className="text-sm text-slate-500">--</span>
            )}
          </div>
        ),
      },
    ],
    []
  );

  const searchActive = search.trim().length > 0;

  return (
    <div className="min-h-screen bg-slate-50/60">
      <div className="mx-auto w-full max-w-[1800px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Admin Workspace
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
              Pitch Folders
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Organize selected influencers, their details, rate cards, and media kits for brand sharing.
            </p>
          </div>

          <Button
            onClick={() => setOpenCreateModal(true)}
            className="h-11 rounded-xl px-5 shadow-sm lg:self-start"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Folder
          </Button>
        </div>

        <div className="mb-6 grid gap-4 xl:grid-cols-[minmax(0,1fr)_220px_220px_220px]">
          <Card className="rounded-2xl border-slate-200 shadow-sm">
            <CardContent className="p-4 sm:p-5">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by folder name, description, or slug..."
                    className="h-11 rounded-xl border-slate-200 bg-white pl-10 pr-10"
                  />
                  {searchActive ? (
                    <button
                      type="button"
                      onClick={() => setSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                      aria-label="Clear search"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    className="h-11 rounded-xl"
                    onClick={() => {
                      loadFolders(search);
                      loadCampaigns();
                    }}
                    disabled={loading || loadingCampaigns}
                  >
                    {loading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="mr-2 h-4 w-4" />
                    )}
                    Refresh
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-200 shadow-sm">
            <CardContent className="p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Total Folders
              </p>
              <p className="mt-3 text-3xl font-bold text-slate-900">{folders.length}</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-200 shadow-sm">
            <CardContent className="p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Influencers
              </p>
              <p className="mt-3 text-3xl font-bold text-slate-900">{totalInfluencers}</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-200 shadow-sm">
            <CardContent className="p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Shared Folders
              </p>
              <p className="mt-3 text-3xl font-bold text-slate-900">{sharedFolders}</p>
            </CardContent>
          </Card>
        </div>

        <Card className="overflow-hidden rounded-2xl border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-100 bg-white">
            <CardTitle className="text-xl">All Pitch Folders</CardTitle>
          </CardHeader>

          <CardContent className="p-0">
            <AdminTable<PitchFolder>
              data={folders}
              columns={columns}
              rowKey={(row) => row._id}
              loading={loading}
              loadingRows={6}
              emptyTitle={searchActive ? 'No matching folders found' : 'No folders available'}
              emptyDescription={
                searchActive
                  ? 'Try a different keyword or clear the search to view all folders.'
                  : 'No folders are available for your access level yet.'
              }
              onRowClick={(row) => router.push(`/admin/pitch-folders/${row._id}`)}
              actions={{
                header: 'Actions',
                align: 'right',
                cellClassName: 'pr-4',
                render: (folder) => {
                  const assignedCampaign = folder.assignedCampaign?.campaignId
                    ? folder.assignedCampaign
                    : null;
                  const isCampaignAssigned = Boolean(assignedCampaign?.campaignId);
                  const selectedCampaignId = isCampaignAssigned
                    ? getAssignedCampaignId(assignedCampaign)
                    : selectedCampaignByFolder[folder._id] || '';
                  const selectedCampaign = isCampaignAssigned
                    ? null
                    : campaignById.get(selectedCampaignId) || null;
                  const campaignLabel = isCampaignAssigned
                    ? getAssignedCampaignName(assignedCampaign)
                    : selectedCampaign
                      ? getCampaignName(selectedCampaign)
                      : '';
                  const busy =
                    duplicatingFolderId === folder._id ||
                    deletingFolderId === folder._id ||
                    assigningCampaignFolderId === folder._id;

                  return (
                    <div
                      className="flex min-w-[720px] items-center justify-end gap-2"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <div className="flex items-center gap-1 rounded-2xl border border-slate-200 bg-white p-1 shadow-sm ring-1 ring-slate-100">
                        <button
                          type="button"
                          data-campaign-trigger={folder._id}
                          disabled={isCampaignAssigned || loadingCampaigns || campaigns.length === 0 || busy}
                          onClick={(event) => openCampaignPicker(folder._id, event)}
                          className="group flex h-10 w-[300px] items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 text-left transition hover:bg-white hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:cursor-not-allowed disabled:opacity-60"
                          aria-expanded={openCampaignPickerFolderId === folder._id}
                          aria-label={isCampaignAssigned ? "Campaign already assigned" : "Choose campaign"}
                        >
                          <div className="flex min-w-0 items-center gap-2">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-slate-700 shadow-sm ring-1 ring-slate-200">
                              {loadingCampaigns ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : isCampaignAssigned || selectedCampaign ? (
                                <Check className="h-3.5 w-3.5 text-emerald-600" />
                              ) : (
                                <Target className="h-3.5 w-3.5" />
                              )}
                            </span>

                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
                                  Campaign
                                </span>
                                {isCampaignAssigned ? (
                                  <span className="rounded-full bg-blue-50 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-blue-700">
                                    Assigned
                                  </span>
                                ) : selectedCampaign ? (
                                  <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-emerald-700">
                                    Selected
                                  </span>
                                ) : null}
                              </div>
                              <p className="truncate text-sm font-bold text-slate-900">
                                {isCampaignAssigned
                                  ? campaignLabel
                                  : loadingCampaigns
                                    ? 'Loading campaigns...'
                                    : selectedCampaign
                                      ? getCampaignName(selectedCampaign)
                                      : campaigns.length
                                        ? 'Choose campaign'
                                        : 'No campaigns found'}
                              </p>
                            </div>
                          </div>

                          <ChevronDown
                            className={`h-4 w-4 shrink-0 text-slate-400 transition group-hover:text-slate-700 ${openCampaignPickerFolderId === folder._id ? 'rotate-180' : ''
                              }`}
                          />
                        </button>

                        <Button
                          type="button"
                          size="sm"
                          className="h-10 rounded-xl bg-teal-600 px-4 font-bold text-white shadow-sm hover:bg-teal-700 disabled:bg-slate-300"
                          disabled={isCampaignAssigned || !selectedCampaignId || busy || loadingCampaigns}
                          onClick={() => assignCampaign(folder)}
                        >
                          {assigningCampaignFolderId === folder._id ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Target className="mr-2 h-4 w-4" />
                          )}
                          {isCampaignAssigned ? 'Assigned' : 'Assign Campaign'}
                        </Button>
                      </div>

                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="rounded-xl"
                        disabled={busy}
                        onClick={() => duplicateFolder(folder)}
                      >
                        {duplicatingFolderId === folder._id ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Copy className="mr-2 h-4 w-4" />
                        )}
                        Duplicate Folder
                      </Button>

                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="rounded-xl"
                        disabled={deletingFolderId === folder._id || assigningCampaignFolderId === folder._id}
                        onClick={() => openEditFolderModal(folder)}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </Button>

                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                        disabled={busy}
                        onClick={() => deleteFolder(folder)}
                      >
                        {deletingFolderId === folder._id ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="mr-2 h-4 w-4" />
                        )}
                        Delete
                      </Button>
                    </div>
                  );
                },
              }}
              className="w-full"
              tableClassName="min-w-[2150px]"
              headerRowClassName="bg-slate-50"
              bodyClassName="bg-white"
              rowClassName={() => 'transition hover:bg-slate-50/80'}
            />
          </CardContent>
        </Card>
      </div>

      {openCampaignPickerFolderId && campaignPickerPosition ? (
        <div className="pointer-events-none fixed inset-0 z-[60]">
          <div
            data-campaign-picker-root="true"
            className="pointer-events-auto fixed overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl ring-1 ring-slate-900/5"
            style={{
              top: campaignPickerPosition.top,
              left: campaignPickerPosition.left,
              width: campaignPickerPosition.width,
              maxHeight: campaignPickerPosition.maxHeight,
            }}
          >
            <div className="border-b border-slate-100 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900">Select Campaign</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Pick one campaign to lock this pitch folder to that campaign.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeCampaignPicker}
                  className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  aria-label="Close campaign picker"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="relative mt-3">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={activeCampaignSearch}
                  onChange={(event) => {
                    const value = event.target.value;
                    setCampaignSearchByFolder((prev) => ({
                      ...prev,
                      [activePickerFolderId]: value,
                    }));
                  }}
                  placeholder="Search campaigns or brands..."
                  className="h-10 rounded-2xl border-slate-200 bg-slate-50 pl-10 pr-3 text-sm font-medium focus:bg-white"
                  autoFocus
                />
              </div>
            </div>

            <div
              className="overflow-y-auto overscroll-contain p-2 pr-1"
              style={{ maxHeight: Math.max(180, campaignPickerPosition.maxHeight - 116) }}
            >
              {loadingCampaigns ? (
                <div className="flex items-center justify-center gap-2 rounded-2xl bg-slate-50 px-4 py-8 text-sm font-semibold text-slate-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading campaigns...
                </div>
              ) : filteredCampaigns.length ? (
                <div className="space-y-1.5">
                  {filteredCampaigns.map((campaign) => {
                    const campaignId = getCampaignId(campaign);
                    if (!campaignId) return null;

                    const isSelected =
                      selectedCampaignByFolder[activePickerFolderId] === campaignId;

                    return (
                      <button
                        key={campaignId}
                        type="button"
                        onClick={() => {
                          setSelectedCampaignByFolder((prev) => ({
                            ...prev,
                            [activePickerFolderId]: campaignId,
                          }));
                          closeCampaignPicker();
                        }}
                        className={`w-full rounded-2xl border px-3 py-3 text-left transition ${isSelected
                            ? 'border-teal-600 bg-teal-600 text-white shadow-md'
                            : 'border-slate-100 bg-white text-slate-900 hover:border-slate-200 hover:bg-slate-50 hover:shadow-sm'
                          }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold">
                              {getCampaignName(campaign)}
                            </p>
                            <div
                              className={`mt-1 flex flex-wrap items-center gap-2 text-[11px] font-semibold ${isSelected ? 'text-slate-200' : 'text-slate-500'
                                }`}
                            >
                              {getCampaignBrandName(campaign) ? (
                                <span className="max-w-[180px] truncate">
                                  {getCampaignBrandName(campaign)}
                                </span>
                              ) : null}
                              <span
                                className={`rounded-full px-2 py-0.5 ${isSelected
                                    ? 'bg-white/15 text-white'
                                    : 'bg-emerald-50 text-emerald-700'
                                  }`}
                              >
                                {getCampaignStatusLabel(campaign)}
                              </span>
                            </div>
                          </div>

                          {isSelected ? (
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-teal-700">
                              <Check className="h-3.5 w-3.5" />
                            </span>
                          ) : null}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-2xl bg-slate-50 px-4 py-8 text-center">
                  <p className="text-sm font-bold text-slate-900">No campaign found</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Try another campaign name or brand keyword.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {openCreateModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Create Folder</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Create a new folder and open it immediately after creation.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setOpenCreateModal(false);
                  resetCreateForm();
                }}
                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 px-5 py-5">
              <div className="space-y-2">
                <Label>Folder Name</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !creating) {
                      createFolder();
                    }
                  }}
                  placeholder="Power Station Review"
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Description</Label>
                  <span className="text-xs text-slate-500">{form.description.length}/500</span>
                </div>

                <Textarea
                  rows={4}
                  maxLength={500}
                  value={form.description}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="Optional internal note"
                  className="h-28 resize-none rounded-xl"
                />
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 px-5 py-4">
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => {
                  setOpenCreateModal(false);
                  resetCreateForm();
                }}
                disabled={creating}
              >
                Cancel
              </Button>

              <Button
                className="rounded-xl"
                onClick={createFolder}
                disabled={creating}
              >
                {creating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                Create Folder
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {openEditModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Edit Folder</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Only folder name and description can be updated here.
                </p>
              </div>

              <button
                type="button"
                onClick={closeEditFolderModal}
                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 px-5 py-5">
              <div className="space-y-2">
                <Label>Folder Name</Label>
                <Input
                  value={editForm.title}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, title: e.target.value }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !savingEdit) {
                      saveFolderEdits();
                    }
                  }}
                  placeholder="Rename folder"
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Description</Label>
                  <span className="text-xs text-slate-500">
                    {editForm.description.length}/500
                  </span>
                </div>

                <Textarea
                  rows={4}
                  maxLength={500}
                  value={editForm.description}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="Update description"
                  className="h-28 resize-none rounded-xl"
                />
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
                Note: Editing here changes only the folder name and description.
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 px-5 py-4">
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={closeEditFolderModal}
                disabled={savingEdit}
              >
                Cancel
              </Button>

              <Button
                className="rounded-xl"
                onClick={saveFolderEdits}
                disabled={savingEdit}
              >
                {savingEdit ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Pencil className="mr-2 h-4 w-4" />
                )}
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}